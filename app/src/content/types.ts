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
  questions: QuestionSummary[]
}

export interface TopicSummary {
  slug: string
  title: string
  chapters: ChapterSummary[]
}

/** `data/index.json` */
export interface ContentIndex {
  topics: TopicSummary[]
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
