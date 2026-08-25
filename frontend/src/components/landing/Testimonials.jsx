import { useState } from "react";
import { Play, X } from "lucide-react";
import { Reveal } from "./Reveal";
import { useLang } from "./LangContext";
import { TESTIMONIALS } from "./translations";
import { getInitials } from "@/lib/utils";
export function Testimonials() {
    const { lang, t } = useLang();
    const testimonials = TESTIMONIALS[lang];
    const [activeVideo, setActiveVideo] = useState(null);
    return (<section id="testimonials" className="border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <Reveal className="max-w-2xl mx-auto text-center">
          <span className="landing-eyebrow">{t.testimonialsLabel}</span>
          <h2 className="landing-heading mt-3">{t.testimonialsTitle}</h2>
        </Reveal>

        {/* Mobile: horizontal swipe carousel (scroll-snap, no library). Desktop: 3-column grid. */}
        <div className="mt-12 flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
          {testimonials.map((item, i) => (<Reveal key={item.name} delay={(i % 3) * 80} className="shrink-0 w-[85%] snap-center sm:w-[60%] lg:w-auto">
              <div className="landing-card h-full p-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 flex-shrink-0">
                    {item.photo ? (
            <img src={item.photo} alt={item.name} className="w-14 h-14 rounded-2xl object-cover"/>) : (<div className="w-14 h-14 rounded-2xl bg-violet-btn/20 text-violet-accent font-bold flex items-center justify-center text-lg">
                        {getInitials(item.name)}
                      </div>)}
                    {item.videoUrl && (<button type="button" onClick={() => setActiveVideo(item.videoUrl)} aria-label="Play video" className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-accent flex items-center justify-center shadow-[0_0_10px_rgba(166,87,242,0.6)] hover:brightness-110 transition">
                        <Play className="w-3 h-3 text-white fill-white" strokeWidth={0}/>
                      </button>)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm truncate">{item.name}</h3>
                    <p className="text-xs text-violet-accent font-semibold mt-0.5 truncate">{item.workplace}</p>
                  </div>
                </div>

                <span className="landing-badge mt-4 px-2.5 py-1 text-[11px]">{item.course}</span>

                <p className="mt-3 text-sm text-ink-muted leading-relaxed line-clamp-3">{item.review}</p>
              </div>
            </Reveal>))}
        </div>
      </div>

      {activeVideo && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-modal-overlay" onClick={() => setActiveVideo(null)}>
          <div className="relative w-full max-w-2xl animate-modal-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setActiveVideo(null)} aria-label="Close" className="absolute -top-10 right-0 text-white/70 hover:text-white transition">
              <X className="w-6 h-6"/>
            </button>
            <video src={activeVideo} controls autoPlay className="w-full rounded-2xl bg-black"/>
          </div>
        </div>)}
    </section>);
}
