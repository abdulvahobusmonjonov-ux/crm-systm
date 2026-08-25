import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface TgChat { id: number; first_name?: string; last_name?: string; title?: string; username?: string; }
interface TgMessage { chat?: TgChat; text?: string; }
interface TgCallbackQuery { id: string; data?: string; message?: { chat?: TgChat }; }
interface TgUpdate { message?: TgMessage; edited_message?: TgMessage; callback_query?: TgCallbackQuery; }
interface LeadDraft { name: string; phone: string; }
interface ConvState { step: "name" | "phone" | "course" | "search"; data?: Partial<LeadDraft>; }

async function getToken() {
  const s = await db.setting.findUnique({ where: { key: "telegram_bot_token" } });
  return s?.value || process.env.TELEGRAM_BOT_TOKEN || "";
}

async function tg(token: string, method: string, payload: Record<string, unknown>) {
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

function profileKeyboard(origin: string) {
  return {
    inline_keyboard: [[{ text: "🎓 Mening profilim", web_app: { url: `${origin}/miniapp/profil` } }]],
  };
}

async function send(token: string, chatId: number | string, text: string, kb: Record<string, unknown> = MAIN_KB) {
  await tg(token, "sendMessage", { chat_id: chatId, text, reply_markup: kb });
}

// ---- per-chat conversation state (stored in Setting) ----
async function getState(chatId: number | string): Promise<ConvState | null> {
  const s = await db.setting.findUnique({ where: { key: `tg_state_${chatId}` } });
  if (!s) return null;
  try { return JSON.parse(s.value); } catch { return null; }
}
async function setState(chatId: number | string, obj: ConvState) {
  await db.setting.upsert({
    where: { key: `tg_state_${chatId}` },
    update: { value: JSON.stringify(obj) },
    create: { key: `tg_state_${chatId}`, value: JSON.stringify(obj) },
  });
}
async function clearState(chatId: number | string) {
  await db.setting.deleteMany({ where: { key: `tg_state_${chatId}` } });
}

function startOfTodayTashkent() {
  const TZ = 5 * 3600 * 1000;
  const t = new Date(Date.now() + TZ);
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) - TZ);
}

async function findUserByChat(chatId: number | string) {
  const s = await db.setting.findFirst({
    where: { key: { startsWith: "telegram_chat_id_" }, value: String(chatId) },
  });
  if (!s) return null;
  const userId = s.key.replace("telegram_chat_id_", "");
  return db.user.findUnique({ where: { id: userId } });
}

async function findLeadByChat(chatId: number | string) {
  return db.lead.findFirst({ where: { telegramChatId: String(chatId), isArchived: false } });
}

function cleanPhone(t: string) {
  return t.replace(/[^\d+]/g, "");
}

async function courseKeyboard() {
  const courses = await db.course.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, take: 20 });
  const rows: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < courses.length; i += 2) {
    rows.push(
      courses.slice(i, i + 2).map((c) => ({ text: c.name, callback_data: `course:${c.id}` }))
    );
  }
  rows.push([{ text: "➡️ Kurssiz davom etish", callback_data: "course:skip" }]);
  return { inline_keyboard: rows };
}

async function createLead(token: string, chatId: number, userId: string, data: LeadDraft, courseId: string | null) {
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

export async function POST(req: NextRequest) {
  const token = await getToken();
  if (!token) return NextResponse.json({ ok: true });
  const origin = req.nextUrl.origin;

  const secretSetting = await db.setting.findUnique({ where: { key: "telegram_webhook_secret" } });
  if (secretSetting?.value) {
    if (req.headers.get("x-telegram-bot-api-secret-token") !== secretSetting.value)
      return NextResponse.json({ ok: true });
  }

  let update: TgUpdate;
  try { update = await req.json(); } catch { return NextResponse.json({ ok: true }); }

  // ---------- CALLBACK (inline buttons: course selection) ----------
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message?.chat?.id;
    const data: string = cq.data || "";
    await tg(token, "answerCallbackQuery", { callback_query_id: cq.id });
    if (!chatId) return NextResponse.json({ ok: true });

    const user = await findUserByChat(chatId);
    if (!user) return NextResponse.json({ ok: true });

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
    return NextResponse.json({ ok: true });
  }

  // ---------- MESSAGES ----------
  const msg = update.message || update.edited_message;
  const chatId: number | undefined = msg?.chat?.id;
  const text: string = (msg?.text || "").trim();
  if (!chatId) return NextResponse.json({ ok: true });

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
          return NextResponse.json({ ok: true });
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
          return NextResponse.json({ ok: true });
        }
      }
      const already = await findUserByChat(chatId);
      if (already) {
        await send(token, chatId, `Salom, ${already.fullName}! 👋\nQuyidagi tugmalardan foydalaning:`);
        return NextResponse.json({ ok: true });
      }
      const alreadyLead = await findLeadByChat(chatId);
      if (alreadyLead) {
        await send(
          token,
          chatId,
          `Salom, ${alreadyLead.fullName}! 👋\nProfilingizni pastdagi tugma orqali ko'rishingiz mumkin 👇`,
          profileKeyboard(origin)
        );
        return NextResponse.json({ ok: true });
      }
      await send(token, chatId, "👋 Salom! Bu — Robocode CRM boti.\nUlanish uchun adminingizdan shaxsiy havola oling.", { remove_keyboard: true });
      return NextResponse.json({ ok: true });
    }

    const user = await findUserByChat(chatId);
    if (!user) {
      const lead = await findLeadByChat(chatId);
      if (lead) {
        await send(token, chatId, "Profilingizni pastdagi tugma orqali ko'rishingiz mumkin 👇", profileKeyboard(origin));
        return NextResponse.json({ ok: true });
      }
      await send(token, chatId, "🔒 Siz hali ulanmagansiz.\nAdminingizdan shaxsiy havola oling va Start bosing.", { remove_keyboard: true });
      return NextResponse.json({ ok: true });
    }

    // cancel
    if (text === "❌ Bekor qilish" || text === "/bekor") {
      await clearState(chatId);
      await send(token, chatId, "Bekor qilindi.");
      return NextResponse.json({ ok: true });
    }

    // ----- active multi-step state -----
    const state = await getState(chatId);
    if (state && !["➕ Yangi lid","📋 Lidlar","🔍 Qidirish","📊 Statistika","📌 Mening lidlarim","⏰ Eslatmalarim"].includes(text)) {
      if (state.step === "name") {
        if (text.length < 2) { await send(token, chatId, "Ism juda qisqa. Qaytadan yuboring:", CANCEL_KB); return NextResponse.json({ ok: true }); }
        await setState(chatId, { step: "phone", data: { name: text } });
        await send(token, chatId, "📞 Telefon raqamni yuboring (masalan +998901234567):", CANCEL_KB);
        return NextResponse.json({ ok: true });
      }
      if (state.step === "phone") {
        const phone = cleanPhone(text);
        if (phone.replace(/\D/g, "").length < 7) { await send(token, chatId, "Telefon noto'g'ri. Qaytadan yuboring:", CANCEL_KB); return NextResponse.json({ ok: true }); }
        await setState(chatId, { step: "course", data: { ...state.data, phone } });
        await tg(token, "sendMessage", { chat_id: chatId, text: "📚 Kursni tanlang:", reply_markup: await courseKeyboard() });
        return NextResponse.json({ ok: true });
      }
      if (state.step === "search") {
        await clearState(chatId);
        await doSearch(token, chatId, text);
        return NextResponse.json({ ok: true });
      }
    }

    // ----- menu buttons -----
    if (text === "➕ Yangi lid" || text === "/yangi") {
      await setState(chatId, { step: "name", data: {} });
      await send(token, chatId, "👤 Yangi lid qo'shamiz.\nIsm familiyani yuboring:", CANCEL_KB);
      return NextResponse.json({ ok: true });
    }

    if (text === "🔍 Qidirish" || text === "/qidir") {
      await setState(chatId, { step: "search" });
      await send(token, chatId, "🔍 Telefon raqam yoki ismni yuboring:", CANCEL_KB);
      return NextResponse.json({ ok: true });
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
      return NextResponse.json({ ok: true });
    }

    if (text === "📋 Lidlar" || text === "/lidlar") {
      await clearState(chatId);
      const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 7, include: { course: true, stage: true } });
      if (!leads.length) { await send(token, chatId, "Hozircha lid yo'q."); return NextResponse.json({ ok: true }); }
      let out = "📋 Oxirgi lidlar:\n\n";
      for (const l of leads) { out += `👤 ${l.fullName}\n📞 ${l.phone}\n`; if (l.course) out += `📚 ${l.course.name}\n`; if (l.stage) out += `🏷 ${l.stage.name}\n`; out += `\n`; }
      await send(token, chatId, out.trim());
      return NextResponse.json({ ok: true });
    }

    if (text === "📌 Mening lidlarim") {
      await clearState(chatId);
      const leads = await db.lead.findMany({ where: { assignedToId: user.id }, orderBy: { createdAt: "desc" }, take: 7, include: { course: true, stage: true } });
      if (!leads.length) { await send(token, chatId, "Sizga biriktirilgan lid yo'q."); return NextResponse.json({ ok: true }); }
      let out = "📌 Mening lidlarim:\n\n";
      for (const l of leads) { out += `👤 ${l.fullName}\n📞 ${l.phone}\n`; if (l.stage) out += `🏷 ${l.stage.name}\n`; out += `\n`; }
      await send(token, chatId, out.trim());
      return NextResponse.json({ ok: true });
    }

    if (text === "⏰ Eslatmalarim") {
      await clearState(chatId);
      const rems = await db.reminder.findMany({ where: { userId: user.id, status: "PENDING" }, orderBy: { remindAt: "asc" }, take: 7, include: { lead: true } });
      if (!rems.length) { await send(token, chatId, "Faol eslatma yo'q."); return NextResponse.json({ ok: true }); }
      let out = "⏰ Eslatmalaringiz:\n\n";
      for (const r of rems) {
        const d = new Date(r.remindAt.getTime() + 5 * 3600 * 1000);
        const dd = `${String(d.getUTCDate()).padStart(2,"0")}.${String(d.getUTCMonth()+1).padStart(2,"0")} ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`;
        out += `• ${r.title}\n  ${r.lead ? "👤 " + r.lead.fullName + "\n  " : ""}🕐 ${dd}\n`;
      }
      await send(token, chatId, out.trim());
      return NextResponse.json({ ok: true });
    }

    if (text === "/yordam" || text === "/help" || text === "/menu") {
      await send(token, chatId, "Quyidagi tugmalardan foydalaning 👇");
      return NextResponse.json({ ok: true });
    }

    // quick add: "Ism, +998..."
    const m = text.match(/^(.+?),\s*(\+?\d[\d\s\-]{6,})$/);
    if (m) {
      await createLead(token, chatId, user.id, { name: m[1].trim(), phone: cleanPhone(m[2]) }, null);
      return NextResponse.json({ ok: true });
    }

    // fallback -> search
    await doSearch(token, chatId, text);
    return NextResponse.json({ ok: true });
  } catch {
    try { await send(token, chatId, "⚠️ Xatolik yuz berdi. Qaytadan urinib ko'ring."); } catch {}
    return NextResponse.json({ ok: true });
  }
}

async function doSearch(token: string, chatId: number, q: string) {
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
