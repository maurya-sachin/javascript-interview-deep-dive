// The JSON contract between `content:build` (writes public/data/) and the app (reads it).

export type Status = 'planned' | 'draft' | 'published'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface QuestionSummary {
  id: string
  number: string
  /** Plain text, for document titles and search. */
  title: string
  titleHtml: string
  status: Status
  difficulty: Difficulty
  frequency: number
  core: boolean
  /** Whether `questions/<id>.json` was built; planned questions show as "coming soon". */
  hasPage: boolean
}

export interface ChapterSummary {
  number: string
  slug: string
  title: string
  /** The README's opening paragraph, as inline HTML. */
  summaryHtml: string
  questions: QuestionSummary[]
}

export interface TopicSummary {
  slug: string
  title: string
  /** Group on the home page, from the README's `> **Track:**` line. */
  track: string
  /** The README's opening paragraph, as inline HTML. */
  summaryHtml: string
  chapters: ChapterSummary[]
  /** Cards in this topic's flashcard deck; 0 when it has none. */
  flashcardCount: number
}

/** Counts for a set of chapters; see `chapterStats`. */
export interface TopicStats {
  total: number
  /** Questions that have a page. */
  readable: number
  core: number
  byDifficulty: Record<Difficulty, number>
}

/** A topic as the manifest lists it: everything the home page needs, without chapter or question lists. */
export interface TopicOverview extends Omit<TopicSummary, 'chapters'> {
  chapterCount: number
  stats: TopicStats
}

/** `data/manifest.json` */
export interface ContentManifest {
  topics: TopicOverview[]
}

export interface FollowUp {
  questionHtml: string
  answerHtml: string
}

export interface Exercise {
  title: string
  promptHtml: string
  answerHtml: string
}

/** `data/questions/<id>.json` */
export interface QuestionPage {
  id: string
  /** Repo-relative path of the Markdown file, for "Edit on GitHub". */
  sourcePath: string
  title: string
  titleHtml: string
  status: Status
  difficulty: Difficulty
  frequency: number
  core: boolean
  tags: string[]
  related: string[]
  verified: string
  sources: string[]
  tldrHtml: string
  answerHtml: string
  exampleHtml: string
  pitfallsHtml: string
  followUps: FollowUp[]
  deepDiveHtml: string | null
  exercises: Exercise[]
}

/** One entry of `data/search.json`; the app builds its MiniSearch index from these. */
export interface SearchDoc {
  id: string
  title: string
  topic: string
  chapter: string
  tags: string[]
  /** Plain-text TL;DR; empty until the question has a page. */
  tldr: string
  hasPage: boolean
}

/** One entry of `data/flashcards.json`. */
export interface Flashcard {
  /** `<topic>/<card id>`; keys the learner's review history. */
  id: string
  topic: string
  frontHtml: string
  backHtml: string
  /** Id of the question that explains it, if any. */
  question: string | null
}
