# Browser runtime

> **Track:** Frontend
> **Status:** 🔴 planned · **Published:** 0/37 · **Last verified:** —

What the browser adds around the language: the DOM, events, the rendering pipeline, the HTML event loop, and Web APIs.
Frontend interviews test this layer constantly — "why is this click handler slow" is a browser question, not a framework one.

## Scope

- **In:** the DOM and events, the HTML event loop (rendering steps, animation frames, timers, scheduling), the rendering pipeline and script loading, and Web APIs (fetch, streams, storage, workers, observers, history and navigation, Web Components).
- **Out:** the language, the job queue, cancellation and modules → [JavaScript](../javascript/) · markup and CSS → [HTML and CSS](../html-and-css/) · measuring and fixing slowness → [Web performance](../web-performance/) · same-origin policy, CORS, XSS, cookie attributes as defences → [Web security](../web-security/) · WebSockets, Server-Sent Events, long polling → [HTTP and APIs](../http-and-apis/).

## Prerequisites

[JavaScript](../javascript/) — especially Promises and the event loop chapter.

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
| 01 | [The DOM](01-the-dom/) | 🔴 |
| 02 | [Events](02-events/) | 🔴 |
| 03 | [The HTML event loop](03-html-event-loop/) | 🔴 |
| 04 | [The rendering pipeline](04-rendering-pipeline/) | 🔴 |
| 05 | [Network APIs](05-network-apis/) | 🔴 |
| 06 | [Storage](06-storage/) | 🔴 |
| 07 | [Workers](07-workers/) | 🔴 |
| 08 | [Observers](08-observers/) | 🔴 |
| 09 | [Navigation and page lifecycle](09-navigation/) | 🔴 |
| 10 | [Web Components](10-web-components/) | 🔴 |
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

None — every area has a chapter.

## Sources

- [HTML Living Standard](https://html.spec.whatwg.org/) — event loop, scripting, navigation
- [DOM Standard](https://dom.spec.whatwg.org/)
- [Fetch Standard](https://fetch.spec.whatwg.org/)
- [MDN Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)
- [Chrome for Developers blog](https://developer.chrome.com/blog) — rendering engine internals
