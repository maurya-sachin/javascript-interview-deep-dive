---
title: "How does `<` compare values of different types, and why is `null >= 0` true?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [coercion, comparison, islessthan, toprimitive, strings, bigint]
related:
  - javascript/coercion-and-equality/loose-equality
  - javascript/coercion-and-equality/object-to-primitive
  - javascript/coercion-and-equality/addition-operator-coercion
  - javascript/strings-and-unicode/locale-comparison-normalization
  - javascript/numbers-and-bigint/nan-negative-zero-infinity
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-islessthan
  - https://tc39.es/ecma262/#sec-relational-operators-runtime-semantics-evaluation
  - https://tc39.es/ecma262/#sec-toprimitive
  - https://tc39.es/ecma262/#sec-tonumeric
  - https://tc39.es/ecma262/#sec-stringtobigint
  - https://tc39.es/ecma262/#sec-islooselyequal
tldr: >
  All four relational operators run one algorithm, IsLessThan. It converts both operands with
  `ToPrimitive` (number hint); two strings compare by UTF-16 code units, anything else converts to
  numbers. `NaN` gives "undefined", which every operator reports as `false`. `>=` means "not `<`",
  so `null >= 0` is `!(0 < 0)`, `true`, even though `null == 0` is `false`.
---

## Answer

`<`, `>`, `<=` and `>=` all use one abstract operation, **IsLessThan(x, y)**, which returns `true`, `false` or **undefined** ("not comparable"):

1. Convert both operands with `ToPrimitive(…, number)`: objects try `valueOf` before `toString`.
2. If **both** primitives are strings, compare them code unit by code unit; a proper prefix is less. No conversion to numbers happens, so `'10' < '9'` is `true`.
3. A BigInt and a string: parse the string with `StringToBigInt`; if that fails, the result is undefined.
4. Otherwise convert both with `ToNumeric` and compare numerically. A BigInt and a Number compare by exact mathematical value. If either side is `NaN`, the result is undefined.

The operators then map that result:

- `x < y` is IsLessThan(x, y); `x > y` is IsLessThan(y, x). Undefined becomes `false`.
- `x >= y` is **not** IsLessThan(x, y); `x <= y` is **not** IsLessThan(y, x). Undefined becomes `false` here too, rather than being negated.

So `null >= 0`: `null` converts to `0`, `0 < 0` is `false`, and `>=` returns the negation, `true`. `null > 0` is `false` (it asks `0 < 0`). Meanwhile `null == 0` is `false`, because loose equality has its own algorithm in which `null` equals only `null` and `undefined`. The relational operators and `==` were never designed to agree.

`undefined` converts to `NaN`, so every relational comparison with it is `false`, including `undefined >= 0`.

One subtlety: `x > y` swaps the operands, so the spec passes a `leftFirst` flag that still converts `x` before `y`, keeping left-to-right order for side effects.

## Example

```js
console.log(null >= 0, null > 0, null == 0); // → true false false
console.log(undefined >= 0, undefined < 0); // → false false
console.log(NaN < 1, NaN >= 1); // → false false

console.log('10' < '9', '10' < 9); // → true false
console.log('Z' < 'a', 'apple' < 'apples'); // → true true

console.log([2] > [10]); // → true
console.log(new Date(2026, 0, 2) > new Date(2026, 0, 1)); // → true

console.log(1n < 1.5, 1n < '2', 1n < '1.5'); // → true true false

console.log(1 < 2 < 3, 3 > 2 > 1); // → true false
```

## Pitfalls

- Comparing numeric strings from inputs or JSON: `'10' < '9'` is `true`. Convert with `Number()` first.
- Writing `a >= b` as a stand-in for `!(a < b)` with `NaN` or `undefined` around. Both `a < b` and `a >= b` are `false` when either is `NaN`.
- Sorting user-facing text with `<`. It compares UTF-16 code units, so `'Z' < 'a'` and accented letters sort after `z`; use `Intl.Collator` or `localeCompare`.
- Chaining comparisons like in maths. `3 > 2 > 1` is `(3 > 2) > 1`, which is `true > 1`, which is `1 > 1`: `false`.

## Follow-ups

**Q:** How do you compare two arrays or objects with `<`?
**A:** You don't, meaningfully. Plain objects become `"[object Object]"`, so `{} < {}` is `false` and `{} >= {}` is `true`. Arrays become their joined string, compared as text. Compare the fields you care about explicitly.

**Q:** Why do `Date` objects compare correctly with `<` but not with `==`?
**A:** `<` uses the number hint, so `Date`'s `valueOf` returns the time value and the numbers are compared. `==` between two objects compares identity, so two equal dates are not `==`.

**Q:** Does a Symbol compare with `<`?
**A:** No. A Symbol survives `ToPrimitive` and then `ToNumeric` throws a `TypeError`.

## Exercises

### Predict the output

```js
const log = [];
const a = { valueOf() { log.push('a'); return 1; } };
const b = { valueOf() { log.push('b'); return 2; } };
console.log(a > b, ({}) >= ({}), log.join(''));
```

**Answer:** `false true ab`. `a > b` evaluates IsLessThan(b, a) with `leftFirst` false, so the spec converts `a` first anyway and the log reads `ab`; `2 < 1` is `false`. The two empty objects both become `"[object Object]"`; the strings are equal, so "not less than" is `true`.
