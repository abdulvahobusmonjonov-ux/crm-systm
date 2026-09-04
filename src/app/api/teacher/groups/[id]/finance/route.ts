import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTeacherGroupIds } from "@/lib/teacher";

async function assertOwnsGroup(userId: string, role: string, groupId: string) {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
  const groupIds = await getTeacherGroupIds(userId);
  return groupIds.includes(groupId);
}

// GET -> { monthlyPrice, students: [{ leadId, fullName, totalPaid, paymentCount, lastPaymentAt }] }
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: groupId } = await params;
  if (!(await assertOwnsGroup(session.user.id, session.user.role, groupId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const group = await db.group.findUnique({
    where: { id: groupId },
    select: {
      course: { select: { price: true } },
      leads: { where: { isArchived: false }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } },
    },
  });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const leadIds = group.leads.map((l) => l.id);
  const [sums, lastPayments] = leadIds.length
    ? await Promise.all([
        db.payment.groupBy({ by: ["leadId"], where: { leadId: { in: leadIds } }, _sum: { amount: true }, _count: true }),
        db.payment.groupBy({ by: ["leadId"], where: { leadId: { in: leadIds } }, _max: { paidAt: true } }),
      ])
    : [[], []];
  const sumMap = new Map(sums.map((s) => [s.leadId, { total: Number(s._sum.amount ?? 0), count: s._count }]));
  const lastMap = new Map(lastPayments.map((p) => [p.leadId, p._max.paidAt]));

  const students = group.leads.map((l) => ({
    leadId: l.id,
    fullName: l.fullName,
    totalPaid: sumMap.get(l.id)?.total ?? 0,
    paymentCount: sumMap.get(l.id)?.count ?? 0,
    lastPaymentAt: lastMap.get(l.id) ?? null,
  }));

  return NextResponse.json({ monthlyPrice: group.course?.price ? Number(group.course.price) : 0, students });
}
