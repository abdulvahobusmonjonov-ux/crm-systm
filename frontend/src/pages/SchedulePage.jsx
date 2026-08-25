import { useState, useEffect } from "react";
import Link from "@/components/ui/link";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { apiFetch } from "@/lib/api";
const DAYS_UZ = ["Yak", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Brand purple scale: 0 → transparent, 1–5 → light to dark
const BG_SCALE = [
    "", // 0 — empty
    "bg-[#5E2CA5]/10",
    "bg-[#5E2CA5]/25",
    "bg-[#5E2CA5]/45",
    "bg-[#5E2CA5]/65",
    "bg-[#5E2CA5]",
];
const TEXT_SCALE = [
    "text-gray-300 dark:text-gray-600",
    "text-[#5E2CA5]",
    "text-[#5E2CA5]",
    "text-[#5E2CA5] dark:text-purple-200",
    "text-white",
    "text-white",
];
const LEGEND_BG = [
    "bg-[#5E2CA5]/10",
    "bg-[#5E2CA5]/25",
    "bg-[#5E2CA5]/45",
    "bg-[#5E2CA5]",
];
export default function SchedulePage() {
    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [slots, setSlots] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCell, setSelectedCell] = useState(null);
    const [cellLeads, setCellLeads] = useState([]);
    useEffect(() => {
        Promise.all([
            apiFetch("/api/timeslots").then(r => r.json()),
            apiFetch("/api/leads?limit=200").then(r => r.json()).then(d => d.leads),
        ]).then(([s, l]) => { setSlots(s); setLeads(l); setLoading(false); });
    }, []);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const getLeadsForCell = (slotId, dayIndex) => {
        const dayName = DAYS_EN[dayIndex];
        return leads.filter(l => l.timeSlotId === slotId || l.preferredDays?.includes(dayName));
    };
    const maxCount = Math.max(1, ...slots.flatMap(slot => weekDays.map((_, i) => getLeadsForCell(slot.id, i).length)));
    const handleCellClick = (slotId, dayIndex) => {
        setSelectedCell({ slotId, dayIndex });
        setCellLeads(getLeadsForCell(slotId, dayIndex));
    };
    return (<div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Jadval</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Vaqt slotlari bo&apos;yicha talablar</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekStart(d => addDays(d, -7))} className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-[#5E2CA5] hover:border-[#5E2CA5]/30 transition-colors shadow-sm">
              <ChevronLeft className="w-4 h-4"/>
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[200px] text-center bg-white dark:bg-gray-900 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
              {format(weekStart, "d MMM")} — {format(addDays(weekStart, 6), "d MMM yyyy")}
            </span>
            <button onClick={() => setWeekStart(d => addDays(d, 7))} className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-[#5E2CA5] hover:border-[#5E2CA5]/30 transition-colors shadow-sm">
              <ChevronRight className="w-4 h-4"/>
            </button>
            <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="px-3 py-2 text-sm rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-[#5E2CA5] hover:border-[#5E2CA5]/30 transition-colors shadow-sm">
              Bugun
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Heatmap */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
              {loading ? (<div className="p-10 text-center text-gray-400 animate-pulse text-sm">Yuklanmoqda...</div>) : (<div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-white/5">
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-32">
                          Vaqt
                        </th>
                        {weekDays.map((day, i) => {
                const isToday = isSameDay(day, new Date());
                return (<th key={i} className="px-2 py-3 text-center min-w-[56px]">
                              <div className={`text-[11px] font-semibold uppercase tracking-wide ${isToday ? "text-[#5E2CA5]" : "text-gray-400"}`}>
                                {DAYS_UZ[day.getDay()]}
                              </div>
                              <div className={`text-base font-bold mt-0.5 ${isToday ? "text-[#5E2CA5]" : "text-gray-700 dark:text-gray-200"}`}>
                                {format(day, "d")}
                              </div>
                            </th>);
            })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                      {slots.filter(s => s.isActive !== false).length === 0 ? (<tr>
                          <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                            Hali vaqt slotlari yo&apos;q. Sozlamalar &rarr; Vaqt slotlari bo&apos;limidan qo&apos;shing.
                          </td>
                        </tr>) : slots.filter(s => s.isActive !== false).map(slot => (<tr key={slot.id} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                          <td className="px-4 py-3 text-[12px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {slot.label}
                          </td>
                          {weekDays.map((_, dayIdx) => {
                    const count = getLeadsForCell(slot.id, dayIdx).length;
                    const intensity = count === 0 ? 0 : Math.ceil((count / maxCount) * 5);
                    const isSelected = selectedCell?.slotId === slot.id && selectedCell?.dayIndex === dayIdx;
                    return (<td key={dayIdx} className="px-1.5 py-2 text-center">
                                <button onClick={() => handleCellClick(slot.id, dayIdx)} className={[
                            "w-full h-10 rounded-xl text-[13px] font-bold transition-all hover:scale-105 active:scale-95",
                            count === 0
                                ? "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                                : BG_SCALE[intensity],
                            TEXT_SCALE[intensity],
                            isSelected ? "ring-2 ring-[#5E2CA5] ring-offset-1 ring-offset-white dark:ring-offset-gray-900 scale-105" : "",
                        ].filter(Boolean).join(" ")}>
                                  {count > 0 ? count : "—"}
                                </button>
                              </td>);
                })}
                        </tr>))}
                    </tbody>
                  </table>
                </div>)}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 px-1">
              <span className="text-[12px] text-gray-400">Zichlik:</span>
              {["Kam", "O'rta", "Ko'p", "Juda ko'p"].map((label, i) => (<div key={label} className="flex items-center gap-1.5">
                  <div className={`w-4 h-4 rounded-md ${LEGEND_BG[i]}`}/>
                  <span className="text-[12px] text-gray-500">{label}</span>
                </div>))}
            </div>
          </div>

          {/* Detail panel */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#5E2CA5]/10 rounded-lg">
                  <Users className="w-4 h-4 text-[#5E2CA5]"/>
                </div>
                <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
                  {selectedCell
            ? `${slots.find(s => s.id === selectedCell.slotId)?.label} — ${DAYS_UZ[selectedCell.dayIndex]}`
            : "Katak tanlang"}
                </h3>
              </div>
            </div>
            <div className="p-4">
              {!selectedCell ? (<div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 bg-[#5E2CA5]/8 rounded-2xl flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-[#5E2CA5]/50"/>
                  </div>
                  <p className="text-[13px] text-gray-400">Jadvaldan katak tanlang</p>
                </div>) : cellLeads.length === 0 ? (<div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-gray-400"/>
                  </div>
                  <p className="text-[13px] text-gray-400">Bu vaqtda lid yo&apos;q</p>
                </div>) : (<div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    {cellLeads.length} ta talabgor
                  </p>
                  {cellLeads.map(l => (<Link key={l.id} href={`/leads/${l.id}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#5E2CA5]/5 dark:hover:bg-[#5E2CA5]/10 transition-colors group">
                      <div className="w-8 h-8 bg-[#5E2CA5]/12 rounded-full flex items-center justify-center text-[13px] font-bold text-[#5E2CA5] flex-shrink-0">
                        {l.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate group-hover:text-[#5E2CA5] transition-colors">
                          {l.fullName}
                        </p>
                        {l.course && (<p className="text-[11px] text-gray-400 truncate">{l.course.name}</p>)}
                      </div>
                    </Link>))}
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>);
}
