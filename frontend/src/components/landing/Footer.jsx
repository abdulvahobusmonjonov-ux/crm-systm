import { InstagramGlyph } from "./InstagramGlyph";
import { TelegramGlyph } from "./TelegramGlyph";
import { useLang } from "./LangContext";
import { NAV_ITEMS } from "./translations";
import { LOGO_URL } from "@/lib/api";
export function Footer({ centerName, logo }) {
    const { lang, t } = useLang();
    const navLinks = NAV_ITEMS[lang];
    return (<footer className="relative border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2.5">
            <img src={logo || LOGO_URL} alt={centerName} className="w-9 h-9 rounded-lg object-contain bg-white"/>
            <span className="font-bold text-white">{centerName}</span>
          </div>
          <p className="mt-4 text-sm text-ink-muted leading-relaxed max-w-xs">{t.footerDesc}</p>
        </div>

        <div>
          <h3 className="font-semibold text-white text-sm uppercase tracking-wide">{t.footerContact}</h3>
          <ul className="mt-4 space-y-3 text-sm text-ink-muted">
            <li>
              {t.footerAddressLabel}:{" "}
              <a href="https://www.google.com/maps/place/Robocode+IT+Academy/@40.7579868,72.3388853,14.13z/data=!4m6!3m5!1s0x38bced7b6cf5df29:0xace59ec7e44d0e57!8m2!3d40.7468701!4d72.3453432!16s%2Fg%2F11k3wqpkn9" target="_blank" rel="noopener noreferrer" className="hover:text-violet-accent transition-colors">
                Robocode IT Academy
              </a>
            </li>
            <li>
              {t.footerPhoneLabel}:
              <br />
              <a href="tel:+998998999005" className="hover:text-violet-accent transition-colors">
                +998 99 899 9005
              </a>
              <br />
              <a href="tel:+998930759005" className="hover:text-violet-accent transition-colors">
                +998 93 075 9005
              </a>
            </li>
            <li>
              {t.footerHoursLabel}: 9:00 – 18:00
              <br />
              {t.footerHoursDaily}
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white text-sm uppercase tracking-wide">{t.footerSocial}</h3>
          <div className="mt-4 flex items-start gap-8 text-sm">
            <div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-white/50 uppercase tracking-wide">
                <InstagramGlyph className="w-3.5 h-3.5 flex-shrink-0"/> Instagram
              </span>
              <ul className="mt-2 space-y-2">
                <li>
                  <a href="https://instagram.com/aka.yakubov" target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-violet-accent transition-colors">
                    @aka.yakubov
                  </a>
                </li>
                <li>
                  <a href="https://robocode.uz" target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-violet-accent transition-colors">
                    @robocode.uz
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-white/50 uppercase tracking-wide">
                <TelegramGlyph className="w-3.5 h-3.5 flex-shrink-0"/> Telegram
              </span>
              <ul className="mt-2 space-y-2">
                <li>
                  <a href="https://t.me/robocodee" target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-violet-accent transition-colors">
                    @robocodee
                  </a>
                </li>
                <li>
                  <a href="https://t.me/robocodeadmin" target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-violet-accent transition-colors">
                    @robocodeadmin
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-white text-sm uppercase tracking-wide">{t.footerLinks}</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {navLinks
            .filter((l) => l.href !== "#contact")
            .map((l) => (<li key={l.href}>
                  <a href={l.href} className="text-ink-muted hover:text-violet-accent transition-colors">
                    {l.label}
                  </a>
                </li>))}
            <li>
              <a href="/login" className="text-ink-muted hover:text-violet-accent transition-colors">
                {t.footerLoginLink}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-xs text-white/40 text-center">
          © 2018 Robocode IT Academy. {t.footerRights}
        </p>
      </div>
    </footer>);
}
