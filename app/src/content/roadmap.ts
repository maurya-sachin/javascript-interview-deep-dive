import type { RolePath, TopicOverview } from './types.ts'

export type TopicState = 'written' | 'in-progress' | 'planned'

/** Readable questions make a topic written; chapters without readable questions make it in progress. */
export function topicState(topic: TopicOverview): TopicState {
  if (topic.stats.readable > 0) return 'written'
  if (topic.chapterCount > 0) return 'in-progress'
  return 'planned'
}

/**
 * Orders one track's topics for the roadmap: the role path that covers most of them leads
 * (the earlier path wins a tie), and topics on no such path follow alphabetically.
 */
export function orderTrack(topics: TopicOverview[], paths: RolePath[]): TopicOverview[] {
  const slugs = new Set(topics.map((topic) => topic.slug))
  const stepsOf = (path: RolePath) => [...new Set(path.steps.map((step) => step.topic))].filter((slug) => slugs.has(slug))

  let lead: string[] = []
  for (const path of paths) {
    const steps = stepsOf(path)
    if (steps.length > lead.length) lead = steps
  }

  const bySlug = new Map(topics.map((topic) => [topic.slug, topic]))
  const onPath = lead.flatMap((slug) => bySlug.get(slug) ?? [])
  const rest = topics.filter((topic) => !lead.includes(topic.slug)).sort((a, b) => a.title.localeCompare(b.title))
  return [...onPath, ...rest]
}
