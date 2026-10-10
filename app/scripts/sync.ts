// content:sync — rewrites README status lines and generated tables from content/ (R3).

import { writeFile } from 'node:fs/promises'
import { loadContent, repoRelative } from './lib/content.ts'
import { staleReadmes } from './lib/readme.ts'

const { topics, problems } = await loadContent()
if (problems.length > 0) {
  console.error(`✖ ${problems.length} problem(s) — fix them first (npm run content:check)`)
  process.exit(1)
}

const stale = staleReadmes(topics)
for (const { file, text } of stale) {
  await writeFile(file, text)
  console.log(`updated ${repoRelative(file)}`)
}
console.log(stale.length > 0 ? `✔ ${stale.length} README(s) updated` : '✔ READMEs already up to date')
