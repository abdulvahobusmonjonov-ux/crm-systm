import { Router } from "express";
import { db } from "../lib/db.js";
import { ah, requireRole } from "../lib/http.js";
import { TZ, monthKey } from "../lib/dates.js";

const router = Router();

// GET /api/cashflow — last 6 months of income vs outflow
router.get("/", requireRole("SUPER_ADMIN", "ADMIN"), ah(async (req, res) => {
  const now = new Date(Date.now() + TZ);
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1) - TZ);

  const [payments, incomes, expenses, salaries] = await Promise.all([
    db.payment.findMany({ where: { paidAt: { gte: since } }, select: { amount: true, paidAt: true } }),
    db.income.findMany({ where: { receivedAt: { gte: since } }, select: { amount: true, receivedAt: true } }),
    db.expense.findMany({ where: { spentAt: { gte: since } }, select: { amount: true, spentAt: true } }),
    db.salaryRecord.findMany({ where: { paidAt: { gte: since } }, select: { amount: true, paidAt: true } }),
  ]);

  const m = {};
  months.forEach((k) => (m[k] = { income: 0, outflow: 0 }));
  for (const p of payments) { const k = monthKey(p.paidAt); if (m[k]) m[k].income += Number(p.amount || 0); }
  for (const i of incomes) { const k = monthKey(i.receivedAt); if (m[k]) m[k].income += Number(i.amount || 0); }
  for (const e of expenses) { const k = monthKey(e.spentAt); if (m[k]) m[k].outflow += Number(e.amount || 0); }
  for (const s of salaries) { const k = monthKey(s.paidAt); if (m[k]) m[k].outflow += Number(s.amount || 0); }

  const series = months.map((k) => ({ month: k, income: m[k].income, outflow: m[k].outflow, profit: m[k].income - m[k].outflow }));
  const totals = series.reduce(
    (a, x) => ({ income: a.income + x.income, outflow: a.outflow + x.outflow, profit: a.profit + x.profit }),
    { income: 0, outflow: 0, profit: 0 }
  );

  res.json({ months: series, totals });
}));

export default router;
