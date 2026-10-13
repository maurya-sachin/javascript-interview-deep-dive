---
title: "What's new for iterators after ES2025?"
status: draft
difficulty: medium
frequency: 1
core: false
tags: [iterator-concat, iterator-zip, joint-iteration, chunks, windows, iterator-join, iterator-includes, tc39]
related:
  - javascript/iterators-and-generators/iterator-helpers
  - javascript/iterators-and-generators/generators
verified: 2026-10
sources:
  - https://github.com/tc39/proposals/blob/main/finished-proposals.md
  - https://tc39.es/ecma262/#sec-iterator.concat
  - https://tc39.es/ecma262/#sec-iterator.zip
  - https://tc39.es/ecma262/#sec-iterator.prototype.join
  - https://github.com/tc39/proposal-iterator-sequencing
  - https://github.com/tc39/proposal-joint-iteration
  - https://github.com/tc39/proposal-iterator-chunking
  - https://github.com/michaelficarra/proposal-iterator-includes
  - https://github.com/tc39/proposal-iterator-join
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/concat
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/zip
tldr: >
  After the ES2025 helpers, TC39 has finished `Iterator.concat` (ES2026), then `Iterator.zip`/`zipKeyed`,
  `Iterator.prototype.join`, `chunks`/`windows` and `includes` (expected ES2027). As of October 2026 none
  of these exists in Node 24.19, and only `concat` exists in Node 26.7, so detect features or polyfill.
---

## Answer

Several follow-ups to the ES2025 iterator helpers have reached Stage 4. This is the status as of October 2026, checked against the tc39/proposals finished list, the current ECMA-262 draft, and Node 24.19.0 and 26.7.0 (both tested).

| Feature | What it does | Edition (tc39/proposals) | Node 24.19 | Node 26.7 |
|---|---|---|---|---|
| `Iterator.concat(...iterables)` | Yields each iterable in turn | ES2026 | no | yes |
| `Iterator.zip` / `zipKeyed` | Steps iterables in lockstep into arrays or objects | ES2027 | no | no |
| `Iterator.prototype.join` | Joins values into a string, like `Array#join` | ES2027 | no | no |
| `chunks(n)` / `windows(n)` | Non-overlapping or sliding groups | ES2027 | no | no |
| `includes(value)` | SameValueZero membership test | ES2027 | no | no |

The current ECMA-262 draft contains `concat`, `zip`, `zipKeyed` and `join`. It did not yet contain `chunks`, `windows` or `includes` when I read it. For those three, the proposal repositories still said Stage 3 while the tc39/proposals commits record Stage 4 on 29 September 2026, so treat their final shape as slightly less settled.

Key behaviour:

- `concat` takes iterables only. Strings and bare iterators throw a `TypeError`; wrap an iterator with `Iterator.from`.
- `zip` takes an iterable of iterables and an options bag with `mode`: `"shortest"` (default), `"longest"` (with optional `padding`) or `"strict"` (throws if lengths differ). It closes the other inputs when it stops, so infinite inputs are fine.
- `chunks` yields a shorter final group. `windows` yields only full windows unless you pass `"allow-partial"`.

Still unfinished: `Iterator.range` and async iterator helpers are Stage 2.

Until you can rely on these, feature-detect or use a polyfill such as core-js, or write the small generator equivalents.

## Example

The outputs come from running this on Node 24.19 with core-js 3.50.0 loaded. On plain Node 24 it prints the "Not available" line.

```js
const missing = ['concat', 'zip', 'zipKeyed'].filter((name) => typeof Iterator[name] !== 'function');

if (missing.length > 0) {
  console.log('Not available in this runtime:', missing.join(', '));
} else {
  console.log(Iterator.concat([1, 2], new Set([3]), [4]).toArray());
  // → [ 1, 2, 3, 4 ]

  const ids = [1, 2, 3];
  const names = ['ann', 'bo'];
  console.log(Iterator.zip([ids, names]).toArray());
  // → [ [ 1, 'ann' ], [ 2, 'bo' ] ]
  console.log(Iterator.zip([ids, names], { mode: 'longest' }).toArray());
  // → [ [ 1, 'ann' ], [ 2, 'bo' ], [ 3, undefined ] ]
  console.log(Iterator.zipKeyed({ id: ids, name: names }).toArray()[0]);
  // → [Object: null prototype] { id: 1, name: 'ann' }
  try {
    Iterator.zip([ids, names], { mode: 'strict' }).toArray();
  } catch (error) {
    console.log(error.constructor.name); // → TypeError
  }
}
```

## Pitfalls

- Shipping code that calls these without a guard. In Node 24 `Iterator.concat` is `undefined`, so the call throws a `TypeError`. Feature-detect, or load a polyfill.
- Using `zip` and silently losing data. The default mode is `"shortest"`, so the third `id` above vanishes. Choose `"longest"` or `"strict"` when lengths should match.
- Passing a string or a bare `{ next() }` object to `concat`. Both throw; strings are not objects, and a bare iterator has no `[Symbol.iterator]`.
- Expecting `windows(3)` on two elements to return something. It yields nothing unless you pass `"allow-partial"`.

## Follow-ups

**Q:** How do I get these today?
**A:** Feature-detect and fall back, or load core-js, which has modules for all of them (I ran the examples on 3.50.0). Or write generators: `concat` is `yield*` in sequence, and `chunks` is a buffer that you flush at the size.

**Q:** Why does `zip` take an array of iterables instead of varargs?
**A:** Varargs would leave no room for the options bag or a later combiner argument. The proposal records this decision.

**Q:** What do `includes` and `join` match?
**A:** `includes` uses SameValueZero (so `NaN` matches) and takes an optional start offset that cannot be negative. `join` follows `Array.prototype.join`: separator defaults to `","`, and `null` and `undefined` become empty strings.

## Exercises

### Write the fallback

Until `windows` is available you can write it as a generator. This runs on Node 24 as written. What does it print?

```js
function* windows(iterable, size) {
  const buffer = [];
  for (const value of iterable) {
    if (buffer.length === size) buffer.shift();
    buffer.push(value);
    if (buffer.length === size) yield [...buffer];
  }
}

console.log([...windows('abcd', 2)]);
console.log([...windows([1], 2)]);
```

**Answer:** `[ [ 'a', 'b' ], [ 'b', 'c' ], [ 'c', 'd' ] ]`, then `[]`. A window is yielded only once the buffer is full, so one element never fills a window of two. That matches the native default of `"only-full"`. The copy `[...buffer]` matters: yielding the buffer itself would hand every consumer the same array.
