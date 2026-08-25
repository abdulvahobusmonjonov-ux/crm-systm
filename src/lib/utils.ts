import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// True once the user has entered the full 9-digit Uzbek national number
// (stored/submitted as "+998" followed by those 9 digits, no separators).
export function isPhoneComplete(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("998");
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("998")) {
    return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  }
  return phone;
}

export function phoneToTel(phone: string): string {
  return `tel:${phone.replace(/\D/g, "").startsWith("998") ? "+" : ""}${phone.replace(/\D/g, "")}`;
}

export function phoneToTelegram(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://t.me/+${digits}`;
}

export function phoneToWhatsapp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

export function formatCurrency(amount: number | string, currency = "UZS"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("uz-UZ", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(num);
}

// Deterministic Uzbek month names. Do NOT swap these for
// toLocaleDateString("uz-UZ", ...) — Node's SSR ICU data and the browser's
// render that differently, which throws a hydration mismatch and wipes the
// <html class="dark"> the theme toggle sets.
export const UZ_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
] as const;

// "2026-07" → "iyul 2026"
export function formatMonthUz(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return month;
  return `${UZ_MONTHS[m - 1]} ${y}`;
}

// Date → "02 iyul 2026"
export function formatDateUz(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")} ${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd.MM.yyyy");
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd.MM.yyyy HH:mm");
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return `Bugun ${format(d, "HH:mm")}`;
  if (isTomorrow(d)) return `Ertaga ${format(d, "HH:mm")}`;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isOverdue(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return isPast(d);
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-")
    .trim();
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
