import { contourRings, furthestPoint, ringAtLevel, ringPath } from '@/lib/contours'
import { depthStrokeClass } from '@/lib/depth'
import { cn } from '@/lib/utils'

/** Picked by eye from the generator's output: a clear trench, a steep wall and a second pool. */
const SEED = 'isobath-4'
const LEVELS = 8
/** Rings per depth band: `depthStrokeClass` gives each pair of the eight levels one of the four depth colours. */
const RINGS_PER_DEPTH = 2
// Each marker points a different way from the centre, so the four never collide.
const DEPTHS = [
  { name: '30-second answer', detail: 'What you say first', angle: (-3 * Math.PI) / 4 },
  { name: 'Full answer', detail: 'Mechanism, with an example', angle: -Math.PI / 4 },
  { name: 'Follow-ups', detail: 'Edge cases they push on', angle: (3 * Math.PI) / 4 },
  { name: 'Spec and engine', detail: 'Why it works that way', angle: Math.PI / 4 },
] as const

const DEPTH_TEXT = ['text-depth-1', 'text-depth-2', 'text-depth-3', 'text-depth-4'] as const

/** The marker for one depth, shared by the map and its key. */
function DepthNumber({ depth }: { depth: number }) {
  return (
    <span aria-hidden="true" className={cn('grid size-6 shrink-0 place-items-center rounded-full border border-current font-mono text-xs', DEPTH_TEXT[depth])}>
      {depth + 1}
    </span>
  )
}

/** A contour map keyed to the four depths of every answer, like the soundings on a chart. */
export function StrataFigure({ className }: { className?: string }) {
  const rings = contourRings({ seed: SEED, levels: LEVELS })
  const markers = DEPTHS.flatMap((depth, index) => {
    const ring = ringAtLevel(rings, index * RINGS_PER_DEPTH)
    return ring ? [{ index, point: furthestPoint(ring.points, depth.angle) }] : []
  })

  return (
    <figure className={className}>
      <div className="relative aspect-square w-full">
        <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 size-full">
          <g fill="none" strokeLinejoin="round">
            {rings.map((ring, index) => (
              <path
                key={index}
                d={ringPath(ring.points)}
                strokeWidth={0.35 + (0.4 * ring.level) / (LEVELS - 1)}
                className={cn(depthStrokeClass(ring.level, LEVELS), ring.level === LEVELS - 1 && 'fill-depth-4/20')}
              />
            ))}
          </g>
        </svg>
        {markers.map(({ index, point: [x, y] }) => (
          <span key={index} style={{ left: `${x}%`, top: `${y}%` }} className="absolute -translate-1/2 rounded-full bg-background">
            <DepthNumber depth={index} />
          </span>
        ))}
      </div>
      <figcaption className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
        {DEPTHS.map(({ name, detail }, index) => (
          <p key={name} className="flex gap-3">
            <DepthNumber depth={index} />
            <span className="leading-tight">
              <span className="block font-serif text-base font-medium">{name}</span>
              <span className="block text-sm text-muted-foreground">{detail}</span>
            </span>
          </p>
        ))}
      </figcaption>
    </figure>
  )
}
