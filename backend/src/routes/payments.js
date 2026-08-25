import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah, requireRole } from "../lib/http.js";
import { logAudit } from "../lib/audit.js";
import { currentMonth } from "../lib/dates.js";

const router = Router();

const createSchema = z.object({
  leadId: z.string().min(1, "O'quvchi tanlang"),
  amount: z.coerce.number().positive("Summa noto'g'ri"),
  discount: z.coerce.number().min(0).optional().nullable(),
  method: z.string().optional(),
  type: z.string().optional(),
  forMonth: z.string().optional().nullable(),
  groupId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  paidAt: z.string().optional().nullable(),
});

// GET /api/payments
router.get("/", ah(async (req, res) => {
  const { leadId, groupId, month, q } = req.query;

  const page = parseInt(req.query.page || "1");
  const limit = parseInt(req.query.limit || "50");
  const skip = (page - 1) * limit;

  const where = {};
  if (leadId) where.leadId = leadId;
  if (groupId) where.groupId = groupId;
  if (month) where.forMonth = month;
  if (q) where.lead = { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] };

  const monthStr = currentMonth();

  const [payments, total, allAgg, monthAgg] = await Promise.all([
    db.payment.findMany({
      where,
      orderBy: { paidAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        amount: true,
        discount: true,
        currency: true,
        method: true,
        type: true,
        forMonth: true,
        note: true,
        paidAt: true,
        lead: { select: { id: true, fullName: true, phone: true } },
        group: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    }),
    db.payment.count({ where }),
    db.payment.aggregate({ _sum: { amount: true }, _count: true, where }),
    db.payment.aggregate({ _sum: { amount: true }, where: { ...where, forMonth: month || monthStr } }),
  ]);

  res.json({
    payments,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    summary: {
      total: Number(allAgg._sum.amount || 0),
      count: allAgg._count,
      monthTotal: Number(monthAgg._sum.amount || 0),
      month: month || monthStr,
    },
  });
}));

// POST /api/payments
router.post("/", ah(async (req, res) => {
  const user = req.user;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;

  const payment = await db.payment.create({
    data: {
      leadId: d.leadId,
      amount: d.amount,
      discount: d.discount ?? null,
      method: d.method || "cash",
      type: d.type || "tuition",
      forMonth: d.forMonth || null,
      groupId: d.groupId || null,
      note: d.note || null,
      paidAt: d.paidAt ? new Date(d.paidAt) : new Date(),
      createdById: user.id,
    },
    include: { lead: { select: { id: true, fullName: true } } },
  });

  await db.activity.create({
    data: { leadId: d.leadId, userId: user.id, action: "payment", details: { amount: d.amount, forMonth: d.forMonth } },
  });
  await logAudit(user.id, user.fullName, "payment_created", "Payment", payment.id, { amount: d.amount });

  res.status(201).json(payment);
}));

// GET /api/payments/:id
router.get("/:id", ah(async (req, res) => {
  const payment = await db.payment.findUnique({
    where: { id: req.params.id },
    include: {
      lead: { select: { fullName: true, phone: true, course: { select: { name: true } } } },
      group: { select: { name: true } },
      createdBy: { select: { fullName: true } },
    },
  });
  if (!payment) return res.status(404).json({ error: "Not found" });
  res.json({ ...payment, courseName: payment.lead?.course?.name || null });
}));

// DELETE /api/payments/:id
router.delete("/:id", requireRole("SUPER_ADMIN", "ADMIN"), ah(async (req, res) => {
  const { id } = req.params;
  await db.payment.delete({ where: { id } });
  await logAudit(req.user.id, req.user.fullName, "payment_deleted", "Payment", id);
  res.json({ success: true });
}));

export default router;
