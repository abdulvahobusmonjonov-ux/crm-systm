import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah, requireRole } from "../lib/http.js";

const router = Router();
const adminOnly = requireRole("SUPER_ADMIN", "ADMIN");

const schema = z.object({ name: z.string().min(1, "Nom kiriting") });

// GET /api/payment-types
router.get("/", ah(async (req, res) => {
  const types = await db.paymentType.findMany({ orderBy: { createdAt: "asc" } });
  res.json(types);
}));

// POST /api/payment-types
router.post("/", adminOnly, ah(async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const t = await db.paymentType.create({ data: { name: parsed.data.name.trim() } });
  res.status(201).json(t);
}));

// PATCH /api/payment-types/:id
router.patch("/:id", adminOnly, ah(async (req, res) => {
  const t = await db.paymentType.update({ where: { id: req.params.id }, data: { isActive: req.body.isActive } });
  res.json(t);
}));

// DELETE /api/payment-types/:id
router.delete("/:id", adminOnly, ah(async (req, res) => {
  await db.paymentType.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

export default router;
