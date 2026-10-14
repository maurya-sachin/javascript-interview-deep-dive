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

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const MONTH = 30 * DAY
const YEAR = 365 * DAY

/** The wait until a date as a short label for a button: "10 min", "3 h", "6 days", "2 mo", "1 yr". Never under a minute. */
export function formatInterval(date: Date, now: Date): string {
  const wait = date.getTime() - now.getTime()
  // Round first, then pick the unit, so 59.6 minutes reads "1 h" rather than "60 min".
  const minutes = Math.max(Math.round(wait / MINUTE), 1)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(wait / HOUR)
  if (hours < 24) return `${hours} h`
  const days = Math.round(wait / DAY)
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'}`
  const months = Math.round(wait / MONTH)
  if (months < 12) return `${months} mo`
  return `${Math.round(wait / YEAR)} yr`
}
