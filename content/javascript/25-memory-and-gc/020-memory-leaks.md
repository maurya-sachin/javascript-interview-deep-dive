---
title: "What causes memory leaks, and how do you find them?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [memory-leaks, heap-snapshot, devtools, closures, event-listeners, max-old-space-size]
related:
  - javascript/memory-and-gc/garbage-collection
  - javascript/closures/closure-memory
  - javascript/keyed-collections/weakmap-weakset
verified: 2026-10
sources:
  - https://developer.chrome.com/docs/devtools/memory-problems
  - https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots
  - https://developer.chrome.com/docs/devtools/memory-problems/allocation-profiler
  - https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management
  - https://nodejs.org/docs/latest/api/v8.html
  - https://nodejs.org/docs/latest/api/process.html#processmemoryusage
  - https://nodejs.org/docs/latest/api/cli.html
tldr: >
  A JavaScript leak is memory you no longer need but can still reach: globals, closures, timers and listeners
  that are never removed, detached DOM nodes still referenced, and caches with no bound. Confirm it by
  watching heap growth after a forced GC, then compare two heap snapshots and read the retainers path
  back to a root.
---

## Answer

A garbage-collected language cannot leak memory that is unreachable. A **leak** in JavaScript is data you will never use again that is still **reachable**, so the collector must keep it. The usual retainers:

- **Unbounded caches and collections.** A `Map`, array or object that only ever grows (per-request, per-user, per-id).
- **Event listeners never removed.** An emitter or DOM node holds the handler, the handler's closure holds its data. Anonymous handlers cannot be removed later (MDN).
- **Timers.** A live `setInterval` callback keeps its closure reachable until `clearInterval`.
- **Closures** that capture more than they use (see the closure-memory question).
- **Detached DOM nodes.** An element removed from the page but still referenced from JavaScript, along with its subtree (Chrome's definition).
- **Accidental globals** and module-level state that lives for the whole process.

**Finding one.**

1. Confirm it is a leak: memory climbs across repeated identical work and does not fall after collection. In Node, compare `process.memoryUsage().heapUsed` after `global.gc()` (run with `--expose-gc`). In Chrome, use the Task Manager or the Performance panel's Memory checkbox.
2. Locate it with the **Memory panel**: take a **heap snapshot**, repeat the action, take another, and use the **Comparison** view. A **detached** class filter finds orphaned DOM. An **allocation timeline** shows blue bars (allocated and still alive) for objects that are not being released. Read the **Retainers** pane to see the path from a root.
3. Node: `v8.writeHeapSnapshot()`, `--heapsnapshot-signal=SIGUSR2`, or `--heapsnapshot-near-heap-limit=N`, then load the `.heapsnapshot` file in DevTools.
4. Fix the retainer (remove the listener, clear the timer, bound the cache) and re-measure.

**Heap limit.** V8's old generation has a cap. Hitting it aborts the process with `FATAL ERROR: Reached heap limit … JavaScript heap out of memory`. `--max-old-space-size=<MiB>` changes it; that buys time, not a fix.

## Example

```js
import { EventEmitter } from 'node:events';
const heapMB = () => {
  global.gc(); // for measuring only
  return Math.round(process.memoryUsage().heapUsed / 2 ** 20);
};
const bus = new EventEmitter().setMaxListeners(0);
const cache = new Map();
function handleRequest(id, { fixed }) {
  const body = new Array(10_000).fill(id); // ~80 KB per request
  const onTick = () => body.length;        // closure captures body
  bus.on('tick', onTick);
  cache.set(id, body);
  if (fixed) {
    bus.off('tick', onTick);               // listener removed
    if (cache.size > 100) cache.delete(cache.keys().next().value); // bounded
  }
}
for (const fixed of [false, true]) {
  const readings = [];
  for (let round = 0; round < 3; round++) {
    for (let i = 0; i < 1000; i++) handleRequest(round * 1000 + i, { fixed });
    readings.push(heapMB());
  }
  console.log(fixed ? 'fixed  ' : 'leaking', readings.join(' '), 'MB');
  cache.clear();
  bus.removeAllListeners('tick');
}
// → leaking 80 156 233 MB
// → fixed   11 11 11 MB
```

Run it with `node --expose-gc leak.mjs`. The numbers are from one machine (Node 24.19, macOS), within 1 MB across runs; yours will differ. What matters is the slope: linear growth after a forced collection is the signature of a leak, a flat line is the fix.

## Pitfalls

- Judging by `heapUsed` or the DevTools graph without forcing a collection. The sawtooth of normal allocation and collection looks like growth. Only a rising floor after collection is a leak.
- Fixing the symptom with `--max-old-space-size`. A bigger heap only delays the crash. Also, `v8.getHeapStatistics().heap_size_limit` reports more than the flag value: in my run `--max-old-space-size=100` reported `292` MB and `2048` reported `2240` MB (a 192 MB difference; I did not verify the cause).
- Using a `Map` keyed by objects as a cache. The `Map` holds the keys forever. Use a `WeakMap` when the data should live exactly as long as the object, or a size-bounded cache when keys are not objects.
- Expecting `removeEventListener` to work with a fresh arrow function. It needs the same function reference; pass `{ signal }` from an `AbortController` to remove listeners in bulk (MDN).

## Follow-ups

**Q:** Do timers leak?
**A:** A live interval keeps its callback and everything it captured reachable. A function allocating a 5-million element array captured by an interval showed 42 MB while it ran and 4 MB after `clearInterval` (one machine, Node 24.19).

**Q:** What is the difference between shallow and retained size?
**A:** Shallow size is the memory the object itself holds. Retained size is what would become unreachable if the object were deleted (Chrome docs). Sort by retained size to find the objects that hold the most.

**Q:** Can a leak exist if memory is not in `heapUsed`?
**A:** Yes. `external` and `arrayBuffers` count native memory tied to JS objects, and `rss` is what the OS sees. A flat `heapUsed` with rising `rss` points at buffers or native code.

## Exercises

### Which of these keeps `data` alive after `start()` returns?

```js
function start(data) {
  const copy = () => data.length;
  document.addEventListener('click', () => console.log(data.length));
  setTimeout(() => data.length, 60_000);
  return copy;
}
start(new Array(1_000_000));
```

**Answer:** The `click` listener, indefinitely, and the timer for 60 seconds. `copy` is returned and discarded, so it keeps nothing alive. The anonymous listener on `document` can never be removed, so `data` stays reachable for the life of the page. The timer's closure is released once it has fired. Fix: register the listener with an `AbortController` signal and abort it when the owner goes away.
