import { useEffect, useRef } from "react";
import { ArrowRight, PlayCircle } from "lucide-react";
import { useLang } from "./LangContext";
export function Hero() {
    const { t } = useLang();
    const parallaxRef = useRef(null);
    // Lightweight scroll fade/parallax: only transform + opacity, rAF-throttled,
    // and capped to the hero's own height so it never fights scroll elsewhere.
    useEffect(() => {
        const el = parallaxRef.current;
        if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;
        let ticking = false;
        const update = () => {
            ticking = false;
            const progress = Math.min(1, window.scrollY / (window.innerHeight * 0.9));
            el.style.transform = `translateY(${progress * 40}px)`;
            el.style.opacity = `${1 - progress * 0.6}`;
        };
        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        };
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    return (<section id="top" className="relative overflow-hidden">
      {/* Soft radial violet glow, layered on top of the page's fixed gradient backdrop. */}
      <div aria-hidden="true" className="absolute -z-10 top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full blur-[140px] opacity-50" style={{ background: "radial-gradient(circle, rgba(166,87,242,0.35) 0%, rgba(94,44,165,0.15) 45%, transparent 75%)" }}/>
      <div className="absolute inset-0 -z-10 opacity-40" style={{ background: "radial-gradient(45% 35% at 80% 15%, rgba(166,87,242,0.18) 0%, transparent 70%)" }}/>
      <div aria-hidden="true" className="landing-grain absolute inset-0 -z-10"/>

      <img src="/mascot-white.png" alt="" aria-hidden="true" className="hidden lg:block pointer-events-none select-none absolute right-10 xl:right-20 top-1/2 -translate-y-1/2 w-[420px] h-auto drop-shadow-[0_0_70px_rgba(166,87,242,0.2)]"/>

      <div ref={parallaxRef} className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="max-w-3xl">
          <h1 className="font-black uppercase tracking-tight text-white leading-[1.05]" style={{ fontSize: "clamp(2.5rem, 4.5vw + 1.2rem, 4.75rem)" }}>
            {t.heroPrefix}
            <span className="text-violet-accent">{t.heroHighlight}</span>
            {t.heroSuffix}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-ink-muted max-w-xl leading-relaxed">{t.heroSub}</p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <a href="#ariza" className="btn-primary px-6 py-3.5">
              {t.heroBtn1}
              <ArrowRight className="w-4 h-4"/>
            </a>
            <a href="#courses" className="btn-secondary px-6 py-3.5">
              <PlayCircle className="w-4 h-4 text-violet-accent"/>
              {t.heroBtn2}
            </a>
          </div>
        </div>
      </div>
    </section>);
}
