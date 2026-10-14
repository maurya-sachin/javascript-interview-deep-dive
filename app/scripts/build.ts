// content:build [--drafts] — compiles content/ into public/data/ for the app (R1, R7).
// Only published questions get a page; --drafts adds drafts, for reviewing them locally.

import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import type { ContentManifest, Exercise, Flashcard, FollowUp, QuestionPage, QuestionSummary, RolePath, SearchDoc, StartQuestion, TopicSummary } from '../src/content/types.ts'
import { collectProblems, printProblems } from './lib/check.ts'
import { loadContent, type Question, type Topic } from './lib/content.ts'
import type { Deck } from './lib/flashcards.ts'
import type { Frontmatter } from './lib/frontmatter.ts'
import { renderBlock, renderInline } from './lib/markdown.ts'
import { repoRelative } from './lib/paths.ts'
import { resolveRolePaths } from './lib/rolepaths.ts'
import { toOverview } from './lib/shards.ts'
import { EXERCISE_ANSWER, FOLLOW_UP_ANSWER, FOLLOW_UP_QUESTION, splitSections, type Section } from './lib/sections.ts'

type WrittenMeta = Exclude<Frontmatter, { status: 'planned' }>

const outDir = path.resolve(import.meta.dirname, '../public/data')

/** content:check has passed before this runs, so every question has valid frontmatter. */
function metaOf(question: Question): Frontmatter {
  if (!question.meta) throw new Error(`${repoRelative(question.file)}: frontmatter missing after content:check passed`)
  return question.meta
}

/** `**Q:**` / `**A:**` line pairs; content:check guarantees each Q has its A. */
async function renderFollowUps(section: Section | undefined, sourceFile: string): Promise<FollowUp[]> {
  if (!section) return []
  const questions = section.lines.filter((line) => line.startsWith(FOLLOW_UP_QUESTION))
  const answers = section.lines.filter((line) => line.startsWith(FOLLOW_UP_ANSWER))
  return Promise.all(
    questions.map(async (question, index) => ({
      questionHtml: (await renderInline(question.slice(FOLLOW_UP_QUESTION.length).trim(), sourceFile)).html,
      answerHtml: (await renderInline(answers[index].slice(FOLLOW_UP_ANSWER.length).trim(), sourceFile)).html,
    })),
  )
}

async function renderExercise({ heading, lines }: Section, sourceFile: string): Promise<Exercise> {
  const answerAt = lines.findIndex((line) => line.startsWith(EXERCISE_ANSWER))
  const answer = [lines[answerAt].slice(EXERCISE_ANSWER.length).trim(), ...lines.slice(answerAt + 1)]
  return {
    title: heading,
    promptHtml: await renderBlock(lines.slice(0, answerAt).join('\n'), sourceFile),
    answerHtml: await renderBlock(answer.join('\n'), sourceFile),
  }
}

async function buildPage(question: Question, meta: WrittenMeta): Promise<QuestionPage> {
  const { sections } = splitSections(question.body.split('\n'), 2, question.bodyLine)
  const sectionNamed = (heading: string) => sections.find((section) => section.heading === heading)
  const renderSection = async (heading: string) => {
    const section = sectionNamed(heading)
    return section ? renderBlock(section.lines.join('\n'), question.file) : null
  }
  const renderRequired = async (heading: string) => {
    const html = await renderSection(heading)
    if (html === null) throw new Error(`${repoRelative(question.file)}: missing ## ${heading} after content:check passed`)
    return html
  }

  const exercises = sectionNamed('Exercises')
  const title = await renderInline(meta.title)
  return {
    id: question.id,
    sourcePath: repoRelative(question.file),
    title: title.text,
    titleHtml: title.html,
    status: meta.status,
    difficulty: meta.difficulty,
    frequency: meta.frequency,
    core: meta.core,
    tags: meta.tags,
    related: meta.related,
    verified: meta.verified,
    sources: meta.sources,
    tldrHtml: (await renderInline(meta.tldr, question.file)).html,
    answerHtml: await renderRequired('Answer'),
    exampleHtml: await renderRequired('Example'),
    pitfallsHtml: await renderRequired('Pitfalls'),
    followUps: await renderFollowUps(sectionNamed('Follow-ups'), question.file),
    deepDiveHtml: await renderSection('Deep dive'),
    exercises: exercises
      ? await Promise.all(splitSections(exercises.lines, 3, exercises.line + 1).sections.map((exercise) => renderExercise(exercise, question.file)))
      : [],
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(data))
}

const { values } = parseArgs({ options: { drafts: { type: 'boolean', default: false } } })
const content = await loadContent()
const problems = collectProblems(content)
if (problems.length > 0) {
  printProblems(problems)
  console.error(`\n✖ ${problems.length} problem(s) — nothing built`)
  process.exit(1)
}

const hasPage = (meta: Frontmatter): meta is WrittenMeta =>
  meta.status === 'published' || (values.drafts && meta.status === 'draft')

await rm(outDir, { recursive: true, force: true })

const questions = content.topics.flatMap((topic) => topic.chapters.flatMap((chapter) => chapter.questions))
let pageCount = 0
for (const question of questions) {
  const meta = metaOf(question)
  if (!hasPage(meta)) continue
  await writeJson(path.join(outDir, 'questions', `${question.id}.json`), await buildPage(question, meta))
  pageCount++
}

async function summarize(question: Question): Promise<QuestionSummary> {
  const meta = metaOf(question)
  const title = await renderInline(meta.title)
  return {
    id: question.id,
    number: question.number,
    title: title.text,
    titleHtml: title.html,
    status: meta.status,
    difficulty: meta.difficulty,
    frequency: meta.frequency,
    core: meta.core,
    hasPage: hasPage(meta),
  }
}

/** The README's opening paragraph: the first block of text after the `> **Status:**` line. */
async function summaryOf(readme: string): Promise<{ summaryHtml: string; summaryText: string }> {
  const lines = readme.split('\n')
  const start = lines.findIndex((line) => line.startsWith('> **Status:**'))
  const paragraph: string[] = []
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '') {
      if (paragraph.length > 0) break
      continue
    }
    paragraph.push(line.trim())
  }
  const { html, text } = await renderInline(paragraph.join(' '))
  return { summaryHtml: html, summaryText: text }
}

/** The topic README's `> **Track:**` line, which groups topics on the home page. */
function trackOf(readme: string): string {
  return readme.match(/^> \*\*Track:\*\* (.+)$/m)?.[1].trim() ?? 'Other'
}

const topics: TopicSummary[] = await Promise.all(
  content.topics.map(async (topic) => ({
    slug: topic.slug,
    title: topic.title,
    track: trackOf(topic.readme),
    ...(await summaryOf(topic.readme)),
    flashcardCount: content.decks.find((deck) => deck.topic === topic.slug)?.cards.length ?? 0,
    chapters: await Promise.all(
      topic.chapters.map(async (chapter) => ({
        number: chapter.number,
        slug: chapter.slug,
        title: chapter.title,
        ...(await summaryOf(chapter.readme)),
        questions: await Promise.all(chapter.questions.map(summarize)),
      })),
    ),
  })),
)

async function searchDocs(topic: Topic): Promise<SearchDoc[]> {
  const docs: SearchDoc[] = []
  for (const chapter of topic.chapters) {
    for (const question of chapter.questions) {
      const meta = metaOf(question)
      const written = hasPage(meta)
      docs.push({
        id: question.id,
        title: (await renderInline(meta.title)).text,
        topic: topic.title,
        chapter: chapter.title,
        tags: written ? meta.tags : [],
        tldr: written ? (await renderInline(meta.tldr)).text : '',
        hasPage: written,
      })
    }
  }
  return docs
}

async function flashcardsOf(deck: Deck): Promise<Flashcard[]> {
  return Promise.all(
    deck.cards.map(async (card) => ({
      id: `${deck.topic}/${card.id}`,
      topic: deck.topic,
      frontHtml: (await renderInline(card.front)).html,
      backHtml: (await renderInline(card.back)).html,
      question: card.question ?? null,
    })),
  )
}

/** A path's start question, rendered for the home page; `null` when it has no page in this build. */
async function startQuestion(id: string | null): Promise<StartQuestion | null> {
  const question = questions.find((candidate) => candidate.id === id)
  if (!question) return null
  const meta = metaOf(question)
  if (!hasPage(meta)) return null
  return { id: question.id, titleHtml: (await renderInline(meta.title)).html, tldrHtml: (await renderInline(meta.tldr)).html }
}

const paths: RolePath[] = await Promise.all(
  resolveRolePaths(content.paths, topics).map(async ({ startId, ...rolePath }) => ({ ...rolePath, start: await startQuestion(startId) })),
)

const manifest: ContentManifest = { topics: topics.map(toOverview), paths }
await writeJson(path.join(outDir, 'manifest.json'), manifest)

const topicDir = (slug: string) => path.join(outDir, 'topics', slug)
for (const topic of topics) await writeJson(path.join(topicDir(topic.slug), 'index.json'), topic)

const allSearchDocs: SearchDoc[] = []
for (const topic of content.topics) {
  if (topic.chapters.length === 0) continue
  const docs = await searchDocs(topic)
  allSearchDocs.push(...docs)
  await writeJson(path.join(topicDir(topic.slug), 'search.json'), docs)
}

const allFlashcards: Flashcard[] = []
for (const deck of content.decks) {
  const cards = await flashcardsOf(deck)
  allFlashcards.push(...cards)
  await writeJson(path.join(topicDir(deck.topic), 'flashcards.json'), cards)
}

console.log(
  `✔ built ${pageCount} question page(s), a manifest of ${manifest.topics.length} topics, ${allSearchDocs.length} search doc(s) and ${allFlashcards.length} flashcard(s) → ${repoRelative(outDir)}`,
)
