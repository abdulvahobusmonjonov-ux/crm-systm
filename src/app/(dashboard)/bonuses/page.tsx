"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Gift, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MonthPicker } from "@/components/ui/date-picker";
import { useConfirm } from "@/components/ui/confirm";
import { Modal, ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/modal";
import { cn, getInitials } from "@/lib/utils";

const BRAND = "#5E2CA5";

function money(v: number | string) { return Number(v || 0).toLocaleString("ru-RU"); }
function ym(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }

const TH = "px-4 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap";
const fieldCls =
  "w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition";
const labelCls = "block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1.5";

interface BonusRecord {
  id: string; amount: string; note: string | null; paidAt: string;
  user: { id: string; fullName: string } | null;
}

export default function BonusesPage() {
  const { confirm, dialog } = useConfirm();
  const [records, setRecords] = useState<BonusRecord[]>([]);
  const [users, setUsers] = useState<{ id: string; fullName: string }[]>([]);
  const [month, setMonth] = useState(ym(new Date()));
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ userId: "", amount: "", note: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/payroll?month=${month}`);
    if (res.ok) {
      const data = await res.json();
      setRecords((data.records || []).filter((r: BonusRecord & { type: string }) => r.type === "bonus"));
    }
    setLoading(false);
  }, [month]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetch("/api/users").then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : [])); }, []);

  const save = async () => {
    if (!form.userId) { toast.error("Xodimni tanlang"); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error("Summani kiriting"); return; }
    setSaving(true);
    const res = await fetch("/api/payroll", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, month, type: "bonus" }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Bonus qo'shildi");
      setShowAdd(false);
      setForm({ userId: "", amount: "", note: "" });
      load();
    } else toast.error("Saqlab bo'lmadi");
  };

  const del = async (id: string) => {
    if (!(await confirm({ title: "Bonusni o'chirish", message: "Bu bonus yozuvini o'chirishni tasdiqlaysizmi?" }))) return;
    const res = await fetch(`/api/payroll/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("O'chirildi"); load(); } else toast.error("O'chirib bo'lmadi");
  };

  const totalBonus = records.reduce((a, r) => a + Number(r.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {dialog}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Bonuslar</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Xodimlarga berilgan bonuslar</p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker
            value={month} onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 text-[13px]"
          />
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Bonus qo&apos;shish
          </button>
        </div>
      </div>

      {/* KPI card */}
      <div className="max-w-xs">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Gift className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[12px] text-gray-400 mb-0.5">Jami bonus ({month})</p>
            <p className="text-[20px] font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
              {money(totalBonus)} <span className="text-[13px] font-normal text-gray-400">so&apos;m</span>
            </p>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center">
            <Gift className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-[13px] text-gray-400">Bu oyda bonus yo&apos;q</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className={TH}>Xodim</th>
                  <th className={TH}>Sabab / izoh</th>
                  <th className={cn(TH, "text-right")}>Summa</th>
                  <th className={TH}>Sana</th>
                  <th className={cn(TH, "w-10")}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors duration-100">

                    {/* Xodim + avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                          style={{ backgroundColor: BRAND }}
                        >
                          {getInitials(r.user?.fullName || "?")}
                        </div>
                        <span className="text-[13px] font-medium text-gray-900 dark:text-white truncate">
                          {r.user?.fullName || "—"}
                        </span>
                      </div>
                    </td>

                    {/* Sabab / izoh */}
                    <td className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400 max-w-[260px] truncate">
                      {r.note || <span className="text-gray-300">—</span>}
                    </td>

                    {/* Summa */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        +{money(r.amount)} so&apos;m
                      </span>
                    </td>

                    {/* Sana */}
                    <td className="px-4 py-3 text-[13px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {new Date(r.paidAt).toLocaleDateString("ru-RU")}
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => del(r.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <Modal
          title={`Bonus qo'shish (${month})`}
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <ModalPrimaryButton onClick={save} loading={saving}>Saqlash</ModalPrimaryButton>
              <ModalSecondaryButton onClick={() => setShowAdd(false)}>Bekor qilish</ModalSecondaryButton>
            </>
          }
        >
          <div>
            <label className={labelCls}>Xodim</label>
            <select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} className={fieldCls}>
              <option value="">Tanlang...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </div>

          <Input label="Summa (so'm)" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="500000" />

          <div>
            <label className={labelCls}>Sabab / izoh</label>
            <input
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Masalan: Yaxshi natija uchun"
              className={fieldCls}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
