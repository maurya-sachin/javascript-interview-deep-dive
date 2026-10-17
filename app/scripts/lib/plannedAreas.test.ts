import assert from 'node:assert/strict'
import { test } from 'node:test'
import { plannedAreas } from './plannedAreas.ts'

const readme = `# Topic

## Chapters

- 01 Not this one: a chapter

## Not yet mapped

Areas this topic owns that have no chapter yet.

- Semantic HTML: document outline, landmarks
- The \`<dialog>\` element: modal and non-modal
- Transitions and animations
- Design patterns (module, observer)

## Sources

- MDN: not an area
`

test('reads the area names under Not yet mapped only', () => {
  assert.deepEqual(plannedAreas(readme), ['Semantic HTML', 'The `<dialog>` element', 'Transitions and animations', 'Design patterns'])
})

test('a README without the section has no planned areas', () => {
  assert.deepEqual(plannedAreas('# Topic\n\n## Chapters\n\n- 01 A: b\n'), [])
})
