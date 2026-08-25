// Next.js'da har bir route layout serverda `const session = await auth(); if
// (!session) redirect("/login")` qilardi. Bu yerda o'sha mantiq mijoz tomonida:
// AuthProvider tokenni tekshirib bo'lguncha kutamiz, keyin yo'naltiramiz.
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-800 border-t-[#5E2CA5] animate-spin" />
    </div>
  );
}

// Faqat tizimga kirganlar. Kirmaganlar /login ga ketadi va login'dan keyin
// so'ralgan sahifaga qaytariladi.
export function RequireAuth({ children }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return children ?? <Outlet />;
}

// Rol/huquq tekshiruvi. `check(user)` false qaytarsa — `fallback` sahifasiga
// (odatda /dashboard) yo'naltiradi, xuddi eski server layout'lardagidek.
export function RequireRole({ check, fallback = "/dashboard", children }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!check(user)) return <Navigate to={fallback} replace />;

  return children ?? <Outlet />;
}

export { FullPageSpinner };
