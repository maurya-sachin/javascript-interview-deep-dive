---
title: "How do you compare two objects for equality?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [objects, equality, deep-equal, object-is, cycles]
related:
  - javascript/coercion-and-equality/equality-algorithms
  - javascript/numbers-and-bigint/nan-negative-zero-infinity
  - javascript/objects-and-properties/shallow-vs-deep-copy
  - javascript/keyed-collections/map-vs-object
verified: 2026-10
perishable:
  - util.isDeepStrictEqual skipPrototype option, added in Node.js 24.9
sources:
  - https://tc39.es/ecma262/#sec-isstrictlyequal
  - https://tc39.es/ecma262/#sec-samevalue
  - https://tc39.es/ecma262/#sec-ordinaryownpropertykeys
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
  - https://nodejs.org/docs/latest-v24.x/api/util.html#utilisdeepstrictequalval1-val2-options
  - https://nodejs.org/docs/latest-v24.x/api/assert.html#comparison-details_1
tldr: >
  `===` and `Object.is` compare object identity, so two equal-looking objects differ. Deep
  equality is something you define: same prototype, same own keys, equal values recursively,
  with explicit decisions for `NaN`, `-0`, `undefined` versus missing keys, `Map`/`Set`, and
  cycles. In Node, `util.isDeepStrictEqual` already does this; elsewhere use a vetted library.
---

## Answer

Objects are compared by **reference**: `{} === {}` is `false`, and `Object.is({}, {})` is `false` too. `JSON.stringify(a) === JSON.stringify(b)` is a trap, not a substitute: it depends on key order, turns `NaN` into `null`, drops `undefined` and functions, and throws on cycles and `BigInt`.

**Deep equality** compares structure. The algorithm:

1. If `Object.is(a, b)`, they are equal. `Object.is` is `SameValue`, so `NaN` equals `NaN`, and `0` differs from `-0`.
2. If either is a non-object (or `null`), they differ.
3. If their tags or prototypes differ, they differ.
4. Special types need their own rule: `Date` compares `getTime()`.
5. Otherwise compare own enumerable keys: same count, every key present on both, and values equal recursively. Key order doesn't matter.
6. **Cycles:** remember which `(a, b)` pairs are being compared. If you meet a pair again, assume equal, which stops the infinite recursion.

Every step is a policy decision: whether `-0` equals `0`, whether `{ a: undefined }` equals `{}`, whether different classes with the same fields are equal, whether symbol keys and non-enumerable properties count, and how `Map`, `Set`, `RegExp` and typed arrays compare.

In Node, `util.isDeepStrictEqual` makes one set of choices: same prototypes (unless you pass `skipPrototype`, added in Node.js 24.9), `NaN` equal, `-0` differs, `Map` and `Set` compared by content. Outside Node, use a maintained library for production code.

The implementation below is deliberately limited to plain objects, arrays, class instances and `Date`.

## Example

```js
const toTag = (value) => Object.prototype.toString.call(value);

function deepEqual(a, b, seen = new WeakMap()) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (toTag(a) !== toTag(b) || Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (a instanceof Date) return Object.is(a.getTime(), b.getTime());
  if (toTag(a) !== '[object Object]' && !Array.isArray(a)) return false; // Map, Set, RegExp…: identity only

  if (seen.get(a) === b) return true; // already comparing this pair: assume equal
  seen.set(a, b);

  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key], seen))
  );
}

console.log(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })); // → true
console.log(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })); // → true
console.log(deepEqual({ a: undefined }, { b: undefined })); // → false
console.log(deepEqual(NaN, NaN), deepEqual(0, -0)); // → true false
console.log(deepEqual(new Date(0), new Date(0))); // → true
console.log(deepEqual([1, 2], { 0: 1, 1: 2 })); // → false

const x = { name: 'x' }; x.self = x;
const y = { name: 'x' }; y.self = y;
console.log(deepEqual(x, y)); // → true
console.log(deepEqual(new Map([[1, 2]]), new Map([[1, 2]]))); // → false
```

## Pitfalls

- Comparing with `==` or `===` and expecting structure. Both are identity checks for objects.
- Using `JSON.stringify` equality. Key order changes the string, and unequal values (`{ a: undefined, b: NaN }` and `{ b: null }`) can produce the same one.
- Forgetting that types with no own enumerable keys, such as `Map`, `Set` and `RegExp`, look "equal" to every other instance if you only compare keys. This code returns `false` for them (identity only) rather than guess.
- Skipping the cycle guard. Self-referencing data overflows the stack (a `RangeError` in V8).

## Follow-ups

**Q:** What does this function not handle?
**A:** Symbol keys and non-enumerable properties are ignored, so two objects that differ only there compare equal. `Map`, `Set`, `RegExp`, typed arrays and boxed primitives are equal only by identity. Private fields can't be read, and getters run during comparison. Sparse arrays differ from arrays with `undefined`.

**Q:** How would you add `Set` support?
**A:** Check equal sizes, then for each element of `a` look for an equal element in `b`. Primitives can use `b.has`, but object elements need an `O(n²)` deep search that marks matches as used.

**Q:** Why check the prototype?
**A:** Without it, instances of different classes with the same fields compare equal. Whether that is wanted is a policy choice; `util.isDeepStrictEqual` treats them as different by default.

## Exercises

### Predict the output

```js
console.log(JSON.stringify({ a: 1, b: 2 }) === JSON.stringify({ b: 2, a: 1 }));
console.log(JSON.stringify({ a: undefined, b: NaN }) === JSON.stringify({ b: null }));
console.log([NaN].includes(NaN), [NaN].indexOf(NaN));
```

**Answer:** `false`, `true`, then `true -1`. Key order changes the string; `undefined` values are dropped and `NaN` becomes `null`, so the second pair matches. `includes` uses `SameValueZero` (finds `NaN`), while `indexOf` uses `===` (doesn't).
