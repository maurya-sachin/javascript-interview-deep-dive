import { cn } from '@/lib/utils'

export type StationState = 'done' | 'written' | 'in-progress' | 'planned'

export interface Station {
  key: string
  label: string
  to: string
  state: StationState
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

/** One station's dot; also the progress mark on route diagrams. */
export function StationMark({ state, small = false, className }: { state: StationState; small?: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('box-border inline-flex shrink-0 items-center justify-center rounded-full', small ? 'size-2.5' : 'size-3.5', MARK_FILL[state], className)}>
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
