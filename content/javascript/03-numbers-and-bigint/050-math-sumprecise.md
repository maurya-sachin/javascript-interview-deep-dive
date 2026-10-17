---
title: "How do you sum floating-point numbers accurately?"
status: draft
difficulty: medium
frequency: 1
core: false
tags: [math-sumprecise, floating-point, summation, tc39-proposal, precision]
related:
  - javascript/numbers-and-bigint/floating-point-precision
verified: 2026-10
perishable:
  - Absent in Node 24.19; check newer Node releases
  - MDN Baseline 2026 status
sources:
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sumPrecise
  - https://github.com/tc39/proposal-math-sum
  - https://tc39.es/ecma262/#sec-ecmascript-language-types-number-type
  - https://tc39.es/ecma262/#sec-math.sumprecise
  - https://github.com/tc39/proposals/blob/main/finished-proposals.md
tldr: >
  A `reduce` loop rounds after every addition, so errors accumulate and large values can swallow small ones.
  `Math.sumPrecise(iterable)` sums as if exactly and rounds once. It reached TC39 Stage 4 in July 2025 and is part
  of ES2026; MDN calls it newly available in 2026, but it is missing in Node 24, so feature-detect it or use a compensated sum.
---

## Answer

A plain loop (`xs.reduce((a, b) => a + b, 0)`) rounds to a double after every addition. The error of each step is small, but it compounds, and a large value can erase a small one entirely: `1e20 + 0.1` is `1e20`, so `[1e20, 0.1, -1e20]` sums to `0`.

**`Math.sumPrecise(iterable)`** fixes this. MDN describes it as summing "as if the floating point numbers are summed up using their precise mathematical values", then converting the result to the nearest 64-bit float. There is one rounding at the end, not one per step. Details from MDN and the proposal:

- It takes an **iterable**, not variadic arguments: `Math.sumPrecise([0.1, 0.2])`.
- An empty iterable gives **`-0`**, the floating-point additive identity.
- Elements must be Numbers; anything else throws `TypeError` (no coercion).
- It can't fix input error. `Math.sumPrecise([0.1, 0.2])` is still `0.30000000000000004`, because the literals `0.1` and `0.2` are already slightly off and their exact sum rounds to that value.

**Availability.** It reached **Stage 4** at the July 2025 TC39 meeting and is part of ES2026 (TC39's finished-proposals list), and MDN marks it "Baseline 2026", newly available since April 2026. It is **not available in Node 24**: in Node 24.19 (V8), `typeof Math.sumPrecise` is `'undefined'`. So in portable code, feature-detect it and fall back.

**Fallback: compensated summation.** Kahan's and Neumaier's algorithms carry the lost low-order bits in a second variable and add them back at the end. Neumaier's variant also handles the case where the next term is larger than the running sum. It is not guaranteed to match the exact rounding that `sumPrecise` gives in every case, but it is far better than a naive loop.

When you need exact decimal totals (money), scaling to integers or using a decimal library is still the right answer.

## Example

```js
const naiveSum = (numbers) => numbers.reduce((total, x) => total + x, 0);

// Neumaier's compensated summation: `lost` collects the rounding error of each addition.
function compensatedSum(numbers) {
  let total = 0;
  let lost = 0;
  for (const x of numbers) {
    const next = total + x;
    lost += Math.abs(total) >= Math.abs(x) ? total - next + x : x - next + total;
    total = next;
  }
  return total + lost;
}

const tricky = [1e20, 0.1, -1e20];
const tenths = Array(10).fill(0.1);

console.log(naiveSum(tricky), compensatedSum(tricky)); // → 0 0.1
console.log(naiveSum(tenths), compensatedSum(tenths)); // → 0.9999999999999999 1

// Prefer the built-in where the engine has it.
const sum = typeof Math.sumPrecise === 'function' ? Math.sumPrecise : compensatedSum;
console.log(sum(tricky), sum(tenths)); // → 0.1 1
```

## Pitfalls

- Calling `Math.sumPrecise` unguarded. It throws `TypeError` where it is undefined (Node 24 and older browsers).
- Passing it separate arguments (`Math.sumPrecise(1, 2)`) as you would `Math.max`, or numeric strings (`['1', '2']`). It takes one iterable of Numbers and throws otherwise; convert with `Number` first.
- Expecting it to make `0.1 + 0.2` equal `0.3`. It removes accumulated rounding error, not the representation error of the inputs.
- Using the compensated fallback with `Infinity` or `NaN` inputs. `total - next` becomes `Infinity - Infinity`, so the result is `NaN` where the built-in follows IEEE rules.

## Follow-ups

**Q:** Why does the empty sum return `-0` instead of `0`?
**A:** `-0` is the additive identity for floating-point addition: `-0 + x` is `x` for every `x`, including `-0`, whereas `0 + -0` is `0`. The proposal describes this as keeping the result consistent when composed with other operations.

## Exercises

### Where does the 0.1 go?

```js
const values = [1e20, 0.1, -1e20];
console.log(values.reduce((a, b) => a + b, 0));
console.log(values.reduce((a, b) => a + b, 0) === 0);
```

**Answer:** `0`, then `true`. `1e20 + 0.1` rounds back to `1e20` because the spacing between doubles near `1e20` is far larger than `0.1`, so the small term is lost before the large ones cancel.
