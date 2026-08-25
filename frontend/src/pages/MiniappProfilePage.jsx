import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const TELEGRAM_SDK = "https://telegram.org/js/telegram-web-app.js";

// `next/script` o'rniga — skriptni bir marta <head>ga qo'shib, yuklanishini kutamiz.
function useTelegramSdk() {
    const [ready, setReady] = useState(() => Boolean(window.Telegram?.WebApp));

    useEffect(() => {
        if (window.Telegram?.WebApp) {
            setReady(true);
            return;
        }

        let script = document.querySelector(`script[src="${TELEGRAM_SDK}"]`);
        if (!script) {
            script = document.createElement("script");
            script.src = TELEGRAM_SDK;
            script.async = true;
            document.head.appendChild(script);
        }

        const onLoad = () => setReady(true);
        script.addEventListener("load", onLoad);
        return () => script.removeEventListener("load", onLoad);
    }, []);

    return ready;
}
const BRAND = "#5E2CA5";
const DAY_NAMES = {
    Mon: "Dush", Tue: "Sesh", Wed: "Chor", Thu: "Pay", Fri: "Juma", Sat: "Shan", Sun: "Yak",
};
function fmtMoney(n) {
    return new Intl.NumberFormat("uz-UZ").format(Math.round(n));
}
function fmtDate(d) {
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${dt.getFullYear()}`;
}
function statusLabel(s) {
    return s === "present" ? "Keldi" : s === "absent" ? "Kelmadi" : s === "late" ? "Kech keldi" : s === "excused" ? "Sababli" : s;
}
function statusColor(s) {
    return s === "present" ? "#22c55e" : s === "absent" ? "#ef4444" : s === "late" ? "#f59e0b" : s === "excused" ? "#6366f1" : "#6b7280";
}
export default function MiniAppProfilePage() {
    const sdkReady = useTelegramSdk();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!sdkReady)
            return;
        const tg = window.Telegram?.WebApp;
        if (!tg) {
            setError("no_telegram");
            setLoading(false);
            return;
        }
        try {
            tg.ready();
            tg.expand();
            document.documentElement.classList.toggle("dark", tg.colorScheme === "dark");
            tg.setHeaderColor?.(tg.colorScheme === "dark" ? "#0a0a0f" : "#F5F6FA");
            tg.setBackgroundColor?.(tg.colorScheme === "dark" ? "#0a0a0f" : "#F5F6FA");
        }
        catch { }
        const initData = tg.initData || "";
        if (!initData) {
            setError("no_init_data");
            setLoading(false);
            return;
        }
        apiFetch("/api/telegram/miniapp/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData }),
        })
            .then(async (r) => {
            if (!r.ok) {
                const j = await r.json().catch(() => ({}));
                throw new Error(j.error || "error");
            }
            return r.json();
        })
            .then((d) => setData(d))
            .catch((e) => setError(e.message || "error"))
            .finally(() => setLoading(false));
    }, [sdkReady]);
    return (<>
      <div className="min-h-screen bg-[#F5F6FA] dark:bg-[#0a0a0f] p-4 space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        {loading && (<div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-700 border-t-[#5E2CA5] animate-spin"/>
            <p className="text-sm">Yuklanmoqda...</p>
          </div>)}

        {!loading && error && (<div className="flex flex-col items-center justify-center py-24 text-center gap-2 px-6">
            <p className="text-3xl mb-1">🔒</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {error === "not_linked"
                ? "Profilingiz topilmadi. Adminingizdan shaxsiy havola oling va botga /start bosing."
                : error === "no_telegram" || error === "no_init_data"
                    ? "Bu sahifa faqat Telegram ilovasi ichida ishlaydi."
                    : "Xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring."}
            </p>
          </div>)}

        {!loading && !error && data && (<>
            {/* Header card */}
            <div className="rounded-2xl p-4 text-white shadow-sm" style={{ backgroundColor: BRAND }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-lg font-bold shrink-0">
                  {data.student.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">{data.student.fullName}</p>
                  <p className="text-[12px] text-white/70 truncate">{data.student.courseName || "Kurs biriktirilmagan"}</p>
                </div>
                <div className="flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 shrink-0">
                  <span className="text-sm">🪙</span>
                  <span className="text-[13px] font-semibold">{data.student.coins}</span>
                </div>
              </div>
            </div>

            {/* Group / schedule */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
              <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wide mb-3">📅 Dars jadvali</h3>
              {data.group ? (<div className="space-y-1.5">
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-white">{data.group.name}</p>
                  {data.group.teacherName && (<p className="text-[13px] text-gray-500 dark:text-gray-400">👨‍🏫 {data.group.teacherName}</p>)}
                  {data.group.days && (<p className="text-[13px] text-gray-500 dark:text-gray-400">
                      🗓 {data.group.days.split(",").map((d) => DAY_NAMES[d.trim()] || d.trim()).join(", ")}
                    </p>)}
                  {(data.group.timeFrom || data.group.timeTo) && (<p className="text-[13px] text-gray-500 dark:text-gray-400">
                      🕐 {data.group.timeFrom}{data.group.timeTo ? `–${data.group.timeTo}` : ""}
                    </p>)}
                  {data.group.room && <p className="text-[13px] text-gray-500 dark:text-gray-400">🚪 {data.group.room}</p>}
                </div>) : (<p className="text-[13px] text-gray-400">Hozircha guruhga biriktirilmagansiz.</p>)}
            </div>

            {/* Attendance */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
              <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wide mb-3">✅ Davomat</h3>
              {data.attendance.total > 0 ? (<>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-14 h-14 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-100 dark:text-gray-800"/>
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke={BRAND} strokeWidth="3" strokeDasharray={`${((data.attendance.percent || 0) / 100) * 97.4} 97.4`} strokeLinecap="round"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-gray-900 dark:text-white">
                        {data.attendance.percent}%
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
                      <span className="text-gray-500 dark:text-gray-400">✔️ Keldi: <b className="text-gray-800 dark:text-gray-200">{data.attendance.present}</b></span>
                      <span className="text-gray-500 dark:text-gray-400">✕ Kelmadi: <b className="text-gray-800 dark:text-gray-200">{data.attendance.absent}</b></span>
                      <span className="text-gray-500 dark:text-gray-400">⏱ Kech: <b className="text-gray-800 dark:text-gray-200">{data.attendance.late}</b></span>
                      <span className="text-gray-500 dark:text-gray-400">📄 Sababli: <b className="text-gray-800 dark:text-gray-200">{data.attendance.excused}</b></span>
                    </div>
                  </div>
                  <div className="space-y-1 border-t border-gray-100 dark:border-white/5 pt-2">
                    {data.attendance.recent.slice(0, 5).map((a, i) => (<div key={i} className="flex items-center justify-between text-[12px]">
                        <span className="text-gray-500 dark:text-gray-400">{fmtDate(a.date)}</span>
                        <span className="font-medium" style={{ color: statusColor(a.status) }}>{statusLabel(a.status)}</span>
                      </div>))}
                  </div>
                </>) : (<p className="text-[13px] text-gray-400">Hali davomat qayd etilmagan.</p>)}
            </div>

            {/* Payments */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wide">💳 To&apos;lov holati</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={data.payments.paidThisMonth
                ? { backgroundColor: "#22c55e22", color: "#16a34a" }
                : { backgroundColor: "#ef444422", color: "#dc2626" }}>
                  {data.payments.paidThisMonth ? "Bu oy to'langan" : "Bu oy to'lanmagan"}
                </span>
              </div>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-2">
                Jami to&apos;langan: <b className="text-gray-800 dark:text-gray-200">{fmtMoney(data.payments.totalPaid)} so&apos;m</b>
              </p>
              {data.payments.history.length > 0 && (<div className="space-y-1.5 border-t border-gray-100 dark:border-white/5 pt-2">
                  {data.payments.history.slice(0, 5).map((p, i) => (<div key={i} className="flex items-center justify-between text-[12px]">
                      <span className="text-gray-500 dark:text-gray-400">{fmtDate(p.paidAt)}{p.forMonth ? ` · ${p.forMonth}` : ""}</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{fmtMoney(p.amount)} so&apos;m</span>
                    </div>))}
                </div>)}
            </div>

            {/* Scores */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wide">🏆 Baholar</h3>
                {data.scores.average !== null && (<span className="text-[13px] font-bold" style={{ color: BRAND }}>O&apos;rtacha: {data.scores.average}</span>)}
              </div>
              {data.scores.list.length > 0 ? (<div className="space-y-1.5">
                  {data.scores.list.map((s, i) => (<div key={i} className="flex items-center justify-between text-[12px]">
                      <span className="text-gray-500 dark:text-gray-400 truncate mr-2">{s.examTitle}</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200 shrink-0">{s.score}/{s.maxScore}</span>
                    </div>))}
                </div>) : (<p className="text-[13px] text-gray-400">Hali imtihon natijalari yo&apos;q.</p>)}
            </div>
          </>)}
      </div>
    </>);
}
