import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah, requireRole } from "../lib/http.js";
import { hasPermission } from "../lib/rbac.js";

const router = Router();

const schema = z.object({
  title: z.string().min(1, "Nom kiriting"),
  type: z.enum(["exam", "level_test"]).optional(),
  courseId: z.string().optional().nullable(),
  groupId: z.string().optional().nullable(),
  date: z.string().min(1, "Sana kiriting"),
  maxScore: z.coerce.number().int().min(1).optional(),
});

const scoresSchema = z.object({
  records: z.array(z.object({ leadId: z.string(), score: z.coerce.number().int().min(0), note: z.string().optional().nullable() })),
});

// GET /api/exams
router.get("/", ah(async (req, res) => {
  const exams = await db.exam.findMany({
    orderBy: { date: "desc" },
    include: {
      group: { select: { name: true } },
      course: { select: { name: true } },
      _count: { select: { scores: true } },
    },
  });
  res.json(exams);
}));

// POST /api/exams
router.post("/", ah(async (req, res) => {
  const user = req.user;
  const isAdminRole = ["SUPER_ADMIN", "ADMIN"].includes(user.role);
  const canAdd = isAdminRole || user.canManageGrades || await hasPermission(user, "exams", "add");
  if (!canAdd) return res.status(403).json({ error: "Forbidden" });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;

  const exam = await db.exam.create({
    data: {
      title: d.title.trim(),
      type: d.type || "exam",
      courseId: d.courseId || null,
      groupId: d.groupId || null,
      date: new Date(d.date + "T00:00:00.000Z"),
      maxScore: d.maxScore || 100,
      createdById: user.id,
    },
  });
  res.status(201).json(exam);
}));

// GET /api/exams/:id
router.get("/:id", ah(async (req, res) => {
  const exam = await db.exam.findUnique({
    where: { id: req.params.id },
    include: { group: { select: { id: true, name: true } }, course: { select: { name: true } } },
  });
  if (!exam) return res.status(404).json({ error: "Not found" });
  res.json(exam);
}));

// DELETE /api/exams/:id
router.delete("/:id", requireRole("SUPER_ADMIN", "ADMIN", "MANAGER"), ah(async (req, res) => {
  await db.exam.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

// GET /api/exams/:id/scores
router.get("/:id/scores", ah(async (req, res) => {
  const { id } = req.params;

  const exam = await db.exam.findUnique({ where: { id }, select: { groupId: true, maxScore: true } });
  if (!exam) return res.status(404).json({ error: "Not found" });

  const students = exam.groupId
    ? await db.lead.findMany({ where: { groupId: exam.groupId }, select: { id: true, fullName: true, phone: true }, orderBy: { fullName: "asc" } })
    : [];
  const scores = await db.score.findMany({ where: { examId: id } });
  const map = {};
  scores.forEach((s) => (map[s.leadId] = s.score));

  res.json({
    maxScore: exam.maxScore,
    students: students.map((s) => ({ leadId: s.id, fullName: s.fullName, phone: s.phone, score: map[s.id] ?? null })),
  });
}));

// POST /api/exams/:id/scores
router.post("/:id/scores", ah(async (req, res) => {
  const user = req.user;
  const isAdminRole = ["SUPER_ADMIN", "ADMIN"].includes(user.role);
  const canAdd = isAdminRole || user.canManageGrades || await hasPermission(user, "grades", "add");
  if (!canAdd) return res.status(403).json({ error: "Forbidden" });

  const parsed = scoresSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { id } = req.params;
  for (const r of parsed.data.records) {
    await db.score.upsert({
      where: { examId_leadId: { examId: id, leadId: r.leadId } },
      update: { score: r.score, note: r.note || null },
      create: { examId: id, leadId: r.leadId, score: r.score, note: r.note || null },
    });
  }
  res.json({ success: true, saved: parsed.data.records.length });
}));

export default router;
