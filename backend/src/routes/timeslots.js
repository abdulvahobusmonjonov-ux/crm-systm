import { Router } from "express";
import { db } from "../lib/db.js";
import { ah } from "../lib/http.js";

const router = Router();

// GET /api/timeslots
router.get("/", ah(async (req, res) => {
  const slots = await db.timeSlot.findMany({ orderBy: { startTime: "asc" } });
  res.json(slots);
}));

// POST /api/timeslots
router.post("/", ah(async (req, res) => {
  if (!["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { startTime, endTime, label } = req.body;
  if (!startTime || !endTime || !label) return res.status(400).json({ error: "Ma'lumot to'liq emas" });

  const slot = await db.timeSlot.create({ data: { startTime, endTime, label } });
  res.status(201).json(slot);
}));

// PATCH /api/timeslots/:id
router.patch("/:id", ah(async (req, res) => {
  const slot = await db.timeSlot.update({ where: { id: req.params.id }, data: req.body });
  res.json(slot);
}));

// DELETE /api/timeslots/:id
router.delete("/:id", ah(async (req, res) => {
  await db.timeSlot.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

export default router;
