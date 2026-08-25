import { LANGS } from "./translations";
import { useLang } from "./LangContext";
export function LanguageSwitcher({ className }) {
    const { lang, setLang } = useLang();
    return (<div className={`flex gap-0.5 bg-violet-accent/10 border border-violet-accent/30 rounded-lg p-0.5 ${className || ""}`}>
      {LANGS.map((code) => (<button key={code} type="button" onClick={() => setLang(code)} className={`px-2.5 py-1.5 text-xs font-bold rounded-md transition-colors ${code === lang ? "bg-violet-btn text-white" : "text-ink-muted hover:text-white"}`}>
          {code.toUpperCase()}
        </button>))}
    </div>);
}
