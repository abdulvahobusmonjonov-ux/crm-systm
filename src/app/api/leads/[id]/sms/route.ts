import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendSms } from "@/lib/sms";
import { hasPermission } from "@/lib/rbac";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user;
  if (!(await hasPermission(user, "sms_messages", "send_sms"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { text } = await req.json();
  if (!text || !text.trim()) return NextResponse.json({ error: "Matn kiriting" }, { status: 400 });

  const lead = await db.lead.findUnique({ where: { id }, select: { phone: true } });
  if (!lead) return NextResponse.json({ error: "O'quvchi topilmadi" }, { status: 404 });

  const result = await sendSms(lead.phone, text);
  if (!result.ok) return NextResponse.json({ error: result.error || "Yuborilmadi" }, { status: 400 });

  await db.activity.create({ data: { leadId: id, userId: user.id, action: "sms_sent", details: { text } } });
  return NextResponse.json({ success: true });
}
