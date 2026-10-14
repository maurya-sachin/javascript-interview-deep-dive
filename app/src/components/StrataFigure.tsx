import { contourRings, furthestPoint, ringAtLevel, ringPath } from '@/lib/contours'
import { depthStrokeClass } from '@/lib/depth'
import { cn } from '@/lib/utils'

const LEVELS = 8
/** Space, in percent of the figure, between an anchor dot and its label. */
const GAP = 2.5
// Each depth is labelled from a different corner so the labels never collide.
const LABELS = [
  { name: '30-second answer', detail: 'What you say first', angle: (-3 * Math.PI) / 4, side: 'left' },
  { name: 'Full answer', detail: 'Mechanism, with an example', angle: -Math.PI / 4, side: 'right' },
  { name: 'Follow-ups', detail: 'Edge cases they push on', angle: (3 * Math.PI) / 4, side: 'left' },
  { name: 'Spec and engine', detail: 'Why it works that way', angle: Math.PI / 4, side: 'right' },
] as const

/** A contour map with the four depths of every answer labelled on it. */
export function StrataFigure({ className }: { className?: string }) {
  const rings = contourRings({ seed: 'isobath', levels: LEVELS })
  const anchors = LABELS.flatMap((label, depth) => {
    const ring = ringAtLevel(rings, Math.round((depth * (LEVELS - 1)) / (LABELS.length - 1)))
    if (!ring) return []
    const [x, y] = furthestPoint(ring.points, label.angle)
    // Keep both text lines inside the frame; the leader line bends to meet the label if this moves it.
    return [{ ...label, x, y, labelY: Math.min(Math.max(y, 8), 92) }]
  })

  return (
    <figure className={cn('relative aspect-square w-full', className)}>
      <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 size-full">
        <g fill="none" strokeWidth="0.5" strokeLinejoin="round">
          {rings.map((ring, index) => (
            <path key={index} d={ringPath(ring.points)} className={cn(depthStrokeClass(ring.level, LEVELS), ring.level === LEVELS - 1 && 'fill-depth-4/20')} />
          ))}
        </g>
        {anchors.map(({ name, x, y, labelY, side }) => (
          <g key={name}>
            <polyline points={`${x},${y} ${side === 'left' ? x - GAP : x + GAP},${labelY}`} fill="none" strokeWidth="0.3" className="stroke-muted-foreground" />
            <circle cx={x} cy={y} r="0.8" className="fill-foreground" />
          </g>
        ))}
      </svg>
      <figcaption className="sr-only">The four depths of every answer: the 30-second answer, the full answer, follow-ups, and the spec and engine.</figcaption>
      {/* Each label sits beside its own anchor and is never wider than the space on that side, so it can't cover the dot. */}
      {anchors.map(({ name, detail, x, labelY, side }) => (
        <p
          key={name}
          aria-hidden="true"
          style={
            side === 'left'
              ? { top: `${labelY}%`, right: `${100 - x + GAP}%`, maxWidth: `${x - GAP}%` }
              : { top: `${labelY}%`, left: `${x + GAP}%`, maxWidth: `${100 - x - GAP}%` }
          }
          className={cn('absolute -translate-y-1/2 bg-background/90 px-1 leading-tight text-balance', side === 'left' ? 'text-right' : 'text-left')}
        >
          <span className="block font-serif text-sm font-medium sm:text-base">{name}</span>
          <span className="block text-xs text-muted-foreground">{detail}</span>
        </p>
      ))}
    </figure>
  )
}
