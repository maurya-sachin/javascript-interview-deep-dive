// Loading and querying data/index.json, the navigation tree built by content:build.

import { useRouteLoaderData } from 'react-router'
import type { ChapterSummary, ContentIndex, QuestionPage as QuestionData, QuestionSummary, TopicSummary } from './types.ts'

export const INDEX_ROUTE_ID = 'root'

/** Reads a JSON file produced by content:build; its shape is trusted because both sides share `types.ts`. */
export async function fetchData<T>(file: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${file}`)
  if (!response.ok) throw new Error(`Could not load ${file} (${response.status}). Run npm run content:build.`)
  const data: unknown = await response.json()
  return data as T
}

let indexPromise: Promise<ContentIndex> | undefined

/** One shared request: the root route and question loaders both need the index. */
export function loadIndex(): Promise<ContentIndex> {
  indexPromise ??= fetchData<ContentIndex>('index.json').catch((error: unknown) => {
    indexPromise = undefined
    throw error
  })
  return indexPromise
}

/** The question's content, or `null` when it has no page yet (planned) or doesn't exist. */
export async function loadQuestion(id: string): Promise<QuestionData | null> {
  const { topics } = await loadIndex()
  const summary = topics.flatMap((topic) => topic.chapters.flatMap((chapter) => chapter.questions)).find((q) => q.id === id)
  return summary?.hasPage ? fetchData<QuestionData>(`questions/${id}.json`) : null
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
