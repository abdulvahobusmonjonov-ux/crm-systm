import { db } from "./db.js";

const ESKIZ = "https://notify.eskiz.uz/api";

async function getSetting(key) {
  const s = await db.setting.findUnique({ where: { key } });
  return s?.value || "";
}
async function setSetting(key, value) {
  await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

// Login to Eskiz with stored email/password, cache the token.
async function login() {
  const email = await getSetting("eskiz_email");
  const password = await getSetting("eskiz_password");
  if (!email || !password) return null;
  try {
    const fd = new FormData();
    fd.append("email", email);
    fd.append("password", password);
    const r = await fetch(`${ESKIZ}/auth/login`, { method: "POST", body: fd });
    const j = await r.json();
    const token = j?.data?.token;
    if (token) { await setSetting("eskiz_token", token); return token; }
    return null;
  } catch {
    return null;
  }
}

function normalizePhone(phone) {
  const p = phone.replace(/\D/g, "");
  if (p.startsWith("998")) return p;
  if (p.length === 9) return "998" + p;
  if (p.startsWith("0")) return "998" + p.slice(1);
  return p;
}

export async function sendSms(phone, text) {
  let token = await getSetting("eskiz_token");
  if (!token) { token = (await login()) || ""; }
  if (!token) return { ok: false, error: "Eskiz sozlanmagan (email/parol kiriting)" };

  const from = (await getSetting("eskiz_from")) || "4546";

  const send = async (tkn) => {
    const fd = new FormData();
    fd.append("mobile_phone", normalizePhone(phone));
    fd.append("message", text);
    fd.append("from", from);
    return fetch(`${ESKIZ}/message/sms/send`, { method: "POST", headers: { Authorization: `Bearer ${tkn}` }, body: fd });
  };

  try {
    let r = await send(token);
    if (r.status === 401) {
      // token expired -> re-login and retry
      const fresh = await login();
      if (!fresh) return { ok: false, error: "Eskiz token yangilanmadi" };
      r = await send(fresh);
    }
    const j = await r.json().catch(() => ({}));
    if (r.ok || j?.status === "waiting" || j?.id) return { ok: true };
    return { ok: false, error: j?.message || `Eskiz xatosi (${r.status})` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
