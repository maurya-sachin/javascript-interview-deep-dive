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
  /** `YYYY-MM` of the last fact check; `null` while the question is planned. */
  verified: string | null
  /** Verified 12 or more months before this build; see `freshness.ts`. */
  stale: boolean
  /** Why the question is kept for history only; `null` when it is current. */
  legacy: string | null
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
  /** The README's optional `> **Covers:**` line: the versions and engines the topic is checked against. */
  covers: string | null
  /** The README's opening paragraph, as inline HTML. */
  summaryHtml: string
  /** The same paragraph as plain text, for page descriptions. */
  summaryText: string
  chapters: ChapterSummary[]
  /** Areas from the README's `## Not yet mapped` list, as inline HTML: planned parts with no chapter yet. */
  plannedAreasHtml: string[]
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
  /** Oldest `verified` month among readable questions; `null` when none are readable. */
  lastVerified: string | null
  /** Readable questions that are stale. */
  stale: number
  /** Readable questions with status `published`. */
  reviewed: number
  /** Questions with status `draft`, awaiting review; a production build gives them no page. */
  drafted: number
}

/** A chapter as the manifest lists it: enough to draw it on a route diagram, without its questions. */
export interface ChapterOverview {
  number: string
  slug: string
  title: string
  questionCount: number
}

/** A topic as the manifest lists it: everything the home page and route diagrams need, without question lists. */
export interface TopicOverview extends Omit<TopicSummary, 'chapters'> {
  chapterCount: number
  chapters: ChapterOverview[]
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
  /** Whether the topic has chapters yet, even if none is readable. Started but not ready shows as in progress. */
  started: boolean
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

/** The published questions that changed on one day, in one topic. */
export interface ChangelogDay {
  /** `YYYY-MM-DD`. */
  date: string
  topics: {
    slug: string
    title: string
    questions: { id: string; title: string }[]
  }[]
}

/** `data/changelog.json` */
export interface Changelog {
  /** False when older changes exist that this list leaves out (shallow clone, no git, or more than the cap). */
  complete: boolean
  /** Newest day first. */
  days: ChangelogDay[]
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
  stale: boolean
  legacy: string | null
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
  /** Id of the question that explains it; the build ships a card only when that question has a page. */
  question: string
}
