# 26 — Inside the engine

> **Status:** 🔴 planned · **Published:** 0/5 · **Last verified:** —

How V8 turns source into fast machine code — tiers, hidden classes, inline caches — and what makes it slow down.

## Learning goals

After this chapter you can:

- Walk through V8's pipeline from parsing to optimized code
- Explain hidden classes and inline caches, and write code that keeps them monomorphic
- List common deoptimization triggers
- Explain how V8 stores arrays and numbers

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Parsing, lazy parsing and preparsing → 010
- Ignition bytecode; Sparkplug, Maglev, TurboFan tiers; feedback → 010
- Hidden classes (Maps), transitions, inline caches (mono/poly/megamorphic) → 020
- Deoptimization triggers → 030
- Elements kinds (packed/holey; Smi, double, generic) → 040
- Smis, HeapNumbers, pointer compression → 050
- Code caching and snapshots → —
- Other engines' tiers (SpiderMonkey, JavaScriptCore) → —
- Micro-benchmark pitfalls → 030

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What happens between source code and execution in V8?](010-v8-pipeline.md) | hard | 🟡 draft |
| 020 | [What are hidden classes and inline caches?](020-hidden-classes-inline-caches.md) | hard | 🟡 draft |
| 030 | [What causes deoptimization?](030-deoptimization.md) | hard | 🟡 draft |
| 040 | [How does V8 store arrays?](040-elements-kinds.md) | hard | 🟡 draft |
| 050 | [How does V8 represent numbers?](050-smi-and-heap-numbers.md) | hard | 🟡 draft |
<!-- generated:questions:end -->

## Sources

- **V8:** [Ignition](https://v8.dev/docs/ignition) · [Sparkplug](https://v8.dev/blog/sparkplug) · [Maglev](https://v8.dev/blog/maglev) · [Fast properties](https://v8.dev/blog/fast-properties) · [Elements kinds](https://v8.dev/blog/elements-kinds) · [Pointer compression](https://v8.dev/blog/pointer-compression)
