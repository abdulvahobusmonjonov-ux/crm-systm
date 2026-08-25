"use client";

import { InstagramGlyph } from "./InstagramGlyph";
import { TelegramGlyph } from "./TelegramGlyph";
import { useLang } from "./LangContext";
import { NAV_ITEMS } from "./translations";

export function Footer({ centerName, logo }: { centerName: string; logo: string }) {
  const { lang, t } = useLang();
  const navLinks = NAV_ITEMS[lang];

  return (
    <footer className="relative border-t border-white/10">
      <div className="w-full px-4 sm:px-6 py-16 flex flex-col lg:flex-row lg:justify-between lg:items-start gap-8 max-w-7xl mx-auto">
        <div className="lg:max-w-sm">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo || "/api/branding/logo"} alt={centerName} className="w-9 h-9 rounded-lg object-contain bg-white" />
            <span className="font-bold text-white">{centerName}</span>
          </div>
          <p className="mt-4 text-sm text-ink-muted leading-relaxed">
            Andijondagi birinchi IT akademiya — dasturlash va robototexnika bo&apos;yicha amaliy ta&apos;lim.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-white text-sm uppercase tracking-wide mb-4">IJTIMOIY TARMOQLAR</h3>
          <div className="flex gap-6">
            <a href="https://instagram.com/robocode.uz" target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-violet-accent transition-colors group">
              <InstagramGlyph className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </a>
            <a href="https://t.me/robocode_andijan" target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-violet-accent transition-colors group">
              <TelegramGlyph className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-white text-sm uppercase tracking-wide mb-4">HAVOLALAR</h3>
          <ul className="space-y-2 text-sm">
            {navLinks
              .filter((l) => l.href !== "#contact")
              .map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-ink-muted hover:text-violet-accent transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            <li>
              <a href="/login" className="text-ink-muted hover:text-violet-accent transition-colors">
                {t.footerLoginLink}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="w-full px-4 sm:px-6 py-6 text-xs text-white/40 text-center">
          © 2018 Robocode IT Academy. {t.footerRights}
        </p>
      </div>
    </footer>
  );
}
