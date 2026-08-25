"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Save, Check } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { MonthPicker } from "@/components/ui/date-picker";

interface Student { leadId: string; fullName: string; phone: string; status: string | null; }

// journal[date][leadId] = status string | null
type JournalData = Record<string, Record<string, string | null>>;

const BRAND = "#5E2CA5";

// Status cycle on click: null → present → absent → null
const CYCLE: Record<string, string | null> = { present: "absent", absent: null };
const next = (s: string | null | undefined): string | null => CYCLE[s ?? ""] ?? "present";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function ym(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function daysInMonth(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const total = new Date(y, m, 0).getDate();
  return Array.from({ length: total }, (_, i) =>
    `${month}-${String(i + 1).padStart(2, "0")}`
  );
}
function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay() === 0 || d.getDay() === 6;
}

const selectCls =
  "px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition";

interface GroupOption { id: string; name: string; }

export default function AttendancePage() {
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [groupId, setGroupId] = useState("");
  const [month, setMonth] = useState(ym(new Date()));
  const [students, setStudents] = useState<Student[]>([]);
  const [journal, setJournal] = useState<JournalData>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/groups?limit=500").then(r => r.json()).then(d => {
      const list = Array.isArray(d?.groups) ? d.groups : [];
      setGroups(list);
      if (list.length && !groupId) setGroupId(list[0].id);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    if (!groupId || !month) return;
    setLoading(true);

    // Try monthly endpoint first, fall back to single-date format
    const res = await fetch(`/api/attendance?groupId=${groupId}&month=${month}`);
    const data = await res.json();
    setStudents(data.students || []);

    if (data.journal) {
      // Backend returned monthly journal format
      setJournal(data.journal);
    } else if (Array.isArray(data.dates)) {
      // Backend returned array of { date, records } objects
      const j: JournalData = {};
      data.dates.forEach((entry: { date: string; records?: { leadId: string; status: string | null }[] }) => {
        j[entry.date] = {};
        (entry.records || []).forEach((r) => { j[entry.date][r.leadId] = r.status; });
      });
      setJournal(j);
    } else {
      // Single-day fallback: fetch today's data
      const today = todayStr();
      const dayRes = await fetch(`/api/attendance?groupId=${groupId}&date=${today}`);
      const dayData = await dayRes.json();
      const dayStudents: Student[] = dayData.students || [];
      if (!data.students?.length) setStudents(dayStudents);
      const j: JournalData = {};
      dayStudents.forEach(s => { if (s.status) { if (!j[today]) j[today] = {}; j[today][s.leadId] = s.status; } });
      setJournal(j);
    }

    setLoading(false);
  }, [groupId, month]);

  useEffect(() => { load(); }, [load]);

  // Toggle a cell: cycles null → present → absent → null
  const toggleCell = (date: string, leadId: string) => {
    setJournal(prev => {
      const dayData = { ...(prev[date] || {}) };
      dayData[leadId] = next(dayData[leadId]);
      if (dayData[leadId] === null) delete dayData[leadId];
      return { ...prev, [date]: dayData };
    });
  };

  // Mark all students as present for today
  const setAll = (status: string) => {
    const today = todayStr();
    setJournal(prev => {
      const dayData: Record<string, string> = {};
      students.forEach(s => { dayData[s.leadId] = status; });
      return { ...prev, [today]: dayData };
    });
  };

  const save = async () => {
    const activeDates = Object.keys(journal).filter(d => {
      const records = journal[d];
      return records && Object.keys(records).length > 0;
    });
    if (!activeDates.length) { toast.error("Hech narsa belgilanmagan"); return; }
    setSaving(true);
    await Promise.all(
      activeDates.map(date => {
        const records = Object.entries(journal[date] || {})
          .filter(([, status]) => status)
          .map(([leadId, status]) => ({ leadId, status: status! }));
        if (!records.length) return Promise.resolve();
        return fetch("/api/attendance", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupId, date, records }),
        });
      })
    );
    setSaving(false);
    toast.success("Davomat saqlandi");
  };

  const days = daysInMonth(month);
  const today = todayStr();
  const selectedGroup = groups.find(g => g.id === groupId);

  // Attendance % per student
  const getPercent = (leadId: string) => {
    let present = 0, total = 0;
    days.forEach(d => {
      const st = journal[d]?.[leadId];
      if (st) { total++; if (st === "present" || st === "late") present++; }
    });
    return total > 0 ? Math.round((present / total) * 100) : null;
  };

  // Summary counts for today
  const todayData = journal[today] || {};
  const presentCount = students.filter(s => todayData[s.leadId] === "present").length;
  const absentCount = students.filter(s => todayData[s.leadId] === "absent").length;

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Davomat</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {selectedGroup?.name || "—"} · {month}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={groupId}
            onChange={e => setGroupId(e.target.value)}
            className={selectCls}
          >
            {groups.length === 0 && <option value="">Guruh yo&apos;q</option>}
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>

          <MonthPicker
            value={month}
            onChange={e => setMonth(e.target.value)}
            className={selectCls}
          />

          <button
            onClick={() => setAll("present")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Check className="w-3.5 h-3.5" /> Hammasi keldi
          </button>

          {students.length > 0 && (
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          )}
        </div>
      </div>

      {/* Legend + today summary */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Legend */}
        <div className="flex items-center gap-3 text-[12px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">✓</span>
            Keldi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">✕</span>
            Kelmadi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            Dars yo&apos;q
          </span>
        </div>

        {/* Today's summary chips */}
        {students.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              ✓ {presentCount} keldi
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400">
              ✕ {absentCount} kelmadi
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
              – {students.length - presentCount - absentCount} belgilanmagan
            </span>
          </div>
        )}
      </div>

      {/* Journal table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-2xl mb-3">📋</p>
            <p className="text-[13px] text-gray-500 font-medium">Bu guruhda o&apos;quvchi yo&apos;q</p>
            <p className="text-[12px] text-gray-400 mt-1">Avval lidlarni guruhga qo&apos;shing</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  {/* Student name header */}
                  <th className="sticky left-0 z-20 bg-white dark:bg-gray-900 px-4 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide min-w-[200px] whitespace-nowrap border-r border-gray-100 dark:border-white/5">
                    O&apos;quvchi
                  </th>

                  {/* Day headers */}
                  {days.map(d => {
                    const day = Number(d.slice(8));
                    const weekend = isWeekend(d);
                    const isToday = d === today;
                    return (
                      <th
                        key={d}
                        className={cn(
                          "px-0 py-3 text-center text-[11px] font-medium min-w-[32px] w-8",
                          weekend ? "text-gray-300 dark:text-gray-600" : "text-gray-400 dark:text-gray-500",
                          isToday && "text-[#5E2CA5] dark:text-purple-400 font-bold"
                        )}
                      >
                        {day}
                      </th>
                    );
                  })}

                  {/* Percentage header */}
                  <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide min-w-[56px] border-l border-gray-100 dark:border-white/5">
                    %
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {students.map((s, rowIdx) => {
                  const pct = getPercent(s.leadId);
                  const pctColor =
                    pct === null ? "" :
                    pct >= 90 ? "text-emerald-600 dark:text-emerald-400" :
                    pct >= 80 ? "text-amber-600 dark:text-amber-400" :
                    "text-red-600 dark:text-red-400";

                  return (
                    <tr
                      key={s.leadId}
                      className={cn(
                        "hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors duration-100",
                        rowIdx % 2 === 1 && "bg-gray-50/30 dark:bg-white/[0.02]"
                      )}
                    >
                      {/* Student cell — sticky */}
                      <td className="sticky left-0 z-10 bg-inherit px-4 py-2 border-r border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                            style={{ backgroundColor: BRAND }}
                          >
                            {getInitials(s.fullName)}
                          </div>
                          <span className="text-[13px] font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                            {s.fullName}
                          </span>
                        </div>
                      </td>

                      {/* Day cells */}
                      {days.map(d => {
                        const status = journal[d]?.[s.leadId] ?? null;
                        const weekend = isWeekend(d);
                        const isToday = d === today;

                        return (
                          <td key={d} className={cn("px-0 py-2 text-center", isToday && "bg-[#5E2CA5]/5 dark:bg-[#5E2CA5]/8")}>
                            <button
                              onClick={() => !weekend && toggleCell(d, s.leadId)}
                              disabled={weekend}
                              title={
                                status === "present" ? "Keldi" :
                                status === "absent" ? "Kelmadi" :
                                status === "late" ? "Kech keldi" :
                                status === "excused" ? "Sababli" :
                                weekend ? "Dam olish kuni" : "Belgilang"
                              }
                              className={cn(
                                "w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[8px] font-bold transition-all duration-100",
                                status === "present"
                                  ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                                  : status === "absent"
                                  ? "bg-red-500 text-white hover:bg-red-600 shadow-sm"
                                  : status === "late"
                                  ? "bg-amber-400 text-white hover:bg-amber-500 shadow-sm"
                                  : status === "excused"
                                  ? "bg-blue-500 text-white hover:bg-blue-600 shadow-sm"
                                  : weekend
                                  ? "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-default"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                              )}
                            >
                              {status === "present" ? "✓"
                               : status === "absent" ? "✕"
                               : status === "late" ? "K"
                               : status === "excused" ? "S"
                               : "–"}
                            </button>
                          </td>
                        );
                      })}

                      {/* Percentage cell */}
                      <td className="px-4 py-2 text-center border-l border-gray-100 dark:border-white/5">
                        {pct !== null ? (
                          <span className={cn("text-[13px] font-bold tabular-nums", pctColor)}>
                            {pct}%
                          </span>
                        ) : (
                          <span className="text-[12px] text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom save bar (visible when scrolled down) */}
      {students.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      )}
    </div>
  );
}
