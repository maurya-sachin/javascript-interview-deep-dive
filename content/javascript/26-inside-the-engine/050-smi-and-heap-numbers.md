---
title: "How does V8 represent numbers?"
status: draft
difficulty: hard
frequency: 1
core: false
tags: [v8, smi, heap-number, pointer-compression, tagging, numbers]
related:
  - javascript/inside-the-engine/elements-kinds
  - javascript/inside-the-engine/deoptimization
  - javascript/memory-and-gc/v8-generational-gc
verified: 2026-10
sources:
  - https://v8.dev/blog/pointer-compression
  - https://v8.dev/blog/elements-kinds
  - https://tc39.es/ecma262/#sec-ecmascript-language-types-number-type
  - https://nodejs.org/docs/latest/api/process.html#processconfig
tldr: >
  V8-specific, not ECMAScript, where every Number is a double. V8 stores small integers as Smis, tagged
  immediate values with no allocation, and everything else (fractions, -0, NaN, large integers) as
  HeapNumber objects. The Smi range is 31 bits with pointer compression and 32 bits without. Node 24.19's
  build has compression off.
---

## Answer

The language has one Number type: the spec defines it as an IEEE 754 double-precision value. **Smi** and **HeapNumber** are V8's internal representations (observed on Node 24.19, V8 13.6, 64-bit arm64); you cannot see them from JavaScript semantics, only from performance and debug tooling.

**Tagging.** V8 values are tagged words. Per the pointer-compression post, the least significant bit(s) distinguish a heap-object pointer from a **small integer (Smi)**. A Smi carries its value in the word itself, so it needs no heap allocation and no pointer to follow.

**Range.** The post says a Smi has a 32-bit payload on 64-bit builds and 31 bits when pointer compression is on, because compression makes the tagged word 32 bits wide. On this Node, `process.config.variables.v8_enable_pointer_compression` is `0`, and `%IsSmi` was `true` for `2**31 - 1` and `-(2**31)` and `false` one step beyond either. So the range here is the 32-bit one. A browser such as Chrome ships with compression on, per the post, so I would expect 31 bits there; I did not test it.

**HeapNumber.** Any number that does not fit a Smi is a heap object holding a boxed double: fractions, `-0`, `NaN`, `Infinity`, and integers outside the Smi range. In `%DebugPrint`, `1.5` is a `[HeapNumber]` with `instance size: 16` here.

**Consequences.**

- Whether a number is a Smi depends on its value, not on how you wrote it: `1.0` and `10 / 2` are Smis, `7 / 2` is not.
- Arrays hold doubles unboxed in `PACKED_DOUBLE_ELEMENTS` ([elements kinds](040-elements-kinds.md)), so a double array does not need one HeapNumber per element.
- Optimized code that expects Smis deoptimizes when it meets a HeapNumber (`not a Smi`) or an overflowing result (`overflow`) ([deoptimization](030-deoptimization.md)).

## Example

```js
// smi.mjs. Run: node --allow-natives-syntax smi.mjs (Node 24.19, V8 13.6, 64-bit,
// pointer compression off). %IsSmi is a debug-only native, not public API.
const MAX = 2 ** 31 - 1;
console.log(%IsSmi(MAX), %IsSmi(MAX + 1)); // → true false
console.log(%IsSmi(-(2 ** 31)), %IsSmi(-(2 ** 31) - 1)); // → true false
console.log(%IsSmi(1.0), %IsSmi(1.5)); // → true false
console.log(%IsSmi(-0), %IsSmi(NaN)); // → false false
console.log(%IsSmi(10 / 2), %IsSmi(7 / 2)); // → true false
%DebugPrint(1.5); // → [HeapNumber] ... - value: 1.5 ... - instance size: 16
```

## Pitfalls

- Quoting "Smis are 31-bit" or "32-bit" without the build. It is 31 with pointer compression and 32 without, per the V8 post. On this Node it is 32.
- Believing JavaScript has an integer type. `1.0 === 1`; the engine decides the representation per value.
- Assuming `-0` is an integer. `%IsSmi(-0)` was `false`; `-0` needs a double.
- Treating the Smi range as a language limit. Numbers beyond it work, as HeapNumbers. Also, `%IsSmi` and `%DebugPrint` are debug-only natives, not stable.

## Follow-ups

**Q:** Why have Smis at all?
**A:** Small integers (indices, counters, lengths) are everywhere. A Smi lives in the word itself, so it needs no separate heap object, while every HeapNumber is one.

**Q:** Does pointer compression apply to Node?
**A:** Not to this build: `process.config.variables.v8_enable_pointer_compression` is `0`. The V8 post says compression reduced V8 heap size by up to 43% and caps the heap at a 4 GB range.

**Q:** Is a Smi overflow an error?
**A:** No. The result simply becomes a HeapNumber. Optimized code that assumed Smis deoptimizes, as the `overflow` and `not a Smi` bailouts in the previous question show.

## Exercises

### Smi or HeapNumber?

```js
// run: node --allow-natives-syntax exercise.mjs
console.log(%IsSmi(2 ** 31));
console.log(%IsSmi(parseInt('5')));
console.log(%IsSmi(0.1 + 0.2));
```

**Answer:** `false`, `true`, `false`. `2 ** 31` is outside the 32-bit range, `5` fits, and `0.1 + 0.2` is a fraction. Observed on Node 24.19 with pointer compression off. On a pointer-compressed build the Smi range is narrower; I did not test one.
