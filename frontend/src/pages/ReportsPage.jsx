import { lazy, Suspense, useState, useEffect, useCallback } from "react";
import { Download, TrendingUp, Users, DollarSign, GraduationCap } from "lucide-react";
import { LEAD_SOURCE_LABELS } from "@/lib/constants";
// Recharts og'ir paket — alohida chunk sifatida, sahifa ochilgach yuklanadi.
const ReportsChart = lazy(() => import("./ReportsChart"));
const ChartSkeleton = () => <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm h-72 animate-pulse"/>;
import { cn, formatCurrency } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { apiFetch } from "@/lib/api";
const BRAND = "#5E2CA5";
export default function ReportsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const load = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (from)
            params.set("from", from);
        if (to)
            params.set("to", to);
        const res = await apiFetch(`/api/reports?${params}`);
        if (res.ok)
            setData(await res.json());
        setLoading(false);
    }, [from, to]);
    useEffect(() => { load(); }, [load]);
    const exportCSV = async () => {
        const res = await apiFetch("/api/reports/export");
        if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `lidlar_${new Date().toISOString().slice(0, 10)}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };
    return (<div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Hisobotlar</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Statistika va analitika</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DatePicker value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 text-[13px]"/>
          <span className="text-gray-300">—</span>
          <DatePicker value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 text-[13px]"/>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors">
            <Download className="w-4 h-4"/> Eksport
          </button>
        </div>
      </div>

      {loading ? (<div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl h-28 animate-pulse"/>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl h-72 animate-pulse"/>
            <div className="bg-white dark:bg-gray-900 rounded-2xl h-72 animate-pulse"/>
          </div>
        </div>) : !data ? (<div className="text-center text-gray-400 py-20 text-sm">Ma&apos;lumot yuklanmadi</div>) : (<>
          {/* Derived, honest percentages (no fabricated trend data) */}
          {(() => {
                const enrolledPct = data.totalLeads > 0 ? Math.round((data.enrolledCount / data.totalLeads) * 100) : 0;
                const revenueCapturedPct = data.potentialRevenue > 0 ? Math.round((data.actualRevenue / data.potentialRevenue) * 100) : 0;
                const kpis = [
                    {
                        label: "Jami lidlar",
                        value: data.totalLeads,
                        icon: Users,
                        chip: "bg-[#5E2CA5]/10 text-[#5E2CA5]",
                        badge: `${enrolledPct}% yozildi`,
                        badgeCls: "bg-[#5E2CA5]/10 text-[#5E2CA5]",
                    },
                    {
                        label: "Yozilganlar",
                        value: data.enrolledCount,
                        icon: GraduationCap,
                        chip: "bg-emerald-500/10 text-emerald-600",
                        badge: `${data.conversionRate}%`,
                        badgeCls: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                    },
                    {
                        label: "Konversiya",
                        value: `${data.conversionRate}%`,
                        icon: TrendingUp,
                        chip: "bg-blue-500/10 text-blue-600",
                        badge: Number(data.conversionRate) >= 50 ? "Yaxshi" : "O'rtacha",
                        badgeCls: Number(data.conversionRate) >= 50
                            ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400",
                    },
                    {
                        label: "Haqiqiy daromad",
                        value: formatCurrency(data.actualRevenue),
                        icon: DollarSign,
                        chip: "bg-amber-500/10 text-amber-600",
                        badge: `${revenueCapturedPct}% bajarildi`,
                        badgeCls: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400",
                        sub: `Potensial: ${formatCurrency(data.potentialRevenue)}`,
                    },
                ];
                return (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(k => {
                        const Icon = k.icon;
                        return (<div key={k.label} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", k.chip)}>
                          <Icon className="w-5 h-5"/>
                        </div>
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap", k.badgeCls)}>
                          {k.badge}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-3">{k.label}</p>
                      <p className="text-[20px] font-bold text-gray-900 dark:text-white leading-tight mt-0.5 truncate">{k.value}</p>
                      {k.sub && <p className="text-[11px] text-gray-400 mt-0.5">{k.sub}</p>}
                    </div>);
                    })}
              </div>);
            })()}

          {/* ── Row 1: Course bar chart (purple) + Lead sources progress bars ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Left: purple bar chart (lazy-loaded) */}
            <Suspense fallback={<ChartSkeleton />}>
              <ReportsChart courseStats={data.courseStats}/>
            </Suspense>

            {/* Right: lead sources as progress bars */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5">
              <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-4">Lidlar manbasi</h2>
              <div className="space-y-3.5">
                {(() => {
                const total = (data.sourceDistribution || []).reduce((a, s) => a + s.count, 0) || 1;
                return [...(data.sourceDistribution || [])]
                    .sort((a, b) => b.count - a.count)
                    .map((s) => {
                    const pct = Math.round((s.count / total) * 100);
                    return (<div key={s.source}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[13px] font-medium text-gray-700 dark:text-gray-200">
                              {LEAD_SOURCE_LABELS[s.source] || s.source}
                            </span>
                            <span className="text-[12px] text-gray-400">
                              <span className="font-semibold text-gray-600 dark:text-gray-300">{s.count}</span> · {pct}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-white/8 rounded-full h-2 overflow-hidden">
                            <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: BRAND }}/>
                          </div>
                        </div>);
                });
            })()}
              </div>
            </div>
          </div>

          {/* ── Row 2: Stage distribution progress bars + Employee performance ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Left: stage distribution */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5">
              <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-4">Bosqich bo&apos;yicha taqsimot</h2>
              <div className="space-y-3.5">
                {(() => {
                const stages = (data.stageDistribution || []).filter((s) => s.count > 0);
                const total = stages.reduce((a, s) => a + s.count, 0) || 1;
                return stages.map((s) => {
                    const pct = Math.round((s.count / total) * 100);
                    return (<div key={s.stageId}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 dark:text-gray-200">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color || "#9ca3af" }}/>
                            {s.name}
                          </span>
                          <span className="text-[12px] text-gray-400">
                            <span className="font-semibold text-gray-600 dark:text-gray-300">{s.count}</span> · {pct}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-white/8 rounded-full h-2 overflow-hidden">
                          <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: s.color || "#9ca3af" }}/>
                        </div>
                      </div>);
                });
            })()}
              </div>
            </div>

            {/* Right: employee performance */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5">
              <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-4">Hodimlar samaradorligi</h2>
              <div className="space-y-3.5">
                {[...data.userStats]
                .sort((a, b) => b.totalLeads - a.totalLeads)
                .map((u) => {
                const pct = Math.min((u.totalLeads / (data.totalLeads || 1)) * 100, 100);
                return (<div key={u.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0" style={{ backgroundColor: BRAND }}>
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{u.fullName}</span>
                            <span className="text-[12px] text-gray-400 ml-2 flex-shrink-0">{u.totalLeads} lid</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-white/8 rounded-full h-1.5 overflow-hidden">
                            <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: BRAND }}/>
                          </div>
                        </div>
                      </div>);
            })}
              </div>
            </div>
          </div>
        </>)}
    </div>);
}
