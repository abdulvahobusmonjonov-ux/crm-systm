import { Reveal } from "./Reveal";
import { InstagramGlyph } from "./InstagramGlyph";
import { useLang } from "./LangContext";
import { MENTORS } from "./translations";
function initials(name) {
    return name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}
export function Team() {
    const { lang, t } = useLang();
    const mentors = MENTORS[lang];
    return (<section id="team" className="border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <Reveal className="max-w-2xl mx-auto text-center">
          <span className="landing-eyebrow">{t.teamLabel}</span>
          <h2 className="landing-heading mt-3">{t.teamTitle}</h2>
        </Reveal>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((t2, i) => (<Reveal key={t2.name} delay={(i % 3) * 80}>
              <div className="landing-card h-full p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-violet-btn/20 text-violet-accent font-bold flex items-center justify-center text-lg">
                    {initials(t2.name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm truncate">{t2.name}</h3>
                    <p className="text-xs text-violet-accent font-semibold mt-0.5">{t2.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-ink-muted leading-relaxed">{t2.bio}</p>
                {t2.instagram && (<a href={`https://instagram.com/${t2.instagram}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-violet-accent transition-colors">
                    <InstagramGlyph className="w-3.5 h-3.5"/>@{t2.instagram}
                  </a>)}
              </div>
            </Reveal>))}
        </div>
      </div>
    </section>);
}
