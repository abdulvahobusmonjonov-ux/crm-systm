import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function send(token: string, chatId: string, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
  } catch {}
}

// Daily: notify staff about leads that have been inactive in their stage too long.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokenSetting = await db.setting.findUnique({ where: { key: "telegram_bot_token" } });
  const botToken = tokenSetting?.value || process.env.TELEGRAM_BOT_TOKEN || "";

  const daysSetting = await db.setting.findUnique({ where: { key: "followup_days" } });
  const days = Math.max(1, parseInt(daysSetting?.value || "3") || 3);
  const threshold = new Date(Date.now() - days * 24 * 3600 * 1000);

  // stale = not in won/lost stage, not enrolled/lost, untouched since threshold
  const stale = await db.lead.findMany({
    where: {
      updatedAt: { lt: threshold },
      status: { notIn: ["ENROLLED", "LOST"] },
      OR: [{ stageId: null }, { stage: { isWon: false, isLost: false } }],
    },
    select: { id: true, fullName: true, phone: true, assignedToId: true, stage: { select: { name: true } } },
    orderBy: { updatedAt: "asc" },
    take: 500,
  });

  // group by assignee
  type StaleLead = (typeof stale)[number];
  const byUser: Record<string, StaleLead[]> = {};
  const unassigned: StaleLead[] = [];
  for (const l of stale) {
    if (l.assignedToId) (byUser[l.assignedToId] ||= []).push(l);
    else unassigned.push(l);
  }

  let sent = 0;
  if (botToken) {
    for (const [userId, leads] of Object.entries(byUser)) {
      const cs = await db.setting.findUnique({ where: { key: `telegram_chat_id_${userId}` } });
      if (!cs?.value) continue;
      const list = leads.slice(0, 12).map((l) => `• ${l.fullName} — ${l.phone}${l.stage ? ` (${l.stage.name})` : ""}`).join("\n");
      const more = leads.length > 12 ? `\n…va yana ${leads.length - 12} ta` : "";
      await send(botToken, cs.value, `⏳ *Follow-up* (${days} kundan beri harakatsiz)\n\nSizda ${leads.length} ta lid e'tibor kutmoqda:\n${list}${more}`);
      sent++;
    }

    // unassigned -> admins
    if (unassigned.length) {
      const admins = await db.user.findMany({ where: { role: { in: ["SUPER_ADMIN", "ADMIN"] }, isActive: true }, select: { id: true } });
      const list = unassigned.slice(0, 12).map((l) => `• ${l.fullName} — ${l.phone}`).join("\n");
      const more = unassigned.length > 12 ? `\n…va yana ${unassigned.length - 12} ta` : "";
      for (const a of admins) {
        const cs = await db.setting.findUnique({ where: { key: `telegram_chat_id_${a.id}` } });
        if (!cs?.value) continue;
        await send(botToken, cs.value, `📥 *Biriktirilmagan lidlar* (${days} kundan beri)\n\n${unassigned.length} ta lid mas'ulsiz:\n${list}${more}`);
        sent++;
      }
    }
  }

  return NextResponse.json({ stale: stale.length, messagesSent: sent });
}
