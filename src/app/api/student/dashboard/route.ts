import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function currentMonth() {
  const t = new Date(Date.now() + 5 * 3600 * 1000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  const session = await auth();
  if (!session || session.user.accountType !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leadId = session.user.id;

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
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

  return NextResponse.json({
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
}
