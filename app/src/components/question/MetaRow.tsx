import type { Difficulty } from '@/content/types'
import { cn } from '@/lib/utils'

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  easy: 'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-300',
  medium: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300',
  hard: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300',
}

const FREQUENCY_LABEL = ['', 'rarely', 'sometimes', 'often', 'very often', 'almost always']

interface MetaRowProps {
  difficulty: Difficulty
  frequency: number
  verified: string
}

export function MetaRow({ difficulty, frequency, verified }: MetaRowProps) {
  return (
    <ul aria-label="Question details" className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
      <li>
        <DifficultyBadge difficulty={difficulty} />
      </li>
      <li className="flex items-center gap-1.5">
        Asked
        <FrequencyDots frequency={frequency} />
        {FREQUENCY_LABEL[frequency]}
      </li>
      <li>Verified {verified}</li>
    </ul>
  )
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <span className={cn('rounded-full px-2 py-0.5 font-medium capitalize', DIFFICULTY_STYLE[difficulty])}>{difficulty}</span>
}

export function FrequencyDots({ frequency }: { frequency: number }) {
  return (
    <span role="img" aria-label={`Asked ${FREQUENCY_LABEL[frequency]} (${frequency} of 5)`} className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((dot) => (
        <span key={dot} className={cn('size-2 rounded-xs', dot <= frequency ? 'bg-foreground' : 'bg-border')} />
      ))}
    </span>
  )
}
