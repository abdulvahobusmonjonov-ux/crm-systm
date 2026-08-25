import { useState, useEffect } from "react";
import { Download, CalendarCheck, Star, Users2 } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
const BRAND = "#5E2CA5";
function money(v) { return Number(v || 0).toLocaleString("ru-RU"); }
// Derived star rating from attendance % (no separate rating data exists)
function ratingFromAttendance(pct) {
    if (pct >= 90)
        return 5;
    if (pct >= 80)
        return 4;
    if (pct >= 70)
        return 3;
    if (pct >= 60)
        return 2;
    return pct > 0 ? 1 : 0;
}
const TH = "px-4 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap";
export default function TeacherReportPage() {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        apiFetch("/api/reports/teacher-performance")
            .then(r => r.json())
            .then(d => { setList(Array.isArray(d) ? d : []); setLoading(false); });
    }, []);
    const exportCSV = async () => {
        const res = await apiFetch("/api/reports/export");
        if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `oqituvchi_hisoboti_${new Date().toISOString().slice(0, 10)}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };
    // Derived KPIs — only computed from real data, no fabricated numbers
    const avgAttendance = list.length > 0
        ? Math.round(list.reduce((a, t) => a + (Number(t.attendance) || 0), 0) / list.length)
        : 0;
    const scored = list.filter(t => t.averageScore !== null && t.averageScore !== undefined);
    const avgScore = scored.length > 0
        ? Math.round(scored.reduce((a, t) => a + Number(t.averageScore), 0) / scored.length)
        : null;
    const activeTeachers = list.filter(t => Number(t.groups) > 0).length;
    const kpis = [
        {
            label: "O'rtacha davomat",
            value: `${avgAttendance}%`,
            icon: CalendarCheck,
            chip: "bg-emerald-500/10 text-emerald-600",
        },
        {
            label: "O'rtacha ball",
            value: avgScore !== null ? `${avgScore}` : "—",
            icon: Star,
            chip: "bg-amber-500/10 text-amber-600",
        },
        {
            label: "Faol o'qituvchi",
            value: String(activeTeachers),
            icon: Users2,
            chip: "bg-[#5E2CA5]/10 text-[#5E2CA5]",
        },
    ];
    return (<div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">O&apos;qituvchi hisoboti</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Joriy davr · guruh, o&apos;quvchi, davomat va daromad bo&apos;yicha</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors">
          <Download className="w-4 h-4"/> Eksport
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map(k => {
            const Icon = k.icon;
            return (<div key={k.label} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 flex items-center gap-4">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", k.chip)}>
                <Icon className="w-5 h-5"/>
              </div>
              <div>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-0.5">{k.label}</p>
                <p className="text-[22px] font-bold text-gray-900 dark:text-white leading-tight">{k.value}</p>
              </div>
            </div>);
        })}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (<div className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>) : list.length === 0 ? (<div className="py-16 text-center text-[13px] text-gray-400">
            Ma&apos;lumot yo&apos;q (guruhlarga o&apos;qituvchi biriktiring)
          </div>) : (<div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className={TH}>O&apos;qituvchi</th>
                  <th className={cn(TH, "text-right")}>Guruh</th>
                  <th className={cn(TH, "text-right")}>O&apos;quvchi soni</th>
                  <th className={cn(TH, "text-right")}>Davomat %</th>
                  <th className={cn(TH, "text-right")}>O&apos;rtacha ball</th>
                  <th className={cn(TH, "text-center")}>Reyting</th>
                  <th className={cn(TH, "text-right")}>Daromad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {list.map((t, i) => {
                const pct = Number(t.attendance) || 0;
                const pctGood = pct >= 80;
                const stars = ratingFromAttendance(pct);
                return (<tr key={i} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors duration-100">

                      {/* O'qituvchi */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ backgroundColor: BRAND }}>
                            {getInitials(t.name)}
                          </div>
                          <span className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{t.name}</span>
                        </div>
                      </td>

                      {/* Guruh */}
                      <td className="px-4 py-3 text-right text-[13px] text-gray-500 dark:text-gray-400 tabular-nums">
                        {t.groups}
                      </td>

                      {/* O'quvchi soni */}
                      <td className="px-4 py-3 text-right text-[13px] text-gray-500 dark:text-gray-400 tabular-nums">
                        {t.students}
                      </td>

                      {/* Davomat % */}
                      <td className="px-4 py-3 text-right">
                        <span className={cn("inline-flex items-center text-[12px] font-bold px-2.5 py-1 rounded-full tabular-nums", pctGood
                        ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400")}>
                          {pct}%
                        </span>
                      </td>

                      {/* O'rtacha ball */}
                      <td className="px-4 py-3 text-right text-[13px] font-semibold text-gray-700 dark:text-gray-200 tabular-nums">
                        {t.averageScore !== null && t.averageScore !== undefined ? Math.round(t.averageScore) : <span className="text-gray-300 font-normal">—</span>}
                      </td>

                      {/* Reyting */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (<Star key={s} className="w-3.5 h-3.5" fill={s <= stars ? "#f59e0b" : "none"} stroke={s <= stars ? "#f59e0b" : "#d1d5db"}/>))}
                        </div>
                      </td>

                      {/* Daromad */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {money(t.revenue)} so&apos;m
                        </span>
                      </td>
                    </tr>);
            })}
              </tbody>
            </table>
          </div>)}
      </div>
    </div>);
}
