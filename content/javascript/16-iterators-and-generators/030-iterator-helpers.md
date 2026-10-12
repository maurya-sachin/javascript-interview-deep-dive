---
title: "What are iterator helpers, and why are they lazy?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [iterator-helpers, iterator, lazy-evaluation, map, filter, take, flatmap, iterator-from]
related:
  - javascript/iterators-and-generators/iteration-protocols
  - javascript/iterators-and-generators/generators
  - javascript/arrays/implement-map-filter-reduce
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-iterator-objects
  - https://tc39.es/ecma262/#sec-iterator.from
  - https://tc39.es/ecma262/#sec-iterator.prototype.map
  - https://tc39.es/ecma262/#sec-iterator.prototype.take
  - https://tc39.es/ecma262/#sec-iterator.prototype.flatmap
  - https://tc39.es/ecma262/#sec-iterator.prototype.reduce
  - https://tc39.es/ecma262/#sec-getiteratorflattenable
  - https://github.com/tc39/proposals/blob/main/finished-proposals.md
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/map
tldr: >
  Iterator helpers (ES2025) put `map`, `filter`, `take`, `drop`, `flatMap` on `Iterator.prototype`. They
  return new lazy iterators that pull from the source only when asked, so no intermediate arrays are built
  and infinite sources work. `reduce`, `toArray`, `forEach`, `some`, `every` and `find` are eager. Plain
  iterators need `Iterator.from` first.
---

## Answer

Iterator helpers are methods on `Iterator.prototype`, so every built-in iterator and every generator object has them: `map`, `filter`, `take`, `drop` and `flatMap` return a new iterator; `reduce`, `toArray`, `forEach`, `some`, `every` and `find` consume the iterator and return a result. They are part of ES2025 (the proposal reached Stage 4 in October 2024), and MDN lists them as Baseline 2025, newly available. They ran in Node 24.

**Lazy** means the lazy helpers do nothing when called. `source.map(f)` only builds a helper object. Work happens when something calls `next()` on the result, and each `next()` pulls just enough elements from the source. Chained helpers form a pull pipeline. One element travels through `filter`, then `map`, then `take` before the next one is read. That gives you three things:

- No intermediate arrays, so memory stays flat.
- Infinite sources (`while (true) yield …`) work, as long as something such as `take` or `find` ends the pull.
- Short-circuiting. `take(n)` stops pulling, and then closes the source with `return()` so its `finally` runs.

The eager methods are the terminal step of a pipeline. `toArray()` is how you get back to an array.

The callbacks get `(value, counter)`, with the counter starting at 0. `reduce` without an initial value on an empty iterator throws a `TypeError`. `flatMap` must return an iterable or iterator, and strings are rejected, unlike `Iterator.from`.

Arrays themselves do not have these methods (`[].take` is `undefined`); use `array.values()` or `array[Symbol.iterator]()`. A hand-written `{ next() {…} }` object does not inherit from `Iterator.prototype` either. Wrap it with `Iterator.from(obj)` to get a proper iterator, which returns the argument unchanged if it already inherits from `Iterator.prototype`.

Helpers are single-use and synchronous only. Async iterator helpers are a separate Stage 2 proposal.

## Example

```js
function* naturals() {
  let n = 1;
  try {
    while (true) {
      console.log('produce', n);
      yield n++;
    }
  } finally {
    console.log('naturals closed');
  }
}

const evenSquares = naturals()
  .filter((n) => n % 2 === 0)
  .map((n) => n * n)
  .take(2);

console.log('pipeline built'); // → pipeline built
console.log(evenSquares.toArray());
// → produce 1
// → produce 2
// → produce 3
// → produce 4
// → naturals closed
// → [ 4, 16 ]
```

## Pitfalls

- Calling `.map()` on an array and expecting laziness, or calling `.take()` on one. Array methods are eager, and arrays do not have the iterator helpers. Use `array.values()` first.
- Reusing a helper after consuming it. `it.toArray()` twice gives `[]` the second time, because the source is already exhausted.
- Forgetting that nothing runs until a consumer pulls. A pipeline ending in `.map(sideEffect)` with no `toArray()`, `forEach()` or loop does nothing.
- Passing a bare `{ next() {…} }` object. It has no `map`; wrap it with `Iterator.from`.

## Follow-ups

**Q:** When does `take(n)` close the source?
**A:** On the call after the n-th value is delivered. It checks its remaining count before pulling, so it never fetches an `n+1`-th element. In the example, `naturals` is closed on the final `toArray()` pull without producing 5.

**Q:** How is this different from a generator pipeline I write myself?
**A:** It is the same idea packaged in the standard library. The helpers also validate arguments up front (a non-function throws a `TypeError` when you call `map`, not when you pull) and close the source on errors.

**Q:** What does `Iterator.from` accept?
**A:** Any iterable (including strings) or any object with `next()`. It returns existing iterators that inherit from `Iterator.prototype` as they are, and wraps the rest so they get the helper methods. Other values throw a `TypeError`.

## Exercises

### Predict the output

```js
const log = [];
const lazy = [1, 2, 3].values()
  .map((x) => { log.push(`map ${x}`); return x; })
  .filter((x) => { log.push(`filter ${x}`); return x > 1; });
console.log(lazy.next(), log);
```

**Answer:** `{ value: 2, done: false } [ 'map 1', 'filter 1', 'map 2', 'filter 2' ]`. One pull sends each element all the way through the pipeline before the next. `1` is dropped by `filter`, then `2` passes. `3` is never mapped, which an eager `[1, 2, 3].map(...).filter(...)` would have done.

### Where does it stop?

```js
const stock = new Map([['apple', 0], ['pear', 4], ['plum', 9], ['fig', 2]]);
console.log(
  stock.entries()
    .filter(([, qty]) => qty > 0)
    .map(([name]) => name.toUpperCase())
    .take(2)
    .toArray(),
);
```

**Answer:** `[ 'PEAR', 'PLUM' ]`. The pipeline reads `apple` (filtered out), `pear`, and `plum`, then `take(2)` has what it needs. `fig` is never examined, and no intermediate array of `[name, qty]` pairs is built.
