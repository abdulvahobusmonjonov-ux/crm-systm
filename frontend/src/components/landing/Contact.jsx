import { MapPin, Phone, Clock } from "lucide-react";
import { Reveal } from "./Reveal";
import { InstagramGlyph } from "./InstagramGlyph";
import { TelegramGlyph } from "./TelegramGlyph";
import { useLang } from "./LangContext";
// Coordinates match the pinned "Robocode IT Academy" location already linked from the footer's Google Maps URL.
const MAP_LAT = 40.7468701;
const MAP_LNG = 72.3453432;
export function Contact() {
    const { t } = useLang();
    return (<section id="contact" className="border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <Reveal className="max-w-2xl mx-auto text-center">
          <span className="landing-eyebrow">{t.contactLabel}</span>
          <h2 className="landing-heading mt-3">{t.contactTitle}</h2>
        </Reveal>

        <div className="mt-12 grid lg:grid-cols-2 gap-6 items-stretch">
          <Reveal>
            <div className="landing-card h-full min-h-[320px] overflow-hidden">
              <iframe title={t.contactMapTitle} src={`https://www.google.com/maps?q=${MAP_LAT},${MAP_LNG}&z=15&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="w-full h-full min-h-[320px] grayscale-[30%] invert-[92%] contrast-[90%]"/>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="landing-card h-full p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-violet-btn/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-violet-accent"/>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{t.footerAddressLabel}</h3>
                  <a href={`https://www.google.com/maps?q=${MAP_LAT},${MAP_LNG}`} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm text-ink-muted hover:text-violet-accent transition-colors">
                    Robocode IT Academy, Andijon
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-violet-btn/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-violet-accent"/>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{t.footerPhoneLabel}</h3>
                  <a href="tel:+998998999005" className="mt-1 block text-sm text-ink-muted hover:text-violet-accent transition-colors">
                    +998 99 899 9005
                  </a>
                  <a href="tel:+998930759005" className="block text-sm text-ink-muted hover:text-violet-accent transition-colors">
                    +998 93 075 9005
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-violet-btn/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-violet-accent"/>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{t.footerHoursLabel}</h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    9:00 – 18:00 <span className="text-white/40">· {t.footerHoursDaily}</span>
                  </p>
                </div>
              </div>

              <div className="mt-auto flex flex-wrap gap-3 pt-2">
                <a href="https://t.me/robocodee" target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm px-4 py-2.5">
                  <TelegramGlyph className="w-4 h-4 text-violet-accent"/> Telegram
                </a>
                <a href="https://instagram.com/aka.yakubov" target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm px-4 py-2.5">
                  <InstagramGlyph className="w-4 h-4 text-violet-accent"/> Instagram
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>);
}
