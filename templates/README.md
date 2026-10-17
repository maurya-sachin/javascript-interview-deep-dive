# Writing guide

How content in this repo is organised and written. Follow it for every topic, chapter, and question —
it's the contract the build checks against.

Templates to copy:

| You're adding | Copy |
|---|---|
| A topic (e.g. `javascript`) | [`topic-README.md`](topic-README.md) → `content/<topic>/README.md` |
| A chapter | [`chapter-README.md`](chapter-README.md) → `content/<topic>/<NN-chapter>/README.md` |
| A question | [`question.md`](question.md) → `content/<topic>/<NN-chapter>/<NNN-slug>.md` |

## Layout

```
content/
  javascript/
    README.md                                   topic overview
    04-closures/
      README.md                                 chapter overview
      010-what-is-a-closure.md                  one question per file
      020-what-a-closure-keeps-alive.md
```

- **Numbers set reading order.** Chapters use two digits (`01`, `02`, …). Questions use three digits in steps of 10 (`010`, `020`, …) so a question can be inserted (`015`) without renumbering. Inserting a chapter renumbers the folders after it; ids don't change.
- **The id comes from the path**, with number prefixes and `.md` removed: `javascript/closures/what-a-closure-keeps-alive`. Reordering never breaks an id. Never write ids, topic names, or counts by hand.
- **Slugs** are kebab-case, ≤ 6 words, and name the concept rather than repeat the title.

## Adding content

Start from the concept, not from a free file number:

1. **Topic.** Each topic README's **Scope** says what it owns and links to where the rest lives (e.g. DOM APIs → browser runtime, not `javascript`).
2. **Chapter.** Pick one from the topic's chapter table. If none fits, add the area to the topic's **Not yet mapped** list.
3. **Coverage.** Find the concept in the chapter's **Sub-topics**. Covered → improve that question instead. Ends in `→ —` → it's a known gap; take it. Missing → add it as a sub-topic.
4. **Stub.** Create it with `npm run content:new` (pass `--number 015` to insert between neighbours), then point the sub-topic at it.

Gaps live only in READMEs — sub-topics ending in `→ —` and **Not yet mapped** lists — so browsing the repo shows what's missing and where it goes.

## Question lifecycle

| `status` | Meaning | Required |
|---|---|---|
| `planned` | The question exists; nothing written yet | `title`, `difficulty`, `frequency`, `core` |
| `draft` | Written and self-checked, awaiting maintainer review | everything below |
| `published` | Reviewed and live | everything below |

The app labels written questions **Draft** (`draft`), **Reviewed** (`published`) or **Legacy** (any written question with `legacy`).
A question is **stale** when `verified` is 12 or more months before the build month; the app then says it may be out of date.

## Question format

### Frontmatter

| Field | Type | Notes |
|---|---|---|
| `title` | string | Phrased the way an interviewer asks it |
| `status` | `planned` \| `draft` \| `published` | |
| `difficulty` | `easy` \| `medium` \| `hard` | |
| `frequency` | 1–5 | How often it's asked; 5 = almost every interview |
| `core` | boolean | `true` makes the deep dive required. Set it on every `frequency: 5` question; use it on lower-frequency questions only when depth is the point |
| `tags` | string[] | Lowercase, kebab-case |
| `related` | id[] | Other questions this builds on or leads to |
| `verified` | `YYYY-MM` | When the facts were last checked against `sources` |
| `legacy` | string | Optional, written questions only, ≤ 30 words. Why the question is kept for history (for example, the old way of doing something); shows a Legacy label |
| `perishable` | string[] | Optional, written questions only, each ≤ 12 words. Facts likely to change (versions, flags, limits), so a review pass can find them |
| `sources` | URL[] | Primary sources only — see [Research](#research) |
| `tldr` | string | ≤ 60 words — the 30-second answer |

### Sections

Use exactly these `##` headings, in this order. Leave out optional ones entirely; don't add others.

| Section | Required | Limit | Job |
|---|---|---|---|
| `## Answer` | yes | ≤ 300 words | The full interview answer |
| `## Example` | yes | 1 code block, ≤ 30 lines | The one example that makes it click |
| `## Pitfalls` | yes | 1–4 bullets | Mistakes interviewers probe for |
| `## Follow-ups` | no | 0–4 pairs, answers ≤ 50 words | `**Q:**` / `**A:**` lines |
| `## Deep dive` | if `core: true` | ≤ 1,500 words, ≤ 5 code blocks | `###` subsections from: How it works · Edge cases · Real-world scenario · Trade-offs |
| `## Exercises` | no | 1–3 items | Each a `###` heading, a code block, and an `**Answer:**` line |

## Writing rules

- **Interview first.** `tldr` and `## Answer` are what you'd say out loud; depth goes in `## Deep dive`.
- **Current behaviour.** Describe the current ECMAScript edition and current engines. Legacy behaviour gets one sentence starting with *Legacy:*.
- **One concept per question.** If you're explaining a second concept, link it in `related` instead.
- **Be exact.** Name the spec mechanism (e.g. *Environment Record*, *[[Prototype]]*) when it explains the behaviour; say when something is engine-specific (e.g. *In V8, …*).
- **No filler.** No emoji headings, no "In this article…", no "Great question".
- **Code:**
  - JavaScript by default; TypeScript in TypeScript topics (and where a topic is about typed code); other languages and configs (SQL, YAML, Dockerfiles, shell) only where the topic is about them.
  - JavaScript must run as written in current Node.js or a modern browser; assume module code (strict mode) and say so when sloppy mode matters.
  - TypeScript must be type-checked with a real `tsc` (`--strict`); state the TypeScript version, and make every `// Error` comment match what `tsc` printed.
  - Configs and commands must be run for real (a scratch project, a container, a local database) before you show their output.
  - Show output as `// → value` comments.

## Research

Every claim must be traceable to a primary source listed in `sources`:

1. ECMAScript specification — [tc39.es/ecma262](https://tc39.es/ecma262/)
2. TC39 proposals — [github.com/tc39/proposals](https://github.com/tc39/proposals)
3. MDN — [developer.mozilla.org](https://developer.mozilla.org/)
4. Engine and runtime teams — [v8.dev](https://v8.dev/), [nodejs.org/docs](https://nodejs.org/docs/latest/api/), WebKit/SpiderMonkey blogs
5. Official docs of the library or tool in question; for other topics, the standard that defines it (RFCs, WHATWG/W3C specs, the language's own spec) and the vendor's official docs

Blog posts and tutorials can point you somewhere; they're never the source.
Never copy text from other books or courses — write your own explanation.
Run every code example and exercise; the printed output must match the `// →` comments.

## README status lines

Topic and chapter READMEs start with a status line:

```
> **Status:** 🔴 planned · **Published:** 0/12 · **Last verified:** —
```

🔴 planned (nothing published) · 🟡 in progress (some published) · 🟢 complete (all published).
**Last verified** is the oldest `verified` among published questions.

Topic READMEs (not chapters) put a hand-written track line directly above it, in the same blockquote:

```
> **Track:** Backend
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —
```

A topic README may add one more hand-written line to the same blockquote, directly above the track: `> **Covers:** …`.
It names the versions and engines the topic is checked against, in 15 words or fewer. Leave it out when the topic has no versions to name. `content:check` fails an empty line, one over 15 words, or one that is not immediately followed by the track line.

| Track | Topics |
|---|---|
| Frontend | `javascript` `typescript` `html-and-css` `browser` `accessibility` `react` `nextjs` `react-native` `state-and-data-fetching` |
| Backend | `nodejs` `http-and-apis` `backend-patterns` `databases` `caching` `messaging-and-jobs` `authentication` |
| Infrastructure and delivery | `git` `ci-cd` `containers-and-kubernetes` `cloud-and-iac` `networking` `observability` |
| Engineering practice | `testing` `web-performance` `web-security` `tooling` `system-design` `data-structures-and-algorithms` |

The status line and the blocks between `<!-- generated:… -->` markers are generated — run `npm run content:sync`, never edit them by hand.
Elsewhere, mark unknowns with ❓ — never guess.

## Flashcards

Flashcards are short recall prompts, separate from questions (R8). One file per topic: `content/flashcards/<topic>.yaml`, where `<topic>` is an existing topic folder. The file is a list of cards:

```yaml
- id: closure-captures-binding
  front: What does a closure capture — a value or a binding?
  back: The binding. It sees later assignments to the variable.
  question: javascript/closures/what-is-a-closure
```

| Field | Required | Rule |
|---|---|---|
| `id` | yes | Kebab-case, unique within the file. It keys the learner's review history, so **never change it** once published — add a new card instead |
| `front` | yes | ≤ 30 words; inline Markdown only |
| `back` | yes | ≤ 60 words; inline Markdown only |
| `question` | yes | Id of the question that explains it; must exist |

A production build ships a card only when its `question` is published.

One fact per card. If the back needs a code block, it belongs in a question instead.

## Paths

A path is an ordered route through the topics for one kind of engineer; the home page's "What are you preparing as?" list shows them. One file per role: `content/paths/<role>.yaml`, where the filename is the URL slug (`/paths/<role>`).

```yaml
title: Frontend engineer
summary: The language first, then the browser and frameworks, then performance, security and design.
order: 1
start: javascript/how-javascript-runs/ecmascript-engine-host
steps:
  - ref: javascript
    why: Every frontend interview starts at the language.
  - ref: react
    why: The most-asked framework.
```

| Field | Required | Rule |
|---|---|---|
| `title` | yes | The role, as the reader would say it |
| `summary` | yes | ≤ 30 words |
| `order` | yes | Position on the home page; unique across paths |
| `start` | no | Id of the question to open first; must exist. The home page's "Start here" uses the first path that sets one |
| `steps[].ref` | yes | `<topic>` or `<topic>/<chapter>`; must exist and appear once per path; don't list a chapter when its whole topic is already on the path. A topic with no chapters yet can be named by topic only. A step shows as planned until it has published questions |
| `steps[].why` | yes | ≤ 25 words: why this step is on the path |

Counts, readiness and reading time are derived at build time; never write them. Topic folders can't be named `paths`, `practice`, `flashcards`, `roadmap` or `changelog` (those are app routes). `content:check` validates all of this.

## Contributing

1. Pick a `planned` question (or propose a new one in an issue first).
2. Research it and write it to this guide. Set `status: draft` and `verified`.
3. Run `npm run content:check` — it must pass.
4. Open a PR with one question per PR. A maintainer reviews it and sets `status: published`.

Commands (Node 24, run in `app/`):

| Command | What it does |
|---|---|
| `npm run content:check` | Validates every topic, chapter, and question against this guide; fails on any problem |
| `npm run content:sync` | Regenerates README status lines and `generated:` tables |
| `npm run content:status [topic]` | Published counts per chapter and every `→ —` gap |
| `npm run content:status -- --stale [topic]` | Written questions to re-check, oldest first: stale ones and any with `perishable` notes |
| `npm run content:new -- <topic>/<chapter> <slug> "<title>" --difficulty <d> --frequency <1-5> [--core] [--number NNN]` | Creates a `planned` stub, then syncs READMEs |
| `npm run content:build [-- --drafts]` | Compiles content into `app/public/data/` (published only; `--drafts` adds drafts) |
| `npm run dev` | Builds content with drafts and starts the app |

Fixes to existing questions are welcome the same way. Content is licensed under the repo's [MIT License](../LICENSE).
