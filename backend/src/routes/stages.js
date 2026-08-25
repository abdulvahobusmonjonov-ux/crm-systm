import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah, requireRole } from "../lib/http.js";

const router = Router();
const adminOnly = requireRole("SUPER_ADMIN", "ADMIN");

const createSchema = z.object({
  name: z.string().min(1, "Nom kiriting"),
  color: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  order: z.number().int().optional(),
  isWon: z.boolean().optional(),
  isLost: z.boolean().optional(),
});

// GET /api/stages
router.get("/", ah(async (req, res) => {
  const stages = await db.stage.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { leads: true } } },
  });
  res.json(stages);
}));

// POST /api/stages
router.post("/", adminOnly, ah(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const last = await db.stage.findFirst({ orderBy: { order: "desc" } });
  const order = (last?.order ?? 0) + 1;

  const palette = ["#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#f97316", "#ec4899", "#8b5cf6"];
  const color = parsed.data.color || palette[order % palette.length];

  const stage = await db.stage.create({ data: { name: parsed.data.name, color, order } });
  res.status(201).json(stage);
}));

// PATCH /api/stages/:id
router.patch("/:id", adminOnly, ah(async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const stage = await db.stage.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(stage);
}));

// DELETE /api/stages/:id
router.delete("/:id", adminOnly, ah(async (req, res) => {
  const { id } = req.params;

  // Move leads from this stage to the first remaining stage (or null if none left)
  const fallback = await db.stage.findFirst({
    where: { id: { not: id } },
    orderBy: { order: "asc" },
  });
  await db.lead.updateMany({ where: { stageId: id }, data: { stageId: fallback?.id ?? null } });
  await db.stage.delete({ where: { id } });

  res.json({ success: true, movedTo: fallback?.id ?? null });
}));

export default router;
