import { Handshake, TrendingUp, Gift, Target } from "lucide-react";
import { Reveal } from "./Reveal";
import { useLang } from "./LangContext";
import { FEATURES } from "./translations";
const ICONS = { handshake: Handshake, chart: TrendingUp, gift: Gift, target: Target };
export function WhatAwaits() {
    const { lang, t } = useLang();
    const items = FEATURES[lang];
    return (<section id="about" className="border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <Reveal className="max-w-2xl">
          <span className="landing-eyebrow">{t.aboutLabel}</span>
          <h2 className="landing-heading mt-3">{t.featuresTitle}</h2>
        </Reveal>

        <div className="mt-12 grid sm:grid-cols-2 gap-5">
          {items.map((item, i) => {
            const Icon = ICONS[item.icon];
            return (<Reveal key={item.text} delay={i * 80}>
                <div className="landing-card h-full p-7">
                  <div className="w-11 h-11 rounded-xl bg-violet-btn/20 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-violet-accent"/>
                  </div>
                  <p className="text-sm text-white/90 leading-relaxed">{item.text}</p>
                </div>
              </Reveal>);
        })}
        </div>
      </div>
    </section>);
}
