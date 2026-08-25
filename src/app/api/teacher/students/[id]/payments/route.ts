import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTeacherGroupIds } from "@/lib/teacher";
import { canSeePayments } from "@/lib/permissions";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canSeePayments(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const lead = await db.lead.findUnique({ where: { id }, select: { groupId: true } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdminRole = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
  if (!isAdminRole) {
    const groupIds = await getTeacherGroupIds(session.user.id);
    if (!lead.groupId || !groupIds.includes(lead.groupId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const payments = await db.payment.findMany({
    where: { leadId: id },
    orderBy: { paidAt: "desc" },
    take: 200,
    select: { id: true, amount: true, paidAt: true, forMonth: true, method: true },
  });

  return NextResponse.json({ payments });
}
