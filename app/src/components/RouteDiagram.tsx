import { Link } from 'react-router'
import { InlineHtml } from '@/components/question/InlineHtml'
import { StationMark } from '@/components/RouteLine'
import type { BranchState, DiagramBranch } from '@/lib/diagram'
import { cn } from '@/lib/utils'

export interface DiagramNode {
  key: string
  /** Position on a path ("01"); roadmap tracks have none. */
  index: string | null
  title: string
  to: string
  meta: string
  /** One line under the node, such as why a path includes it. */
  note: string | null
  planned: boolean
  /** The step to read next; drawn with an outline. */
  current: boolean
  branches: DiagramBranch[]
}

const FOCUS = 'outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
/** Connector colour and style: solid for content, dashed for what is still planned. */
const line = (planned: boolean) => (planned ? 'border-dashed border-muted-foreground/45' : 'border-border')
const INLINE_CODE = '[&_code]:font-mono [&_code]:text-[0.9em]'
const STATE_TEXT: Partial<Record<BranchState, string>> = { done: 'read', started: 'started', planned: 'planned' }

function Branch({ branch, side }: { branch: DiagramBranch; side: 'left' | 'right' }) {
  const planned = branch.state === 'planned'
  const body = (
    <>
      {branch.number && <span className="font-mono text-xs text-muted-foreground">{branch.number}</span>}
      <InlineHtml html={branch.labelHtml} className={cn('min-w-0 flex-1', INLINE_CODE)} />
      {(branch.state === 'done' || branch.state === 'started') && <StationMark state={branch.state === 'done' ? 'done' : 'in-progress'} />}
      {STATE_TEXT[branch.state] && <span className="sr-only">, {STATE_TEXT[branch.state]}</span>}
    </>
  )
  const box = cn('flex min-h-9 items-center gap-3 rounded-lg border px-3 py-1.5 text-sm', side === 'left' && 'lg:flex-row-reverse lg:text-right')
  return (
    <li className="relative">
      {/* Phones: a stub from the rail on the left. Desktop: a stub towards the spine. */}
      <span aria-hidden="true" className={cn('absolute top-1/2 -left-5 w-5 border-t-2 lg:w-7', side === 'left' ? 'lg:left-auto lg:-right-7' : 'lg:-left-7', line(planned))} />
      {branch.to ? (
        <Link to={branch.to} className={cn(box, 'bg-card hover:border-link', branch.state === 'done' && 'border-depth-3', FOCUS)}>
          {body}
        </Link>
      ) : (
        <span className={cn(box, 'border-dashed border-muted-foreground/45 text-muted-foreground')}>{body}</span>
      )}
    </li>
  )
}

function BranchColumn({ branches, side, planned }: { branches: DiagramBranch[]; side: 'left' | 'right'; planned: boolean }) {
  if (branches.length === 0) return null
  return (
    <div className={cn('relative max-lg:ml-8 max-lg:border-l-2 max-lg:pl-5 lg:row-start-1 lg:self-center', side === 'left' ? 'lg:col-start-1' : 'lg:col-start-3', line(planned))}>
      {/* Desktop: a rail joining the branches, and a stub from the rail to the node. */}
      <span aria-hidden="true" className={cn('absolute top-4.5 bottom-4.5 hidden border-l-2 lg:block', side === 'left' ? '-right-7' : '-left-7', line(planned))} />
      <span aria-hidden="true" className={cn('absolute top-1/2 hidden w-7 border-t-2 lg:block', side === 'left' ? '-right-14' : '-left-14', line(planned))} />
      <ul className="flex flex-col gap-2">
        {branches.map((branch) => (
          <Branch key={branch.key} branch={branch} side={side} />
        ))}
      </ul>
    </div>
  )
}

/**
 * Nodes on a vertical spine, each with its branches split left and right, like a transit map seen from above.
 * Phones get one column: the node, then its branches on a rail.
 */
export function RouteDiagram({ nodes, label }: { nodes: DiagramNode[]; label: string }) {
  return (
    <ol aria-label={label}>
      {nodes.map((node, index) => {
        const half = Math.ceil(node.branches.length / 2)
        return (
          <li key={node.key} className="relative grid gap-y-2 py-4 lg:grid-cols-[minmax(0,1fr)_17rem_minmax(0,1fr)] lg:gap-x-14 lg:py-6">
            <span
              aria-hidden="true"
              className={cn(
                'absolute left-1/2 hidden -translate-x-1/2 border-l-[3px] lg:block',
                index === 0 ? 'top-1/2' : 'top-0',
                index === nodes.length - 1 ? 'bottom-1/2' : 'bottom-0',
                node.planned ? 'border-dashed border-muted-foreground/45' : 'border-depth-3',
              )}
            />
            <div className="relative z-10 flex flex-col gap-2 lg:col-start-2 lg:row-start-1 lg:items-center lg:self-center">
              <Link
                to={node.to}
                aria-current={node.current ? 'step' : undefined}
                className={cn(
                  'grid w-full grid-cols-[auto_1fr] items-baseline gap-x-3 rounded-xl px-4 py-3 ring-6 ring-background transition-transform hover:-translate-y-0.5',
                  node.planned ? 'border-2 border-dashed border-muted-foreground/45 bg-background text-muted-foreground' : 'bg-link text-background',
                  node.current && 'outline-2 outline-offset-4 outline-link',
                  FOCUS,
                )}
              >
                <span className="row-span-2 font-mono text-xs opacity-70">{node.index}</span>
                <span className="font-semibold">{node.title}</span>
                <span className="text-xs opacity-80">{node.meta}</span>
              </Link>
              {node.note && <p className="bg-background px-1.5 text-xs text-muted-foreground lg:max-w-60 lg:text-center">{node.note}</p>}
            </div>
            <BranchColumn branches={node.branches.slice(0, half)} side="left" planned={node.planned} />
            <BranchColumn branches={node.branches.slice(half)} side="right" planned={node.planned} />
          </li>
        )
      })}
    </ol>
  )
}

const SWATCH = 'inline-block h-3 w-5 rounded-[4px]'

/** What the diagram's shapes mean; marks differ by shape as well as colour. */
export function DiagramLegend({ className }: { className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground', className)}>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className={cn(SWATCH, 'bg-link')} />
        Topic
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className={cn(SWATCH, 'border-2 bg-card')} />
        Chapter
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className={cn(SWATCH, 'border-2 border-dashed border-muted-foreground/45')} />
        Planned
      </li>
      <li className="flex items-center gap-2">
        <StationMark state="done" />
        Read by you
      </li>
      <li className="flex items-center gap-2">
        <StationMark state="in-progress" />
        Started
      </li>
    </ul>
  )
}
