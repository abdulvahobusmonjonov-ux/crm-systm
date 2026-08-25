"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface Student { leadId: string; fullName: string; phone: string; }
type JournalData = Record<string, Record<string, number | null>>;

function daysInMonth(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const total = new Date(y, m, 0).getDate();
  return Array.from({ length: total }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
}
function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay() === 0 || d.getDay() === 6;
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ScoresTab({ groupId, month }: { groupId: string; month: string }) {
  const { data: session } = useSession();
  const isAdminRole = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";
  const canEdit = isAdminRole || !!session?.user?.canManageGrades;
  const [students, setStudents] = useState<Student[]>([]);
  const [journal, setJournal] = useState<JournalData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<{ date: string; leadId: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/teacher/groups/${groupId}/scores?month=${month}`);
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

  const setScore = (date: string, leadId: string, value: string) => {
    const n = value === "" ? null : Math.max(0, Math.min(100, Number(value)));
    setJournal((prev) => {
      const dayData = { ...(prev[date] || {}) };
      if (n === null || Number.isNaN(n)) delete dayData[leadId];
      else dayData[leadId] = n;
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
          .filter(([, score]) => score !== null && score !== undefined)
          .map(([leadId, score]) => ({ leadId, score: score as number }));
        if (!records.length) return true;
        try {
          const res = await fetch(`/api/teacher/groups/${groupId}/scores`, {
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
    if (results.every(Boolean)) toast.success("Ballar saqlandi");
    else toast.error("Ba'zi kunlar saqlanmadi");
  };

  const days = daysInMonth(month);
  const today = todayStr();

  const getAverage = (leadId: string) => {
    const values = days.map((d) => journal[d]?.[leadId]).filter((v): v is number => typeof v === "number");
    return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        {students.length > 0 && canEdit && (
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors disabled:opacity-60"
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
                        "px-0 py-3 text-center text-[11px] font-medium min-w-[40px] w-10",
                        weekend ? "text-gray-300 dark:text-gray-600" : "text-gray-400 dark:text-gray-500",
                        isToday && "text-[#5E2CA5] dark:text-purple-400 font-bold"
                      )}>
                        {day}
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide min-w-[64px] border-l border-gray-100 dark:border-white/5">O&apos;rtacha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {students.map((s, rowIdx) => {
                  const avg = getAverage(s.leadId);
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
                        const value = journal[d]?.[s.leadId];
                        const isToday = d === today;
                        const isEditing = editing?.date === d && editing?.leadId === s.leadId;
                        return (
                          <td key={d} className={cn("px-0.5 py-2 text-center", isToday && "bg-[#5E2CA5]/5 dark:bg-[#5E2CA5]/8")}>
                            {isEditing ? (
                              <input
                                autoFocus
                                type="number"
                                min={0}
                                max={100}
                                defaultValue={value ?? ""}
                                onBlur={(e) => { setScore(d, s.leadId, e.target.value); setEditing(null); }}
                                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditing(null); }}
                                className="w-9 h-7 text-center text-[12px] rounded-lg border border-[#5E2CA5]/40 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30"
                              />
                            ) : (
                              <button
                                onClick={() => canEdit && setEditing({ date: d, leadId: s.leadId })}
                                disabled={!canEdit}
                                className={cn(
                                  "w-9 h-7 rounded-lg mx-auto flex items-center justify-center text-[12px] font-semibold transition-colors",
                                  !canEdit && "cursor-not-allowed opacity-80",
                                  typeof value === "number"
                                    ? value >= 80 ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                    : value >= 50 ? "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                    : "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                                )}
                              >
                                {typeof value === "number" ? value : "–"}
                              </button>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2 text-center border-l border-gray-100 dark:border-white/5">
                        {avg !== null ? <span className="text-[13px] font-bold tabular-nums text-gray-700 dark:text-gray-300">{avg}</span> : <span className="text-[12px] text-gray-300 dark:text-gray-600">—</span>}
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
