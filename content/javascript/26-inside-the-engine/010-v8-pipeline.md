---
title: "What happens between source code and execution in V8?"
status: draft
difficulty: hard
frequency: 3
core: true
tags: [v8, ignition, sparkplug, maglev, turbofan, bytecode, feedback, lazy-parsing, node]
related:
  - javascript/how-javascript-runs/compiled-or-interpreted
  - javascript/inside-the-engine/deoptimization
  - javascript/inside-the-engine/hidden-classes-inline-caches
verified: 2026-10
perishable:
  - Tiers, flags and trace output checked on Node 24.19 (V8 13.6)
  - TurboFan's move from Sea of Nodes to Turboshaft is ongoing
sources:
  - https://v8.dev/docs/ignition
  - https://docs.google.com/document/d/11T2CRex9hXxoJwbYqVQ32yIPMh0uouUZLdyrtmMoL44
  - https://v8.dev/blog/launching-ignition-and-turbofan
  - https://v8.dev/blog/sparkplug
  - https://v8.dev/blog/maglev
  - https://v8.dev/blog/leaving-the-sea-of-nodes
  - https://v8.dev/blog/preparser
  - https://v8.dev/blog/v8-lite
  - https://nodejs.org/docs/latest/api/cli.html
tldr: >
  V8-specific, not ECMAScript. V8 preparses inner functions and compiles each to Ignition bytecode on
  its first call. Ignition runs it and records type feedback in a feedback vector. Hot functions tier up
  to Sparkplug (baseline), Maglev (mid-tier) and TurboFan (top tier), which compile using that
  feedback. Unused bytecode is flushed.
---

## Answer

Everything here is **V8 behaviour** (Chrome, Node, Deno), taken from V8's own blog and docs and checked on Node 24.19 (V8 `13.6.233.17-node.51`). Tier names, thresholds and flags change between versions. The first-pass overview (parse, bytecode, JIT, deopt) is in [Is JavaScript compiled or interpreted?](../01-how-javascript-runs/030-compiled-or-interpreted.md); this question is about the mechanism.

1. **Lazy parse and compile.** The top-level code is parsed fully. For inner functions the **preparser** does "the bare minimum needed to be able to otherwise skip over" them, and V8 compiles a function only when it is first called. Parenthesised function expressions, which are probably invoked straight away, are compiled eagerly.
2. **Ignition.** On first call, the function is compiled to **bytecode** for a register machine with an accumulator, and Ignition interprets it. Compared with the older Full-codegen, V8's blog reports a ninefold smaller baseline-code footprint on ARM64 Android.
3. **Feedback.** While interpreting, V8 records what it sees at each operation (number kinds, object shapes, call targets) in a **feedback vector**. Every later tier reads it.
4. **Tiers.** Hot functions are recompiled from bytecode: **Sparkplug** (one linear pass, no intermediate representation), **Maglev** (a fast optimizing compiler, an SSA control-flow graph) and **TurboFan** (the top tier, slowest to compile, fastest code).
5. **Deoptimization.** Optimized code assumes the feedback still holds. When it does not, V8 falls back to bytecode ([deoptimization](030-deoptimization.md)).
6. **Memory.** Bytecode that has not run recently is flushed during major GCs and recompiled on demand.

## Example

```js
// feedback.mjs, V8-specific. Run (Node 24.19, V8 13.6):
//   node --allow-natives-syntax --no-lazy-feedback-allocation feedback.mjs
// %DebugPrint is a debug-only native, not a public API; it prints much more
// than the line quoted in each comment.
function add(a, b) {
  return a + b;
}

add(1, 2);
%DebugPrint(add); // includes "slot #0 BinaryOp BinaryOp:SignedSmall"
add(1.5, 2);
%DebugPrint(add); // includes "slot #0 BinaryOp BinaryOp:Number"
add('a', 'b');
%DebugPrint(add); // includes "slot #0 BinaryOp BinaryOp:Any"
```

The `+` in `add` has one feedback slot. It widens as the operands do (small integers, then any number, then anything) and never narrows again.

## Pitfalls

- Presenting tier names and thresholds as JavaScript semantics. They are V8 implementation details that change between versions, and other engines use different tiers.
- Believing every function is optimized. Most run only in Ignition. Tier-up needs the function to be hot, and V8's trace calls the reason "hot and stable".
- Assuming a function is compiled when the file is loaded. V8 compiles inner functions lazily on first call, and flushes unused bytecode later, so a cold call can pay compile time again.
- Treating `--print-bytecode`, `--trace-opt` and `%`-natives as stable interfaces. Their output wording is not a contract.

## Follow-ups

**Q:** Why have Sparkplug and Maglev when TurboFan exists?
**A:** Optimizing is expensive. Sparkplug compiles in a single pass, with no intermediate representation. Maglev, per V8's blog, is roughly 10x slower than Sparkplug and 10x faster than TurboFan. Each tier covers code that is hot but not hot enough for the one above.

**Q:** Does TurboFan compile from source?
**A:** No. From bytecode plus feedback, as the Ignition/TurboFan launch post describes, so the parser's work is not repeated.

**Q:** Is the bytecode a stable format?
**A:** No. It is an internal representation and may change with any V8 release.

## Deep dive

### How it works

Print the bytecode of a two-line function with `node --print-bytecode --print-bytecode-filter=add add.mjs`. On Node 24.19 / V8 13.6 (arm64, one machine), `add(a, b) { return a + b; }` produced (abridged):

```text
Parameter count 3
Register count 0
   Ldar a1
   Add a0, [0]
   Return
```

Ignition is a register machine with an implicit **accumulator**. `Ldar a1` loads argument register `a1` (`b`) into the accumulator. `Add a0, [0]` adds `a0` to the accumulator, so the result is `a + b`, and leaves the result in the accumulator. `Return` returns it. The dump shows no local registers (`Register count 0`), because the accumulator is enough. The trailing `[0]` is a feedback-slot operand (the Ignition design document shows IC bytecodes taking one), matching the `slot #0 BinaryOp` line in the example above. "Parameter count 3" fits two parameters plus the implicit receiver, which that document says is passed like the arguments.

The feedback vector is allocated lazily. Node's default left `add` with only a "closure feedback cell array" after two calls, which is why the example passes `--no-lazy-feedback-allocation`; the flag exists in `node --v8-options` and is a debugging convenience, not something to ship.

### Edge cases

Lazy compilation is observable. With `--print-bytecode-filter=inner`, bytecode for `inner` appears only after the first call:

```js
// lazy.mjs, run: node --print-bytecode --print-bytecode-filter=inner lazy.mjs
function outer() {
  console.log('outer runs');
  function inner() {
    return 42;
  }
  return inner;
}
const fn = outer();
console.log('before inner call');
fn();
// → outer runs
// → before inner call
// then the dump starts: [generated bytecode for function: inner (0x… <SharedFunctionInfo inner>)]
```

`inner` was preparsed when `outer` was compiled, but it got bytecode only at `fn()`. The V8 preparser post adds why this is hard: inner functions can reference and outlive outer variables, so the preparser must track variable declarations and references to decide what lives on the stack and what in a heap context.

Two caveats from the sources. Eager compilation hints (parentheses around a function expression) can be ignored with `--max-lazy` (listed in `node --v8-options`), and over-eager compilation costs memory. And bytecode flushing is age-based: the V8 Lite post says the age increments on every major GC and resets when the function runs, with a threshold after which the next GC may free the bytecode. The flag is `--flush-bytecode`, on by default here.

### Real-world scenario

To confirm that a hot function tiers up, trace it:

```text
node --trace-opt tier.mjs   (a loop calling square(n) 100,000 times)
[marking <JSFunction square> for optimization to MAGLEV, ... reason: hot and stable]
[completed compiling <JSFunction square> (target MAGLEV) - took 0.000, 0.042, 0.000 ms]
[marking <JSFunction square> for optimization to TURBOFAN_JS, ... reason: hot and stable]
[completed optimizing <JSFunction square> (target TURBOFAN_JS)]
```

In two runs `square` went to Maglev first and then to TurboFan, with no deoptimization. I abridged addresses and timings. Sparkplug did not appear in the `--trace-opt` lines for `square`; `--trace-opt-status` printed `BASELINE` for other functions in the same Node. Node 24.19's `--v8-options` lists `--sparkplug` and `--maglev` as default-on, and the Maglev post says Chrome shipped Maglev in M117. The trace labels these compiles `ConcurrencyMode::kConcurrent`.

### Trade-offs

Each tier trades compile time and memory for run time. Starting in Ignition keeps start-up fast and memory low, which was the stated reason for Ignition's design. The cost is that a function's first calls are the slowest, and that optimized code is only as good as the feedback behind it.

TurboFan's own internals are in flux. V8's March 2025 blog says it is leaving "Sea of Nodes" for a control-flow-graph IR named Turboshaft: the whole JavaScript backend of TurboFan already uses Turboshaft, while its JavaScript frontend still builds Sea of Nodes graphs, which the post says Maglev is replacing. Treat any diagram of "TurboFan's pipeline" as dated.

## Exercises

### When does `inner` get bytecode?

```js
// lazy2.mjs, run: node --print-bytecode --print-bytecode-filter=inner lazy2.mjs
function outer() {
  console.log('outer runs');
  function inner() {
    return 42;
  }
  return inner;
}
const fn = outer();
console.log('before inner call');
fn();
console.log('after');
```

Where does the `inner` bytecode line appear relative to the three `console.log` lines?

**Answer:** After `before inner call` and before `after`: `outer runs`, `before inner call`, `[generated bytecode for function: inner …]`, `after`. Observed on Node 24.19 (V8 13.6). V8 compiles `inner` at the `fn()` call, not when `outer` is compiled.
