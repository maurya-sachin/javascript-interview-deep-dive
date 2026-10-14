import { contourRings, ringPath } from '@/lib/contours'
import { cn } from '@/lib/utils'

// Literal class names so Tailwind finds them; ring level 0 is shallow, the last level is deep.
const DEPTH_STROKE = ['stroke-depth-1', 'stroke-depth-2', 'stroke-depth-3', 'stroke-depth-4']
const MIN_LEVELS = 3
const MAX_LEVELS = 9

interface TopicCoverProps {
  slug: string
  chapterCount: number
  /** Share of the topic's questions rated hard, 0 to 1: harder topics get steeper, more crowded rings. */
  hardShare: number
  className?: string
}

/** A topic's cover: a contour map drawn from its slug, one level per chapter. Decorative. */
export function TopicCover({ slug, chapterCount, hardShare, className }: TopicCoverProps) {
  const levels = Math.min(Math.max(chapterCount, MIN_LEVELS), MAX_LEVELS)
  const rings = contourRings({ seed: slug, levels, steepness: hardShare })
  return (
    <svg viewBox="0 0 100 100" fill="none" strokeWidth="0.8" strokeLinejoin="round" aria-hidden="true" className={cn('overflow-hidden', className)}>
      {rings.map((ring, index) => (
        <path
          key={index}
          d={ringPath(ring.points)}
          className={cn(DEPTH_STROKE[Math.floor((ring.level * DEPTH_STROKE.length) / levels)], ring.level === levels - 1 && 'fill-depth-4/20')}
        />
      ))}
    </svg>
  )
}
