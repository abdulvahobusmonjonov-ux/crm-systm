import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useLang } from "./LangContext";
import { NAV_ITEMS } from "./translations";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LOGO_URL } from "@/lib/api";
export function Header({ centerName, logo }) {
    const { lang, t } = useLang();
    const navLinks = NAV_ITEMS[lang];
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    const handleNavClick = () => setMenuOpen(false);
    return (<header className={`sticky top-0 z-50 transition-colors ${scrolled ? "bg-[#08060F]/85 backdrop-blur-md border-b border-white/10" : "bg-transparent border-b border-transparent"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5 min-w-0">
          <img src={logo || LOGO_URL} alt={centerName} className="w-9 h-9 rounded-lg object-contain bg-white shadow-sm flex-shrink-0"/>
          <span className="font-bold text-white truncate tracking-tight">{centerName}</span>
        </a>

        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((l) => (<a key={l.href} href={l.href} className="text-sm font-medium text-ink-muted hover:text-violet-accent transition-colors">
              {l.label}
            </a>))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <a href="#ariza" className="btn-primary text-sm px-4 py-2.5">
            {t.navCta}
          </a>
        </div>

        <button type="button" onClick={() => setMenuOpen((v) => !v)} className="md:hidden p-2 -mr-2 text-white" aria-label={menuOpen ? "Menyuni yopish" : "Menyuni ochish"}>
          {menuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
        </button>
      </div>

      {menuOpen && (<div className="md:hidden border-t border-white/10 bg-[#08060F] px-4 pb-4 pt-2">
          <nav className="flex flex-col">
            {navLinks.map((l) => (<a key={l.href} href={l.href} onClick={handleNavClick} className="py-2.5 text-sm font-medium text-white/80 border-b border-white/5 last:border-0">
                {l.label}
              </a>))}
          </nav>
          <div className="flex items-center justify-between gap-3 mt-3">
            <LanguageSwitcher />
          </div>
          <a href="#ariza" onClick={handleNavClick} className="btn-primary mt-3 w-full text-sm py-2.5">
            {t.navCta}
          </a>
        </div>)}
    </header>);
}
