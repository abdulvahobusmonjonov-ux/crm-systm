"use client";

import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const COUNTRY_CODE = "+998";

// Stored/displayed as "+998 93 071 35 55" — this strips everything down to
// the 9 national digits, tolerating a redundant "998"/"+" the user may have
// typed or pasted (e.g. from a full international number).
function toNationalDigits(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length > 9 && d.startsWith("998")) d = d.slice(3);
  return d.slice(0, 9);
}

// Uzbek mobile grouping: 2-3-2-2 (e.g. "93 071 35 55").
function formatNational(d: string): string {
  const parts: string[] = [];
  if (d.length > 0) parts.push(d.slice(0, 2));
  if (d.length > 2) parts.push(d.slice(2, 5));
  if (d.length > 5) parts.push(d.slice(5, 7));
  if (d.length > 7) parts.push(d.slice(7, 9));
  return parts.join(" ");
}

function digitsBeforeIndex(str: string, index: number): number {
  return str.slice(0, index).replace(/\D/g, "").length;
}

function charIndexForDigitCount(formatted: string, count: number): number {
  if (count <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      seen++;
      if (seen === count) return i + 1;
    }
  }
  return formatted.length;
}

export interface PhoneInputProps {
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  onBlur?: () => void;
  id?: string;
  name?: string;
  label?: string;
  error?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  /** "sm" (default) matches the dense dashboard forms; "lg" matches the bigger public apply form. */
  size?: "sm" | "lg";
  /** Extra classes for the editable input itself (e.g. text/placeholder color on a dark card) — `className` only reaches the outer wrapper. */
  inputClassName?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  { value, onChange, onBlur, id, name, label, error, placeholder = "94 071 35 55", className, inputClassName, disabled, required, autoFocus, size = "sm" },
  forwardedRef
) {
  const [digits, setDigits] = useState(() => toNationalDigits(value || ""));
  const lastEmitted = useRef(value || "");
  const caretDigitTarget = useRef<number | null>(null);
  const innerRef = useRef<HTMLInputElement | null>(null);

  // Resync when the external value changes for a reason other than our own
  // onChange (e.g. loading a different record, or a form reset).
  useEffect(() => {
    const external = value || "";
    if (external !== lastEmitted.current) {
      setDigits(toNationalDigits(external));
      lastEmitted.current = external;
    }
  }, [value]);

  // Restore caret position after a formatting re-render so it lands after
  // the same digit the user was just at, instead of jumping to the end.
  useLayoutEffect(() => {
    if (caretDigitTarget.current === null) return;
    const el = innerRef.current;
    if (el) {
      const pos = charIndexForDigitCount(formatNational(digits), caretDigitTarget.current);
      el.setSelectionRange(pos, pos);
    }
    caretDigitTarget.current = null;
  }, [digits]);

  const emit = (nextDigits: string) => {
    const full = nextDigits.length ? `${COUNTRY_CODE}${nextDigits}` : "";
    lastEmitted.current = full;
    onChange({ target: { value: full } });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const caret = e.target.selectionStart ?? rawValue.length;
    const prevFormatted = formatNational(digits);
    const isDeletion = rawValue.length < prevFormatted.length;

    let extracted = rawValue.replace(/\D/g, "");
    if (extracted.length > 9 && extracted.startsWith("998")) extracted = extracted.slice(3);
    extracted = extracted.slice(0, 9);

    let digitsBeforeCaret = digitsBeforeIndex(rawValue, caret);

    // Backspacing right after a separator space deletes only the space
    // itself (digit count is unchanged) — remove the digit before it too,
    // so backspace always removes a digit rather than requiring two presses.
    if (isDeletion && extracted.length === digits.length && digits.length > 0) {
      const idx = Math.max(0, digitsBeforeCaret - 1);
      extracted = extracted.slice(0, idx) + extracted.slice(idx + 1);
      digitsBeforeCaret = idx;
    }

    caretDigitTarget.current = Math.min(digitsBeforeCaret, extracted.length);
    setDigits(extracted);
    emit(extracted);
  };

  const handleBeforeInput = (e: React.FormEvent<HTMLInputElement>) => {
    const data = (e.nativeEvent as InputEvent).data;
    if (!data || data.length !== 1) return; // let paste/autofill through — onChange normalizes it
    if (/\D/.test(data)) {
      e.preventDefault();
      return;
    }
    const el = e.currentTarget;
    if (el.selectionStart === el.selectionEnd && digits.length >= 9) {
      e.preventDefault();
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className={cn("block text-sm font-medium mb-1.5", size === "lg" ? "text-gray-700" : "text-gray-700 dark:text-gray-300")}>
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex items-center border rounded-xl transition",
          size === "lg"
            ? "bg-white border-gray-300 focus-within:ring-2 focus-within:ring-[#5E2CA5] focus-within:border-transparent"
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-white/10 focus-within:ring-2 focus-within:ring-[#5E2CA5]/30 focus-within:border-[#5E2CA5]/50",
          error && (size === "lg" ? "border-red-400" : "border-red-400 dark:border-red-600"),
          disabled && "opacity-60",
          className
        )}
      >
        <span
          className={cn(
            "select-none mr-2 flex-shrink-0",
            size === "lg"
              ? "pl-4 pr-2.5 py-3 text-base text-gray-400 border-r border-gray-300"
              : "pl-3 pr-2 py-2 text-[13px] text-gray-400 dark:text-gray-500 border-r border-gray-200 dark:border-white/10"
          )}
        >
          {COUNTRY_CODE}
        </span>
        <input
          ref={(el) => {
            innerRef.current = el;
            if (typeof forwardedRef === "function") forwardedRef(el);
            else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
          }}
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={formatNational(digits)}
          onChange={handleChange}
          onBeforeInput={handleBeforeInput}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          className={cn(
            "flex-1 min-w-0 bg-transparent placeholder-gray-400 outline-none",
            size === "lg" ? "py-3 pr-4 text-base text-gray-900" : "py-2 pr-3 text-[13px] text-gray-900 dark:text-white",
            inputClassName
          )}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
});
