"use client";

import { useEffect, useState } from "react";
import { User, Phone, BookOpen, MessageSquare, Check } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { isPhoneComplete } from "@/lib/utils";
import { COURSES } from "./translations";
import { useLang } from "./LangContext";
import { Reveal } from "./Reveal";

const EMPTY_FORM = { fullName: "", phone: "", courseName: "", note: "", website: "" };

export function LeadForm({ selectedCourse }: { selectedCourse?: string }) {
  const { lang, t } = useLang();
  const courses = COURSES[lang];
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedCourse) setForm((f) => ({ ...f, courseName: selectedCourse }));
  }, [selectedCourse]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.fullName.trim().length < 2) {
      setError(t.formErrName);
      return;
    }
    if (!isPhoneComplete(form.phone)) {
      setError(t.formErrPhone);
      return;
    }
    setLoading(true);
    // The landing page's courses are marketing copy, not CRM Course records
    // (no matching courseId), so the choice is folded into the note instead.
    const note = [form.courseName ? `Kurs: ${form.courseName}` : null, form.note.trim() || null].filter(Boolean).join("\n");
    const res = await fetch("/api/public/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: form.fullName, phone: form.phone, note, website: form.website }),
    });
    setLoading(false);
    if (res.ok) setDone(true);
    else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t.formErrGeneric);
    }
  };

  const inp =
    "w-full px-4 py-3 text-base border border-white/10 rounded-xl bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-accent focus:border-transparent transition";
  const label = "flex items-center gap-1.5 text-sm font-medium text-white/70 mb-1.5";

  return (
    <section id="ariza" className="border-b border-white/10">
      <div className="w-full px-4 sm:px-6 py-20 sm:py-28 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <h2 className="landing-heading mt-3">{t.formTitle}</h2>
            <p className="mt-4 text-ink-muted leading-relaxed max-w-md">{t.formSub}</p>
          </Reveal>

          <Reveal delay={100}>
            <div className="landing-card p-6 sm:p-8">
              {done ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="w-16 h-16 rounded-2xl bg-violet-accent/10 flex items-center justify-center mx-auto mb-4">
                    <div className="w-10 h-10 rounded-full bg-violet-accent/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-violet-accent" strokeWidth={3} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white">{t.formSuccessTitle}</h3>
                  <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                    {t.formSuccess}
                    <br />
                    {t.formSuccessSub}
                  </p>
                  <button
                    onClick={() => {
                      setDone(false);
                      setForm(EMPTY_FORM);
                    }}
                    className="mt-6 text-violet-accent text-sm font-semibold hover:underline"
                  >
                    {t.formAgain}
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                    className="hidden"
                    aria-hidden="true"
                  />

                  <div>
                    <label className={label}>
                      <User className="w-3.5 h-3.5 text-violet-accent" /> {t.formName} *
                    </label>
                    <input
                      className={inp}
                      value={form.fullName}
                      onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                      placeholder={t.formNamePlaceholder}
                    />
                  </div>
                  <div>
                    <label className={label}>
                      <Phone className="w-3.5 h-3.5 text-violet-accent" /> {t.formPhone} *
                    </label>
                    <PhoneInput
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      size="lg"
                      className="!bg-white/5 !border-white/10"
                      inputClassName="!text-white placeholder:!text-white/30"
                    />
                  </div>
                  <div>
                    <label className={label}>
                      <BookOpen className="w-3.5 h-3.5 text-violet-accent" /> {t.formCourse}
                    </label>
                    <select className={inp} value={form.courseName} onChange={(e) => setForm((f) => ({ ...f, courseName: e.target.value }))}>
                      <option className="bg-[#08060F]" value="">
                        {t.formCourseOptional}
                      </option>
                      {courses.map((c) => (
                        <option className="bg-[#08060F]" key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={label}>
                      <MessageSquare className="w-3.5 h-3.5 text-violet-accent" /> {t.formComment}{" "}
                      <span className="text-white/40 font-normal">{t.formCommentOptional}</span>
                    </label>
                    <textarea
                      className={inp}
                      rows={3}
                      value={form.note}
                      onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                      placeholder={t.formCommentPlaceholder}
                    />
                  </div>

                  {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}

                  <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                    {loading ? t.formSubmitting : t.formSubmit}
                  </button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
