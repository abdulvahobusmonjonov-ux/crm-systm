"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus, Save, Users2, Wallet, Star, Phone, BookOpen, GraduationCap, Gift,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Modal, ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/modal";
import { cn, formatPhone, getInitials } from "@/lib/utils";

interface Teacher {
  id: string; fullName: string; username: string; role: string;
  subject: string; salary: number; phone?: string; rating: number;
  groupsCount: number; studentsCount: number; groups: string[];
}

function ym(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
// A simple, transparent scale: 100,000 so'm per star — admin sees and can edit the amount before saving.
const BONUS_PER_STAR = 100000;

const BRAND = "#5E2CA5";

function money(v: number | string) { return Number(v || 0).toLocaleString("ru-RU"); }

const AVATAR_COLORS = [BRAND, "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316", "#ef4444"];
const SUBJECT_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#06b6d4", "#f97316"];

function nameColor(name: string, palette: string[]): string {
  return palette[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % palette.length];
}

const fieldCls =
  "w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition";
const labelCls = "block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1.5";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, { salary: string; subject: string }>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({ fullName: "", username: "", password: "" });
  const [bonusFor, setBonusFor] = useState<Teacher | null>(null);
  const [bonusAmount, setBonusAmount] = useState("");
  const [bonusNote, setBonusNote] = useState("");
  const [savingBonus, setSavingBonus] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/teachers");
    const data = await res.json();
    setTeachers(Array.isArray(data) ? data : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setEdit = (id: string, field: "salary" | "subject", value: string, t: Teacher) => {
    setEdits((e) => ({ ...e, [id]: { salary: e[id]?.salary ?? String(t.salary || ""), subject: e[id]?.subject ?? t.subject, [field]: value } }));
  };

  const save = async (t: Teacher) => {
    const e = edits[t.id];
    const res = await fetch(`/api/teachers/${t.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salary: Number(e?.salary ?? t.salary) || 0, subject: e?.subject ?? t.subject }),
    });
    if (res.ok) { toast.success("Saqlandi"); load(); }
    else toast.error("Saqlab bo'lmadi (faqat admin)");
  };

  const rate = async (t: Teacher, stars: number) => {
    const res = await fetch(`/api/teachers/${t.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: stars }),
    });
    if (res.ok) {
      setTeachers((prev) => prev.map((x) => (x.id === t.id ? { ...x, rating: stars } : x)));
      toast.success(`${t.fullName}: ${stars} yulduz`);
    } else toast.error("Saqlab bo'lmadi (faqat admin)");
  };

  const openBonus = (t: Teacher) => {
    setBonusFor(t);
    setBonusAmount(String(t.rating * BONUS_PER_STAR || ""));
    setBonusNote(t.rating ? `Reyting bo'yicha bonus (${t.rating}⭐)` : "");
  };

  const saveBonus = async () => {
    if (!bonusFor) return;
    if (!bonusAmount || Number(bonusAmount) <= 0) { toast.error("Summani kiriting"); return; }
    setSavingBonus(true);
    const res = await fetch("/api/payroll", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: bonusFor.id, amount: bonusAmount, note: bonusNote, month: ym(new Date()), type: "bonus" }),
    });
    setSavingBonus(false);
    if (res.ok) { toast.success("Bonus berildi"); setBonusFor(null); }
    else toast.error("Saqlab bo'lmadi");
  };

  const createTeacher = async () => {
    if (!newForm.fullName.trim()) { toast.error("Ism kiriting"); return; }
    if (!newForm.username.trim()) { toast.error("Username kiriting"); return; }
    if (!newForm.password.trim()) { toast.error("Parol kiriting"); return; }
    setCreating(true);
    const res = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newForm, role: "MENTOR" }),
    });
    if (res.ok) {
      toast.success("O'qituvchi qo'shildi");
      setShowCreate(false);
      setNewForm({ fullName: "", username: "", password: "" });
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      let msg = "Qo'shib bo'lmadi";
      if (typeof err.error === "string") {
        msg = err.error;
      } else if (err.error?.fieldErrors) {
        const firstField = Object.values(err.error.fieldErrors).find((v) => Array.isArray(v) && v.length) as string[] | undefined;
        if (firstField?.[0]) msg = firstField[0];
      }
      toast.error(msg);
    }
    setCreating(false);
  };

  const totalSalary = teachers.reduce((a, t) => a + (Number(edits[t.id]?.salary ?? t.salary) || 0), 0);
  const teaching = teachers.filter((t) => t.groupsCount > 0).length;

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">O&apos;qituvchilar</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {loading ? "Yuklanmoqda..." : `${teachers.length} ta o'qituvchi`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Yangi o&apos;qituvchi
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#5E2CA5]/10 flex items-center justify-center flex-shrink-0">
            <Users2 className="w-5 h-5 text-[#5E2CA5]" />
          </div>
          <div>
            <p className="text-[12px] text-gray-400 mb-0.5">Dars beruvchilar</p>
            <p className="text-[22px] font-bold text-gray-900 dark:text-white leading-tight">{teaching}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[12px] text-gray-400 mb-0.5">Jami maosh</p>
            <p className="text-[20px] font-bold text-gray-900 dark:text-white leading-tight">{money(totalSalary)}</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : teachers.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm py-20 text-center">
          <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Hodim yo&apos;q</p>
          <p className="text-[13px] text-gray-400 mt-1">Sozlamalar → Hodimlar bo&apos;limida qo&apos;shing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((t) => {
            const avatarColor = nameColor(t.fullName, AVATAR_COLORS);
            const subColor = t.subject ? nameColor(t.subject, SUBJECT_COLORS) : "#94a3b8";
            const stars = t.rating;
            const currentSubject = edits[t.id]?.subject ?? t.subject;
            const currentSalary = edits[t.id]?.salary ?? String(t.salary || "");
            const isDirty = edits[t.id] !== undefined;

            return (
              <div
                key={t.id}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden"
              >
                {/* Top section */}
                <div className="p-5 pb-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {getInitials(t.fullName)}
                    </div>

                    {/* Name + subject */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-bold text-gray-900 dark:text-white leading-snug truncate">
                        {t.fullName}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: subColor }}
                        />
                        <span className="text-[12px] text-gray-500 dark:text-gray-400 truncate">
                          {currentSubject || "Fan belgilanmagan"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 font-mono">@{t.username}</p>
                    </div>

                    {/* Star rating — click a star to set this teacher's rating */}
                    <div className="flex items-center gap-0.5 flex-shrink-0 pt-0.5" title="Reytingni belgilash">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => rate(t, s === stars ? 0 : s)}
                          className="p-0.5 -m-0.5 hover:scale-110 transition-transform"
                        >
                          <Star
                            className="w-3.5 h-3.5"
                            fill={s <= stars ? "#f59e0b" : "none"}
                            stroke={s <= stars ? "#f59e0b" : "#d1d5db"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-5 border-t border-gray-100 dark:border-white/5" />

                {/* Stats */}
                <div className="px-5 py-3.5 grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-[20px] font-bold text-gray-900 dark:text-white">{t.groupsCount}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 flex items-center justify-center gap-1">
                      <BookOpen className="w-3 h-3" /> Guruhlar
                    </p>
                  </div>
                  <div className="text-center border-l border-gray-100 dark:border-white/5">
                    <p className="text-[20px] font-bold text-gray-900 dark:text-white">{t.studentsCount}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 flex items-center justify-center gap-1">
                      <Users2 className="w-3 h-3" /> O&apos;quvchilar
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-5 border-t border-gray-100 dark:border-white/5" />

                {/* Edit fields */}
                <div className="px-5 py-3.5 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Fan</label>
                      <input
                        value={currentSubject}
                        onChange={e => setEdit(t.id, "subject", e.target.value, t)}
                        placeholder="—"
                        className="w-full px-2.5 py-1.5 text-[12px] border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 transition"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Maosh (so&apos;m)</label>
                      <input
                        type="number"
                        value={currentSalary}
                        onChange={e => setEdit(t.id, "salary", e.target.value, t)}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 text-[12px] border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 transition"
                      />
                    </div>
                  </div>

                  {/* Phone row + Save button */}
                  <div className="flex items-center justify-between gap-2">
                    {t.phone ? (
                      <a
                        href={`tel:${t.phone}`}
                        className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400 hover:text-[#5E2CA5] transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {formatPhone(t.phone)}
                      </a>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[12px] text-gray-300 dark:text-gray-600">
                        <Phone className="w-3.5 h-3.5" />
                        Telefon yo&apos;q
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openBonus(t)}
                        title="Reytingga yarasha bonus berish"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                      >
                        <Gift className="w-3.5 h-3.5" /> Bonus
                      </button>
                      <button
                        onClick={() => save(t)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors",
                          isDirty
                            ? "bg-[#5E2CA5] text-white hover:bg-[#4a2280]"
                            : "bg-gray-100 dark:bg-white/8 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15"
                        )}
                      >
                        <Save className="w-3.5 h-3.5" /> Saqlash
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create teacher modal */}
      {showCreate && (
        <Modal
          title="Yangi o'qituvchi"
          maxWidth="max-w-sm"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <ModalPrimaryButton onClick={createTeacher} loading={creating}>Qo&apos;shish</ModalPrimaryButton>
              <ModalSecondaryButton onClick={() => setShowCreate(false)}>Bekor qilish</ModalSecondaryButton>
            </>
          }
        >
            <div>
              <label className={labelCls}>To&apos;liq ism *</label>
              <input
                value={newForm.fullName}
                onChange={e => setNewForm(f => ({ ...f, fullName: e.target.value }))}
                placeholder="Ism Familiya"
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Username *</label>
              <input
                value={newForm.username}
                onChange={e => setNewForm(f => ({ ...f, username: e.target.value }))}
                placeholder="teacher1"
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Parol *</label>
              <input
                type="password"
                value={newForm.password}
                onChange={e => setNewForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className={fieldCls}
              />
            </div>

        </Modal>
      )}

      {/* Bonus modal */}
      {bonusFor && (
        <Modal
          title={`Bonus berish — ${bonusFor.fullName}`}
          maxWidth="max-w-sm"
          onClose={() => setBonusFor(null)}
          footer={
            <>
              <ModalPrimaryButton onClick={saveBonus} loading={savingBonus}>Berish</ModalPrimaryButton>
              <ModalSecondaryButton onClick={() => setBonusFor(null)}>Bekor qilish</ModalSecondaryButton>
            </>
          }
        >
          <p className="text-[12px] text-gray-400">
            Joriy reyting: {"⭐".repeat(bonusFor.rating) || "belgilanmagan"} — taklif etilgan summa reytingga
            ({BONUS_PER_STAR.toLocaleString("ru-RU")} so&apos;m / yulduz) qarab hisoblandi, xohlasangiz o&apos;zgartiring.
          </p>
          <Input label="Summa (so'm)" type="number" value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} placeholder="500000" />
          <div>
            <label className={labelCls}>Sabab / izoh</label>
            <input
              value={bonusNote}
              onChange={e => setBonusNote(e.target.value)}
              placeholder="Masalan: Reyting bo'yicha bonus"
              className={fieldCls}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
