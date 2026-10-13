---
title: "How does V8 store arrays?"
status: draft
difficulty: hard
frequency: 1
core: false
tags: [v8, elements-kinds, arrays, packed, holey, smi, performance]
related:
  - javascript/inside-the-engine/hidden-classes-inline-caches
  - javascript/inside-the-engine/smi-and-heap-numbers
verified: 2026-10
sources:
  - https://v8.dev/blog/elements-kinds
  - https://v8.dev/blog/fast-properties
  - https://nodejs.org/docs/latest/api/cli.html
tldr: >
  V8-specific, not ECMAScript. Integer-indexed properties live in a separate elements store whose
  representation V8 tracks as an elements kind: packed or holey, crossed with Smi, double, or
  generic. Kinds only move from specific to general, so one stray value or hole costs
  every later access on that array.
---

## Answer

This is **V8 behaviour**, per V8's elements-kinds blog and checked on Node 24.19 (V8 13.6). The language only specifies that arrays behave like objects with index keys.

V8 keeps **array-indexed properties** in an **elements store**, separate from named properties ([fast properties](https://v8.dev/blog/fast-properties)). The store's representation is tracked as the array's **elements kind**:

- **Value kind:** `SMI` (small integers), `DOUBLE` (numbers, stored as raw doubles), or plain `ELEMENTS` (anything else, including objects and `undefined`).
- **Packing:** `PACKED` (no holes) or `HOLEY` (at least one missing index).

That gives `PACKED_SMI_ELEMENTS`, `PACKED_DOUBLE_ELEMENTS`, `PACKED_ELEMENTS` and the three `HOLEY_` forms. There are also other kinds: a very sparse array moves to `DICTIONARY_ELEMENTS`, a hash table.

**Transitions are one-way**, from specific to general: Smi to double to generic, and packed to holey. Pushing `4.5` into a Smi array makes it double; pushing a string makes it generic. Emptying the array does not reset the kind. Per the blog, `-0`, `NaN` and `Infinity` count as doubles, so one of them downgrades a Smi array.

**Why it matters.** Code and inline caches specialise on the kind, so a function that sees several kinds is polymorphic, just like with object shapes. Reading a hole forces a prototype-chain lookup, because `arr[i]` on a missing index may find a value on `Array.prototype`. Packed arrays avoid that check.

**Habits:** build arrays with literals or `push`, not `new Array(n)` followed by out-of-order writes; keep one value type per hot array; do not read past the end.

## Example

```js
// kinds.mjs. Run: node --allow-natives-syntax kinds.mjs | grep "elements kind"
// %DebugPrint is a debug-only native, not public API. Node 24.19, V8 13.6.
const a = [1, 2, 3];
%DebugPrint(a); // → elements kind: PACKED_SMI_ELEMENTS
a.push(4.5);
%DebugPrint(a); // → elements kind: PACKED_DOUBLE_ELEMENTS
a.push('x');
%DebugPrint(a); // → elements kind: PACKED_ELEMENTS
a.length = 0;
a.push(1);
%DebugPrint(a); // → elements kind: PACKED_ELEMENTS (never goes back)

const h = [1, 2, 3];
h[5] = 6;
%DebugPrint(h); // → elements kind: HOLEY_SMI_ELEMENTS
```

`%DebugPrint` prints much more; the `grep` keeps the one line each comment shows.

## Pitfalls

- Believing a Smi array turns into a double array only when you add a fraction. `-0` and `NaN` do it too, per the blog, and I confirmed `[1, 2, 3, -0]` is `PACKED_DOUBLE_ELEMENTS`.
- Believing "once holey, always holey" without checking. The blog describes one-way transitions between kinds, but on Node 24.19 `new Array(3)` is `HOLEY_SMI_ELEMENTS` and `new Array(3).fill(0)` printed `PACKED_SMI_ELEMENTS`. I did not find the reason in a source; do not rely on this either way.
- Treating `[1, undefined]` as a number array. It printed `PACKED_ELEMENTS`.
- Expecting `%DebugPrint` to be a stable interface. Treat kind names and the transition rules as version-dependent.

## Follow-ups

**Q:** Are arrays in JavaScript really contiguous memory?
**A:** Not by the language. In V8, the packed kinds use a contiguous backing store, but a sparse array moves to a dictionary. `big[100_000_000] = 1` printed `DICTIONARY_ELEMENTS` in my run.

**Q:** Does putting an integer in a double array change its kind?
**A:** No. `[1.5, 2.5]` followed by `push(1)` stayed `PACKED_DOUBLE_ELEMENTS`; the value is stored as a double.

**Q:** What about `[1, 2, 3]` literals?
**A:** In `%DebugPrint` the backing store of the literal showed `(COW)`: copy-on-write, so literals can share a backing store until written. I did not research the sharing rules.

## Exercises

### Predict the kinds

```js
// predict.mjs. Run: node --allow-natives-syntax predict.mjs | grep "elements kind"
%DebugPrint([1, , 3]);
%DebugPrint([1.5, 2.5, 3]);
%DebugPrint(Array.from({ length: 3 }, (_, i) => i));
```

**Answer:** `HOLEY_SMI_ELEMENTS`, `PACKED_DOUBLE_ELEMENTS` (the literal's `3` is stored as a double), `PACKED_SMI_ELEMENTS`. Observed on Node 24.19 (V8 13.6).
