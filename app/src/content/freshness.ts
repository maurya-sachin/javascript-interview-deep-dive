// When facts were last checked, and when that counts as stale. Dates are `YYYY-MM` months.

/** Questions verified this many months ago or more are flagged for re-checking. */
export const STALE_AFTER_MONTHS = 12

function monthIndex(month: string): number {
  const [year, monthOfYear] = month.split('-').map(Number)
  return year * 12 + (monthOfYear - 1)
}

/** The build month as `YYYY-MM` (UTC). */
export function monthOf(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export function isStale(verified: string, today: Date): boolean {
  return monthIndex(monthOf(today)) - monthIndex(verified) >= STALE_AFTER_MONTHS
}

/** The oldest of some `YYYY-MM` months, or `null` for none (string order is month order). */
export function oldestMonth(months: string[]): string | null {
  return months.length === 0 ? null : months.reduce((oldest, month) => (month < oldest ? month : oldest))
}

/** "October 2026" for display. */
export function formatMonth(month: string): string {
  const [year, monthOfYear] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthOfYear - 1, 1)).toLocaleDateString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}
