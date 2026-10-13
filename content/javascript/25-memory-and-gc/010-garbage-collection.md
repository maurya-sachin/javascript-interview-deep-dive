---
title: "How does garbage collection work in JavaScript?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [garbage-collection, reachability, mark-and-sweep, memory, roots]
related:
  - javascript/closures/closure-memory
  - javascript/keyed-collections/weakmap-weakset
  - javascript/memory-and-gc/memory-leaks
  - javascript/memory-and-gc/v8-generational-gc
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-weakref-processing-model
  - https://tc39.es/ecma262/#sec-liveness
  - https://tc39.es/ecma262/#sec-weakref-execution
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management
  - https://v8.dev/blog/trash-talk
  - https://v8.dev/blog/concurrent-marking
  - https://nodejs.org/docs/latest/api/cli.html
  - https://nodejs.org/docs/latest/api/process.html#processmemoryusage
tldr: >
  JavaScript engines free an object when it is no longer reachable from a root (the stack, globals, and
  anything those reference), not when its reference count hits zero. Mark-and-sweep marks everything
  reachable and reclaims the rest, so cycles are collected. The spec guarantees no collection at all;
  timing is up to the engine.
---

## Answer

JavaScript has automatic memory management: you never free an object, the engine does it once the object is **unreachable**. The collector starts from a set of **roots** (the call stack's live variables, the global object, and engine-internal handles) and follows every reference. Objects it reaches are live; the rest are garbage and their memory is reused.

The standard algorithm is **mark-and-sweep** (V8 adds compaction):

1. **Mark.** Traverse the object graph from the roots and mark everything reached.
2. **Sweep.** Reclaim every unmarked object.
3. **Compact** (optional). Move survivors together to reduce fragmentation.

The alternative, **reference counting** ("free when nothing points to it"), fails on cycles: two objects that reference each other both keep a count of 1 forever, even when nothing else can reach them. MDN says no modern JavaScript engine uses it. Tracing handles cycles for free, because reachability is measured from the roots, not from counts.

Three things interviewers want to hear:

- **Reachability, not usefulness.** The collector cannot know that you will never read an object again, only that you *cannot*. A forgotten reference in a cache, listener or closure is still a reference. That is every JavaScript memory leak.
- **No guarantees.** The spec (in the WeakRef section) says it "does not make any guarantees that any object or symbol will be garbage collected." Objects may be released "after long periods of time, or never at all." Timing is invisible to your code by design.
- **You cannot trigger it.** There is no standard `gc()`. V8 exposes one only behind `--expose-gc`, which is for experiments and tests.

## Example

```js
// gc-cycle.mjs, run with: node --expose-gc gc-cycle.mjs
const heapMB = () => {
  global.gc(); // collect first so heapUsed reflects live objects only
  return Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
};

const baseline = heapMB();
let pairs = [];
for (let i = 0; i < 500_000; i++) {
  const a = { payload: new Array(8).fill(i) };
  const b = { a };
  a.b = b; // cycle: reference counting could never free this pair
  pairs.push(a);
}
const held = heapMB();
console.log(pairs.length); // → 500000 (also keeps `pairs` in use)
pairs = null;              // the only path from a root is gone
const collected = heapMB();
console.log({ baseline, held, collected });
// → { baseline: 3, held: 111, collected: 4 }
```

The MB figures are one machine, Node 24.19, macOS, run 3 times with the same result. Yours will differ; the shape (grow, then fall back once unreachable) is the point.

## Pitfalls

- Saying "an object is freed when nothing references it" and stopping there. That describes reference counting. The accurate wording is "when it is not reachable from a root", which is why cycles do not leak.
- Treating `x = null` as "freeing" memory. It only removes one reference; the object survives if anything else still reaches it, and it is reclaimed at the engine's convenience, not immediately.
- Reading `process.memoryUsage().heapUsed` without forcing a collection and drawing conclusions. Between collections it includes garbage, so it rises and falls. Compare readings only after `global.gc()` (under `--expose-gc`), or look at the trend over a long run.
- Calling `global.gc()` in production code. It is a measurement tool; forcing full collections hurts latency.

## Follow-ups

**Q:** What counts as a root?
**A:** The V8 blog describes the root set as known object pointers including the execution stack and the global object. Engines also hold internal handles as roots.

**Q:** Why can't I observe when an object is collected?
**A:** The spec leaves collection unobservable so engines can optimise freely. `WeakMap` and `WeakSet` have no `size` or iteration for this reason, and `WeakRef` deliberately makes `deref()` stable within one synchronous job.

**Q:** Does mark-and-sweep stop my code?
**A:** Naively yes. V8 splits the work: parts run in parallel on helper threads, parts incrementally in small slices, and marking largely concurrently with JavaScript. Only short pauses remain.

## Deep dive

### How it works

The spec never says "mark-and-sweep". It defines a weaker idea, **liveness**: a value is live if its identity can still be observed by the program, or it is held in the agent's kept-alive list (see the `WeakRef` question). Note 6 of the spec adds: "Liveness as defined here is undecidable. In practice, engines use conservative approximations such as reachability."

That is the real contract. Reachability is a *safe approximation*: anything reachable might be used, so it must stay. Anything unreachable can never be observed again, so freeing it cannot change the program's behaviour. The cost is that a reachable-but-never-used object (the leak case) is kept.

V8 uses **tri-colour marking** for the mark phase. The concurrent-marking post describes it as two mark bits per object encoding three colours: white (not yet discovered), grey (discovered, children not yet processed) and black (fully processed). Marking ends when no grey objects remain; "all the remaining white objects are unreachable and can be safely reclaimed." Because JavaScript keeps running while helper threads mark, V8 needs a **write barrier**: when your code stores a pointer into an already-black object, the barrier records the new edge so the collector does not miss it. Both details are V8-specific; other engines differ but all trace from roots.

After marking, V8 **sweeps** (puts the freed gaps on a free-list so later allocations can reuse them) and may **compact** (copy survivors into fresh pages to fight fragmentation). The full pipeline is covered in the V8 generational GC question.

### Edge cases

**A live-looking variable can be dead.** Roots are *live* variables, not every variable in scope. Delete the `console.log(pairs.length)` line from the example above, so `pairs` is never read after the loop, and the same program printed `{ baseline: 3, held: 3, collected: 3 }` in my runs (3 of 3). The engine knew the array was never used again, so the "held" collection already freed it. This is V8/Node 24.19 behaviour observed on one machine, not something the spec specifies. The lesson: do not assume that a variable in scope means the object is alive, and do not benchmark leaks with variables you never use afterwards.

**A cycle is garbage only if no root reaches it.** An unreachable cycle is collected. A cycle with a single path from a root is live, however large it is.

**Weak edges are not paths.** An entry in a `WeakMap`, a `WeakRef` and a `FinalizationRegistry` registration are not followed when deciding liveness. That is what the weak collections are for.

**Memory outside the JS heap.** `process.memoryUsage()` reports `heapUsed` (live JS objects plus not-yet-collected garbage), but also `external` (C++ objects bound to JS objects) and `arrayBuffers`. A growing `rss` with a flat `heapUsed` suggests the growth is outside ordinary JS objects.

### Trade-offs

| | Reference counting | Tracing (mark-and-sweep) |
|---|---|---|
| Frees cycles | No | Yes |
| When memory is released | Immediately at count 0 | At a collection, later |
| Cost | Count update on every pointer write | Work proportional to live objects, paid in bursts |
| Pauses | Spread across pointer writes | Must be hidden by parallel, incremental and concurrent work |

Tracing wins for JavaScript because cycles are everywhere (DOM trees with parent pointers, closures that reference their own function, doubly-linked structures) and because the cost scales with *live* data. The price is non-determinism: you cannot rely on when memory is released or on destructors, which is why JavaScript has explicit cleanup APIs (`try/finally`, `AbortController`, `using`) for non-memory resources like file handles and sockets.

## Exercises

### Is `a` collectable?

```js
let a = { name: 'a' };
let b = { a };
const c = { b };
a = null;
b = null;
console.log(c.b.a.name);
```

**Answer:** It prints `a`, and neither object is collectable. Setting the two variables to `null` removes their direct references, but `c` (still reachable as a binding) points to the `b` object, which points to the `a` object. Reachability follows the whole chain from the root.

### Would this leak under reference counting?

```js
function f() {
  const x = {};
  const y = { x };
  x.y = y;
}
f();
```

**Answer:** Yes under reference counting: `x` and `y` reference each other, so each keeps a count of at least 1 after `f` returns. A tracing collector frees both, because once `f` has returned no root can reach either one. This is the example MDN uses for the cycle problem.
