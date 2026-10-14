import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

/** The top line of a session: what is being studied, how far along, and a way out. Put the progress bar right after it. */
export function SessionHeader({ title, status }: { title: string; status?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4 text-sm text-muted-foreground">
      <p className="min-w-0 truncate">{title}</p>
      <p className="flex shrink-0 items-baseline gap-4">
        {status && <span aria-live="polite">{status}</span>}
        <Link to="/practice" className="hover:text-foreground">
          End session
        </Link>
      </p>
    </div>
  )
}

/** The surface a card, question or summary sits on. */
export function SessionCard({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mt-6 flex min-h-72 flex-col rounded-xl border bg-card p-6 sm:p-10', className)}>{children}</div>
}

interface Segment {
  count: number
  /** A `bg-depth-*` class. */
  className: string
}

/** Proportional bar of counts; `label` should spell the counts out, since the bar itself is an image to screen readers. */
export function SegmentBar({ segments, label }: { segments: Segment[]; label: string }) {
  const total = segments.reduce((sum, { count }) => sum + count, 0)
  return (
    <div role="img" aria-label={label} className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-muted">
      {segments.map(({ count, className }) => count > 0 && <div key={className} className={className} style={{ width: `${(count / total) * 100}%` }} />)}
    </div>
  )
}
