import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";
import type { Session } from "next-auth";

async function getToken() {
  const s = await db.setting.findUnique({ where: { key: "telegram_bot_token" } });
  return s?.value || process.env.TELEGRAM_BOT_TOKEN || "";
}

function isAdmin(user: Session["user"]) {
  return ["SUPER_ADMIN", "ADMIN"].includes(user?.role);
}

// GET: current bot username + webhook status
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Bot token saqlanmagan" }, { status: 400 });

  try {
    const me = await (await fetch(`https://api.telegram.org/bot${token}/getMe`)).json();
    const info = await (await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)).json();
    return NextResponse.json({
      username: me?.result?.username || null,
      botName: me?.result?.first_name || null,
      webhookUrl: info?.result?.url || "",
      active: Boolean(info?.result?.url),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// POST: activate webhook for this deployment
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Bot token saqlanmagan" }, { status: 400 });

  // ensure a webhook secret exists
  let secret = (await db.setting.findUnique({ where: { key: "telegram_webhook_secret" } }))?.value;
  if (!secret) {
    secret = crypto.randomBytes(16).toString("hex");
    await db.setting.upsert({
      where: { key: "telegram_webhook_secret" },
      update: { value: secret },
      create: { key: "telegram_webhook_secret", value: secret },
    });
  }

  const origin = req.nextUrl.origin;
  const url = `${origin}/api/telegram/webhook`;

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        secret_token: secret,
        allowed_updates: ["message", "edited_message", "callback_query"],
        drop_pending_updates: true,
      }),
    });
    const data = await r.json();
    if (!data.ok) {
      return NextResponse.json({ error: data.description || "setWebhook xatosi" }, { status: 400 });
    }
    const me = await (await fetch(`https://api.telegram.org/bot${token}/getMe`)).json();
    const uname = me?.result?.username || "";
    if (uname) {
      await db.setting.upsert({
        where: { key: "telegram_bot_username" },
        update: { value: uname },
        create: { key: "telegram_bot_username", value: uname },
      });
    }
    return NextResponse.json({
      success: true,
      webhookUrl: url,
      username: uname || null,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
