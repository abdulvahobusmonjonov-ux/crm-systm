"use client";

import { Reveal } from "./Reveal";
import { useLang } from "./LangContext";
import { COURSES } from "./translations";

export function Courses({ onSelect }: { onSelect?: (courseName?: string) => void }) {
  const { lang, t } = useLang();
  const courses = COURSES[lang];

  return (
    <section id="courses" className="border-b border-white/10">
      <div className="w-full px-4 sm:px-6 py-20 sm:py-28 max-w-7xl mx-auto">
        <Reveal className="max-w-2xl mx-auto text-center">
          <h2 className="landing-heading mt-3">{t.coursesTitle}</h2>
        </Reveal>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {courses.map((c, i) => (
            <Reveal key={c.name} delay={(i % 4) * 60}>
               <div className="landing-card landing-card-center group flex flex-col h-full p-5">
                <div className="flex items-start justify-between gap-2">
                   <h3 className="font-bold text-base text-white uppercase tracking-tight leading-tight">{c.name}</h3>
                   {c.duration && <span className="landing-badge flex-shrink-0 text-[11px] px-2 py-0.5">{c.duration}</span>}
                </div>
                <ul className="mt-3 space-y-1.5 flex-1">
                   {c.modules.map((m) => (
                     <li key={m} className="text-xs text-ink-muted leading-snug pl-2.5 border-l border-violet-btn/50">
                       {m}
                     </li>
                   ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 text-center">
          <p className="text-lg sm:text-2xl font-bold text-white">{t.coursesPriceNote}</p>
        </Reveal>
      </div>
    </section>
  );
}
