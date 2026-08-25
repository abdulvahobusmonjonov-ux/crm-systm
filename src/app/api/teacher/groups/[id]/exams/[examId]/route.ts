import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTeacherGroupIds } from "@/lib/teacher";
import { canManageGrades } from "@/lib/permissions";

async function assertOwnsGroup(userId: string, role: string, groupId: string) {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
  const groupIds = await getTeacherGroupIds(userId);
  return groupIds.includes(groupId);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; examId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageGrades(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: groupId, examId } = await params;
  if (!(await assertOwnsGroup(session.user.id, session.user.role, groupId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const exam = await db.exam.findUnique({ where: { id: examId }, select: { groupId: true } });
  if (!exam || exam.groupId !== groupId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.exam.delete({ where: { id: examId } });
  return NextResponse.json({ success: true });
}
