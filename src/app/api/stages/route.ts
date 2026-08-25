import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Nom kiriting"),
  color: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stages = await db.stage.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { leads: true } } },
  });
  return NextResponse.json(stages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user;
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const last = await db.stage.findFirst({ orderBy: { order: "desc" } });
  const order = (last?.order ?? 0) + 1;

  const palette = ["#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#f97316", "#ec4899", "#8b5cf6"];
  const color = parsed.data.color || palette[order % palette.length];

  const stage = await db.stage.create({
    data: { name: parsed.data.name, color, order },
  });
  return NextResponse.json(stage, { status: 201 });
}
