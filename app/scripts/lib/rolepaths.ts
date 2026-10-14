// Role paths: content/paths/<role>.yaml, per `templates/README.md` → Paths.

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'
import { z } from 'zod'
import type { PathStep, RolePath } from '../../src/content/types.ts'
import { countWords } from './frontmatter.ts'
import { contentDir, repoRelative, type Problem } from './paths.ts'

const pathsDir = path.join(contentDir, 'paths')
const KEBAB = '[a-z0-9]+(?:-[a-z0-9]+)*'

const wordLimit = (limit: number) => (text: string) => countWords(text) <= limit

const stepSchema = z.strictObject({
  ref: z.string().regex(new RegExp(`^${KEBAB}(?:/${KEBAB})?$`), 'must be `<topic>` or `<topic>/<chapter>`'),
  why: z.string().min(1).refine(wordLimit(25), 'must be 25 words or fewer'),
})

const pathSchema = z.strictObject({
  title: z.string().min(1),
  summary: z.string().min(1).refine(wordLimit(30), 'must be 30 words or fewer'),
  order: z.number().int().positive(),
  start: z.string().min(1).optional(),
  steps: z.array(stepSchema).min(1),
})

export interface RolePathSource extends z.infer<typeof pathSchema> {
  slug: string
  file: string
}

/** The parts of a topic the path rules need; both the content loader's `Topic` and the app's summary fit. */
export interface TopicLike {
  slug: string
  title: string
  chapters: { slug: string; title: string; questions: unknown[] }[]
}

/** A resolved path before its start question is rendered (the build adds that). */
export type ResolvedPath = Omit<RolePath, 'start'> & { startId: string | null }

export async function loadRolePaths(problems: Problem[]): Promise<RolePathSource[]> {
  let names: string[]
  try {
    names = (await readdir(pathsDir)).filter((name) => !name.startsWith('.')).sort()
  } catch {
    return [] // no paths yet
  }

  const paths: RolePathSource[] = []
  for (const name of names) {
    const file = path.join(pathsDir, name)
    if (!name.endsWith('.yaml')) {
      problems.push({ file: repoRelative(file), message: 'path files must be `<role>.yaml`' })
      continue
    }
    const parsed = await parsePath(file, problems)
    if (parsed) paths.push({ ...parsed, slug: name.slice(0, -'.yaml'.length), file: repoRelative(file) })
  }
  return paths
}

async function parsePath(file: string, problems: Problem[]) {
  let data: unknown
  try {
    data = parseYaml(await readFile(file, 'utf8'))
  } catch (error) {
    problems.push({ file: repoRelative(file), message: `not valid YAML: ${(error as Error).message}` })
    return undefined
  }
  const result = pathSchema.safeParse(data)
  if (result.success) return result.data
  for (const issue of result.error.issues) {
    problems.push({ file: repoRelative(file), message: `${issue.path.join('.') || 'file'}: ${issue.message}` })
  }
  return undefined
}

/** Every entry names an existing topic (and chapter), appears once, and `start` is a real question. */
export function validateRolePaths(paths: RolePathSource[], topics: TopicLike[], questionIds: ReadonlySet<string>): Problem[] {
  const problems: Problem[] = []
  const owners = new Map<number, string>()
  for (const rolePath of paths) {
    const { file } = rolePath
    const owner = owners.get(rolePath.order)
    if (owner !== undefined) problems.push({ file, message: `order ${rolePath.order} is already used by \`${owner}\`` })
    else owners.set(rolePath.order, rolePath.slug)

    if (rolePath.start !== undefined && !questionIds.has(rolePath.start)) problems.push({ file, message: `start: unknown question \`${rolePath.start}\`` })

    const seen = new Set<string>()
    for (const { ref } of rolePath.steps) {
      if (seen.has(ref)) problems.push({ file, message: `entry \`${ref}\` appears twice` })
      seen.add(ref)
      const [topicSlug, chapterSlug] = ref.split('/')
      const topic = topics.find((candidate) => candidate.slug === topicSlug)
      if (!topic) problems.push({ file, message: `unknown topic \`${topicSlug}\` in entry \`${ref}\`` })
      else if (chapterSlug !== undefined && !topic.chapters.some((chapter) => chapter.slug === chapterSlug)) {
        problems.push({ file, message: `unknown chapter \`${ref}\`` })
      }
    }
  }
  return problems
}

/** Resolves valid paths (run `validateRolePaths` first) against the content, sorted by `order`. */
export function resolveRolePaths(paths: RolePathSource[], topics: TopicLike[]): ResolvedPath[] {
  return [...paths]
    .sort((a, b) => a.order - b.order)
    .map(({ slug, title, summary, start, steps }) => ({
      slug,
      title,
      summary,
      startId: start ?? null,
      steps: steps.map(({ ref, why }): PathStep => {
        const [topicSlug, chapterSlug] = ref.split('/')
        const topic = topics.find((candidate) => candidate.slug === topicSlug)!
        const chapter = chapterSlug === undefined ? null : topic.chapters.find((candidate) => candidate.slug === chapterSlug)!
        const questionCount = (chapter ? [chapter] : topic.chapters).reduce((sum, entry) => sum + entry.questions.length, 0)
        return {
          topic: topic.slug,
          topicTitle: topic.title,
          chapter: chapter?.slug ?? null,
          chapterTitle: chapter?.title ?? null,
          why,
          ready: topic.chapters.length > 0,
          questionCount,
        }
      }),
    }))
}
