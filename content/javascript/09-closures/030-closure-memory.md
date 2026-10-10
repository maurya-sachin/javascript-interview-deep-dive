---
title: "What does a closure keep alive in memory?"
status: draft
difficulty: hard
frequency: 2
core: true
tags: [closures, memory, garbage-collection, memory-leaks, v8]
related:
  - javascript/closures/what-is-a-closure
  - javascript/memory-and-gc/garbage-collection
  - javascript/memory-and-gc/memory-leaks
  - javascript/memory-and-gc/weakref-finalizationregistry
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-environment-records
  - https://tc39.es/ecma262/#sec-ordinaryfunctioncreate
  - https://tc39.es/ecma262/#sec-liveness
  - https://tc39.es/ecma262/#sec-addtokeptobjects
  - https://v8.dev/blog/preparser
  - https://chromium.googlesource.com/v8/v8.git/+/main/docs/runtime/scopes-and-scope-infos.md
  - https://chromium.googlesource.com/v8/v8.git/+/main/docs/runtime/function-architecture.md
  - https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots
  - https://nodejs.org/docs/latest-v24.x/api/cli.html#--expose-gc
tldr: >
  In the spec, a closure keeps its whole [[Environment]] chain reachable. Engines narrow
  that: in V8, only variables some inner function references live in a heap "context",
  and every closure created in that scope shares it. So a closure keeps alive everything
  any sibling closure captured — even data it never touches — for as long as it lives.
---

## Answer

**Spec view.** A function's `[[Environment]]` slot references the Environment Record it was created in, and each record's `[[OuterEnv]]` references the next one out. While the function is reachable, that whole chain is reachable. The spec doesn't say how bindings are stored or when memory is reclaimed — it calls Environment Records purely specification mechanisms.

**V8 view.** Engines only have to preserve observable behaviour, so they keep less. In V8, the parser decides for each variable whether it can live on the stack or must be *context-allocated*: stored in a heap `Context` object because an inner function references it. Each scope that needs one gets a single `Context` on entry, chained to its parent, and every closure created in that scope points to that same `Context`. Three consequences:

1. **Unused locals aren't kept.** A large local that no inner function mentions can be collected when the call returns, even if a closure from that call lives on.
2. **Siblings share retention.** If *any* closure in the scope references `big`, *every* closure from that call keeps `big` alive — including a tiny callback that never reads it.
3. **Direct `eval` keeps everything.** It can name any binding at run time, so nothing in scope can be dropped.

**How it becomes a leak.** A closure doesn't leak by itself; a long-lived reference to it does. Event listeners that are never removed, intervals never cleared, subscriptions, and caches of callbacks each pin their closure's `Context` — and through sibling captures, possibly much more than the callback uses.

**Fixes:** remove the reference (`removeEventListener`, `clearInterval`, an `AbortSignal`); copy the small value you need into a local before creating the long-lived closure; create that closure in a scope that doesn't capture the big data; or set a captured `let` to `null` once done.

## Example

```js
// Run with: node --expose-gc example.mjs
const settle = () => new Promise((resolve) => setTimeout(resolve));

function lean() {
  const big = new Array(1e6).fill(0);
  const size = big.length; // the handler only needs a number
  return { handler: () => size, ref: new WeakRef(big) };
}

function leaky() {
  const big = new Array(1e6).fill(0);
  const debug = () => big.length; // never called, never returned
  return { handler: () => 'tiny', ref: new WeakRef(big) };
}

async function isRetained(make) {
  const { handler, ref } = make();
  await settle(); // a WeakRef keeps its target alive until the current job ends
  globalThis.gc();
  return [handler(), ref.deref() !== undefined];
}

console.log(await isRetained(lean)); // → [ 1000000, false ]
console.log(await isRetained(leaky)); // → [ 'tiny', true ]
```

## Pitfalls

- Saying "a closure keeps the entire outer scope alive." Not in V8: variables no inner function references aren't context-allocated, so they're not retained.
- Saying "a closure keeps only what it uses." Also wrong: in V8, closures from the same scope share one `Context`, so each keeps whatever any sibling captured.
- Presenting V8's context allocation as language semantics. The spec only defines reachability through Environment Records; what's actually retained is an engine decision.
- Blaming closures for a leak whose real cause is a missing `removeEventListener` or `clearInterval`. The closure is the retainer path; the long-lived reference is the bug.

## Follow-ups

**Q:** How do you confirm a closure is what's holding memory?
**A:** Take heap snapshots before and after the suspect operation and use DevTools' Comparison view. Select a survivor and read its Retainers: a path through a `system / Context` entry means a closure's captured variables hold it. Named functions make those paths readable.

**Q:** Does setting the variable to `null` help?
**A:** Yes, if it's a `let` or `var` that a closure captured. In V8 that clears the shared `Context` slot, so the object can be collected even while the closures live. It does nothing for a variable that was never captured, and `const` can't be reassigned.

**Q:** Why doesn't V8 give each closure only the variables it uses?
**A:** Captured bindings are live and writable: if two closures read and write `count`, both must see one storage location. A shared per-scope `Context` gives that for free with one allocation per scope entry. The cost is coarser retention when sibling closures capture different things.

## Deep dive

### How it works

The spec model is simple: `OrdinaryFunctionCreate` stores the current Environment Record in `[[Environment]]`, and each record links outward through `[[OuterEnv]]`. Read literally, a closure keeps every binding in every enclosing scope. The spec also says Environment Records need not correspond to any implementation artefact, so engines are free to keep only what can still be observed.

V8 does this at parse time. Function activations live on the machine stack for speed, but an inner function can outlive the activation that created it. So variables referenced from inner functions are allocated on the heap, in a `Context`. When V8 evaluates a function literal, it creates a closure (a `JSFunction`) that points to the function's shared code (`SharedFunctionInfo`) and to the *current* context. The scope analysis records, per scope, how many context slots it needs; at run time, entering that scope creates one `Context` with those slots, linked to its parent through a `previous` pointer. A function call gets a function context only when the function has context-allocated variables; blocks with `let`/`const`, `catch` clauses, and modules have their own context types.

Because lazily compiled functions are only pre-parsed at first, the preparser still has to track which outer variables each inner function references — otherwise V8 couldn't decide allocation for the outer function correctly.

```js
function track(items) {
  const count = items.length; // used only by `track` itself → not in the context
  const index = new Map(items.map((item) => [item.id, item])); // read by `find` → context
  let lookups = 0; // read by `stats` → context
  const find = (id) => (lookups++, index.get(id));
  const stats = () => lookups;
  console.log(`tracking ${count}`);
  return stats; // `stats` holds the whole context: `index` and `lookups`
}
```

Only `stats` escapes, and it only reads `lookups`, but it points to the same `Context` as `find`, so the `Map` stays alive as long as `stats` does.

### Edge cases

- **Direct `eval`.** A closure containing a direct `eval` can reference any binding by name at run time, so nothing in the enclosing scopes can be dropped. In Node 24, a closure that only calls `eval('1')` retains a large local that nothing mentions. Indirect eval (`(0, eval)('…')`) runs in the global scope and doesn't have this effect.
- **Block scopes are separate contexts.** A closure created outside a block doesn't hold the block's `Context`, so moving the capturing code into a block is a real fix.
- **Releasing the slot.** Assigning `null` to a captured `let` clears it for every closure sharing the `Context`.
- **Measuring.** `WeakRef` targets are kept alive until the end of the current job (`AddToKeptObjects`), so a test must yield before forcing GC. Treat `gc()` results as a diagnostic, not a guarantee.

```js
// Run with: node --expose-gc fixes.mjs
const settle = () => new Promise((resolve) => setTimeout(resolve));

function scoped() {
  const handler = () => 'tiny'; // created outside the block that captures `big`
  let ref;
  {
    const big = new Array(1e6).fill(0);
    ref = new WeakRef(big);
    const debug = () => big.length; // lives in the block's own context
    debug();
  }
  return { handler, ref };
}

function released() {
  let big = new Array(1e6).fill(0);
  const ref = new WeakRef(big);
  const debug = () => big.length;
  debug();
  big = null; // clears the slot that every closure from this call shares
  return { handler: () => 'tiny', ref };
}

for (const make of [scoped, released]) {
  const { handler, ref } = make();
  await settle();
  globalThis.gc();
  console.log(make.name, handler(), ref.deref() !== undefined);
}
// → scoped tiny false
// → released tiny false
```

### Real-world scenario

Sibling sharing can turn one retained object into an unbounded chain. Here each refresh creates a closure that reads `previous`, and a long-lived `describe` method that doesn't. Both share the call's `Context`, so each new entry's `describe` keeps the previous entry alive, which keeps the one before it, and so on:

```js
// Run with: node --expose-gc chain.mjs
const settle = () => new Promise((resolve) => setTimeout(resolve));
let current = null;
let firstRef;

function refresh() {
  const previous = current;
  const wasReady = () => previous !== null; // only `wasReady` reads `previous`…
  current = {
    data: new Array(1e6).fill(0),
    describe: () => 'cache entry', // …but `describe` shares its context
  };
  firstRef ??= new WeakRef(current);
}

for (let i = 0; i < 5; i++) refresh();
await settle();
globalThis.gc();
console.log(firstRef.deref() !== undefined); // → true
```

All five arrays stay reachable from `current`. Reading the value eagerly — `const wasReady = current !== null` — removes the captured binding, and the same test prints `false`.

### Trade-offs

V8's shared per-scope `Context` is the cheap, correct design for writable bindings: one allocation per scope entry, variables at fixed slots, and each closure a small `JSFunction` pointing at shared code and a context. The price is coarse retention, which you control by structure rather than by the engine: keep long-lived callbacks small and in scopes that don't capture large data, release captured references when done, and remove listeners and timers. Rewriting closures as classes only helps if it also removes the long-lived reference; an instance stored in a listener retains its fields just the same.
