import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { getTeacherGroupIds } from "@/lib/teacher";
import { canManageGrades } from "@/lib/permissions";

async function assertOwnsGroup(userId: string, role: string, groupId: string) {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
  const groupIds = await getTeacherGroupIds(userId);
  return groupIds.includes(groupId);
}

// GET ?month=YYYY-MM -> exercises in that month + per-student scores
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

  const [students, exercises] = await Promise.all([
    db.lead.findMany({ where: { groupId, isArchived: false }, select: { id: true, fullName: true, phone: true }, orderBy: { fullName: "asc" } }),
    db.exercise.findMany({
      where: { groupId, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
      select: {
        id: true,
        title: true,
        date: true,
        scores: { select: { leadId: true, score: true } },
      },
    }),
  ]);

  return NextResponse.json({
    month,
    students: students.map((s) => ({ leadId: s.id, fullName: s.fullName, phone: s.phone })),
    exercises: exercises.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date.toISOString().slice(0, 10),
      scores: Object.fromEntries(e.scores.map((s) => [s.leadId, s.score])),
    })),
  });
}

const createSchema = z.object({
  date: z.string().min(1),
  title: z.string().min(1),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageGrades(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: groupId } = await params;
  if (!(await assertOwnsGroup(session.user.id, session.user.role, groupId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const exercise = await db.exercise.create({
    data: {
      groupId,
      date: new Date(parsed.data.date + "T00:00:00.000Z"),
      title: parsed.data.title,
      createdById: session.user.id,
    },
  });
  return NextResponse.json(exercise, { status: 201 });
}
