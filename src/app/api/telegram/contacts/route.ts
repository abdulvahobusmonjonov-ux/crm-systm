import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function getToken() {
  const s = await db.setting.findUnique({ where: { key: "telegram_bot_token" } });
  return s?.value || process.env.TELEGRAM_BOT_TOKEN || "";
}

// Returns recent people who messaged the bot (via getUpdates), so admin can link chat IDs.
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Bot token saqlanmagan" }, { status: 400 });

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await r.json();
    if (!data.ok) return NextResponse.json({ error: data.description || "Telegram xatosi" }, { status: 400 });

    const seen: Record<string, { chatId: string; name: string; username: string }> = {};
    for (const u of data.result || []) {
      const chat = u.message?.chat || u.edited_message?.chat;
      if (chat && chat.id) {
        seen[String(chat.id)] = {
          chatId: String(chat.id),
          name: [chat.first_name, chat.last_name].filter(Boolean).join(" ") || chat.title || "—",
          username: chat.username ? "@" + chat.username : "",
        };
      }
    }
    return NextResponse.json({ contacts: Object.values(seen) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
