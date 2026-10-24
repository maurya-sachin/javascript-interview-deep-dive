---
title: "What causes deoptimization?"
status: draft
difficulty: hard
frequency: 2
core: false
tags: [v8, deoptimization, jit, type-feedback, maglev, turbofan, micro-benchmarks]
related:
  - javascript/inside-the-engine/v8-pipeline
  - javascript/inside-the-engine/hidden-classes-inline-caches
  - javascript/inside-the-engine/smi-and-heap-numbers
verified: 2026-10
perishable:
  - Deopt reason strings and trace format of V8 13.6
sources:
  - https://github.com/v8/v8/blob/13.6.233.17/src/deoptimizer/deoptimize-reason.h
  - https://github.com/v8/v8/blob/13.6.233.17/src/common/globals.h
  - https://v8.dev/blog/launching-ignition-and-turbofan
  - https://v8.dev/blog/maglev
  - https://nodejs.org/docs/latest/api/cli.html
tldr: >
  V8-specific, not ECMAScript. Optimized code is speculative: it is compiled from type feedback and guarded
  by checks. When a guard fails (a different object shape, a non-Smi number, an out-of-bounds index, code
  that never ran before) V8 discards that machine code, resumes in bytecode, and may recompile later.
---

## Answer

This is **V8 behaviour**, from V8's source and tracing flags; it is not in ECMAScript. Observed on Node 24.19 (V8 `13.6.233.17-node.51`); wording and details change between versions.

Optimizing tiers (Maglev, TurboFan) compile from bytecode plus the **feedback** gathered while the function ran ([pipeline](010-v8-pipeline.md)). They assume the feedback stays true and insert **guards** that check it. A failed guard triggers a **deoptimization** ("deopt", "bailout"): V8 throws away the optimized frame, rebuilds the interpreter state, and continues in bytecode. The function can be marked hot again and recompiled with the new feedback.

V8's `deoptimize-reason.h` lists the reasons. The common ones come from broken assumptions:

- **Shape:** `wrong map`, when an object with a different hidden class arrives ([hidden classes](020-hidden-classes-inline-caches.md)).
- **Number representation:** `not a Smi`, `overflow`, `lost precision`, `minus zero`, `division by zero` ([Smis](050-smi-and-heap-numbers.md)).
- **Types:** `not a Number`, `not a String`, `not a JavaScript object`, and similar.
- **Array access:** `out of bounds`, `hole`, `the array length changed`.
- **Calls:** `wrong call target`.
- **No data:** `Insufficient type feedback for call` (and for binary operation, generic named access, and others), when optimized code reaches a path that never ran before the compile.

A deopt is a correctness mechanism, not an error. The cost is in a function that keeps being optimized, invalidated and optimized again, or in a path whose inputs never settle.

To see them, run Node with `--trace-opt --trace-deopt`.

## Example

```js
// deopt.mjs. Run (Node 24.19, V8 13.6):
//   node --trace-deopt deopt.mjs | grep -E "getX|warm|changed"
function getX(o) {
  return o.x;
}
for (let i = 0; i < 200_000; i++) getX({ x: i });
console.log('warm');
getX({ y: 0, x: 1 }); // a second shape
console.log('shape changed');
// → warm
// then a trace line: [bailout (kind: deopt-eager, reason: wrong map): begin. deoptimizing 0x… <JSFunction getX …>, 0x… <Code MAGLEV>, …
// → shape changed
```

I abridged addresses and trailing fields. In three runs `getX` ran in Maglev code, and the only `getX` bailout was `wrong map`. Run it without the filter and you will also see bailouts in the anonymous module function; I did not investigate those.

## Pitfalls

- Treating `--trace-deopt` text as a stable interface. The linked `deoptimize-reason.h` is V8 13.6's, the version in Node 24.19; later versions add and rename reasons. Check the string in your trace, not in a blog post.
- Concluding that a deopt means your code is bad. Optimized code is a bet; one deopt is normal. Look for repeated optimize/deopt cycles in the trace.
- Micro-benchmarks that time a function once with one kind of input. They measure whichever tier and feedback they happened to reach, and one different input mid-run can deoptimize it. Warm up with realistic inputs and check `--trace-opt --trace-deopt` before trusting a number. I do not give speedup figures here because I did not measure any.
- Using `%OptimizeFunctionOnNextCall` or `%GetOptimizationStatus` in production. They are natives behind `--allow-natives-syntax`, not a public API.

## Follow-ups

**Q:** What is an *eager* deopt?
**A:** A check failed inside the running optimized code, so it deoptimizes immediately. V8 13.6's `globals.h` defines one other kind, *lazy*: code that depends on an assumption checked elsewhere is marked and deoptimizes the next time it runs. Every bailout traced here was eager.

**Q:** Does deoptimizing mean the function never gets optimized again?
**A:** No. When I followed the `wrong map` bailout with a second 200,000-call loop, the trace showed `getX` marked for Maglev again and recompiled. V8 recompiles from the updated feedback.

**Q:** Why does a function that never saw a branch deopt when it first takes it?
**A:** The optimizer had no feedback for that path, so it compiled a guard that bails out when it is reached. That is the `Insufficient type feedback …` family of reasons.

## Exercises

### Which reason fires?

```js
// sum.mjs. Run: node --trace-deopt sum.mjs | grep -E "bailout.*add"
function add(a, b) {
  return a + b;
}
let sum = 0;
for (let i = 0; i < 1_000_000; i++) sum = add(sum, i);
console.log(sum);
```

**Answer:** `reason: not a Smi`, for the `add` function. The running total passes 2^31 − 1, so the Smi arguments that Maglev's guard expects become heap numbers ([Smis and HeapNumbers](050-smi-and-heap-numbers.md)). In three runs the first `add` bailout was in `Code MAGLEV` with this reason. Other bailouts show up for the anonymous module function (including `overflow`), and their number varies between runs.
