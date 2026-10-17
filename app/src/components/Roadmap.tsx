import { Link } from 'react-router'
import { orderTrack, topicState, type TopicState } from '@/content/roadmap'
import type { RolePath, TopicOverview } from '@/content/types'
import { CONTRIBUTE_URL } from '@/lib/repo'
import { groupByTrack } from '@/lib/tracks'
import { cn } from '@/lib/utils'

const COLUMNS: { state: TopicState; label: string }[] = [
  { state: 'published', label: 'Published' },
  { state: 'in-review', label: 'In review' },
  { state: 'planned', label: 'Planned' },
]

const CHIP: Record<TopicState, string> = {
  published: 'border-link bg-link text-background hover:bg-link-hover',
  'in-review': 'border-link text-link hover:bg-muted',
  planned: 'border-dashed border-muted-foreground/70 text-muted-foreground hover:text-foreground',
}

/** Track name, then one column per state; rows share the columns through a subgrid. */
const BOARD_ROW = 'lg:grid lg:grid-cols-[13rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] lg:gap-x-8'

function questionCount(topic: TopicOverview, state: TopicState): number | null {
  if (state === 'published') return topic.stats.reviewed
  if (state === 'in-review') return topic.stats.drafted
  return null
}

function TopicChip({ topic, state }: { topic: TopicOverview; state: TopicState }) {
  const count = questionCount(topic, state)
  return (
    <Link to={`/${topic.slug}`} className={cn('rounded-full border px-3 py-0.5 text-sm', CHIP[state])}>
      {topic.title}
      {count !== null && count > 0 && <span className="ml-1.5 opacity-75">{count}</span>}
    </Link>
  )
}

/** Every topic on a board: one row per track, one column per state. Paths draw routes; this shows coverage. */
export function Roadmap({ topics, paths, trackHeading: TrackHeading }: { topics: TopicOverview[]; paths: RolePath[]; trackHeading: 'h2' | 'h3' }) {
  const started = topics.filter((topic) => topicState(topic) !== 'planned').length
  const published = topics.reduce((sum, topic) => sum + topic.stats.reviewed, 0)
  const drafted = topics.reduce((sum, topic) => sum + topic.stats.drafted, 0)
  return (
    <>
      <p className="max-w-2xl text-muted-foreground">
        {started} of {topics.length} topics started · {published} questions published{drafted > 0 && ` · ${drafted} in review`}.{' '}
        <a href={CONTRIBUTE_URL} className="text-link hover:text-link-hover">
          Contribute a question
        </a>
      </p>
      <div className="mt-8">
        <div aria-hidden="true" className={cn('hidden border-b pb-2 text-sm text-muted-foreground', BOARD_ROW)}>
          <span />
          {COLUMNS.map(({ label }) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        {groupByTrack(topics).map((group) => {
          const ordered = orderTrack(group.topics, paths)
          const trackStarted = ordered.filter((topic) => topicState(topic) !== 'planned').length
          return (
            <section key={group.name} className={cn('border-b py-5', BOARD_ROW)}>
              <TrackHeading className="font-semibold">
                {group.name}
                <span className="block text-sm font-normal text-muted-foreground">
                  {trackStarted} of {ordered.length} started
                </span>
              </TrackHeading>
              <dl className="mt-3 grid gap-3 lg:col-span-3 lg:mt-0 lg:grid-cols-subgrid">
                {COLUMNS.map(({ state, label }) => {
                  const inColumn = ordered.filter((topic) => topicState(topic) === state)
                  return (
                    // On phones an empty column is just noise; on the board it keeps the grid readable.
                    <div key={state} className={cn(inColumn.length === 0 && 'max-lg:hidden')}>
                      <dt className="mb-1.5 text-xs text-muted-foreground lg:sr-only">{label}</dt>
                      <dd className="flex flex-wrap gap-2">
                        {inColumn.length > 0 ? (
                          inColumn.map((topic) => <TopicChip key={topic.slug} topic={topic} state={state} />)
                        ) : (
                          <>
                            <span aria-hidden="true" className="text-muted-foreground">
                              —
                            </span>
                            <span className="sr-only">None</span>
                          </>
                        )}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </section>
          )
        })}
      </div>
    </>
  )
}
