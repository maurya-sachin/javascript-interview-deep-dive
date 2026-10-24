---
title: "How do code caching and startup snapshots make JavaScript start faster?"
status: draft
difficulty: hard
frequency: 2
core: false
tags: [v8, code-cache, startup-snapshot, nodejs, performance, startup]
related:
  - javascript/inside-the-engine/v8-pipeline
  - javascript/inside-the-engine/deoptimization
verified: 2026-10
perishable:
  - Chrome caches only after the third run, scripts ≥ 1 KiB
  - V8 13.6 code cache checks source length, not content
  - Node 24 --snapshot-blob still marked experimental
  - Node single executable applications are Stability 1.1
  - Node module compile cache stable since 24.15.0
sources:
  - https://v8.dev/blog/code-caching-for-devs
  - https://v8.dev/blog/improved-code-caching
  - https://v8.dev/blog/custom-startup-snapshots
  - https://chromium.googlesource.com/v8/v8.git/+/main/src/snapshot/code-serializer.cc
  - https://nodejs.org/docs/latest-v24.x/api/vm.html#scriptcreatecacheddata
  - https://nodejs.org/docs/latest-v24.x/api/module.html#module-compile-cache
  - https://nodejs.org/docs/latest-v24.x/api/cli.html#--build-snapshot
  - https://nodejs.org/docs/latest-v24.x/api/v8.html#startup-snapshot-api
  - https://nodejs.org/docs/latest-v24.x/api/single-executable-applications.html
tldr: >
  Engine and host features, not ECMAScript. A code cache stores V8's compiled bytecode for a script so a
  later load skips parsing and compiling; Chrome produces one on a script's second load and uses it from
  the third. A startup snapshot stores a whole initialized heap, so a new context is deserialized instead
  of rebuilt. Node.js exposes both.
---

## Answer

Neither is in ECMAScript; both are V8 and embedder (Chrome, Node.js) optimizations that skip repeated startup work.

**Code caching** skips *compiling*. After V8 compiles a script to bytecode, it can serialize the compiled functions into a blob. On a later load of the same script, V8 deserializes that blob instead of parsing and compiling again. The cache is checked first: a different V8 version, different flags or a source mismatch makes V8 reject it and compile normally.

In **Chrome**, per the V8 team's guidance: the first load just compiles (cold run); the second compiles again and stores a cache alongside the HTTP cache entry (warm); the third and later loads use it (hot). Since Chrome 66, the cache is created after the script's top-level code runs, so it includes every function compiled by then. Scripts under 1 KiB and inline scripts aren't cached, and the cache is keyed by URL, so changing a query string starts over. Scripts a service worker caches during its install event get a full cache immediately.

**Startup snapshots** skip *executing*. V8 builds each new context from a snapshot of a heap where built-ins and the global object are already set up, instead of running all that initialization. A custom snapshot goes further: run your app's setup once, serialize the resulting heap, and start later processes from it. The V8 team's 2015 post measured context creation dropping from 40 ms to under 2 ms on desktop.

**Node.js** exposes both:

- `vm.Script` `cachedData` and `createCachedData()` for code caches you manage yourself.
- The module compile cache (`module.enableCompileCache()` or `NODE_COMPILE_CACHE`), which stores code caches on disk for CommonJS, ESM and TypeScript modules.
- `--build-snapshot`/`--snapshot-blob` and the `v8.startupSnapshot` API for custom snapshots.
- Single executable applications, which can embed a code cache (`useCodeCache`) or a snapshot (`useSnapshot`).

## Example

```js
import vm from 'node:vm';

const source = 'function area(r) { return Math.PI * r * r; } area(2).toFixed(2);';

const first = new vm.Script(source, { filename: 'area.js' });
console.log(first.runInThisContext()); // → 12.57
const cache = first.createCachedData(); // serialized V8 code (a Buffer)

// A later process would read `cache` from disk instead.
const second = new vm.Script(source, { filename: 'area.js', cachedData: cache });
console.log(second.cachedDataRejected, second.runInThisContext()); // → false 12.57

const edited = new vm.Script(source.replace('2)', '10)'), { cachedData: cache });
console.log(edited.cachedDataRejected, edited.runInThisContext()); // → true 314.16
```

## Pitfalls

- Expecting the first or second visit to benefit. Chrome uses a code cache from the third load of an unchanged URL; cache-busting query strings on every deploy reset that.
- Assuming lazily compiled functions are cached. Only functions compiled by the end of the top-level run are in Chrome's cache, so code first called by a click handler is compiled on each load.
- Snapshotting state that must be fresh. A snapshot freezes values computed at build time, like `Date.now()` or `Math.random()` results; recompute them in a deserialize callback.
- Trusting a code cache across source changes without your own check. In Node.js 24, V8's acceptance check compares source length, not content (see the exercise); key caches by a content hash.

## Follow-ups

**Q:** What does a Node.js snapshot refuse to load?
**A:** A blob from a different Node.js version, architecture or platform, or one built with incompatible V8 flags or CPU features. Node.js then exits with status 1, per its `--snapshot-blob` docs.

**Q:** How stable are these Node.js features in v24?
**A:** `v8.startupSnapshot` became stable in 24.0.0, and `--build-snapshot` stopped being experimental in 24.13.1, though the `--snapshot-blob` entry is still marked experimental. The module compile cache APIs are stable since 24.15.0. Single executable applications are Stability 1.1, active development.

**Q:** Does code caching help hot code run faster?
**A:** No. It removes parse and compile time at load. V8's code serializer stores bytecode and deliberately avoids serializing optimized code, which depends on runtime feedback; Maglev and TurboFan produce it again in each process.

## Deep dive

### How it works

V8 serializes `SharedFunctionInfo`s with their bytecode, plus a header recording V8's version, a flag hash and a source hash. On consumption, V8 runs a sanity check and rejects the blob on any mismatch. In V8 13.6 (Node.js 24) the "source hash" is the source length plus whether the script is a module or a wrapped function; V8's main branch adds an optional SHA-256 hash of the source behind a flag. That's why `vm.Script` reports `cachedDataRejected: false` for an edited script of the same length.

The improvement the V8 team shipped in Chrome 66 moved cache creation from "right after compiling" to "after top-level execution". Because V8 compiles functions lazily, waiting lets the cache include the functions the page actually called during startup; they measured a 20–40% reduction in parse and compile time on most pages.

Custom snapshots have limits. The V8 team's 2015 post said they couldn't contain API callbacks or typed arrays with memory outside V8's heap, and that values from `Math.random` or `Date.now` are fixed at build time. Node.js adds `addSerializeCallback` and `addDeserializeCallback` hooks so applications can close handles before serialization and reopen them on start.

### Real-world scenario

A CLI that loads a large dependency graph on every invocation pays parse, compile and initialization cost each time. Two cheap steps, in order of effort: call `module.enableCompileCache()` at the entry point (later runs reuse on-disk code caches; the first run is slightly slower), then, if initialization dominates, bundle the app and build a snapshot with `node --snapshot-blob app.blob --build-snapshot bundle.js`, using `v8.startupSnapshot.setDeserializeMainFunction()` as the new entry. The snapshot is tied to one Node.js binary, so build it in CI per platform and version.

## Exercises

### Predict the output

Using `source` and `cache` from the example, in Node.js 24.19:

```js
const sameLength = new vm.Script(source.replace('2)', '3)'), { cachedData: cache });
console.log(sameLength.cachedDataRejected, sameLength.runInThisContext());
```

**Answer:** `false 12.57`, not `28.27`. The edit keeps the source length, so V8 13.6's check passes and the cached top-level bytecode, which still calls `area(2)`, runs. Code caches are only safe when you key them by the exact source.

### Predict the output

Built with `node --snapshot-blob snap.blob --build-snapshot entry.js`, then started with `node --snapshot-blob snap.blob` (Node.js 24.19).

```js
// entry.js (CommonJS)
const { startupSnapshot } = require('node:v8');

const table = new Map(); // runs once, while the snapshot is built
for (let i = 0; i < 200_000; i++) table.set(`key${i}`, i * i);
const builtAt = process.pid;

startupSnapshot.setDeserializeMainFunction(() => {
  console.log(table.size, table.get('key999'), builtAt !== process.pid);
});
```

**Answer:** `200000 998001 true`. The `Map` was filled at build time and comes back from the deserialized heap without the loop running again. `builtAt` is also restored, so it holds the build process's pid, which differs from the new process's: a reminder that snapshotted state is frozen.
