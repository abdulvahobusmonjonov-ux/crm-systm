import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Session } from "next-auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  order: z.number().int().optional(),
  isWon: z.boolean().optional(),
  isLost: z.boolean().optional(),
});

function canManage(user: Session["user"]) {
  return ["SUPER_ADMIN", "ADMIN"].includes(user.role);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManage(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const stage = await db.stage.update({ where: { id }, data: parsed.data });
  return NextResponse.json(stage);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManage(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Move leads from this stage to the first remaining stage (or null if none left)
  const fallback = await db.stage.findFirst({
    where: { id: { not: id } },
    orderBy: { order: "asc" },
  });
  await db.lead.updateMany({ where: { stageId: id }, data: { stageId: fallback?.id ?? null } });
  await db.stage.delete({ where: { id } });

  return NextResponse.json({ success: true, movedTo: fallback?.id ?? null });
}
