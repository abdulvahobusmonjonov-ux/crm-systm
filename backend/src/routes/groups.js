import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah, qs } from "../lib/http.js";
import { isManager } from "../lib/permissions.js";
import { hasPermission } from "../lib/rbac.js";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1, "Nom kiriting"),
  courseId: z.string().optional().nullable(),
  teacherId: z.string().optional().nullable(),
  days: z.string().optional().nullable(),
  timeFrom: z.string().optional().nullable(),
  timeTo: z.string().optional().nullable(),
  room: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  courseId: z.string().optional().nullable(),
  teacherId: z.string().optional().nullable(),
  days: z.string().optional().nullable(),
  timeFrom: z.string().optional().nullable(),
  timeTo: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET /api/groups
router.get("/", ah(async (req, res) => {
  const params = qs(req);
  const page = parseInt(params.get("page") || "1");
  const limit = parseInt(params.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where = {};

  const [groups, total] = await Promise.all([
    db.group.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        room: true,
        days: true,
        timeFrom: true,
        timeTo: true,
        course: { select: { id: true, name: true, color: true } },
        teacher: { select: { id: true, fullName: true } },
        _count: { select: { leads: true } },
      },
    }),
    db.group.count({ where }),
  ]);

  res.json({ groups, total, page, limit, pages: Math.ceil(total / limit) });
}));

// POST /api/groups
router.post("/", ah(async (req, res) => {
  const user = req.user;
  const allowed = isManager(user) || await hasPermission(user, "groups", "add");
  if (!allowed) return res.status(403).json({ error: "Forbidden" });

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const d = parsed.data;
  const group = await db.group.create({
    data: {
      name: d.name,
      courseId: d.courseId || null,
      teacherId: d.teacherId || null,
      days: d.days || null,
      timeFrom: d.timeFrom || null,
      timeTo: d.timeTo || null,
      room: d.room || null,
      startDate: d.startDate ? new Date(d.startDate) : null,
    },
  });
  res.status(201).json(group);
}));

// GET /api/groups/:id
router.get("/:id", ah(async (req, res) => {
  const group = await db.group.findUnique({
    where: { id: req.params.id },
    include: {
      course: { select: { id: true, name: true, color: true } },
      teacher: { select: { id: true, fullName: true } },
      leads: {
        select: { id: true, fullName: true, phone: true, stage: { select: { name: true, color: true } } },
        orderBy: { fullName: "asc" },
      },
    },
  });
  if (!group) return res.status(404).json({ error: "Not found" });
  res.json(group);
}));

// PATCH /api/groups/:id
router.patch("/:id", ah(async (req, res) => {
  const user = req.user;
  const allowed = isManager(user) || await hasPermission(user, "groups", "edit");
  if (!allowed) return res.status(403).json({ error: "Forbidden" });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { startDate, ...rest } = parsed.data;
  const data = { ...rest };
  if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;

  const group = await db.group.update({ where: { id: req.params.id }, data });
  res.json(group);
}));

// DELETE /api/groups/:id
router.delete("/:id", ah(async (req, res) => {
  if (!["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { id } = req.params;
  // Detach leads (FK is SET NULL, but be explicit)
  await db.lead.updateMany({ where: { groupId: id }, data: { groupId: null } });
  await db.group.delete({ where: { id } });
  res.json({ success: true });
}));

export default router;
