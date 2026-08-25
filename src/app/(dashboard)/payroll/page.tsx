"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Wallet, CheckCircle2, Hourglass, Users2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MonthPicker } from "@/components/ui/date-picker";
import { useConfirm } from "@/components/ui/confirm";
import { Modal, ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/permissions";

function money(v: number | string) { return Number(v || 0).toLocaleString("ru-RU"); }
function ym(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }

const TH = "px-4 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap";
const fieldCls =
  "w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition";
const labelCls = "block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1.5";

interface ByUserRow { userId: string; name: string; role: string; salary: number; bonus: number; total: number; }
interface SalaryRecord { id: string; type: string; amount: string | number; note: string | null; user: { fullName: string } | null; }
interface PayrollData { byUser: ByUserRow[]; records: SalaryRecord[]; total: number; }

export default function PayrollPage() {
  const { confirm, dialog } = useConfirm();
  const [data, setData] = useState<PayrollData>({ byUser: [], records: [], total: 0 });
  const [users, setUsers] = useState<{ id: string; fullName: string }[]>([]);
  const [month, setMonth] = useState(ym(new Date()));
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ userId: "", amount: "", type: "salary", note: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/payroll?month=${month}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [month]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetch("/api/users").then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : [])); }, []);

  const save = async () => {
    if (!form.userId) { toast.error("Xodimni tanlang"); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error("Summani kiriting"); return; }
    setSaving(true);
    const res = await fetch("/api/payroll", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, month }) });
    setSaving(false);
    if (res.ok) { toast.success("Saqlandi"); setShowAdd(false); setForm({ userId: "", amount: "", type: "salary", note: "" }); load(); }
    else toast.error("Saqlab bo'lmadi");
  };

  const del = async (id: string) => {
    if (!(await confirm({ title: "Yozuvni o'chirish", message: "Bu ish haqi yozuvini o'chirishni tasdiqlaysizmi?" }))) return;
    const res = await fetch(`/api/payroll/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("O'chirildi"); load(); } else toast.error("O'chirib bo'lmadi");
  };

  // Hisoblangan va to'langan summalar hozircha bir xil — tizimda faqat amalda to'langan yozuvlar saqlanadi
  const totalCalculated = Number(data.total || 0);
  const totalPaid = totalCalculated;
  const totalRemaining = totalCalculated - totalPaid;

  const kpiCards = [
    { label: `Jami hisoblangan (${month})`, value: `${money(totalCalculated)} so'm`, icon: Wallet, chip: "bg-[#5E2CA5]/10 text-[#5E2CA5]" },
    { label: "To'langan", value: `${money(totalPaid)} so'm`, icon: CheckCircle2, chip: "bg-green-500/10 text-green-600" },
    { label: "Qoldiq", value: `${money(totalRemaining)} so'm`, icon: Hourglass, chip: "bg-amber-500/10 text-amber-600" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {dialog}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Ish haqi</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Xodimlar oyligi va bonuslari</p>
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
            <Plus className="w-4 h-4" /> Ish haqi qo&apos;shish
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpiCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 flex items-start gap-4">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", card.chip)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-0.5">{card.label}</p>
                <p className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight truncate">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-user summary */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>
        ) : (data.byUser || []).length === 0 ? (
          <div className="py-16 text-center">
            <Wallet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-[13px] text-gray-400">Bu oyda yozuv yo&apos;q</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className={TH}>O&apos;qituvchi</th>
                  <th className={TH}>Lavozim</th>
                  <th className={TH}>Guruhlar</th>
                  <th className={cn(TH, "text-right")}>Hisoblangan</th>
                  <th className={cn(TH, "text-right")}>To&apos;langan</th>
                  <th className={TH}>Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {data.byUser.map((u) => {
                  const paid = Number(u.total || 0);
                  return (
                    <tr key={u.userId} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors duration-100">
                      <td className="px-4 py-3 text-[13px] font-medium text-gray-900 dark:text-white whitespace-nowrap">{u.name}</td>
                      <td className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-gray-400">
                        <span className="inline-flex items-center gap-1.5"><Users2 className="w-3.5 h-3.5 text-gray-300" />—</span>
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-semibold text-gray-900 dark:text-white whitespace-nowrap">{money(u.total)} so&apos;m</td>
                      <td className="px-4 py-3 text-right text-[13px] font-semibold text-green-600 whitespace-nowrap">{money(paid)} so&apos;m</td>
                      <td className="px-4 py-3">
                        {paid > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> To&apos;langan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" /> —
                          </span>
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

      {/* Detailed records */}
      {(data.records || []).length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 px-1">Yozuvlar</p>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <th className={TH}>Xodim</th>
                    <th className={TH}>Turi</th>
                    <th className={cn(TH, "text-right")}>Summa</th>
                    <th className={TH}>Izoh</th>
                    <th className={cn(TH, "w-10")}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                  {data.records.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors duration-100">
                      <td className="px-4 py-2.5 text-[13px] text-gray-900 dark:text-white whitespace-nowrap">{r.user?.fullName || "—"}</td>
                      <td className="px-4 py-2.5">
                        {r.type === "bonus" ? (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600">Bonus</span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 dark:bg-white/5">Oylik</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[13px] font-medium text-gray-900 dark:text-white whitespace-nowrap">{money(r.amount)} so&apos;m</td>
                      <td className="px-4 py-2.5 text-[13px] text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{r.note || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => del(r.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <Modal
          title={`Ish haqi qo'shish (${month})`}
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

            <Input label="Summa (so'm)" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="3000000" />

            <div>
              <label className={labelCls}>Turi</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={fieldCls}>
                <option value="salary">Oylik</option>
                <option value="bonus">Bonus</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Izoh (ixtiyoriy)</label>
              <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className={fieldCls} />
            </div>

        </Modal>
      )}
    </div>
  );
}
