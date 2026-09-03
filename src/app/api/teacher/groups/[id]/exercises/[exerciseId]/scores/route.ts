import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { canGradeGroup } from "@/lib/teacher";
import { canManageGrades } from "@/lib/permissions";

const saveSchema = z.object({
  records: z.array(z.object({ leadId: z.string(), score: z.number().min(0).max(100) })),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; exerciseId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageGrades(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: groupId, exerciseId } = await params;
  if (!(await canGradeGroup(session.user, groupId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const exercise = await db.exercise.findUnique({ where: { id: exerciseId }, select: { groupId: true } });
  if (!exercise || exercise.groupId !== groupId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  for (const r of parsed.data.records) {
    await db.exerciseScore.upsert({
      where: { exerciseId_leadId: { exerciseId, leadId: r.leadId } },
      update: { score: r.score },
      create: { exerciseId, leadId: r.leadId, score: r.score },
    });
  }

  return NextResponse.json({ success: true, saved: parsed.data.records.length });
}
