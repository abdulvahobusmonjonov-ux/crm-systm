import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ah } from "../lib/http.js";
import { getTeacherGroupIds } from "../lib/teacher.js";
import {
  canSeePayments, canSeeStudentContacts, canManageAttendance, canManageGrades,
} from "../lib/permissions.js";
import { currentMonth } from "../lib/dates.js";

const router = Router();

function toDate(s) {
  return new Date(s + "T00:00:00.000Z");
}

// Every /api/teacher/* route is scoped to groups the caller teaches; admins bypass.
async function assertOwnsGroup(userId, role, groupId) {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
  const groupIds = await getTeacherGroupIds(userId);
  return groupIds.includes(groupId);
}

// Express middleware form of the above, for the /groups/:id/* subtree.
const ownsGroup = ah(async (req, res, next) => {
  if (!(await assertOwnsGroup(req.user.id, req.user.role, req.params.id))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
});

// Splits "YYYY-MM" into the UTC [from, to] bounds that month covers.
function monthBounds(month) {
  const [yr, mn] = month.split("-").map(Number);
  return {
    from: new Date(`${month}-01T00:00:00.000Z`),
    to: new Date(Date.UTC(yr, mn, 0, 23, 59, 59, 999)),
  };
}

// --------------------------------------------- GET /api/teacher/dashboard
router.get("/dashboard", ah(async (req, res) => {
  const groups = await db.group.findMany({
    where: { teacherId: req.user.id, isArchived: false },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      room: true,
      days: true,
      course: { select: { id: true, name: true, color: true } },
      _count: { select: { leads: true } },
    },
  });

  res.json({ groups });
}));

// ----------------------------------------------- GET /api/teacher/profile
router.get("/profile", ah(async (req, res) => {
  const user = await db.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, fullName: true, username: true, phone: true, avatarUrl: true,
      language: true, gender: true, birthDate: true, region: true, district: true,
      instagram: true, telegram: true,
    },
  });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
}));

// ---------------------------------------------- GET /api/teacher/students
router.get("/students", ah(async (req, res) => {
  const isAdminRole = req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN";
  const groupIds = isAdminRole ? null : await getTeacherGroupIds(req.user.id);
  if (groupIds && groupIds.length === 0) return res.json({ students: [] });

  const search = String(req.query.search || "").trim();

  const students = await db.lead.findMany({
    where: {
      isArchived: false,
      ...(groupIds ? { groupId: { in: groupIds } } : { groupId: { not: null } }),
      ...(search
        ? { OR: [{ fullName: { contains: search, mode: "insensitive" } }, { phone: { contains: search } }] }
        : {}),
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      birthDate: true,
      lastContactedAt: true,
      coins: true,
      group: { select: { id: true, name: true } },
      course: { select: { price: true } },
    },
    orderBy: { fullName: "asc" },
  });

  const leadIds = students.map((s) => s.id);
  const month = currentMonth();
  const monthPayments = leadIds.length
    ? await db.payment.groupBy({ by: ["leadId"], where: { forMonth: month, leadId: { in: leadIds } }, _sum: { amount: true } })
    : [];
  const paidMap = new Map(monthPayments.map((p) => [p.leadId, Number(p._sum.amount ?? 0)]));
  const showPayments = canSeePayments(req.user);
  const showContacts = canSeeStudentContacts(req.user);

  res.json({
    students: students.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      phone: showContacts ? s.phone : null,
      birthDate: s.birthDate,
      lastActivityAt: s.lastContactedAt,
      group: s.group,
      coins: s.coins,
      balance: showPayments ? Number(s.course?.price ?? 0) - (paidMap.get(s.id) ?? 0) : null,
    })),
  });
}));

// ------------------------------------------ GET /api/teacher/students/:id
router.get("/students/:id", ah(async (req, res) => {
  const { id } = req.params;

  const lead = await db.lead.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      phone: true,
      status: true,
      coins: true,
      birthDate: true,
      groupId: true,
      course: { select: { id: true, name: true, color: true } },
      group: { select: { id: true, name: true, days: true, timeFrom: true, timeTo: true } },
      attendances: { select: { status: true } },
      scores: { orderBy: { createdAt: "desc" }, take: 50, select: { id: true, score: true, createdAt: true, exam: { select: { title: true, maxScore: true } } } },
    },
  });
  if (!lead) return res.status(404).json({ error: "Not found" });

  const isAdminRole = req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN";
  if (!isAdminRole) {
    const groupIds = await getTeacherGroupIds(req.user.id);
    if (!lead.groupId || !groupIds.includes(lead.groupId)) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  res.json({
    ...lead,
    phone: canSeeStudentContacts(req.user) ? lead.phone : null,
  });
}));

// --------------------------------- GET /api/teacher/students/:id/payments
router.get("/students/:id/payments", ah(async (req, res) => {
  if (!canSeePayments(req.user)) return res.status(403).json({ error: "Forbidden" });
  const { id } = req.params;

  const lead = await db.lead.findUnique({ where: { id }, select: { groupId: true } });
  if (!lead) return res.status(404).json({ error: "Not found" });

  const isAdminRole = req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN";
  if (!isAdminRole) {
    const groupIds = await getTeacherGroupIds(req.user.id);
    if (!lead.groupId || !groupIds.includes(lead.groupId)) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  const payments = await db.payment.findMany({
    where: { leadId: id },
    orderBy: { paidAt: "desc" },
    take: 200,
    select: { id: true, amount: true, paidAt: true, forMonth: true, method: true },
  });

  res.json({ payments });
}));

// ---------------------------------------------- GET /api/teacher/homework
router.get("/homework", ah(async (req, res) => {
  const isAdminRole = req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN";
  const groupIds = isAdminRole ? null : await getTeacherGroupIds(req.user.id);
  if (groupIds && groupIds.length === 0) return res.json({ exercises: [] });

  const status = req.query.status; // "unchecked" | "checked" | undefined (all)
  const from = req.query.from;
  const to = req.query.to;
  const search = String(req.query.search || "").trim();

  const submissionWhere = {
    ...(status === "unchecked" || status === "checked" ? { status } : {}),
    ...(from || to
      ? { submittedAt: { ...(from ? { gte: new Date(from + "T00:00:00.000Z") } : {}), ...(to ? { lte: new Date(to + "T23:59:59.999Z") } : {}) } }
      : {}),
    ...(search ? { lead: { fullName: { contains: search, mode: "insensitive" } } } : {}),
  };

  const exercises = await db.exercise.findMany({
    where: {
      ...(groupIds ? { groupId: { in: groupIds } } : {}),
      submissions: { some: submissionWhere },
    },
    orderBy: { date: "desc" },
    select: {
      id: true,
      title: true,
      date: true,
      group: { select: { id: true, name: true } },
      submissions: {
        where: submissionWhere,
        orderBy: { submittedAt: "desc" },
        select: {
          id: true,
          status: true,
          grade: true,
          content: true,
          teacherNote: true,
          submittedAt: true,
          checkedAt: true,
          lead: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  res.json({ exercises });
}));

const homeworkSchema = z.object({
  status: z.enum(["unchecked", "checked"]).optional(),
  grade: z.number().min(0).max(100).optional().nullable(),
  teacherNote: z.string().optional().nullable(),
});

// ------------------------- PATCH /api/teacher/homework/:submissionId
router.patch("/homework/:submissionId", ah(async (req, res) => {
  const { submissionId } = req.params;

  const submission = await db.homeworkSubmission.findUnique({
    where: { id: submissionId },
    select: { exercise: { select: { groupId: true } } },
  });
  if (!submission) return res.status(404).json({ error: "Not found" });

  const isAdminRole = req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN";
  if (!isAdminRole) {
    const groupIds = await getTeacherGroupIds(req.user.id);
    if (!groupIds.includes(submission.exercise.groupId)) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  const parsed = homeworkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const d = parsed.data;
  const updated = await db.homeworkSubmission.update({
    where: { id: submissionId },
    data: {
      ...(d.status !== undefined ? { status: d.status, checkedAt: d.status === "checked" ? new Date() : null } : {}),
      ...(d.grade !== undefined ? { grade: d.grade } : {}),
      ...(d.teacherNote !== undefined ? { teacherNote: d.teacherNote } : {}),
    },
  });

  res.json(updated);
}));

// ============================ /api/teacher/groups/:id ============================

router.get("/groups/:id", ownsGroup, ah(async (req, res) => {
  const group = await db.group.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      room: true,
      days: true,
      timeFrom: true,
      timeTo: true,
      course: { select: { id: true, name: true, color: true } },
      leads: {
        where: { isArchived: false },
        select: { id: true, fullName: true, phone: true, coins: true },
        orderBy: { fullName: "asc" },
      },
    },
  });
  if (!group) return res.status(404).json({ error: "Not found" });
  res.json(group);
}));

// ---- attendance ----
const attendanceSaveSchema = z.object({
  date: z.string().min(1),
  records: z.array(z.object({ leadId: z.string(), status: z.string() })),
});

router.get("/groups/:id/attendance", ownsGroup, ah(async (req, res) => {
  const groupId = req.params.id;
  const month = req.query.month;
  if (!month) return res.status(400).json({ error: "month kerak" });

  const { from, to } = monthBounds(String(month));

  const [students, records] = await Promise.all([
    db.lead.findMany({ where: { groupId, isArchived: false }, select: { id: true, fullName: true, phone: true }, orderBy: { fullName: "asc" } }),
    db.attendance.findMany({ where: { groupId, date: { gte: from, lte: to } } }),
  ]);

  const journal = {};
  for (const r of records) {
    const key = r.date.toISOString().slice(0, 10);
    if (!journal[key]) journal[key] = {};
    journal[key][r.leadId] = r.status;
  }

  res.json({
    month,
    students: students.map((s) => ({ leadId: s.id, fullName: s.fullName, phone: s.phone })),
    journal,
  });
}));

router.post("/groups/:id/attendance", ah(async (req, res, next) => {
  if (!canManageAttendance(req.user)) return res.status(403).json({ error: "Forbidden" });
  next();
}), ownsGroup, ah(async (req, res) => {
  const groupId = req.params.id;
  const parsed = attendanceSaveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { date, records } = parsed.data;
  const d = toDate(date);

  for (const r of records) {
    await db.attendance.upsert({
      where: { groupId_leadId_date: { groupId, leadId: r.leadId, date: d } },
      update: { status: r.status },
      create: { groupId, leadId: r.leadId, date: d, status: r.status, createdById: req.user.id },
    });
  }

  res.json({ success: true, saved: records.length });
}));

// ---- lesson scores ("Ballar") ----
const scoresSaveSchema = z.object({
  date: z.string().min(1),
  records: z.array(z.object({ leadId: z.string(), score: z.number().min(0).max(100) })),
});

router.get("/groups/:id/scores", ownsGroup, ah(async (req, res) => {
  const groupId = req.params.id;
  const month = req.query.month;
  if (!month) return res.status(400).json({ error: "month kerak" });

  const { from, to } = monthBounds(String(month));

  const [students, records] = await Promise.all([
    db.lead.findMany({ where: { groupId, isArchived: false }, select: { id: true, fullName: true, phone: true }, orderBy: { fullName: "asc" } }),
    db.lessonScore.findMany({ where: { groupId, date: { gte: from, lte: to } } }),
  ]);

  const journal = {};
  for (const r of records) {
    const key = r.date.toISOString().slice(0, 10);
    if (!journal[key]) journal[key] = {};
    journal[key][r.leadId] = r.score;
  }

  res.json({
    month,
    students: students.map((s) => ({ leadId: s.id, fullName: s.fullName, phone: s.phone })),
    journal,
  });
}));

router.post("/groups/:id/scores", ah(async (req, res, next) => {
  if (!canManageGrades(req.user)) return res.status(403).json({ error: "Forbidden" });
  next();
}), ownsGroup, ah(async (req, res) => {
  const groupId = req.params.id;
  const parsed = scoresSaveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { date, records } = parsed.data;
  const d = toDate(date);

  for (const r of records) {
    await db.lessonScore.upsert({
      where: { groupId_leadId_date: { groupId, leadId: r.leadId, date: d } },
      update: { score: r.score },
      create: { groupId, leadId: r.leadId, date: d, score: r.score, createdById: req.user.id },
    });
  }

  res.json({ success: true, saved: records.length });
}));

// ---- ranking ----
// GET ?month=YYYY-MM&metric=score|coin&mode=avg|total
router.get("/groups/:id/ranking", ownsGroup, ah(async (req, res) => {
  const groupId = req.params.id;
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const metric = req.query.metric === "coin" ? "coin" : "score";
  const mode = req.query.mode === "total" ? "total" : "avg";

  const students = await db.lead.findMany({
    where: { groupId, isArchived: false },
    select: { id: true, fullName: true, coins: true },
    orderBy: { fullName: "asc" },
  });

  if (metric === "coin") {
    const ranked = students
      .map((s) => ({ leadId: s.id, fullName: s.fullName, value: s.coins }))
      .sort((a, b) => b.value - a.value);
    return res.json({ metric, mode, ranking: ranked });
  }

  const { from, to } = monthBounds(String(month));

  const [lessonScores, exerciseScores] = await Promise.all([
    db.lessonScore.findMany({ where: { groupId, date: { gte: from, lte: to } }, select: { leadId: true, score: true } }),
    db.exerciseScore.findMany({
      where: { exercise: { groupId, date: { gte: from, lte: to } } },
      select: { leadId: true, score: true },
    }),
  ]);

  const byLead = {};
  for (const s of [...lessonScores, ...exerciseScores]) {
    if (!byLead[s.leadId]) byLead[s.leadId] = [];
    byLead[s.leadId].push(s.score);
  }

  const ranked = students
    .map((s) => {
      const values = byLead[s.id] || [];
      const total = values.reduce((a, b) => a + b, 0);
      const value = values.length === 0 ? 0 : mode === "total" ? total : Math.round(total / values.length);
      return { leadId: s.id, fullName: s.fullName, value };
    })
    .sort((a, b) => b.value - a.value);

  res.json({ metric, mode, ranking: ranked });
}));

// ---- exams ----
const examCreateSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  maxScore: z.number().min(1).max(1000).optional(),
  passingScore: z.number().min(0).max(1000).optional().nullable(),
  section: z.string().optional().nullable(),
});

router.get("/groups/:id/exams", ownsGroup, ah(async (req, res) => {
  const exams = await db.exam.findMany({
    where: { groupId: req.params.id },
    orderBy: { date: "desc" },
    select: { id: true, title: true, date: true, maxScore: true, passingScore: true, section: true },
  });
  res.json({ exams });
}));

router.post("/groups/:id/exams", ah(async (req, res, next) => {
  if (!canManageGrades(req.user)) return res.status(403).json({ error: "Forbidden" });
  next();
}), ownsGroup, ah(async (req, res) => {
  const parsed = examCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const d = parsed.data;
  const exam = await db.exam.create({
    data: {
      groupId: req.params.id,
      title: d.title,
      date: new Date(d.date + "T00:00:00.000Z"),
      maxScore: d.maxScore ?? 100,
      passingScore: d.passingScore ?? null,
      section: d.section || null,
      createdById: req.user.id,
    },
  });
  res.status(201).json(exam);
}));

router.delete("/groups/:id/exams/:examId", ah(async (req, res, next) => {
  if (!canManageGrades(req.user)) return res.status(403).json({ error: "Forbidden" });
  next();
}), ownsGroup, ah(async (req, res) => {
  const { id: groupId, examId } = req.params;

  const exam = await db.exam.findUnique({ where: { id: examId }, select: { groupId: true } });
  if (!exam || exam.groupId !== groupId) return res.status(404).json({ error: "Not found" });

  await db.exam.delete({ where: { id: examId } });
  res.json({ success: true });
}));

// ---- exercises ("Mashqlar") ----
const exerciseCreateSchema = z.object({
  date: z.string().min(1),
  title: z.string().min(1),
});

const exerciseScoresSchema = z.object({
  records: z.array(z.object({ leadId: z.string(), score: z.number().min(0).max(100) })),
});

// GET ?month=YYYY-MM -> exercises in that month + per-student scores
router.get("/groups/:id/exercises", ownsGroup, ah(async (req, res) => {
  const groupId = req.params.id;
  const month = req.query.month;
  if (!month) return res.status(400).json({ error: "month kerak" });

  const { from, to } = monthBounds(String(month));

  const [students, exercises] = await Promise.all([
    db.lead.findMany({ where: { groupId, isArchived: false }, select: { id: true, fullName: true, phone: true }, orderBy: { fullName: "asc" } }),
    db.exercise.findMany({
      where: { groupId, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
      select: {
        id: true,
        title: true,
        date: true,
        scores: { select: { leadId: true, score: true } },
      },
    }),
  ]);

  res.json({
    month,
    students: students.map((s) => ({ leadId: s.id, fullName: s.fullName, phone: s.phone })),
    exercises: exercises.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date.toISOString().slice(0, 10),
      scores: Object.fromEntries(e.scores.map((s) => [s.leadId, s.score])),
    })),
  });
}));

router.post("/groups/:id/exercises", ah(async (req, res, next) => {
  if (!canManageGrades(req.user)) return res.status(403).json({ error: "Forbidden" });
  next();
}), ownsGroup, ah(async (req, res) => {
  const parsed = exerciseCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const exercise = await db.exercise.create({
    data: {
      groupId: req.params.id,
      date: new Date(parsed.data.date + "T00:00:00.000Z"),
      title: parsed.data.title,
      createdById: req.user.id,
    },
  });
  res.status(201).json(exercise);
}));

router.post("/groups/:id/exercises/:exerciseId/scores", ah(async (req, res, next) => {
  if (!canManageGrades(req.user)) return res.status(403).json({ error: "Forbidden" });
  next();
}), ownsGroup, ah(async (req, res) => {
  const { id: groupId, exerciseId } = req.params;

  const exercise = await db.exercise.findUnique({ where: { id: exerciseId }, select: { groupId: true } });
  if (!exercise || exercise.groupId !== groupId) {
    return res.status(404).json({ error: "Not found" });
  }

  const parsed = exerciseScoresSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  for (const r of parsed.data.records) {
    await db.exerciseScore.upsert({
      where: { exerciseId_leadId: { exerciseId, leadId: r.leadId } },
      update: { score: r.score },
      create: { exerciseId, leadId: r.leadId, score: r.score },
    });
  }

  res.json({ success: true, saved: parsed.data.records.length });
}));

export default router;
