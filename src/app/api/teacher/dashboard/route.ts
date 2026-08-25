import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groups = await db.group.findMany({
    where: { teacherId: session.user.id, isArchived: false },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      room: true,
      days: true,
      course: { select: { id: true, name: true, color: true } },
      _count: { select: { leads: true } },
    },
  });

  return NextResponse.json({ groups });
}
