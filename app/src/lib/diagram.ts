// What a route diagram draws off each topic: its chapters with the reader's progress, then its planned areas.

import type { ChapterOverview, TopicOverview } from '../content/types.ts'

export type BranchState = 'done' | 'started' | 'unread' | 'planned'

export interface DiagramBranch {
  key: string
  labelHtml: string
  /** Chapter number; planned areas have none. */
  number: string | null
  /** Chapter page; planned areas have none. */
  to: string | null
  state: BranchState
}

/** Questions read in one chapter. Ids are `<topic>/<chapter>/<question>`; stale ids never push it past the total. */
export function chapterReadCount(topic: string, chapter: ChapterOverview, read: readonly string[]): number {
  const prefix = `${topic}/${chapter.slug}/`
  return Math.min(read.filter((id) => id.startsWith(prefix)).length, chapter.questionCount)
}

export function topicBranches(topic: TopicOverview, read: readonly string[]): DiagramBranch[] {
  const chapters = topic.chapters.map((chapter): DiagramBranch => {
    const readCount = chapterReadCount(topic.slug, chapter, read)
    const state = readCount > 0 && readCount === chapter.questionCount ? 'done' : readCount > 0 ? 'started' : 'unread'
    return { key: chapter.slug, labelHtml: chapter.titleHtml, number: chapter.number, to: `/${topic.slug}/${chapter.slug}`, state }
  })
  const planned = topic.plannedAreasHtml.map((labelHtml, index): DiagramBranch => ({ key: `planned-${index}`, labelHtml, number: null, to: null, state: 'planned' }))
  return [...chapters, ...planned]
}
