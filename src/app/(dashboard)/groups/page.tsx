"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus, Trash2, Users, Clock, Calendar, GraduationCap,
  ChevronDown, MapPin,
} from "lucide-react";
import { useConfirm } from "@/components/ui/confirm";
import { Modal, ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { DatePicker } from "@/components/ui/date-picker";
import { WEEKDAYS } from "@/lib/constants";
import { cn, formatPhone, getInitials } from "@/lib/utils";

const BRAND = "#5E2CA5";
const dayLabel = (v: string) => WEEKDAYS.find(d => d.value === v)?.label || v;

const fieldCls =
  "w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition";
const labelCls = "block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1.5";

interface Group {
  id: string;
  name: string;
  room: string | null;
  days: string | null;
  timeFrom: string | null;
  timeTo: string | null;
  course: { name: string; color: string } | null;
  teacher: { fullName: string } | null;
  _count?: { leads: number };
}

interface Member {
  id: string;
  fullName: string;
  phone: string;
  stage: { name: string; color: string } | null;
}

interface CourseOption { id: string; name: string; }
interface UserOption { id: string; fullName: string; }

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [days, setDays] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", courseId: "", teacherId: "", timeFrom: "", timeTo: "", room: "", startDate: "" });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, Member[]>>({});

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "50" });
    const data = await fetch(`/api/groups?${params}`).then(r => r.json());
    setGroups(Array.isArray(data?.groups) ? data.groups : []);
    setTotal(data?.total || 0);
    setPages(data?.pages || 1);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(page);
  }, [load, page]);

  useEffect(() => {
    fetch("/api/courses").then(r => r.json()).then(setCourses);
    fetch("/api/users").then(r => r.json()).then(setUsers);
  }, []);

  const create = async () => {
    if (form.name.trim().length < 1) { toast.error("Guruh nomini kiriting"); return; }
    setCreating(true);
    const res = await fetch("/api/groups", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, days: days.join(","), courseId: form.courseId || null, teacherId: form.teacherId || null, startDate: form.startDate || null }),
    });
    if (res.ok) {
      toast.success("Guruh yaratildi");
      setShowCreate(false);
      setForm({ name: "", courseId: "", teacherId: "", timeFrom: "", timeTo: "", room: "", startDate: "" });
      setDays([]);
      page === 1 ? load(1) : setPage(1);
    } else toast.error("Yaratilmadi");
    setCreating(false);
  };

  const { confirm, dialog } = useConfirm();

  const remove = async (id: string) => {
    if (!(await confirm({ title: "Guruhni o'chirish", message: "Bu guruhni o'chirasizmi? A'zolar guruhdan chiqariladi (lidlar o'chmaydi)." }))) return;
    const res = await fetch("/api/groups/" + id, { method: "DELETE" });
    if (res.ok) { toast.success("Guruh o'chirildi"); load(page); }
    else toast.error("O'chirib bo'lmadi");
  };

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!members[id]) {
      const det = await fetch("/api/groups/" + id).then(r => r.json());
      setMembers(m => ({ ...m, [id]: det.leads || [] }));
    }
  };

  const toggleDay = (v: string) => setDays(arr => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {dialog}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Guruhlar</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {loading ? "Yuklanmoqda..." : `${total} ta guruh`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Yangi guruh
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl h-52 animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Hali guruh yo'q"
          description={`Lidlar ro'yxatida bir nechta lidni belgilab "Guruhga qo'shish" orqali guruh ochishingiz mumkin.`}
          action={
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] text-white mx-auto hover:bg-[#4a2280] transition-colors">
              <Plus className="w-4 h-4" /> Guruh yaratish
            </button>
          }
        />
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => {
            const accent = g.course?.color || BRAND;
            const daysList: string[] = g.days ? g.days.split(",").filter(Boolean) : [];
            const isOpen = expanded === g.id;

            return (
              <div
                key={g.id}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden"
              >
                {/* Card body */}
                <div className="p-5 flex-1 space-y-4">

                  {/* Top row: icon + name + status + delete */}
                  <div className="flex items-start gap-3">
                    {/* Colored icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: accent + "18" }}
                    >
                      <GraduationCap className="w-5 h-5" style={{ color: accent }} />
                    </div>

                    {/* Name + course */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-bold text-gray-900 dark:text-white leading-snug truncate">
                        {g.name}
                      </h3>
                      <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                        {g.course?.name || "Kurs belgilanmagan"}
                      </p>
                    </div>

                    {/* Status badge + delete */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        Faol
                      </span>
                      <button
                        onClick={() => remove(g.id)}
                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Teacher row */}
                  {g.teacher ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: BRAND }}
                      >
                        {getInitials(g.teacher.fullName)}
                      </div>
                      <span className="text-[12px] text-gray-600 dark:text-gray-300 truncate">{g.teacher.fullName}</span>
                    </div>
                  ) : (
                    <p className="text-[12px] text-gray-300 dark:text-gray-600 italic">O&apos;qituvchi belgilanmagan</p>
                  )}

                  {/* Schedule */}
                  {(daysList.length > 0 || g.timeFrom) && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-500 dark:text-gray-400">
                      {daysList.length > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {daysList.map(dayLabel).join(", ")}
                        </span>
                      )}
                      {(g.timeFrom || g.timeTo) && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {g.timeFrom || "?"}–{g.timeTo || "?"}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom chips + expand button */}
                <div className="px-5 py-3 border-t border-gray-50 dark:border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Student count chip */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#5E2CA5]/8 text-[#5E2CA5]"
                      style={{ backgroundColor: "#5E2CA512" }}>
                      <Users className="w-3 h-3" />
                      {g._count?.leads ?? 0} a&apos;zo
                    </span>
                    {/* Room chip */}
                    {g.room && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400"
                        style={{ backgroundColor: undefined }}>
                        <MapPin className="w-3 h-3" />
                        {g.room}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleExpand(g.id)}
                    className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-[#5E2CA5] transition-colors"
                  >
                    A&apos;zolar
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
                  </button>
                </div>

                {/* Expanded members list */}
                {isOpen && (
                  <div className="border-t border-gray-50 dark:border-white/5 px-5 py-3 space-y-1.5 bg-gray-50/50 dark:bg-white/5">
                    {(members[g.id] || []).length === 0 ? (
                      <p className="text-[12px] text-gray-400 py-2">A&apos;zolar yo&apos;q</p>
                    ) : (members[g.id] || []).map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-2 py-0.5">
                        <Link
                          href={`/leads/${m.id}`}
                          className="text-[13px] font-medium text-gray-800 dark:text-gray-200 hover:text-[#5E2CA5] transition-colors truncate"
                        >
                          {m.fullName}
                        </Link>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {m.stage && (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: m.stage.color }}
                            >
                              {m.stage.name}
                            </span>
                          )}
                          <span className="text-[11px] text-gray-400 font-mono">{formatPhone(m.phone)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && pages > 1 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm px-5 py-3 flex items-center justify-between">
          <span className="text-[13px] text-gray-400">
            {total} ta natijadan {((page - 1) * 50) + 1}–{Math.min(page * 50, total)} ko&apos;rsatilmoqda
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 disabled:opacity-30 text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Oldingi
            </button>
            <span className="text-[13px] text-gray-500 px-1">{page} / {pages}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= pages}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 disabled:opacity-30 text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Keyingi
            </button>
          </div>
        </div>
      )}

      {/* Create group modal */}
      {showCreate && (
        <Modal
          title="Yangi guruh"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <ModalPrimaryButton onClick={create} loading={creating}>Yaratish</ModalPrimaryButton>
              <ModalSecondaryButton onClick={() => setShowCreate(false)}>Bekor qilish</ModalSecondaryButton>
            </>
          }
        >
            {/* Guruh nomi */}
            <div>
              <label className={labelCls}>Guruh nomi *</label>
              <input
                placeholder="Masalan: Beginners-1"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={fieldCls}
              />
            </div>

            {/* Kurs + O'qituvchi */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Kurs</label>
                <select value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))} className={fieldCls}>
                  <option value="">Ixtiyoriy</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>O&apos;qituvchi</label>
                <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))} className={fieldCls}>
                  <option value="">Ixtiyoriy</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </div>
            </div>

            {/* Kunlar */}
            <div>
              <label className={labelCls}>Dars kunlari</label>
              <div className="flex gap-2 flex-wrap">
                {WEEKDAYS.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={cn(
                      "px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors",
                      days.includes(d.value)
                        ? "bg-[#5E2CA5] text-white"
                        : "border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vaqt + Boshlanish + Xona */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Soat (dan)</label>
                <input type="time" value={form.timeFrom} onChange={e => setForm(f => ({ ...f, timeFrom: e.target.value }))} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Soat (gacha)</label>
                <input type="time" value={form.timeTo} onChange={e => setForm(f => ({ ...f, timeTo: e.target.value }))} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Boshlanish sanasi</label>
                <DatePicker value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Xona</label>
                <input value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} placeholder="1-xona" className={fieldCls} />
              </div>
            </div>

        </Modal>
      )}
    </div>
  );
}
