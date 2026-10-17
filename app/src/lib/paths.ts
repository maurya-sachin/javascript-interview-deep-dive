// Helpers for showing role paths: summaries, links and progress along them.

import type { PathStep, RolePath } from '../content/types.ts'

function joinNames(names: string[]): string {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

/** One line for the role chooser: what is ready on this path, what is being written, and how much is still planned. */
export function describePath({ steps }: RolePath): string {
  const topicsOf = (matching: PathStep[]) => [...new Set(matching.map((step) => step.topicTitle))]
  const ready = topicsOf(steps.filter((step) => step.ready))
  const inProgress = topicsOf(steps.filter((step) => !step.ready && step.started))
  const planned = steps.filter((step) => !step.ready && !step.started).length

  const parts: string[] = []
  if (ready.length > 0) parts.push(`${joinNames(ready)} ${ready.length === 1 ? 'is' : 'are'} ready`)
  if (inProgress.length > 0) parts.push(`${joinNames(inProgress)} in progress`)
  if (parts.length === 0) return 'Planned: nothing written yet'
  if (planned > 0) parts.push(`${planned} more planned`)
  return parts.join('; ')
}

export function stepPath({ topic, chapter }: PathStep): string {
  return chapter ? `/${topic}/${chapter}` : `/${topic}`
}

/** A stable React key; a topic step and a chapter step of the same topic differ. */
export function stepKey({ topic, chapter }: PathStep): string {
  return `${topic}/${chapter ?? ''}`
}

export function stepLabel({ topicTitle, chapterTitle }: PathStep): string {
  return chapterTitle ? `${topicTitle}: ${chapterTitle}` : topicTitle
}

/** Readable questions across the steps that are ready. */
export function readyQuestionCount({ steps }: RolePath): number {
  return steps.reduce((sum, step) => sum + (step.ready ? step.questionCount : 0), 0)
}

/** Questions read under this step, out of the step's total. Ids are `<topic>/<chapter>/<question>`. */
export function stepProgress({ topic, chapter, questionCount }: PathStep, read: readonly string[]): { read: number; total: number } {
  const prefix = chapter ? `${topic}/${chapter}/` : `${topic}/`
  // Ids of renamed or removed questions can linger in saved progress; never report more read than exist.
  return { read: Math.min(read.filter((id) => id.startsWith(prefix)).length, questionCount), total: questionCount }
}

/** Where a step stands for this reader: finished, readable, being written, or still planned. */
export function stepState(step: PathStep, read: readonly string[]): 'done' | 'written' | 'in-progress' | 'planned' {
  if (!step.ready) return step.started ? 'in-progress' : 'planned'
  const { read: readCount, total } = stepProgress(step, read)
  return total > 0 && readCount === total ? 'done' : 'written'
}
