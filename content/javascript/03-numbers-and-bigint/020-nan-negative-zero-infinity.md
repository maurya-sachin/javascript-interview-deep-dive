---
title: "What are `NaN`, `-0`, and `Infinity`, and how do you test for them?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [nan, negative-zero, infinity, object-is, same-value-zero, number]
related:
  - javascript/numbers-and-bigint/floating-point-precision
  - javascript/values-and-types/language-types
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-ecmascript-language-types-number-type
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Infinity
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness
tldr: >
  They are special `Number` values defined by IEEE 754. `NaN` means "not a valid number" and is the only
  value not equal to itself, so test it with `Number.isNaN`. `-0` is a distinct zero that `===` can't see;
  use `Object.is`. `Infinity` comes from overflow or division by zero; test with `Number.isFinite`.
---

## Answer

All three are ordinary `Number` values (`typeof NaN` is `"number"`) that the IEEE 754 binary64 format reserves for results that aren't a normal finite number.

- **`NaN`** ("not a number") is the result of an invalid operation: `0 / 0`, `Math.sqrt(-1)`, `Infinity - Infinity`, `Number('abc')`. It is the only JavaScript value for which `x !== x`, and every comparison with it is `false`, so `x === NaN` can never work. Test with **`Number.isNaN(x)`**, which does no coercion. The global `isNaN` coerces first, so `isNaN('foo')` is `true`.
- **`-0`** is a second zero with the sign bit set. It comes from things like `-1 * 0`, `Math.round(-0.4)` or `-0` itself. `0 === -0` is `true`, and `String(-0)` is `"0"`, so it is easy to miss. `Object.is(x, -0)` detects it, and `1 / x` is `-Infinity` for it.
- **`Infinity` / `-Infinity`** result from overflow or from dividing a non-zero number by `±0`. `1 / 0` is `Infinity`; `1 / -0` is `-Infinity`. Test with **`Number.isFinite(x)`**, which is `false` for `NaN` and both infinities and does no coercion.

Which equality sees what:

| | `NaN` vs `NaN` | `0` vs `-0` |
|---|---|---|
| `===`, `indexOf` | not equal | equal |
| `Object.is` (SameValue) | equal | not equal |
| `includes`, `Set`, `Map` (SameValueZero) | equal | equal |

## Example

```js
console.log(NaN === NaN, Number.isNaN(NaN)); // → false true
console.log(isNaN('foo'), Number.isNaN('foo')); // → true false

console.log(0 === -0, Object.is(0, -0)); // → true false
console.log(String(-0), JSON.stringify(-0), -0); // → 0 0 -0
console.log(Math.round(-0.4), 1 / Math.round(-0.4)); // → -0 -Infinity

console.log(1 / 0, -1 / 0, 1 / -0); // → Infinity -Infinity -Infinity
console.log(Number.isFinite(1 / 0), Number.isFinite('12'), isFinite('12')); // → false false true

console.log([NaN].includes(NaN), [NaN].indexOf(NaN)); // → true -1
console.log(new Set([NaN, NaN, 0, -0]).size); // → 2
```

## Pitfalls

- Writing `x === NaN`. It is always `false`; use `Number.isNaN(x)` (or the less readable `x !== x`).
- Using global `isNaN`/`isFinite` on user input. They coerce: `isNaN('')` is `false` because `Number('')` is `0`, and `isNaN({})` is `true`.
- Assuming `-0` shows up in `String` or `JSON.stringify` output. Both print `0`, so the sign is lost on serialization (`console.log` and `Object.is` still show it).
- Using `indexOf` to look for `NaN`. It uses strict equality and returns `-1`; use `includes`.

## Follow-ups

**Q:** Why does `Infinity - Infinity` give `NaN` but `Infinity + 1` give `Infinity`?
**A:** `Infinity - Infinity` has no meaningful value, so IEEE 754 arithmetic yields `NaN`. Adding a finite number to infinity leaves it infinite.

**Q:** How do you test for `-0` without `Object.is`?
**A:** `x === 0 && 1 / x === -Infinity`. It works because dividing by `-0` gives `-Infinity`. `Object.is(x, -0)` says the same thing directly.

## Exercises

### Find the NaN

```js
const values = [1, NaN, 'x', undefined];
console.log(values.findIndex(Number.isNaN));
console.log(values.indexOf(NaN));
console.log(values.filter(isNaN).length);
```

**Answer:** `1`, `-1`, `3`. `Number.isNaN` matches only the actual `NaN`; `indexOf` uses `===`; the global `isNaN` also matches `'x'` and `undefined`.

### Detect a negative zero

```js
const isNegativeZero = (x) => Object.is(x, -0);
console.log([0, -0, 0 * -1, -5 % 5].map(isNegativeZero));
```

**Answer:** `[false, true, true, true]`. Multiplying by a negative number and taking the remainder of a negative dividend both preserve the sign of zero.
