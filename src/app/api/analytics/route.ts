import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const SOURCE_LABELS: Record<string, string> = {
  INSTAGRAM: "Instagram", TELEGRAM: "Telegram", FACEBOOK: "Facebook", TIKTOK: "TikTok",
  REFERRAL: "Tavsiya", WEBSITE: "Sayt", WALK_IN: "Kelgan", PHONE_CALL: "Qo'ng'iroq", OTHER: "Boshqa",
};

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [leads, payments, students] = await Promise.all([
    db.lead.findMany({ select: { source: true, status: true, assignedToId: true, assignedTo: { select: { fullName: true } } } }),
    db.payment.findMany({ select: { amount: true, forMonth: true, paidAt: true, lead: { select: { source: true, assignedToId: true } } } }),
    // For join/leave tracking — students ever enrolled, with the group/teacher they studied under.
    db.lead.findMany({
      where: { OR: [{ enrolledAt: { not: null } }, { isArchived: true }] },
      select: {
        status: true, isArchived: true, enrolledAt: true, updatedAt: true,
        group: { select: { id: true, name: true, teacherId: true, teacher: { select: { fullName: true } } } },
      },
    }),
  ]);

  // By source
  const srcMap: Record<string, { count: number; enrolled: number; revenue: number }> = {};
  for (const l of leads) {
    const s = l.source || "OTHER";
    srcMap[s] ||= { count: 0, enrolled: 0, revenue: 0 };
    srcMap[s].count++;
    if (l.status === "ENROLLED") srcMap[s].enrolled++;
  }
  for (const p of payments) {
    const s = p.lead?.source || "OTHER";
    srcMap[s] ||= { count: 0, enrolled: 0, revenue: 0 };
    srcMap[s].revenue += Number(p.amount || 0);
  }
  const bySource = Object.entries(srcMap).map(([k, v]) => ({
    source: SOURCE_LABELS[k] || k, ...v,
    conversion: v.count ? Math.round((v.enrolled / v.count) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  // By manager
  const mgrMap: Record<string, { name: string; total: number; enrolled: number; revenue: number }> = {};
  for (const l of leads) {
    const id = l.assignedToId || "none";
    mgrMap[id] ||= { name: l.assignedTo?.fullName || "Biriktirilmagan", total: 0, enrolled: 0, revenue: 0 };
    mgrMap[id].total++;
    if (l.status === "ENROLLED") mgrMap[id].enrolled++;
  }
  for (const p of payments) {
    const id = p.lead?.assignedToId || "none";
    if (mgrMap[id]) mgrMap[id].revenue += Number(p.amount || 0);
  }
  const byManager = Object.values(mgrMap).map((m) => ({
    ...m, conversion: m.total ? Math.round((m.enrolled / m.total) * 100) : 0,
  })).sort((a, b) => b.revenue - a.revenue);

  // Monthly revenue (last 6 months)
  const now = new Date(Date.now() + 5 * 3600 * 1000);
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const monthRev: Record<string, number> = {};
  months.forEach((m) => (monthRev[m] = 0));
  for (const p of payments) {
    const key = p.forMonth || `${new Date(p.paidAt).getUTCFullYear()}-${String(new Date(p.paidAt).getUTCMonth() + 1).padStart(2, "0")}`;
    if (key in monthRev) monthRev[key] += Number(p.amount || 0);
  }
  const monthly = months.map((m) => ({ month: m, revenue: monthRev[m] }));

  // Forecast: simple avg of last 3 months
  const last3 = monthly.slice(-3).map((m) => m.revenue);
  const forecast = Math.round(last3.reduce((a, b) => a + b, 0) / (last3.length || 1));

  const totals = {
    leads: leads.length,
    enrolled: leads.filter((l) => l.status === "ENROLLED").length,
    revenue: payments.reduce((a, p) => a + Number(p.amount || 0), 0),
  };

  // Join/leave per month (last 6 months) — "joined" = enrolledAt falls in that month;
  // "left" = archived (dropped out) and last touched (updatedAt) in that month. There's no
  // dedicated "leftAt" column, so isArchived+updatedAt is the closest available signal.
  const ym = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const monthlyJoinLeave = months.map((m) => ({
    month: m,
    joined: students.filter((s) => s.enrolledAt && ym(new Date(s.enrolledAt)) === m).length,
    left: students.filter((s) => s.isArchived && ym(new Date(s.updatedAt)) === m).length,
  }));

  // By teacher — who currently has how many enrolled students, and how many of their
  // past students left, so it's clear which teacher's students are dropping out.
  const teacherMap: Record<string, { teacherId: string; teacherName: string; currentStudents: number; leftStudents: number }> = {};
  for (const s of students) {
    const g = s.group;
    if (!g?.teacherId) continue;
    teacherMap[g.teacherId] ||= { teacherId: g.teacherId, teacherName: g.teacher?.fullName || "Noma'lum", currentStudents: 0, leftStudents: 0 };
    if (s.status === "ENROLLED" && !s.isArchived) teacherMap[g.teacherId].currentStudents++;
    if (s.isArchived) teacherMap[g.teacherId].leftStudents++;
  }
  const byTeacherRetention = Object.values(teacherMap).sort((a, b) => b.leftStudents - a.leftStudents);

  return NextResponse.json({ bySource, byManager, monthly, forecast, totals, monthlyJoinLeave, byTeacherRetention });
}
