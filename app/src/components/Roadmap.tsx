import { RouteLine, StationLegend, type Station } from '@/components/RouteLine'
import { orderTrack, topicState, type TopicState } from '@/content/roadmap'
import type { RolePath, TopicOverview } from '@/content/types'
import { CONTRIBUTE_URL } from '@/lib/repo'
import { groupByTrack } from '@/lib/tracks'

// The roadmap never shows a finished topic: finishing is per reader, and the roadmap is the same for everyone.
const LEGEND_STATES = ['written', 'in-progress', 'planned'] as const

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
export function Roadmap({ topics, paths, trackHeading: TrackHeading }: { topics: TopicOverview[]; paths: RolePath[]; trackHeading: 'h2' | 'h3' }) {
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
      <StationLegend states={LEGEND_STATES} className="mt-4" />
      <div className="mt-10 flex flex-col gap-12">
        {groupByTrack(topics).map((group) => {
          const stations = orderTrack(group.topics, paths).map(toStation)
          const trackStarted = stations.filter((station) => station.state !== 'planned').length
          return (
            <section key={group.name}>
              <TrackHeading className="mb-5 flex flex-wrap items-baseline gap-x-3">
                <span className="font-semibold">{group.name}</span>
                <span className="text-sm text-muted-foreground">
                  {trackStarted} of {stations.length} started
                </span>
              </TrackHeading>
              <RouteLine stations={stations} orientation="responsive" />
            </section>
          )
        })}
      </div>
    </>
  )
}
