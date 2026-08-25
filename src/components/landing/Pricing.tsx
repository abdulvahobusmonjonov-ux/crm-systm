"use client";

import { Check } from "lucide-react";
import { Reveal } from "./Reveal";
import { useLang } from "./LangContext";
import { COURSES, PRICES } from "./translations";

export function Pricing({ onSelect }: { onSelect?: (courseName?: string) => void }) {
  const { lang, t } = useLang();
  const courses = COURSES[lang];
  const prices = PRICES[lang];

  return (
    <section id="pricing" className="border-b border-white/10">
      <div className="w-full px-4 sm:px-6 py-20 sm:py-28 max-w-7xl mx-auto">
        <Reveal className="max-w-2xl mx-auto text-center">
          <h2 className="landing-heading mt-3">{t.pricingTitle}</h2>
        </Reveal>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {courses.map((c, i) => (
            <Reveal key={c.name} delay={(i % 4) * 60}>
               <div className="landing-card landing-card-center group flex flex-col h-full p-5">
                  <h3 className="font-bold text-base text-white uppercase tracking-tight leading-tight">{c.name}</h3>

                  <p className="mt-3 text-xl font-extrabold text-white">{prices.monthly[i]}</p>

                 <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-white/40">{t.pricingIncludedTitle}</p>
                 <ul className="mt-1.5 space-y-1.5 flex-1">
                   {prices.included.map((item) => (
                     <li key={item} className="flex items-start gap-1.5 text-xs text-ink-muted leading-snug">
                       <Check className="w-3.5 h-3.5 text-violet-accent flex-shrink-0 mt-0.5" />
                       {item}
                     </li>
                   ))}
                 </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
