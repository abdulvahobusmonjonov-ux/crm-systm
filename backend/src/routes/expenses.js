import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah, requireRole } from "../lib/http.js";
import { canManageExpenses, isAdmin } from "../lib/permissions.js";
import { monthRange, currentMonth } from "../lib/dates.js";

const router = Router();

const schema = z.object({
  amount: z.coerce.number().positive("Summa noto'g'ri"),
  category: z.string().min(1, "Kategoriya kiriting"),
  note: z.string().optional().nullable(),
  spentAt: z.string().optional().nullable(),
});

function canAccess(u) { return isAdmin(u) || canManageExpenses(u); }

// GET /api/expenses?month=YYYY-MM
router.get("/", ah(async (req, res) => {
  if (!canAccess(req.user)) return res.status(403).json({ error: "Forbidden" });

  const month = req.query.month || currentMonth();
  const { start, end } = monthRange(String(month));

  const expenses = await db.expense.findMany({
    where: { spentAt: { gte: start, lt: end } },
    orderBy: { spentAt: "desc" },
    include: { createdBy: { select: { fullName: true } } },
  });
  const total = expenses.reduce((a, e) => a + Number(e.amount || 0), 0);

  res.json({ expenses, summary: { month, total, count: expenses.length } });
}));

// POST /api/expenses
router.post("/", ah(async (req, res) => {
  if (!canAccess(req.user)) return res.status(403).json({ error: "Forbidden" });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;

  const expense = await db.expense.create({
    data: {
      amount: d.amount,
      category: d.category.trim(),
      note: d.note || null,
      spentAt: d.spentAt ? new Date(d.spentAt) : new Date(),
      createdById: req.user.id,
    },
  });
  res.status(201).json(expense);
}));

// DELETE /api/expenses/:id
router.delete("/:id", requireRole("SUPER_ADMIN", "ADMIN"), ah(async (req, res) => {
  await db.expense.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

export default router;
