import { useCallback, useEffect, useState } from "react";
const THEME_EVENT = "themechange";
function isDark() {
    return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}
export function useDarkMode() {
    const [dark, setDark] = useState(false);
    useEffect(() => {
        setDark(isDark());
        const onChange = () => setDark(isDark());
        window.addEventListener(THEME_EVENT, onChange);
        return () => window.removeEventListener(THEME_EVENT, onChange);
    }, []);
    const toggleDark = useCallback(() => {
        const next = !isDark();
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("theme", next ? "dark" : "light");
        window.dispatchEvent(new Event(THEME_EVENT));
    }, []);
    return { dark, toggleDark };
}
