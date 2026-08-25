import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Session } from "next-auth";

const schema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

function canManage(user: Session["user"]) {
  return ["SUPER_ADMIN", "ADMIN"].includes(user.role);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const prefix = searchParams.get("prefix") || "";

  const settings = await db.setting.findMany(
    prefix ? { where: { key: { startsWith: prefix } } } : undefined
  );
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return NextResponse.json(map);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManage(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { key, value } = parsed.data;
  const setting = await db.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  return NextResponse.json({ key: setting.key, value: setting.value });
}
