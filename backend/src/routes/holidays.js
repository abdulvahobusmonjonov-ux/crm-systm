import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah, requireRole } from "../lib/http.js";

const router = Router();
const adminOnly = requireRole("SUPER_ADMIN", "ADMIN");

const schema = z.object({ date: z.string().min(1), name: z.string().min(1, "Nom kiriting") });

// GET /api/holidays
router.get("/", ah(async (req, res) => {
  const holidays = await db.holiday.findMany({ orderBy: { date: "asc" } });
  res.json(holidays);
}));

// POST /api/holidays
router.post("/", adminOnly, ah(async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const h = await db.holiday.create({
      data: { date: new Date(parsed.data.date + "T00:00:00.000Z"), name: parsed.data.name.trim() },
    });
    res.status(201).json(h);
  } catch {
    res.status(400).json({ error: "Bu sana allaqachon qo'shilgan" });
  }
}));

// DELETE /api/holidays/:id
router.delete("/:id", adminOnly, ah(async (req, res) => {
  await db.holiday.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

export default router;
