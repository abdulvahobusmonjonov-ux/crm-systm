// NextAuth o'rnini bosuvchi sessiya konteksti.
//
// Backend `/api/auth/login` ga javoban `{ token, user }` qaytaradi. Token
// localStorage'da yashaydi (JWT 7 kun amal qiladi) va har bir so'rovga
// Authorization header sifatida qo'shiladi (lib/api.js).
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, clearSession, getStoredUser, getToken, setStoredUser, setToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Sahifa yangilanganda foydalanuvchi "chiqib ketgandek" ko'rinmasligi uchun
  // saqlangan user'dan boshlaymiz, keyin uni /api/auth/me bilan tasdiqlaymiz.
  const [user, setUser] = useState(() => (getToken() ? getStoredUser() : null));
  const [status, setStatus] = useState(() => (getToken() ? "loading" : "unauthenticated"));

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStatus("unauthenticated");
      return;
    }

    let cancelled = false;
    api
      .get("/api/auth/me")
      .then((res) => {
        if (cancelled) return;
        const fresh = res.data?.user ?? null;
        if (fresh) {
          setUser(fresh);
          setStoredUser(fresh);
          setStatus("authenticated");
        } else {
          clearSession();
          setUser(null);
          setStatus("unauthenticated");
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Token yaroqsiz (yoki backend o'chiq). Ikkala holatda ham himoyalangan
        // sahifani ochib bo'lmaydi — sessiyani tozalaymiz.
        clearSession();
        setUser(null);
        setStatus("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (username, password) => {
    try {
      const res = await api.post("/api/auth/login", { username, password });
      const { token, user: freshUser } = res.data || {};
      if (!token || !freshUser) return { ok: false, error: "Kutilmagan javob" };

      setToken(token);
      setStoredUser(freshUser);
      setUser(freshUser);
      setStatus("authenticated");
      return { ok: true, user: freshUser };
    } catch (err) {
      if (err?.response?.status === 401) {
        return { ok: false, error: "Login/telefon yoki parol noto'g'ri" };
      }
      return { ok: false, error: "Serverga ulanib bo'lmadi. Qayta urinib ko'ring." };
    }
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  // SessionRoleSync admin rolni/ruxsatni o'zgartirganda shu orqali sessiyani yangilaydi.
  const update = useCallback((patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      setStoredUser(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, signOut, update }),
    [user, status, signIn, signOut, update],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return ctx;
}
