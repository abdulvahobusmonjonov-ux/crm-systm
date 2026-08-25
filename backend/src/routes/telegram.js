import { Router } from "express";
import crypto from "crypto";
import { db } from "../lib/db.js";
import { ah, requireRole } from "../lib/http.js";
import { verifyTelegramInitData } from "../lib/telegram-auth.js";
import { TZ } from "../lib/dates.js";

// Two routers: the admin-facing ones sit behind auth, while /webhook and
// /miniapp/profile are called by Telegram itself and authenticate via the
// webhook secret / initData signature instead of a JWT.
export const telegramAdminRouter = Router();
export const telegramPublicRouter = Router();

const adminOnly = requireRole("SUPER_ADMIN", "ADMIN");

async function getToken() {
  const s = await db.setting.findUnique({ where: { key: "telegram_bot_token" } });
  return s?.value || process.env.TELEGRAM_BOT_TOKEN || "";
}

// Next.js derived this from req.nextUrl.origin. Behind Express the public URL is
// not knowable from the socket (proxy, tunnel, different port), so it comes from
// env with a best-effort fallback.
function originOf(req) {
  return process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get("host")}`;
}

// ------------------------------------------------ GET /api/telegram/setup
telegramAdminRouter.get("/setup", adminOnly, ah(async (req, res) => {
  const token = await getToken();
  if (!token) return res.status(400).json({ error: "Bot token saqlanmagan" });

  try {
    const me = await (await fetch(`https://api.telegram.org/bot${token}/getMe`)).json();
    const info = await (await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)).json();
    res.json({
      username: me?.result?.username || null,
      botName: me?.result?.first_name || null,
      webhookUrl: info?.result?.url || "",
      active: Boolean(info?.result?.url),
    });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}));

// ----------------------------------------------- POST /api/telegram/setup
telegramAdminRouter.post("/setup", adminOnly, ah(async (req, res) => {
  const token = await getToken();
  if (!token) return res.status(400).json({ error: "Bot token saqlanmagan" });

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

  const url = `${originOf(req)}/api/telegram/webhook`;

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
    if (!data.ok) return res.status(400).json({ error: data.description || "setWebhook xatosi" });

    const me = await (await fetch(`https://api.telegram.org/bot${token}/getMe`)).json();
    const uname = me?.result?.username || "";
    if (uname) {
      await db.setting.upsert({
        where: { key: "telegram_bot_username" },
        update: { value: uname },
        create: { key: "telegram_bot_username", value: uname },
      });
    }
    res.json({ success: true, webhookUrl: url, username: uname || null });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}));

// ------------------------------------------------ POST /api/telegram/test
telegramAdminRouter.post("/test", adminOnly, ah(async (req, res) => {
  const { chatId } = req.body;
  if (!chatId) return res.status(400).json({ error: "chatId kerak" });

  const token = await getToken();
  if (!token) return res.status(400).json({ error: "Bot token saqlanmagan" });

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
    if (!data.ok) return res.status(400).json({ error: data.description || "Telegram xatosi", code: data.error_code });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}));

// -------------------------------------------- GET /api/telegram/contacts
// Recent people who messaged the bot (via getUpdates), so admin can link chat IDs.
telegramAdminRouter.get("/contacts", adminOnly, ah(async (req, res) => {
  const token = await getToken();
  if (!token) return res.status(400).json({ error: "Bot token saqlanmagan" });

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await r.json();
    if (!data.ok) return res.status(400).json({ error: data.description || "Telegram xatosi" });

    const seen = {};
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
    res.json({ contacts: Object.values(seen) });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}));

// =================== bot conversation (public webhook) ===================

async function tg(token, method, payload) {
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await r.json();
  } catch {
    return { ok: false };
  }
}

const MAIN_KB = {
  keyboard: [
    ["➕ Yangi lid", "📋 Lidlar"],
    ["🔍 Qidirish", "📊 Statistika"],
    ["📌 Mening lidlarim", "⏰ Eslatmalarim"],
  ],
  resize_keyboard: true,
};

const CANCEL_KB = { keyboard: [["❌ Bekor qilish"]], resize_keyboard: true };

function profileKeyboard(origin) {
  return {
    inline_keyboard: [[{ text: "🎓 Mening profilim", web_app: { url: `${origin}/miniapp/profil` } }]],
  };
}

async function send(token, chatId, text, kb = MAIN_KB) {
  await tg(token, "sendMessage", { chat_id: chatId, text, reply_markup: kb });
}

// ---- per-chat conversation state (stored in Setting) ----
async function getState(chatId) {
  const s = await db.setting.findUnique({ where: { key: `tg_state_${chatId}` } });
  if (!s) return null;
  try { return JSON.parse(s.value); } catch { return null; }
}
async function setState(chatId, obj) {
  await db.setting.upsert({
    where: { key: `tg_state_${chatId}` },
    update: { value: JSON.stringify(obj) },
    create: { key: `tg_state_${chatId}`, value: JSON.stringify(obj) },
  });
}
async function clearState(chatId) {
  await db.setting.deleteMany({ where: { key: `tg_state_${chatId}` } });
}

function startOfTodayTashkent() {
  const t = new Date(Date.now() + TZ);
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) - TZ);
}

async function findUserByChat(chatId) {
  const s = await db.setting.findFirst({
    where: { key: { startsWith: "telegram_chat_id_" }, value: String(chatId) },
  });
  if (!s) return null;
  const userId = s.key.replace("telegram_chat_id_", "");
  return db.user.findUnique({ where: { id: userId } });
}

async function findLeadByChat(chatId) {
  return db.lead.findFirst({ where: { telegramChatId: String(chatId), isArchived: false } });
}

function cleanPhone(t) {
  return t.replace(/[^\d+]/g, "");
}

async function courseKeyboard() {
  const courses = await db.course.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, take: 20 });
  const rows = [];
  for (let i = 0; i < courses.length; i += 2) {
    rows.push(courses.slice(i, i + 2).map((c) => ({ text: c.name, callback_data: `course:${c.id}` })));
  }
  rows.push([{ text: "➡️ Kurssiz davom etish", callback_data: "course:skip" }]);
  return { inline_keyboard: rows };
}

async function createLead(token, chatId, userId, data, courseId) {
  const newStage = await db.stage.findFirst({ orderBy: { order: "asc" } });
  const course = courseId ? await db.course.findUnique({ where: { id: courseId } }) : null;
  const lead = await db.lead.create({
    data: {
      fullName: data.name,
      phone: data.phone,
      source: "TELEGRAM",
      createdById: userId,
      assignedToId: userId,
      stageId: newStage?.id || null,
      courseId: courseId || null,
    },
  });
  await db.activity.create({
    data: { leadId: lead.id, userId, action: "created", details: { via: "telegram" } },
  });
  await clearState(chatId);
  let msg = `✅ Yangi lid saytga qo'shildi!\n\n👤 ${data.name}\n📞 ${data.phone}`;
  if (course) msg += `\n📚 ${course.name}`;
  if (newStage) msg += `\n🏷 ${newStage.name}`;
  await send(token, chatId, msg);
}

async function doSearch(token, chatId, q) {
  const isPhone = /^\+?[\d\s\-]{5,}$/.test(q);
  const leads = await db.lead.findMany({
    where: isPhone ? { phone: { contains: cleanPhone(q).replace(/\+/g, "") } } : { fullName: { contains: q, mode: "insensitive" } },
    take: 6,
    include: { course: true, stage: true, assignedTo: true },
    orderBy: { createdAt: "desc" },
  });
  if (!leads.length) { await send(token, chatId, `🔍 "${q}" topilmadi.`); return; }
  let out = `🔍 Natijalar (${leads.length}):\n\n`;
  for (const l of leads) {
    out += `👤 ${l.fullName}\n📞 ${l.phone}\n`;
    if (l.course) out += `📚 ${l.course.name}\n`;
    if (l.stage) out += `🏷 ${l.stage.name}\n`;
    if (l.assignedTo) out += `👨‍💼 ${l.assignedTo.fullName}\n`;
    out += `\n`;
  }
  await send(token, chatId, out.trim());
}

// ------------------------------------------- POST /api/telegram/webhook
telegramPublicRouter.post("/webhook", ah(async (req, res) => {
  const token = await getToken();
  if (!token) return res.json({ ok: true });
  const origin = originOf(req);

  const secretSetting = await db.setting.findUnique({ where: { key: "telegram_webhook_secret" } });
  if (secretSetting?.value) {
    if (req.get("x-telegram-bot-api-secret-token") !== secretSetting.value) return res.json({ ok: true });
  }

  const update = req.body;
  if (!update || typeof update !== "object") return res.json({ ok: true });

  // ---------- CALLBACK (inline buttons: course selection) ----------
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message?.chat?.id;
    const data = cq.data || "";
    await tg(token, "answerCallbackQuery", { callback_query_id: cq.id });
    if (!chatId) return res.json({ ok: true });

    const user = await findUserByChat(chatId);
    if (!user) return res.json({ ok: true });

    if (data.startsWith("course:")) {
      const st = await getState(chatId);
      const { name, phone } = st?.data || {};
      if (st?.step === "course" && name && phone) {
        const courseId = data === "course:skip" ? null : data.replace("course:", "");
        await createLead(token, chatId, user.id, { name, phone }, courseId);
      } else {
        await send(token, chatId, "Bu amal eskirgan. Qaytadan «➕ Yangi lid» bosing.");
      }
    }
    return res.json({ ok: true });
  }

  // ---------- MESSAGES ----------
  const msg = update.message || update.edited_message;
  const chatId = msg?.chat?.id;
  const text = (msg?.text || "").trim();
  if (!chatId) return res.json({ ok: true });

  try {
    // /start [code] -> link account
    if (text.startsWith("/start")) {
      const code = text.split(/\s+/)[1];
      if (code && code.startsWith("s_")) {
        const leadId = code.slice(2);
        const lead = await db.lead.findUnique({ where: { id: leadId } });
        if (lead) {
          await db.lead.update({ where: { id: leadId }, data: { telegramChatId: String(chatId) } });
          await send(
            token,
            chatId,
            `✅ Salom, ${lead.fullName}!\nSiz o'quv markaz botiga ulandingiz. Endi bu yerda dars va to'lov eslatmalarini olasiz.\n\nProfilingizni (jadval, davomat, to'lov, baholar) pastdagi tugma orqali ko'rishingiz mumkin 👇`,
            profileKeyboard(origin)
          );
          return res.json({ ok: true });
        }
      }
      if (code && !code.startsWith("s_")) {
        const u = await db.user.findUnique({ where: { id: code } });
        if (u && u.isActive) {
          await db.setting.upsert({
            where: { key: `telegram_chat_id_${u.id}` },
            update: { value: String(chatId) },
            create: { key: `telegram_chat_id_${u.id}`, value: String(chatId) },
          });
          await send(token, chatId, `✅ Salom, ${u.fullName}!\nTizimga ulandingiz. Quyidagi tugmalardan foydalaning:`);
          return res.json({ ok: true });
        }
      }
      const already = await findUserByChat(chatId);
      if (already) {
        await send(token, chatId, `Salom, ${already.fullName}! 👋\nQuyidagi tugmalardan foydalaning:`);
        return res.json({ ok: true });
      }
      const alreadyLead = await findLeadByChat(chatId);
      if (alreadyLead) {
        await send(
          token,
          chatId,
          `Salom, ${alreadyLead.fullName}! 👋\nProfilingizni pastdagi tugma orqali ko'rishingiz mumkin 👇`,
          profileKeyboard(origin)
        );
        return res.json({ ok: true });
      }
      await send(token, chatId, "👋 Salom! Bu — Robocode CRM boti.\nUlanish uchun adminingizdan shaxsiy havola oling.", { remove_keyboard: true });
      return res.json({ ok: true });
    }

    const user = await findUserByChat(chatId);
    if (!user) {
      const lead = await findLeadByChat(chatId);
      if (lead) {
        await send(token, chatId, "Profilingizni pastdagi tugma orqali ko'rishingiz mumkin 👇", profileKeyboard(origin));
        return res.json({ ok: true });
      }
      await send(token, chatId, "🔒 Siz hali ulanmagansiz.\nAdminingizdan shaxsiy havola oling va Start bosing.", { remove_keyboard: true });
      return res.json({ ok: true });
    }

    // cancel
    if (text === "❌ Bekor qilish" || text === "/bekor") {
      await clearState(chatId);
      await send(token, chatId, "Bekor qilindi.");
      return res.json({ ok: true });
    }

    // ----- active multi-step state -----
    const state = await getState(chatId);
    if (state && !["➕ Yangi lid", "📋 Lidlar", "🔍 Qidirish", "📊 Statistika", "📌 Mening lidlarim", "⏰ Eslatmalarim"].includes(text)) {
      if (state.step === "name") {
        if (text.length < 2) { await send(token, chatId, "Ism juda qisqa. Qaytadan yuboring:", CANCEL_KB); return res.json({ ok: true }); }
        await setState(chatId, { step: "phone", data: { name: text } });
        await send(token, chatId, "📞 Telefon raqamni yuboring (masalan +998901234567):", CANCEL_KB);
        return res.json({ ok: true });
      }
      if (state.step === "phone") {
        const phone = cleanPhone(text);
        if (phone.replace(/\D/g, "").length < 7) { await send(token, chatId, "Telefon noto'g'ri. Qaytadan yuboring:", CANCEL_KB); return res.json({ ok: true }); }
        await setState(chatId, { step: "course", data: { ...state.data, phone } });
        await tg(token, "sendMessage", { chat_id: chatId, text: "📚 Kursni tanlang:", reply_markup: await courseKeyboard() });
        return res.json({ ok: true });
      }
      if (state.step === "search") {
        await clearState(chatId);
        await doSearch(token, chatId, text);
        return res.json({ ok: true });
      }
    }

    // ----- menu buttons -----
    if (text === "➕ Yangi lid" || text === "/yangi") {
      await setState(chatId, { step: "name", data: {} });
      await send(token, chatId, "👤 Yangi lid qo'shamiz.\nIsm familiyani yuboring:", CANCEL_KB);
      return res.json({ ok: true });
    }

    if (text === "🔍 Qidirish" || text === "/qidir") {
      await setState(chatId, { step: "search" });
      await send(token, chatId, "🔍 Telefon raqam yoki ismni yuboring:", CANCEL_KB);
      return res.json({ ok: true });
    }

    if (text === "📊 Statistika" || text === "/stat") {
      await clearState(chatId);
      const since = startOfTodayTashkent();
      const [today, total, stages, rem] = await Promise.all([
        db.lead.count({ where: { createdAt: { gte: since } } }),
        db.lead.count(),
        db.stage.findMany({ orderBy: { order: "asc" } }),
        db.reminder.count({ where: { status: "PENDING", userId: user.id } }),
      ]);
      const counts = await Promise.all(stages.map((s) => db.lead.count({ where: { stageId: s.id } })));
      let out = `📊 Statistika\n\n🆕 Bugun: ${today}\n👥 Jami lidlar: ${total}\n⏰ Eslatmalaringiz: ${rem}\n`;
      if (stages.length) { out += `\nBosqichlar:\n`; stages.forEach((s, i) => (out += `• ${s.name}: ${counts[i]}\n`)); }
      await send(token, chatId, out.trim());
      return res.json({ ok: true });
    }

    if (text === "📋 Lidlar" || text === "/lidlar") {
      await clearState(chatId);
      const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 7, include: { course: true, stage: true } });
      if (!leads.length) { await send(token, chatId, "Hozircha lid yo'q."); return res.json({ ok: true }); }
      let out = "📋 Oxirgi lidlar:\n\n";
      for (const l of leads) { out += `👤 ${l.fullName}\n📞 ${l.phone}\n`; if (l.course) out += `📚 ${l.course.name}\n`; if (l.stage) out += `🏷 ${l.stage.name}\n`; out += `\n`; }
      await send(token, chatId, out.trim());
      return res.json({ ok: true });
    }

    if (text === "📌 Mening lidlarim") {
      await clearState(chatId);
      const leads = await db.lead.findMany({ where: { assignedToId: user.id }, orderBy: { createdAt: "desc" }, take: 7, include: { course: true, stage: true } });
      if (!leads.length) { await send(token, chatId, "Sizga biriktirilgan lid yo'q."); return res.json({ ok: true }); }
      let out = "📌 Mening lidlarim:\n\n";
      for (const l of leads) { out += `👤 ${l.fullName}\n📞 ${l.phone}\n`; if (l.stage) out += `🏷 ${l.stage.name}\n`; out += `\n`; }
      await send(token, chatId, out.trim());
      return res.json({ ok: true });
    }

    if (text === "⏰ Eslatmalarim") {
      await clearState(chatId);
      const rems = await db.reminder.findMany({ where: { userId: user.id, status: "PENDING" }, orderBy: { remindAt: "asc" }, take: 7, include: { lead: true } });
      if (!rems.length) { await send(token, chatId, "Faol eslatma yo'q."); return res.json({ ok: true }); }
      let out = "⏰ Eslatmalaringiz:\n\n";
      for (const r of rems) {
        const d = new Date(r.remindAt.getTime() + TZ);
        const dd = `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
        out += `• ${r.title}\n  ${r.lead ? "👤 " + r.lead.fullName + "\n  " : ""}🕐 ${dd}\n`;
      }
      await send(token, chatId, out.trim());
      return res.json({ ok: true });
    }

    if (text === "/yordam" || text === "/help" || text === "/menu") {
      await send(token, chatId, "Quyidagi tugmalardan foydalaning 👇");
      return res.json({ ok: true });
    }

    // quick add: "Ism, +998..."
    const m = text.match(/^(.+?),\s*(\+?\d[\d\s\-]{6,})$/);
    if (m) {
      await createLead(token, chatId, user.id, { name: m[1].trim(), phone: cleanPhone(m[2]) }, null);
      return res.json({ ok: true });
    }

    // fallback -> search
    await doSearch(token, chatId, text);
    return res.json({ ok: true });
  } catch {
    try { await send(token, chatId, "⚠️ Xatolik yuz berdi. Qaytadan urinib ko'ring."); } catch {}
    return res.json({ ok: true });
  }
}));

// ------------------------------- POST /api/telegram/miniapp/profile
function ym(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

telegramPublicRouter.post("/miniapp/profile", ah(async (req, res) => {
  const token = await getToken();
  if (!token) return res.status(500).json({ error: "Bot sozlanmagan" });

  const initData = req.body?.initData || "";
  const result = verifyTelegramInitData(initData, token);
  if (!result.valid || !result.user) {
    return res.status(401).json({ error: "Tasdiqlanmadi", reason: result.error });
  }

  const chatId = String(result.user.id);
  const lead = await db.lead.findFirst({
    where: { telegramChatId: chatId, isArchived: false },
    include: {
      course: true,
      group: { include: { teacher: true, course: true } },
      timeSlot: true,
    },
  });

  if (!lead) return res.status(404).json({ error: "not_linked" });

  const [attendances, payments, scores] = await Promise.all([
    db.attendance.findMany({ where: { leadId: lead.id }, orderBy: { date: "desc" }, take: 30 }),
    db.payment.findMany({ where: { leadId: lead.id }, orderBy: { paidAt: "desc" }, take: 10 }),
    db.score.findMany({ where: { leadId: lead.id }, include: { exam: true }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  const attTotal = attendances.length;
  const attPresent = attendances.filter((a) => a.status === "present" || a.status === "late").length;
  const attAbsent = attendances.filter((a) => a.status === "absent").length;
  const attLate = attendances.filter((a) => a.status === "late").length;
  const attExcused = attendances.filter((a) => a.status === "excused").length;
  const attPercent = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : null;

  const currentMonthStr = ym(new Date());
  const paidThisMonth = payments.some((p) => p.forMonth === currentMonthStr);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount) - Number(p.discount || 0), 0);

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length) : null;

  res.json({
    student: {
      fullName: lead.fullName,
      phone: lead.phone,
      coins: lead.coins,
      courseName: lead.course?.name || null,
    },
    group: lead.group
      ? {
          name: lead.group.name,
          courseName: lead.group.course?.name || null,
          teacherName: lead.group.teacher?.fullName || null,
          days: lead.group.days,
          timeFrom: lead.group.timeFrom,
          timeTo: lead.group.timeTo,
          room: lead.group.room,
        }
      : null,
    attendance: {
      total: attTotal,
      present: attPresent,
      absent: attAbsent,
      late: attLate,
      excused: attExcused,
      percent: attPercent,
      recent: attendances.slice(0, 10).map((a) => ({ date: a.date, status: a.status })),
    },
    payments: {
      paidThisMonth,
      currentMonth: currentMonthStr,
      totalPaid,
      history: payments.map((p) => ({
        amount: Number(p.amount),
        discount: p.discount ? Number(p.discount) : null,
        forMonth: p.forMonth,
        paidAt: p.paidAt,
        type: p.type,
      })),
    },
    scores: {
      average: avgScore,
      list: scores.map((s) => ({
        examTitle: s.exam.title,
        date: s.exam.date,
        score: s.score,
        maxScore: s.exam.maxScore,
      })),
    },
  });
}));
