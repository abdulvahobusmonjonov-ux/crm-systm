"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bell, Check, Clock, X, Phone, Plus } from "lucide-react";
import { formatDateTime, phoneToTel } from "@/lib/utils";
import { addMinutes, addDays, isSameDay, format } from "date-fns";
import { cn } from "@/lib/utils";
import { Modal, ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/modal";

interface LeadOpt { id: string; fullName: string; phone: string; }

interface Reminder {
  id: string; title: string; description: string | null;
  remindAt: string; status: string; completedAt: string | null;
  lead: { id: string; fullName: string; phone: string };
  user: { fullName: string };
}

interface ReminderData {
  reminders: Reminder[];
  overdue: Reminder[]; today: Reminder[]; upcoming: Reminder[]; done: Reminder[];
  totalToday: number;
}

const FILTERS = [
  { key: "today", label: "Bugun" },
  { key: "tomorrow", label: "Ertaga" },
  { key: "week", label: "Bu hafta" },
  { key: "done", label: "Bajarilgan" },
] as const;

type FilterKey = typeof FILTERS[number]["key"];

function reminderType(title: string): { label: string; classes: string } {
  const t = (title || "").toLowerCase();
  if (/qo'ng'iroq|qongiroq|call|tel\b/.test(t)) return { label: "Qo'ng'iroq", classes: "bg-blue-500/10 text-blue-600" };
  if (/to'lov|tolov|pay/.test(t)) return { label: "To'lov", classes: "bg-amber-500/10 text-amber-600" };
  return { label: "Vazifa", classes: "bg-[#5E2CA5]/10 text-[#5E2CA5]" };
}

export default function RemindersPage() {
  const [data, setData] = useState<ReminderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("today");
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/reminders");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string, snoozeMin?: number) => {
    const body: { status: string; remindAt?: string } = { status };
    if (status === "PENDING" && snoozeMin) {
      body.remindAt = format(addMinutes(new Date(), snoozeMin), "yyyy-MM-dd'T'HH:mm");
      body.status = "PENDING";
    }
    const res = await fetch(`/api/reminders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (res.ok) {
      toast.success(status === "DONE" ? "Bajarildi ✓" : status === "CANCELLED" ? "Bekor qilindi" : "Kechiktirildi");
      load();
    }
  };

  const tomorrowItems = useMemo(() => {
    if (!data) return [];
    const tmrw = addDays(new Date(), 1);
    return data.upcoming.filter(r => isSameDay(new Date(r.remindAt), tmrw));
  }, [data]);

  const counts = useMemo(() => ({
    today: (data?.overdue.length || 0) + (data?.today.length || 0),
    tomorrow: tomorrowItems.length,
    week: data?.upcoming.length || 0,
    done: data?.done.length || 0,
  }), [data, tomorrowItems]);

  const list: Reminder[] = useMemo(() => {
    if (!data) return [];
    switch (filter) {
      case "today": return [...data.overdue, ...data.today];
      case "tomorrow": return tomorrowItems;
      case "week": return data.upcoming;
      case "done": return data.done;
    }
  }, [data, filter, tomorrowItems]);

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Eslatmalar</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{data?.totalToday || 0} ta bugungi eslatma</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Yangi eslatma
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors",
              filter === f.key
                ? "bg-[#5E2CA5] text-white shadow-sm"
                : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-gray-700 shadow-sm"
            )}
          >
            {f.label}
            <span className={cn(
              "text-[11px] px-1.5 py-0.5 rounded-full",
              filter === f.key ? "bg-white/20" : "bg-gray-100 dark:bg-white/10"
            )}>
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* List card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse bg-gray-50/60 dark:bg-white/5" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-[13px] text-gray-400">Eslatmalar yo&apos;q</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {list.map(r => {
              const done = r.status === "DONE";
              const cancelled = r.status === "CANCELLED" || r.status === "MISSED";
              const type = reminderType(r.title);
              return (
                <div
                  key={r.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3.5 transition-colors duration-100",
                    done ? "bg-green-50/40 dark:bg-green-500/5" : "hover:bg-gray-50/60 dark:hover:bg-white/5"
                  )}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => !done && !cancelled && setStatus(r.id, "DONE")}
                    disabled={done || cancelled}
                    className={cn(
                      "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors",
                      done ? "bg-green-500 border-green-500" :
                      cancelled ? "bg-gray-200 border-gray-200 dark:bg-white/10 dark:border-white/10" :
                      "border-gray-300 dark:border-white/20 hover:border-[#5E2CA5]"
                    )}
                  >
                    {done && <Check className="w-3 h-3 text-white" />}
                    {cancelled && <X className="w-3 h-3 text-gray-400" />}
                  </button>

                  {/* Time */}
                  <div className="w-14 flex-shrink-0 pt-0.5">
                    <p className="text-[13px] font-bold text-[#5E2CA5] whitespace-nowrap">
                      {format(new Date(r.remindAt), "HH:mm")}
                    </p>
                  </div>

                  {/* Title + description */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-[13px] font-medium",
                      done ? "text-gray-400 line-through" : "text-gray-900 dark:text-white"
                    )}>
                      {r.title}
                    </p>
                    {r.description && (
                      <p className={cn("text-[12px] mt-0.5", done ? "text-gray-300 line-through" : "text-gray-400")}>
                        {r.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <Link href={`/leads/${r.lead.id}`} className="text-[11px] text-[#5E2CA5] hover:underline font-medium">
                        {r.lead.fullName}
                      </Link>
                      <a href={phoneToTel(r.lead.phone)} className="text-[11px] text-gray-400 hover:text-green-600 flex items-center gap-1">
                        <Phone className="w-3 h-3" />{r.lead.phone}
                      </a>
                      <span className="text-[11px] text-gray-300">{formatDateTime(r.remindAt)}</span>
                    </div>
                  </div>

                  {/* Type badge */}
                  <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap", type.classes)}>
                    {type.label}
                  </span>

                  {/* Actions */}
                  {r.status === "PENDING" && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setStatus(r.id, "PENDING", 15)} className="p-1.5 text-gray-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors" title="15 daqiqa kechiktirish">
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setStatus(r.id, "CANCELLED")} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Bekor qilish">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <AddReminderModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load(); }}
        />
      )}
    </div>
  );
}

function AddReminderModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [leadQ, setLeadQ] = useState("");
  const [leadResults, setLeadResults] = useState<LeadOpt[]>([]);
  const [lead, setLead] = useState<LeadOpt | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [remindAt, setRemindAt] = useState(format(addMinutes(new Date(), 30), "yyyy-MM-dd'T'HH:mm"));
  const [notifyTelegram, setNotifyTelegram] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lead || leadQ.length < 1) { setLeadResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/leads?search=${encodeURIComponent(leadQ)}&limit=8`);
      setLeadResults((await res.json()).leads || []);
    }, 250);
    return () => clearTimeout(t);
  }, [leadQ, lead]);

  const save = async () => {
    if (!lead) { toast.error("O'quvchi/lidni tanlang"); return; }
    if (!title.trim()) { toast.error("Sarlavhani kiriting"); return; }
    if (!remindAt) { toast.error("Vaqtni tanlang"); return; }
    setSaving(true);
    const res = await fetch("/api/reminders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: lead.id, title: title.trim(), description: description.trim() || undefined,
        remindAt, notifyBrowser: true, notifyTelegram,
      }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Eslatma qo'shildi"); onSaved(); }
    else toast.error("Saqlab bo'lmadi");
  };

  const fieldCls = "w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition";
  const labelCls = "block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1.5";

  return (
    <Modal
      title="Yangi eslatma"
      onClose={onClose}
      footer={
        <>
          <ModalPrimaryButton onClick={save} loading={saving}>Saqlash</ModalPrimaryButton>
          <ModalSecondaryButton onClick={onClose}>Bekor qilish</ModalSecondaryButton>
        </>
      }
    >
      {/* Lead picker */}
      <div className="relative">
        <label className={labelCls}>Kimga (lid / o&apos;quvchi)</label>
        {lead ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-[#5E2CA5]/30 bg-[#5E2CA5]/5 dark:bg-[#5E2CA5]/10">
            <div>
              <p className="text-[13px] font-medium text-gray-900 dark:text-white">{lead.fullName}</p>
              <p className="text-[11px] text-gray-400 font-mono">{lead.phone}</p>
            </div>
            <button onClick={() => { setLead(null); setLeadQ(""); }} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <input
              value={leadQ} onChange={e => setLeadQ(e.target.value)}
              placeholder="Ism yoki telefon bo'yicha qidiring..."
              className={fieldCls}
            />
            {leadResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                {leadResults.map(l => (
                  <button key={l.id} onClick={() => { setLead(l); setLeadResults([]); }}
                    className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-50 dark:border-white/5 last:border-0">
                    <span className="font-medium text-gray-900 dark:text-white">{l.fullName}</span>{" "}
                    <span className="text-gray-400 font-mono">{l.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <label className={labelCls}>Sarlavha</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Qo'ng'iroq qilish" className={fieldCls} />
      </div>

      <div>
        <label className={labelCls}>Izoh (ixtiyoriy)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={fieldCls} />
      </div>

      <div>
        <label className={labelCls}>Qachon</label>
        <input type="datetime-local" value={remindAt} onChange={e => setRemindAt(e.target.value)} className={fieldCls} />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={notifyTelegram} onChange={e => setNotifyTelegram(e.target.checked)} className="w-4 h-4 accent-[#5E2CA5]" />
        <span className="text-[13px] text-gray-600 dark:text-gray-300">Telegram orqali ham xabar berilsin</span>
      </label>
    </Modal>
  );
}
