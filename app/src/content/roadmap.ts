import type { RolePath, TopicOverview } from './types.ts'

export type TopicState = 'published' | 'in-review' | 'planned'

/**
 * Where a topic stands as content: a published question makes it published, chapters make it in review.
 * It reads content facts, not which questions have a page.
 */
export function topicState(topic: TopicOverview): TopicState {
  if (topic.stats.reviewed > 0) return 'published'
  if (topic.chapterCount > 0) return 'in-review'
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
