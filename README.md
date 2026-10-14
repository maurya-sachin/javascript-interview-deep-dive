# isobath

*Engineering interviews, in depth.* By Sachin Maurya.

Interview questions for frontend, backend and infrastructure engineers, answered the way a strong candidate would: a 30-second answer first, then the mechanism underneath.
Not an introduction: work through a topic and you should be able to explain *why* it behaves the way it does.

Live at [learn.sachinmaurya.com](https://learn.sachinmaurya.com). The previous JavaScript-only version stays at
[maurya-sachin.github.io/javascript-interview-deep-dive](https://maurya-sachin.github.io/javascript-interview-deep-dive/) until this one has published content.

## What each question gives you

1. **30-second answer** — what you'd say first in an interview.
2. **Answer** — the full answer, one runnable example, the pitfalls interviewers probe, likely follow-ups.
3. **Deep dive** — spec and engine level, edge cases, a real-world scenario, trade-offs (on the questions asked most).
4. **Exercises** — predict-the-output and fix-the-bug puzzles.

Questions are ordered, so a topic reads like a book. The web app adds practice mode, spaced-repetition flashcards, search, filters by difficulty, and local reading progress.

## Topics

Topics are grouped into four tracks. Each has a README with its scope, chapters and what is still unmapped.

| Track | Topics |
|---|---|
| Frontend | [JavaScript](content/javascript/) · [TypeScript](content/typescript/) · [HTML and CSS](content/html-and-css/) · [Browser runtime](content/browser/) · [Accessibility](content/accessibility/) · [React](content/react/) · [Next.js](content/nextjs/) · [React Native](content/react-native/) · [State and data fetching](content/state-and-data-fetching/) |
| Backend | [Node.js](content/nodejs/) · [HTTP and APIs](content/http-and-apis/) · [Backend patterns](content/backend-patterns/) · [Databases](content/databases/) · [Caching](content/caching/) · [Messaging and jobs](content/messaging-and-jobs/) · [Authentication](content/authentication/) |
| Infrastructure and delivery | [Git](content/git/) · [CI/CD](content/ci-cd/) · [Containers and Kubernetes](content/containers-and-kubernetes/) · [Cloud and IaC](content/cloud-and-iac/) · [Networking](content/networking/) · [Observability](content/observability/) |
| Engineering practice | [Testing](content/testing/) · [Web performance](content/web-performance/) · [Web security](content/web-security/) · [Tooling](content/tooling/) · [System design](content/system-design/) · [Data structures and algorithms](content/data-structures-and-algorithms/) |

**Status:** JavaScript (26 chapters) and TypeScript (8 chapters) are fully drafted and under review; the other topics are scoped and waiting for chapters.
Nothing is marked `published` until a maintainer has reviewed it.

## Run it locally

Node 24 is required (the content scripts run TypeScript natively).

```sh
cd app
npm ci
npm run dev      # builds content including drafts, then starts Vite
```

Other commands: `npm run content:check` (validate all content), `npm run build` (production build), `npm run lint`. The full list is in [`templates/README.md`](templates/README.md).

## Layout

```
content/<topic>/<NN-chapter>/<NNN-question>.md   one Markdown file per question
content/flashcards/<topic>.yaml                  recall cards
templates/                                       the writing guide and file templates
app/                                             client-only React app (Vite, Tailwind, shadcn/ui)
PLAN.md                                          open work and settled rules
```

The app reads JSON generated from `content/` at build time; there is no backend. It deploys on Vercel from the repo root (`vercel.json`), and `/portfolio` redirects to the author's portfolio.

## Contributing

Every question is one Markdown file. See [`templates/README.md`](templates/README.md) for the format and how to send a PR. Open work is in [`PLAN.md`](PLAN.md).

## License

[MIT](LICENSE)
