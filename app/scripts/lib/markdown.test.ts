import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderBlock } from './markdown.ts'

const outputLines = async (lang: string, code: string) =>
  (await renderBlock(`\`\`\`${lang}\n${code}\n\`\`\``)).match(/class="line output"/g)?.length ?? 0

test('marks `// →` output lines in JavaScript', async () => {
  assert.equal(await outputLines('js', 'const a = 1 + 2\n// → 3'), 1)
})

test('marks `/* → */` output lines in CSS and `<!-- → -->` output lines in HTML', async () => {
  assert.equal(await outputLines('css', '.box { width: 200px; }\n/* → 200px wide */'), 1)
  assert.equal(await outputLines('html', '<p>One<div>Two</div>\n<!-- → <p>One</p><div>Two</div> -->'), 1)
})

test('leaves ordinary comments unmarked', async () => {
  assert.equal(await outputLines('js', '// a note\nconst a = 1'), 0)
  assert.equal(await outputLines('css', '/* a note */\n.box { color: red; }'), 0)
  assert.equal(await outputLines('html', '<!-- a note -->\n<p>Hi</p>'), 0)
})
