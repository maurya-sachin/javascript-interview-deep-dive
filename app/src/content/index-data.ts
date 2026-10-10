// Loading and querying data/index.json, the navigation tree built by content:build.

import { useRouteLoaderData } from 'react-router'
import type { ChapterSummary, ContentIndex, QuestionSummary, TopicSummary } from './types.ts'

export const INDEX_ROUTE_ID = 'root'

export async function loadIndex(): Promise<ContentIndex> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/index.json`)
  if (!response.ok) throw new Error(`Could not load the content index (${response.status}). Run npm run content:build.`)
  const data: unknown = await response.json()
  // The file is produced by content:build from the same types, so the shape is trusted.
  return data as ContentIndex
}

export function useContentIndex(): ContentIndex {
  // Route loader data is untyped in data-router mode; INDEX_ROUTE_ID's loader returns loadIndex().
  return useRouteLoaderData(INDEX_ROUTE_ID) as ContentIndex
}

export function questionCount(chapters: ChapterSummary[]) {
  const questions = chapters.flatMap((chapter) => chapter.questions)
  return { published: questions.filter((q) => q.status === 'published').length, total: questions.length }
}

export function findTopic(index: ContentIndex, slug: string | undefined): TopicSummary | undefined {
  return index.topics.find((topic) => topic.slug === slug)
}

export function findChapter(topic: TopicSummary, slug: string | undefined): ChapterSummary | undefined {
  return topic.chapters.find((chapter) => chapter.slug === slug)
}

export function questionId(topic: TopicSummary, chapter: ChapterSummary, slug: string): string {
  return `${topic.slug}/${chapter.slug}/${slug}`
}

export function questionPath(question: QuestionSummary): string {
  return `/${question.id}`
}

/** The nearest questions before and after `id` in reading order that have a page. */
export function neighbours(topic: TopicSummary, id: string) {
  const questions = topic.chapters.flatMap((chapter) => chapter.questions)
  const position = questions.findIndex((question) => question.id === id)
  const readable = (question: QuestionSummary) => question.hasPage
  return {
    previous: questions.slice(0, Math.max(position, 0)).findLast(readable),
    next: questions.slice(position + 1).find(readable),
  }
}
