// Backend'ga bo'lgan yagona kirish nuqtasi.
//
// Next.js'da frontend va API bitta origin'da edi, shuning uchun kod hamma joyda
// `fetch("/api/...")` deb yozilgan. Endi API alohida serverda (Express) —
// shuning uchun bu yerda ikki narsa bor:
//
//   api       — axios instance (yangi kod uchun)
//   apiFetch  — nativ `fetch` bilan bir xil imzoga ega o'ram: baseURL qo'shadi
//               va JWT'ni Authorization header'ga qo'yadi. Mavjud 190+ ta
//               chaqiruvda faqat funksiya nomi almashdi, `res.ok` / `res.json()`
//               mantig'i tegilmadi.
import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // private mode / storage disabled — sessiya faqat shu sahifa uchun yashaydi
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    // yuqoridagi kabi — jim o'tkazamiz
  }
}

export function clearSession() {
  setToken(null);
  setStoredUser(null);
}

// Nisbiy "/api/..." yo'lini backend'ning to'liq manziliga aylantiradi.
// <img src={apiUrl("/api/branding/logo")} /> kabi joylarda ishlatiladi.
export function apiUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

// Markaz logotipi — backend'dan keladi (Sozlamalarda yuklanmagan bo'lsa,
// standart SVG qaytadi). <img src={logo || LOGO_URL}> ko'rinishida ishlatiladi.
export const LOGO_URL = `${API_URL}/api/branding/logo`;

// Token eskirgan/bekor bo'lgan holat: sessiyani tozalab, login sahifasiga qaytaramiz.
// Login sahifasining o'zida 401 — bu "parol noto'g'ri", uni ushlab qolmaymiz.
function onUnauthorized() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  clearSession();
  window.location.href = "/login";
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) onUnauthorized();
    return Promise.reject(error);
  },
);

export async function apiFetch(path, init = {}) {
  const headers = new Headers(init.headers || {});
  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  // FormData yuborilganda Content-Type'ni brauzer o'zi (boundary bilan) qo'yadi.
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(apiUrl(path), { ...init, headers });
  if (res.status === 401) onUnauthorized();
  return res;
}

export default api;
