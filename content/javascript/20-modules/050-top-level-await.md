---
title: "What does top-level `await` do to the module graph?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [top-level-await, esm, async-module, module-graph, evaluation-order, require-esm]
related:
  - javascript/modules/es-module-loading
  - javascript/modules/esm-vs-commonjs
  - javascript/modules/dynamic-import
  - javascript/async-and-the-event-loop/async-await-mechanics
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-cyclic-module-records
  - https://tc39.es/ecma262/#sec-async-module-execution-fulfilled
  - https://tc39.es/ecma262/#sec-async-module-execution-rejected
  - https://tc39.es/ecma262/#sec-execute-async-module
  - https://nodejs.org/docs/latest-v24.x/api/esm.html#top-level-await
  - https://nodejs.org/docs/latest-v24.x/api/modules.html#loading-ecmascript-modules-using-require
tldr: >
  `await` at the top level of a module makes that module asynchronous. Everything that imports it, directly
  or transitively, waits until it finishes before running its own body. Independent siblings still start
  together and overlap, so the cost is the slowest chain. A rejection fails every importer, and
  `require()` can't load such a graph.
---

## Answer

A module containing `await` outside any function has `[[HasTLA]]` set. Its body runs as an async function body: the module's evaluation promise stays pending until the body finishes.

What that does to the graph:

- **Dependents wait.** A module that imports an async module can't run until the dependency's promise fulfills. This is transitive: a synchronous module that depends on an async one is deferred too. The entry module's own code runs last.
- **Siblings overlap.** Evaluation still walks the graph depth-first. When it reaches an async module it starts that body, and when the body hits its first `await` it moves on to the next sibling without waiting. Two independent modules that each await a timer run concurrently, so the total delay is the longest one, not the sum.
- **Order is preserved where it matters.** A dependent never runs before its dependencies. Among modules that become ready at the same time, they run in the order evaluation first reached them.
- **Failure propagates.** If the awaited promise rejects, the module's evaluation fails and so does every module that depends on it. A static `import` of it leaves the program with that error; `import()` of it rejects.
- **Never-settling await.** The graph never finishes. Node.js prints a warning and exits with code 13 once nothing else keeps the event loop alive.

`require()` is synchronous, so it can't wait. In Node.js 24 `require(esm)` works only when no module in the graph has top-level `await`; otherwise it throws `ERR_REQUIRE_ASYNC_MODULE` and you use `import()`.

Top-level `await` is only for modules. In a classic script or CommonJS file, `await` is an ordinary identifier outside async functions.

## Example

```js
// a.mjs: takes 100 ms
console.log('a start');
await new Promise((resolve) => setTimeout(resolve, 100));
console.log('a done');
export const a = 'a';

// b.mjs: same shape, 50 ms
console.log('b start');
await new Promise((resolve) => setTimeout(resolve, 50));
console.log('b done');
export const b = 'b';

// main.mjs
import { a } from './a.mjs';
import { b } from './b.mjs';
console.log('main', a, b);
// → a start
// → b start
// → b done
// → a done
// → main a b
```

`main` runs after about 100 ms, not 150: `a` and `b` overlap, yet `main` still waits for both.

## Pitfalls

- Putting a slow `await` (a network call, a database connection) in a widely imported module. Everything above it in the graph waits, and a failure takes all of them down.
- Assuming imports run in a strict one-after-another sequence. Sibling async modules start their work together; only their completion is ordered by dependencies.
- Using top-level `await` in a library that CommonJS users `require()`. They get `ERR_REQUIRE_ASYNC_MODULE`.
- Awaiting something that never resolves. The module and its importers never run (Node.js warns and exits with code 13).

## Follow-ups

**Q:** Does top-level `await` block the thread?
**A:** No. It suspends only that module's evaluation. Other tasks, timers, and microtasks keep running.

**Q:** How do you avoid making a whole subtree wait?
**A:** Load the slow part with `import()` where it's needed, or export a promise and let consumers `await` it when they need it.

**Q:** What happens when a module has an unhandled top-level rejection?
**A:** Its evaluation fails with that error, the same error reaches importers, and an uncaught failure of the entry module ends the Node.js process with the error.

## Exercises

### Does `main` wait

```js
// bad.mjs: await Promise.reject(new Error('tla failed')); export const x = 1;
console.log('before');
const result = await import('./bad.mjs').catch((error) => error.message);
console.log(result);
```

**Answer:** `before`, then `tla failed` (run in Node.js 24). The evaluation promise of `bad.mjs` rejects, so `import()` rejects with the same error and `.catch` turns it into a string. A static `import { x } from './bad.mjs'` would instead fail the importing module before its body ran.
