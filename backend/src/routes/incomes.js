import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah, requireRole } from "../lib/http.js";
import { monthRange, currentMonth } from "../lib/dates.js";

const router = Router();
const adminOnly = requireRole("SUPER_ADMIN", "ADMIN");

const schema = z.object({
  amount: z.coerce.number().positive("Summa noto'g'ri"),
  source: z.string().min(1, "Manba kiriting"),
  note: z.string().optional().nullable(),
  receivedAt: z.string().optional().nullable(),
});

// GET /api/incomes?month=YYYY-MM
router.get("/", adminOnly, ah(async (req, res) => {
  const month = req.query.month || currentMonth();
  const { start, end } = monthRange(String(month));

  const incomes = await db.income.findMany({
    where: { receivedAt: { gte: start, lt: end } },
    orderBy: { receivedAt: "desc" },
    include: { createdBy: { select: { fullName: true } } },
  });
  const total = incomes.reduce((a, e) => a + Number(e.amount || 0), 0);

  res.json({ incomes, summary: { month, total, count: incomes.length } });
}));

// POST /api/incomes
router.post("/", adminOnly, ah(async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;

  const income = await db.income.create({
    data: {
      amount: d.amount,
      source: d.source.trim(),
      note: d.note || null,
      receivedAt: d.receivedAt ? new Date(d.receivedAt) : new Date(),
      createdById: req.user.id,
    },
  });
  res.status(201).json(income);
}));

// DELETE /api/incomes/:id
router.delete("/:id", adminOnly, ah(async (req, res) => {
  await db.income.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

export default router;
