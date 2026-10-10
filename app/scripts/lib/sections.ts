// Section rules for written questions, per `templates/README.md` → Sections.

import { repoRelative, type Problem, type Question } from './content.ts'
import { countWords } from './frontmatter.ts'

interface Section {
  heading: string
  line: number
  lines: string[]
}

const SECTION_ORDER = ['Answer', 'Example', 'Pitfalls', 'Follow-ups', 'Deep dive', 'Exercises']
const REQUIRED_SECTIONS = ['Answer', 'Example', 'Pitfalls']
const DEEP_DIVE_ORDER = ['How it works', 'Edge cases', 'Real-world scenario', 'Trade-offs']

const isFence = (line: string) => line.trimStart().startsWith('```')

/** Splits Markdown at headings of one level, ignoring `#` lines inside code fences. */
function splitSections(lines: string[], level: number, firstLine: number): { intro: string[]; sections: Section[] } {
  const marker = `${'#'.repeat(level)} `
  const intro: string[] = []
  const sections: Section[] = []
  let inFence = false

  lines.forEach((line, index) => {
    if (isFence(line)) inFence = !inFence
    if (!inFence && line.startsWith(marker)) {
      sections.push({ heading: line.slice(marker.length).trim(), line: firstLine + index, lines: [] })
    } else {
      const target = sections.at(-1)?.lines ?? intro
      target.push(line)
    }
  })

  return { intro, sections }
}

/** Line counts of each fenced code block. */
function codeBlocks(lines: string[]): number[] {
  const blocks: number[] = []
  let inFence = false
  for (const line of lines) {
    if (isFence(line)) {
      inFence = !inFence
      if (inFence) blocks.push(0)
    } else if (inFence) {
      blocks[blocks.length - 1]++
    }
  }
  return blocks
}

function proseWords(lines: string[]): number {
  let inFence = false
  const prose = lines.filter((line) => {
    if (isFence(line)) inFence = !inFence
    return !inFence && !isFence(line)
  })
  return countWords(prose.join(' '))
}

function checkSection(section: Section): string[] {
  const { heading, lines } = section
  const errors: string[] = []
  const blocks = codeBlocks(lines)

  switch (heading) {
    case 'Answer': {
      const words = proseWords(lines)
      if (words > 300) errors.push(`must be 300 words or fewer (has ${words})`)
      break
    }
    case 'Example':
      if (blocks.length !== 1) errors.push(`must have exactly 1 code block (has ${blocks.length})`)
      else if (blocks[0] > 30) errors.push(`code block must be 30 lines or fewer (has ${blocks[0]})`)
      break
    case 'Pitfalls': {
      const bullets = lines.filter((line) => line.startsWith('- ')).length
      if (bullets < 1 || bullets > 4) errors.push(`must have 1–4 bullets (has ${bullets})`)
      break
    }
    case 'Follow-ups': {
      const questions = lines.filter((line) => line.startsWith('**Q:**'))
      const answers = lines.filter((line) => line.startsWith('**A:**'))
      if (questions.length < 1 || questions.length > 4) errors.push(`must have 1–4 pairs (has ${questions.length})`)
      if (questions.length !== answers.length) errors.push('every `**Q:**` line needs one `**A:**` line')
      for (const answer of answers) {
        const words = countWords(answer.slice('**A:**'.length))
        if (words > 50) errors.push(`answers must be 50 words or fewer (one has ${words})`)
      }
      break
    }
    case 'Deep dive': {
      const words = proseWords(lines)
      if (words > 1500) errors.push(`must be 1,500 words or fewer (has ${words})`)
      if (blocks.length > 5) errors.push(`must have 5 code blocks or fewer (has ${blocks.length})`)
      const subsections = splitSections(lines, 3, section.line + 1).sections.map((sub) => sub.heading)
      errors.push(...checkOrder(subsections, DEEP_DIVE_ORDER, '###'))
      break
    }
    case 'Exercises': {
      const exercises = splitSections(lines, 3, section.line + 1).sections
      if (exercises.length < 1 || exercises.length > 3) errors.push(`must have 1–3 exercises (has ${exercises.length})`)
      for (const exercise of exercises) {
        if (codeBlocks(exercise.lines).length !== 1) errors.push(`"${exercise.heading}" must have exactly 1 code block`)
        if (!exercise.lines.some((line) => line.startsWith('**Answer:**'))) {
          errors.push(`"${exercise.heading}" needs an \`**Answer:**\` line`)
        }
      }
      break
    }
  }

  return errors
}

/** Headings must come from `allowed`, each at most once, in that order. */
function checkOrder(headings: string[], allowed: string[], marker: string): string[] {
  const errors: string[] = []
  let previous = -1
  for (const heading of headings) {
    const position = allowed.indexOf(heading)
    if (position === -1) errors.push(`\`${marker} ${heading}\` is not an allowed heading (${allowed.join(' · ')})`)
    else if (position <= previous) errors.push(`\`${marker} ${heading}\` is out of order or repeated`)
    else previous = position
  }
  return errors
}

/** Body problems for draft and published questions; planned stubs have no body to check. */
export function checkBody(question: Question): Problem[] {
  if (!question.meta || question.meta.status === 'planned') return []

  const file = repoRelative(question.file)
  const problems: Problem[] = []
  const { intro, sections } = splitSections(question.body.split('\n'), 2, question.bodyLine)
  const headings = sections.map((section) => section.heading)

  const strayLine = intro.findIndex((line) => line.trim() !== '')
  if (strayLine !== -1) {
    problems.push({ file, line: question.bodyLine + strayLine, message: 'text before the first `##` section' })
  }
  for (const message of checkOrder(headings, SECTION_ORDER, '##')) problems.push({ file, message })

  const required = question.meta.core ? [...REQUIRED_SECTIONS, 'Deep dive'] : REQUIRED_SECTIONS
  for (const heading of required) {
    if (!headings.includes(heading)) problems.push({ file, message: `missing \`## ${heading}\`` })
  }

  for (const section of sections) {
    for (const message of checkSection(section)) {
      problems.push({ file, line: section.line, message: `${section.heading}: ${message}` })
    }
  }

  return problems
}
