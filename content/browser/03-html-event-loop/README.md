# 03 — The HTML event loop

> **Status:** 🔴 planned · **Published:** 0/5 · **Last verified:** —

The browser's event loop beyond tasks and microtasks: where rendering happens, animation frames, timer accuracy, task priorities and idle callbacks. The language-level loop is in JavaScript's async chapter.

## Learning goals

After this chapter you can:

- Place rendering, `requestAnimationFrame` and microtasks in one loop iteration
- Explain why a `setTimeout(fn, 0)` rarely runs after 0 ms
- Schedule work by priority with `scheduler.postTask()` and `scheduler.yield()`
- Say what `requestIdleCallback` does and doesn't promise

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Processing model: task, microtask checkpoint, update the rendering; rendering opportunities → 010
- `requestAnimationFrame`: when callbacks run, batching per frame, background tabs → 020
- Timers: minimum delay, background throttling, `setInterval` drift → 030
- Task sources and priority: `scheduler.postTask()`, `scheduler.yield()`, `MessageChannel` tasks → 040
- `requestIdleCallback`: deadlines, `timeout`, when it never runs → 050

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [Where does rendering happen in the event loop?](010-rendering-steps.md) | hard | 🟡 draft |
| 020 | [How does `requestAnimationFrame` work, and when do its callbacks run?](020-request-animation-frame.md) | medium | 🟡 draft |
| 030 | [Why doesn't `setTimeout(fn, 0)` run after 0 ms?](030-timer-accuracy.md) | medium | 🟡 draft |
| 040 | [How do you schedule work by priority with `scheduler.postTask()` and `scheduler.yield()`?](040-task-priority-and-scheduler.md) | hard | 🟡 draft |
| 050 | [What does `requestIdleCallback` guarantee, and when does it never run?](050-request-idle-callback.md) | medium | 🟡 draft |
<!-- generated:questions:end -->

## Sources

- [HTML — Event loop processing model](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model)
- [HTML — Animation frames](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames)
- [HTML — Timers](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers)
- [Cooperative Scheduling of Background Tasks](https://w3c.github.io/requestidlecallback/)
- [Prioritized Task Scheduling](https://wicg.github.io/scheduling-apis/)
