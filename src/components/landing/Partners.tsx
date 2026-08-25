"use client";

import { useMemo } from "react";
import logoNight from "@/images/logo-night-DKXnHpwu.svg";
import imgPng from "@/images/images.png";
import imgJpg from "@/images/images.jpg";
import imgJpg1 from "@/images/images (1).jpg";
import imgA from "@/images/1764959007492.jpg";
import imgB from "@/images/1745308974161.jpg";
import { Reveal } from "./Reveal";
import { useLang } from "./LangContext";
import { PARTNERS } from "./translations";

const PARTNER_IMAGES = [logoNight, imgPng, imgJpg, imgJpg1, imgA, imgB];

export function Partners() {
  const { lang, t } = useLang();
  const partners = PARTNERS[lang];
  const items = useMemo(
    () => partners.map((p, i) => ({ name: p.name, img: PARTNER_IMAGES[i % PARTNER_IMAGES.length] })),
    [partners]
  );

  return (
    <section id="partners" className="border-b border-white/10 overflow-hidden">
      <div className="w-full px-4 sm:px-6 py-20 sm:py-28 max-w-7xl mx-auto">
        <Reveal className="max-w-2xl mx-auto text-center">
          <h2 className="landing-heading mt-3">{t.partnersTitle}</h2>
        </Reveal>

        <div className="mt-12 overflow-hidden">
          <div className="partners-scroll">
            {[...items, ...items].map((partner, i) => (
              <div key={`${partner.name}-${i}`} className="shrink-0">
                <div className="landing-card landing-card-center w-[140px] h-[100px] sm:w-[180px] sm:h-[120px] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={partner.img.src}
                    alt={partner.name}
                    title={partner.name}
                    className="w-3/4 h-3/4 object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}