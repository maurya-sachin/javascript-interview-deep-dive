---
title: "What are `WeakRef` and `FinalizationRegistry`, and why use them rarely?"
status: draft
difficulty: hard
frequency: 1
core: false
tags: [weakref, finalizationregistry, garbage-collection, non-determinism, keepduringjob]
related:
  - javascript/memory-and-gc/garbage-collection
  - javascript/keyed-collections/weakmap-weakset
  - javascript/memory-and-gc/memory-leaks
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-weakref-processing-model
  - https://tc39.es/ecma262/#sec-weakref-invariants
  - https://tc39.es/ecma262/#sec-liveness
  - https://tc39.es/ecma262/#sec-weakref-execution
  - https://tc39.es/ecma262/#sec-addtokeptobjects
  - https://tc39.es/ecma262/#sec-clear-kept-objects
  - https://tc39.es/ecma262/#sec-canbeheldweakly
  - https://tc39.es/ecma262/#sec-cleanup-finalization-registry
  - https://tc39.es/ecma262/#sec-weak-ref-objects
  - https://tc39.es/ecma262/#sec-finalization-registry-objects
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry
tldr: >
  A `WeakRef` points to an object without keeping it alive; `deref()` returns it or `undefined`. A
  `FinalizationRegistry` may call back after a registered object is collected. The spec guarantees
  neither: collection may never happen and the callback may never run. Use them as an optimisation or
  safety net, never for correctness.
---

## Answer

**`WeakRef`** holds a target (an object or a non-registered symbol) *weakly*: the reference alone does not keep it alive. `ref.deref()` returns the target, or `undefined` if the engine has reclaimed it. A weak reference is never a guarantee, and each use needs the `undefined` check.

**`FinalizationRegistry`** lets you register a target with a *held value*, and a callback that receives the held value some time after the target is collected. `register(target, held, token?)`; `unregister(token)` cancels it.

The spec is deliberately weak:

- It "does not make any guarantees that any object or symbol will be garbage collected." Unreachable objects "may be released after long periods of time, or never at all."
- Cleanup callbacks run as a separate job after synchronous code ends. Implementations "may omit FinalizationRegistry callbacks for any reason", for example if the application is shutting down.
- **Pinning (KeepDuringJob):** `new WeakRef(target)` and `deref()` call `AddToKeptObjects`, which holds the target strongly until `ClearKeptObjects` runs at the end of the current synchronous job. So the target cannot vanish between two `deref()` calls in the same job; it can between jobs.

Consequences: collection timing differs by engine, flags, heap pressure and version, so code that "works" while testing may behave differently in production. Do not use these for resource management (use `try/finally`, `using`, `AbortController`), correctness, or logic that must run. Legitimate uses are narrow: a cache of recomputable values that may be dropped under memory pressure, and a last-resort cleanup of something external (a native handle) if the owner forgot to dispose of it.

## Example

```js
// weak.mjs, run with: node --expose-gc weak.mjs
const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

let target = { name: 'big object' };
const ref = new WeakRef(target);   // pins target until this job ends
const registry = new FinalizationRegistry((held) => console.log('callback for', held));
registry.register(target, 'big object');

target = null;                     // no strong reference left
global.gc();                       // forced, same job
console.log(ref.deref()?.name);    // → big object  (guaranteed by the spec)

await nextTask();                  // a new job: the pin is gone
global.gc();
console.log(ref.deref()?.name);    // → undefined  (VARIES: allowed to stay "big object")
await nextTask();
await nextTask();
// → callback for big object  (VARIES: may print later, or never)
```

Only the first output is guaranteed. The second and third are what Node 24.19 printed on one machine in three runs; `--expose-gc` makes collection likely, not required. Without the `global.gc()` calls, a separate three-tick test kept the object alive and never ran the callback.

## Pitfalls

- Treating the callback as a destructor. It may run late or never; the spec says implementations may omit callbacks, for example at shutdown. It must not be the only thing that frees an external resource.
- Referencing the target from the held value or the callback closure. The registry holds the held value strongly, so that keeps the target alive and the callback can never fire. `register(o, o)` throws `TypeError` for the direct case; indirect cycles are your problem.
- Using `deref()` as if it were stable. Two `deref()` calls in different jobs can disagree, and a value that is `undefined` once stays `undefined`. Hold the dereferenced object in a local variable for the whole use.
- Wrong targets. Primitives and registered symbols (`Symbol.for`) throw `TypeError`; the spec's `CanBeHeldWeakly` accepts objects and symbols without a registry key.

## Follow-ups

**Q:** `WeakRef` or `WeakMap`?
**A:** `WeakMap` attaches data to an object for as long as the object lives, and its timing is unobservable. `WeakRef` lets you observe whether the object is still there, which exposes GC timing. Prefer `WeakMap` unless you need a cache of values by key.

**Q:** Why is `deref()` stable within one job?
**A:** For read consistency. `if (ref.deref()) ref.deref().foo()` must not throw between the two calls; the spec's own note uses this example. `AddToKeptObjects` achieves it, and `ClearKeptObjects` ends the pin when the synchronous run completes.

**Q:** How do I cancel a registration?
**A:** Pass a third argument, an unregister token, then call `unregister(token)`. It returns `true` if something was removed, `false` otherwise. The token is held weakly too, so it must be an object or non-registered symbol.

## Exercises

### Will `gc()` collect it?

```js
// run with: node --expose-gc
let obj = { n: 1 };
const ref = new WeakRef(obj);
obj = null;
global.gc();
console.log(ref.deref()?.n);
```

**Answer:** It prints `1`. `new WeakRef(obj)` already called `AddToKeptObjects`, so the object stays alive until the current synchronous job ends. Nothing can reach `obj` after `obj = null`, but the kept-alive list does. The same program split across two jobs (with an `await` before `gc()`) is allowed to print `undefined`, but is not required to.

### Which lines throw?

```js
const registry = new FinalizationRegistry(() => {});
const o = {};
for (const run of [
  () => new WeakRef(1),
  () => new WeakRef(Symbol.for('k')),
  () => new WeakRef(Symbol('k')).deref().description,
  () => registry.register(o, o),
  () => registry.unregister({}),
]) {
  try { console.log(run()); } catch (e) { console.log(e.constructor.name); }
}
```

**Answer:** `TypeError`, `TypeError`, `k`, `TypeError`, `false`. A number is not a valid target. A `Symbol.for` symbol is registered in the global symbol registry, so it is not `CanBeHeldWeakly`. A fresh `Symbol('k')` is fine (and, being pinned, `deref()` succeeds). `register` rejects a target equal to its held value. `unregister` with an unknown token returns `false` rather than throwing.
