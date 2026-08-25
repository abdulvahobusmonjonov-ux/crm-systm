import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTeacherGroupIds } from "@/lib/teacher";
import { canSeeStudentContacts } from "@/lib/permissions";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const lead = await db.lead.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      phone: true,
      status: true,
      coins: true,
      birthDate: true,
      groupId: true,
      course: { select: { id: true, name: true, color: true } },
      group: { select: { id: true, name: true, days: true, timeFrom: true, timeTo: true } },
      attendances: { select: { status: true } },
      scores: { orderBy: { createdAt: "desc" }, take: 50, select: { id: true, score: true, createdAt: true, exam: { select: { title: true, maxScore: true } } } },
    },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdminRole = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
  if (!isAdminRole) {
    const groupIds = await getTeacherGroupIds(session.user.id);
    if (!lead.groupId || !groupIds.includes(lead.groupId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({
    ...lead,
    phone: canSeeStudentContacts(session.user) ? lead.phone : null,
  });
}
