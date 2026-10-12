---
title: "`===` vs `Object.is` vs SameValueZero — which comparison does each API use?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [equality, same-value, same-value-zero, strict-equality, object-is, nan]
related:
  - javascript/coercion-and-equality/loose-equality
  - javascript/values-and-types/language-types
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-isstrictlyequal
  - https://tc39.es/ecma262/#sec-samevalue
  - https://tc39.es/ecma262/#sec-samevaluezero
  - https://tc39.es/ecma262/#sec-array.prototype.includes
  - https://tc39.es/ecma262/#sec-array.prototype.indexof
  - https://tc39.es/ecma262/#sec-map.prototype.set
  - https://tc39.es/ecma262/#sec-object.is
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
tldr: >
  The three algorithms differ only for `NaN` and signed zero. `===` (IsStrictlyEqual) and `indexOf` treat
  `NaN` as unequal to itself and `0 === -0`. `Object.is` (SameValue) equates `NaN` with `NaN` and
  distinguishes `0` from `-0`. SameValueZero, used by `includes`, `Map` and `Set`, equates `NaN` and also treats `0` and `-0` as the same.
---

## Answer

None of the three coerces types: different types are never equal. They differ on exactly two inputs.

| Algorithm | `NaN` vs `NaN` | `+0` vs `-0` | Used by |
|---|---|---|---|
| IsStrictlyEqual | not equal | equal | `===`, `!==`, `switch`, `indexOf`, `lastIndexOf` |
| SameValue | equal | **not** equal | `Object.is`, property redefinition checks (`Object.defineProperty`) |
| SameValueZero | equal | equal | `includes`, `Map` keys, `Set` values |

Everything else matches: two Strings are equal when their code units match, two BigInts when their values match, and objects, symbols, `null`, `undefined` and Booleans compare by identity or value as you would expect.

Practical consequences:

- `[NaN].indexOf(NaN)` is `-1` but `[NaN].includes(NaN)` is `true`.
- A `Map` or `Set` treats `NaN` as one key. It also treats `-0` and `+0` as the same key (the spec's key canonicalization turns `-0` into `+0` first).
- `Object.is(0, -0)` is `false`; use it when the sign matters (for example, detecting `-0` from `Math.round(-0.4)`).
- Use `Number.isNaN(x)` or `Object.is(x, NaN)` to test for `NaN`, never `x === NaN`.

`===` stays the default for application code. Reach for `Object.is` when you need a precise "same value" test and for `includes` when searching arrays that may contain `NaN`.

## Example

```js
console.log(NaN === NaN, Object.is(NaN, NaN)); // → false true
console.log(0 === -0, Object.is(0, -0)); // → true false

const list = [NaN, -0];
console.log(list.indexOf(NaN), list.includes(NaN)); // → -1 true
console.log(list.indexOf(0), list.includes(0)); // → 1 true

const map = new Map([[NaN, "nan"], [-0, "zero"]]);
console.log(map.get(NaN), map.get(0)); // → nan zero
console.log([...map.keys()].map((k) => Object.is(k, -0))); // → [ false, false ]

console.log(new Set([0, -0, NaN, NaN]).size); // → 2
```

## Pitfalls

- Writing `x === NaN`. It is always `false`. Use `Number.isNaN(x)`.
- Using `indexOf(x) !== -1` to test for membership when `NaN` is possible. Use `includes`.
- Expecting a `Map` to preserve `-0` as a key. The stored key is `+0`; `Object.is(k, -0)` fails for every key.
- Assuming `Object.is` is a stricter `===` for objects. For objects, strings and other non-Number types the three algorithms agree.

## Follow-ups

**Q:** Why does `Map` use SameValueZero rather than SameValue?
**A:** So `NaN` works as a key and `0`/`-0` do not become different entries. The spec canonicalizes `-0` to `+0` before storing, and compares keys with SameValue afterwards; the observable effect is SameValueZero.

**Q:** Does `Object.is` coerce its arguments?
**A:** No. `Object.is("1", 1)` is `false`, and `Object.is(1n, 1)` is `false`.

**Q:** Which comparison do `Array.prototype.find` and `findIndex` use?
**A:** None. They call your predicate, so you choose the comparison.

## Exercises

### Pick the output

```js
const values = [NaN, 0, -0];
console.log(values.indexOf(NaN), values.includes(-0), values.lastIndexOf(0));
```

**Answer:** `-1 true 2`. `indexOf` uses IsStrictlyEqual, so `NaN` is not found. `includes` uses SameValueZero, so `-0` matches `0`. `lastIndexOf` also uses IsStrictlyEqual, where `0 === -0` is true, and the last match is index 2.

### Which keys survive?

```js
const set = new Set([NaN, NaN, 0, -0, "0", 0n]);
console.log(set.size, [...set].map((v) => Object.is(v, -0)));
```

**Answer:** `4 [ false, false, false, false ]`. The kept values are `NaN`, `0`, `"0"` and `0n`. `-0` was merged into the existing `0`, and `0` is stored as `+0`, so `Object.is(v, -0)` is false for every element.
