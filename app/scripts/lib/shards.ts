// The manifest's view of a topic, derived from the topic shard so the two can't disagree (R3).

import { chapterStats } from '../../src/content/stats.ts'
import type { TopicOverview, TopicSummary } from '../../src/content/types.ts'

export function toOverview({ chapters, ...topic }: TopicSummary): TopicOverview {
  return {
    ...topic,
    chapterCount: chapters.length,
    chapters: chapters.map(({ number, slug, titleHtml, questions }) => ({ number, slug, titleHtml, questionCount: questions.length })),
    stats: chapterStats(chapters),
  }
}
