import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendSms } from "@/lib/sms";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { phone, text } = await req.json();
  if (!phone || !text) return NextResponse.json({ error: "Telefon va matn kerak" }, { status: 400 });
  const r = await sendSms(phone, text);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ success: true });
}
