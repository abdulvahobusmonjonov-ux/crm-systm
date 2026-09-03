"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { PhoneInput } from "@/components/ui/phone-input";
import { LEAD_SOURCE_LABELS, WEEKDAYS } from "@/lib/constants";
import { cn, isPhoneComplete } from "@/lib/utils";

const BRAND = "#5E2CA5";

const schema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 harf"),
  phone: z.string().refine(isPhoneComplete, "To'liq telefon raqam kiriting"),
  phoneSecondary: z.string().optional().refine((v) => !v || isPhoneComplete(v), "To'liq telefon raqam kiriting"),
  email: z.string().email().optional().or(z.literal("")),
  age: z.coerce.number().int().min(5).max(99).optional().or(z.literal("")),
  address: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional().refine((v) => !v || isPhoneComplete(v), "To'liq telefon raqam kiriting"),
  courseId: z.string().optional(),
  timeSlotId: z.string().optional(),
  timePreference: z.enum(["MORNING","AFTERNOON","EVENING","FLEXIBLE"]),
  preferredDays: z.string().optional(),
  status: z.enum(["NEW","CONTACTED","INTERESTED","TRIAL_BOOKED","TRIAL_COMPLETED","ENROLLED","POSTPONED","LOST"]),
  source: z.enum(["INSTAGRAM","TELEGRAM","FACEBOOK","TIKTOK","REFERRAL","WEBSITE","WALK_IN","PHONE_CALL","OTHER"]),
  sourceDetails: z.string().optional(),
  notes: z.string().optional(),
  assignedToId: z.string().optional(),
  trialDate: z.string().optional(),
  reminderAt: z.string().optional(),
  reminderTitle: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Course { id: string; name: string; color: string | null; }
interface TimeSlot { id: string; label: string; }
interface User { id: string; fullName: string; }

const fieldCls = "w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition";
const labelCls = "block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5";
const sectionCls = "bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 space-y-4";
const sectionTitleCls = "text-[14px] font-semibold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-white/5";

export default function NewLeadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isStudentMode = searchParams.get("status") === "ENROLLED";
  const [courses, setCourses] = useState<Course[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState<{ id: string } | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { timePreference: "FLEXIBLE", status: isStudentMode ? "ENROLLED" : "NEW", source: "OTHER" },
  });

  const phone = watch("phone");

  useEffect(() => {
    Promise.all([
      fetch("/api/courses").then(r => r.json()),
      fetch("/api/timeslots").then(r => r.json()),
      fetch("/api/users").then(r => r.json()),
    ]).then(([c, t, u]) => { setCourses(c); setTimeSlots(t); setUsers(u); });
  }, []);

  useEffect(() => {
    if (!phone || !isPhoneComplete(phone)) { setDuplicate(null); return; }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/leads?search=${encodeURIComponent(phone)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        const match = data.leads.find((l: { id: string; phone: string }) =>
          l.phone === phone || l.phone.replace(/\D/g, "") === phone.replace(/\D/g, "")
        );
        setDuplicate(match ? { id: match.id } : null);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [phone]);

  const toggleDay = (day: string) => {
    const next = selectedDays.includes(day) ? selectedDays.filter(d => d !== day) : [...selectedDays, day];
    setSelectedDays(next);
    setValue("preferredDays", next.join(","));
  };

  const createCourse = async () => {
    if (newCourseName.trim().length < 2) { toast.error("Kurs nomi kamida 2 harf"); return; }
    setCreatingCourse(true);
    const base = newCourseName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const slug = (base || "kurs") + "-" + Date.now().toString(36).slice(-4);
    const res = await fetch("/api/courses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCourseName.trim(), slug, durationMonths: 6, price: 0 }),
    });
    if (res.ok) {
      const c = await res.json();
      setCourses(prev => [...prev, c]);
      setValue("courseId", c.id);
      setShowNewCourse(false); setNewCourseName("");
      toast.success("Kurs yaratildi");
    } else { toast.error("Kurs yaratilmadi"); }
    setCreatingCourse(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const lessonTime = timeFrom && timeTo ? `${timeFrom}–${timeTo}` : (timeFrom || timeTo || undefined);
    const res = await fetch("/api/leads", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, lessonTime, age: data.age || null }),
    });
    if (res.ok) {
      const lead = await res.json();
      toast.success(isStudentMode ? "Talaba muvaffaqiyatli qo'shildi!" : "Lid muvaffaqiyatli qo'shildi!");
      router.push(isStudentMode ? "/students" : `/leads/${lead.id}`);
    } else {
      const err = await res.json();
      if (err.error === "duplicate") {
        toast.warning("Bu telefon raqam allaqachon mavjud!");
        setDuplicate({ id: err.leadId });
      } else {
        toast.error("Xatolik yuz berdi");
      }
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href={isStudentMode ? "/students" : "/leads"}
            className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-[#5E2CA5] hover:border-[#5E2CA5]/30 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{isStudentMode ? "Yangi talaba" : "Yangi lid"}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
              {isStudentMode ? "Yangi o'quvchi ma'lumotlarini kiriting" : "Potentsial o'quvchi ma'lumotlarini kiriting"}
            </p>
          </div>
        </div>

        {/* Duplicate warning */}
        {duplicate && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-[13px] font-medium text-amber-800 dark:text-amber-300 flex-1">Bu telefon raqam allaqachon mavjud!</p>
            <Link href={`/leads/${duplicate.id}`} className="text-[12px] font-semibold text-amber-700 dark:text-amber-400 underline whitespace-nowrap">Ko&apos;rish →</Link>
          </div>
        )}

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5">

          {/* ── Asosiy ma'lumotlar ── */}
          <div className={sectionCls}>
            <p className={sectionTitleCls}>Asosiy ma&apos;lumotlar</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>To&apos;liq ism-familya *</label>
                <input {...register("fullName")} placeholder="Aziza Karimova" className={fieldCls} />
                {errors.fullName && <p className="mt-1 text-[11px] text-red-500">{errors.fullName.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Telefon raqam *</label>
                <PhoneInput value={watch("phone") || ""} onChange={e => setValue("phone", e.target.value)} />
                {errors.phone && <p className="mt-1 text-[11px] text-red-500">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Qo&apos;shimcha raqam</label>
                <PhoneInput value={watch("phoneSecondary") || ""} onChange={e => setValue("phoneSecondary", e.target.value)} />
                {errors.phoneSecondary && <p className="mt-1 text-[11px] text-red-500">{errors.phoneSecondary.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Yoshi</label>
                <input type="number" {...register("age")} placeholder="18" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Manzil</label>
                <input {...register("address")} placeholder="Toshkent, Yunusobod" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Ota-ona ismi</label>
                <input {...register("parentName")} placeholder="Ota yoki ona ismi" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Ota-ona telefoni</label>
                <PhoneInput value={watch("parentPhone") || ""} onChange={e => setValue("parentPhone", e.target.value)} />
                {errors.parentPhone && <p className="mt-1 text-[11px] text-red-500">{errors.parentPhone.message}</p>}
              </div>
            </div>
          </div>

          {/* ── Manbaa va holat ── */}
          <div className={sectionCls}>
            <p className={sectionTitleCls}>Manba va holat</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Manba</label>
                <select {...register("source")} className={fieldCls}>
                  {Object.entries(LEAD_SOURCE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Holat</label>
                <select {...register("status")} className={fieldCls}>
                  <option value="NEW">Yangi</option>
                  <option value="CONTACTED">Bog&apos;landi</option>
                  <option value="INTERESTED">Qiziqdi</option>
                  <option value="TRIAL_BOOKED">Sinov bron</option>
                  <option value="TRIAL_COMPLETED">Sinov o&apos;tdi</option>
                  <option value="ENROLLED">Yozildi</option>
                  <option value="POSTPONED">Kechiktirildi</option>
                  <option value="LOST">Yo&apos;qotildi</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Sinov darsi sanasi</label>
                <DatePicker value={watch("trialDate") || ""} onChange={e => setValue("trialDate", e.target.value)} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Mas&apos;ul menejer</label>
                <select {...register("assignedToId")} className={fieldCls}>
                  <option value="">Tanlang...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Kurs va vaqt ── */}
          <div className={sectionCls}>
            <p className={sectionTitleCls}>Kurs va vaqt</p>

            {/* Kurs */}
            <div>
              <label className={labelCls}>Kurs</label>
              <div className="flex gap-2">
                <select {...register("courseId")} className={cn(fieldCls, "flex-1")}>
                  <option value="">Tanlanmagan</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCourse(s => !s)}
                  className="px-3 py-2 text-[13px] font-medium rounded-xl border border-[#5E2CA5]/30 text-[#5E2CA5] hover:bg-[#5E2CA5]/8 transition whitespace-nowrap"
                  style={{ backgroundColor: showNewCourse ? "#5E2CA508" : undefined }}
                >
                  + Yangi kurs
                </button>
              </div>
              {showNewCourse && (
                <div className="mt-2 flex gap-2">
                  <input
                    value={newCourseName}
                    onChange={e => setNewCourseName(e.target.value)}
                    placeholder="Kurs nomi (masalan: IT Foundation)"
                    className={cn(fieldCls, "flex-1")}
                  />
                  <button
                    type="button"
                    onClick={createCourse}
                    disabled={creatingCourse}
                    className="px-4 py-2 rounded-xl text-[13px] font-medium bg-[#5E2CA5] hover:bg-[#4a2280] text-white transition disabled:opacity-60"
                  >
                    {creatingCourse ? "..." : "Yaratish"}
                  </button>
                </div>
              )}
            </div>

            {/* Vaqt sloti */}
            {timeSlots.length > 0 && (
              <div>
                <label className={labelCls}>Dars vaqti (slot)</label>
                <select {...register("timeSlotId")} className={fieldCls}>
                  <option value="">Tanlanmagan</option>
                  {timeSlots.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            )}

            {/* Kunlar */}
            <div>
              <label className={labelCls}>Qaysi kunlari dars oladi</label>
              <div className="flex gap-2 flex-wrap">
                {WEEKDAYS.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={cn(
                      "px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors",
                      selectedDays.includes(d.value)
                        ? "bg-[#5E2CA5] text-white shadow-sm"
                        : "border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Soat oralig'i */}
            <div>
              <label className={labelCls}>Dars vaqti (soat)</label>
              <div className="flex items-center gap-3">
                <input
                  type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)}
                  className="px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)}
                  className="px-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition"
                />
                {(timeFrom || timeTo) && (
                  <span className="text-[13px] font-medium text-[#5E2CA5]">{timeFrom || "—"}–{timeTo || "—"}</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Izoh ── */}
          <div className={sectionCls}>
            <p className={sectionTitleCls}>Izoh</p>
            <textarea
              {...register("notes")} rows={4}
              placeholder="Mijoz haqida izoh, suhbat tafsilotlari..."
              className={fieldCls}
            />
            <p className="text-[11px] text-gray-400">Keyinchalik lid sahifasida har bir suhbatni alohida izoh qilib yozishingiz mumkin.</p>
          </div>

          {/* ── Birinchi eslatma ── */}
          <div className={sectionCls}>
            <p className={sectionTitleCls}>Birinchi eslatma (ixtiyoriy)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Eslatma vaqti</label>
                <input type="datetime-local" {...register("reminderAt")} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Eslatma sarlavhasi</label>
                <input {...register("reminderTitle")} placeholder="Qo'ng'iroq qilish" className={fieldCls} />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pb-6">
            <Link href={isStudentMode ? "/students" : "/leads"}>
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl text-[13px] font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors bg-white dark:bg-gray-900"
              >
                Bekor qilish
              </button>
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-[13px] font-semibold bg-[#5E2CA5] hover:bg-[#4a2280] text-white shadow-sm transition-colors disabled:opacity-60"
            >
              {saving ? "Saqlanmoqda..." : isStudentMode ? "Talaba qo'shish" : "Lid qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
