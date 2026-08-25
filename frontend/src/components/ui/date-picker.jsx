import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, isToday as isTodayFn, format, parse, isValid, } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
const WEEKDAYS_UZ = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
const MONTHS_UZ = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];
const POPUP_WIDTH = 280;
function usePopupPosition(open, triggerRef, popupRef) {
    const [pos, setPos] = useState({ top: 0, left: 0 });
    // useLayoutEffect (not useEffect) so the position is corrected before the
    // browser paints — otherwise the popup flashes at (0,0) for one frame.
    useLayoutEffect(() => {
        if (!open)
            return;
        const update = () => {
            const el = triggerRef.current;
            if (!el)
                return;
            const r = el.getBoundingClientRect();
            const popupHeight = popupRef.current?.offsetHeight ?? 320;
            const spaceBelow = window.innerHeight - r.bottom;
            const flipAbove = spaceBelow < popupHeight + 12 && r.top > popupHeight + 12;
            setPos({
                top: flipAbove ? Math.max(8, r.top - popupHeight - 8) : r.bottom + 8,
                left: Math.min(Math.max(r.left, 12), window.innerWidth - POPUP_WIDTH - 12),
            });
        };
        update();
        window.addEventListener("scroll", update, true);
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update, true);
            window.removeEventListener("resize", update);
        };
    }, [open, triggerRef, popupRef]);
    return pos;
}
function useCloseOnOutside(open, refs, onClose) {
    useEffect(() => {
        if (!open)
            return;
        const handleClick = (e) => {
            if (refs.some((r) => r.current?.contains(e.target)))
                return;
            onClose();
        };
        const handleKey = (e) => {
            if (e.key === "Escape")
                onClose();
        };
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleKey);
        };
    }, [open, refs, onClose]);
}
const triggerCls = "inline-flex items-center justify-between gap-2 px-3 py-2 text-[13px] border rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition border-gray-200 dark:border-white/10";
const popupCls = "bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 p-3";
const navBtnCls = "p-1.5 rounded-lg hover:bg-[#5E2CA5]/10 text-gray-500 dark:text-gray-400 hover:text-[#5E2CA5] transition-colors";
const footerBtnCls = "flex-1 py-1.5 rounded-lg text-[12px] font-medium text-[#5E2CA5] hover:bg-[#5E2CA5]/10 transition-colors";
function PopupFooter({ onToday, onClear }) {
    return (<div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-white/10">
      <button type="button" onClick={onToday} className={footerBtnCls}>
        Bugun
      </button>
      <button type="button" onClick={onClear} className={footerBtnCls}>
        Tozalash
      </button>
    </div>);
}
export function DatePicker({ value, onChange, className, placeholder = "Sana tanlang", disabled, id }) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef(null);
    const popupRef = useRef(null);
    const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
    const selectedValid = selected && isValid(selected) ? selected : undefined;
    const [viewDate, setViewDate] = useState(selectedValid ?? new Date());
    useEffect(() => {
        if (open)
            setViewDate(selectedValid ?? new Date());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);
    const pos = usePopupPosition(open, triggerRef, popupRef);
    useCloseOnOutside(open, [triggerRef, popupRef], () => setOpen(false));
    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [viewDate]);
    function select(d) {
        onChange({ target: { value: format(d, "yyyy-MM-dd") } });
        setOpen(false);
    }
    return (<>
      <button type="button" id={id} ref={triggerRef} disabled={disabled} onClick={() => setOpen((o) => !o)} className={cn(triggerCls, disabled && "opacity-60 cursor-not-allowed", className)}>
        <span className={cn(!selectedValid && "text-gray-400")}>
          {selectedValid ? format(selectedValid, "dd.MM.yyyy") : placeholder}
        </span>
        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0"/>
      </button>

      {open &&
            typeof document !== "undefined" &&
            createPortal(<div ref={popupRef} style={{ position: "fixed", top: pos.top, left: pos.left, width: POPUP_WIDTH, zIndex: 9999 }} className={popupCls}>
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={() => setViewDate((v) => subMonths(v, 1))} className={navBtnCls}>
                <ChevronLeft className="w-4 h-4"/>
              </button>
              <span className="text-[13px] font-semibold text-gray-900 dark:text-white capitalize">
                {MONTHS_UZ[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button type="button" onClick={() => setViewDate((v) => addMonths(v, 1))} className={navBtnCls}>
                <ChevronRight className="w-4 h-4"/>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS_UZ.map((w) => (<div key={w} className="text-center text-[11px] font-medium text-gray-400 dark:text-gray-500 py-1">
                  {w}
                </div>))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((d) => {
                    const isSel = selectedValid && isSameDay(d, selectedValid);
                    const inMonth = isSameMonth(d, viewDate);
                    const isTod = isTodayFn(d);
                    return (<button type="button" key={d.toISOString()} onClick={() => select(d)} className={cn("h-8 w-8 text-[12px] rounded-lg transition-colors flex items-center justify-center", isSel
                            ? "bg-[#5E2CA5] text-white font-semibold"
                            : inMonth
                                ? "text-gray-700 dark:text-gray-200 hover:bg-[#5E2CA5]/10 hover:text-[#5E2CA5] dark:hover:text-white"
                                : "text-gray-300 dark:text-gray-600 hover:bg-[#5E2CA5]/10", !isSel && isTod && "ring-1 ring-[#5E2CA5]/50 font-semibold")}>
                    {d.getDate()}
                  </button>);
                })}
            </div>

            <PopupFooter onToday={() => select(new Date())} onClear={() => {
                    onChange({ target: { value: "" } });
                    setOpen(false);
                }}/>
          </div>, document.body)}
    </>);
}
export function MonthPicker({ value, onChange, className, placeholder = "Oy tanlang", disabled, id }) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef(null);
    const popupRef = useRef(null);
    const selected = value ? parse(value, "yyyy-MM", new Date()) : undefined;
    const selectedValid = selected && isValid(selected) ? selected : undefined;
    const [viewYear, setViewYear] = useState(selectedValid?.getFullYear() ?? new Date().getFullYear());
    useEffect(() => {
        if (open)
            setViewYear(selectedValid?.getFullYear() ?? new Date().getFullYear());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);
    const pos = usePopupPosition(open, triggerRef, popupRef);
    useCloseOnOutside(open, [triggerRef, popupRef], () => setOpen(false));
    function select(monthIdx) {
        onChange({ target: { value: `${viewYear}-${String(monthIdx + 1).padStart(2, "0")}` } });
        setOpen(false);
    }
    return (<>
      <button type="button" id={id} ref={triggerRef} disabled={disabled} onClick={() => setOpen((o) => !o)} className={cn(triggerCls, disabled && "opacity-60 cursor-not-allowed", className)}>
        <span className={cn(!selectedValid && "text-gray-400", "capitalize")}>
          {selectedValid ? `${MONTHS_UZ[selectedValid.getMonth()]} ${selectedValid.getFullYear()}` : placeholder}
        </span>
        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0"/>
      </button>

      {open &&
            typeof document !== "undefined" &&
            createPortal(<div ref={popupRef} style={{ position: "fixed", top: pos.top, left: pos.left, width: POPUP_WIDTH, zIndex: 9999 }} className={popupCls}>
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={() => setViewYear((y) => y - 1)} className={navBtnCls}>
                <ChevronLeft className="w-4 h-4"/>
              </button>
              <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{viewYear}</span>
              <button type="button" onClick={() => setViewYear((y) => y + 1)} className={navBtnCls}>
                <ChevronRight className="w-4 h-4"/>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {MONTHS_UZ.map((m, i) => {
                    const isSel = selectedValid && selectedValid.getFullYear() === viewYear && selectedValid.getMonth() === i;
                    return (<button type="button" key={m} onClick={() => select(i)} className={cn("py-2 rounded-lg text-[12px] transition-colors", isSel
                            ? "bg-[#5E2CA5] text-white font-semibold"
                            : "text-gray-700 dark:text-gray-200 hover:bg-[#5E2CA5]/10 hover:text-[#5E2CA5] dark:hover:text-white")}>
                    {m.slice(0, 3)}
                  </button>);
                })}
            </div>

            <PopupFooter onToday={() => {
                    const now = new Date();
                    onChange({ target: { value: format(now, "yyyy-MM") } });
                    setOpen(false);
                }} onClear={() => {
                    onChange({ target: { value: "" } });
                    setOpen(false);
                }}/>
          </div>, document.body)}
    </>);
}
