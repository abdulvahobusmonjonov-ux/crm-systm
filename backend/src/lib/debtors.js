import { db } from "./db.js";

function currentMonth() {
  const t = new Date(Date.now() + 5 * 3600 * 1000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
}

// ENROLLED students whose (course price - sum of monthly payments) > 0.
// Shared by /api/debtors and the Payments page "Qarzdorlar" KPI/tab so both
// report the same count for the same month.
export async function getDebtors(month) {
  const resolvedMonth = month || currentMonth();

  const students = await db.lead.findMany({
    where: {
      status: "ENROLLED",
      groupId: { not: null },
      isArchived: false,
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      course: { select: { name: true, price: true, color: true } },
      group: { select: { id: true, name: true } },
    },
    orderBy: { fullName: "asc" },
  });

  const leadIds = students.map((s) => s.id);

  const [monthPayments, lastPayments] = leadIds.length
    ? await Promise.all([
        db.payment.groupBy({
          by: ["leadId"],
          where: { forMonth: resolvedMonth, leadId: { in: leadIds } },
          _sum: { amount: true },
        }),
        db.payment.groupBy({
          by: ["leadId"],
          where: { leadId: { in: leadIds } },
          _max: { paidAt: true },
        }),
      ])
    : [[], []];
  const paidMap = new Map(monthPayments.map((p) => [p.leadId, Number(p._sum.amount ?? 0)]));
  const lastPaymentMap = new Map(lastPayments.map((p) => [p.leadId, p._max.paidAt]));

  const debtors = students
    .map((s) => {
      const required = Number(s.course?.price ?? 0);
      const paid = paidMap.get(s.id) ?? 0;
      const debt = required - paid;
      return {
        id: s.id,
        fullName: s.fullName,
        phone: s.phone,
        group: s.group?.name ?? null,
        course: s.course?.name ?? null,
        courseColor: s.course?.color ?? null,
        required,
        paid,
        debt,
        lastPaymentAt: lastPaymentMap.get(s.id) ?? null,
      };
    })
    .filter((s) => s.debt > 0);

  const totalDebt = debtors.reduce((a, d) => a + d.debt, 0);

  return { month: resolvedMonth, debtors, totalDebt, count: debtors.length };
}
