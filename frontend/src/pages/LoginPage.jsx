import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, LOGO_URL } from "@/lib/api";
import { getHomeRouteForUser } from "@/lib/permissions";

const schema = z.object({
  username: z.string().min(1, "Username kiritish shart"),
  password: z.string().min(1, "Parol kiritish shart"),
  remember: z.boolean().optional(),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState("");

  useEffect(() => {
    apiFetch("/api/branding")
      .then((r) => r.json())
      .then((d) => {
        if (d.logo) setLogo(d.logo);
      })
      .catch(() => {});
  }, []);

  // Allaqachon kirgan bo'lsa, login sahifasida ushlab turmaymiz.
  useEffect(() => {
    if (user) navigate(getHomeRouteForUser(user), { replace: true });
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");

    const result = await signIn(data.username, data.password);

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Himoyalangan sahifaga kirmoqchi bo'lib login'ga tushib qolgan bo'lsa —
    // o'sha sahifaga qaytaramiz, aks holda roliga mos bosh sahifaga.
    const from = location.state?.from?.pathname;
    navigate(from || getHomeRouteForUser(result.user), { replace: true });
  };

  return (
    <div
      className="relative min-h-screen bg-[#08070d] flex items-center justify-center p-4 overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
          {/* Logo */}
          <div className="text-center mb-7">
            <div className="inline-flex w-16 h-16 rounded-full bg-[#5E2CA5] items-center justify-center mb-4 overflow-hidden">
              <img src={logo || LOGO_URL} alt="" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-[19px] font-bold text-gray-900 dark:text-white">Robocode IT Academy</h1>
            <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-1">Tizimga kirish</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl p-3 text-[13px] text-center">
                {error}
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Login yoki telefon
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  {...register("username")}
                  type="text"
                  autoComplete="username"
                  placeholder="admin yoki +998 90 123 45 67"
                  className="block w-full pl-10 pr-4 py-2.5 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition"
                />
              </div>
              {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Parol
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-12 py-2.5 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            {/* Remember me */}
            <div className="flex items-center">
              <input
                {...register("remember")}
                id="remember"
                type="checkbox"
                className="h-4 w-4 accent-[#5E2CA5] border-gray-300 rounded cursor-pointer"
              />
              <label
                htmlFor="remember"
                className="ml-2 text-[13px] text-gray-500 dark:text-gray-400 cursor-pointer"
              >
                Eslab qolish (30 kun)
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2.5 px-4 bg-[#5E2CA5] hover:bg-[#4a2280] disabled:opacity-70 disabled:cursor-not-allowed text-white text-[13px] font-semibold rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/40 focus:ring-offset-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Kirish...
                </>
              ) : (
                "Kirish"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-gray-400 dark:text-gray-500 mt-6">
          © 2018 Robocode IT Academy
        </p>
      </div>
    </div>
  );
}
