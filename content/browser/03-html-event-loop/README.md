# 03 — The HTML event loop

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

The browser's event loop beyond tasks and microtasks: where rendering happens, animation frames, timer accuracy, task priorities and idle callbacks. The language-level loop is in JavaScript's async chapter.

## Learning goals

After this chapter you can:

- Place rendering, `requestAnimationFrame` and microtasks in one loop iteration
- Explain why a `setTimeout(fn, 0)` rarely runs after 0 ms
- Schedule work by priority with `scheduler.postTask()` and `scheduler.yield()`
- Say what `requestIdleCallback` does and doesn't promise

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Processing model: task, microtask checkpoint, update the rendering; rendering opportunities → —
- `requestAnimationFrame`: when callbacks run, batching per frame, background tabs → —
- Timers: nesting clamp, minimum delay, background throttling, `setInterval` drift → —
- Task sources and priority: `scheduler.postTask()`, `scheduler.yield()`, `MessageChannel` tasks → —
- `requestIdleCallback`: deadlines, `timeout`, when it never runs → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
<!-- generated:questions:end -->

## Sources

- [HTML — Event loop processing model](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model)
- [HTML — Animation frames](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames)
- [HTML — Timers](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers)
- [Cooperative Scheduling of Background Tasks](https://w3c.github.io/requestidlecallback/)
- [Prioritized Task Scheduling](https://wicg.github.io/scheduling-apis/)
