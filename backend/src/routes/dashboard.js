import { Router } from "express";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, subMonths, format } from "date-fns";
import { db } from "../lib/db.js";
import { ah } from "../lib/http.js";

const router = Router();

// GET /api/dashboard
router.get("/", ah(async (req, res) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));
  const yesterdayStart = startOfDay(subDays(now, 1));
  const yesterdayEnd = endOfDay(subDays(now, 1));

  const stages = await db.stage.findMany({ orderBy: { order: "asc" } });
  const wonStageIds = stages.filter(s => s.isWon).map(s => s.id);

  const [
    totalLeads,
    leadsThisMonth,
    leadsLastMonth,
    todayLeads,
    yesterdayLeads,
    enrolledThisMonth,
    enrolledLastMonth,
    todayReminders,
    yesterdayReminders,
    trialBookedAll,
    trialBookedThisMonth,
    trialBookedLastMonth,
    paidThisMonthRecords,
    paidLastMonthRecords,
    paidThisMonthAgg,
    frozen,
    stageGroups,
    sourceDistribution,
    leadsInLast30Days,
    topCourses,
    recentLeads,
    recentActivities,
  ] = await Promise.all([
    db.lead.count(),
    db.lead.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
    db.lead.count({ where: { createdAt: { gte: prevMonthStart, lte: prevMonthEnd } } }),
    db.lead.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
    db.lead.count({ where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } } }),
    wonStageIds.length
      ? db.lead.count({ where: { stageId: { in: wonStageIds }, createdAt: { gte: monthStart } } })
      : Promise.resolve(0),
    wonStageIds.length
      ? db.lead.count({ where: { stageId: { in: wonStageIds }, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } } })
      : Promise.resolve(0),
    db.reminder.count({ where: { status: "PENDING", remindAt: { gte: todayStart, lte: todayEnd } } }),
    db.reminder.count({ where: { status: "PENDING", remindAt: { gte: yesterdayStart, lte: yesterdayEnd } } }),
    db.lead.count({ where: { status: "TRIAL_BOOKED" } }),
    db.lead.count({ where: { status: "TRIAL_BOOKED", createdAt: { gte: monthStart, lte: monthEnd } } }),
    db.lead.count({ where: { status: "TRIAL_BOOKED", createdAt: { gte: prevMonthStart, lte: prevMonthEnd } } }),
    db.payment.findMany({
      where: { paidAt: { gte: monthStart, lte: monthEnd } },
      select: { leadId: true },
      distinct: ["leadId"],
    }),
    db.payment.findMany({
      where: { paidAt: { gte: prevMonthStart, lte: prevMonthEnd } },
      select: { leadId: true },
      distinct: ["leadId"],
    }),
    db.payment.aggregate({
      where: { paidAt: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    db.lead.count({ where: { frozenAt: { not: null }, isArchived: false } }),
    db.lead.groupBy({ by: ["stageId"], _count: { id: true } }),
    db.lead.groupBy({ by: ["source"], _count: { id: true } }),
    db.lead.findMany({
      where: { createdAt: { gte: startOfDay(subDays(now, 29)), lte: todayEnd } },
      select: { createdAt: true },
    }),
    db.lead.groupBy({
      by: ["courseId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
      where: { courseId: { not: null } },
    }),
    db.lead.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { name: true, color: true } },
        stage: { select: { name: true, color: true } },
        assignedTo: { select: { fullName: true } },
      },
    }),
    db.activity.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true } },
        lead: { select: { fullName: true } },
      },
    }),
  ]);

  // Bucket the single 30-day lead fetch into per-day counts (was 30 separate COUNT queries)
  const leadsByDay = Array.from({ length: 30 }, (_, i) => {
    const day = subDays(now, 29 - i);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const count = leadsInLast30Days.filter(
      l => l.createdAt >= dayStart && l.createdAt <= dayEnd
    ).length;
    return { date: format(day, "MM/dd"), count };
  });

  // Debtors: enrolled leads who haven't paid this month
  const paidThisMonth = paidThisMonthRecords.length;
  const paidLastMonth = paidLastMonthRecords.length;
  const paidThisMonthAmount = Number(paidThisMonthAgg._sum.amount ?? 0);
  const paidLeadIdsThisMonth = paidThisMonthRecords.map(p => p.leadId);

  const debtorWhere = { status: "ENROLLED", isArchived: false };
  if (paidLeadIdsThisMonth.length > 0) debtorWhere.id = { notIn: paidLeadIdsThisMonth };

  const courseIds = topCourses.map(c => c.courseId).filter(Boolean);

  const [debtors, courses] = await Promise.all([
    db.lead.count({ where: debtorWhere }),
    db.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, name: true, color: true },
    }),
  ]);
  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]));

  // Stage distribution
  const countByStage = Object.fromEntries(stageGroups.map(g => [g.stageId ?? "none", g._count.id]));
  const stageDistribution = stages.map(s => ({
    stageId: s.id, name: s.name, color: s.color,
    count: countByStage[s.id] ?? 0,
  }));

  const totalConverted = wonStageIds.reduce((sum, id) => sum + (countByStage[id] ?? 0), 0);
  const conversionRate = totalLeads > 0 ? ((totalConverted / totalLeads) * 100).toFixed(1) : "0";

  res.json({
    kpis: {
      totalLeads,
      leadsThisMonth,
      leadsLastMonth,
      todayLeads,
      yesterdayLeads,
      enrolledThisMonth,
      enrolledLastMonth,
      todayReminders,
      yesterdayReminders,
      trialBookedAll,
      trialBookedThisMonth,
      trialBookedLastMonth,
      paidThisMonth,
      paidLastMonth,
      paidThisMonthAmount,
      frozen,
      debtors,
      conversionRate,
    },
    stageDistribution,
    sourceDistribution: sourceDistribution.map(s => ({ source: s.source, count: s._count.id })),
    leadsByDay,
    topCourses: topCourses.map(c => ({
      courseId: c.courseId,
      course: c.courseId ? courseMap[c.courseId] : null,
      count: c._count.id,
    })),
    recentLeads,
    recentActivities,
  });
}));

export default router;
