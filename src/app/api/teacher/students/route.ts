import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTeacherGroupIds } from "@/lib/teacher";
import { canSeePayments, canSeeStudentContacts } from "@/lib/permissions";

function currentMonth() {
  const t = new Date(Date.now() + 5 * 3600 * 1000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdminRole = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
  const groupIds = isAdminRole ? null : await getTeacherGroupIds(session.user.id);
  if (groupIds && groupIds.length === 0) return NextResponse.json({ students: [] });

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();

  const students = await db.lead.findMany({
    where: {
      isArchived: false,
      ...(groupIds ? { groupId: { in: groupIds } } : { groupId: { not: null } }),
      ...(search
        ? { OR: [{ fullName: { contains: search, mode: "insensitive" } }, { phone: { contains: search } }] }
        : {}),
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      birthDate: true,
      lastContactedAt: true,
      coins: true,
      group: { select: { id: true, name: true } },
      course: { select: { price: true } },
    },
    orderBy: { fullName: "asc" },
  });

  const leadIds = students.map((s) => s.id);
  const month = currentMonth();
  const monthPayments = leadIds.length
    ? await db.payment.groupBy({ by: ["leadId"], where: { forMonth: month, leadId: { in: leadIds } }, _sum: { amount: true } })
    : [];
  const paidMap = new Map(monthPayments.map((p) => [p.leadId, Number(p._sum.amount ?? 0)]));
  const showPayments = canSeePayments(session.user);
  const showContacts = canSeeStudentContacts(session.user);

  return NextResponse.json({
    students: students.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      phone: showContacts ? s.phone : null,
      birthDate: s.birthDate,
      lastActivityAt: s.lastContactedAt,
      group: s.group,
      coins: s.coins,
      balance: showPayments ? Number(s.course?.price ?? 0) - (paidMap.get(s.id) ?? 0) : null,
    })),
  });
}
