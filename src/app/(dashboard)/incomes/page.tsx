"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, PlusCircle, Sparkles, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DatePicker, MonthPicker } from "@/components/ui/date-picker";
import { useConfirm } from "@/components/ui/confirm";
import { Modal, ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface Income {
  id: string; amount: string; source: string; note: string | null;
  method?: string | null; receivedAt: string;
  createdBy: { fullName: string } | null;
}

function money(v: number | string) { return Number(v || 0).toLocaleString("ru-RU"); }
function ym(d: Date)   { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const METHODS: Record<string, string> = { cash: "Naqd", card: "Karta", transfer: "O'tkazma", other: "Boshqa" };

const SRC_PALETTE = ["#10b981","#3b82f6","#f59e0b","#8b5cf6","#06b6d4","#f97316","#5E2CA5","#14b8a6","#ec4899","#ef4444"];
function srcColor(src: string): string {
  const code = (src?.charCodeAt(0) ?? 0) + (src?.charCodeAt(1) ?? 0);
  return SRC_PALETTE[code % SRC_PALETTE.length];
}

const TH = "px-4 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap";
const fieldCls =
  "w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition";
const labelCls = "block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1.5";

export default function IncomesPage() {
  const { confirm, dialog } = useConfirm();
  const [incomes, setIncomes]   = useState<Income[]>([]);
  const [summary, setSummary]   = useState<{ total: number; count: number }>({ total: 0, count: 0 });
  const [month, setMonth]       = useState(ym(new Date()));
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm] = useState({ amount: "", source: "", note: "", method: "cash", receivedAt: todayStr() });
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month });
    const res = await fetch(`/api/incomes?${params}`);
    if (res.ok) {
      const d = await res.json();
      setIncomes(d.incomes || []);
      setSummary(d.summary || { total: 0, count: 0 });
    }
    setLoading(false);
  }, [month]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.amount || Number(form.amount) <= 0) { toast.error("Summani kiriting"); return; }
    if (!form.source.trim()) { toast.error("Manbani kiriting"); return; }
    setSaving(true);
    const res = await fetch("/api/incomes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Daromad qo'shildi");
      setShowAdd(false);
      setForm({ amount: "", source: "", note: "", method: "cash", receivedAt: todayStr() });
      load();
    } else toast.error("Saqlab bo'lmadi");
  };

  const del = async (id: string) => {
    if (!(await confirm({ title: "Daromadni o'chirish", message: "Bu daromadni o'chirishni tasdiqlaysizmi?" }))) return;
    const res = await fetch(`/api/incomes/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("O'chirildi"); load(); } else toast.error("O'chirib bo'lmadi");
  };

  // Derived — top source
  const srcTotals = incomes.reduce<Record<string, number>>((acc, e) => {
    if (e.source) acc[e.source] = (acc[e.source] || 0) + Number(e.amount);
    return acc;
  }, {});
  const topSrc = Object.entries(srcTotals).sort(([, a], [, b]) => b - a)[0];

  const kpiCards = [
    {
      label: `Bu oy qo'shimcha (${month})`,
      value: `+${money(summary.total)} so'm`,
      icon: PlusCircle,
      chip: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Eng katta manba",
      value: topSrc ? topSrc[0] : "—",
      sub: topSrc ? `+${money(topSrc[1])} so'm` : undefined,
      icon: Sparkles,
      chip: "bg-[#5E2CA5]/10 text-[#5E2CA5]",
    },
    {
      label: "Yozuvlar soni",
      value: String(summary.count),
      icon: Hash,
      chip: "bg-blue-500/10 text-blue-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {dialog}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Qo&apos;shimcha daromad</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{month} · kurs to&apos;lovidan tashqari</p>
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
            <Plus className="w-4 h-4" /> Daromad qo&apos;shish
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
                {card.sub && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">{card.sub}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>
        ) : incomes.length === 0 ? (
          <div className="py-16 text-center">
            <PlusCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-[13px] text-gray-400">Bu oyda qo&apos;shimcha daromad yo&apos;q</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className={TH}>Sana</th>
                  <th className={TH}>Manba</th>
                  <th className={TH}>Izoh</th>
                  <th className={TH}>To&apos;lov turi</th>
                  <th className={cn(TH, "text-right")}>Summa</th>
                  <th className={cn(TH, "w-10")}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {incomes.map(e => {
                  const color = srcColor(e.source);
                  return (
                    <tr key={e.id} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors duration-100">

                      {/* Sana */}
                      <td className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400 whitespace-nowrap tabular-nums">
                        {new Date(e.receivedAt).toLocaleDateString("ru-RU")}
                      </td>

                      {/* Manba — rangli badge */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ backgroundColor: color + "18", color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          {e.source}
                        </span>
                      </td>

                      {/* Izoh */}
                      <td className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                        {e.note || <span className="text-gray-300">—</span>}
                      </td>

                      {/* To'lov turi */}
                      <td className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {e.method ? (METHODS[e.method] || e.method) : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Summa — yashil, plus belgili */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400">
                          +{money(e.amount)} so&apos;m
                        </span>
                      </td>

                      {/* Delete */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => del(e.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer total */}
              <tfoot>
                <tr className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                  <td colSpan={4} className="px-4 py-3 text-[12px] font-semibold text-gray-400 uppercase tracking-wide">
                    Jami · {incomes.length} ta daromad
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400">
                      +{money(summary.total)} so&apos;m
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <Modal
          title="Daromad qo'shish"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <ModalPrimaryButton onClick={save} loading={saving}>Saqlash</ModalPrimaryButton>
              <ModalSecondaryButton onClick={() => setShowAdd(false)}>Bekor qilish</ModalSecondaryButton>
            </>
          }
        >
            <Input label="Summa (so'm)" type="number" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="1000000" />

            <Input label="Manba" value={form.source}
              onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="Sotuv / Tadbir / Boshqa..." />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>To&apos;lov turi</label>
                <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} className={fieldCls}>
                  <option value="cash">Naqd</option>
                  <option value="card">Karta</option>
                  <option value="transfer">O&apos;tkazma</option>
                  <option value="other">Boshqa</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Sana</label>
                <DatePicker value={form.receivedAt}
                  onChange={e => setForm(f => ({ ...f, receivedAt: e.target.value }))}
                  className={fieldCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Izoh (ixtiyoriy)</label>
              <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="..." className={fieldCls} />
            </div>

        </Modal>
      )}
    </div>
  );
}
