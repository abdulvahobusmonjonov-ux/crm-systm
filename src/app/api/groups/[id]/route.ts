import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { isManager } from "@/lib/permissions";
import { hasPermission } from "@/lib/rbac";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  courseId: z.string().optional().nullable(),
  teacherId: z.string().optional().nullable(),
  days: z.string().optional().nullable(),
  timeFrom: z.string().optional().nullable(),
  timeTo: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const group = await db.group.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, name: true, color: true } },
      teacher: { select: { id: true, fullName: true } },
      leads: {
        select: { id: true, fullName: true, phone: true, stage: { select: { name: true, color: true } } },
        orderBy: { fullName: "asc" },
      },
    },
  });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(group);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user;
  const allowed = isManager(user) || await hasPermission(user, "groups", "edit");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { startDate, ...rest } = parsed.data;
  const data: Prisma.GroupUpdateInput = { ...rest };
  if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;

  const group = await db.group.update({ where: { id }, data });
  return NextResponse.json(group);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user;
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  // Detach leads (FK is SET NULL, but be explicit)
  await db.lead.updateMany({ where: { groupId: id }, data: { groupId: null } });
  await db.group.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
