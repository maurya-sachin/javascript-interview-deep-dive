---
title: "How do SpiderMonkey's and JavaScriptCore's tiers compare with V8's?"
status: draft
difficulty: hard
frequency: 1
core: false
tags: [engines, spidermonkey, javascriptcore, v8, jit, tiering]
related:
  - javascript/inside-the-engine/v8-pipeline
  - javascript/inside-the-engine/deoptimization
  - javascript/inside-the-engine/hidden-classes-inline-caches
verified: 2026-10
perishable:
  - Tier lists for V8, SpiderMonkey and JavaScriptCore
  - SpiderMonkey default warmup thresholds 10, 100, 1500
  - JavaScriptCore thresholds 500, 1000, 100000 (2020 post)
  - macOS 26.6.2 jsc lists FTL threshold 64000
sources:
  - https://hacks.mozilla.org/2019/08/the-baseline-interpreter-a-faster-js-interpreter-in-firefox-70/
  - https://hacks.mozilla.org/2020/11/warp-improved-js-performance-in-firefox-83/
  - https://firefox-source-docs.mozilla.org/js/how-we-optimize.html
  - https://firefox-source-docs.mozilla.org/js/index.html#javascript-jits
  - https://webkit.org/blog/10308/speculation-in-javascriptcore/
  - https://v8.dev/blog/sparkplug
  - https://v8.dev/blog/maglev
tldr: >
  Engine-specific, not ECMAScript. All three start in an interpreter, collect inline-cache feedback, and
  tier up hot code through faster-to-run, slower-to-build compilers, falling back when a speculation
  fails. V8: Ignition, Sparkplug, Maglev, TurboFan. SpiderMonkey: C++ interpreter, Baseline Interpreter,
  Baseline Compiler, WarpMonkey. JavaScriptCore: LLInt, Baseline, DFG, FTL.
---

## Answer

None of this is in ECMAScript; it's how engines trade compile time for run speed. The shape is shared: bytecode runs in an interpreter first, inline caches record the types and shapes each operation sees, and hot code is recompiled by progressively more expensive compilers. Optimized code speculates on that feedback, and when a guard fails it falls back to a lower tier.

| Role | V8 | SpiderMonkey | JavaScriptCore |
|---|---|---|---|
| Interpreter | Ignition | C++ interpreter, then Baseline Interpreter | LLInt |
| Non-optimizing compiler | Sparkplug | Baseline Compiler | Baseline JIT |
| Fast optimizer | Maglev | — | DFG |
| Top optimizer | TurboFan | WarpMonkey | FTL |

Differences:

- **SpiderMonkey has two interpreters.** The Baseline Interpreter (Firefox 70) runs the same bytecode as the C++ interpreter but uses the same inline caches and frame layout as the Baseline Compiler, so moving between them is cheap.
- **SpiderMonkey has one optimizing tier.** WarpMonkey (Firefox 83) replaced IonMonkey's front end: it builds Ion's MIR from a snapshot of CacheIR inline-cache data, off the main thread, and keeps Ion's back end. V8 and JavaScriptCore each have a fast optimizer below the top one: Maglev, and the DFG.
- **JavaScriptCore's FTL** reuses the DFG's pipeline, then lowers through B3 IR and Assembly IR (Air) for more optimizations.
- **Fallback targets differ.** V8 deoptimizes to bytecode; Warp bails out to the Baseline Interpreter; JavaScriptCore OSR-exits to Baseline, or to the LLInt if Baseline code was discarded.

Thresholds are tuning, not contracts. SpiderMonkey's in-tree docs give default warmup counts of 10, 100 and 1500 (function entries plus loop iterations). WebKit's 2020 post gave JavaScriptCore's static thresholds as 500, 1000 and 100000 points (a call scores 15, a loop iteration 1), adjusted dynamically.

## Example

```js
// tiers.js, run with the jsc shell that ships with macOS 26.6.2:
//   jsc --reportCompileTimes=true tiers.js
function sumTo(n) {
  let total = 0;
  for (let i = 0; i < n; i++) total += i;
  return total;
}
for (let run = 0; run < 1000; run++) sumTo(10_000);
print(sumTo(10));

// jsc's report (function ids, sizes and timings trimmed):
//   Optimized sumTo using Baseline with Baseline
//   Optimized sumTo using DFG with DFG
//   Optimized <global> using Baseline with Baseline
//   Optimized sumTo using FTL with FTL ... (DFG: 7.282042, B3: 2.384625)
//   45
// Under `node --trace-opt` (V8, with console.log for print), sumTo
// is compiled with target MAGLEV, then target TURBOFAN_JS.
```

## Pitfalls

- Quoting tier thresholds as facts about "the engine". They're tuning values that change between releases: the `jsc` shell on macOS 26.6.2 lists `thresholdForFTLOptimizeAfterWarmUp=64000`, not the 100000 the 2020 post gave.
- Assuming a V8 optimization advice transfers unchanged. All three use inline caches and shape-based speculation, so monomorphic code helps everywhere, but heuristics such as inlining budgets and tier-up timing differ.
- Calling Sparkplug or the Baseline Compiler "optimizing". They translate bytecode to machine code without type speculation; their win is removing interpreter dispatch.
- Describing SpiderMonkey's optimizer as IonMonkey with type inference. Since Firefox 83, Warp builds MIR from CacheIR data instead.

## Follow-ups

**Q:** Why have more than two tiers?
**A:** Compile time and code quality trade off. WebKit's 2020 measurements put Baseline about 2× faster than LLInt, DFG about 5× faster than Baseline, and FTL about 1.5× faster than DFG, with each compiler slower to run. A middle tier gets warm code fast without waiting for the top one.

**Q:** What does SpiderMonkey's Baseline Interpreter buy over the C++ interpreter?
**A:** Inline caches. Mozilla's 2019 post measured Google Docs loading in 901 ms with only the C++ interpreter and 676 ms with the Baseline Interpreter added; Speedometer went from 31 to 52 points.

**Q:** What happens when an optimized function's speculation keeps failing?
**A:** WebKit's post says JavaScriptCore throws the optimized code away, re-profiles in lower tiers, and counts recompilations to back off from recompiling. V8 and SpiderMonkey also drop back to lower tiers and may recompile once the function warms up again.

## Deep dive

### How it works

Every tier above the interpreter depends on profiling done below it, and that's what differs most.

V8 records feedback in each function's feedback vector while Ignition and Sparkplug run; Maglev and TurboFan compile from it. Per the V8 team's 2023 post, Maglev compiles roughly 10× slower than Sparkplug and 10× faster than TurboFan, filling the gap between them.

SpiderMonkey's baseline tiers attach CacheIR stubs to each operation. At warmup 1500 (by default), the WarpOracle snapshots the bytecode and relevant IC data on the main thread, and a background thread builds and optimizes MIR from that snapshot. Trial inlining specializes IC data at call sites before compilation, so inlined callees get their own feedback. On failure, a bailout rebuilds a Baseline Interpreter frame and continues there.

JavaScriptCore's LLInt and Baseline both profile. The DFG speculates from that profile with cheap compilation (no SSA, limited code motion). The FTL takes the same DFG IR into SSA form and through B3 and Air, spending far more compile time for peak throughput.

### Trade-offs

More tiers cost engineering and memory: each compiled version of a function occupies memory, and SpiderMonkey's docs note that Baseline machine code needs memory protection changes and cache flushing. Fewer tiers mean longer waits or worse code in the middle. The engines also keep evolving: SpiderMonkey's docs describe JitHints, which carry tier-up information across page loads, and V8 introduced Maglev in Chrome 117, in 2023. Treat any tier list as a snapshot and check the engine team's own posts for its date.
