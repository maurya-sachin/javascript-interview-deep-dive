// GitHub Pages serves 404.html for any path it doesn't have. Copying the app shell there lets deep links
// (/javascript/closures/...) load the app, which then routes client-side.

import { copyFile } from 'node:fs/promises'
import path from 'node:path'

const dist = path.resolve(import.meta.dirname, '../dist')
await copyFile(path.join(dist, 'index.html'), path.join(dist, '404.html'))
