// Prerender every content page into dist/ (run by `npm run build` after the client and server builds).
// Each page becomes dist/<path>.html: the built template with the page's markup and head tags filled in.
// Also writes dist/app-shell.html (the fallback for unknown URLs), sitemap.xml and robots.txt.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ContentManifest, SearchDoc, TopicSummary } from '../src/content/types.ts'
import { SITE_NAME, SITE_URL, TAGLINE } from '../src/lib/site.ts'

interface Rendered {
  html: string
  status: number
}

interface Page {
  path: string
  description: string
  type: 'website' | 'article'
}

const HOME_DESCRIPTION = 'Interview questions for any software engineer, from the language to the spec and the engine.'
const PATHS_DESCRIPTION = 'Ordered routes through the topics for each kind of engineer.'
const ROADMAP_DESCRIPTION = 'Every topic on isobath, written and planned.'
const PRACTICE_DESCRIPTION = 'Practise questions and review flashcards.'

const distDir = path.resolve(import.meta.dirname, '../dist')

async function readJson<T>(relativePath: string): Promise<T> {
  return JSON.parse(await readFile(path.join(distDir, relativePath), 'utf8')) as T
}

/** Serves the app's `/data/` requests from dist/data, so pages load their content without a server. */
function serveDataFromDisk(): void {
  globalThis.fetch = async (input) => {
    const url = new URL(input instanceof Request ? input.url : input, SITE_URL)
    if (!url.pathname.startsWith('/data/')) throw new Error(`prerender: unexpected fetch of ${url.href}`)
    try {
      const body = await readFile(path.join(distDir, url.pathname))
      return new Response(body, { headers: { 'content-type': 'application/json' } })
    } catch {
      return new Response('Not found', { status: 404 })
    }
  }
}

function escapeHtml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

/** Turns our own generated inline HTML into one line of plain text. */
function htmlToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&amp;', '&')
    .replace(/\s+/g, ' ')
    .trim()
}

async function listPages(): Promise<Page[]> {
  const manifest = await readJson<ContentManifest>('data/manifest.json')
  const pages: Page[] = [
    { path: '/', description: HOME_DESCRIPTION, type: 'website' },
    { path: '/paths', description: PATHS_DESCRIPTION, type: 'website' },
    ...manifest.paths.map((rolePath): Page => ({ path: `/paths/${rolePath.slug}`, description: rolePath.summary || PATHS_DESCRIPTION, type: 'website' })),
    { path: '/roadmap', description: ROADMAP_DESCRIPTION, type: 'website' },
    { path: '/practice', description: PRACTICE_DESCRIPTION, type: 'website' },
  ]

  for (const overview of manifest.topics) {
    const topic = await readJson<TopicSummary>(`data/topics/${overview.slug}/index.json`)
    if (overview.stats.readable > 0) pages.push({ path: `/practice/${topic.slug}`, description: PRACTICE_DESCRIPTION, type: 'website' })
    pages.push({ path: `/${topic.slug}`, description: htmlToText(topic.summaryHtml), type: 'website' })

    // Topics without chapters have no search.json.
    const searchDocs = topic.chapters.length > 0 ? await readJson<SearchDoc[]>(`data/topics/${topic.slug}/search.json`) : []
    const tldrs = new Map(searchDocs.map((doc) => [doc.id, doc.tldr]))
    for (const chapter of topic.chapters) {
      pages.push({ path: `/${topic.slug}/${chapter.slug}`, description: htmlToText(chapter.summaryHtml), type: 'website' })
      for (const question of chapter.questions.filter((candidate) => candidate.hasPage)) {
        const description = tldrs.get(question.id)
        if (!description) throw new Error(`${question.id}: no TL;DR in search.json for the page description`)
        pages.push({ path: `/${question.id}`, description, type: 'article' })
      }
    }
  }
  return pages
}

/** `title` is already HTML-escaped by React. */
function headTags(title: string, page: Page): string {
  const url = page.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${page.path}`
  const description = escapeHtml(page.description)
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:type" content="${page.type}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    '<meta name="twitter:card" content="summary" />',
  ].join('\n    ')
}

function appShellHeadTags(title: string, description: string): string {
  return [`<title>${escapeHtml(title)}</title>`, `<meta name="description" content="${escapeHtml(description)}" />`, '<meta name="robots" content="noindex" />'].join('\n    ')
}

/**
 * Pages render their `<title>` as a leading sibling of the markup. The title moves to the head, where
 * the browser's own copy lives, so hydration matches and the document has exactly one title.
 */
function splitTitle(pagePath: string, html: string): { title: string; markup: string } {
  const match = /^<title>(.*?)<\/title>/s.exec(html)
  if (!match) throw new Error(`${pagePath}: rendered page has no leading <title>`)
  return { title: match[1], markup: html.slice(match[0].length) }
}

function outputFile(pagePath: string): string {
  return path.join(distDir, pagePath === '/' ? 'index.html' : `${pagePath}.html`)
}

async function writePage(file: string, contents: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, contents)
}

const template = await readFile(path.join(distDir, 'index.html'), 'utf8')
for (const placeholder of ['<!--app-head-->', '<!--app-html-->']) {
  if (!template.includes(placeholder)) throw new Error(`dist/index.html has no ${placeholder}: prerender has already run on it. Run \`vite build\` again first.`)
}
const fillTemplate = (head: string, markup: string) => template.replace('<!--app-head-->', () => head).replace('<!--app-html-->', () => markup)

serveDataFromDisk()
const { render } = (await import(pathToFileURL(path.resolve(distDir, '../dist-server/entry-server.js')).href)) as { render: (path: string) => Promise<Rendered> }
const pages = await listPages()

// Served for unknown URLs and client-only pages, so it must not claim to be the home page: no canonical, no og tags.
await writePage(path.join(distDir, 'app-shell.html'), fillTemplate(appShellHeadTags(`${SITE_NAME}: ${TAGLINE}`, HOME_DESCRIPTION), ''))

for (const page of pages) {
  const { html, status } = await render(page.path)
  if (status !== 200) throw new Error(`${page.path}: rendered with status ${status}`)
  const { title, markup } = splitTitle(page.path, html)
  await writePage(outputFile(page.path), fillTemplate(headTags(title, page), markup))
}

const urls = pages.map((page) => `  <url><loc>${escapeHtml(page.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${page.path}`)}</loc></url>`)
await writeFile(path.join(distDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`)
await writeFile(path.join(distDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`)

console.log(`✔ prerendered ${pages.length} pages, sitemap.xml and robots.txt`)
