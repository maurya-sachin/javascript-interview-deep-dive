# 18 — Async functions and the event loop

> **Status:** 🔴 planned · **Published:** 0/7 · **Last verified:** —

How JavaScript schedules work — jobs, tasks, and microtasks — how `async`/`await` maps onto promises, and how to run and cancel async work well.

## Learning goals

After this chapter you can:

- Explain the event loop and predict task vs microtask order
- Describe what `await` does in terms of promise jobs
- Run async work sequentially, in parallel, or with a concurrency limit
- Cancel async work with `AbortSignal`

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Run-to-completion, the call stack, and the job queue → 010
- ECMAScript jobs vs the host's event loop (HTML, Node.js) → 010
- Tasks vs microtasks; `queueMicrotask`; microtask starvation → 020
- Timer delays and clamping → 020
- `async` functions return promises; `await` and promise reactions → 030
- Sequential vs parallel awaits; `await` in `for`, `forEach`, `for await` → 040
- Agents, workers, run-to-completion across threads → 050
- `AbortController`, `AbortSignal.timeout`, `AbortSignal.any` → 060
- Promise pools, retry with backoff → 070

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How does the event loop work?](010-event-loop.md) | medium | 🟡 draft |
| 020 | [Predict the order: `setTimeout` vs promises vs `queueMicrotask`.](020-task-microtask-ordering.md) | medium | 🟡 draft |
| 030 | [How does `async`/`await` work under the hood?](030-async-await-mechanics.md) | hard | 🟡 draft |
| 040 | [Sequential vs parallel `await` — and `await` inside loops?](040-sequential-vs-parallel-await.md) | medium | 🟡 draft |
| 050 | [Is JavaScript single-threaded?](050-single-threaded.md) | medium | 🟡 draft |
| 060 | [How do you cancel async work?](060-cancelling-async-work.md) | medium | 🟡 draft |
| 070 | [Implement a concurrency-limited task runner with retry.](070-concurrency-limit-retry.md) | hard | 🟡 draft |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Jobs](https://tc39.es/ecma262/#sec-jobs) · [Async function definitions](https://tc39.es/ecma262/#sec-async-function-definitions) · [Await](https://tc39.es/ecma262/#await) · [Agents](https://tc39.es/ecma262/#sec-agents)
- **Hosts:** [HTML event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops) · [DOM AbortController](https://dom.spec.whatwg.org/#interface-abortcontroller)
- **MDN:** [Execution model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model) · [Microtask guide](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide) · [async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) · [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
