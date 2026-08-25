import { Router } from "express";
import { db } from "../lib/db.js";
import { ah } from "../lib/http.js";
import { currentMonth } from "../lib/dates.js";

const router = Router();

// GET /api/student/dashboard — student-portal only; a staff token is rejected here
// exactly as the Next.js route did (it checked session.user.accountType).
router.get("/dashboard", ah(async (req, res) => {
  if (req.user.accountType !== "student") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const leadId = req.user.id;

  const lead = await db.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      fullName: true,
      phone: true,
      coins: true,
      course: { select: { id: true, name: true, price: true } },
      group: { select: { id: true, name: true } },
      attendances: { select: { status: true }, orderBy: { date: "desc" }, take: 200 },
      scores: {
        orderBy: { createdAt: "desc" }, take: 30,
        select: { id: true, score: true, createdAt: true, exam: { select: { title: true, maxScore: true } } },
      },
    },
  });
  if (!lead) return res.status(404).json({ error: "Not found" });

  const [lessonScores, exerciseScores, submissions, payments] = await Promise.all([
    db.lessonScore.findMany({ where: { leadId }, orderBy: { date: "desc" }, take: 30, select: { score: true, date: true } }),
    db.exerciseScore.findMany({ where: { leadId }, orderBy: { createdAt: "desc" }, take: 30, select: { score: true, exercise: { select: { title: true, date: true } } } }),
    db.homeworkSubmission.findMany({
      where: { leadId }, orderBy: { submittedAt: "desc" }, take: 30,
      select: { id: true, status: true, grade: true, teacherNote: true, submittedAt: true, exercise: { select: { title: true } } },
    }),
    db.payment.groupBy({ by: ["leadId"], where: { leadId, forMonth: currentMonth() }, _sum: { amount: true } }),
  ]);

  const att = lead.attendances;
  const present = att.filter((a) => a.status === "present").length;
  const absent = att.filter((a) => a.status === "absent").length;
  const excused = att.filter((a) => a.status === "excused").length;
  const attTotal = present + absent + excused;
  const attendancePercent = attTotal > 0 ? Math.round(((present + excused) / attTotal) * 100) : null;

  const paidThisMonth = Number(payments[0]?._sum.amount ?? 0);
  const balance = Number(lead.course?.price ?? 0) - paidThisMonth;

  res.json({
    fullName: lead.fullName,
    group: lead.group,
    course: lead.course ? { id: lead.course.id, name: lead.course.name } : null,
    coins: lead.coins,
    attendance: { present, absent, excused, percent: attendancePercent },
    examScores: lead.scores,
    lessonScores,
    exerciseScores,
    homework: submissions,
    payment: { balance, month: currentMonth() },
  });
}));

export default router;
