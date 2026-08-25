import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useLang } from "./LangContext";
export function StickyCTA() {
    const { t } = useLang();
    const [pastHero, setPastHero] = useState(false);
    const [formVisible, setFormVisible] = useState(false);
    useEffect(() => {
        const hero = document.getElementById("top");
        const form = document.getElementById("ariza");
        if (!hero || !form)
            return;
        const heroObserver = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting), { threshold: 0 });
        const formObserver = new IntersectionObserver(([entry]) => setFormVisible(entry.isIntersecting), { threshold: 0.15 });
        heroObserver.observe(hero);
        formObserver.observe(form);
        return () => {
            heroObserver.disconnect();
            formObserver.disconnect();
        };
    }, []);
    const show = pastHero && !formVisible;
    return (<div className={`md:hidden fixed inset-x-0 bottom-0 z-40 px-4 pb-4 transition-all duration-300 ${show ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"}`}>
      <a href="#ariza" className="btn-primary w-full py-3.5 shadow-[0_8px_30px_rgba(124,58,237,0.5)]">
        {t.navCta}
        <ArrowRight className="w-4 h-4"/>
      </a>
    </div>);
}
