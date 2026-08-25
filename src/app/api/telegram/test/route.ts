import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function getToken() {
  const s = await db.setting.findUnique({ where: { key: "telegram_bot_token" } });
  return s?.value || process.env.TELEGRAM_BOT_TOKEN || "";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { chatId } = await req.json();
  if (!chatId) return NextResponse.json({ error: "chatId kerak" }, { status: 400 });

  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Bot token saqlanmagan" }, { status: 400 });

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "✅ *Test xabar*\n\nRobocode CRM bilan Telegram muvaffaqiyatli ulandi!",
        parse_mode: "Markdown",
      }),
    });
    const data = await r.json();
    if (!data.ok) {
      return NextResponse.json({ error: data.description || "Telegram xatosi", code: data.error_code }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
