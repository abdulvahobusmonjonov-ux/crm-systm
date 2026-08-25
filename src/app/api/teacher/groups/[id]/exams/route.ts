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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: groupId } = await params;
  if (!(await assertOwnsGroup(session.user.id, session.user.role, groupId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const exams = await db.exam.findMany({
    where: { groupId },
    orderBy: { date: "desc" },
    select: { id: true, title: true, date: true, maxScore: true, passingScore: true, section: true },
  });

  return NextResponse.json({ exams });
}

const createSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  maxScore: z.number().min(1).max(1000).optional(),
  passingScore: z.number().min(0).max(1000).optional().nullable(),
  section: z.string().optional().nullable(),
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

  const d = parsed.data;
  const exam = await db.exam.create({
    data: {
      groupId,
      title: d.title,
      date: new Date(d.date + "T00:00:00.000Z"),
      maxScore: d.maxScore ?? 100,
      passingScore: d.passingScore ?? null,
      section: d.section || null,
      createdById: session.user.id,
    },
  });
  return NextResponse.json(exam, { status: 201 });
}
