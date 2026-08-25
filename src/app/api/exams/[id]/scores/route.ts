import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const exam = await db.exam.findUnique({ where: { id }, select: { groupId: true, maxScore: true } });
  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const students = exam.groupId
    ? await db.lead.findMany({ where: { groupId: exam.groupId }, select: { id: true, fullName: true, phone: true }, orderBy: { fullName: "asc" } })
    : [];
  const scores = await db.score.findMany({ where: { examId: id } });
  const map: Record<string, number> = {};
  scores.forEach((s) => (map[s.leadId] = s.score));

  return NextResponse.json({
    maxScore: exam.maxScore,
    students: students.map((s) => ({ leadId: s.id, fullName: s.fullName, phone: s.phone, score: map[s.id] ?? null })),
  });
}

const schema = z.object({
  records: z.array(z.object({ leadId: z.string(), score: z.coerce.number().int().min(0), note: z.string().optional().nullable() })),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user;
  const isAdminRole = ["SUPER_ADMIN", "ADMIN"].includes(user.role);
  const canAdd = isAdminRole || user.canManageGrades || await hasPermission(user, "grades", "add");
  if (!canAdd) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  for (const r of parsed.data.records) {
    await db.score.upsert({
      where: { examId_leadId: { examId: id, leadId: r.leadId } },
      update: { score: r.score, note: r.note || null },
      create: { examId: id, leadId: r.leadId, score: r.score, note: r.note || null },
    });
  }
  return NextResponse.json({ success: true, saved: parsed.data.records.length });
}
