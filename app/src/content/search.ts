// Full-text search over questions. MiniSearch is loaded on first use, so it isn't in the initial bundle.

import type MiniSearch from 'minisearch'
import { fetchData, loadManifest } from './index-data.ts'
import type { SearchDoc } from './types.ts'

const MAX_RESULTS = 8

export interface SearchEngine {
  search: (query: string) => SearchDoc[]
}

async function createEngine(): Promise<SearchEngine> {
  const [{ default: MiniSearchClass }, { topics }] = await Promise.all([import('minisearch'), loadManifest()])
  const shards = await Promise.all(
    topics.filter((topic) => topic.chapterCount > 0).map((topic) => fetchData<SearchDoc[]>(`topics/${topic.slug}/search.json`)),
  )
  const docs = shards.flat()
  const index: MiniSearch<SearchDoc> = new MiniSearchClass({
    fields: ['title', 'tags', 'tldr', 'chapter', 'topic'],
    searchOptions: { prefix: true, fuzzy: 0.3, combineWith: 'AND', boost: { title: 3, tags: 2 } },
  })
  index.addAll(docs)

  const docsById = new Map(docs.map((doc) => [doc.id, doc]))
  return {
    search: (query) =>
      index
        .search(query)
        .slice(0, MAX_RESULTS)
        .map((result) => docsById.get(result.id as string))
        .filter((doc) => doc !== undefined),
  }
}

let enginePromise: Promise<SearchEngine> | undefined

export function loadSearchEngine(): Promise<SearchEngine> {
  enginePromise ??= createEngine().catch((error: unknown) => {
    enginePromise = undefined // allow a retry the next time the dialog opens
    throw error
  })
  return enginePromise
}
