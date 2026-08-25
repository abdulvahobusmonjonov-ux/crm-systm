import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function getToken() {
  const s = await db.setting.findUnique({ where: { key: "telegram_bot_token" } });
  return s?.value || process.env.TELEGRAM_BOT_TOKEN || "";
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user;

  const { id } = await params;
  const { text } = await req.json();
  if (!text || !text.trim()) return NextResponse.json({ error: "Matn kiriting" }, { status: 400 });

  const lead = await db.lead.findUnique({ where: { id }, select: { telegramChatId: true, fullName: true } });
  if (!lead?.telegramChatId) return NextResponse.json({ error: "O'quvchi botga ulanmagan" }, { status: 400 });

  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Bot token saqlanmagan" }, { status: 400 });

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: lead.telegramChatId, text }),
    });
    const data = await r.json();
    if (!data.ok) return NextResponse.json({ error: data.description || "Yuborilmadi" }, { status: 400 });
    await db.activity.create({ data: { leadId: id, userId: user.id, action: "telegram_sent", details: { text } } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
