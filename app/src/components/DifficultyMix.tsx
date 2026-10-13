import type { Difficulty } from '@/content/types'
import { cn } from '@/lib/utils'

const SEGMENT_STYLE: Record<Difficulty, string> = {
  // Harder questions sit deeper: the same blue ramp as the depth gauge.
  easy: 'bg-depth-from',
  medium: 'bg-[color-mix(in_oklab,var(--depth-from),var(--depth-to))]',
  hard: 'bg-depth-to',
}

/** A segmented bar of how a set of questions splits across difficulty. */
export function DifficultyMix({ counts, className }: { counts: Record<Difficulty, number>; className?: string }) {
  const levels: Difficulty[] = ['easy', 'medium', 'hard']
  const label = levels.map((level) => `${counts[level]} ${level}`).join(', ')
  return (
    <span role="img" aria-label={label} title={label} className={cn('flex h-1.5 gap-0.5 overflow-hidden rounded-full', className)}>
      {levels.map(
        (level) => counts[level] > 0 && <span key={level} style={{ flexGrow: counts[level] }} className={SEGMENT_STYLE[level]} />,
      )}
    </span>
  )
}
