import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah, requireRole } from "../lib/http.js";

const router = Router();

const schema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

// GET /api/settings?prefix=
router.get("/", ah(async (req, res) => {
  const prefix = req.query.prefix || "";

  const settings = await db.setting.findMany(
    prefix ? { where: { key: { startsWith: String(prefix) } } } : undefined
  );
  const map = {};
  for (const s of settings) map[s.key] = s.value;
  res.json(map);
}));

// POST /api/settings
router.post("/", requireRole("SUPER_ADMIN", "ADMIN"), ah(async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { key, value } = parsed.data;
  const setting = await db.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  res.json({ key: setting.key, value: setting.value });
}));

export default router;
