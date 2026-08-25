import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah } from "../lib/http.js";
import { hasPermission } from "../lib/rbac.js";

const router = Router();

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  durationMonths: z.number().int().min(1),
  price: z.number().min(0),
  currency: z.string().default("UZS"),
  isActive: z.boolean().default(true),
  color: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  durationMonths: z.number().int().min(1).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().optional(),
  isActive: z.boolean().optional(),
  color: z.string().optional(),
});

// GET /api/courses
router.get("/", ah(async (req, res) => {
  const courses = await db.course.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { leads: true } } },
  });
  res.json(courses);
}));

// POST /api/courses
router.post("/", ah(async (req, res) => {
  const user = req.user;
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role) && !user.canManageCourses) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const course = await db.course.create({ data: parsed.data });
  res.status(201).json(course);
}));

// PATCH /api/courses/:id
router.patch("/:id", ah(async (req, res) => {
  const user = req.user;
  const allowed = ["SUPER_ADMIN", "ADMIN"].includes(user.role) || user.canManageCourses || await hasPermission(user, "courses", "edit");
  if (!allowed) return res.status(403).json({ error: "Forbidden" });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const course = await db.course.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(course);
}));

// DELETE /api/courses/:id
router.delete("/:id", ah(async (req, res) => {
  if (!["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  await db.course.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

export default router;
