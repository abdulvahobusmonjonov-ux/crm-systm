"use client";

import { useState, useEffect } from "react";
import { User, Phone, BookOpen, Clock, MessageSquare, Users, Check } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { isPhoneComplete } from "@/lib/utils";

export default function ApplyPage() {
  const [cfg, setCfg] = useState<{ courses: { id: string; name: string }[]; name: string; logo: string }>({ courses: [], name: "Robocode CRM", logo: "" });
  const [form, setForm] = useState({ fullName: "", phone: "", courseId: "", preferredDays: "", lessonTime: "", note: "", referrerName: "", referrerPhone: "", website: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/public/lead").then((r) => r.json()).then(setCfg).catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.fullName.trim().length < 2) { setError("Ism familiyangizni kiriting"); return; }
    if (!isPhoneComplete(form.phone)) { setError("To'liq telefon raqam kiriting"); return; }
    if (form.referrerPhone && !isPhoneComplete(form.referrerPhone)) { setError("Tavsiya qilgan kishining telefon raqamini to'liq kiriting"); return; }
    setLoading(true);
    const res = await fetch("/api/public/lead", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) setDone(true);
    else { const d = await res.json().catch(() => ({})); setError(d.error || "Xatolik. Qayta urinib ko'ring."); }
  };

  const inp = "w-full px-4 py-3 text-base border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E2CA5] focus:border-transparent transition";
  const label = "flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#5E2CA5]/5 via-white to-[#5E2CA5]/10 flex items-center justify-center p-4 sm:p-6"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cfg.logo || "/api/branding/logo"} alt={cfg.name} className="inline-block w-16 h-16 rounded-2xl mb-3 shadow-lg object-contain bg-white" />
          <h1 className="text-2xl font-bold text-gray-900">{cfg.name}</h1>
          <p className="text-gray-500 mt-1 text-sm">Kursga yozilish uchun ariza qoldiring</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          {done ? (
            <div className="text-center py-6 sm:py-8">
              <div className="w-16 h-16 rounded-2xl bg-[#5E2CA5]/10 flex items-center justify-center mx-auto mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-600" strokeWidth={3} />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Rahmat!</h2>
              <p className="text-gray-500 mt-2 text-sm leading-relaxed">Arizangiz qabul qilindi.<br />Tez orada siz bilan bog&apos;lanamiz.</p>
              <button
                onClick={() => { setDone(false); setForm({ fullName: "", phone: "", courseId: "", preferredDays: "", lessonTime: "", note: "", referrerName: "", referrerPhone: "", website: "" }); }}
                className="mt-6 text-[#5E2CA5] text-sm font-semibold hover:underline"
              >
                Yana ariza qoldirish
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <input type="text" tabIndex={-1} autoComplete="off" value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                className="hidden" aria-hidden="true" />

              <div>
                <label className={label}><User className="w-3.5 h-3.5 text-gray-400" /> Ism familiya *</label>
                <input className={inp} value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="Aziza Karimova" />
              </div>
              <div>
                <label className={label}><Phone className="w-3.5 h-3.5 text-gray-400" /> Telefon raqam *</label>
                <PhoneInput value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} size="lg" />
              </div>
              {cfg.courses.length > 0 && (
                <div>
                  <label className={label}><BookOpen className="w-3.5 h-3.5 text-gray-400" /> Qaysi kurs?</label>
                  <select className={inp} value={form.courseId} onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}>
                    <option value="">Tanlang (ixtiyoriy)</option>
                    {cfg.courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div className="pt-1 border-t border-gray-100 space-y-4">
                <div>
                  <label className={label}><Clock className="w-3.5 h-3.5 text-gray-400" /> Qulay vaqt <span className="text-gray-400 font-normal">(ixtiyoriy)</span></label>
                  <input className={inp} value={form.lessonTime} onChange={(e) => setForm((f) => ({ ...f, lessonTime: e.target.value }))} placeholder="masalan: ertalab / 18:00 dan keyin" />
                </div>
                <div>
                  <label className={label}><MessageSquare className="w-3.5 h-3.5 text-gray-400" /> Izoh <span className="text-gray-400 font-normal">(ixtiyoriy)</span></label>
                  <textarea className={inp} rows={3} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Qo'shimcha ma'lumot..." />
                </div>
                <div>
                  <label className={label}><Users className="w-3.5 h-3.5 text-gray-400" /> Sizni kim tavsiya qildi? <span className="text-gray-400 font-normal">(ixtiyoriy)</span></label>
                  <div className="space-y-2">
                    <input className={inp} value={form.referrerName} onChange={(e) => setForm((f) => ({ ...f, referrerName: e.target.value }))} placeholder="Tavsiya qilgan kishi ismi" />
                    <PhoneInput value={form.referrerPhone} onChange={(e) => setForm((f) => ({ ...f, referrerPhone: e.target.value }))} size="lg" />
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-[#5E2CA5] hover:bg-[#4e2488] disabled:opacity-60 text-white font-semibold rounded-xl shadow-sm transition-colors">
                {loading ? "Yuborilmoqda..." : "Ariza yuborish"}
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">© {new Date().getFullYear()} {cfg.name}</p>
      </div>
    </div>
  );
}
