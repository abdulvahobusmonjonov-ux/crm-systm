import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTeacherGroupIds } from "@/lib/teacher";

async function assertOwnsGroup(userId: string, role: string, groupId: string) {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
  const groupIds = await getTeacherGroupIds(userId);
  return groupIds.includes(groupId);
}

// GET ?month=YYYY-MM&metric=score|coin&mode=avg|total
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: groupId } = await params;
  if (!(await assertOwnsGroup(session.user.id, session.user.role, groupId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const metric = searchParams.get("metric") === "coin" ? "coin" : "score";
  const mode = searchParams.get("mode") === "total" ? "total" : "avg";

  const students = await db.lead.findMany({
    where: { groupId, isArchived: false },
    select: { id: true, fullName: true, coins: true },
    orderBy: { fullName: "asc" },
  });

  if (metric === "coin") {
    const ranked = students
      .map((s) => ({ leadId: s.id, fullName: s.fullName, value: s.coins }))
      .sort((a, b) => b.value - a.value);
    return NextResponse.json({ metric, mode, ranking: ranked });
  }

  const [yr, mn] = month.split("-").map(Number);
  const from = new Date(`${month}-01T00:00:00.000Z`);
  const to = new Date(Date.UTC(yr, mn, 0, 23, 59, 59, 999));

  const [lessonScores, exerciseScores] = await Promise.all([
    db.lessonScore.findMany({ where: { groupId, date: { gte: from, lte: to } }, select: { leadId: true, score: true } }),
    db.exerciseScore.findMany({
      where: { exercise: { groupId, date: { gte: from, lte: to } } },
      select: { leadId: true, score: true },
    }),
  ]);

  const byLead: Record<string, number[]> = {};
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

  return NextResponse.json({ metric, mode, ranking: ranked });
}
