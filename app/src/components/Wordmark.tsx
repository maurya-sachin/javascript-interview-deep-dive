import { SITE_NAME } from '@/lib/site'
import { cn } from '@/lib/utils'

/**
 * The isobath wordmark, with a contour ring as its "o". Screen readers get the plain word.
 * Draft lettering: a designer redraws the final; at large sizes the ring can carry more contour lines.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-serif font-semibold tracking-tight', className)}>
      <span className="sr-only">{SITE_NAME}</span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        is
        {/* Sized to the lowercase x-height and nudged onto the baseline, like a real "o" with overshoot. */}
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" className="mx-[0.015em] size-[0.6em] translate-y-[0.06em] self-baseline text-link">
          <path d="M4 16.5c0-7 5.5-12.3 12.2-12.3S28 9.2 28 16s-5.2 12-11.9 12S4 23.5 4 16.5Z" strokeWidth="5.2" />
          <circle cx="16.2" cy="16.4" r="3" fill="currentColor" stroke="none" />
        </svg>
        bath
      </span>
    </span>
  )
}
