// Repository paths and the problem report shape, shared by every content module.

import path from 'node:path'

export const repoRoot = path.resolve(import.meta.dirname, '../../..')
export const contentDir = path.join(repoRoot, 'content')

export interface Problem {
  file: string
  line?: number
  message: string
}

export function repoRelative(file: string): string {
  return path.relative(repoRoot, file)
}
