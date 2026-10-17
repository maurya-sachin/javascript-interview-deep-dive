import { RouteDiagram, type DiagramNode } from '@/components/RouteDiagram'
import { orderTrack, topicState } from '@/content/roadmap'
import type { RolePath, TopicOverview } from '@/content/types'
import { topicBranches } from '@/lib/diagram'
import { useProgress } from '@/lib/progress'
import { CONTRIBUTE_URL } from '@/lib/repo'
import { groupByTrack } from '@/lib/tracks'

function metaOf(topic: TopicOverview): string {
  const state = topicState(topic)
  if (state === 'planned') return 'Planned'
  const { total, reviewed } = topic.stats
  return state === 'published' ? `${total} questions · ${reviewed} reviewed` : `${total} questions · in review`
}

/** One line on how far the library has got, with a way to help. */
export function RoadmapSummary({ topics }: { topics: TopicOverview[] }) {
  const started = topics.filter((topic) => topicState(topic) !== 'planned').length
  // Published and drafted are facts about the content, so this line reads the same in every build.
  const published = topics.reduce((sum, topic) => sum + topic.stats.reviewed, 0)
  const drafted = topics.reduce((sum, topic) => sum + topic.stats.drafted, 0)
  return (
    <p className="max-w-2xl text-muted-foreground">
      {started} of {topics.length} topics started · {published} questions reviewed{drafted > 0 && ` · ${drafted} in review`}.{' '}
      <a href={CONTRIBUTE_URL} className="text-link hover:text-link-hover">
        Contribute a question
      </a>
    </p>
  )
}

/** Every topic as route diagrams, one per track, ordered by the role paths. */
export function Roadmap({ topics, paths }: { topics: TopicOverview[]; paths: RolePath[] }) {
  const { read } = useProgress()
  return (
    <div className="flex flex-col gap-14">
      {groupByTrack(topics).map((group) => {
        const ordered = orderTrack(group.topics, paths)
        const started = ordered.filter((topic) => topicState(topic) !== 'planned').length
        const nodes = ordered.map(
          (topic): DiagramNode => ({
            key: topic.slug,
            index: null,
            title: topic.title,
            to: `/${topic.slug}`,
            meta: metaOf(topic),
            note: null,
            planned: topicState(topic) === 'planned',
            current: false,
            branches: topicBranches(topic, read),
          }),
        )
        return (
          <section key={group.name}>
            <h2 className="flex flex-wrap items-baseline gap-x-3 border-b pb-3 font-serif text-2xl font-medium tracking-tight">
              {group.name}
              <span className="font-sans text-sm text-muted-foreground">
                {started} of {ordered.length} started
              </span>
            </h2>
            <RouteDiagram nodes={nodes} label={`${group.name} topics`} />
          </section>
        )
      })}
    </div>
  )
}
