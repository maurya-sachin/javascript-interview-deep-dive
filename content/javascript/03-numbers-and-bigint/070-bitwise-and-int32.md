---
title: "What happens to a number when you apply a bitwise operator?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [numbers, bitwise, int32, toint32, bigint]
related:
  - javascript/numbers-and-bigint/safe-integers-bigint
  - javascript/numbers-and-bigint/parsing-numbers
  - javascript/numbers-and-bigint/floating-point-precision
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-toint32
  - https://tc39.es/ecma262/#sec-touint32
  - https://tc39.es/ecma262/#sec-tofixedsizeinteger
  - https://tc39.es/ecma262/#sec-tointegerorinfinity
  - https://tc39.es/ecma262/#sec-numberbitwiseop
  - https://tc39.es/ecma262/#sec-numeric-types-number-leftShift
  - https://tc39.es/ecma262/#sec-numeric-types-number-signedRightShift
  - https://tc39.es/ecma262/#sec-numeric-types-number-unsignedRightShift
  - https://tc39.es/ecma262/#sec-numeric-types-number-bitwiseNOT
  - https://tc39.es/ecma262/#sec-numeric-types-bigint-unsignedRightShift
  - https://tc39.es/ecma262/#sec-applystringornumericbinaryoperator
  - https://tc39.es/ecma262/#sec-math.imul
tldr: >
  Bitwise operators on Numbers convert each operand to a 32-bit integer first: `ToInt32` truncates
  toward zero, maps `NaN` and `Infinity` to `0`, and wraps modulo 2³². The result is read back as
  a signed 32-bit value, except `>>>`, which gives an unsigned one. Shift counts use only their low
  five bits. BigInts use arbitrary-width bitwise operators instead.
---

## Answer

JavaScript Numbers are 64-bit floats, but the bitwise operators (`&`, `|`, `^`, `~`, `<<`, `>>`, `>>>`) work on **32-bit integers**. Each operand goes through a conversion first:

1. `ToNumber`, so `'12' | 0` is `12` and `'abc' | 0` is `0`.
2. `ToIntegerOrInfinity`: truncate toward zero; `NaN` becomes `0`.
3. `ToFixedSizeInteger(…, 32)`: `±Infinity` becomes `0`; everything else is taken **modulo 2³²**. `ToInt32` then reads the result as signed two's complement (−2³¹ to 2³¹ − 1); `ToUint32` reads it as unsigned (0 to 2³² − 1).

The operator works on those 32 bits, and the result is a Number again:

- `&`, `|`, `^`, `~` use `ToInt32` and return a signed 32-bit value.
- `<<` and `>>` convert the left side with `ToInt32`; `>>` copies the sign bit in from the left.
- `>>>` converts the left side with `ToUint32` and fills with zeros, so its result is **unsigned**. `x >>> 0` is the idiom for "as uint32".
- The shift count goes through `ToUint32` and then **modulo 32**, so `1 << 32` is `1`, not `0`.

Consequences interviewers probe: `x | 0` and `~~x` truncate like `Math.trunc` only inside the int32 range; larger values wrap silently (`2 ** 31 | 0` is −2147483648, `1e10 | 0` is 1410065408). `-1 >>> 0` is 4294967295.

BigInts are different. Their `&`, `|`, `^`, `~`, `<<`, `>>` work on arbitrary-width two's complement, with no truncation. `>>>` throws a `TypeError` for BigInts: with no fixed width, there's no unsigned form to zero-fill. Mixing BigInt and Number in one bitwise operation also throws a `TypeError`.

Bitwise operators are still the right tool for bit flags, hashes, binary protocols and colour packing, as long as the values fit in 32 bits.

## Example

```js
console.log(3.7 | 0, -3.7 | 0, Math.floor(-3.7)); // → 3 -3 -4
console.log(NaN | 0, Infinity | 0, '12' | 0); // → 0 0 12

console.log(2 ** 31 | 0); // → -2147483648
console.log(1e10 | 0); // → 1410065408
console.log(-1 >>> 0); // → 4294967295
console.log(-8 >> 1, -8 >>> 1); // → -4 2147483644
console.log(1 << 31, 1 << 32); // → -2147483648 1

// Bit flags: the everyday use
const READ = 1, WRITE = 2, EXEC = 4;
let perms = READ | WRITE;
console.log((perms & WRITE) !== 0, (perms & EXEC) !== 0); // → true false
perms &= ~WRITE;
console.log(perms); // → 1

console.log(1n << 64n); // → 18446744073709551616n
try {
  1n >>> 0n;
} catch (error) {
  console.log(error.name); // → TypeError
}
```

## Pitfalls

- Using `x | 0` or `~~x` to truncate timestamps, IDs or anything that can exceed 2³¹ − 1. It wraps silently; use `Math.trunc`.
- Forgetting `|` returns a **signed** result, so building a 32-bit unsigned value (a hash, an RGBA colour) needs a final `>>> 0`.
- Expecting `x << 32` to clear `x`. Only the low five bits of the count are used, so it's `x << 0`.
- Applying `>>>` to a BigInt, or mixing `1n | 1`. Both throw `TypeError`.

## Follow-ups

**Q:** Why does `~str.indexOf(x)` work as a "contains" check?
**A:** `indexOf` returns −1 when not found, and `~(-1)` is `0`, which is falsy; any index ≥ 0 gives a non-zero result. It's an old idiom: `str.includes(x)` says the same thing readably.

**Q:** Is the result of `|` ever a fraction or `-0`?
**A:** No. The spec says every result is an integral Number exactly representable in 32 bits, and `ToInt32` never produces `-0`, so `-0 | 0` is `0`.

**Q:** How do you do 32-bit integer multiplication correctly?
**A:** `Math.imul(a, b)`. Plain `a * b` multiplies doubles, which loses low bits once the product passes 2⁵³; `Math.imul` returns the low 32 bits as a signed integer, like C.

## Exercises

### Predict the output

```js
console.log(4294967297 | 0, 5 >> 33, -5 >>> 28);
```

**Answer:** `1 2 15`. 4294967297 is 2³² + 1, which wraps to `1`. A shift count of 33 is 33 mod 32 = 1, so `5 >> 1` is `2`. `-5` as uint32 is `0xFFFFFFFB`; shifting right by 28 with zero fill leaves the top four bits, `0xF`, which is `15`.
