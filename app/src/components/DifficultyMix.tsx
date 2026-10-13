import type { Difficulty } from '@/content/types'
import { cn } from '@/lib/utils'

const SEGMENT_STYLE: Record<Difficulty, string> = {
  easy: 'bg-green-500 dark:bg-green-600',
  medium: 'bg-amber-500 dark:bg-amber-600',
  hard: 'bg-red-500 dark:bg-red-600',
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
