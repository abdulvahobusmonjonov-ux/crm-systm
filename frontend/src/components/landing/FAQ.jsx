import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Reveal } from "./Reveal";
import { useLang } from "./LangContext";
import { FAQ_ITEMS } from "./translations";
export function FAQ() {
    const { lang, t } = useLang();
    const items = FAQ_ITEMS[lang];
    const [openIndex, setOpenIndex] = useState(0);
    return (<section id="faq" className="border-b border-white/10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <Reveal className="text-center">
          <span className="landing-eyebrow">{t.faqLabel}</span>
          <h2 className="landing-heading mt-3">{t.faqTitle}</h2>
        </Reveal>

        <div className="mt-12 space-y-3">
          {items.map((item, i) => {
            const open = openIndex === i;
            return (<Reveal key={item.q} delay={i * 60}>
                <div className="landing-card overflow-hidden">
                  <button type="button" onClick={() => setOpenIndex(open ? null : i)} aria-expanded={open} className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 sm:px-6 sm:py-5">
                    <span className="font-semibold text-white">{item.q}</span>
                    <ChevronDown className={`w-5 h-5 flex-shrink-0 text-violet-accent transition-transform duration-300 ${open ? "rotate-180" : ""}`}/>
                  </button>
                  <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 sm:px-6 sm:pb-5 text-sm text-ink-muted leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>);
        })}
        </div>
      </div>
    </section>);
}
