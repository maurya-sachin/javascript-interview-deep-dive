---
title: "How do `toFixed`, `toPrecision` and `toLocaleString` differ, and why does `(1.005).toFixed(2)` give `\"1.00\"`?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [numbers, formatting, rounding, intl, tofixed, floating-point]
related:
  - javascript/numbers-and-bigint/floating-point-precision
  - javascript/numbers-and-bigint/parsing-numbers
  - javascript/numbers-and-bigint/math-sumprecise
verified: 2026-10
perishable:
  - Locale output depends on the ICU and CLDR data shipped
sources:
  - https://tc39.es/ecma262/#sec-number.prototype.tofixed
  - https://tc39.es/ecma262/#sec-number.prototype.toprecision
  - https://tc39.es/ecma262/#sec-number.prototype.tolocalestring
  - https://tc39.es/ecma402/#sup-number.prototype.tolocalestring
  - https://tc39.es/ecma402/#sec-tointlmathematicalvalue
  - https://tc39.es/ecma402/#sec-setnumberformatdigitoptions
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
tldr: >
  `toFixed(d)` gives exactly `d` decimals, `toPrecision(p)` gives `p` significant digits
  (switching to exponent form for very large or small values), and `toLocaleString` formats for
  a locale through `Intl.NumberFormat`. All return strings. `1.005` is stored as
  1.00499999…, and `toFixed` rounds that exact binary value, so it gives `"1.00"`.
---

## Answer

All three turn a Number into a **string**; they differ in what they count and what they round.

- **`toFixed(digits)`** gives fixed-point notation with exactly `digits` digits after the point (0–100, else `RangeError`). For values of 10²¹ or more it gives up and returns the normal `toString` form, such as `"1e+21"`.
- **`toPrecision(precision)`** gives `precision` significant digits (1–100). It switches to exponent notation when the exponent is below −6 or at least `precision`, so `(123456).toPrecision(2)` is `"1.2e+5"`.
- **`toLocaleString(locales, options)`** is redefined by ECMA-402: it constructs an `Intl.NumberFormat` and formats with it. You get grouping separators, the locale's decimal mark, currency, percent and units. Its default for plain numbers is at most three fraction digits.

The `1.005` puzzle: the literal `1.005` has no exact binary representation, so the stored double is 1.00499999999999989…. `toFixed` and `toPrecision` work on that **exact** value: the spec picks the integer `n` that makes `n / 100 − value` closest to zero, which is 100, so `"1.00"`. Ties (only possible when the stored value is exactly halfway, like `1.25`) go to the larger magnitude.

`toLocaleString` behaves differently. ECMA-402's `ToIntlMathematicalValue` first converts the Number with `Number::toString`, the shortest decimal that round-trips, which is `"1.005"`. It then rounds that decimal with the default `roundingMode` of `"halfExpand"`, so `(1.005).toLocaleString('en-US', { maximumFractionDigits: 2 })` is `"1.01"`.

So the two families can disagree on the same number. For display, prefer `Intl.NumberFormat` with explicit options; for money, store integer minor units (cents) and format at the edge.

## Example

```js
console.log((1.005).toPrecision(20)); // → 1.0049999999999998934
console.log((1.005).toFixed(2)); // → 1.00
console.log((1.25).toFixed(1), (-1.25).toFixed(1)); // → 1.3 -1.3

console.log((0.0000001234).toPrecision(2)); // → 1.2e-7
console.log((123456).toPrecision(2)); // → 1.2e+5
console.log((1e21).toFixed(2)); // → 1e+21

// Locale output (Node.js 24, ICU data; other runtimes may differ)
const n = 1234567.891;
console.log(n.toLocaleString('en-US')); // → 1,234,567.891
console.log(n.toLocaleString('de-DE')); // → 1.234.567,891
console.log(n.toLocaleString('en-IN')); // → 12,34,567.891
console.log((1.005).toLocaleString('en-US', { maximumFractionDigits: 2 })); // → 1.01

console.log((1).toFixed(2) + 1); // → 1.001
```

## Pitfalls

- Treating the result as a number. `(1).toFixed(2) + 1` concatenates to `"1.001"`.
- Expecting `toFixed` to round the decimal you typed. It rounds the stored double, so `1.005` → `"1.00"` while `1.35` (stored slightly above) → `"1.4"`.
- Fixing it with `Math.round(x * 100) / 100`. `1.005 * 100` is `100.49999999999999`, so that gives `1` too.
- Calling `toLocaleString()` without a locale. It uses the host's default locale, so a server and a browser can format the same number differently (a classic hydration mismatch).

## Follow-ups

**Q:** How do you get `1.01` from `1.005`?
**A:** Format with `Intl.NumberFormat` and `maximumFractionDigits: 2`, which rounds the shortest decimal form. Or keep exact values (integer cents, `BigInt`, or a decimal library) and never round binary floats at all.

**Q:** Can you choose the rounding rule?
**A:** With `Intl.NumberFormat`, yes: the `roundingMode` option accepts `"halfExpand"` (default), `"halfEven"` (banker's rounding), `"ceil"`, `"floor"`, `"trunc"` and others. `toFixed` and `toPrecision` have one fixed rule.

**Q:** Why does `toFixed(0)` sometimes print more digits than `toString`?
**A:** `toString` prints only enough digits to identify the double; `toFixed` prints the exact value's digits. The spec's own example: `(1000000000000000128).toString()` is `"1000000000000000100"`, while `toFixed(0)` gives `"1000000000000000128"`.

## Exercises

### Predict the output

```js
const x = 2.675;
console.log(x.toFixed(2), x.toLocaleString('en-US', { maximumFractionDigits: 2 }));
```

**Answer:** `2.67 2.68` (in Node.js 24 with its ICU data, `en-US`). The double nearest `2.675` is 2.67499999999999982…, which `toFixed` rounds down. `toLocaleString` formats the shortest round-trip decimal, `2.675`, and `"halfExpand"` rounds that tie up.
