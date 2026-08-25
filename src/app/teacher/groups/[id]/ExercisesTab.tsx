"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { cn, getInitials, formatDateUz } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Modal, ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/modal";
import { DatePicker } from "@/components/ui/date-picker";

interface Student { leadId: string; fullName: string; phone: string; }
interface Exercise { id: string; title: string; date: string; scores: Record<string, number>; }

const fieldCls =
  "w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition";
const labelCls = "block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1.5";

export default function ExercisesTab({ groupId, month }: { groupId: string; month: string }) {
  const { data: session } = useSession();
  const isAdminRole = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";
  const canEdit = isAdminRole || !!session?.user?.canManageGrades;
  const [students, setStudents] = useState<Student[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ date: "", title: "" });
  const [editing, setEditing] = useState<{ exerciseId: string; leadId: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/teacher/groups/${groupId}/exercises?month=${month}`);
      if (!res.ok) { setError(true); setLoading(false); return; }
      const data = await res.json();
      setStudents(data.students || []);
      setExercises(data.exercises || []);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [groupId, month]);

  useEffect(() => { load(); }, [load]);

  const createExercise = async () => {
    if (!form.date || !form.title.trim()) { toast.error("Sana va nomni kiriting"); return; }
    setCreating(true);
    const res = await fetch(`/api/teacher/groups/${groupId}/exercises`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Mashq qo'shildi");
      setShowAdd(false);
      setForm({ date: "", title: "" });
      load();
    } else toast.error("Qo'shilmadi");
    setCreating(false);
  };

  const saveScore = async (exerciseId: string, leadId: string, value: string) => {
    const score = value === "" ? null : Math.max(0, Math.min(100, Number(value)));
    setExercises((prev) => prev.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      const scores = { ...ex.scores };
      if (score === null || Number.isNaN(score)) delete scores[leadId];
      else scores[leadId] = score;
      return { ...ex, scores };
    }));
    if (score === null || Number.isNaN(score)) return;
    const res = await fetch(`/api/teacher/groups/${groupId}/exercises/${exerciseId}/scores`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ leadId, score }] }),
    });
    if (!res.ok) toast.error("Saqlanmadi");
  };

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex items-center justify-end">
          <button
            onClick={() => { setForm({ date: "", title: "" }); setShowAdd(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Mashq qo&apos;shish
          </button>
        </div>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>
        ) : error ? (
          <div className="py-16 text-center text-[13px] text-red-500">Ma&apos;lumotni yuklab bo&apos;lmadi. Sahifani yangilab ko&apos;ring.</div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-gray-400">Bu guruhda o&apos;quvchi yo&apos;q</div>
        ) : exercises.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-gray-400">Bu oyda mashq qo&apos;shilmagan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="sticky left-0 z-20 bg-white dark:bg-gray-900 px-4 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide min-w-[180px] whitespace-nowrap border-r border-gray-100 dark:border-white/5">
                    O&apos;quvchi
                  </th>
                  {exercises.map((ex) => (
                    <th key={ex.id} className="px-2 py-3 text-center text-[11px] font-medium text-gray-500 dark:text-gray-400 min-w-[90px]" title={ex.title}>
                      <div className="truncate max-w-[90px] mx-auto font-semibold text-gray-700 dark:text-gray-200">{ex.title}</div>
                      <div className="text-[10px] text-gray-400">{formatDateUz(ex.date)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {students.map((s, rowIdx) => (
                  <tr key={s.leadId} className={cn("hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors duration-100", rowIdx % 2 === 1 && "bg-gray-50/30 dark:bg-white/[0.02]")}>
                    <td className="sticky left-0 z-10 bg-inherit px-4 py-2 border-r border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: "#5E2CA5" }}>
                          {getInitials(s.fullName)}
                        </div>
                        <span className="text-[13px] font-medium text-gray-900 dark:text-white truncate max-w-[120px]">{s.fullName}</span>
                      </div>
                    </td>
                    {exercises.map((ex) => {
                      const value = ex.scores[s.leadId];
                      const isEditing = editing?.exerciseId === ex.id && editing?.leadId === s.leadId;
                      return (
                        <td key={ex.id} className="px-1 py-2 text-center">
                          {isEditing ? (
                            <input
                              autoFocus
                              type="number"
                              min={0}
                              max={100}
                              defaultValue={value ?? ""}
                              onBlur={(e) => { saveScore(ex.id, s.leadId, e.target.value); setEditing(null); }}
                              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditing(null); }}
                              className="w-9 h-7 text-center text-[12px] rounded-lg border border-[#5E2CA5]/40 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30"
                            />
                          ) : (
                            <button
                              onClick={() => canEdit && setEditing({ exerciseId: ex.id, leadId: s.leadId })}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showAdd && (
        <Modal
          title="Yangi mashq"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <ModalPrimaryButton onClick={createExercise} loading={creating}>Qo&apos;shish</ModalPrimaryButton>
              <ModalSecondaryButton onClick={() => setShowAdd(false)}>Bekor qilish</ModalSecondaryButton>
            </>
          }
        >
          <div>
            <label className={labelCls}>Sana *</label>
            <DatePicker value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Mashq nomi *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Masalan: 3-dars mashqi"
              className={fieldCls}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
