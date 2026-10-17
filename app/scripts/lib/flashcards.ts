// Flashcards: content/flashcards/<topic>.yaml, per `templates/README.md` → Flashcards.

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'
import { z } from 'zod'
import { countWords } from './frontmatter.ts'
import { contentDir, repoRelative, type Problem } from './paths.ts'

const flashcardsDir = path.join(contentDir, 'flashcards')

const wordLimit = (limit: number) => (text: string) => countWords(text) <= limit

const cardSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be lowercase kebab-case'),
  front: z.string().min(1).refine(wordLimit(30), 'must be 30 words or fewer'),
  back: z.string().min(1).refine(wordLimit(60), 'must be 60 words or fewer'),
  question: z.string().min(1),
})

export type FlashcardSource = z.infer<typeof cardSchema>

export interface Deck {
  topic: string
  file: string
  cards: FlashcardSource[]
}

export async function loadDecks(problems: Problem[]): Promise<Deck[]> {
  let names: string[]
  try {
    names = (await readdir(flashcardsDir)).filter((name) => !name.startsWith('.')).sort()
  } catch {
    return [] // no flashcards yet
  }

  const decks: Deck[] = []
  for (const name of names) {
    const file = path.join(flashcardsDir, name)
    if (!name.endsWith('.yaml')) {
      problems.push({ file: repoRelative(file), message: 'flashcard files must be `<topic>.yaml`' })
      continue
    }
    const cards = await parseDeck(file, problems)
    if (cards) decks.push({ topic: name.slice(0, -'.yaml'.length), file, cards })
  }
  return decks
}

async function parseDeck(file: string, problems: Problem[]): Promise<FlashcardSource[] | undefined> {
  let data: unknown
  try {
    data = parseYaml(await readFile(file, 'utf8'))
  } catch (error) {
    problems.push({ file: repoRelative(file), message: `not valid YAML: ${(error as Error).message}` })
    return undefined
  }

  const result = z.array(cardSchema).safeParse(data)
  if (result.success) return result.data
  for (const issue of result.error.issues) {
    problems.push({ file: repoRelative(file), message: `${issue.path.join('.') || 'file'}: ${issue.message}` })
  }
  return undefined
}
