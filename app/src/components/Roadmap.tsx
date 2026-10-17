import { Link } from 'react-router'
import { TopicCover } from '@/components/TopicCover'
import { orderTrack, topicState, type TopicState } from '@/content/roadmap'
import type { RolePath, TopicOverview } from '@/content/types'
import { CONTRIBUTE_URL } from '@/lib/repo'
import { groupByTrack } from '@/lib/tracks'
import { cn } from '@/lib/utils'

function statusOf(topic: TopicOverview, state: TopicState): string {
  if (state === 'written') return `${topic.stats.readable} questions`
  if (state === 'in-progress') return topic.stats.drafted > 0 ? `${topic.stats.drafted} in review` : 'In progress'
  return 'Planned'
}

/** One topic on the chart: its contour cover, drawn faint and dashed while the topic is still unsurveyed. */
function TopicTile({ topic }: { topic: TopicOverview }) {
  const state = topicState(topic)
  const { stats } = topic
  return (
    <li>
      <Link to={`/${topic.slug}`} className="group -m-2 flex items-center gap-4 rounded-lg p-2 hover:bg-muted">
        <TopicCover
          slug={topic.slug}
          chapterCount={topic.chapterCount}
          hardShare={stats.total === 0 ? 0 : stats.byDifficulty.hard / stats.total}
          className={cn('size-16 shrink-0 rounded-md bg-muted', state === 'planned' && '[&_path]:[stroke-dasharray:3_2.5]')}
        />
        <span className="min-w-0">
          <span className="block font-medium group-hover:text-link">{topic.title}</span>
          <span className="block text-sm text-muted-foreground">{statusOf(topic, state)}</span>
        </span>
      </Link>
    </li>
  )
}

/** Every topic as a chart of tiles per track, ordered by the role paths. Paths draw routes; this draws coverage. */
export function Roadmap({ topics, paths, trackHeading: TrackHeading }: { topics: TopicOverview[]; paths: RolePath[]; trackHeading: 'h2' | 'h3' }) {
  const started = topics.filter((topic) => topicState(topic) !== 'planned').length
  // Published and drafted are facts about the content, so this line reads the same in every build.
  const published = topics.reduce((sum, topic) => sum + topic.stats.reviewed, 0)
  const drafted = topics.reduce((sum, topic) => sum + topic.stats.drafted, 0)
  return (
    <>
      <p className="max-w-2xl text-muted-foreground">
        {started} of {topics.length} topics started · {published} questions published{drafted > 0 && ` · ${drafted} in review`}. Dashed maps are
        still planned.{' '}
        <a href={CONTRIBUTE_URL} className="text-link hover:text-link-hover">
          Contribute a question
        </a>
      </p>
      <div className="mt-10 flex flex-col gap-12">
        {groupByTrack(topics).map((group) => {
          const ordered = orderTrack(group.topics, paths)
          const trackStarted = ordered.filter((topic) => topicState(topic) !== 'planned').length
          return (
            <section key={group.name}>
              <TrackHeading className="mb-5 flex flex-wrap items-baseline gap-x-3">
                <span className="font-semibold">{group.name}</span>
                <span className="text-sm text-muted-foreground">
                  {trackStarted} of {ordered.length} started
                </span>
              </TrackHeading>
              <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {ordered.map((topic) => (
                  <TopicTile key={topic.slug} topic={topic} />
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </>
  )
}
