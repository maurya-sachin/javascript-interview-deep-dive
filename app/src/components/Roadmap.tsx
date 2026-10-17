import { RouteLine, StationMark, type Station } from '@/components/RouteLine'
import { orderTrack, topicState, type TopicState } from '@/content/roadmap'
import type { RolePath, TopicOverview } from '@/content/types'
import { CONTRIBUTE_URL } from '@/lib/repo'
import { groupByTrack } from '@/lib/tracks'

const LEGEND = [
  { state: 'written', label: 'Published' },
  { state: 'in-progress', label: 'In progress' },
  { state: 'planned', label: 'Planned' },
] as const

function toStation(topic: TopicOverview): Station {
  const state = topicState(topic)
  const details: Record<TopicState, string> = {
    written: `${topic.stats.readable} questions`,
    'in-progress': 'In progress',
    planned: 'Planned',
  }
  return { key: topic.slug, label: topic.title, to: `/${topic.slug}`, state, detail: details[state] }
}

/** Every topic as one route line per track, ordered by the role paths. */
export function Roadmap({ topics, paths }: { topics: TopicOverview[]; paths: RolePath[] }) {
  const started = topics.filter((topic) => topicState(topic) !== 'planned').length
  const questions = topics.reduce((sum, topic) => sum + topic.stats.readable, 0)
  return (
    <>
      <p className="max-w-2xl text-muted-foreground">
        {started} of {topics.length} topics started, {questions} questions written.{' '}
        <a href={CONTRIBUTE_URL} className="text-link hover:text-link-hover">
          Contribute a question
        </a>
      </p>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground" aria-label="Legend">
        {LEGEND.map(({ state, label }) => (
          <li key={state} className="flex items-center gap-2">
            <StationMark state={state} />
            {label}
          </li>
        ))}
      </ul>
      <div className="mt-10 flex flex-col gap-12">
        {groupByTrack(topics).map((group) => {
          const stations = orderTrack(group.topics, paths).map(toStation)
          const trackStarted = stations.filter((station) => station.state !== 'planned').length
          return (
            <section key={group.name}>
              <h3 className="mb-5 flex flex-wrap items-baseline gap-x-3">
                <span className="font-semibold">{group.name}</span>
                <span className="text-sm text-muted-foreground">
                  {trackStarted} of {stations.length} started
                </span>
              </h3>
              <RouteLine stations={stations} orientation="responsive" />
            </section>
          )
        })}
      </div>
    </>
  )
}
