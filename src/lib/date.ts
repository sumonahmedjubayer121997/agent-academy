/**
 * Canonical local-date helpers. All day arithmetic is CALENDAR-based
 * (Date setters), never millisecond stepping, so daylight-saving
 * transitions cannot shift a day by ±1h and corrupt streaks/due dates.
 */

export function dayStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + n)
  return out
}

/** Whole calendar days from a to b (positive when b is later). DST-immune. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const au = Date.UTC(ay, am - 1, ad)
  const bu = Date.UTC(by, bm - 1, bd)
  return Math.round((bu - au) / 86_400_000)
}
