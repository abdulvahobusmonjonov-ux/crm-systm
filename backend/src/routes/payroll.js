import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah, requireRole } from "../lib/http.js";
import { isAdmin, canSeeReports, canManagePayments } from "../lib/permissions.js";
import { currentMonth } from "../lib/dates.js";

const router = Router();

const schema = z.object({
  userId: z.string().min(1, "Xodimni tanlang"),
  amount: z.coerce.number().positive("Summa noto'g'ri"),
  month: z.string().min(7),
  type: z.enum(["salary", "bonus"]).optional(),
  note: z.string().optional().nullable(),
});

// GET /api/payroll?month=YYYY-MM
router.get("/", ah(async (req, res) => {
  if (!isAdmin(req.user) && !canSeeReports(req.user)) return res.status(403).json({ error: "Forbidden" });

  const month = req.query.month || currentMonth();

  const records = await db.salaryRecord.findMany({
    where: { month: String(month) },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, fullName: true, role: true } } },
  });

  const map = {};
  for (const r of records) {
    const id = r.userId;
    map[id] ||= { userId: id, name: r.user?.fullName || "—", role: r.user?.role || "", salary: 0, bonus: 0, total: 0 };
    const amt = Number(r.amount || 0);
    if (r.type === "bonus") map[id].bonus += amt; else map[id].salary += amt;
    map[id].total += amt;
  }
  const byUser = Object.values(map).sort((a, b) => b.total - a.total);
  const total = byUser.reduce((a, u) => a + u.total, 0);

  res.json({ month, records, byUser, total });
}));

// POST /api/payroll
router.post("/", ah(async (req, res) => {
  if (!isAdmin(req.user) && !canManagePayments(req.user)) return res.status(403).json({ error: "Forbidden" });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;

  const record = await db.salaryRecord.create({
    data: {
      userId: d.userId,
      amount: d.amount,
      month: d.month,
      type: d.type || "salary",
      note: d.note || null,
      createdById: req.user.id,
    },
  });
  res.status(201).json(record);
}));

// DELETE /api/payroll/:id
router.delete("/:id", requireRole("SUPER_ADMIN", "ADMIN"), ah(async (req, res) => {
  await db.salaryRecord.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

export default router;
