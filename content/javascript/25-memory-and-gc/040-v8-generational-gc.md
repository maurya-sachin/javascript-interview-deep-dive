---
title: "How does V8's generational GC work?"
status: draft
difficulty: hard
frequency: 2
core: false
tags: [v8, generational-gc, scavenger, mark-compact, orinoco, concurrent-marking, node]
related:
  - javascript/memory-and-gc/garbage-collection
  - javascript/memory-and-gc/memory-leaks
  - javascript/inside-the-engine/smi-and-heap-numbers
verified: 2026-10
sources:
  - https://v8.dev/blog/trash-talk
  - https://v8.dev/blog/orinoco-parallel-scavenger
  - https://v8.dev/blog/concurrent-marking
  - https://v8.dev/blog/pointer-compression
  - https://nodejs.org/docs/latest/api/cli.html
  - https://nodejs.org/docs/latest/api/v8.html
  - https://nodejs.org/docs/latest/api/perf_hooks.html
tldr: >
  This is V8-specific, not ECMAScript. V8 splits the heap into a small young generation, collected often
  by a copying "scavenger" because most objects die young, and a large old generation, collected by
  mark-sweep-compact. Survivors move from nursery to intermediate to old. Most of the work runs in
  parallel, incrementally or concurrently so JavaScript pauses stay short.
---

## Answer

Everything here is **V8 behaviour** (Chrome, Node, Deno), described in V8's own blog posts. The spec requires none of it, and other engines differ.

V8 rests on the **generational hypothesis**: most objects die young. So the heap is split into two **generations**, collected differently.

**Young generation (minor GC, "scavenge").** A small **semi-space** area split into two halves, only one in use at a time. New objects are allocated in the *nursery*. When it fills, the **scavenger** copies the live objects to the other half and the old half is emptied, so only survivors are touched. Per the blog: an object that survives one scavenge becomes *intermediate* (still young), and one that survives another is **promoted** to the old generation. Write barriers record old-to-young references so a scavenge need not trace the whole heap.

**Old generation (major GC, mark-compact).** Triggered as the heap nears a dynamically computed limit. Three phases: **marking** (tri-colour traversal from the roots), **sweeping** (freed gaps go on free-lists), and **compacting** (some fragmented pages are evacuated).

**Keeping pauses short** (the Orinoco project) uses three techniques:

- **Parallel:** main thread and helpers split a pause. The scavenger has been parallel since V8 6.2.
- **Incremental:** the main thread works in small slices.
- **Concurrent:** helpers work while JavaScript runs; marking is concurrent (Chrome 64, Node 10).

**Node knobs:** `--max-old-space-size` (old-generation cap, MiB), `--max-semi-space-size`, `--trace-gc` (log each collection). `v8.getHeapStatistics()` and `getHeapSpaceStatistics()` show sizes.

## Example

```js
// gc-kinds.mjs, run with: node gc-kinds.mjs
import { PerformanceObserver, constants } from 'node:perf_hooks';
import v8 from 'node:v8';

const names = {
  [constants.NODE_PERFORMANCE_GC_MINOR]: 'scavenge',
  [constants.NODE_PERFORMANCE_GC_MAJOR]: 'mark-compact',
  [constants.NODE_PERFORMANCE_GC_INCREMENTAL]: 'incremental step',
};
const counts = {};
new PerformanceObserver((list) => {
  for (const { detail } of list.getEntries()) {
    const name = names[detail.kind] ?? `kind ${detail.kind}`;
    counts[name] = (counts[name] ?? 0) + 1;
  }
}).observe({ entryTypes: ['gc'] });

const kept = [];
for (let i = 0; i < 20_000_000; i++) {
  const temp = { i, pair: [i, i] }; // 19 of 20 die young
  if (i % 20 === 0) kept.push(temp); // 1 in 20 survives and is promoted
}
await new Promise((resolve) => setTimeout(resolve, 50)); // let entries arrive
const space = (name) => v8.getHeapSpaceStatistics().find((s) => s.space_name === name);
console.log(counts, Math.round(space('old_space').space_used_size / 2 ** 20), 'MB old');
// → { scavenge: 78, 'incremental step': 2, 'mark-compact': 2 } 97 MB old (varies)
```

The script allocates 20 million short-lived objects and keeps 1 in 20. The output is from one machine (Node 24.19, V8 13.6, macOS). The scavenge count ranged from 78 to 80 across runs; read the pattern, not the digits: many scavenges, a few mark-compacts, and the survivors ending up in old space.

## Pitfalls

- Presenting "two scavenges then promote" as a rule of JavaScript. It is V8's policy as its blog describes it, and V8 has other collectors: Node 24's `node --v8-options` lists a young-generation mark-sweep behind `--minor-ms`, off by default (I did not verify its details). Say "in V8".
- Treating the young generation as a fixed size. It grows. In my allocation-heavy run `new_space` (both semi-spaces) peaked at 128 MB; `--v8-options` lists `--scavenger-max-new-space-capacity-mb=32`, doubled when pointer compression is off (my reading of how the two numbers relate; not verified). Defaults are version- and build-dependent.
- Quoting a default heap limit. It depends on the V8 version, build, platform and available memory. On this machine `heap_size_limit` was 4288 MB; do not assume it elsewhere.
- Assuming pointer compression applies to Node. V8's blog says it limits the heap to 4 GB. In this Node 24 build `process.config.variables.v8_enable_pointer_compression` was `0`.

## Follow-ups

**Q:** Why a semi-space copy instead of mark-sweep for young objects?
**A:** The work is proportional to live objects, which are few, and copying compacts for free. The cost is that half the space is always empty, which the blog says outright.

**Q:** How can a scavenge be correct without scanning the old generation?
**A:** Write barriers keep a list of old-to-new references, so those slots are extra roots for the scavenge.

**Q:** What did concurrent marking change?
**A:** Marking work moves to helper threads while JavaScript runs. A write barrier covers references your code creates meanwhile. The blog reports roughly 65% and 70% less main-thread marking time per cycle on mobile and desktop.

## Exercises

### Where does a large allocation go?

```js
// run with: node --expose-gc
import v8 from 'node:v8';

const used = (name) =>
  v8.getHeapSpaceStatistics().find((s) => s.space_name === name).space_used_size;
const MB = 2 ** 20;

const newBefore = used('new_large_object_space');
const oldBefore = used('large_object_space');
const big = new Array(2_000_000).fill(0); // 16 MB backing store
console.log((used('new_large_object_space') - newBefore) / MB > 15);
global.gc();
console.log((used('large_object_space') - oldBefore) / MB > 15, big.length);
```

**Answer:** `true`, then `true 2000000`. Observed in Node 24.19 (V8 13.6), identical in three runs; the space names are V8 internals and may change. The 16 MB array's backing store is allocated in `new_large_object_space`, and after one collection it shows up in `large_object_space`, the old-generation counterpart. By their names, one is the young and the other the old generation's large-object space.
