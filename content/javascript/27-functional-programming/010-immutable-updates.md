---
title: "How do you update nested data immutably, and what does each copy cost?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [immutability, spread, change-array-by-copy, structured-clone, object-freeze]
related:
  - javascript/objects-and-properties/shallow-vs-deep-copy
  - javascript/objects-and-properties/freeze-seal-preventextensions
  - javascript/arrays/mutating-vs-copying-methods
  - javascript/functional-programming/persistent-data-structures
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-copydataproperties
  - https://tc39.es/ecma262/#sec-array.prototype.with
  - https://tc39.es/ecma262/#sec-array.prototype.tosorted
  - https://tc39.es/ecma262/#sec-array.prototype.tospliced
  - https://tc39.es/ecma262/#sec-array.prototype.toreversed
  - https://tc39.es/ecma262/#sec-object.freeze
  - https://tc39.es/ecma262/#sec-setintegritylevel
  - https://github.com/tc39/proposals/blob/main/finished-proposals.md
  - https://github.com/tc39/proposal-change-array-by-copy
  - https://html.spec.whatwg.org/multipage/structured-data.html#dom-structuredclone
  - https://html.spec.whatwg.org/multipage/structured-data.html#structuredserializeinternal
  - https://immerjs.github.io/immer/
tldr: >
  Copy every object on the path from the root to the change and reuse everything else: spread
  for objects, `with`/`toSorted`/`toSpliced`/`toReversed` (ES2023) for arrays. Each update costs
  the size of the copied nodes, not the whole tree, and unchanged branches keep their identity,
  so `===` checks stay cheap. `structuredClone` and `Object.freeze` are not update tools.
---

## Answer

An immutable update builds a new version and leaves the old one untouched. The rule is **path copying**: copy each object between the root and the thing you change, and point the copies at the original, unchanged siblings.

The tools, and what each one actually does:

- **Object spread / `Object.assign`.** `{ ...obj }` runs `CopyDataProperties`: own enumerable string and symbol keys, read with `Get` (getters run, results become plain values). One level only; nested objects are shared.
- **Array copying methods.** `with(i, v)`, `toSorted`, `toSpliced` and `toReversed` came in ES2023 (Change Array by Copy). They return a new array of the same length, built with `ArrayCreate`, so a subclass gets back a plain `Array`. `sort`, `splice` and `reverse` still mutate.
- **`structuredClone`.** A deep copy defined by the HTML Standard, not ECMAScript (browsers and Node.js provide it). It copies everything and keeps nothing shared, so it is a snapshot tool, not an update tool.
- **`Object.freeze`.** A guard, not a copy. It's shallow: nested objects stay writable unless you freeze them too.

**The cost.** Each update allocates one new node per level of the path, and each new node copies all of its own keys or elements. Changing one item in a 10,000-element array copies 10,000 slots; changing one key in a deep object copies only the objects on its path. What you get back is **identity**: unchanged subtrees are still the same objects, so React, Redux selectors or `memo` can skip them with a single `===`.

When arrays get large or updates frequent, that O(n) per level is what persistent data structures fix by sharing inside each node, too.

## Example

```js
const state = {
  user: { name: 'Ada', tags: ['admin'] },
  todos: [{ id: 1, done: false }, { id: 2, done: false }],
};

// Mark todo 2 done: copy each object on the path, share the rest.
const next = {
  ...state,
  todos: state.todos.with(1, { ...state.todos[1], done: true }),
};

console.log(next.todos[1].done, state.todos[1].done); // → true false
// user and todos[0] are shared; the root and todos array are new
console.log(next.user === state.user, next.todos[0] === state.todos[0]); // → true true
console.log(next === state, next.todos === state.todos); // → false false

// Spread is shallow: a write through the copy reaches the original.
const careless = { ...state };
careless.user.tags.push('editor');
console.log(state.user.tags); // → [ 'admin', 'editor' ]

// freeze is shallow too.
const frozen = Object.freeze({ inner: { n: 1 } });
frozen.inner.n = 2;
console.log(frozen.inner.n); // → 2
```

## Pitfalls

- Spreading the top level and then mutating something nested. The copy and the original share every nested object, so the "old" state changes too.
- Calling `sort()`, `reverse()` or `splice()` on an array that belongs to state. Use `toSorted()`, `toReversed()`, `toSpliced()`, or copy first.
- Using `structuredClone` for every update. It costs the whole tree, throws a `DataCloneError` on functions, returns plain objects instead of class instances, and gives every unchanged branch a new identity, so memoised consumers all re-render.
- Trusting `Object.freeze` as deep protection. It freezes one level, and in sloppy-mode code writes to frozen properties fail silently instead of throwing.

## Follow-ups

**Q:** What does `with` do with a negative or out-of-range index?
**A:** It runs `ToAbsoluteIndex`, so `-1` means the last element. If the resulting index is outside `0…length - 1` it throws a `RangeError`. Unlike assignment, it can't grow the array.

**Q:** Do `toSorted` and `with` preserve an `Array` subclass?
**A:** No. They create the result with `ArrayCreate`, so you always get a plain `Array`. `map` and `filter` use `ArraySpeciesCreate` and return the subclass.

**Q:** How does Immer fit in?
**A:** Immer is a library, not a language feature. `produce(base, recipe)` hands your recipe a draft (a Proxy), records the writes, and builds the next state by copying only changed paths; its docs say unchanged parts are shared with the previous version. It writes the same path copying for you.

## Exercises

### Predict the output

```js
const a = { list: [3, 1, 2], meta: { sorted: false } };
const b = { ...a, meta: { ...a.meta, sorted: true } };
b.list.sort();
console.log(a.list, a.meta.sorted, b.list === a.list);
```

**Answer:** `[ 1, 2, 3 ] false true`. `meta` was copied before the change, so `a.meta` is untouched. `list` was never copied: both versions share one array, and `sort()` reorders it in place. `b.list.toSorted()` would have left `a.list` alone.

### Predict the output

```js
const state = { a: { n: 1 }, b: { n: 2 } };
const viaClone = structuredClone(state);
viaClone.a.n = 10;
const viaSpread = { ...state, a: { ...state.a, n: 10 } };
console.log(viaClone.b === state.b, viaSpread.b === state.b, state.a.n);
```

**Answer:** `false true 1`. Both updates leave `state` alone, but the deep clone also replaced `b`, which didn't change. Path copying kept `b` as the same object, so an `===` check can skip it.
