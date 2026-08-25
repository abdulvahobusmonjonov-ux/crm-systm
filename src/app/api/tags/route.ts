import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tags = await db.tag.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Ruxsatingiz yo'q" }, { status: 403 });
  }
  const { name, color } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  try {
    const tag = await db.tag.create({ data: { name: name.trim(), color: color || "#3B82F6" } });
    return NextResponse.json(tag, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Bu nom band" }, { status: 409 });
  }
}
