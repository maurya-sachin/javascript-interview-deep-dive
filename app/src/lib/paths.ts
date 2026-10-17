// Helpers for showing role paths: summaries, links and progress along them.

import type { PathStep, RolePath } from '../content/types.ts'

function joinNames(names: string[]): string {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

/** One line for the role chooser: what is ready on this path and how much is still planned. */
export function describePath({ steps }: RolePath): string {
  const ready = steps.filter((step) => step.ready)
  if (ready.length === 0) return 'Roadmap only: nothing published yet'
  const planned = steps.length - ready.length
  const names = [...new Set(ready.map((step) => step.topicTitle))]
  const sentence = `${joinNames(names)} ${names.length === 1 ? 'is' : 'are'} ready`
  return planned > 0 ? `${sentence}; ${planned} more planned` : sentence
}

export function stepPath({ topic, chapter }: PathStep): string {
  return chapter ? `/${topic}/${chapter}` : `/${topic}`
}

/** Questions read under this step, out of the step's total. Ids are `<topic>/<chapter>/<question>`. */
export function stepProgress({ topic, chapter, questionCount }: PathStep, read: readonly string[]): { read: number; total: number } {
  const prefix = chapter ? `${topic}/${chapter}/` : `${topic}/`
  // Ids of renamed or removed questions can linger in saved progress; never report more read than exist.
  return { read: Math.min(read.filter((id) => id.startsWith(prefix)).length, questionCount), total: questionCount }
}

/** Where a step stands for this reader: finished, readable, or still planned. */
export function stepState(step: PathStep, read: readonly string[]): 'done' | 'written' | 'planned' {
  if (!step.ready) return 'planned'
  const { read: readCount, total } = stepProgress(step, read)
  return total > 0 && readCount === total ? 'done' : 'written'
}
