import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subHours } from "date-fns";

// Vercel Cron — runs every minute: "* * * * *"
export async function GET(req: NextRequest) {
  // Verify cron secret in production
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json({ notified, timestamp: now });
}
