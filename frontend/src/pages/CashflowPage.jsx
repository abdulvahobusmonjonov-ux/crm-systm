import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
function money(v) { return Number(v || 0).toLocaleString("ru-RU"); }
function short(v) { return v >= 1000000 ? (v / 1000000).toFixed(1) + "M" : Math.round(v / 1000) + "k"; }
const TH = "px-4 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap";
export default function CashflowPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        apiFetch("/api/cashflow").then(r => r.json()).then(d => { setData(d); setLoading(false); });
    }, []);
    if (loading) {
        return (<div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl h-24 animate-pulse"/>)}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl h-72 animate-pulse"/>
      </div>);
    }
    if (!data || !data.months) {
        return (<div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm py-20 text-center text-[13px] text-gray-400">
          Ma&apos;lumot yo&apos;q
        </div>
      </div>);
    }
    const max = Math.max(1, ...data.months.flatMap((m) => [m.income, m.outflow]));
    // Month-over-month trend (last vs previous month)
    const trendOf = (key) => {
        if (data.months.length < 2)
            return null;
        const last = data.months[data.months.length - 1][key];
        const prev = data.months[data.months.length - 2][key];
        if (!prev)
            return null;
        return Math.round(((last - prev) / Math.abs(prev)) * 100);
    };
    const kpiCards = [
        {
            label: "Jami daromad",
            value: money(data.totals.income),
            icon: TrendingUp,
            chip: "bg-emerald-500/10 text-emerald-600",
            valueColor: "text-gray-900 dark:text-white",
            trend: trendOf("income"),
        },
        {
            label: "Jami chiqim",
            value: money(data.totals.outflow),
            icon: TrendingDown,
            chip: "bg-red-500/10 text-red-600",
            valueColor: "text-gray-900 dark:text-white",
            trend: trendOf("outflow"),
            invertTrend: true,
        },
        {
            label: "Sof foyda",
            value: money(data.totals.profit),
            icon: Wallet,
            chip: "bg-[#5E2CA5]/10 text-[#5E2CA5]",
            valueColor: data.totals.profit >= 0 ? "text-emerald-600" : "text-red-600",
            trend: trendOf("profit"),
        },
    ];
    return (<div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Pul oqimi</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Daromad, chiqim va sof foyda · so&apos;ngi 6 oy</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpiCards.map(card => {
            const Icon = card.icon;
            const trendUp = card.trend !== null && card.trend > 0;
            const trendGood = card.invertTrend ? !trendUp : trendUp;
            return (<div key={card.label} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", card.chip)}>
                  <Icon className="w-5 h-5"/>
                </div>
                {card.trend !== null && (<span className={cn("inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full", trendGood ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400")}>
                    {trendUp ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                    {Math.abs(card.trend)}%
                  </span>)}
              </div>
              <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-3">{card.label}</p>
              <p className={cn("text-[22px] font-bold leading-tight mt-0.5", card.valueColor)}>
                {card.value} <span className="text-[13px] font-normal text-gray-400">so&apos;m</span>
              </p>
            </div>);
        })}
      </div>

      {/* Bar chart card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white">Oylik kirim / chiqim</h2>
          {/* Legend */}
          <div className="flex items-center gap-4 text-[12px] text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"/> Kirim
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"/> Chiqim
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2 h-56">
          {data.months.map((m) => (<div key={m.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center gap-1.5" style={{ height: "176px" }}>
                <div className="w-1/2 max-w-[28px] bg-emerald-500 rounded-t-lg transition-all hover:bg-emerald-600" style={{ height: `${(m.income / max) * 100}%`, minHeight: m.income > 0 ? "4px" : "0" }} title={`Kirim: ${money(m.income)} so'm`}/>
                <div className="w-1/2 max-w-[28px] bg-red-500 rounded-t-lg transition-all hover:bg-red-600" style={{ height: `${(m.outflow / max) * 100}%`, minHeight: m.outflow > 0 ? "4px" : "0" }} title={`Chiqim: ${money(m.outflow)} so'm`}/>
              </div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{m.month.slice(5)}</span>
              <span className={cn("text-[11px] font-bold tabular-nums", m.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                {m.profit >= 0 ? "+" : ""}{short(m.profit)}
              </span>
            </div>))}
        </div>
      </div>

      {/* Monthly breakdown table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5">
                <th className={TH}>Oy</th>
                <th className={cn(TH, "text-right")}>Daromad</th>
                <th className={cn(TH, "text-right")}>Chiqim</th>
                <th className={cn(TH, "text-right")}>Sof foyda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {data.months.map((m) => (<tr key={m.month} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors duration-100">
                  <td className="px-4 py-3 text-[13px] font-medium text-gray-900 dark:text-white">{m.month}</td>
                  <td className="px-4 py-3 text-right text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    +{money(m.income)}
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
                    −{money(m.outflow)}
                  </td>
                  <td className={cn("px-4 py-3 text-right text-[13px] font-bold whitespace-nowrap", m.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                    {m.profit >= 0 ? "+" : ""}{money(m.profit)} so&apos;m
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
}
