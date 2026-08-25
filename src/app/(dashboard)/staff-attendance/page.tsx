"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Users2, CheckCircle2, Clock, XCircle, Activity, LogIn, LogOut } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/permissions";
import { DatePicker } from "@/components/ui/date-picker";

const BRAND = "#5E2CA5";

interface StaffRow {
  id: string;
  fullName: string;
  role: string;
  subject: string;
  isTeacher: boolean;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
}

type Tab = "all" | "teacher" | "staff";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "Barchasi" },
  { key: "teacher", label: "Ustozlar" },
  { key: "staff", label: "Hodimlar" },
];

export default function StaffAttendancePage() {
  const [date, setDate] = useState(todayStr());
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/staff-attendance?date=${date}`);
    if (res.ok) {
      const d = await res.json();
      setStaff(d.staff ?? []);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const checkIn = async (userId: string) => {
    setBusyId(userId);
    const res = await fetch("/api/staff-attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, date }),
    });
    setBusyId(null);
    if (res.ok) { toast.success("Kelgani belgilandi"); load(); }
    else { const e = await res.json().catch(() => ({})); toast.error(e.error || "Xatolik"); }
  };

  const checkOut = async (userId: string) => {
    setBusyId(userId);
    const res = await fetch("/api/staff-attendance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, date }),
    });
    setBusyId(null);
    if (res.ok) { toast.success("Ketgani belgilandi"); load(); }
    else { const e = await res.json().catch(() => ({})); toast.error(e.error || "Xatolik"); }
  };

  const filtered = useMemo(() => {
    if (tab === "teacher") return staff.filter((s) => s.isTeacher);
    if (tab === "staff") return staff.filter((s) => !s.isTeacher);
    return staff;
  }, [staff, tab]);

  const kpi = useMemo(() => {
    const total = staff.length;
    const ontime = staff.filter((s) => s.status === "ontime").length;
    const late = staff.filter((s) => s.status === "late").length;
    const absent = staff.filter((s) => !s.checkIn).length;
    const working = staff.filter((s) => s.checkIn && !s.checkOut).length;
    return { total, ontime, late, absent, working };
  }, [staff]);

  const KPI_CARDS = [
    { label: "Jami", value: kpi.total, icon: Users2, color: BRAND, bg: `${BRAND}1A` },
    { label: "O'z vaqtida", value: kpi.ontime, icon: CheckCircle2, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    { label: "Kech qolgan", value: kpi.late, icon: Clock, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    { label: "Kelmagan", value: kpi.absent, icon: XCircle, color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    { label: "Hozir ishda", value: kpi.working, icon: Activity, color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Xodimlar davomati</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Kelish-ketish vaqtlarini nazorat qilish</p>
        </div>
        <DatePicker
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 text-[13px]"
        />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {KPI_CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: c.bg }}>
                <Icon className="w-5 h-5" style={{ color: c.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400 mb-0.5 truncate">{c.label}</p>
                <p className="text-[19px] font-bold text-gray-900 dark:text-white leading-tight">{c.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white dark:bg-gray-900 rounded-xl p-1 shadow-sm w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors",
              tab === t.key
                ? "bg-[#5E2CA5] text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-2xl mb-2">🧑‍💼</p>
            <p className="text-[13px] text-gray-400">Xodim topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">F.I.</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Keldi</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Ketdi</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors duration-100">
                    {/* F.I. */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                          style={{ backgroundColor: BRAND }}
                        >
                          {getInitials(s.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{s.fullName}</p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {s.isTeacher ? (s.subject || "O'qituvchi") : ROLE_LABELS[s.role as keyof typeof ROLE_LABELS] || s.role}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Keldi */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 tabular-nums">{fmtTime(s.checkIn)}</span>
                        {s.status === "late" && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">
                            Kech
                          </span>
                        )}
                        {s.status === "ontime" && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                            O&apos;z vaqtida
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Ketdi */}
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 tabular-nums">{fmtTime(s.checkOut)}</span>
                    </td>

                    {/* Tugma */}
                    <td className="px-4 py-3 text-right">
                      {!s.checkIn ? (
                        <button
                          onClick={() => checkIn(s.id)}
                          disabled={busyId === s.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-[#5E2CA5] hover:bg-[#4a2280] text-white transition-colors disabled:opacity-60 whitespace-nowrap"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          Keldi
                        </button>
                      ) : !s.checkOut ? (
                        <button
                          onClick={() => checkOut(s.id)}
                          disabled={busyId === s.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 transition-colors disabled:opacity-60 whitespace-nowrap"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Ketdi
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Bajarildi
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
