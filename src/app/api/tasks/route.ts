import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { isManager } from "@/lib/permissions";
import { hasPermission } from "@/lib/rbac";

const createSchema = z.object({
  title: z.string().min(2, "Sarlavha kamida 2 harf"),
  description: z.string().optional(),
  type: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
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

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const assignedToId = searchParams.get("assignedToId") || ""; // xodim
  const type = searchParams.get("type") || ""; // tur
  const tagId = searchParams.get("tagId") || ""; // teg
  const status = searchParams.get("status") || "";
  const overdue = searchParams.get("overdue") === "1";
  const dueFrom = searchParams.get("dueFrom") || ""; // muddat
  const dueTo = searchParams.get("dueTo") || "";

  const where: Prisma.TaskWhereInput = {};

  if (assignedToId === "unassigned") where.assignedToId = null;
  else if (assignedToId) where.assignedToId = assignedToId;

  if (type) where.type = type;
  if (tagId) where.tags = { some: { id: tagId } };
  if (status) where.status = status as Prisma.EnumTaskStatusFilter["equals"];

  if (overdue) {
    where.dueDate = { lt: new Date() };
    where.status = { not: "DONE" };
  } else if (dueFrom || dueTo) {
    const dueDate: Prisma.DateTimeNullableFilter = {};
    if (dueFrom) dueDate.gte = new Date(dueFrom);
    if (dueTo) dueDate.lte = new Date(dueTo + "T23:59:59");
    where.dueDate = dueDate;
  }

  const [tasks, total] = await Promise.all([
    db.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      select: taskSelect,
    }),
    db.task.count({ where }),
  ]);

  return NextResponse.json({ tasks, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { tagIds, dueDate, assignedToId, ...rest } = parsed.data;

  // Everyone can add a task for themselves; assigning it to someone else is an
  // administrative action that needs the "tasks:add" permission (or manager+).
  const assigningOthers = assignedToId && assignedToId !== user.id;
  if (assigningOthers && !isManager(user) && !(await hasPermission(user, "tasks", "add"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const task = await db.task.create({
    data: {
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedToId: assignedToId || null,
      createdById: user.id,
      tags: tagIds?.length ? { connect: tagIds.map((id) => ({ id })) } : undefined,
    },
    select: taskSelect,
  });

  return NextResponse.json(task, { status: 201 });
}
