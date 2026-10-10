# 17 — Promises

> **Status:** 🔴 planned · **Published:** 0/8 · **Last verified:** —

Promise states and resolution, chaining, combinators, error propagation, and implementing promises yourself.

## Learning goals

After this chapter you can:

- Explain promise states and how resolution adopts thenables
- Predict what a `then` chain returns at each step
- Pick the right combinator and handle rejections without leaks
- Implement `Promise.all` and a basic Promise

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- States; settled vs resolved; settling only once → 010
- Thenables and the resolution procedure → 020
- `then` returning a new promise; adopting returned promises → 020
- `all`, `allSettled`, `race`, `any`; `AggregateError` → 030
- `catch` and `finally` semantics; rejection propagation; unhandled rejections → 040
- `withResolvers`, `try` → 050
- Implementing combinators and a spec-like Promise → 060, 070
- Callback hell, inversion of control, promisification → 080

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What is a Promise?](010-what-is-a-promise.md) | easy | 🔴 planned |
| 020 | [How does promise chaining work?](020-promise-chaining.md) | medium | 🔴 planned |
| 030 | [`Promise.all` vs `allSettled` vs `race` vs `any`?](030-promise-combinators.md) | easy | 🔴 planned |
| 040 | [How do errors propagate through promises, and what is an unhandled rejection?](040-promise-error-handling.md) | medium | 🔴 planned |
| 050 | [What do `Promise.withResolvers` and `Promise.try` solve?](050-withresolvers-and-try.md) | medium | 🔴 planned |
| 060 | [Implement `Promise.all`.](060-implement-promise-all.md) | medium | 🔴 planned |
| 070 | [Implement a Promise from scratch.](070-implement-a-promise.md) | hard | 🔴 planned |
| 080 | [How do you convert a callback API to promises?](080-promisify.md) | easy | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Promise objects](https://tc39.es/ecma262/#sec-promise-objects) · [Promise resolve functions](https://tc39.es/ecma262/#sec-promise-resolve-functions) · [Promise.all](https://tc39.es/ecma262/#sec-promise.all) · [Promise.try](https://tc39.es/ecma262/#sec-promise.try)
- **MDN:** [Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) · [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) · [Promise.withResolvers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers)
