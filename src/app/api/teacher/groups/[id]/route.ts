import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTeacherGroupIds } from "@/lib/teacher";

function currentMonth() {
  const t = new Date(Date.now() + 5 * 3600 * 1000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
}

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
      startDate: true,
      notes: true,
      course: { select: { id: true, name: true, color: true, price: true, durationMonths: true } },
      teacher: { select: { id: true, fullName: true, phone: true } },
      leads: {
        where: { isArchived: false },
        select: {
          id: true, fullName: true, phone: true, coins: true, status: true, frozenAt: true, discountPercent: true,
        },
        orderBy: { fullName: "asc" },
      },
    },
  });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [lessonDates, monthPayments] = await Promise.all([
    db.attendance.findMany({ where: { groupId: id }, select: { date: true }, distinct: ["date"] }),
    db.payment.groupBy({ by: ["leadId"], where: { groupId: id, forMonth: currentMonth() }, _sum: { amount: true } }),
  ]);
  const paidMap = new Map(monthPayments.map((p) => [p.leadId, Number(p._sum.amount ?? 0)]));
  const price = group.course?.price ? Number(group.course.price) : 0;

  const leads = group.leads.map((l) => {
    const paid = paidMap.get(l.id) ?? 0;
    const owesThisMonth = price > 0 && paid < price * (1 - l.discountPercent / 100);
    let statusTag: "trial" | "frozen" | "debtor" | "active" = "active";
    if (l.frozenAt) statusTag = "frozen";
    else if (l.status === "TRIAL_BOOKED" || l.status === "TRIAL_COMPLETED") statusTag = "trial";
    else if (owesThisMonth) statusTag = "debtor";
    return { ...l, statusTag };
  });

  const endDate =
    group.startDate && group.course?.durationMonths
      ? new Date(new Date(group.startDate).setMonth(new Date(group.startDate).getMonth() + group.course.durationMonths))
      : null;

  return NextResponse.json({ ...group, leads, endDate, lessonsHeld: lessonDates.length });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const isAdminRole = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
  if (!isAdminRole) {
    const groupIds = await getTeacherGroupIds(session.user.id);
    if (!groupIds.includes(id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (typeof body.notes !== "string") return NextResponse.json({ error: "notes kerak" }, { status: 400 });

  await db.group.update({ where: { id }, data: { notes: body.notes } });
  return NextResponse.json({ success: true });
}
