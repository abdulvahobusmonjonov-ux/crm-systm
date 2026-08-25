"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, TrendingDown, Flame, BarChart2, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DatePicker, MonthPicker } from "@/components/ui/date-picker";
import { useConfirm } from "@/components/ui/confirm";
import { Modal, ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/modal";
import { exportToCsv } from "@/lib/export";
import { cn } from "@/lib/utils";

interface Expense {
  id: string; amount: string; category: string; note: string | null;
  method?: string | null; spentAt: string;
  createdBy: { fullName: string } | null;
}

function money(v: number | string) { return Number(v || 0).toLocaleString("ru-RU"); }
function ym(d: Date)   { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysInMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

const METHODS: Record<string, string> = { cash: "Naqd", card: "Karta", transfer: "O'tkazma", other: "Boshqa" };

const CAT_PALETTE = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#5E2CA5","#14b8a6","#ec4899"];
function catColor(cat: string): string {
  const code = (cat?.charCodeAt(0) ?? 0) + (cat?.charCodeAt(1) ?? 0);
  return CAT_PALETTE[code % CAT_PALETTE.length];
}

const TH = "px-4 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap";
const fieldCls =
  "w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition";
const labelCls = "block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1.5";

export default function ExpensesPage() {
  const { confirm, dialog } = useConfirm();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary]   = useState<{ total: number; count: number }>({ total: 0, count: 0 });
  const [month, setMonth]       = useState(ym(new Date()));
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm] = useState({ amount: "", category: "", note: "", method: "cash", spentAt: todayStr() });
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month });
    const res = await fetch(`/api/expenses?${params}`);
    if (res.ok) {
      const d = await res.json();
      setExpenses(d.expenses || []);
      setSummary(d.summary || { total: 0, count: 0 });
    }
    setLoading(false);
  }, [month]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.amount || Number(form.amount) <= 0) { toast.error("Summani kiriting"); return; }
    if (!form.category.trim()) { toast.error("Kategoriyani kiriting"); return; }
    setSaving(true);
    const res = await fetch("/api/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Xarajat qo'shildi");
      setShowAdd(false);
      setForm({ amount: "", category: "", note: "", method: "cash", spentAt: todayStr() });
      load();
    } else toast.error("Saqlab bo'lmadi");
  };

  const del = async (id: string) => {
    if (!(await confirm({ title: "Xarajatni o'chirish", message: "Bu xarajatni o'chirishni tasdiqlaysizmi?" }))) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("O'chirildi"); load(); } else toast.error("O'chirib bo'lmadi");
  };

  const exportExpenses = () => {
    if (!expenses.length) { toast.error("Eksport qilish uchun xarajat yo'q"); return; }
    exportToCsv(`xarajatlar-${month}`, expenses.map(e => ({
      "Kategoriya": e.category,
      "Summa": e.amount,
      "To'lov turi": METHODS[e.method || ""] || e.method || "",
      "Izoh": e.note || "",
      "Sana": e.spentAt,
      "Qo'shdi": e.createdBy?.fullName || "",
    })));
  };

  // Derived stats
  const avgDaily = summary.total > 0
    ? Math.round(Number(summary.total) / daysInMonth(month))
    : 0;

  const catTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    if (e.category) acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});
  const topCat = Object.entries(catTotals).sort(([, a], [, b]) => b - a)[0];

  const kpiCards = [
    {
      label: `Bu oy xarajat (${month})`,
      value: `−${money(summary.total)} so'm`,
      icon: TrendingDown,
      chip: "bg-red-500/10 text-red-600",
    },
    {
      label: "O'rtacha kunlik",
      value: avgDaily > 0 ? `${money(avgDaily)} so'm` : "—",
      icon: BarChart2,
      chip: "bg-amber-500/10 text-amber-600",
    },
    {
      label: "Eng katta kategoriya",
      value: topCat ? topCat[0] : "—",
      sub: topCat ? `${money(topCat[1])} so'm` : undefined,
      icon: Flame,
      chip: "bg-[#5E2CA5]/10 text-[#5E2CA5]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {dialog}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Xarajatlar</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{month} · {summary.count} ta yozuv</p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker
            value={month} onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 text-[13px]"
          />
          <button
            onClick={exportExpenses}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Download className="w-4 h-4" /> Eksport
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Xarajat qo&apos;shish
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
                {card.sub && <p className="text-[11px] text-gray-400 mt-0.5">{card.sub}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <TrendingDown className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-[13px] text-gray-400">Bu oyda xarajat yo&apos;q</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className={TH}>Sana</th>
                  <th className={TH}>Kategoriya</th>
                  <th className={TH}>Izoh</th>
                  <th className={TH}>To&apos;lov turi</th>
                  <th className={cn(TH, "text-right")}>Summa</th>
                  <th className={cn(TH, "w-10")}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {expenses.map(e => {
                  const color = catColor(e.category);
                  return (
                    <tr key={e.id} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors duration-100">

                      {/* Sana */}
                      <td className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400 whitespace-nowrap tabular-nums">
                        {new Date(e.spentAt).toLocaleDateString("ru-RU")}
                      </td>

                      {/* Kategoriya — rangli badge */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ backgroundColor: color + "18", color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          {e.category}
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

                      {/* Summa — qizil, minus belgili */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="text-[14px] font-bold text-red-600 dark:text-red-400">
                          −{money(e.amount)} so&apos;m
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
                  <td colSpan={4} className="px-4 py-3 text-[12px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    Jami · {expenses.length} ta xarajat
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[14px] font-bold text-red-600 dark:text-red-400">
                      −{money(summary.total)} so&apos;m
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
          title="Xarajat qo'shish"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <ModalPrimaryButton onClick={save} loading={saving}>Saqlash</ModalPrimaryButton>
              <ModalSecondaryButton onClick={() => setShowAdd(false)}>Bekor qilish</ModalSecondaryButton>
            </>
          }
        >
            <Input label="Summa (so'm)" type="number" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="500000" />

            <Input label="Kategoriya" value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ijara / Kommunal / Reklama..." />

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
                <DatePicker value={form.spentAt}
                  onChange={e => setForm(f => ({ ...f, spentAt: e.target.value }))}
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
