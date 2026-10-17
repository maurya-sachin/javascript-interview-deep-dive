import { Link } from 'react-router'
import { cn } from '@/lib/utils'

export type StationState = 'done' | 'written' | 'in-progress' | 'planned'

export interface Station {
  key: string
  label: string
  to: string
  state: StationState
  /** Where the reader is up to; drawn with an outer ring. */
  current?: boolean
  detail?: string
}

type Orientation = 'responsive' | 'vertical' | 'compact'

const STATE_TEXT: Record<StationState, string> = {
  done: 'finished',
  written: 'published',
  'in-progress': 'in progress',
  planned: 'planned',
}

const MARK_FILL: Record<StationState, string> = {
  done: 'bg-depth-4',
  written: 'bg-link',
  // The left half is filled; the base colour hides the line behind the unfilled half.
  'in-progress': 'border-2 border-depth-3 bg-background bg-[linear-gradient(90deg,var(--color-depth-3)_50%,transparent_50%)]',
  planned: 'border-2 border-muted-foreground/70 bg-background',
}

/** One station's dot; also the legend swatch on the roadmap. */
export function StationMark({ state, current = false, small = false, className }: { state: StationState; current?: boolean; small?: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('box-border inline-flex shrink-0 items-center justify-center rounded-full', small ? 'size-2.5' : 'size-3.5', MARK_FILL[state], current && 'ring-2 ring-link ring-offset-2 ring-offset-background', className)}>
      {state === 'done' && <CheckIcon />}
    </span>
  )
}

/** Finished steps differ from published ones by shape, so colour alone never carries the state. */
function CheckIcon() {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true" className="size-2/3 text-white" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5.25 4.25 7.5 8 2.75" />
    </svg>
  )
}

/** A connector is solid when both stations have content, dashed when either is still planned. */
const isSolid = (from: Station, to: Station) => from.state !== 'planned' && to.state !== 'planned'

const LINE_SOLID = 'bg-depth-3'
const LINE_DASHED_X = 'border-dashed border-muted-foreground/70'

const FOCUS = 'rounded-sm outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

/** Stations joined by a line, like a transit map. */
export function RouteLine({ stations, orientation }: { stations: Station[]; orientation: Orientation }) {
  if (orientation === 'compact') return <CompactRoute stations={stations} />

  const vertical = orientation === 'vertical'
  return (
    <ol className={cn(!vertical && 'md:flex')}>
      {stations.map((station, index) => {
        const previous = stations[index - 1]
        const next = stations[index + 1]
        return (
          <li key={station.key} className={cn('relative pb-6 pl-8 last:pb-0', !vertical && 'md:min-w-0 md:flex-1 md:pb-0 md:pl-0')}>
            {next && <span aria-hidden="true" className={cn('absolute top-[calc(0.25rem+7px)] bottom-[calc(-0.25rem-7px)] left-[6px] w-0.5', isSolid(station, next) ? LINE_SOLID : `w-0 border-l-2 ${LINE_DASHED_X}`, !vertical && 'md:hidden')} />}
            {!vertical && previous && <HalfLine solid={isSolid(previous, station)} side="left" />}
            {!vertical && next && <HalfLine solid={isSolid(station, next)} side="right" />}
            <Link to={station.to} aria-current={station.current ? 'step' : undefined} className={cn('block', FOCUS, !vertical && 'md:flex md:flex-col md:items-center md:gap-2 md:px-1 md:text-center')}>
              <StationMark state={station.state} current={station.current} className={cn('absolute top-1 left-0 z-10', !vertical && 'md:relative md:top-auto md:left-auto')} />
              <span className={cn('block text-balance', vertical ? 'text-base font-semibold' : 'text-sm font-medium md:text-xs', station.state === 'planned' && 'text-muted-foreground')}>
                {station.label}
                {!station.detail && <span className="sr-only">, {STATE_TEXT[station.state]}</span>}
              </span>
              {station.detail && <span className={cn('block text-sm text-muted-foreground', !vertical && 'md:text-xs')}>{station.detail}</span>}
            </Link>
          </li>
        )
      })}
    </ol>
  )
}

/** The horizontal connector on one side of a mark: each station draws its half, so labels can sit between them. */
function HalfLine({ solid, side }: { solid: boolean; side: 'left' | 'right' }) {
  return <span aria-hidden="true" className={cn('absolute top-[6px] hidden w-1/2 md:block', side === 'left' ? 'left-0' : 'right-0', solid ? `h-0.5 ${LINE_SOLID}` : `h-0 border-t-2 ${LINE_DASHED_X}`)} />
}

function CompactRoute({ stations }: { stations: Station[] }) {
  const ready = stations.filter((station) => station.state !== 'planned').length
  return (
    <div role="img" aria-label={`${ready} of ${stations.length} steps ready`} className="flex items-center">
      {stations.map((station, index) => {
        const next = stations[index + 1]
        return (
          <span key={station.key} className={cn('flex items-center', next && 'min-w-0 flex-1')}>
            <StationMark state={station.state} current={station.current} small />
            {next && <span aria-hidden="true" className={cn('min-w-0.5 flex-1', isSolid(station, next) ? `h-0.5 ${LINE_SOLID}` : `h-0 border-t-2 ${LINE_DASHED_X}`)} />}
          </span>
        )
      })}
    </div>
  )
}
