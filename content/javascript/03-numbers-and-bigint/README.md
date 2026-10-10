# 03 — Numbers and BigInt

> **Status:** 🔴 planned · **Published:** 0/5 · **Last verified:** —

How JavaScript numbers work as IEEE 754 doubles, their special values, and when BigInt takes over.

## Learning goals

After this chapter you can:

- Explain floating-point rounding errors and how to compare floats
- Detect `NaN` and `-0` correctly
- Decide when BigInt is needed and what it costs
- Turn user input into numbers without surprises

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- IEEE 754 double precision, rounding, `Number.EPSILON` → 010
- `NaN`, `-0`, `Infinity`; `Number.isNaN` vs `isNaN`; `Object.is` → 020
- Safe integer range, `Number.isSafeInteger` → 030
- BigInt: literals, operators, no mixing with Number, `BigInt.asIntN` → 030
- `Number()`, `parseInt` (radix), `parseFloat`, unary `+` → 040
- `Math.sumPrecise` and exact summation → 050
- Number formatting: `toFixed`, `toPrecision`, `toLocaleString` → —
- Bitwise operators and 32-bit integer conversion → —
- `Math.random` is not cryptographically secure → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [Why is `0.1 + 0.2 !== 0.3`?](010-floating-point-precision.md) | easy | 🔴 planned |
| 020 | [What are `NaN`, `-0`, and `Infinity`, and how do you test for them?](020-nan-negative-zero-infinity.md) | medium | 🔴 planned |
| 030 | [What's `Number.MAX_SAFE_INTEGER`, and when do you need BigInt?](030-safe-integers-bigint.md) | medium | 🔴 planned |
| 040 | [`Number()` vs `parseInt()` vs unary `+` — how do they differ?](040-parsing-numbers.md) | easy | 🔴 planned |
| 050 | [How do you sum floating-point numbers accurately?](050-math-sumprecise.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Number type](https://tc39.es/ecma262/#sec-ecmascript-language-types-number-type) · [BigInt type](https://tc39.es/ecma262/#sec-ecmascript-language-types-bigint-type) · [Math object](https://tc39.es/ecma262/#sec-math-object)
- **MDN:** [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) · [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) · [Math.sumPrecise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sumPrecise)
