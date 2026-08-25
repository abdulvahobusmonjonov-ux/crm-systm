// `next-auth/react` bilan bir xil imzoga ega ingichka qatlam — komponentlarda
// faqat import yo'li o'zgardi, `const { data: session } = useSession()` va
// `signOut({ callbackUrl: "/login" })` kodi o'z holicha qoldi.
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { clearSession, getStoredUser, getToken } from "./api";

export function useSession() {
  const { user, status, update } = useAuth();

  return useMemo(
    () => ({
      data: user ? { user } : null,
      status,
      update,
    }),
    [user, status, update],
  );
}

// React tashqarisidan ham chaqirilishi mumkin bo'lgani uchun (onClick handler'lar)
// bu hook emas — sessiyani tozalab, to'liq sahifa yangilanishi bilan ketadi.
// Bu ayni paytda barcha komponentlardagi eski holatni ham tozalaydi.
export function signOut(options = {}) {
  clearSession();
  window.location.href = options.callbackUrl || "/login";
}

// Login sahifasi AuthContext'ning signIn'ini to'g'ridan-to'g'ri ishlatadi,
// bu esa faqat "sessiya bormi?" deb so'rovchi eski kod uchun.
export function getSession() {
  return getToken() ? { user: getStoredUser() } : null;
}
