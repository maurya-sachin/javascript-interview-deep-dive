# 08 — Observers

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Asynchronous callbacks for things the page would otherwise poll for: visibility, size, and DOM mutations, and where each observer's callback runs in the event loop.

## Learning goals

After this chapter you can:

- Replace scroll handlers with an IntersectionObserver
- Respond to element size changes without causing a resize loop
- Watch DOM changes with MutationObserver and explain its batching
- Order observer callbacks against events, microtasks and rendering

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- IntersectionObserver: root, `rootMargin`, thresholds; lazy loading and visibility tracking → —
- ResizeObserver: observed boxes, the "loop completed with undelivered notifications" error → —
- MutationObserver: options, records, batching in a microtask → —
- When each observer's callback runs relative to events, microtasks and rendering → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
<!-- generated:questions:end -->

## Sources

- [Intersection Observer](https://w3c.github.io/IntersectionObserver/)
- [Resize Observer](https://drafts.csswg.org/resize-observer/)
- [DOM — Mutation observers](https://dom.spec.whatwg.org/#mutation-observers)
