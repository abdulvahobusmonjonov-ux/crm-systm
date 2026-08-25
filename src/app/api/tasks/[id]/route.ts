import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import type { Prisma } from "@/generated/prisma/client";
import { isManager } from "@/lib/permissions";
import { hasPermission } from "@/lib/rbac";

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  tagIds: z.array(z.string()).optional(),
});

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  type: true,
  dueDate: true,
  createdAt: true,
  assignedTo: { select: { id: true, fullName: true } },
  createdBy: { select: { id: true, fullName: true } },
  tags: { select: { id: true, name: true, color: true } },
} satisfies Prisma.TaskSelect;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const current = await db.task.findUnique({ where: { id }, select: { status: true, createdById: true, assignedToId: true } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwnTask = current.createdById === user.id || current.assignedToId === user.id;
  if (!isOwnTask && !isManager(user) && !(await hasPermission(user, "tasks", "edit"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { tagIds, dueDate, ...rest } = parsed.data;
  const updateData: Prisma.TaskUpdateInput = { ...rest };
  if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
  if (tagIds !== undefined) updateData.tags = { set: tagIds.map((tagId) => ({ id: tagId })) };

  const task = await db.task.update({ where: { id }, data: updateData, select: taskSelect });

  if (parsed.data.status && parsed.data.status !== current.status) {
    await logAudit(user.id, user.name || user.fullName, "task_status_changed", "Task", id, {
      from: current.status,
      to: parsed.data.status,
    });
  }

  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user;

  const { id } = await params;
  const current = await db.task.findUnique({ where: { id }, select: { createdById: true } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwnTask = current.createdById === user.id;
  if (!isOwnTask && !isManager(user) && !(await hasPermission(user, "tasks", "delete"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.task.delete({ where: { id } });
  await logAudit(user.id, user.name || user.fullName, "task_deleted", "Task", id);
  return NextResponse.json({ success: true });
}
