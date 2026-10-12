---
title: "Is JavaScript compiled or interpreted?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [engines, v8, jit, parsing, bytecode]
related:
  - javascript/how-javascript-runs/ecmascript-engine-host
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-scripts-static-semantics-early-errors
  - https://tc39.es/ecma262/#sec-hosts-and-implementations
  - https://v8.dev/blog/launching-ignition-and-turbofan
  - https://v8.dev/blog/sparkplug
  - https://v8.dev/blog/maglev
  - https://v8.dev/blog/preparser
tldr: >
  The language is neither: the spec defines behaviour, not an execution strategy. Modern engines
  do both. They parse the whole source up front, compile it to bytecode, interpret that bytecode,
  and JIT-compile hot code to machine code, using runtime type feedback. So "compiled or
  interpreted" is a property of an implementation, not of JavaScript.
---

## Answer

"Compiled" and "interpreted" describe implementations, not languages, and ECMA-262 only requires that an implementation produce the specified observable results. Real engines are hybrids.

A typical engine pipeline, using V8 as the example:

1. **Parse.** The source becomes an AST. Syntax errors and *early errors* (such as duplicate `let` declarations) are reported here, before any code runs. V8 *pre-parses* inner functions lazily: it checks them for errors but skips building their full AST until first call.
2. **Compile to bytecode.** The **Ignition** interpreter runs compact bytecode. Starting here keeps startup fast and memory low.
3. **Tier up.** While running, the engine collects feedback about types and shapes. Hot functions are compiled to machine code: V8 has **Sparkplug** (a fast baseline compiler), **Maglev** (a mid-tier optimizing compiler) and **TurboFan** (the top-tier optimizer).
4. **Deoptimize.** Optimized code rests on assumptions from that feedback. If one breaks, say a function suddenly receives a different type, the engine discards the machine code and falls back to a lower tier.

So JavaScript is parsed ahead of execution and compiled just in time, but a first call is still interpreted. Other engines use similar tiers with different names, and some embedded engines are interpreter-only.

The interview-safe answer: "It is usually parsed, compiled to bytecode, interpreted, and JIT-compiled for hot paths. It is not an ahead-of-time compiled language, and it is not line-by-line interpreted."

## Example

```js
// Parsing happens for the whole source before any of it runs.
try {
  eval(`
    console.log('this line never runs');
    let value = ;
  `);
} catch (error) {
  console.log(error.name); // → SyntaxError
}

// An early error is reported even inside a function that is never called.
try {
  eval(`
    function neverCalled() {
      let a = 1;
      let a = 2;
    }
  `);
} catch (error) {
  console.log(error.name); // → SyntaxError
}
```

## Pitfalls

- Answering "interpreted because it runs in the browser". Browsers JIT-compile hot code to machine code.
- Answering "compiled" because of build tools. Babel or TypeScript transform source to source; that is separate from how the engine executes the result.
- Assuming optimized code is always faster. It depends on feedback; code whose types keep changing can repeatedly deoptimize.
- Thinking an error appears only when its line runs. Syntax and early errors are reported at parse time, before execution.

## Follow-ups

**Q:** What is a JIT compiler?
**A:** A just-in-time compiler generates machine code while the program runs, using observed behaviour (types, hot paths) to optimize. Its output is speculative and guarded, so the engine can bail out to bytecode when a guard fails.

**Q:** Why not compile everything with the optimizer up front?
**A:** Optimizing is slow and costs memory, and most code runs once. Starting in the interpreter makes pages and scripts begin quickly; only hot code earns the expensive tiers.

**Q:** Are all engines the same?
**A:** No. SpiderMonkey and JavaScriptCore have their own tier names and heuristics, and some engines for constrained devices interpret only. The language semantics are identical either way.
