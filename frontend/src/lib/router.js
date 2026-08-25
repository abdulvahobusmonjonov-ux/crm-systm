// `next/navigation` bilan bir xil imzoga ega ingichka qatlam, react-router ustida.
// Sahifalardagi `router.push("/leads")`, `usePathname()`, `useSearchParams().get(...)`
// chaqiruvlari o'zgarishsiz ishlaydi.
import { useMemo } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams as useRouterSearchParams,
} from "react-router-dom";

export function useRouter() {
  const navigate = useNavigate();

  return useMemo(
    () => ({
      push: (href) => navigate(href),
      replace: (href) => navigate(href, { replace: true }),
      back: () => navigate(-1),
      forward: () => navigate(1),
      // Next'da bu server komponentlarining keshini bekor qilardi. Vite'da server
      // keshi yo'q — ma'lumot komponentlarning o'z useEffect'lari orqali keladi,
      // shuning uchun bu yerda qiladigan ish qolmadi.
      refresh: () => {},
      prefetch: () => {},
    }),
    [navigate],
  );
}

export function usePathname() {
  return useLocation().pathname;
}

// Next `useSearchParams()` to'g'ridan-to'g'ri URLSearchParams qaytaradi,
// react-router esa `[params, setParams]` juftligini — birinchisini uzatamiz.
export function useSearchParams() {
  const [searchParams] = useRouterSearchParams();
  return searchParams;
}

export { useParams };
