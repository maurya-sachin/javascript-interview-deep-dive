---
title: "What's `Number.MAX_SAFE_INTEGER`, and when do you need BigInt?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [bigint, safe-integer, max-safe-integer, number, json]
related:
  - javascript/numbers-and-bigint/floating-point-precision
  - javascript/values-and-types/language-types
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-ecmascript-language-types-bigint-type
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt/asIntN
tldr: >
  `Number.MAX_SAFE_INTEGER` is `2 ** 53 - 1` (9,007,199,254,740,991): the largest integer range where
  every integer is exactly representable and unique. Beyond it, neighbouring integers collapse. Use
  `BigInt` (`123n`) for exact larger integers, but it can't be mixed with `Number` and has no `Math` or JSON support.
---

## Answer

A `Number` is a double with a 53-bit significand, so integers are exact only up to a point. **Safe integers** run from `-(2 ** 53 - 1)` to `2 ** 53 - 1` (`Number.MIN_SAFE_INTEGER` to `Number.MAX_SAFE_INTEGER`). Per MDN, a safe integer is exactly representable and no other integer rounds to it. `2 ** 53` is representable, but `2 ** 53 + 1` rounds to it, so the two are indistinguishable. `Number.isSafeInteger(x)` checks for an integer in this range.

Use **`BigInt`** when you need exact integers beyond that: 64-bit database IDs, nanosecond timestamps, big factorials.

How BigInt works:

- Create with a literal (`123n`) or `BigInt(value)`. `typeof 1n` is `"bigint"`.
- Arbitrary precision: `2n ** 64n` is exact.
- Arithmetic works with `+ - * / % **`. Division truncates toward zero: `5n / 2n` is `2n`.
- **No mixing with `Number` in arithmetic.** `1n + 1` throws a `TypeError`; convert explicitly with `BigInt(x)` or `Number(b)`. Comparisons do mix: `1n < 1.5` and `1n == 1` are `true`, `1n === 1` is `false`.
- `BigInt(1.5)` throws `RangeError`; only integers convert.
- No `Math.*` methods, no unary `+`, no `>>>`.
- `JSON.stringify` throws on a BigInt; convert to string yourself.
- `BigInt.asIntN(bits, n)` / `asUintN` wrap a value to a signed / unsigned width, like a fixed-size integer type.

Convert with care: `Number(bigint)` above the safe range loses precision, and `BigInt(unsafeNumber)` only preserves what the Number already lost.

## Example

```js
const max = Number.MAX_SAFE_INTEGER; // 2 ** 53 - 1
console.log(max, Number.isSafeInteger(max + 1)); // → 9007199254740991 false
console.log(max + 1 === max + 2); // → true

console.log(9007199254740993); // → 9007199254740992
console.log(9007199254740993n); // → 9007199254740993n

console.log(5n / 2n, -5n / 2n, 2n ** 64n); // → 2n -2n 18446744073709551616n
console.log(1n == 1, 1n === 1, 1n < 1.5); // → true false true

try {
  1n + 1;
} catch (error) {
  console.log(error.name); // → TypeError
}

console.log(BigInt(max) + 2n); // → 9007199254740993n
console.log(BigInt.asIntN(64, 2n ** 63n)); // → -9223372036854775808n
```

## Pitfalls

- Parsing IDs with `JSON.parse`. A large integer is read as a `Number` and silently rounded: `JSON.parse('{"id":9007199254740993}').id` is `9007199254740992`. Have the API send big IDs as strings.
- `JSON.stringify({ id: 1n })` throws `TypeError`. Use a replacer or `toString()`.
- Converting late: `BigInt(2 ** 53 + 1)` is already `2n ** 53n`. Convert from the source string or literal, not from a Number.
- Reaching for `Math.max`, `Math.floor`, or `+x` with BigInt; they throw `TypeError`.

## Follow-ups

**Q:** Is `0n` falsy?
**A:** Yes. `0n` is falsy, every other BigInt is truthy.

**Q:** What does `BigInt.asIntN(64, x)` do?
**A:** It keeps the low 64 bits of `x` and reads them as a two's-complement signed integer, so `2n ** 63n` wraps to `-(2n ** 63n)`. `asUintN` reads them as unsigned.

## Exercises

### Spot the lost digit

```js
const id = JSON.parse('{"id":9007199254740993}').id;
console.log(id);
console.log(BigInt('9007199254740993') === BigInt(id));
```

**Answer:** `9007199254740992`, then `false`. `JSON.parse` produced a `Number`, which rounded the ID. Converting a string keeps the exact value.

### Mix types

```js
const total = 10n + BigInt(5);
console.log(total, total > 14, typeof total);
```

**Answer:** `15n true bigint`. `BigInt(5)` makes the addition legal; the `>` comparison may mix BigInt and Number.
