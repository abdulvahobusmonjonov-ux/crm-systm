import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { isManager } from "@/lib/permissions";
import { hasPermission } from "@/lib/rbac";

const createSchema = z.object({
  name: z.string().min(1, "Nom kiriting"),
  courseId: z.string().optional().nullable(),
  teacherId: z.string().optional().nullable(),
  days: z.string().optional().nullable(),
  timeFrom: z.string().optional().nullable(),
  timeTo: z.string().optional().nullable(),
  room: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where: Prisma.GroupWhereInput = {};

  const [groups, total] = await Promise.all([
    db.group.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        room: true,
        days: true,
        timeFrom: true,
        timeTo: true,
        course: { select: { id: true, name: true, color: true } },
        teacher: { select: { id: true, fullName: true } },
        _count: { select: { leads: true } },
      },
    }),
    db.group.count({ where }),
  ]);

  return NextResponse.json({ groups, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user;
  const allowed = isManager(user) || await hasPermission(user, "groups", "add");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;
  const group = await db.group.create({
    data: {
      name: d.name,
      courseId: d.courseId || null,
      teacherId: d.teacherId || null,
      days: d.days || null,
      timeFrom: d.timeFrom || null,
      timeTo: d.timeTo || null,
      room: d.room || null,
      startDate: d.startDate ? new Date(d.startDate) : null,
    },
  });
  return NextResponse.json(group, { status: 201 });
}
