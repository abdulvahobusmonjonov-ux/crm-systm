import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const groups = await db.group.findMany({
    where: { teacherId: { not: null }, isArchived: false },
    select: { id: true, teacherId: true, teacher: { select: { fullName: true } }, _count: { select: { leads: true } } },
  });
  const groupIds = groups.map((g) => g.id);

  const [att, pays] = await Promise.all([
    groupIds.length ? db.attendance.findMany({ where: { groupId: { in: groupIds } }, select: { groupId: true, status: true } }) : Promise.resolve([]),
    groupIds.length ? db.payment.findMany({ where: { groupId: { in: groupIds } }, select: { groupId: true, amount: true } }) : Promise.resolve([]),
  ]);

  const g2t: Record<string, string> = {};
  groups.forEach((g) => (g2t[g.id] = g.teacherId!));

  const map: Record<string, { name: string; groups: number; students: number; present: number; total: number; revenue: number }> = {};
  for (const g of groups) {
    const t = g.teacherId!;
    map[t] ||= { name: g.teacher?.fullName || "—", groups: 0, students: 0, present: 0, total: 0, revenue: 0 };
    map[t].groups++;
    map[t].students += g._count.leads;
  }
  for (const a of att) { if (!a.groupId) continue; const t = g2t[a.groupId]; if (map[t]) { map[t].total++; if (a.status === "present") map[t].present++; } }
  for (const p of pays) { if (!p.groupId) continue; const t = g2t[p.groupId]; if (map[t]) map[t].revenue += Number(p.amount || 0); }

  const teachers = Object.values(map).map((m) => ({
    ...m,
    attendance: m.total ? Math.round((m.present / m.total) * 100) : 0,
  })).sort((a, b) => b.revenue - a.revenue);

  return NextResponse.json(teachers);
}
