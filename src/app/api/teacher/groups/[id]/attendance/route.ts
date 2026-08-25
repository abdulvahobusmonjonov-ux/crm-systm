import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { getTeacherGroupIds } from "@/lib/teacher";
import { canManageAttendance } from "@/lib/permissions";

async function assertOwnsGroup(userId: string, role: string, groupId: string) {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
  const groupIds = await getTeacherGroupIds(userId);
  return groupIds.includes(groupId);
}

function toDate(s: string) {
  return new Date(s + "T00:00:00.000Z");
}

// GET ?month=YYYY-MM -> { students, journal: { [date]: { [leadId]: status } } }
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: groupId } = await params;
  if (!(await assertOwnsGroup(session.user.id, session.user.role, groupId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  if (!month) return NextResponse.json({ error: "month kerak" }, { status: 400 });

  const [yr, mn] = month.split("-").map(Number);
  const from = new Date(`${month}-01T00:00:00.000Z`);
  const to = new Date(Date.UTC(yr, mn, 0, 23, 59, 59, 999));

  const [students, records] = await Promise.all([
    db.lead.findMany({ where: { groupId, isArchived: false }, select: { id: true, fullName: true, phone: true }, orderBy: { fullName: "asc" } }),
    db.attendance.findMany({ where: { groupId, date: { gte: from, lte: to } } }),
  ]);

  const journal: Record<string, Record<string, string>> = {};
  for (const r of records) {
    const key = r.date.toISOString().slice(0, 10);
    if (!journal[key]) journal[key] = {};
    journal[key][r.leadId] = r.status;
  }

  return NextResponse.json({
    month,
    students: students.map((s) => ({ leadId: s.id, fullName: s.fullName, phone: s.phone })),
    journal,
  });
}

const saveSchema = z.object({
  date: z.string().min(1),
  records: z.array(z.object({ leadId: z.string(), status: z.string() })),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageAttendance(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: groupId } = await params;
  if (!(await assertOwnsGroup(session.user.id, session.user.role, groupId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { date, records } = parsed.data;
  const d = toDate(date);

  for (const r of records) {
    await db.attendance.upsert({
      where: { groupId_leadId_date: { groupId, leadId: r.leadId, date: d } },
      update: { status: r.status },
      create: { groupId, leadId: r.leadId, date: d, status: r.status, createdById: session.user.id },
    });
  }

  return NextResponse.json({ success: true, saved: records.length });
}
