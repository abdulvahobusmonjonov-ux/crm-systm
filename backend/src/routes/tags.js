import { Router } from "express";
import { db } from "../lib/db.js";
import { ah } from "../lib/http.js";

const router = Router();

// GET /api/tags
router.get("/", ah(async (req, res) => {
  const tags = await db.tag.findMany({ orderBy: { name: "asc" } });
  res.json(tags);
}));

// POST /api/tags
router.post("/", ah(async (req, res) => {
  if (!["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) {
    return res.status(403).json({ error: "Ruxsatingiz yo'q" });
  }
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });
  try {
    const tag = await db.tag.create({ data: { name: name.trim(), color: color || "#3B82F6" } });
    res.status(201).json(tag);
  } catch {
    res.status(409).json({ error: "Bu nom band" });
  }
}));

// DELETE /api/tags/:id
router.delete("/:id", ah(async (req, res) => {
  if (!["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) {
    return res.status(403).json({ error: "Ruxsatingiz yo'q" });
  }
  await db.tag.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

export default router;
