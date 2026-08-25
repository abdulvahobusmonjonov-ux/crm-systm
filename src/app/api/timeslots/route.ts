import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slots = await db.timeSlot.findMany({ orderBy: { startTime: "asc" } });
  return NextResponse.json(slots);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user;
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { startTime, endTime, label } = await req.json();
  if (!startTime || !endTime || !label) return NextResponse.json({ error: "Ma'lumot to'liq emas" }, { status: 400 });

  const slot = await db.timeSlot.create({ data: { startTime, endTime, label } });
  return NextResponse.json(slot, { status: 201 });
}
