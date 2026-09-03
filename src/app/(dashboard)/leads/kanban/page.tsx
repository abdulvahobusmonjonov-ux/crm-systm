"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus, Phone, MessageCircle, Download, Settings2, Trash2,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { formatPhone, phoneToTel, phoneToTelegram } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Modal, ModalSecondaryButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface Stage { id: string; name: string; color: string; order: number; isWon: boolean; isLost: boolean; }
interface Lead {
  id: string; fullName: string; phone: string; stageId: string | null;
  course: { name: string; color: string | null } | null;
  assignedTo: { fullName: string } | null;
}
type Board = Record<string, Lead[]>;

const BRAND = "#5E2CA5";
const SWATCHES = ["#3b82f6","#6366f1","#8b5cf6","#a855f7","#ec4899","#f43f5e","#ef4444","#f97316","#f59e0b","#eab308","#10b981","#06b6d4","#14b8a6","#6b7280"];

export default function KanbanPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [board, setBoard] = useState<Board>({});
  const [loading, setLoading] = useState(true);
  const [manage, setManage] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [addingCol, setAddingCol] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [colorOpen, setColorOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<Stage | null>(null);

  // Auto-scroll the board horizontally while dragging a card near its left/right edge —
  // @hello-pangea/dnd only auto-scrolls the window or a Droppable's own internal scroll
  // container, not an arbitrary scrollable ancestor like the row of columns here.
  const boardRef = useRef<HTMLDivElement>(null);
  const scrollDirRef = useRef(0);
  const scrollFrameRef = useRef<number | null>(null);
  const EDGE = 100, SPEED = 14;

  const scrollStep = useCallback(() => {
    const el = boardRef.current;
    if (el && scrollDirRef.current !== 0) el.scrollLeft += scrollDirRef.current * SPEED;
    scrollFrameRef.current = requestAnimationFrame(scrollStep);
  }, []);

  const handleDragPointerMove = useCallback((e: MouseEvent) => {
    const el = boardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (e.clientX < rect.left + EDGE) scrollDirRef.current = -1;
    else if (e.clientX > rect.right - EDGE) scrollDirRef.current = 1;
    else scrollDirRef.current = 0;
  }, []);

  const onDragStart = useCallback(() => {
    scrollDirRef.current = 0;
    document.addEventListener("mousemove", handleDragPointerMove);
    scrollFrameRef.current = requestAnimationFrame(scrollStep);
  }, [handleDragPointerMove, scrollStep]);

  const stopAutoScroll = useCallback(() => {
    scrollDirRef.current = 0;
    document.removeEventListener("mousemove", handleDragPointerMove);
    if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
  }, [handleDragPointerMove]);

  useEffect(() => {
    try { const s = localStorage.getItem("kanbanCollapsed"); if (s) setCollapsed(new Set(JSON.parse(s))); } catch {}
  }, []);

  const persist = (n: Set<string>) => { try { localStorage.setItem("kanbanCollapsed", JSON.stringify([...n])); } catch {} };
  const toggleCollapse = (id: string) => setCollapsed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); persist(n); return n; });
  const collapseEmpty = () => { const n = new Set(collapsed); stages.forEach(s => { if ((board[s.id] || []).length === 0) n.add(s.id); }); setCollapsed(n); persist(n); };
  const expandAll = () => { setCollapsed(new Set()); persist(new Set()); };

  const load = async () => {
    setLoading(true);
    const [st, lr] = await Promise.all([
      fetch("/api/stages").then(r => r.json()),
      fetch("/api/leads?limit=500").then(r => r.json()),
    ]);
    const stageList: Stage[] = Array.isArray(st) ? st : [];
    setStages(stageList);
    const grouped: Board = {};
    stageList.forEach(s => (grouped[s.id] = []));
    const firstId = stageList[0]?.id;
    (lr.leads || []).forEach((l: Lead) => {
      const key = l.stageId && grouped[l.stageId] ? l.stageId : firstId;
      if (key && grouped[key]) grouped[key].push(l);
    });
    setBoard(grouped);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onDragEnd = async (result: DropResult) => {
    stopAutoScroll();
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;
    const srcCol = source.droppableId, dstCol = destination.droppableId;
    const srcItems = [...board[srcCol]];
    const dstItems = srcCol === dstCol ? srcItems : [...board[dstCol]];
    const [moved] = srcItems.splice(source.index, 1);
    moved.stageId = dstCol;
    dstItems.splice(destination.index, 0, moved);
    setBoard(b => ({ ...b, [srcCol]: srcItems, [dstCol]: dstItems }));
    const res = await fetch(`/api/leads/${draggableId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId: dstCol }),
    });
    if (!res.ok) { toast.error("Ko'chirib bo'lmadi"); load(); }
    else { const s = stages.find(x => x.id === dstCol); toast.success(`→ ${s?.name || ""}`); }
  };

  const addStage = async () => {
    if (newColName.trim().length < 1) { toast.error("Ustun nomini kiriting"); return; }
    setAddingCol(true);
    const res = await fetch("/api/stages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newColName.trim() }),
    });
    if (res.ok) { setNewColName(""); toast.success("Ustun qo'shildi"); load(); }
    else toast.error("Qo'shib bo'lmadi (ruxsat kerak)");
    setAddingCol(false);
  };

  const renameStage = async (id: string) => {
    const name = nameDraft.trim();
    setEditingName(null);
    if (!name) return;
    const res = await fetch(`/api/stages/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) { setStages(s => s.map(x => x.id === id ? { ...x, name } : x)); }
    else toast.error("O'zgartirib bo'lmadi");
  };

  const recolor = async (id: string, color: string) => {
    setColorOpen(null);
    setStages(s => s.map(x => x.id === id ? { ...x, color } : x));
    await fetch(`/api/stages/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    });
  };

  const deleteStage = async (id: string) => {
    const res = await fetch(`/api/stages/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Ustun o'chirildi"); load(); }
    else toast.error("O'chirib bo'lmadi");
  };

  const moveStage = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= stages.length) return;
    const a = stages[index], b = stages[j];
    setStages(s => { const c = [...s]; [c[index], c[j]] = [c[j], c[index]]; return c; });
    await Promise.all([
      fetch(`/api/stages/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: b.order }) }),
      fetch(`/api/stages/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: a.order }) }),
    ]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className="flex-shrink-0 w-72 h-[480px] bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Kanban</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Lidlarni drag &amp; drop bilan boshqaring</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={collapsed.size > 0 ? expandAll : collapseEmpty}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            {collapsed.size > 0
              ? <><ChevronDown className="w-3.5 h-3.5" /> Hammasini ochish</>
              : <><ChevronUp className="w-3.5 h-3.5" /> Bo&apos;shlarni yig&apos;ish</>
            }
          </button>
          <button
            onClick={() => setManage(m => !m)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium border transition-colors",
              manage
                ? "bg-[#5E2CA5]/10 text-[#5E2CA5] border-[#5E2CA5]/20"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
            )}
          >
            <Settings2 className="w-3.5 h-3.5" /> {manage ? "Tayyor" : "Ustunlar"}
          </button>
          <a href="/api/reports/export" download className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <Download className="w-3.5 h-3.5" /> Excel
          </a>
          <Link href="/leads" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            Jadval
          </Link>
          <Link href="/leads/new" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> Yangi lid
          </Link>
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div ref={boardRef} className="flex gap-4 overflow-x-auto pb-6 items-start">

          {stages.map((stage, index) => {
            const items = board[stage.id] || [];

            /* ── Collapsed column ── */
            if (collapsed.has(stage.id) && !manage) {
              return (
                <button
                  key={stage.id}
                  onClick={() => toggleCollapse(stage.id)}
                  title="Ochish"
                  className="flex-shrink-0 w-14 self-start bg-gray-100 dark:bg-gray-800/60 rounded-2xl p-3 flex flex-col items-center gap-3 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                  <span
                    className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 writing-mode-vertical"
                    style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                  >
                    {stage.name}
                  </span>
                  <span className="bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[11px] font-semibold px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-white/10">
                    {items.length}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
              );
            }

            /* ── Full column ── */
            return (
              <div key={stage.id} className="flex-shrink-0 w-72 bg-gray-100 dark:bg-gray-800/60 rounded-2xl flex flex-col">

                {/* Column header */}
                <div className="px-3.5 pt-3.5 pb-2.5">
                  {!manage ? (
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                      <h3 className="flex-1 text-[13px] font-semibold text-gray-700 dark:text-gray-200 truncate">{stage.name}</h3>
                      <span className="bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-gray-200 dark:border-white/10 shadow-sm flex-shrink-0">
                        {items.length}
                      </span>
                      <button
                        onClick={() => toggleCollapse(stage.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                        title="Yig'ish"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    /* Manage mode header */
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {editingName === stage.id ? (
                          <input
                            autoFocus value={nameDraft}
                            onChange={e => setNameDraft(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") renameStage(stage.id); if (e.key === "Escape") setEditingName(null); }}
                            onBlur={() => renameStage(stage.id)}
                            className="flex-1 min-w-0 px-2 py-1 text-[13px] border border-[#5E2CA5]/40 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#5E2CA5]/30"
                          />
                        ) : (
                          <button
                            onClick={() => { setEditingName(stage.id); setNameDraft(stage.name); }}
                            className="flex-1 text-left text-[13px] font-semibold text-gray-700 dark:text-gray-200 truncate hover:text-[#5E2CA5] transition-colors"
                          >
                            {stage.name}
                          </button>
                        )}
                        <button
                          onClick={() => setColorOpen(colorOpen === stage.id ? null : stage.id)}
                          className="w-5 h-5 rounded-full border-2 border-white dark:border-white/10 shadow-sm flex-shrink-0 hover:scale-110 transition-transform"
                          style={{ backgroundColor: stage.color }}
                          title="Rang"
                        />
                      </div>
                      {colorOpen === stage.id && (
                        <div className="flex flex-wrap gap-1.5 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm">
                          {SWATCHES.map(c => (
                            <button
                              key={c}
                              onClick={() => recolor(stage.id, c)}
                              className="w-5 h-5 rounded-full border-2 border-transparent hover:border-white hover:scale-110 transition-transform"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-0.5">
                          <button onClick={() => moveStage(index, -1)} disabled={index === 0} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-colors">
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => moveStage(index, 1)} disabled={index === stages.length - 1} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-colors">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button onClick={() => setConfirmDelete(stage)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Droppable area */}
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 px-2.5 pb-2.5 space-y-2 min-h-[200px] rounded-b-2xl transition-colors duration-150",
                        snapshot.isDraggingOver ? "bg-[#5E2CA5]/5 dark:bg-[#5E2CA5]/10" : ""
                      )}
                    >
                      {items.map((lead, idx) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={idx}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={cn(
                                "bg-white dark:bg-gray-900 rounded-xl p-3.5 transition-all duration-150 select-none",
                                snap.isDragging
                                  ? "shadow-2xl rotate-1 scale-[1.02] opacity-95"
                                  : "shadow-sm hover:shadow-md"
                              )}
                            >
                              {/* Name */}
                              <Link
                                href={`/leads/${lead.id}`}
                                onClick={e => { if (snap.isDragging) e.preventDefault(); }}
                              >
                                <p className="text-[13px] font-semibold text-gray-900 dark:text-white hover:text-[#5E2CA5] dark:hover:text-purple-400 transition-colors leading-snug mb-1.5">
                                  {lead.fullName}
                                </p>
                              </Link>

                              {/* Course tag */}
                              {lead.course ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full mb-2.5"
                                  style={{
                                    backgroundColor: (lead.course.color || BRAND) + "18",
                                    color: lead.course.color || BRAND,
                                  }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: lead.course.color || BRAND }} />
                                  {lead.course.name}
                                </span>
                              ) : (
                                <span className="inline-block text-[11px] px-2 py-0.5 rounded-full mb-2.5 bg-gray-100 dark:bg-gray-800 text-gray-400">
                                  Kurs yo&apos;q
                                </span>
                              )}

                              {/* Phone + contact buttons */}
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] text-gray-400 font-mono">{formatPhone(lead.phone)}</span>
                                <div className="flex items-center gap-0.5">
                                  <a
                                    href={phoneToTel(lead.phone)}
                                    onClick={e => e.stopPropagation()}
                                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                    title="Qo'ng'iroq"
                                  >
                                    <Phone className="w-3 h-3" />
                                  </a>
                                  <a
                                    href={phoneToTelegram(lead.phone)}
                                    target="_blank" rel="noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="p-1.5 text-gray-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-lg transition-colors"
                                    title="Telegram"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>

                              {/* Assigned to */}
                              {lead.assignedTo && (
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 truncate">
                                  {lead.assignedTo.fullName}
                                </p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
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

          {/* Add column (manage mode) */}
          {manage && (
            <div className="flex-shrink-0 w-72 bg-gray-100/60 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/10 p-4">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
                Yangi ustun
              </p>
              <input
                value={newColName}
                onChange={e => setNewColName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addStage(); }}
                placeholder="Ustun nomi"
                className="w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition mb-2.5"
              />
              <Button size="sm" className="w-full" loading={addingCol} onClick={addStage}>
                <Plus className="w-4 h-4" /> Qo&apos;shish
              </Button>
            </div>
          )}

        </div>
      </DragDropContext>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <Modal
          title="Ustunni o'chirish"
          maxWidth="max-w-sm"
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <button
                onClick={() => { const id = confirmDelete.id; setConfirmDelete(null); deleteStage(id); }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold rounded-xl transition-colors"
              >
                O&apos;chirish
              </button>
              <ModalSecondaryButton onClick={() => setConfirmDelete(null)}>Bekor qilish</ModalSecondaryButton>
            </>
          }
        >
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-1">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-700 dark:text-gray-200">{confirmDelete.name}</span> ustunini o&apos;chirasizmi? Ichidagi lidlar birinchi ustunga ko&apos;chiriladi.
          </p>
        </Modal>
      )}
    </div>
  );
}
