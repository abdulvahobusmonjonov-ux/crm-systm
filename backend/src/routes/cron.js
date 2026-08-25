// Scheduled jobs. Under Next.js these were hit by Vercel Cron; standalone they
// need an external scheduler (systemd timer / cron / a hosted pinger) calling them
// with `Authorization: Bearer $CRON_SECRET`.
import { Router } from "express";
import { subHours } from "date-fns";
import { db } from "../lib/db.js";
import { ah } from "../lib/http.js";

const router = Router();

function cronAuth(req, res, next) {
  const authHeader = req.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// GET /api/cron/check-reminders — runs every minute
router.get("/check-reminders", cronAuth, ah(async (req, res) => {
  const now = new Date();

  // Telegram bot token: prefer DB setting, fallback to env
  const tokenSetting = await db.setting.findUnique({ where: { key: "telegram_bot_token" } });
  const botToken = tokenSetting?.value || process.env.TELEGRAM_BOT_TOKEN || "";

  // Find PENDING reminders that are due (remindAt <= now, not yet notified)
  const due = await db.reminder.findMany({
    where: { status: "PENDING", remindAt: { lte: now }, notifiedAt: null },
    include: {
      lead: { select: { id: true, fullName: true, phone: true } },
      user: { select: { id: true, fullName: true } },
    },
    take: 50,
  });

  let notified = 0;

  for (const reminder of due) {
    // Mark as notified
    await db.reminder.update({ where: { id: reminder.id }, data: { notifiedAt: now } });

    // Telegram notification if enabled
    if (reminder.notifyTelegram && botToken) {
      try {
        const setting = await db.setting.findUnique({ where: { key: `telegram_chat_id_${reminder.userId}` } });
        if (setting?.value) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: setting.value,
              text: `🔔 *Eslatma!*\n\n${reminder.title}\n\n👤 Lid: ${reminder.lead.fullName}\n📞 ${reminder.lead.phone}`,
              parse_mode: "Markdown",
            }),
          });
        }
      } catch (e) {
        console.error("Telegram error:", e);
      }
    }

    notified++;
  }

  // Mark overdue reminders (older than 1 hour without action) as MISSED
  const hourAgo = subHours(now, 1);
  await db.reminder.updateMany({
    where: { status: "PENDING", remindAt: { lte: hourAgo }, notifiedAt: { not: null } },
    data: { status: "MISSED" },
  });

  res.json({ notified, timestamp: now });
}));

async function send(token, chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
  } catch {}
}

// GET /api/cron/follow-up — daily: notify staff about leads inactive too long
router.get("/follow-up", cronAuth, ah(async (req, res) => {
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
  const byUser = {};
  const unassigned = [];
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

  res.json({ stale: stale.length, messagesSent: sent });
}));

export default router;
