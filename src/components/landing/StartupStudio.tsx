"use client";

import { Lightbulb, Package, Code2, Rocket, Zap, TrendingUp, ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { useLang } from "./LangContext";
import { STUDIO_CARDS, TIMELINE } from "./translations";

const HIGHLIGHT_ICONS = [Zap, TrendingUp];
const STAGE_ICONS = [Lightbulb, Package, Code2, Rocket];

export function StartupStudio() {
  const { lang, t } = useLang();
  const highlights = STUDIO_CARDS[lang];
  const stages = TIMELINE[lang];

  return (
    <section id="startup-studio" className="relative border-b border-white/10 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-accent/10 blur-[120px]"
      />

      <div className="relative w-full px-4 sm:px-6 py-20 sm:py-28 max-w-7xl mx-auto">
        <Reveal className="max-w-2xl mx-auto text-center">
          <h2 className="landing-heading mt-3">Startup</h2>
        </Reveal>

        <Reveal delay={80}>
           <div className="mt-10 text-center">
             <p className="text-lg sm:text-xl text-white/70 font-medium">{t.studioLead}</p>
             <p className="mt-1 text-5xl sm:text-7xl font-extrabold tracking-tight text-violet-accent drop-shadow-[0_0_45px_rgba(166,87,242,0.55)]">
               $20 000
             </p>
           </div>
        </Reveal>

        <Reveal delay={140}>
          <div className="landing-card mt-14 p-6 sm:p-8 max-w-3xl mx-auto text-center">
            <p className="text-ink-muted leading-relaxed">{t.studioDesc}</p>
          </div>
        </Reveal>

        <div className="mt-6 grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {highlights.map((h, i) => {
            const Icon = HIGHLIGHT_ICONS[i];
            return (
              <Reveal key={h.title} delay={180 + i * 80}>
                 <div className="landing-card landing-card-center h-full p-6 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-violet-btn/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-violet-accent" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{h.title}</h4>
                    <p className="mt-1 text-sm text-ink-muted leading-relaxed">{h.desc}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={340}>
          <div className="landing-card mt-6 p-6 sm:p-8 max-w-3xl mx-auto text-center">
            <p className="text-ink-muted leading-relaxed">{t.studioHelp}</p>
          </div>
        </Reveal>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stages.map((title, i) => {
            const Icon = STAGE_ICONS[i];
            return (
              <Reveal key={title} delay={380 + i * 80}>
                <div className="relative">
                  <div className="landing-card landing-card-center h-full p-6 text-center">
                    <div className="w-11 h-11 rounded-xl bg-violet-btn/20 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-5 h-5 text-violet-accent" />
                    </div>
                     <span className="text-xs font-bold text-violet-accent">{i + 1}</span>
                     <h4 className="mt-1 font-bold text-white text-sm leading-snug">{title}</h4>
                  </div>
                  {i < stages.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute top-1/2 -right-5 -translate-y-1/2 w-4 h-4 text-violet-accent/40" />
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
