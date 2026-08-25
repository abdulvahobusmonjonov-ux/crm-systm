"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface Student { leadId: string; fullName: string; phone: string; }
type JournalData = Record<string, Record<string, string | null>>;

const CYCLE: Record<string, string | null> = { present: "absent", absent: "excused", excused: null };
const next = (s: string | null | undefined): string | null => CYCLE[s ?? ""] ?? "present";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysInMonth(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const total = new Date(y, m, 0).getDate();
  return Array.from({ length: total }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
}
function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay() === 0 || d.getDay() === 6;
}

export default function AttendanceTab({ groupId, month }: { groupId: string; month: string }) {
  const { data: session } = useSession();
  const isAdminRole = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";
  const canEdit = isAdminRole || !!session?.user?.canManageAttendance;
  const [students, setStudents] = useState<Student[]>([]);
  const [journal, setJournal] = useState<JournalData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/teacher/groups/${groupId}/attendance?month=${month}`);
      if (!res.ok) { setError(true); setLoading(false); return; }
      const data = await res.json();
      setStudents(data.students || []);
      setJournal(data.journal || {});
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [groupId, month]);

  useEffect(() => { load(); }, [load]);

  const toggleCell = (date: string, leadId: string) => {
    if (!canEdit) return;
    setJournal((prev) => {
      const dayData = { ...(prev[date] || {}) };
      dayData[leadId] = next(dayData[leadId]);
      if (dayData[leadId] === null) delete dayData[leadId];
      return { ...prev, [date]: dayData };
    });
  };

  const save = async () => {
    const activeDates = Object.keys(journal).filter((d) => journal[d] && Object.keys(journal[d]).length > 0);
    if (!activeDates.length) { toast.error("Hech narsa belgilanmagan"); return; }
    setSaving(true);
    const results = await Promise.all(
      activeDates.map(async (date) => {
        const records = Object.entries(journal[date] || {})
          .filter(([, status]) => status)
          .map(([leadId, status]) => ({ leadId, status: status! }));
        if (!records.length) return true;
        try {
          const res = await fetch(`/api/teacher/groups/${groupId}/attendance`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, records }),
          });
          return res.ok;
        } catch {
          return false;
        }
      })
    );
    setSaving(false);
    if (results.every(Boolean)) toast.success("Davomat saqlandi");
    else toast.error("Ba'zi kunlar saqlanmadi");
  };

  const days = daysInMonth(month);
  const today = todayStr();

  const getPercent = (leadId: string) => {
    let present = 0, total = 0;
    days.forEach((d) => {
      const st = journal[d]?.[leadId];
      if (st) { total++; if (st === "present") present++; }
    });
    return total > 0 ? Math.round((present / total) * 100) : null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3 text-[12px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] font-bold">✓</span> Keldi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[9px] font-bold">✕</span> Kelmadi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-white text-[9px] font-bold">🚩</span> Sababli
          </span>
        </div>
        {students.length > 0 && canEdit && (
          <button
            onClick={save}
            disabled={saving}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        )}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>
        ) : error ? (
          <div className="py-16 text-center text-[13px] text-red-500">Ma&apos;lumotni yuklab bo&apos;lmadi. Sahifani yangilab ko&apos;ring.</div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-gray-400">Bu guruhda o&apos;quvchi yo&apos;q</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="sticky left-0 z-20 bg-white dark:bg-gray-900 px-4 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide min-w-[180px] whitespace-nowrap border-r border-gray-100 dark:border-white/5">
                    O&apos;quvchi
                  </th>
                  {days.map((d) => {
                    const day = Number(d.slice(8));
                    const weekend = isWeekend(d);
                    const isToday = d === today;
                    return (
                      <th key={d} className={cn(
                        "px-0 py-3 text-center text-[11px] font-medium min-w-[32px] w-8",
                        weekend ? "text-gray-300 dark:text-gray-600" : "text-gray-400 dark:text-gray-500",
                        isToday && "text-[#5E2CA5] dark:text-purple-400 font-bold"
                      )}>
                        {day}
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide min-w-[56px] border-l border-gray-100 dark:border-white/5">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {students.map((s, rowIdx) => {
                  const pct = getPercent(s.leadId);
                  const pctColor = pct === null ? "" : pct >= 90 ? "text-emerald-600 dark:text-emerald-400" : pct >= 80 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";
                  return (
                    <tr key={s.leadId} className={cn("hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors duration-100", rowIdx % 2 === 1 && "bg-gray-50/30 dark:bg-white/[0.02]")}>
                      <td className="sticky left-0 z-10 bg-inherit px-4 py-2 border-r border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: "#5E2CA5" }}>
                            {getInitials(s.fullName)}
                          </div>
                          <span className="text-[13px] font-medium text-gray-900 dark:text-white truncate max-w-[120px]">{s.fullName}</span>
                        </div>
                      </td>
                      {days.map((d) => {
                        const status = journal[d]?.[s.leadId] ?? null;
                        const weekend = isWeekend(d);
                        const isToday = d === today;
                        return (
                          <td key={d} className={cn("px-0 py-2 text-center", isToday && "bg-[#5E2CA5]/5 dark:bg-[#5E2CA5]/8")}>
                            <button
                              onClick={() => toggleCell(d, s.leadId)}
                              disabled={!canEdit}
                              title={!canEdit ? "Davomat belgilash uchun ruxsat yo'q" : status === "present" ? "Keldi" : status === "absent" ? "Kelmadi" : status === "excused" ? "Sababli" : weekend ? "Dam olish kuni" : "Belgilang"}
                              className={cn(
                                "w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[9px] font-bold transition-all duration-100",
                                !canEdit && "cursor-not-allowed opacity-80",
                                status === "present" ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                                  : status === "absent" ? "bg-red-500 text-white hover:bg-red-600 shadow-sm"
                                  : status === "excused" ? "bg-amber-400 text-white hover:bg-amber-500 shadow-sm"
                                  : weekend ? "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                              )}
                            >
                              {status === "present" ? "✓" : status === "absent" ? "✕" : status === "excused" ? "🚩" : "–"}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-4 py-2 text-center border-l border-gray-100 dark:border-white/5">
                        {pct !== null ? <span className={cn("text-[13px] font-bold tabular-nums", pctColor)}>{pct}%</span> : <span className="text-[12px] text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
