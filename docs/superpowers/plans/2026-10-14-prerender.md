# Prerender and SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Every content route ships as static HTML (readable without JavaScript, indexable), then hydrates into the same React app. Add per-page head tags, `sitemap.xml`, `robots.txt`, and the Vercel config to serve it.

**Architecture:** Keep the Vite SPA. A second Vite build (`--ssr`) bundles `src/entry-server.tsx`, which renders a URL with react-router's `createStaticHandler` → `createStaticRouter` → `<StaticRouterProvider>` (all exported by react-router 8.4; `StaticRouterProvider` writes `window.__staticRouterHydrationData`, which `createBrowserRouter` reads automatically — checked in `node_modules/react-router/dist/development/lib/dom/server.js:101` and `lib/dom/lib.js:107`). `scripts/prerender.ts` renders each URL and writes `dist/<path>.html`. On the client, `main.tsx` hydrates when the root has markup, else renders fresh (dev server, app-shell fallback).

**Tech Stack:** Vite 8 SSR build, React 19 `renderToString`, react-router 8.4 static APIs, Node 24.

**Spec:** `docs/superpowers/specs/2026-10-14-isobath-redesign-design.md` → §6.

## Global Constraints
- Browser-only state (theme, reading progress, flashcard history, media queries) renders a neutral server value and updates after hydration — **never** a hydration mismatch. No module may touch `window`, `document` or `localStorage` at import time.
- Canonical origin `https://learn.sachinmaurya.com` (one constant, `SITE_URL` in `src/lib/site.ts`).
- Vercel serves real files before rewrites, and `cleanUrls: true` serves `about.html` at `/about` (verified in Vercel's `vercel.json` docs, 2026-10-14). Pages are written as `dist/<path>.html`; `dist/index.html` is the prerendered home; unknown paths rewrite to `dist/app-shell.html` (the unrendered template), so they render client-side without a mismatch.
- Prerender only stable, indexable pages: home, `/paths`, `/paths/<role>`, `/roadmap`, `/practice`, `/practice/<topic>`, every topic, every chapter, every question with a page in this build. Session pages (`/practice/<t>/<c>`, `/flashcards/<t>`) stay client-rendered.
- OG images are out of scope (no rasterizer/font source chosen yet); pages get text OG/Twitter tags only.
- Branch `v2`; one concern per commit; full gate (`content:check`, `npm test`, `tsc -b`, lint, `npm run build`) before each task is done.

## Review Focus
- No hydration warnings in the console on: home, a topic, a chapter, a question, `/practice`, `/paths/frontend` — with stored progress, flashcard history and a dark theme set.
- A prerendered page with JavaScript disabled shows its real content and working links.
- Unknown URL (`/nope/x/y/z`) still shows the in-app "not found" page.
- Production build (no drafts) prerenders no question pages and nothing breaks.
- Titles, descriptions and canonical links are unique per page and HTML-escaped.

---

### Task 1: Make the app server-safe

**Files:** `src/routes.tsx`, `src/main.tsx`, `src/lib/theme.ts`, `src/lib/site.ts`, `src/pages/QuestionPage.tsx`, `src/pages/PracticeHubPage.tsx` (and any other `useState(loadReviews)` reader), `src/content/review.ts`.

- [ ] **Step 1: Routes as data.** `routes.tsx` exports `export const routes: RouteObject[] = [...]` (same tree) and no longer calls `createBrowserRouter`. `main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import { routes } from './routes.tsx'

const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL })
const app = (
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
const root = document.getElementById('root')!
// Prerendered pages arrive with markup to hydrate; the dev server and the app shell arrive with only a placeholder comment.
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)
```

- [ ] **Step 2: Theme store without import-time browser access** — rewrite `src/lib/theme.ts`:
```ts
// Theme preference: light, dark, or follow the OS ("system"). The initial class is set by the
// inline script in index.html before first paint; this module keeps it in sync afterwards.

import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'
const listeners = new Set<() => void>()
let current: Theme | undefined

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system' // storage can be blocked (private mode, disabled cookies)
  }
}

function systemDark(): MediaQueryList {
  return window.matchMedia('(prefers-color-scheme: dark)')
}

function snapshot(): Theme {
  current ??= readStoredTheme()
  return current
}

function applyTheme(): void {
  const theme = snapshot()
  document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && systemDark().matches))
}

export function setTheme(theme: Theme): void {
  current = theme
  try {
    if (theme === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // The choice still applies for this visit.
  }
  applyTheme()
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  // Following the OS only matters once something is rendered that reads the theme.
  if (listeners.size === 0) systemDark().addEventListener('change', applyTheme)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) systemDark().removeEventListener('change', applyTheme)
  }
}

/** The stored preference; `'system'` while rendering on the server. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, snapshot, () => 'system')
}
```

- [ ] **Step 3: Flashcard history as a store.** Hydration fails if a prerendered page reads `localStorage` during its first render (`PracticeHubPage` does: `useState(loadReviews)`). Add to `review.ts` a `useReviews()` hook with `useSyncExternalStore` (server snapshot `{}`; client snapshot cached and refreshed by `saveReviews`, which notifies subscribers), and use it in `PracticeHubPage` (drop its local `reviews` state and the `onImported` plumbing if the store now updates it; keep `ProgressBackup` working). Session components (`FlashcardsPage`) are never prerendered and may keep `useState(loadReviews)`. Keep `saveReviews`' boolean result.

- [ ] **Step 4: No `window.location` in render.** `site.ts`: add `export const SITE_URL = 'https://learn.sachinmaurya.com'`. In `QuestionPage`, build the "Suggest a fix" page URL as `SITE_URL + useLocation().pathname` (call `useLocation` with the other hooks, before early returns).

- [ ] **Step 5: Verify** — `grep -rnE "^(const|let) .*(window|document|localStorage)" src` returns nothing; gate passes; `npm run dev` still works (home, topic, theme toggle, flashcard hub counts after rating a card). Commit: `refactor(app): make modules safe to render on the server`.

---

### Task 2: Server entry and a one-page spike

**Files:** Create `src/entry-server.tsx`; modify `package.json` scripts.

- [ ] **Step 1: Entry**
```tsx
// Renders one URL to HTML for the prerender step (scripts/prerender.ts). Not used by the browser bundle.

import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router'
import { routes } from './routes.tsx'
import { SITE_URL } from './lib/site.ts'

export interface Rendered {
  html: string
  status: number
}

export async function render(path: string): Promise<Rendered> {
  const handler = createStaticHandler(routes)
  const context = await handler.query(new Request(new URL(path, SITE_URL)))
  if (context instanceof Response) throw new Error(`${path}: loaders returned a redirect (${context.status}); prerender expects pages`)
  const router = createStaticRouter(handler.dataRoutes, context)
  const html = renderToString(
    <StrictMode>
      <StaticRouterProvider router={router} context={context} />
    </StrictMode>,
  )
  return { html, status: context.statusCode }
}
```
- [ ] **Step 2: Build script** — `package.json`: `"build": "npm run content:build && tsc -b && vite build && vite build --ssr src/entry-server.tsx --outDir dist-server && node scripts/prerender.ts"`. Add `dist-server` to `app/.gitignore`. (Task 3 creates `prerender.ts`; until then run the first three parts by hand.)
- [ ] **Step 3: Spike** — a throwaway script in the scratchpad (not committed) that: stubs `globalThis.fetch` so URLs whose path starts with `/data/` read `app/dist/data/<rest>` from disk and return `new Response(body, { headers: { 'content-type': 'application/json' } })` (404 Response if missing); imports `dist-server/entry-server.js`; renders `/javascript/how-javascript-runs/ecmascript-engine-host`; prints where `<title>` lands in the output (start of the string? inside the main markup?) and whether the hydration script is present. Write the result into `dist/spike.html` (template with the markup in `#root`), serve `dist/` with a minimal Node static server, open the page in Chrome, check the console for hydration errors and that `document.head` holds exactly one `<title>`. **Record the finding in the ledger**; it decides Task 3 Step 3.

---

### Task 3: Prerender script

**Files:** Create `scripts/prerender.ts`; modify `index.html` (placeholder), `vercel.json` (repo root).

- [ ] **Step 1: Template placeholder** — `index.html`: `<div id="root"><!--app-html--></div>`, and in `<head>` replace the static `<title>` and description with `<!--app-head-->` (after the theme script). The dev server still works: the root holds only a comment, so `main.tsx` (`root.firstElementChild`) creates a fresh root, and pages set their own `<title>` on the client. The prerender step fills `<!--app-head-->` with the home head for `app-shell.html`.
- [ ] **Step 2: URL list** — read `dist/data/manifest.json` and each `dist/data/topics/<slug>/index.json`: `/`, `/paths`, `/paths/<slug>` (manifest.paths), `/roadmap`, `/practice`, `/practice/<topic>` (topics with `stats.readable > 0`), `/<topic>` (all), `/<topic>/<chapter>` (all chapters), `/<topic>/<chapter>/<question>` (questions with `hasPage`).
- [ ] **Step 3: Render and head** — install the same `/data/` fetch stub as the spike, import `../dist-server/entry-server.js`, render each URL. Head tags per page, all HTML-escaped (`&`, `<`, `>`, `"`): `<title>`, `<meta name="description">`, `<link rel="canonical" href="SITE_URL + path">`, `og:title`, `og:description`, `og:url`, `og:type` (`article` for questions, else `website`), `og:site_name` = `isobath`, `twitter:card` = `summary`. Title: the page's rendered `<title>` text (per the spike: extract it from the markup and remove it there **only if** the spike shows that is what keeps hydration clean; otherwise follow the spike's finding). Description: question → its plain TL;DR (from `dist/data/topics/<t>/search.json`, field `tldr`); topic/chapter → its summary HTML with tags stripped; home and others → a fixed sentence per route. Write `dist/<path>.html` (`/` → `dist/index.html`), but first copy the untouched built template to `dist/app-shell.html` with the home title in its head.
- [ ] **Step 4: sitemap and robots** — `dist/sitemap.xml` (every prerendered URL, absolute, `<lastmod>` omitted) and `dist/robots.txt` (`User-agent: *`, `Allow: /`, `Sitemap: SITE_URL/sitemap.xml`).
- [ ] **Step 5: Vercel** — `vercel.json`: add `"cleanUrls": true`; change the rewrite destination to `/app-shell.html`; keep the `/portfolio` redirect.
- [ ] **Step 6: Verify** — `npm run build` (production) and `npm run content:build -- --drafts && vite build && …` (drafts) both succeed; count of written pages printed; `dist/javascript.html` contains the topic's chapter titles in raw HTML; serve `dist/` with a minimal Node server that mimics Vercel (`/x` → `dist/x.html` if present, else `dist/app-shell.html`; static files as is) and check in Chrome: the Review Focus pages hydrate with no console errors (with stored progress/history/dark theme), JS disabled shows content, `/nope/x/y/z` → not found, view-source shows unique title/description/canonical. Commit: `feat(app): prerender every content page with head tags, sitemap and robots`.

---

### Task 4: Docs
- [ ] Spec §6 "As built" line (file layout, app shell fallback, which routes are prerendered, OG images deferred).
- [ ] `PLAN.md` → Now: step 6 done, next step 7 (evergreen); remove the theme.ts note; add rule `R19 Prerender: every content page ships as dist/<path>.html and hydrates; no module touches window/document/localStorage at import time; browser-only state renders neutral on the server.` Update R14 hosting line if `vercel.json` semantics changed.
- [ ] Delete this plan; commit `docs: prerender step done`.
