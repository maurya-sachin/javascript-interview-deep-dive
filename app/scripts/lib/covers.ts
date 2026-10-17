// The optional `> **Covers:**` line of a topic README (templates/README.md).

const COVERS_PREFIX = '> **Covers:**'
const TRACK_PREFIX = '> **Track:**'
const MAX_WORDS = 15

/** Why a README's Covers line is invalid, or `null` when it is valid or absent. */
export function coversProblem(readme: string): string | null {
  const lines = readme.split('\n')
  const at = lines.findIndex((line) => line.startsWith(COVERS_PREFIX))
  if (at === -1) return null
  const text = lines[at].slice(COVERS_PREFIX.length).trim()
  if (text === '') return '`> **Covers:**` line is empty; fill it in or remove it'
  if (!lines[at + 1]?.startsWith(TRACK_PREFIX)) return '`> **Covers:**` line must sit directly above the `> **Track:**` line'
  const words = text.split(/\s+/).length
  if (words > MAX_WORDS) return `\`> **Covers:**\` line has ${words} words; keep it to ${MAX_WORDS} or fewer`
  return null
}
