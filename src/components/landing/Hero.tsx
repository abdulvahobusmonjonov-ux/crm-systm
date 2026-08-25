"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, PlayCircle } from "lucide-react";
import { useLang } from "./LangContext";

export function Hero() {
  const { t } = useLang();
  const parallaxRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = parallaxRef.current;
    const img = imageRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.style.willChange = "transform, opacity";
    if (img) img.style.willChange = "transform";
    let ticking = false;
    const update = () => {
      ticking = false;
      const progress = Math.min(1, window.scrollY / (window.innerHeight * 0.9));
      el.style.transform = `translate3d(0, -${progress * 30}px, 0)`;
      el.style.opacity = `${1 - progress * 0.5}`;
      if (img) {
        img.style.transform = `translate3d(0, -${progress * 20}px, 0)`;
      }
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

  return (
    <section id="top" className="relative overflow-hidden">
      {/* Soft radial violet glow, layered on top of the page's fixed gradient backdrop. */}
      <div
        aria-hidden="true"
        className="absolute -z-10 top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full blur-[140px] opacity-50"
        style={{ background: "radial-gradient(circle, rgba(166,87,242,0.35) 0%, rgba(94,44,165,0.15) 45%, transparent 75%)" }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{ background: "radial-gradient(45% 35% at 80% 15%, rgba(166,87,242,0.18) 0%, transparent 70%)" }}
      />
      <div aria-hidden="true" className="landing-grain absolute inset-0 -z-10" />

      <div
        ref={imageRef}
        className="hidden lg:block absolute right-10 xl:right-20 top-1/2 -translate-y-1/2 pointer-events-none select-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Gemini_Generated_Image_da2fb5da2fb5da2f.png"
          alt=""
          aria-hidden="true"
          className="w-[420px] h-auto drop-shadow-[0_0_70px_rgba(166,87,242,0.2)]"
        />
      </div>

      <div ref={parallaxRef} className="w-full px-4 sm:px-6 pt-16 pb-24 sm:pt-24 sm:pb-32 max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <h1
            className="font-black uppercase tracking-tight text-white leading-[1.05]"
            style={{ fontSize: "clamp(2.5rem, 4.5vw + 1.2rem, 4.75rem)" }}
          >
            {t.heroPrefix}
            <span className="text-violet-accent">{t.heroHighlight}</span>
            {t.heroSuffix}
          </h1>
           <p className="mt-6 text-lg sm:text-xl text-ink-muted max-w-xl leading-relaxed">{t.heroSub}</p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <a href="#courses" className="btn-secondary px-6 py-3.5">
              <PlayCircle className="w-4 h-4 text-violet-accent" />
              {t.heroBtn2}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
