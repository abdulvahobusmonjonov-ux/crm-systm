import { useEffect, useRef } from "react";
export function Reveal({ children, className, delay = 0, }) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                el.classList.add("is-visible");
                observer.disconnect();
            }
        }, { threshold: 0.15 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return (<div ref={ref} data-reveal className={className} style={{ animationDelay: delay ? `${delay}ms` : undefined }}>
      {children}
    </div>);
}
