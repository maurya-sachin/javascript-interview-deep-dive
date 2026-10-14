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
  /** The same paragraph as plain text, for page descriptions. */
  summaryText: string
  questions: QuestionSummary[]
}

export interface TopicSummary {
  slug: string
  title: string
  /** Group on the home page, from the README's `> **Track:**` line. */
  track: string
  /** The README's opening paragraph, as inline HTML. */
  summaryHtml: string
  /** The same paragraph as plain text, for page descriptions. */
  summaryText: string
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

/** One entry of a role path, resolved against the content. */
export interface PathStep {
  topic: string
  topicTitle: string
  /** Set when the entry names a chapter. */
  chapter: string | null
  chapterTitle: string | null
  /** One line on why this step is on the path. */
  why: string
  /** Whether the step has anything to read in this build. Steps without are shown as planned. */
  ready: boolean
  /** Readable questions in the chapter, or in the topic when no chapter is named. */
  questionCount: number
}

/** The question a path suggests opening first. */
export interface StartQuestion {
  id: string
  titleHtml: string
  tldrHtml: string
}

/** An ordered, cross-topic route for one kind of engineer; built from `content/paths/<slug>.yaml`. */
export interface RolePath {
  slug: string
  title: string
  summary: string
  start: StartQuestion | null
  steps: PathStep[]
}

/** `data/manifest.json` */
export interface ContentManifest {
  topics: TopicOverview[]
  /** Role paths in home-page order. */
  paths: RolePath[]
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

/** One entry of `data/topics/<slug>/search.json`; the app builds its MiniSearch index from these. */
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

/** One entry of `data/topics/<slug>/flashcards.json`. */
export interface Flashcard {
  /** `<topic>/<card id>`; keys the learner's review history. */
  id: string
  topic: string
  frontHtml: string
  backHtml: string
  /** Id of the question that explains it, if any. */
  question: string | null
}
