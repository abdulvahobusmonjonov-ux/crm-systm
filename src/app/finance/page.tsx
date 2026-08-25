"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus, Wallet, TrendingDown, Banknote, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal, ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/modal";
import { MonthPicker } from "@/components/ui/date-picker";
import { cn, formatDate, getInitials } from "@/lib/utils";

const METHODS: Record<string, string> = { cash: "Naqd", card: "Karta", transfer: "O'tkazma" };

function ym(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }

const fieldCls =
  "w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition";
const labelCls = "block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1.5";

interface Payment { id: string; amount: string | number; method: string; forMonth: string | null; paidAt: string; lead: { id: string; fullName: string } | null; }
interface Expense { id: string; amount: string | number; category: string; note: string | null; spentAt: string; createdBy: { fullName: string } | null; }
interface SalaryRow { userId: string; name: string; role: string; salary: number; bonus: number; total: number; }
interface LeadOption { id: string; fullName: string; phone: string; }

type Tab = "payments" | "expenses" | "payroll" | "report";

export default function FinancePage() {
  const { data: session } = useSession();
  const isAdminRole = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";
  const canSeePayments = isAdminRole || !!session?.user?.canSeePayments;
  const canManagePayments = isAdminRole || !!session?.user?.canManagePayments;
  const canManageExpenses = isAdminRole || !!session?.user?.canManageExpenses;
  const canSeeReports = isAdminRole || !!session?.user?.canSeeReports;

  const availableTabs: { key: Tab; label: string; icon: typeof Wallet }[] = [
    ...(canSeePayments ? [{ key: "payments" as const, label: "To'lovlar", icon: Wallet }] : []),
    ...(canManageExpenses ? [{ key: "expenses" as const, label: "Xarajatlar", icon: TrendingDown }] : []),
    ...(canSeeReports ? [{ key: "payroll" as const, label: "Maoshlar", icon: Banknote }] : []),
    ...(canSeeReports ? [{ key: "report" as const, label: "Hisobot", icon: BarChart3 }] : []),
  ];

  const [tab, setTab] = useState<Tab | null>(null);
  useEffect(() => {
    if (!tab && availableTabs.length) setTab(availableTabs[0].key);
  }, [availableTabs, tab]);

  const [month, setMonth] = useState(ym(new Date()));

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Moliya</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Buxgalter paneli</p>
      </div>

      {availableTabs.length === 0 ? (
        <Card className="py-16 text-center text-[13px] text-gray-400">Sizga hech qanday moliyaviy ruxsat berilmagan.</Card>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1 overflow-x-auto">
              {availableTabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap",
                      tab === t.key ? "bg-white dark:bg-gray-800 text-[#5E2CA5] shadow-sm" : "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" /> {t.label}
                  </button>
                );
              })}
            </div>
            <MonthPicker value={month} onChange={(e) => setMonth(e.target.value)} className="bg-white dark:bg-gray-900" />
          </div>

          {tab === "payments" && <PaymentsTab month={month} canManage={canManagePayments} />}
          {tab === "expenses" && <ExpensesTab month={month} canManage={canManageExpenses} />}
          {tab === "payroll" && <PayrollTab month={month} />}
          {tab === "report" && <ReportTab month={month} />}
        </>
      )}
    </div>
  );
}

function PaymentsTab({ month, canManage }: { month: string; canManage: boolean }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [leadQuery, setLeadQuery] = useState("");
  const [leadOptions, setLeadOptions] = useState<LeadOption[]>([]);
  const [selectedLead, setSelectedLead] = useState<LeadOption | null>(null);
  const [form, setForm] = useState({ amount: "", method: "cash", note: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/payments?month=${month}&limit=100`);
      if (!res.ok) { setError(true); setLoading(false); return; }
      const data = await res.json();
      setPayments(Array.isArray(data?.payments) ? data.payments : []);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = leadQuery.trim();
    if (q.length < 2) { setLeadOptions([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/leads?search=${encodeURIComponent(q)}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        setLeadOptions(data.leads || []);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [leadQuery]);

  const createPayment = async () => {
    if (!selectedLead) { toast.error("O'quvchini tanlang"); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error("Summani kiriting"); return; }
    setCreating(true);
    const res = await fetch("/api/payments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: selectedLead.id, amount: Number(form.amount), method: form.method, forMonth: month, note: form.note || null }),
    });
    if (res.ok) {
      toast.success("To'lov qo'shildi");
      setShowAdd(false);
      setSelectedLead(null);
      setLeadQuery("");
      setForm({ amount: "", method: "cash", note: "" });
      load();
    } else toast.error("Qo'shilmadi");
    setCreating(false);
  };

  const total = payments.reduce((a, p) => a + Number(p.amount || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] text-gray-500 dark:text-gray-400">Jami: <strong className="text-gray-900 dark:text-white">{total.toLocaleString("ru-RU")} so&apos;m</strong></span>
        {canManage && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> To&apos;lov qo&apos;shish
          </button>
        )}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>
        ) : error ? (
          <div className="py-16 text-center text-[13px] text-red-500">Ma&apos;lumotni yuklab bo&apos;lmadi. Sahifani yangilab ko&apos;ring.</div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-gray-400">Bu oyda to&apos;lov yo&apos;q</div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ backgroundColor: "#5E2CA5" }}>
                  {getInitials(p.lead?.fullName || "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{p.lead?.fullName || "—"}</p>
                  <p className="text-[11px] text-gray-400">{formatDate(p.paidAt)} · {METHODS[p.method] || p.method}</p>
                </div>
                <span className="text-[13px] font-bold text-gray-900 dark:text-white flex-shrink-0">{Number(p.amount).toLocaleString("ru-RU")} so&apos;m</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showAdd && (
        <Modal
          title="To'lov qo'shish"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <ModalPrimaryButton onClick={createPayment} loading={creating}>Qo&apos;shish</ModalPrimaryButton>
              <ModalSecondaryButton onClick={() => setShowAdd(false)}>Bekor qilish</ModalSecondaryButton>
            </>
          }
        >
          <div>
            <label className={labelCls}>O&apos;quvchi *</label>
            {selectedLead ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-[#5E2CA5]/40 bg-[#5E2CA5]/5 text-[13px]">
                <span>{selectedLead.fullName}</span>
                <button type="button" onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-red-500">✕</button>
              </div>
            ) : (
              <div className="relative">
                <input
                  value={leadQuery}
                  onChange={(e) => setLeadQuery(e.target.value)}
                  placeholder="Ism yoki telefon..."
                  className={fieldCls}
                />
                {leadOptions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-white/10 z-10 max-h-48 overflow-y-auto">
                    {leadOptions.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => { setSelectedLead(l); setLeadOptions([]); }}
                        className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        {l.fullName} <span className="text-gray-400">· {l.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Summa *</label>
              <input type="number" min={1} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>To&apos;lov turi</label>
              <select value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))} className={fieldCls}>
                {Object.entries(METHODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Izoh</label>
            <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className={fieldCls} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function ExpensesTab({ month, canManage }: { month: string; canManage: boolean }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ amount: "", category: "", note: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/expenses?month=${month}`);
      if (!res.ok) { setError(true); setLoading(false); return; }
      const data = await res.json();
      setExpenses(Array.isArray(data?.expenses) ? data.expenses : []);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.amount || Number(form.amount) <= 0) { toast.error("Summani kiriting"); return; }
    if (!form.category.trim()) { toast.error("Kategoriyani kiriting"); return; }
    setCreating(true);
    const res = await fetch("/api/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(form.amount), category: form.category, note: form.note || null }),
    });
    if (res.ok) {
      toast.success("Xarajat qo'shildi");
      setShowAdd(false);
      setForm({ amount: "", category: "", note: "" });
      load();
    } else toast.error("Qo'shilmadi");
    setCreating(false);
  };

  const total = expenses.reduce((a, e) => a + Number(e.amount || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] text-gray-500 dark:text-gray-400">Jami: <strong className="text-gray-900 dark:text-white">{total.toLocaleString("ru-RU")} so&apos;m</strong></span>
        {canManage && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Xarajat qo&apos;shish
          </button>
        )}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>
        ) : error ? (
          <div className="py-16 text-center text-[13px] text-red-500">Ma&apos;lumotni yuklab bo&apos;lmadi. Sahifani yangilab ko&apos;ring.</div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-gray-400">Bu oyda xarajat yo&apos;q</div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white">{e.category}</p>
                  <p className="text-[11px] text-gray-400">{formatDate(e.spentAt)}{e.note ? ` · ${e.note}` : ""}</p>
                </div>
                <span className="text-[13px] font-bold text-red-600 dark:text-red-400">-{Number(e.amount).toLocaleString("ru-RU")} so&apos;m</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showAdd && (
        <Modal
          title="Xarajat qo'shish"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <ModalPrimaryButton onClick={create} loading={creating}>Qo&apos;shish</ModalPrimaryButton>
              <ModalSecondaryButton onClick={() => setShowAdd(false)}>Bekor qilish</ModalSecondaryButton>
            </>
          }
        >
          <div>
            <label className={labelCls}>Summa *</label>
            <input type="number" min={1} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Kategoriya *</label>
            <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Masalan: Ijara" className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Izoh</label>
            <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className={fieldCls} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function PayrollTab({ month }: { month: string }) {
  const [byUser, setByUser] = useState<SalaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/payroll?month=${month}`);
      if (!res.ok) { setError(true); setLoading(false); return; }
      const data = await res.json();
      setByUser(Array.isArray(data?.byUser) ? data.byUser : []);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const total = byUser.reduce((a, u) => a + u.total, 0);

  return (
    <div className="space-y-3">
      <span className="text-[13px] text-gray-500 dark:text-gray-400">Jami: <strong className="text-gray-900 dark:text-white">{total.toLocaleString("ru-RU")} so&apos;m</strong></span>
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</div>
        ) : error ? (
          <div className="py-16 text-center text-[13px] text-red-500">Ma&apos;lumotni yuklab bo&apos;lmadi. Sahifani yangilab ko&apos;ring.</div>
        ) : byUser.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-gray-400">Bu oyda maosh yozuvi yo&apos;q</div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {byUser.map((u) => (
              <div key={u.userId} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ backgroundColor: "#5E2CA5" }}>
                  {getInitials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{u.name}</p>
                  <p className="text-[11px] text-gray-400">Oylik: {u.salary.toLocaleString("ru-RU")} · Bonus: {u.bonus.toLocaleString("ru-RU")}</p>
                </div>
                <span className="text-[13px] font-bold text-gray-900 dark:text-white flex-shrink-0">{u.total.toLocaleString("ru-RU")} so&apos;m</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ReportTab({ month }: { month: string }) {
  const [report, setReport] = useState<{ totals: { totalRevenue: number; totalExpense: number; totalPayroll: number; netProfit: number; totalDebt: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/reports/financial?month=${month}`)
      .then(async (res) => {
        if (!res.ok) { setError(true); return; }
        setReport(await res.json());
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [month]);

  if (loading) return <Card className="py-16 text-center text-[13px] text-gray-400 animate-pulse">Yuklanmoqda...</Card>;
  if (error || !report) return <Card className="py-16 text-center text-[13px] text-red-500">Ma&apos;lumotni yuklab bo&apos;lmadi. Sahifani yangilab ko&apos;ring.</Card>;

  const rows = [
    { label: "Jami tushum", value: report.totals.totalRevenue, cls: "text-emerald-600 dark:text-emerald-400" },
    { label: "Xarajat", value: report.totals.totalExpense, cls: "text-red-600 dark:text-red-400" },
    { label: "Ish haqi", value: report.totals.totalPayroll, cls: "text-amber-600 dark:text-amber-400" },
    { label: "Sof foyda", value: report.totals.netProfit, cls: "text-[#5E2CA5]" },
    { label: "Qarzdorlik", value: report.totals.totalDebt, cls: "text-gray-600 dark:text-gray-300" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rows.map((r) => (
        <Card key={r.label} className="p-5">
          <p className="text-[12px] text-gray-400 mb-1">{r.label}</p>
          <p className={cn("text-lg font-bold", r.cls)}>{r.value.toLocaleString("ru-RU")} so&apos;m</p>
        </Card>
      ))}
    </div>
  );
}
