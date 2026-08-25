import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { getTeacherGroupIds } from "@/lib/teacher";

const updateSchema = z.object({
  status: z.enum(["unchecked", "checked"]).optional(),
  grade: z.number().min(0).max(100).optional().nullable(),
  teacherNote: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ submissionId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { submissionId } = await params;

  const submission = await db.homeworkSubmission.findUnique({
    where: { id: submissionId },
    select: { exercise: { select: { groupId: true } } },
  });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdminRole = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
  if (!isAdminRole) {
    const groupIds = await getTeacherGroupIds(session.user.id);
    if (!groupIds.includes(submission.exercise.groupId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;
  const updated = await db.homeworkSubmission.update({
    where: { id: submissionId },
    data: {
      ...(d.status !== undefined ? { status: d.status, checkedAt: d.status === "checked" ? new Date() : null } : {}),
      ...(d.grade !== undefined ? { grade: d.grade } : {}),
      ...(d.teacherNote !== undefined ? { teacherNote: d.teacherNote } : {}),
    },
  });

  return NextResponse.json(updated);
}
