"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Printer, Wallet, TrendingDown, Banknote, TrendingUp, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn, formatCurrency, formatMonthUz } from "@/lib/utils";
import { useDarkMode } from "@/hooks/useDarkMode";
import { MonthPicker } from "@/components/ui/date-picker";

const BRAND = "#5E2CA5";

// Categorical palette validated for CVD separation + contrast (light/dark) — see dataviz skill.
const TYPE_COLOR: Record<string, { light: string; dark: string; label: string }> = {
  revenue: { light: "#5E2CA5", dark: "#9085e9", label: "Daromad" },
  expense: { light: "#e34948", dark: "#e66767", label: "Xarajat" },
  payroll: { light: "#2a78d6", dark: "#3987e5", label: "Ish haqi" },
};

interface CategoryRow { type: "revenue" | "expense" | "payroll"; category: string; amount: number }
interface FinancialReport {
  month: string;
  totals: { totalRevenue: number; totalExpense: number; totalPayroll: number; netProfit: number; totalDebt: number };
  categories: CategoryRow[];
}

function currentMonth(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
}

const monthLabel = formatMonthUz;

export default function FinancialReportPage() {
  const { dark } = useDarkMode();
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/reports/financial?month=${month}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const exportCSV = async () => {
    const res = await fetch(`/api/reports/financial?month=${month}&format=csv`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `moliyaviy_hisobot_${month}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const printPDF = () => window.print();

  const kpis = data ? [
    { label: "Jami tushum", value: data.totals.totalRevenue, icon: TrendingUp, chip: "bg-[#5E2CA5]/10 text-[#5E2CA5]", valueCls: "text-gray-900 dark:text-white" },
    { label: "Xarajat", value: data.totals.totalExpense, icon: TrendingDown, chip: "bg-red-500/10 text-red-600", valueCls: "text-gray-900 dark:text-white" },
    { label: "Ish haqi", value: data.totals.totalPayroll, icon: Banknote, chip: "bg-blue-500/10 text-blue-600", valueCls: "text-gray-900 dark:text-white" },
    { label: "Sof foyda", value: data.totals.netProfit, icon: Wallet, chip: "bg-emerald-500/10 text-emerald-600", valueCls: data.totals.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400" },
    { label: "Qarzdorlik", value: data.totals.totalDebt, icon: AlertCircle, chip: "bg-amber-500/10 text-amber-600", valueCls: "text-amber-600 dark:text-amber-400" },
  ] : [];

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5 print:bg-white print:p-0" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:px-6 print:pt-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Moliyaviy hisobot</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 capitalize">{monthLabel(month)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap print:hidden">
          <MonthPicker
            value={month} onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 text-[13px]"
          />
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Download className="w-4 h-4" /> Excelga eksport
          </button>
          <button
            onClick={printPDF}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" /> PDF yuklab olish
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl h-28 animate-pulse" />)}
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl h-72 animate-pulse" />
          <div className="bg-white dark:bg-gray-900 rounded-2xl h-72 animate-pulse" />
        </div>
      ) : !data ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm py-20 text-center text-[13px] text-gray-400">
          Ma&apos;lumot yo&apos;q
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 print:grid-cols-5 print:px-6">
            {kpis.map(k => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 print:shadow-none print:border print:border-gray-200">
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", k.chip)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-3">{k.label}</p>
                  <p className={cn("text-[18px] font-bold leading-tight mt-0.5 truncate", k.valueCls)}>
                    {formatCurrency(k.value)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Category chart */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 print:shadow-none print:border print:border-gray-200 print:break-inside-avoid print:px-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white">Kategoriya bo&apos;yicha taqsimot</h2>
              <div className="flex items-center gap-4 text-[12px] text-gray-500 dark:text-gray-400">
                {(["revenue", "expense", "payroll"] as const).map(t => (
                  <span key={t} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dark ? TYPE_COLOR[t].dark : TYPE_COLOR[t].light }} />
                    {TYPE_COLOR[t].label}
                  </span>
                ))}
              </div>
            </div>
            {data.categories.length === 0 ? (
              <div className="py-14 text-center text-[13px] text-gray-400">Bu oy uchun ma&apos;lumot yo&apos;q</div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(240, data.categories.length * 36)}>
                <BarChart data={data.categories} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#2c2c2a" : "#f1f1f5"} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="category" width={140} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                    contentStyle={{ borderRadius: 12, border: "1px solid #f1f1f5", fontSize: 12 }}
                    cursor={{ fill: BRAND, fillOpacity: 0.06 }}
                  />
                  <Bar dataKey="amount" radius={[0, 8, 8, 0]} maxBarSize={22}>
                    {data.categories.map((c, i) => (
                      <Cell key={i} fill={dark ? TYPE_COLOR[c.type].dark : TYPE_COLOR[c.type].light} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category table */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden print:shadow-none print:border print:border-gray-200 print:break-inside-avoid">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Turi</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Kategoriya</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Summa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                  {data.categories.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-10 text-center text-[13px] text-gray-400">Bu oy uchun ma&apos;lumot yo&apos;q</td></tr>
                  ) : data.categories.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors duration-100">
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: (dark ? TYPE_COLOR[c.type].dark : TYPE_COLOR[c.type].light) + "20", color: dark ? TYPE_COLOR[c.type].dark : TYPE_COLOR[c.type].light }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dark ? TYPE_COLOR[c.type].dark : TYPE_COLOR[c.type].light }} />
                          {TYPE_COLOR[c.type].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] font-medium text-gray-900 dark:text-white">{c.category}</td>
                      <td className="px-4 py-3 text-right text-[13px] font-semibold text-gray-700 dark:text-gray-200 tabular-nums whitespace-nowrap">
                        {formatCurrency(c.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
