"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus, Trash2, Calendar, User as UserIcon, Filter, X, ListChecks,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useConfirm } from "@/components/ui/confirm";
import { Modal, ModalPrimaryButton, ModalSecondaryButton, modalFieldCls, modalLabelCls } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { DatePicker } from "@/components/ui/date-picker";
import { TASK_TYPE_LABELS } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

interface Tag { id: string; name: string; color: string; }
interface UserOption { id: string; fullName: string; }

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  type: string | null;
  dueDate: string | null;
  createdAt: string;
  assignedTo: { id: string; fullName: string } | null;
  createdBy: { id: string; fullName: string } | null;
  tags: Tag[];
}

type Board = Record<TaskStatus, Task[]>;

const BRAND = "#5E2CA5";

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "TODO", label: "Bajarilmagan" },
  { id: "IN_PROGRESS", label: "Jarayonda" },
  { id: "DONE", label: "Bajarilgan" },
];

const emptyBoard = (): Board => ({ TODO: [], IN_PROGRESS: [], DONE: [] });

function isOverdue(t: Task) {
  return !!t.dueDate && t.status !== "DONE" && new Date(t.dueDate) < new Date(new Date().toDateString());
}

export default function TasksPage() {
  const [board, setBoard] = useState<Board>(emptyBoard());
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [filters, setFilters] = useState({ assignedToId: "", type: "", tagId: "", overdue: "" });
  const [form, setForm] = useState({ title: "", description: "", type: "", dueDate: "", assignedToId: "", tagIds: [] as string[] });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "500" });
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await fetch(`/api/tasks?${params}`);
    const data = await res.json();
    const grouped = emptyBoard();
    (data.tasks || []).forEach((t: Task) => { grouped[t.status]?.push(t); });
    setBoard(grouped);
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : []));
    fetch("/api/tags").then(r => r.json()).then(d => setTags(Array.isArray(d) ? d : []));
  }, []);

  const setFilter = (key: keyof typeof filters, value: string) =>
    setFilters(f => ({ ...f, [key]: f[key] === value ? "" : value }));

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;
    const srcCol = source.droppableId as TaskStatus, dstCol = destination.droppableId as TaskStatus;
    const srcItems = [...board[srcCol]];
    const dstItems = srcCol === dstCol ? srcItems : [...board[dstCol]];
    const [moved] = srcItems.splice(source.index, 1);
    moved.status = dstCol;
    dstItems.splice(destination.index, 0, moved);
    setBoard(b => ({ ...b, [srcCol]: srcItems, [dstCol]: dstItems }));
    const res = await fetch(`/api/tasks/${draggableId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: dstCol }),
    });
    if (!res.ok) { toast.error("Ko'chirib bo'lmadi"); load(); }
    else toast.success(`→ ${COLUMNS.find(c => c.id === dstCol)?.label || ""}`);
  };

  const { confirm, dialog } = useConfirm();

  const removeTask = async (id: string) => {
    if (!(await confirm({ title: "Vazifani o'chirish", message: "Bu vazifani o'chirasizmi?" }))) return;
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Vazifa o'chirildi"); load(); }
    else toast.error("O'chirib bo'lmadi");
  };

  const toggleFormTag = (id: string) =>
    setForm(f => ({ ...f, tagIds: f.tagIds.includes(id) ? f.tagIds.filter(x => x !== id) : [...f.tagIds, id] }));

  const createTask = async () => {
    if (form.title.trim().length < 2) { toast.error("Sarlavhani kiriting"); return; }
    setCreating(true);
    const res = await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description || undefined,
        type: form.type || null,
        dueDate: form.dueDate || null,
        assignedToId: form.assignedToId || null,
        tagIds: form.tagIds,
      }),
    });
    if (res.ok) {
      toast.success("Vazifa yaratildi");
      setShowCreate(false);
      setForm({ title: "", description: "", type: "", dueDate: "", assignedToId: "", tagIds: [] });
      load();
    } else toast.error("Yaratib bo'lmadi");
    setCreating(false);
  };

  const totalCount = board.TODO.length + board.IN_PROGRESS.length + board.DONE.length;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {dialog}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Vazifalar</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{totalCount} ta vazifa</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium border transition-colors duration-150",
              showFilters || activeFilterCount
                ? "bg-[#5E2CA5]/10 text-[#5E2CA5] border-[#5E2CA5]/20"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
            )}
          >
            <Filter className="w-3.5 h-3.5" /> Filtrlar {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Yangi vazifa
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={filters.assignedToId}
              onChange={e => setFilters(f => ({ ...f, assignedToId: e.target.value }))}
              className={modalFieldCls}
            >
              <option value="">Barcha xodimlar</option>
              <option value="unassigned">Tayinlanmagan</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
            <select
              value={filters.type}
              onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
              className={modalFieldCls}
            >
              <option value="">Barcha turlar</option>
              {Object.entries(TASK_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select
              value={filters.tagId}
              onChange={e => setFilters(f => ({ ...f, tagId: e.target.value }))}
              className={modalFieldCls}
            >
              <option value="">Barcha teglar</option>
              {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilter("overdue", "1")}
              className={cn(
                "px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors",
                filters.overdue ? "bg-red-600 text-white" : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
              )}
            >
              ⏰ Muddati o&apos;tgan
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={() => setFilters({ assignedToId: "", type: "", tagId: "", overdue: "" })}
                className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3 h-3" /> Tozalash
              </button>
            )}
          </div>
        </div>
      )}

      {/* Board */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-80 h-[420px] bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : totalCount === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Hech qanday vazifa yo'q"
          description="Yangi vazifa qo'shib jamoangiz ishini kuzatib boring."
          action={
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] text-white mx-auto hover:bg-[#4a2280] transition-colors">
              <Plus className="w-4 h-4" /> Vazifa qo&apos;shish
            </button>
          }
        />
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            {COLUMNS.map(col => {
              const items = board[col.id];
              return (
                <div key={col.id} className="bg-gray-100 dark:bg-gray-800/60 rounded-2xl flex flex-col">
                  <div className="px-3.5 pt-3.5 pb-2.5 flex items-center gap-2">
                    <h3 className="flex-1 text-[13px] font-semibold text-gray-700 dark:text-gray-200">{col.label}</h3>
                    <span className="bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-gray-200 dark:border-white/10 shadow-sm">
                      {items.length}
                    </span>
                  </div>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "flex-1 px-2.5 pb-2.5 space-y-2 min-h-[160px] rounded-b-2xl transition-colors duration-150",
                          snapshot.isDraggingOver ? "bg-[#5E2CA5]/5 dark:bg-[#5E2CA5]/10" : ""
                        )}
                      >
                        {items.map((task, idx) => {
                          const overdue = isOverdue(task);
                          return (
                            <Draggable key={task.id} draggableId={task.id} index={idx}>
                              {(prov, snap) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  className={cn(
                                    "bg-white dark:bg-gray-900 rounded-xl p-3.5 transition-all duration-150 select-none",
                                    snap.isDragging ? "shadow-2xl rotate-1 scale-[1.02] opacity-95" : "shadow-sm hover:shadow-md"
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <p className="text-[13px] font-semibold text-gray-900 dark:text-white leading-snug">{task.title}</p>
                                    <button
                                      onClick={() => removeTask(task.id)}
                                      className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {task.description && (
                                    <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-2 line-clamp-2">{task.description}</p>
                                  )}

                                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                    {task.type && TASK_TYPE_LABELS[task.type] && (
                                      <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#5E2CA5]/10 text-[#5E2CA5]">
                                        {TASK_TYPE_LABELS[task.type]}
                                      </span>
                                    )}
                                    {task.tags.map(t => (
                                      <span
                                        key={t.id}
                                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                                        style={{ backgroundColor: t.color + "18", color: t.color }}
                                      >
                                        {t.name}
                                      </span>
                                    ))}
                                  </div>

                                  <div className="flex items-center justify-between">
                                    {task.dueDate ? (
                                      <span className={cn("flex items-center gap-1 text-[11px]", overdue ? "text-red-600 font-medium" : "text-gray-400")}>
                                        <Calendar className="w-3 h-3" /> {formatDate(task.dueDate)}
                                      </span>
                                    ) : <span />}
                                    {task.assignedTo && (
                                      <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 truncate">
                                        <UserIcon className="w-3 h-3" /> {task.assignedTo.fullName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                        {items.length === 0 && !snapshot.isDraggingOver && (
                          <div className="h-16 flex items-center justify-center text-[12px] text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                            Bo&apos;sh
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Create task modal */}
      {showCreate && (
        <Modal
          title="Yangi vazifa"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <ModalPrimaryButton onClick={createTask} loading={creating}>Yaratish</ModalPrimaryButton>
              <ModalSecondaryButton onClick={() => setShowCreate(false)}>Bekor qilish</ModalSecondaryButton>
            </>
          }
        >
          <div>
            <label className={modalLabelCls}>Sarlavha *</label>
            <input
              autoFocus
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Masalan: Yangi guruh uchun xona band qilish"
              className={modalFieldCls}
            />
          </div>

          <div>
            <label className={modalLabelCls}>Tavsif (ixtiyoriy)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className={modalFieldCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={modalLabelCls}>Turi</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={modalFieldCls}>
                <option value="">Tanlanmagan</option>
                {Object.entries(TASK_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={modalLabelCls}>Muddat</label>
              <DatePicker value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className={modalFieldCls} />
            </div>
          </div>

          <div>
            <label className={modalLabelCls}>Xodim (ixtiyoriy)</label>
            <select value={form.assignedToId} onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))} className={modalFieldCls}>
              <option value="">Tayinlanmagan</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </div>

          {tags.length > 0 && (
            <div>
              <label className={modalLabelCls}>Teglar</label>
              <div className="flex gap-2 flex-wrap">
                {tags.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleFormTag(t.id)}
                    className={cn(
                      "px-3 py-1 text-[12px] font-medium rounded-lg transition-colors border",
                      form.tagIds.includes(t.id)
                        ? "text-white border-transparent"
                        : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                    )}
                    style={form.tagIds.includes(t.id) ? { backgroundColor: t.color } : undefined}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
