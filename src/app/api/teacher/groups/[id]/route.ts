import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTeacherGroupIds } from "@/lib/teacher";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const isAdminRole = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
  if (!isAdminRole) {
    const groupIds = await getTeacherGroupIds(session.user.id);
    if (!groupIds.includes(id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const group = await db.group.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      room: true,
      days: true,
      timeFrom: true,
      timeTo: true,
      course: { select: { id: true, name: true, color: true, price: true } },
      teacher: { select: { id: true, fullName: true, phone: true } },
      leads: {
        where: { isArchived: false },
        select: { id: true, fullName: true, phone: true, coins: true },
        orderBy: { fullName: "asc" },
      },
    },
  });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lessonDates = await db.attendance.findMany({
    where: { groupId: id },
    select: { date: true },
    distinct: ["date"],
  });

  return NextResponse.json({ ...group, lessonsHeld: lessonDates.length });
}
