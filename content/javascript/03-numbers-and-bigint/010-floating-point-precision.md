---
title: "Why is `0.1 + 0.2 !== 0.3`?"
status: draft
difficulty: easy
frequency: 5
core: true
tags: [floating-point, ieee-754, epsilon, precision, number]
related:
  - javascript/values-and-types/language-types
  - javascript/numbers-and-bigint/nan-negative-zero-infinity
  - javascript/numbers-and-bigint/math-sumprecise
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-ecmascript-language-types-number-type
  - https://tc39.es/ecma262/#sec-numeric-types-number-add
  - https://tc39.es/ecma262/#sec-numeric-types-number-tostring
  - https://tc39.es/ecma262/#sec-number.epsilon
  - https://tc39.es/ecma262/#sec-number.prototype.tofixed
  - https://tc39.es/ecma262/#sec-math.sqrt
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed
tldr: >
  JavaScript numbers are IEEE 754 binary64 doubles. `0.1`, `0.2` and `0.3` have no exact binary
  representation, so each literal is stored as the nearest double, and the sum of the first two rounds to
  a different double than the literal `0.3`. Compare floats with a tolerance, or avoid them for money.
---

## Answer

Every JavaScript `Number` is a double-precision IEEE 754 binary64 value: 64 bits, of which 52 hold the fraction. Binary can only represent fractions whose denominator is a power of two. `0.1` is `1/10`, which in binary is a repeating fraction (like `1/3` in decimal), so it is rounded to the nearest representable double. The same applies to `0.2` and `0.3`.

So the literals are not the values you typed:

- `0.1` is stored as about `0.1000000000000000055`
- `0.2` is stored as about `0.2000000000000000111`
- `0.3` is stored as about `0.2999999999999999889`

Adding the first two gives about `0.3000000000000000166`, which is not representable either. The spec rounds the exact result to the nearest double (ties to even), and that double is `0.30000000000000004`. It is one step above the double that `0.3` rounds to, so `===` is `false`.

This is not a JavaScript bug. Any language using binary64 does the same. The error is tiny and relative to the magnitude of the number, which gives the practical rules:

- **Never compare computed floats with `===`.** Check that they are close enough: `Math.abs(a - b)` below a tolerance.
- **`Number.EPSILON` is the gap between `1` and the next double** (`2 ** -52`). It is a sensible tolerance only for values near `1`. For other magnitudes, scale it by the operands.
- **For money, use integers** (cents) or a decimal library, not floats.
- **Display with `toFixed`/`Intl.NumberFormat`** instead of trying to "fix" the stored value.

Some sums are exact: `0.5 + 0.25 === 0.75`, because those fractions are powers of two.

## Example

```js
console.log(0.1 + 0.2); // → 0.30000000000000004
console.log(0.1 + 0.2 === 0.3); // → false

// Print the stored values with more digits than the default shortest form.
console.log((0.1).toFixed(20)); // → 0.10000000000000000555
console.log((0.3).toFixed(20)); // → 0.29999999999999998890

// Tolerance scaled to the operands (relative epsilon).
const nearlyEqual = (a, b) =>
  Math.abs(a - b) <= Number.EPSILON * Math.max(Math.abs(a), Math.abs(b));

console.log(nearlyEqual(0.1 + 0.2, 0.3)); // → true
console.log(nearlyEqual(1000.1 + 1000.2, 2000.3)); // → true

// A bare EPSILON threshold is too strict once values are larger than 1.
console.log(Math.abs(1000.1 + 1000.2 - 2000.3) < Number.EPSILON); // → false

// Exact because the fractions are powers of two.
console.log(0.5 + 0.25 === 0.75); // → true
```

## Pitfalls

- Using `Math.abs(a - b) < Number.EPSILON` everywhere. It only suits magnitudes near `1`; MDN warns against using bare `EPSILON` as a general threshold.
- A relative tolerance such as `EPSILON * max(|a|, |b|)` fails near zero: `nearlyEqual(0, 1e-20)` is `false`. Add an absolute tolerance when zero is a legitimate value.
- Trusting `toFixed` to round "correctly": `(1.005).toFixed(2)` is `"1.00"` because the stored value is slightly below `1.005`.
- Storing money as floats. Sums of cents drift; keep integer cents or use a decimal library.

## Follow-ups

**Q:** Why does `console.log(0.1)` print `0.1` if it isn't exactly `0.1`?
**A:** Number-to-string conversion prints the shortest decimal that round-trips to the same double, not the exact stored value. `0.1` is the shortest string that parses back to that double.

**Q:** Does this affect integers?
**A:** Integers are exact up to `2 ** 53`. Beyond that, neighbouring integers collapse together. See the safe-integers question.

## Deep dive

### How it works

A binary64 value has 1 sign bit, 11 exponent bits and 52 fraction bits (MDN's description; the spec calls the format "double-precision IEEE 754 binary64"). A normal number is `±1.fraction × 2^exponent`, so there are 53 significant bits including the implicit leading one. That is roughly 15 to 17 significant decimal digits.

Writing `0.1` in binary shows why it can't be exact:

```js
console.log((0.1).toString(2));
// → 0.0001100110011001100110011001100110011001100110011001101
```

The pattern `1100` repeats forever; the engine keeps 53 significant bits and rounds the rest, so the stored value is a little above `0.1`. You can inspect the raw bits:

```js
const view = new DataView(new ArrayBuffer(8));
view.setFloat64(0, 0.1);
console.log(view.getBigUint64(0).toString(16)); // → 3fb999999999999a
```

The trailing `...9a` is the rounded-up `...99999` pattern. `0.2` has the same mantissa with exponent one higher, so it is exactly `2 * 0.1` as stored. Adding them is exact in the real numbers but needs one more bit of precision than a double has, so the result is rounded to nearest, ties to even. That lands one unit in the last place (ulp) above the double nearest `0.3`.

Every floating-point operation (`+ - * /`, `Math.sqrt`) is defined as "compute exactly, then round once". Errors come from the rounding of inputs and of every intermediate result, which is also why grouping matters:

```js
console.log(0.1 + 0.2 + 0.3); // → 0.6000000000000001
console.log(0.3 + 0.2 + 0.1); // → 0.6
```

Floating-point addition is commutative but not associative.

### Edge cases

- **`Number.EPSILON` is the spacing at `1`, not a universal error bound.** The spacing between doubles grows with magnitude (it doubles at each power of two). `1 + Number.EPSILON === 1` is `false`, but `1 + Number.EPSILON / 2 === 1` is `true`, because half a step rounds back to `1` (ties to even).
- **The spacing at `2 ** 53` is `2`**, so `2 ** 53 + 1 === 2 ** 53`. Integer precision ends there.
- **`toFixed` works on the stored value.** `(2.55).toFixed(1)` is `"2.5"` because the closest double to `2.55` is below it; MDN documents this exact case.
- **Multiplying to "go integer" is not safe either:** `19.99 * 100` is `1998.9999999999998`. Round with `Math.round` after scaling, and only for display or cents conversion.

### Trade-offs

| Approach | Good for | Cost |
|---|---|---|
| Tolerance comparison | Scientific and geometric code | You pick the tolerance per problem |
| Integer minor units (cents) | Money with fixed precision | Manual scaling; overflow beyond `2 ** 53` |
| `BigInt` scaled integers | Large or exact fixed-point values | No fractions; no `Math` functions |
| Decimal library | Arbitrary decimal arithmetic | Dependency and slower than native |

Floats are the right default for most numeric work: they are fast, hardware-supported, and accurate to about 16 digits.

## Exercises

### Fix the comparison

```js
const total = 0.1 * 3;
console.log(total === 0.3);
```

Rewrite the check so it logs `true`, and say why `===` fails.

**Answer:** `0.1 * 3` is `0.30000000000000004`, one ulp above the double for `0.3`. Use a relative tolerance: `Math.abs(total - 0.3) <= Number.EPSILON * Math.max(Math.abs(total), 0.3)` is `true`.

### Predict the output

```js
console.log(1 + Number.EPSILON === 1);
console.log(1 + Number.EPSILON / 2 === 1);
```

**Answer:** `false` then `true`. `EPSILON` is the gap from `1` to the next double; half of it rounds back down to `1` (ties to even).
