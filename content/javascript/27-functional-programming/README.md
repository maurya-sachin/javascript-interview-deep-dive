# 27 — Functional programming

> **Status:** 🔴 planned · **Published:** 0/3 · **Last verified:** —

Functional techniques beyond composition: updating data without mutating it, structures that make that cheap, and the functional vocabulary behind `map`, `flatMap` and `then`. Pure functions, currying and composition live in [08 — Functions](../08-functions/).

## Learning goals

After this chapter you can:

- Update nested data without mutation and say what each copy costs
- Explain structural sharing and when a persistent data structure pays off
- Describe `Array.prototype.flatMap` and `Promise.prototype.then` in functor and monad terms, and where `then` breaks the laws

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Immutable updates of nested data: spread, `with`/`toSorted`, `structuredClone`, `Object.freeze` → 010
- Persistent data structures and structural sharing → 020
- Functors and monads in JavaScript terms (`map`, `flatMap`, `then`) → 030

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How do you update nested data immutably, and what does each copy cost?](010-immutable-updates.md) | medium | 🟡 draft |
| 020 | [What are persistent data structures, and how does structural sharing make them cheap?](020-persistent-data-structures.md) | hard | 🟡 draft |
| 030 | [Is a Promise a monad? `map`, `flatMap` and `then` in functional terms](030-functors-and-monads.md) | hard | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Array.prototype.flatMap](https://tc39.es/ecma262/#sec-array.prototype.flatmap) · [Array.prototype.with](https://tc39.es/ecma262/#sec-array.prototype.with) · [Promise.prototype.then](https://tc39.es/ecma262/#sec-promise.prototype.then) · [Object.freeze](https://tc39.es/ecma262/#sec-object.freeze)
- **MDN:** [structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) · [Object.freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)
