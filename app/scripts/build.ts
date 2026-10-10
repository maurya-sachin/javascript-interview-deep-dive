// content:build [--drafts] — compiles content/ into public/data/ for the app (R1, R7).
// Only published questions get a page; --drafts adds drafts, for reviewing them locally.

import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import type { ContentIndex, Exercise, Flashcard, FollowUp, QuestionPage, QuestionSummary, SearchDoc } from '../src/content/types.ts'
import { collectProblems, printProblems } from './lib/check.ts'
import { loadContent, type Question } from './lib/content.ts'
import type { Frontmatter } from './lib/frontmatter.ts'
import { renderBlock, renderInline } from './lib/markdown.ts'
import { repoRelative } from './lib/paths.ts'
import { EXERCISE_ANSWER, FOLLOW_UP_ANSWER, FOLLOW_UP_QUESTION, splitSections, type Section } from './lib/sections.ts'

type WrittenMeta = Exclude<Frontmatter, { status: 'planned' }>

const outDir = path.resolve(import.meta.dirname, '../public/data')

/** content:check has passed before this runs, so every question has valid frontmatter. */
function metaOf(question: Question): Frontmatter {
  if (!question.meta) throw new Error(`${repoRelative(question.file)}: frontmatter missing after content:check passed`)
  return question.meta
}

/** `**Q:**` / `**A:**` line pairs; content:check guarantees each Q has its A. */
async function renderFollowUps(section: Section | undefined): Promise<FollowUp[]> {
  if (!section) return []
  const questions = section.lines.filter((line) => line.startsWith(FOLLOW_UP_QUESTION))
  const answers = section.lines.filter((line) => line.startsWith(FOLLOW_UP_ANSWER))
  return Promise.all(
    questions.map(async (question, index) => ({
      questionHtml: (await renderInline(question.slice(FOLLOW_UP_QUESTION.length).trim())).html,
      answerHtml: (await renderInline(answers[index].slice(FOLLOW_UP_ANSWER.length).trim())).html,
    })),
  )
}

async function renderExercise({ heading, lines }: Section): Promise<Exercise> {
  const answerAt = lines.findIndex((line) => line.startsWith(EXERCISE_ANSWER))
  const answer = [lines[answerAt].slice(EXERCISE_ANSWER.length).trim(), ...lines.slice(answerAt + 1)]
  return {
    title: heading,
    promptHtml: await renderBlock(lines.slice(0, answerAt).join('\n')),
    answerHtml: await renderBlock(answer.join('\n')),
  }
}

async function buildPage(question: Question, meta: WrittenMeta): Promise<QuestionPage> {
  const { sections } = splitSections(question.body.split('\n'), 2, question.bodyLine)
  const sectionNamed = (heading: string) => sections.find((section) => section.heading === heading)
  const renderSection = async (heading: string) => {
    const section = sectionNamed(heading)
    return section ? renderBlock(section.lines.join('\n')) : null
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
    tldrHtml: (await renderInline(meta.tldr)).html,
    answerHtml: await renderRequired('Answer'),
    exampleHtml: await renderRequired('Example'),
    pitfallsHtml: await renderRequired('Pitfalls'),
    followUps: await renderFollowUps(sectionNamed('Follow-ups')),
    deepDiveHtml: await renderSection('Deep dive'),
    exercises: exercises
      ? await Promise.all(splitSections(exercises.lines, 3, exercises.line + 1).sections.map(renderExercise))
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

const index: ContentIndex = {
  topics: await Promise.all(
    content.topics.map(async (topic) => ({
      slug: topic.slug,
      title: topic.title,
      chapters: await Promise.all(
        topic.chapters.map(async (chapter) => ({
          number: chapter.number,
          slug: chapter.slug,
          title: chapter.title,
          questions: await Promise.all(chapter.questions.map(summarize)),
        })),
      ),
    })),
  ),
}
await writeJson(path.join(outDir, 'index.json'), index)

async function searchDocs(): Promise<SearchDoc[]> {
  const docs: SearchDoc[] = []
  for (const topic of content.topics) {
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
  }
  return docs
}
await writeJson(path.join(outDir, 'search.json'), await searchDocs())

const flashcards: Flashcard[] = await Promise.all(
  content.decks.flatMap((deck) =>
    deck.cards.map(async (card) => ({
      id: `${deck.topic}/${card.id}`,
      topic: deck.topic,
      frontHtml: (await renderInline(card.front)).html,
      backHtml: (await renderInline(card.back)).html,
      question: card.question ?? null,
    })),
  ),
)
await writeJson(path.join(outDir, 'flashcards.json'), flashcards)

console.log(`✔ built ${pageCount} question page(s), an index of ${questions.length} questions and ${flashcards.length} flashcard(s) → ${repoRelative(outDir)}`)
