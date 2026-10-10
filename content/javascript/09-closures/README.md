# 09 — Closures

> **Status:** 🔴 planned · **Published:** 0/5 · **Last verified:** —

What a closure is in terms of environments, what it keeps alive, and the patterns built on it.

## Learning goals

After this chapter you can:

- Define a closure in terms of environments, not "a function inside a function"
- Fix the classic loop bug two ways
- Explain what a closure keeps alive and how that leaks memory
- Implement debounce and throttle with correct `this` and arguments

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- A closure as a function plus its captured Environment Record → 010
- Per-iteration bindings in `for (let …)` loops → 020
- What V8 actually captures (context allocation); leaks through closures → 030
- Module pattern, factory functions, private state → 040
- Debounce, throttle (leading/trailing), once → 050
- Memoization → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What is a closure?](010-what-is-a-closure.md) | medium | 🔴 planned |
| 020 | [Why does a `for (var i…)` loop with `setTimeout` print the same number?](020-closures-in-loops.md) | medium | 🔴 planned |
| 030 | [What does a closure keep alive in memory?](030-closure-memory.md) | hard | 🔴 planned |
| 040 | [How do closures create private state?](040-private-state.md) | medium | 🔴 planned |
| 050 | [Implement `debounce`, `throttle`, and `once`.](050-debounce-throttle-once.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Environment Records](https://tc39.es/ecma262/#sec-environment-records) · [CreatePerIterationEnvironment](https://tc39.es/ecma262/#sec-createperiterationenvironment) · [OrdinaryFunctionCreate](https://tc39.es/ecma262/#sec-ordinaryfunctioncreate)
- **MDN:** [Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)
