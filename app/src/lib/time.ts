// Human-readable time until a date, for "next card due" messages.

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
]
const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** "in 3 hours", "tomorrow"; "now" for anything under a minute away or already past. */
export function formatUntil(date: Date, now: Date): string {
  const remaining = date.getTime() - now.getTime()
  for (const [unit, size] of UNITS) {
    if (remaining >= size) return format.format(Math.round(remaining / size), unit)
  }
  return 'now'
}
