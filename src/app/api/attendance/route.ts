import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";

export const dynamic = "force-dynamic";

function toDate(s: string) {
  return new Date(s + "T00:00:00.000Z");
}

// GET ?groupId=&month=YYYY-MM  -> monthly journal: { students, journal: { [date]: { [leadId]: status } } }
// GET ?groupId=&date=YYYY-MM-DD -> students + their status for that single date
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");
  if (!groupId) return NextResponse.json({ error: "groupId kerak" }, { status: 400 });

  const month = searchParams.get("month");
  if (month) {
    const [yr, mn] = month.split("-").map(Number);
    const from = new Date(`${month}-01T00:00:00.000Z`);
    const to = new Date(Date.UTC(yr, mn, 0, 23, 59, 59, 999));
    const [students, records] = await Promise.all([
      db.lead.findMany({ where: { groupId }, select: { id: true, fullName: true, phone: true }, orderBy: { fullName: "asc" } }),
      db.attendance.findMany({ where: { groupId, date: { gte: from, lte: to } } }),
    ]);
    const journal: Record<string, Record<string, string>> = {};
    for (const r of records) {
      const key = r.date.toISOString().slice(0, 10);
      if (!journal[key]) journal[key] = {};
      journal[key][r.leadId] = r.status;
    }
    // Same student shape as the single-date branch below — the client keys
    // rows and journal lookups off `leadId`, not `id`.
    return NextResponse.json({
      month,
      students: students.map((s) => ({ leadId: s.id, fullName: s.fullName, phone: s.phone, status: null })),
      journal,
    });
  }

  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date yoki month kerak" }, { status: 400 });

  const [students, att] = await Promise.all([
    db.lead.findMany({ where: { groupId }, select: { id: true, fullName: true, phone: true }, orderBy: { fullName: "asc" } }),
    db.attendance.findMany({ where: { groupId, date: toDate(date) } }),
  ]);
  const map: Record<string, string> = {};
  att.forEach((a) => (map[a.leadId] = a.status));

  return NextResponse.json({
    date,
    students: students.map((s) => ({ leadId: s.id, fullName: s.fullName, phone: s.phone, status: map[s.id] || null })),
  });
}

const saveSchema = z.object({
  groupId: z.string().min(1),
  date: z.string().min(1),
  records: z.array(z.object({ leadId: z.string(), status: z.string(), note: z.string().optional().nullable() })),
});

// POST bulk save attendance for a group+date
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user;
  const isAdminRole = ["SUPER_ADMIN", "ADMIN"].includes(user.role);
  const canMark = isAdminRole || user.canManageAttendance || await hasPermission(user, "attendance", "mark");
  if (!canMark) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { groupId, date, records } = parsed.data;
  const d = toDate(date);

  for (const r of records) {
    await db.attendance.upsert({
      where: { groupId_leadId_date: { groupId, leadId: r.leadId, date: d } },
      update: { status: r.status, note: r.note || null },
      create: { groupId, leadId: r.leadId, date: d, status: r.status, note: r.note || null, createdById: user.id },
    });
  }

  return NextResponse.json({ success: true, saved: records.length });
}
