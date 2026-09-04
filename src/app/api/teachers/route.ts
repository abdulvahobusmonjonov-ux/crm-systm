import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await db.user.findMany({
    where: { isActive: true },
    select: {
      id: true, fullName: true, username: true, role: true, salary: true, subject: true,
      phone: true, rating: true,
      groupsTeaching: { select: { id: true, name: true, _count: { select: { leads: true } } } },
    },
    orderBy: { fullName: "asc" },
  });

  const teachers = users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    username: u.username,
    role: u.role,
    subject: u.subject || "",
    salary: u.salary ? Number(u.salary) : 0,
    phone: u.phone || undefined,
    rating: u.rating,
    groupsCount: u.groupsTeaching.length,
    studentsCount: u.groupsTeaching.reduce((a, g) => a + g._count.leads, 0),
    groups: u.groupsTeaching.map((g) => g.name),
  }));

  return NextResponse.json(teachers);
}
