import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah } from "../lib/http.js";
import { isManager } from "../lib/permissions.js";
import { hasPermission } from "../lib/rbac.js";
import { logAudit } from "../lib/audit.js";

const router = Router();

const createSchema = z.object({
  title: z.string().min(2, "Sarlavha kamida 2 harf"),
  description: z.string().optional(),
  type: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
});

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  tagIds: z.array(z.string()).optional(),
});

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  type: true,
  dueDate: true,
  createdAt: true,
  assignedTo: { select: { id: true, fullName: true } },
  createdBy: { select: { id: true, fullName: true } },
  tags: { select: { id: true, name: true, color: true } },
};

// GET /api/tasks
router.get("/", ah(async (req, res) => {
  const page = parseInt(req.query.page || "1");
  const limit = parseInt(req.query.limit || "50");
  const skip = (page - 1) * limit;

  const assignedToId = req.query.assignedToId || ""; // xodim
  const type = req.query.type || ""; // tur
  const tagId = req.query.tagId || ""; // teg
  const status = req.query.status || "";
  const overdue = req.query.overdue === "1";
  const dueFrom = req.query.dueFrom || ""; // muddat
  const dueTo = req.query.dueTo || "";

  const where = {};

  if (assignedToId === "unassigned") where.assignedToId = null;
  else if (assignedToId) where.assignedToId = assignedToId;

  if (type) where.type = type;
  if (tagId) where.tags = { some: { id: tagId } };
  if (status) where.status = status;

  if (overdue) {
    where.dueDate = { lt: new Date() };
    where.status = { not: "DONE" };
  } else if (dueFrom || dueTo) {
    const dueDate = {};
    if (dueFrom) dueDate.gte = new Date(dueFrom);
    if (dueTo) dueDate.lte = new Date(dueTo + "T23:59:59");
    where.dueDate = dueDate;
  }

  const [tasks, total] = await Promise.all([
    db.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      select: taskSelect,
    }),
    db.task.count({ where }),
  ]);

  res.json({ tasks, total, page, limit, pages: Math.ceil(total / limit) });
}));

// POST /api/tasks
router.post("/", ah(async (req, res) => {
  const user = req.user;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { tagIds, dueDate, assignedToId, ...rest } = parsed.data;

  // Everyone can add a task for themselves; assigning it to someone else is an
  // administrative action that needs the "tasks:add" permission (or manager+).
  const assigningOthers = assignedToId && assignedToId !== user.id;
  if (assigningOthers && !isManager(user) && !(await hasPermission(user, "tasks", "add"))) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const task = await db.task.create({
    data: {
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedToId: assignedToId || null,
      createdById: user.id,
      tags: tagIds?.length ? { connect: tagIds.map((id) => ({ id })) } : undefined,
    },
    select: taskSelect,
  });

  res.status(201).json(task);
}));

// PATCH /api/tasks/:id
router.patch("/:id", ah(async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const current = await db.task.findUnique({ where: { id }, select: { status: true, createdById: true, assignedToId: true } });
  if (!current) return res.status(404).json({ error: "Not found" });

  const isOwnTask = current.createdById === user.id || current.assignedToId === user.id;
  if (!isOwnTask && !isManager(user) && !(await hasPermission(user, "tasks", "edit"))) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { tagIds, dueDate, ...rest } = parsed.data;
  const updateData = { ...rest };
  if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
  if (tagIds !== undefined) updateData.tags = { set: tagIds.map((tagId) => ({ id: tagId })) };

  const task = await db.task.update({ where: { id }, data: updateData, select: taskSelect });

  if (parsed.data.status && parsed.data.status !== current.status) {
    await logAudit(user.id, user.fullName, "task_status_changed", "Task", id, {
      from: current.status,
      to: parsed.data.status,
    });
  }

  res.json(task);
}));

// DELETE /api/tasks/:id
router.delete("/:id", ah(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const current = await db.task.findUnique({ where: { id }, select: { createdById: true } });
  if (!current) return res.status(404).json({ error: "Not found" });

  const isOwnTask = current.createdById === user.id;
  if (!isOwnTask && !isManager(user) && !(await hasPermission(user, "tasks", "delete"))) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await db.task.delete({ where: { id } });
  await logAudit(user.id, user.fullName, "task_deleted", "Task", id);
  res.json({ success: true });
}));

export default router;
