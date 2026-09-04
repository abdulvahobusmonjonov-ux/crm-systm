import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

const schema = z.object({
  salary: z.coerce.number().min(0).optional(),
  subject: z.string().optional().nullable(),
  rating: z.coerce.number().int().min(0).max(5).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data: Prisma.UserUpdateInput = {};
  if (parsed.data.salary !== undefined) data.salary = parsed.data.salary;
  if (parsed.data.subject !== undefined) data.subject = parsed.data.subject || null;
  if (parsed.data.rating !== undefined) data.rating = parsed.data.rating;

  const updated = await db.user.update({ where: { id }, data, select: { id: true, salary: true, subject: true, rating: true } });
  return NextResponse.json({ id: updated.id, salary: updated.salary ? Number(updated.salary) : 0, subject: updated.subject || "", rating: updated.rating });
}
