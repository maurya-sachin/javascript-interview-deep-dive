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

const LEGEND_LABEL: Record<StationState, string> = {
  done: 'Finished',
  written: 'Published',
  'in-progress': 'In progress',
  planned: 'Planned',
}

/** Explains the marks for the states a page uses. */
export function StationLegend({ states, className }: { states: readonly StationState[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground', className)} aria-label="Legend">
      {states.map((state) => (
        <li key={state} className="flex items-center gap-2">
          <StationMark state={state} />
          {LEGEND_LABEL[state]}
        </li>
      ))}
    </ul>
  )
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
const LINE_DASHED = 'border-dashed border-muted-foreground/70'

const FOCUS = 'rounded-sm outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

/** Stations joined by a vertical line, like a transit map. */
export function RouteLine({ stations }: { stations: Station[] }) {
  return (
    <ol>
      {stations.map((station, index) => {
        const next = stations[index + 1]
        return (
          <li key={station.key} className="relative pb-6 pl-8 last:pb-0">
            {next && <span aria-hidden="true" className={cn('absolute top-[calc(0.25rem+7px)] bottom-[calc(-0.25rem-7px)] left-[6px] w-0.5', isSolid(station, next) ? LINE_SOLID : `w-0 border-l-2 ${LINE_DASHED}`)} />}
            <Link to={station.to} aria-current={station.current ? 'step' : undefined} className={cn('block', FOCUS)}>
              <StationMark state={station.state} current={station.current} className="absolute top-1 left-0 z-10" />
              <span className={cn('block text-base font-semibold text-balance', station.state === 'planned' && 'text-muted-foreground')}>
                {station.label}
                {!station.detail && <span className="sr-only">, {STATE_TEXT[station.state]}</span>}
              </span>
              {station.detail && <span className="block text-sm text-muted-foreground">{station.detail}</span>}
            </Link>
          </li>
        )
      })}
    </ol>
  )
}

/** The stations as small marks on one line, for rows whose text already says what they mean. */
export function RouteSummary({ stations }: { stations: Station[] }) {
  return (
    <div aria-hidden="true" className="flex items-center">
      {stations.map((station, index) => {
        const next = stations[index + 1]
        return (
          <span key={station.key} className={cn('flex items-center', next && 'min-w-0 flex-1')}>
            <StationMark state={station.state} small />
            {next && <span className={cn('min-w-0.5 flex-1', isSolid(station, next) ? `h-0.5 ${LINE_SOLID}` : `h-0 border-t-2 ${LINE_DASHED}`)} />}
          </span>
        )
      })}
    </div>
  )
}
