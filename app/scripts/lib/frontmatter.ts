// Question frontmatter, per `templates/README.md` → Question lifecycle and Frontmatter.

import { z } from 'zod'

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

const kebabCase = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be lowercase kebab-case')

const always = {
  title: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  frequency: z.int().min(1).max(5),
  core: z.boolean(),
}

const whenWritten = {
  ...always,
  tags: z.array(kebabCase),
  related: z.array(z.string().min(1)),
  verified: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'must be `YYYY-MM`'),
  sources: z.array(z.url()).min(1),
  tldr: z.string().refine((text) => countWords(text) <= 60, 'must be 60 words or fewer'),
}

export const frontmatterSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('planned'), ...always }),
  z.strictObject({ status: z.literal('draft'), ...whenWritten }),
  z.strictObject({ status: z.literal('published'), ...whenWritten }),
])

export type Frontmatter = z.infer<typeof frontmatterSchema>
export type Status = Frontmatter['status']
