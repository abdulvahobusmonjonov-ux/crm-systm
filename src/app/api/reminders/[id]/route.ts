import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const data: Prisma.ReminderUpdateInput = {};
  if (body.status) data.status = body.status;
  if (body.status === "DONE") data.completedAt = new Date();
  if (body.remindAt) data.remindAt = new Date(body.remindAt);
  if (body.title) data.title = body.title;

  const reminder = await db.reminder.update({ where: { id }, data });
  return NextResponse.json(reminder);
}
