import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah } from "../lib/http.js";

const router = Router();

const schema = z.object({
  salary: z.coerce.number().min(0).optional(),
  subject: z.string().optional().nullable(),
});

// GET /api/teachers
router.get("/", ah(async (req, res) => {
  const users = await db.user.findMany({
    where: { isActive: true },
    select: {
      id: true, fullName: true, username: true, role: true, salary: true, subject: true,
      groupsTeaching: { select: { id: true, name: true, _count: { select: { leads: true } } } },
    },
    orderBy: { fullName: "asc" },
  });

  const teachers = users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    username: u.username,
    role: u.role,
    subject: u.subject || "",
    salary: u.salary ? Number(u.salary) : 0,
    groupsCount: u.groupsTeaching.length,
    studentsCount: u.groupsTeaching.reduce((a, g) => a + g._count.leads, 0),
    groups: u.groupsTeaching.map((g) => g.name),
  }));

  res.json(teachers);
}));

// PATCH /api/teachers/:id
router.patch("/:id", ah(async (req, res) => {
  if (!["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const data = {};
  if (parsed.data.salary !== undefined) data.salary = parsed.data.salary;
  if (parsed.data.subject !== undefined) data.subject = parsed.data.subject || null;

  const updated = await db.user.update({
    where: { id: req.params.id },
    data,
    select: { id: true, salary: true, subject: true },
  });

  res.json({ id: updated.id, salary: updated.salary ? Number(updated.salary) : 0, subject: updated.subject || "" });
}));

export default router;
