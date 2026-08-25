"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, GraduationCap, Clock, Users2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/components/ui/confirm";
import { Modal, ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#6366f1","#10b981","#f59e0b","#f43f5e","#06b6d4","#8b5cf6","#ec4899","#14b8a6"];

const schema = z.object({
  name: z.string().min(2, "Kamida 2 harf"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Kichik harf va - faqat"),
  description: z.string().optional(),
  durationMonths: z.coerce.number().int().min(1),
  price: z.coerce.number().min(0),
  color: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Course {
  id: string; name: string; slug: string; description: string | null;
  durationMonths: number; price: string; currency: string;
  isActive: boolean; color: string | null;
  _count: { leads: number };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { durationMonths: 3, price: 500000, color: "#6366f1" },
  });

  const selectedColor = watch("color");

  const load = async () => {
    const res = await fetch("/api/courses");
    if (res.ok) setCourses(await res.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", slug: "", description: "", durationMonths: 3, price: 500000, color: "#6366f1" });
    setModalOpen(true);
  };

  const openEdit = (c: Course) => {
    setEditing(c);
    reset({ name: c.name, slug: c.slug, description: c.description || "", durationMonths: c.durationMonths, price: parseFloat(c.price), color: c.color || "#6366f1" });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const url = editing ? `/api/courses/${editing.id}` : "/api/courses";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) {
      toast.success(editing ? "Kurs yangilandi" : "Kurs qo'shildi");
      setModalOpen(false); load();
    } else {
      const e = await res.json();
      toast.error(e.error || "Xatolik");
    }
    setSaving(false);
  };

  const toggleActive = async (c: Course) => {
    await fetch(`/api/courses/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !c.isActive }) });
    load();
  };

  const { confirm, dialog } = useConfirm();

  const deleteCourse = async (c: Course) => {
    if (!(await confirm({ title: "Kursni o'chirish", message: `"${c.name}" kursini o'chirishni tasdiqlaysizmi?` }))) return;
    const res = await fetch(`/api/courses/${c.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Kurs o'chirildi"); load(); }
    else toast.error("O'chirib bo'lmadi — bog'liq lidlar mavjud bo'lishi mumkin");
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {dialog}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Kurslar</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{courses.length} ta kurs</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Yangi kurs
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({length:5}).map((_,i)=><div key={i} className="h-52 bg-white dark:bg-gray-900 rounded-2xl shadow-sm animate-pulse"/>)}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm py-20 text-center">
          <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-medium text-[13px]">Hali kurs yo&apos;q</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Birinchi kursni qo&apos;shing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(c => (
            <div
              key={c.id}
              className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 ${!c.isActive ? "opacity-60" : ""}`}
            >
              {/* Top: icon, name, status badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-[15px]"
                    style={{ backgroundColor: c.color || "#5E2CA5" }}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{c.name}</h3>
                    <p className="text-[11px] text-gray-400 truncate">/{c.slug}</p>
                  </div>
                </div>
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold flex-shrink-0 whitespace-nowrap ${c.isActive ? "bg-green-500/10 text-green-600" : "bg-gray-100 text-gray-400 dark:bg-white/5"}`}>
                  {c.isActive ? "Faol" : "Nofaol"}
                </span>
              </div>

              {c.description && <p className="text-[13px] text-gray-400 mb-3 line-clamp-2">{c.description}</p>}

              <div className="border-t border-gray-100 dark:border-white/5 my-3" />

              {/* 2x2 stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Davomiyligi</p>
                    <p className="text-[13px] font-semibold text-gray-900 dark:text-white whitespace-nowrap">{c.durationMonths} oy</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#5E2CA5]/10 text-[#5E2CA5] flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Narxi</p>
                    <p className="text-[13px] font-semibold text-[#5E2CA5] truncate">{formatCurrency(c.price, c.currency)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Guruhlar</p>
                    <p className="text-[13px] font-semibold text-gray-900 dark:text-white">—</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center flex-shrink-0">
                    <Users2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">O&apos;quvchilar</p>
                    <p className="text-[13px] font-semibold text-gray-900 dark:text-white">{c._count.leads}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-600 dark:text-gray-300">
                  <Edit className="w-3.5 h-3.5"/> Tahrirlash
                </button>
                <button onClick={() => toggleActive(c)} className="p-2 text-gray-400 hover:text-amber-600 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors" title={c.isActive?"O'chirish":"Yoqish"}>
                  {c.isActive ? <ToggleRight className="w-4 h-4"/> : <ToggleLeft className="w-4 h-4"/>}
                </button>
                <button onClick={() => deleteCourse(c)} className="p-2 text-gray-400 hover:text-red-600 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <Modal
          title={editing ? "Kursni tahrirlash" : "Yangi kurs"}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Kurs nomi *" {...register("name")} error={errors.name?.message} placeholder="Frontend Development"/>
            <Input label="Slug *" {...register("slug")} error={errors.slug?.message} placeholder="frontend-dev"/>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tavsif</label>
              <textarea {...register("description")} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition" placeholder="Qisqa tavsif..."/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Narxi (UZS) *" type="number" {...register("price")} error={errors.price?.message}/>
              <Input label="Davomiyligi (oy) *" type="number" {...register("durationMonths")} error={errors.durationMonths?.message}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rang</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(color => (
                  <button key={color} type="button" onClick={()=>setValue("color", color)}
                    className={`w-7 h-7 rounded-lg transition ${selectedColor===color?"ring-2 ring-offset-2 ring-[#5E2CA5] scale-110":""}`}
                    style={{backgroundColor:color}}/>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <ModalPrimaryButton type="submit" loading={saving}>{editing ? "Saqlash" : "Qo'shish"}</ModalPrimaryButton>
              <ModalSecondaryButton type="button" onClick={() => setModalOpen(false)}>Bekor qilish</ModalSecondaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
