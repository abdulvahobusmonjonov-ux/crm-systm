"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus, Filter, Download, Upload, Phone, MessageCircle, Edit, Trash2,
  LayoutGrid, ChevronLeft, ChevronRight, ChevronDown, Search, X, Users,
} from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm";
import { Modal, ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { DatePicker } from "@/components/ui/date-picker";
import { LEAD_SOURCE_LABELS, WEEKDAYS } from "@/lib/constants";
import { cn, formatDate, formatPhone, phoneToTel, phoneToTelegram } from "@/lib/utils";

interface ImportResult {
  total: number;
  created: number;
  failed: number;
  errors: { row: number; reason: string }[];
}

interface Lead {
  id: string; fullName: string; phone: string; email: string | null;
  status: string; source: string; createdAt: string; lastContactedAt: string | null;
  stage: { id: string; name: string; color: string } | null;
  course: { id: string; name: string; color: string | null } | null;
  timeSlot: { label: string } | null;
  assignedTo: { id: string; fullName: string } | null;
}

interface Course { id: string; name: string; }
interface User { id: string; fullName: string; }
interface Stage { id: string; name: string; color: string; }
interface Group { id: string; name: string; _count?: { leads: number }; }

const BRAND = "#5E2CA5";

const inputCls =
  "w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition";

export default function LeadsPage() {
  const searchParams = useSearchParams();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupMode, setGroupMode] = useState<"new" | "existing">("new");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupDays, setGroupDays] = useState<string[]>([]);
  const [newGroup, setNewGroup] = useState({ name: "", courseId: "", teacherId: "", timeFrom: "", timeTo: "", startDate: "" });
  const [assigning, setAssigning] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSource, setImportSource] = useState("OTHER");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "", stageId: "", courseId: "", source: "", assignedToId: "",
    dateFrom: searchParams.get("dateFrom") || "", dateTo: searchParams.get("dateTo") || "",
    timePreference: "", archived: "", frozen: searchParams.get("frozen") || "", page: 1,
  });
  const [inputSearch, setInputSearch] = useState(searchParams.get("search") || "");

  // Debounce search input → avoid fetching on every keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => {
        if (f.search === inputSearch) return f;
        return { ...f, search: inputSearch, page: 1 };
      });
    }, 300);
    return () => clearTimeout(t);
  }, [inputSearch]);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
    const res = await fetch(`/api/leads?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLeads(data.leads); setTotal(data.total); setPages(data.pages);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => { loadLeads(); }, [loadLeads]);
  useEffect(() => {
    fetch("/api/courses").then(r => r.json()).then(setCourses);
    fetch("/api/users").then(r => r.json()).then(setUsers);
    fetch("/api/stages").then(r => r.json()).then(setStages);
    fetch("/api/groups?limit=500").then(r => r.json()).then(d => setGroups(Array.isArray(d?.groups) ? d.groups : []));
  }, []);

  const assignToGroup = async () => {
    setAssigning(true);
    let groupId = selectedGroupId;
    if (groupMode === "new") {
      if (newGroup.name.trim().length < 1) { toast.error("Guruh nomini kiriting"); setAssigning(false); return; }
      const res = await fetch("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newGroup, days: groupDays.join(","), courseId: newGroup.courseId || null, teacherId: newGroup.teacherId || null, startDate: newGroup.startDate || null }) });
      if (!res.ok) { toast.error("Guruh yaratilmadi"); setAssigning(false); return; }
      groupId = (await res.json()).id;
    }
    if (!groupId) { toast.error("Guruh tanlang"); setAssigning(false); return; }
    await Promise.all([...selected].map(id =>
      fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupId }) })
    ));
    toast.success(`${selected.size} ta lid guruhga qo'shildi`);
    setShowGroupModal(false); setSelected(new Set());
    setNewGroup({ name: "", courseId: "", teacherId: "", timeFrom: "", timeTo: "", startDate: "" });
    setGroupDays([]); setSelectedGroupId("");
    fetch("/api/groups?limit=500").then(r => r.json()).then(d => setGroups(Array.isArray(d?.groups) ? d.groups : []));
    loadLeads(); setAssigning(false);
  };

  const toggleGroupDay = (d: string) =>
    setGroupDays(arr => arr.includes(d) ? arr.filter(x => x !== d) : [...arr, d]);

  const setFilter = (key: string, value: string) =>
    setFilters(f => ({ ...f, [key]: value, page: 1 }));

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () =>
    setSelected(selected.size === leads.length ? new Set() : new Set(leads.map(l => l.id)));

  const { confirm, dialog } = useConfirm();

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Lidni o'chirish", message: "Bu lidni o'chirishni tasdiqlaysizmi?" }))) return;
    const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Lid o'chirildi"); loadLeads(); }
    else toast.error("O'chirib bo'lmadi");
  };

  const handleBulkStageChange = async (stageId: string) => {
    if (!selected.size) return;
    await Promise.all([...selected].map(id =>
      fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stageId }) })
    ));
    toast.success(`${selected.size} ta lid bosqichi o'zgartirildi`);
    setSelected(new Set()); loadLeads();
  };

  const exportExcel = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
    const res = await fetch(`/api/leads/export?${params}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `lidlar_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click(); URL.revokeObjectURL(url);
    } else {
      toast.error("Eksport qilib bo'lmadi");
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!importFile) { toast.error("Fayl tanlang"); return; }
    setImporting(true);
    const fd = new FormData();
    fd.append("file", importFile);
    fd.append("source", importSource);
    const res = await fetch("/api/leads/import", { method: "POST", body: fd });
    const data = await res.json();
    setImporting(false);
    if (!res.ok) { toast.error(data.error || "Xatolik yuz berdi"); return; }
    setImportResult(data);
    if (data.created > 0) { toast.success(`${data.created} ta lid qo'shildi`); loadLeads(); }
    if (data.failed > 0) toast.error(`${data.failed} ta qatorda xatolik topildi`);
  };

  const chipCls = (active: boolean) =>
    cn(
      "px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors duration-150 whitespace-nowrap",
      active
        ? "bg-[#5E2CA5] text-white"
        : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
    );

  const TABLE_HEADERS = ["Ism", "Telefon", "Kurs", "Vaqt", "Bosqich", "Manba", "Mas'ul", "Sana", ""];

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {dialog}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Lidlar</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{total} ta natija</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={inputSearch}
              onChange={e => setInputSearch(e.target.value)}
              placeholder="Ism yoki telefon..."
              className="pl-9 pr-4 py-2 text-[13px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl w-52 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 text-gray-900 dark:text-white placeholder-gray-400 transition"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium border transition-colors duration-150",
              showFilters
                ? "bg-[#5E2CA5]/10 text-[#5E2CA5] border-[#5E2CA5]/20"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
            )}
          >
            <Filter className="w-3.5 h-3.5" /> Filtrlar
          </button>
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150">
            <Download className="w-3.5 h-3.5" /> Excelga eksport
          </button>
          <button onClick={() => setShowImportModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150">
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
          <Link href="/leads/kanban" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150">
            <LayoutGrid className="w-3.5 h-3.5" /> Kanban
          </Link>
          <Link href="/leads/new" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors duration-150">
            <Plus className="w-4 h-4" /> Yangi lid
          </Link>
        </div>
      </div>

      {/* Status/stage filter + toggles */}
      <div className="flex items-center gap-2 flex-wrap">
        {stages.length > 0 && (
          <div className="relative">
            <select
              value={filters.stageId}
              onChange={e => setFilter("stageId", e.target.value)}
              className={cn(
                "pl-3.5 pr-8 py-1.5 rounded-full text-[13px] font-medium appearance-none cursor-pointer transition-colors duration-150",
                filters.stageId
                  ? "bg-[#5E2CA5] text-white"
                  : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
              )}
            >
              <option value="">Holat: Barchasi</option>
              {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className={cn("w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none", filters.stageId ? "text-white/80" : "text-gray-400")} />
          </div>
        )}
        <button onClick={() => setFilter("frozen", filters.frozen ? "" : "1")} className={chipCls(!!filters.frozen)}>
          ❄️ Muzlatilgan
        </button>
        <button onClick={() => setFilter("archived", filters.archived ? "" : "1")} className={chipCls(!!filters.archived)}>
          🗄 Arxiv
        </button>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select value={filters.courseId} onChange={e => setFilter("courseId", e.target.value)} className={inputCls}>
              <option value="">Barcha kurslar</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filters.source} onChange={e => setFilter("source", e.target.value)} className={inputCls}>
              <option value="">Barcha manbalar</option>
              {Object.entries(LEAD_SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={filters.assignedToId} onChange={e => setFilter("assignedToId", e.target.value)} className={inputCls}>
              <option value="">Barcha hodimlar</option>
              <option value="unassigned">Tayinlanmagan</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1.5">Sana oralig&apos;i: Dan – Gacha</label>
              <div className="flex items-center gap-1.5">
                <DatePicker value={filters.dateFrom} onChange={e => setFilter("dateFrom", e.target.value)} className={cn(inputCls, "min-w-0")} />
                <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">–</span>
                <DatePicker value={filters.dateTo} onChange={e => setFilter("dateTo", e.target.value)} className={cn(inputCls, "min-w-0")} />
              </div>
            </div>
          </div>
          {(filters.courseId || filters.source || filters.assignedToId || filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => setFilters(f => ({ ...f, courseId: "", source: "", assignedToId: "", dateFrom: "", dateTo: "", page: 1 }))}
              className="mt-3 flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-3 h-3" /> Filtrlarni tozalash
            </button>
          )}
        </div>
      )}

      {/* Table card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="px-5 py-2.5 bg-[#5E2CA5]/5 dark:bg-[#5E2CA5]/10 border-b border-[#5E2CA5]/10 flex items-center gap-3 flex-wrap">
            <span className="text-[13px] font-medium text-[#5E2CA5]">{selected.size} ta tanlandi</span>
            <select
              onChange={e => { if (e.target.value) handleBulkStageChange(e.target.value); e.target.value = ""; }}
              className="px-2.5 py-1 text-xs border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-white focus:outline-none"
            >
              <option value="">Bosqichni o&apos;zgartirish...</option>
              {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={() => setShowGroupModal(true)} className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#5E2CA5] text-white hover:bg-[#4a2280] transition-colors">
              + Guruhga qo&apos;shish
            </button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Bekor
            </button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm animate-pulse">Yuklanmoqda...</div>
        ) : leads.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Hech qanday lid topilmadi"
            description="Yangi lid qo'shib mijozlar bazasini to'ldirishni boshlang."
            action={
              <Link href="/leads/new">
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] text-white mx-auto hover:bg-[#4a2280] transition-colors">
                  <Plus className="w-4 h-4" /> Yangi lid qo&apos;shish
                </button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.size === leads.length && leads.length > 0}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-gray-300 accent-[#5E2CA5]"
                    />
                  </th>
                  {TABLE_HEADERS.map((h, i) => (
                    <th key={i} className="px-3 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {leads.map(lead => (
                  <tr
                    key={lead.id}
                    className={cn(
                      "hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-100",
                      selected.has(lead.id) && "bg-[#5E2CA5]/5 dark:bg-[#5E2CA5]/10"
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="h-4 w-4 rounded border-gray-300 accent-[#5E2CA5]"
                      />
                    </td>

                    {/* Name + avatar */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                          style={{ backgroundColor: BRAND }}
                        >
                          {lead.fullName.charAt(0).toUpperCase()}
                        </div>
                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-[13px] font-medium text-gray-900 dark:text-white hover:text-[#5E2CA5] transition-colors duration-150"
                        >
                          {lead.fullName}
                        </Link>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-3 py-3">
                      <a href={phoneToTel(lead.phone)} className="text-[13px] text-[#5E2CA5] hover:underline font-mono">
                        {formatPhone(lead.phone)}
                      </a>
                    </td>

                    {/* Course */}
                    <td className="px-3 py-3">
                      {lead.course ? (
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: (lead.course.color || BRAND) + "20", color: lead.course.color || BRAND }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: lead.course.color || BRAND }} />
                          {lead.course.name}
                        </span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>

                    {/* Time slot */}
                    <td className="px-3 py-3 text-[13px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {lead.timeSlot?.label ?? "—"}
                    </td>

                    {/* Stage badge */}
                    <td className="px-3 py-3">
                      {lead.stage ? (
                        <span
                          className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full text-white whitespace-nowrap"
                          style={{ backgroundColor: lead.stage.color }}
                        >
                          {lead.stage.name}
                        </span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>

                    {/* Source */}
                    <td className="px-3 py-3 text-[13px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {LEAD_SOURCE_LABELS[lead.source as keyof typeof LEAD_SOURCE_LABELS] ?? lead.source}
                    </td>

                    {/* Assigned to */}
                    <td className="px-3 py-3 text-[13px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {lead.assignedTo?.fullName ?? <span className="text-gray-300">—</span>}
                    </td>

                    {/* Date */}
                    <td className="px-3 py-3 text-[13px] text-gray-400 whitespace-nowrap">
                      {formatDate(lead.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-0.5">
                        <a href={phoneToTel(lead.phone)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors" title="Qo'ng'iroq">
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a href={phoneToTelegram(lead.phone)} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-lg transition-colors" title="Telegram">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                        <Link href={`/leads/${lead.id}`} className="p-1.5 text-gray-400 hover:text-[#5E2CA5] hover:bg-[#5E2CA5]/10 rounded-lg transition-colors" title="Tahrirlash">
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => handleDelete(lead.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-5 py-3 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
            <span className="text-[13px] text-gray-400">
              {total} ta natijadan {((filters.page - 1) * 50) + 1}–{Math.min(filters.page * 50, total)} ko&apos;rsatilmoqda
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                disabled={filters.page <= 1}
                className="p-2 rounded-xl border border-gray-200 dark:border-white/10 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <span className="text-[13px] text-gray-500 px-1">{filters.page} / {pages}</span>
              <button
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                disabled={filters.page >= pages}
                className="p-2 rounded-xl border border-gray-200 dark:border-white/10 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Guruhga qo'shish modal */}
      {showGroupModal && (
        <Modal
          title="Guruhga qo'shish"
          subtitle={`${selected.size} ta lid tanlandi`}
          maxWidth="max-w-lg"
          onClose={() => setShowGroupModal(false)}
          footer={
            <>
              <ModalPrimaryButton onClick={assignToGroup} loading={assigning}>Qo&apos;shish</ModalPrimaryButton>
              <ModalSecondaryButton onClick={() => setShowGroupModal(false)}>Bekor qilish</ModalSecondaryButton>
            </>
          }
        >
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-5">
              {(["new", "existing"] as const).map(mode => (
                <button key={mode} onClick={() => setGroupMode(mode)} className={cn("flex-1 px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors", groupMode === mode ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white" : "text-gray-500")}>
                  {mode === "new" ? "Yangi guruh" : "Mavjud guruh"}
                </button>
              ))}
            </div>

            {groupMode === "existing" ? (
              <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className={inputCls}>
                <option value="">Guruhni tanlang</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g._count?.leads ?? 0} a&apos;zo)</option>)}
              </select>
            ) : (
              <div className="space-y-3">
                <input placeholder="Guruh nomi" value={newGroup.name} onChange={e => setNewGroup(g => ({ ...g, name: e.target.value }))} className={inputCls} />
                <div className="grid grid-cols-2 gap-3">
                  <select value={newGroup.courseId} onChange={e => setNewGroup(g => ({ ...g, courseId: e.target.value }))} className={inputCls}>
                    <option value="">Kurs (ixtiyoriy)</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select value={newGroup.teacherId} onChange={e => setNewGroup(g => ({ ...g, teacherId: e.target.value }))} className={inputCls}>
                    <option value="">O&apos;qituvchi (ixtiyoriy)</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Qaysi kunlar</label>
                  <div className="flex gap-2 flex-wrap">
                    {WEEKDAYS.map(d => (
                      <button key={d.value} type="button" onClick={() => toggleGroupDay(d.value)}
                        className={cn("px-3 py-1 text-[13px] font-medium rounded-lg transition-colors", groupDays.includes(d.value) ? "bg-[#5E2CA5] text-white" : "border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5")}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Soat (dan)</label>
                    <input type="time" value={newGroup.timeFrom} onChange={e => setNewGroup(g => ({ ...g, timeFrom: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Soat (gacha)</label>
                    <input type="time" value={newGroup.timeTo} onChange={e => setNewGroup(g => ({ ...g, timeTo: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Boshlanish sanasi</label>
                  <DatePicker value={newGroup.startDate} onChange={e => setNewGroup(g => ({ ...g, startDate: e.target.value }))} className={inputCls} />
                </div>
              </div>
            )}
        </Modal>
      )}

      {/* Excel import modal */}
      {showImportModal && (
        <Modal
          title="Lidlarni Excel'dan import qilish"
          subtitle="F.I.Sh va Telefon ustunlari majburiy"
          maxWidth="max-w-lg"
          onClose={closeImportModal}
          footer={
            <>
              <ModalPrimaryButton onClick={handleImport} loading={importing} disabled={!importFile}>
                Yuklash
              </ModalPrimaryButton>
              <ModalSecondaryButton onClick={closeImportModal}>Yopish</ModalSecondaryButton>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Excel fayl (.xlsx)</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }}
                className="w-full text-[13px] text-gray-600 dark:text-gray-300 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-[#5E2CA5]/10 file:text-[#5E2CA5] file:text-[13px] file:font-medium file:cursor-pointer cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Manba (barcha qatorlar uchun)</label>
              <select value={importSource} onChange={(e) => setImportSource(e.target.value)} className={inputCls}>
                {Object.entries(LEAD_SOURCE_LABELS).filter(([v]) => v !== "WEBSITE").map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            {importResult && (
              <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-3 space-y-2">
                <p className="text-[13px] text-gray-700 dark:text-gray-300">
                  Jami: {importResult.total} · Qo&apos;shildi: <span className="text-emerald-600 dark:text-emerald-400 font-medium">{importResult.created}</span> · Xato: <span className="text-red-500 dark:text-red-400 font-medium">{importResult.failed}</span>
                </p>
                {importResult.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {importResult.errors.map((e, i) => (
                      <p key={i} className="text-[12px] text-red-500 dark:text-red-400">
                        Qator {e.row}: {e.reason}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
