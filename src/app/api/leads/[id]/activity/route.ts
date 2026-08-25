import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = session.user;
  const { action, details } = await req.json();

  const activity = await db.activity.create({
    data: { leadId: id, userId: user.id, action, details: details || null },
  });

  return NextResponse.json(activity, { status: 201 });
}
