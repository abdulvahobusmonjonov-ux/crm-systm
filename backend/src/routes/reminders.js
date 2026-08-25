import { Router } from "express";
import { z } from "zod";
import { startOfDay, endOfDay, addDays } from "date-fns";
import { db } from "../lib/db.js";
import { ah } from "../lib/http.js";

const router = Router();

const createSchema = z.object({
  leadId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  remindAt: z.string(),
  notifyBrowser: z.boolean().default(true),
  notifyTelegram: z.boolean().default(false),
  notifyEmail: z.boolean().default(false),
});

// GET /api/reminders
router.get("/", ah(async (req, res) => {
  const user = req.user;
  const status = req.query.status || "";
  const limit = parseInt(req.query.limit || "50");

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekEnd = endOfDay(addDays(now, 7));

  const where = { userId: user.id };
  if (status) where.status = status;

  const [reminders, totalToday] = await Promise.all([
    db.reminder.findMany({
      where,
      orderBy: { remindAt: "asc" },
      take: limit,
      include: {
        lead: { select: { id: true, fullName: true, phone: true } },
        user: { select: { fullName: true } },
      },
    }),
    // Counts for bell badge
    db.reminder.count({
      where: { userId: user.id, status: "PENDING", remindAt: { gte: todayStart, lte: todayEnd } },
    }),
  ]);

  const overdue = reminders.filter(r => r.status === "PENDING" && new Date(r.remindAt) < todayStart);
  const today = reminders.filter(r => r.status === "PENDING" && new Date(r.remindAt) >= todayStart && new Date(r.remindAt) <= todayEnd);
  const upcoming = reminders.filter(r => r.status === "PENDING" && new Date(r.remindAt) > todayEnd && new Date(r.remindAt) <= weekEnd);
  const done = reminders.filter(r => r.status === "DONE" || r.status === "CANCELLED" || r.status === "MISSED");

  res.json({ reminders, overdue, today, upcoming, done, totalToday });
}));

// POST /api/reminders
router.post("/", ah(async (req, res) => {
  const user = req.user;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const reminder = await db.reminder.create({
    data: { ...parsed.data, remindAt: new Date(parsed.data.remindAt), userId: user.id },
  });

  await db.activity.create({
    data: { leadId: parsed.data.leadId, userId: user.id, action: "reminder_created" },
  });

  res.status(201).json(reminder);
}));

// PATCH /api/reminders/:id
router.patch("/:id", ah(async (req, res) => {
  const body = req.body;

  const data = {};
  if (body.status) data.status = body.status;
  if (body.status === "DONE") data.completedAt = new Date();
  if (body.remindAt) data.remindAt = new Date(body.remindAt);
  if (body.title) data.title = body.title;

  const reminder = await db.reminder.update({ where: { id: req.params.id }, data });
  res.json(reminder);
}));

export default router;
