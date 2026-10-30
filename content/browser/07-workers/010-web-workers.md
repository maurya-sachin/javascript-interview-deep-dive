---
title: "What are Web Workers, and what can't they do?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [web-workers, dedicated-worker, module-worker, threads, postmessage]
related:
  - javascript/async-and-the-event-loop/single-threaded
  - browser/workers/structured-clone-and-transfer
  - javascript/json-and-binary-data/sharedarraybuffer-atomics
  - browser/html-event-loop/task-priority-and-scheduler
  - browser/rendering-pipeline/compositing
verified: 2026-10
perishable:
  - "Module workers: Chrome 80, Firefox 114, Safari 15"
  - "Chrome 156 throws SecurityError for a cross-origin worker URL"
  - "OffscreenCanvas: Chrome 69, Firefox 105, Safari 16.4"
sources:
  - https://html.spec.whatwg.org/multipage/workers.html#dedicated-workers-and-the-worker-interface
  - https://html.spec.whatwg.org/multipage/workers.html#the-workerglobalscope-common-interface
  - https://html.spec.whatwg.org/multipage/workers.html#run-a-worker
  - https://html.spec.whatwg.org/multipage/workers.html#module-worker-example
  - https://html.spec.whatwg.org/multipage/workers.html#dom-workerglobalscope-importscripts
  - https://html.spec.whatwg.org/multipage/webappapis.html#report-an-exception
  - https://html.spec.whatwg.org/multipage/webappapis.html#fetch-a-classic-worker-script
  - https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker#browser_compatibility
tldr: >
  A dedicated worker runs a script on its own thread, with its own global, heap and event loop, so
  long computation doesn't block input or rendering. It talks to the page only by `postMessage`. It
  has no DOM, `window`, `document` or `localStorage`, but does have `fetch`, IndexedDB, the Cache
  API, `WebSocket`, timers and `OffscreenCanvas`.
---

## Answer

`new Worker(url)` starts a script in a new agent: its own thread, global object (`DedicatedWorkerGlobalScope`, reached as `self`), heap and event loop. The page's main thread keeps handling input and rendering while the worker computes, which is the whole point: a 300 ms loop on the main thread freezes the page for 300 ms; in a worker it doesn't.

The two sides share no objects. They exchange messages: `worker.postMessage(data)` in the page, `postMessage(data)` in the worker, each received as a `message` event. Data is copied by the structured clone algorithm, or *transferred* for buffers (see the next question). Shared memory exists only through `SharedArrayBuffer`.

**What a worker can't touch:** the DOM. There is no `window`, `document`, `alert()` or `localStorage`, so anything that reads or changes the page has to message the main thread.

**What it can use:** `fetch` and `XMLHttpRequest`, IndexedDB, the Cache API, `WebSocket`, timers, `crypto`, `BroadcastChannel`, `OffscreenCanvas`, and nested workers.

Since Chrome 80, Firefox 114 and Safari 15, `{ type: 'module' }` makes a module worker: static `import`, strict mode, no `importScripts()`. The worker script must be same-origin with the page (a `blob:` URL works).

An uncaught exception in the worker fires an `ErrorEvent` at the `Worker` object in the page. Call `preventDefault()` on it, or the page reports the error a second time as its own. The worker keeps running.

`worker.terminate()` stops it at once; `close()` inside the worker stops it after the current task.

Workers suit CPU-heavy work on data you can send cheaply: parsing, compression, image processing, search indexes. They don't help with work that must touch the DOM, and every worker costs start-up time and a separate heap.

## Example

```js
// sum-worker.js
postMessage(`${typeof document} ${typeof localStorage} ${typeof fetch} ${typeof indexedDB}`);

onmessage = ({ data: n }) => {
  let total = 0;
  for (let i = 0; i < n; i++) total += i;
  postMessage(total);
};

// main.js
const worker = new Worker(new URL('./sum-worker.js', import.meta.url), { type: 'module' });
worker.onmessage = (event) => console.log(event.data);
worker.postMessage(1e8); // sent before the worker has loaded: queued, not lost
// → undefined undefined function object
// → 4999999950000000
```

The loop ran in the worker; the page stayed responsive. Same output in Chrome 156 and Firefox 159, served from `http://localhost`.

## Pitfalls

- Moving DOM work to a worker. It has no `document`; send results back and let the main thread update the page.
- Posting large objects back and forth. Each `postMessage` clones the data on the sending thread, so a worker that parses a huge JSON string and returns the whole object can cost the main thread as much as it saved.
- Calling `importScripts()` in a module worker. It throws a `TypeError`; use `import` instead.
- Creating a worker per task. Start-up costs milliseconds and each worker has its own heap; keep one or a small pool alive.

## Follow-ups

**Q:** Does a worker make `async` code faster?
**A:** No. `fetch` and timers already run off the main thread. A worker helps only when your own JavaScript keeps the main thread busy, such as a long loop or a heavy parse.

**Q:** What's the alternative when the work must touch the DOM?
**A:** Break it into chunks and yield between them, for example with `scheduler.yield()`, so input and rendering run in between. The work still runs on the main thread; it just stops blocking it.

**Q:** Can a worker draw?
**A:** Yes, through `OffscreenCanvas`: `canvas.transferControlToOffscreen()` hands the canvas to the worker, which draws without the main thread. Chrome 69, Firefox 105 and Safari 16.4 support it.

## Deep dive

### How it works

The `Worker` constructor fetches the script and runs it in a new *dedicated worker agent*. The HTML Standard's *run a worker* steps create a `DedicatedWorkerGlobalScope`, a realm, and an event loop for it, then entangle two `MessagePort`s: one inside the worker, one behind the `Worker` object. Classic worker scripts are fetched with mode `"same-origin"`, so a cross-origin URL is a network error.

Messages to the worker wait in the inside port's message queue, which is enabled only after the script has run. That's why the `postMessage(1e8)` in the example, sent before the script arrived, wasn't lost.

The worker's global offers what the [`WorkerGlobalScope`](https://html.spec.whatwg.org/multipage/workers.html#the-workerglobalscope-common-interface) interface and specs that extend it expose. Checking `typeof self[name]` in a classic worker in Chrome 156 and Firefox 159 gave the same answer for every name:

| Present | Absent |
|---|---|
| `fetch`, `XMLHttpRequest`, `indexedDB`, `caches`, `WebSocket`, `setTimeout`, `crypto`, `BroadcastChannel`, `OffscreenCanvas`, `requestAnimationFrame`, `Worker`, `importScripts`, `location`, `navigator` | `window`, `document`, `localStorage`, `sessionStorage`, `alert`, `DOMParser`, `SharedWorker` |

`caches` needs a secure context; `http://localhost` counts as one.

An uncaught exception follows *report an exception*: the worker's own `onerror` runs first, then the page gets a cancelable `ErrorEvent` at the `Worker` object with `message`, `filename`, `lineno` and `colno`, but not the exception itself. If nothing calls `preventDefault()`, the error is reported again in the page, and `window`'s `error` handler fires.

### Edge cases

Run in Chrome 156 and Firefox 159 from `http://localhost:8070`:

| Case | Chrome 156 | Firefox 159 |
|---|---|---|
| Uncaught error in a `message` handler | `ErrorEvent`; worker handles later messages | same |
| Unhandled promise rejection in the worker | no event at the `Worker` | same |
| Script returns 404 | plain `Event`, no message | same |
| Syntax error in the script | `ErrorEvent` with the message | plain `Event` |
| Cross-origin script URL | `SecurityError` thrown by the constructor | `error` event later |
| `importScripts()` in a module worker | `TypeError` | `TypeError` |
| `import()` in a classic worker | works | works |
| `postMessage()` after `terminate()` | dropped silently | same |

Firefox matches the spec in two rows: a failed fetch or a parse error should fire a plain `error` event, not throw or carry a message.

### Real-world scenario

`postMessage` has no replies. A request/response layer over it needs an id per call:

```js
// parse-worker.js
onmessage = ({ data: { id, text } }) => {
  try {
    postMessage({ id, result: JSON.parse(text) });
  } catch (error) {
    postMessage({ id, error });
  }
};

// main.js
const worker = new Worker(new URL('./parse-worker.js', import.meta.url), { type: 'module' });
const pending = new Map();
let nextId = 0;

worker.onmessage = ({ data: { id, result, error } }) => {
  const { resolve, reject } = pending.get(id);
  pending.delete(id);
  if (error) reject(error);
  else resolve(result);
};

function parseInWorker(text) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, text });
  });
}

console.log(JSON.stringify(await Promise.all([parseInWorker('[1,2]'), parseInWorker('{"a":1}')])));
// → [[1,2],{"a":1}]
await parseInWorker('{').catch((e) => console.log(e instanceof SyntaxError));
// → true
```

Replies can come back in any order, so the id, not arrival order, matches them to calls. The `SyntaxError` crossed the thread boundary as a real `SyntaxError`, because `Error` objects are cloneable. Libraries such as Comlink wrap this pattern in proxies.

### Trade-offs

- **Start-up.** From `new Worker()` to the worker's first message took 2.6–3.8 ms (median of 20) in Chrome 156 and 4–9 ms in Firefox 159, 3 runs each on localhost; the first worker in each run took 14–22 ms. Over a network the script download adds to that.
- **Memory.** Each worker has its own heap and copies of whatever modules it imports.
- **Copying.** Cloning is linear in the data's size and runs on both threads. Transfer `ArrayBuffer`s instead, or share memory with `SharedArrayBuffer`, which needs cross-origin isolation.
- **Pool size.** `navigator.hardwareConcurrency` gives the number of logical cores; more busy workers than that just time-share.
