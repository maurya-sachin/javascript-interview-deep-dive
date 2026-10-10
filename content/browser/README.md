# Browser runtime

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

What the browser adds around the language: the DOM, events, the rendering pipeline, the HTML event loop, and Web APIs.
Frontend interviews test this layer constantly — "why is this click handler slow" is a browser question, not a framework one.

## Scope

- **In:** the DOM and events, the HTML event loop (tasks, microtasks, rendering steps), the rendering pipeline, and Web APIs (fetch, streams, storage, workers, observers, history and navigation, Web Components).
- **Out:** the language → [JavaScript](../javascript/) · markup and CSS → [HTML and CSS](../html-and-css/) · measuring and fixing slowness → [Web performance](../web-performance/) · same-origin policy, CORS, XSS → [Web security](../web-security/).

## Prerequisites

[JavaScript](../javascript/) — especially Promises and the event loop chapter.

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- The DOM: tree, nodes vs elements, live vs static collections, traversal and mutation
- Events: dispatch, capture/bubble, delegation, default actions, custom events, `AbortSignal` for listeners
- The HTML event loop: tasks, microtasks, `requestAnimationFrame`, `requestIdleCallback`, rendering opportunities
- Rendering pipeline: parsing, style, layout, paint, compositing; script loading (`defer`, `async`, modules)
- Networking: `fetch`, streams, `AbortController`, WebSockets, Server-Sent Events
- Storage: cookies, Web Storage, IndexedDB, Cache API, storage quotas
- Workers: dedicated, shared, and service workers; `postMessage` and transferables
- Observers: Intersection, Resize, Mutation, Performance
- Navigation: History API, Navigation API, View Transitions
- Web Components: custom elements, shadow DOM, templates and slots

## Sources

- [HTML Living Standard](https://html.spec.whatwg.org/) — event loop, scripting, navigation
- [DOM Standard](https://dom.spec.whatwg.org/)
- [Fetch Standard](https://fetch.spec.whatwg.org/)
- [MDN Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)
- [Chrome for Developers blog](https://developer.chrome.com/blog) — rendering engine internals
