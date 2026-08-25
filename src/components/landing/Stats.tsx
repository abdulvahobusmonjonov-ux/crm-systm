"use client";

import { Reveal } from "./Reveal";
import { useLang } from "./LangContext";
import { STATS } from "./translations";

export function Stats() {
  const { lang } = useLang();
  const stats = STATS[lang];

  return (
    <section className="relative border-b border-white/10">
      <div className="w-full px-4 sm:px-6 py-16 sm:py-20 grid sm:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 100}>
            <div className="landing-card h-full p-8 text-center">
               <div className="text-4xl sm:text-5xl font-extrabold text-violet-accent tracking-tight">{s.value}</div>
               <div className="mt-3 text-sm text-ink-muted leading-relaxed max-w-[220px] mx-auto">{s.label}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
