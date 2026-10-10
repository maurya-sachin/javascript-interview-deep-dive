// content:sync — rewrites README status lines and generated tables from content/ (R3).

import { loadContent } from './lib/content.ts'
import { repoRelative } from './lib/paths.ts'
import { writeStaleReadmes } from './lib/readme.ts'

const { topics, problems } = await loadContent()
if (problems.length > 0) {
  console.error(`✖ ${problems.length} problem(s) — fix them first (npm run content:check)`)
  process.exit(1)
}

const written = await writeStaleReadmes(topics)
for (const file of written) console.log(`updated ${repoRelative(file)}`)
console.log(written.length > 0 ? `✔ ${written.length} README(s) updated` : '✔ READMEs already up to date')
