import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canSeeReports } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const TZ = 5 * 3600 * 1000; // Asia/Tashkent, UTC+5

function currentMonth(): string {
  const t = new Date(Date.now() + TZ);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1) - TZ);
  const end = new Date(Date.UTC(y, m, 1) - TZ);
  return { start, end };
}

const SALARY_TYPE_LABELS: Record<string, string> = { salary: "Oylik maosh", bonus: "Bonuslar" };
const PAYMENT_TYPE_LABELS: Record<string, string> = { tuition: "O'quv to'lovlari" };

type CategoryRow = { type: "revenue" | "expense" | "payroll"; category: string; amount: number };

async function buildReport(month: string) {
  const { start, end } = monthRange(month);

  const [paymentGroups, incomeGroups, expenseGroups, salaryGroups, students] = await Promise.all([
    db.payment.groupBy({ by: ["type"], where: { paidAt: { gte: start, lt: end } }, _sum: { amount: true } }),
    db.income.groupBy({ by: ["source"], where: { receivedAt: { gte: start, lt: end } }, _sum: { amount: true } }),
    db.expense.groupBy({ by: ["category"], where: { spentAt: { gte: start, lt: end } }, _sum: { amount: true } }),
    db.salaryRecord.groupBy({ by: ["type"], where: { paidAt: { gte: start, lt: end } }, _sum: { amount: true } }),
    db.lead.findMany({
      where: { status: "ENROLLED", groupId: { not: null }, isArchived: false },
      select: { id: true, course: { select: { price: true } } },
    }),
  ]);

  const categories: CategoryRow[] = [];

  for (const g of paymentGroups) {
    const amount = Number(g._sum.amount ?? 0);
    if (amount <= 0) continue;
    categories.push({ type: "revenue", category: PAYMENT_TYPE_LABELS[g.type] || g.type, amount });
  }
  for (const g of incomeGroups) {
    const amount = Number(g._sum.amount ?? 0);
    if (amount <= 0) continue;
    categories.push({ type: "revenue", category: g.source, amount });
  }
  for (const g of expenseGroups) {
    const amount = Number(g._sum.amount ?? 0);
    if (amount <= 0) continue;
    categories.push({ type: "expense", category: g.category, amount });
  }
  for (const g of salaryGroups) {
    const amount = Number(g._sum.amount ?? 0);
    if (amount <= 0) continue;
    categories.push({ type: "payroll", category: SALARY_TYPE_LABELS[g.type] || g.type, amount });
  }

  // Qarzdorlik: outstanding tuition debt of enrolled students for this month
  const leadIds = students.map((s) => s.id);
  const monthPayments = leadIds.length
    ? await db.payment.groupBy({ by: ["leadId"], where: { forMonth: month, leadId: { in: leadIds } }, _sum: { amount: true } })
    : [];
  const paidMap = new Map(monthPayments.map((p) => [p.leadId, Number(p._sum.amount ?? 0)]));
  const totalDebt = students.reduce((sum, s) => {
    const required = Number(s.course?.price ?? 0);
    const paid = paidMap.get(s.id) ?? 0;
    return sum + Math.max(required - paid, 0);
  }, 0);

  const totalRevenue = categories.filter((c) => c.type === "revenue").reduce((a, c) => a + c.amount, 0);
  const totalExpense = categories.filter((c) => c.type === "expense").reduce((a, c) => a + c.amount, 0);
  const totalPayroll = categories.filter((c) => c.type === "payroll").reduce((a, c) => a + c.amount, 0);
  const netProfit = totalRevenue - totalExpense - totalPayroll;

  categories.sort((a, b) => b.amount - a.amount);

  return {
    month,
    totals: { totalRevenue, totalExpense, totalPayroll, netProfit, totalDebt },
    categories,
  };
}

function toCSV(report: Awaited<ReturnType<typeof buildReport>>): string {
  const TYPE_LABELS: Record<string, string> = { revenue: "Daromad", expense: "Xarajat", payroll: "Ish haqi" };
  const lines: string[] = [];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

  lines.push(["Moliyaviy hisobot", report.month].map(esc).join(","));
  lines.push("");
  lines.push(["Ko'rsatkich", "Summa (so'm)"].map(esc).join(","));
  lines.push(["Jami tushum", report.totals.totalRevenue].map(esc).join(","));
  lines.push(["Xarajat", report.totals.totalExpense].map(esc).join(","));
  lines.push(["Ish haqi", report.totals.totalPayroll].map(esc).join(","));
  lines.push(["Sof foyda", report.totals.netProfit].map(esc).join(","));
  lines.push(["Qarzdorlik", report.totals.totalDebt].map(esc).join(","));
  lines.push("");
  lines.push(["Turi", "Kategoriya", "Summa (so'm)"].map(esc).join(","));
  for (const c of report.categories) {
    lines.push([TYPE_LABELS[c.type], c.category, c.amount].map(esc).join(","));
  }
  return "﻿" + lines.join("\r\n");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdminRole = ["SUPER_ADMIN", "ADMIN"].includes(session.user.role);
  if (!isAdminRole && !canSeeReports(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || currentMonth();
  const format = searchParams.get("format") || "json";

  const report = await buildReport(month);

  if (format === "csv") {
    return new NextResponse(toCSV(report), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="moliyaviy_hisobot_${month}.csv"`,
      },
    });
  }

  return NextResponse.json(report);
}
