import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, parseISO } from "date-fns";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateFilter: Prisma.DateTimeFilter = {};
  if (from) dateFilter.gte = startOfDay(parseISO(from));
  if (to) dateFilter.lte = endOfDay(parseISO(to));
  const where: Prisma.LeadWhereInput = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

  const stages = await db.stage.findMany({ orderBy: { order: "asc" } });
  const wonStageIds = stages.filter(s => s.isWon).map(s => s.id);
  const inProgressStageIds = stages.filter(s => !s.isWon && !s.isLost).map(s => s.id);

  const [
    totalLeads, stageGroups, sourceDist, courseStats,
    enrolledLeads, userStats, potentialLeads,
  ] = await Promise.all([
    db.lead.count({ where }),
    db.lead.groupBy({ by: ["stageId"], _count: { id: true }, where }),
    db.lead.groupBy({ by: ["source"], _count: { id: true }, where }),
    db.lead.groupBy({ by: ["courseId"], _count: { id: true }, where: { ...where, courseId: { not: null } } }),
    wonStageIds.length
      ? db.lead.findMany({ where: { ...where, stageId: { in: wonStageIds } }, include: { course: { select: { price: true, currency: true } } } })
      : Promise.resolve([]),
    db.user.findMany({
      select: { id: true, fullName: true, _count: { select: { leads: true, createdLeads: true } } },
    }),
    inProgressStageIds.length
      ? db.lead.findMany({ where: { ...where, stageId: { in: inProgressStageIds } }, include: { course: { select: { price: true } } } })
      : Promise.resolve([]),
  ]);

  const courseIds = courseStats.map(c => c.courseId as string).filter(Boolean);
  const courses = await db.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, name: true, color: true, price: true } });
  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]));

  const actualRevenue = enrolledLeads.reduce((sum, l) => sum + (l.course ? parseFloat(String(l.course.price)) : 0), 0);
  const potentialRevenue = potentialLeads.reduce((sum, l) => sum + (l.course ? parseFloat(String(l.course.price)) : 0), 0);

  const countByStage = Object.fromEntries(stageGroups.map(g => [g.stageId ?? "none", g._count.id]));
  const enrolled = wonStageIds.reduce((sum, id) => sum + (countByStage[id] ?? 0), 0);
  const conversionRate = totalLeads > 0 ? ((enrolled / totalLeads) * 100).toFixed(1) : "0";

  return NextResponse.json({
    totalLeads,
    conversionRate,
    actualRevenue,
    potentialRevenue,
    enrolledCount: enrolled,
    stageDistribution: stages.map(s => ({ stageId: s.id, name: s.name, color: s.color, count: countByStage[s.id] ?? 0 })),
    sourceDistribution: sourceDist.map(s => ({ source: s.source, count: s._count.id })),
    courseStats: courseStats.map(c => ({
      courseId: c.courseId,
      course: c.courseId ? courseMap[c.courseId] : null,
      count: c._count.id,
    })),
    userStats: userStats.map(u => ({
      id: u.id, fullName: u.fullName,
      totalLeads: u._count.leads,
      createdLeads: u._count.createdLeads,
    })),
  });
}
