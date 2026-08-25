// Tashkent is UTC+5 and the app has no per-user timezone — the Next.js finance
// routes each re-declared these same helpers inline; they're shared here instead.
export const TZ = 5 * 3600 * 1000;

// month "YYYY-MM" -> [start, end) in UTC accounting for Tashkent (+5)
export function monthRange(month) {
  const [y, m] = month.split("-").map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1) - TZ), end: new Date(Date.UTC(y, m, 1) - TZ) };
}

export function currentMonth() {
  const t = new Date(Date.now() + TZ);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthKey(d) {
  const t = new Date(d.getTime() + TZ);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
}
