import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { useLang } from "./LangContext";
import { COURSES } from "./translations";
export function Courses({ onSelect }) {
    const { lang, t } = useLang();
    const courses = COURSES[lang];
    return (<section id="courses" className="border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <Reveal className="max-w-2xl mx-auto text-center">
          <span className="landing-eyebrow">{t.coursesLabel}</span>
          <h2 className="landing-heading mt-3">{t.coursesTitle}</h2>
        </Reveal>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c, i) => (<Reveal key={c.name} delay={(i % 3) * 80}>
              <div className="landing-card group flex flex-col h-full p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-lg text-white uppercase tracking-tight">{c.name}</h3>
                  {c.duration && <span className="landing-badge flex-shrink-0 text-xs px-2.5 py-1">{c.duration}</span>}
                </div>
                <ul className="mt-4 space-y-2 flex-1">
                  {c.modules.map((m) => (<li key={m} className="text-sm text-ink-muted leading-relaxed pl-3 border-l border-violet-btn/50">
                      {m}
                    </li>))}
                </ul>
                <button type="button" onClick={() => onSelect(c.name)} className="mt-5 inline-flex items-center justify-center gap-1.5 text-sm font-bold text-violet-accent group-hover:gap-2.5 transition-all">
                  {lang === "uz" ? "Yozilish" : lang === "ru" ? "Записаться" : "Enroll"} <ArrowRight className="w-4 h-4"/>
                </button>
              </div>
            </Reveal>))}
        </div>
      </div>
    </section>);
}
