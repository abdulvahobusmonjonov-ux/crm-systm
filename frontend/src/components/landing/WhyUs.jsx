import { Hammer, GraduationCap, Cpu, Users2, Award, Briefcase } from "lucide-react";
import { Reveal } from "./Reveal";
import { useLang } from "./LangContext";
import { WHY_US } from "./translations";
const ICONS = { hammer: Hammer, gradCap: GraduationCap, cpu: Cpu, users: Users2, award: Award, briefcase: Briefcase };
export function WhyUs() {
    const { lang, t } = useLang();
    const items = WHY_US[lang];
    return (<section id="why-us" className="border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <Reveal className="max-w-2xl mx-auto text-center">
          <span className="landing-eyebrow">{t.whyUsLabel}</span>
          <h2 className="landing-heading mt-3">{t.whyUsTitle}</h2>
        </Reveal>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => {
            const Icon = ICONS[item.icon];
            return (<Reveal key={item.title} delay={i * 80}>
                <div className="landing-card h-full p-7">
                  <div className="w-11 h-11 rounded-xl bg-violet-btn/20 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-violet-accent"/>
                  </div>
                  <h3 className="font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-ink-muted leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>);
        })}
        </div>
      </div>
    </section>);
}
