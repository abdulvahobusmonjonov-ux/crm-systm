"use client";

import { useState, useEffect, useMemo } from "react";
import { Users, GraduationCap, Wallet, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  bySource: { source: string; count: number; enrolled: number; revenue: number; conversion: number }[];
  byManager: { name: string; total: number; enrolled: number; revenue: number; conversion: number }[];
  monthly: { month: string; revenue: number }[];
  forecast: number;
  totals: { leads: number; enrolled: number; revenue: number };
  monthlyJoinLeave: { month: string; joined: number; left: number }[];
  byTeacherRetention: { teacherId: string; teacherName: string; currentStudents: number; leftStudents: number }[];
}

function money(v: number) { return Number(v || 0).toLocaleString("ru-RU"); }

const TH = "px-4 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap";

const PERIODS = [
  { key: "3", label: "3 oy" },
  { key: "6", label: "6 oy" },
];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6");

  useEffect(() => {
    fetch("/api/analytics").then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  const monthly = useMemo(() => {
    if (!data) return [];
    const n = Number(period);
    return data.monthly.slice(-n);
  }, [data, period]);

  const joinLeave = useMemo(() => {
    if (!data) return [];
    const n = Number(period);
    return data.monthlyJoinLeave.slice(-n);
  }, [data, period]);

  if (loading) return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5">
      <div className="h-8 w-40 bg-white dark:bg-gray-900 rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white dark:bg-gray-900 rounded-2xl animate-pulse" />)}
      </div>
      <div className="h-64 bg-white dark:bg-gray-900 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-52 bg-white dark:bg-gray-900 rounded-2xl animate-pulse" />
        <div className="h-52 bg-white dark:bg-gray-900 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
  if (!data) return <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 flex items-center justify-center text-[13px] text-gray-400">Ma&apos;lumot yo&apos;q</div>;

  const maxRev = Math.max(1, ...monthly.map((m) => m.revenue));
  const maxJoinLeave = Math.max(1, ...joinLeave.map((m) => Math.max(m.joined, m.left)));

  const kpiCards = [
    { label: "Jami lidlar", value: String(data.totals.leads), icon: Users, chip: "bg-indigo-500/10 text-indigo-600" },
    { label: "O'qishga yozildi", value: String(data.totals.enrolled), icon: GraduationCap, chip: "bg-green-500/10 text-green-600" },
    { label: "Jami daromad", value: `${money(data.totals.revenue)} so'm`, icon: Wallet, chip: "bg-amber-500/10 text-amber-600" },
    { label: "Prognoz (keyingi oy)", value: `${money(data.forecast)} so'm`, icon: TrendingUp, chip: "bg-[#5E2CA5]/10 text-[#5E2CA5]" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Analitika</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Manba, menejer va daromad tahlili</p>
        </div>
        <div className="inline-flex items-center gap-1 bg-white dark:bg-gray-900 rounded-xl shadow-sm p-1">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors",
                period === p.key ? "bg-[#5E2CA5] text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 flex items-start gap-4">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", card.chip)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-0.5">{card.label}</p>
                <p className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight truncate">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly revenue */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5">
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">Oylik daromad ({PERIODS.find(p => p.key === period)?.label})</p>
        <div className="flex items-end gap-3 h-48">
          {monthly.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center" style={{ height: "150px" }}>
                <div
                  className="w-full max-w-[48px] rounded-t-lg transition-all"
                  style={{ height: `${(m.revenue / maxRev) * 100}%`, minHeight: m.revenue > 0 ? "4px" : "0", backgroundColor: "#5E2CA5" }}
                  title={money(m.revenue)}
                />
              </div>
              <span className="text-[10px] text-gray-400">{m.month.slice(5)}</span>
              <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{m.revenue >= 1000000 ? (m.revenue / 1000000).toFixed(1) + "M" : Math.round(m.revenue / 1000) + "k"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly joined vs left */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5">
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">Oylik kirim / ketim (o&apos;quvchilar)</p>
        <div className="flex items-end gap-4 h-48">
          {joinLeave.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center gap-1.5" style={{ height: "150px" }}>
                <div
                  className="flex-1 max-w-[22px] rounded-t-lg transition-all bg-emerald-500"
                  style={{ height: `${(m.joined / maxJoinLeave) * 100}%`, minHeight: m.joined > 0 ? "4px" : "0" }}
                  title={`Kirdi: ${m.joined}`}
                />
                <div
                  className="flex-1 max-w-[22px] rounded-t-lg transition-all bg-red-500"
                  style={{ height: `${(m.left / maxJoinLeave) * 100}%`, minHeight: m.left > 0 ? "4px" : "0" }}
                  title={`Ketdi: ${m.left}`}
                />
              </div>
              <span className="text-[10px] text-gray-400">{m.month.slice(5)}</span>
              <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">+{m.joined} / -{m.left}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-[11px] text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Kirdi</span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Ketdi</span>
        </div>
      </div>

      {/* By teacher retention */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-4 pt-4 pb-1">O&apos;qituvchilar bo&apos;yicha saqlanish</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5">
                <th className={TH}>O&apos;qituvchi</th>
                <th className={cn(TH, "text-right")}>Hozir o&apos;qiyapti</th>
                <th className={cn(TH, "text-right")}>Ketganlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {data.byTeacherRetention.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-[13px] text-gray-400">Ma&apos;lumot yo&apos;q</td></tr>
              ) : data.byTeacherRetention.map((t) => (
                <tr key={t.teacherId} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors duration-100">
                  <td className="px-4 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white whitespace-nowrap">{t.teacherName}</td>
                  <td className="px-4 py-2.5 text-right text-[13px] font-semibold text-emerald-600">{t.currentStudents}</td>
                  <td className="px-4 py-2.5 text-right text-[13px] font-semibold text-red-600">{t.leftStudents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* By source */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-4 pt-4 pb-1">Manba bo&apos;yicha</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className={TH}>Manba</th>
                  <th className={cn(TH, "text-right")}>Lid</th>
                  <th className={cn(TH, "text-right")}>Yozildi</th>
                  <th className={cn(TH, "text-right")}>Konv.</th>
                  <th className={cn(TH, "text-right")}>Daromad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {data.bySource.map((s) => (
                  <tr key={s.source} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors duration-100">
                    <td className="px-4 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white whitespace-nowrap">{s.source}</td>
                    <td className="px-4 py-2.5 text-right text-[13px] text-gray-500 dark:text-gray-400">{s.count}</td>
                    <td className="px-4 py-2.5 text-right text-[13px] text-gray-500 dark:text-gray-400">{s.enrolled}</td>
                    <td className="px-4 py-2.5 text-right text-[13px] text-gray-500 dark:text-gray-400">{s.conversion}%</td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-semibold text-green-600 whitespace-nowrap">{money(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* By manager */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-4 pt-4 pb-1">Menejerlar reytingi</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className={TH}>Menejer</th>
                  <th className={cn(TH, "text-right")}>Lid</th>
                  <th className={cn(TH, "text-right")}>Yozildi</th>
                  <th className={cn(TH, "text-right")}>Konv.</th>
                  <th className={cn(TH, "text-right")}>Daromad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {data.byManager.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors duration-100">
                    <td className="px-4 py-2.5 text-[13px] font-medium text-gray-900 dark:text-white whitespace-nowrap">{m.name}</td>
                    <td className="px-4 py-2.5 text-right text-[13px] text-gray-500 dark:text-gray-400">{m.total}</td>
                    <td className="px-4 py-2.5 text-right text-[13px] text-gray-500 dark:text-gray-400">{m.enrolled}</td>
                    <td className="px-4 py-2.5 text-right text-[13px] text-gray-500 dark:text-gray-400">{m.conversion}%</td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-semibold text-green-600 whitespace-nowrap">{money(m.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
