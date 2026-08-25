import { createContext, useContext, useEffect, useState } from "react";
import { LANGS, T } from "./translations";
const STORAGE_KEY = "robocode_landing_lang";
const LangContext = createContext({
    lang: "uz",
    setLang: () => { },
});
export function LangProvider({ children }) {
    const [lang, setLangState] = useState("uz");
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && LANGS.includes(stored))
            setLangState(stored);
    }, []);
    const setLang = (l) => {
        setLangState(l);
        localStorage.setItem(STORAGE_KEY, l);
    };
    return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}
export function useLang() {
    const { lang, setLang } = useContext(LangContext);
    return { lang, setLang, t: T[lang] };
}
