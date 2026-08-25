import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTeacherGroupIds } from "@/lib/teacher";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdminRole = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
  const groupIds = isAdminRole ? null : await getTeacherGroupIds(session.user.id);
  if (groupIds && groupIds.length === 0) return NextResponse.json({ exercises: [] });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // "unchecked" | "checked" | null (all)
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = (searchParams.get("search") || "").trim();

  const submissionWhere: Prisma.HomeworkSubmissionWhereInput = {
    ...(status === "unchecked" || status === "checked" ? { status } : {}),
    ...(from || to
      ? { submittedAt: { ...(from ? { gte: new Date(from + "T00:00:00.000Z") } : {}), ...(to ? { lte: new Date(to + "T23:59:59.999Z") } : {}) } }
      : {}),
    ...(search ? { lead: { fullName: { contains: search, mode: "insensitive" } } } : {}),
  };

  const exercises = await db.exercise.findMany({
    where: {
      ...(groupIds ? { groupId: { in: groupIds } } : {}),
      submissions: { some: submissionWhere },
    },
    orderBy: { date: "desc" },
    select: {
      id: true,
      title: true,
      date: true,
      group: { select: { id: true, name: true } },
      submissions: {
        where: submissionWhere,
        orderBy: { submittedAt: "desc" },
        select: {
          id: true,
          status: true,
          grade: true,
          content: true,
          teacherNote: true,
          submittedAt: true,
          checkedAt: true,
          lead: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  return NextResponse.json({ exercises });
}
