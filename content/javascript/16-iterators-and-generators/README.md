# 16 — Iterators and generators

> **Status:** 🔴 planned · **Published:** 0/5 · **Last verified:** —

The iteration protocols, generators as pausable functions, lazy iterator helpers, and async iteration.

## Learning goals

After this chapter you can:

- Make any object iterable and explain what `for…of` calls
- Explain how a generator suspends and resumes
- Build lazy pipelines with iterator helpers
- Consume async data with `for await…of`

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Iterable and iterator protocols; `Symbol.iterator`; `{ value, done }` → 010
- Consumers (`for…of`, spread, destructuring, `Array.from`); closing via `return()` → 010
- Implementing an iterable data structure → 010
- Generator functions: `yield`, `yield*`, `next(value)`, `return()`, `throw()` → 020
- Generators as suspended execution contexts → 020
- `Iterator.from`, `map`, `filter`, `take`, `drop`, `flatMap`, `reduce`, `toArray`; infinite sequences → 030
- `Iterator.concat`, `Iterator.zip`, chunking, `includes`, `join` → 040
- Async iterators and generators; `for await…of`; `Symbol.asyncIterator` → 050

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What are the iteration protocols?](010-iteration-protocols.md) | medium | 🟡 draft |
| 020 | [How do generators pause and resume?](020-generators.md) | hard | 🟡 draft |
| 030 | [What are iterator helpers, and why are they lazy?](030-iterator-helpers.md) | medium | 🟡 draft |
| 040 | [What's new for iterators after ES2025?](040-new-iterator-methods.md) | medium | 🟡 draft |
| 050 | [How do async iterators and `for await…of` work?](050-async-iteration.md) | medium | 🟡 draft |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Iteration](https://tc39.es/ecma262/#sec-iteration) · [Generator objects](https://tc39.es/ecma262/#sec-generator-objects) · [Iterator.prototype.map](https://tc39.es/ecma262/#sec-iterator.prototype.map) · [Iterator.concat](https://tc39.es/ecma262/#sec-iterator.concat)
- **MDN:** [Iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) · [Generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator) · [Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator) · [for await...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)

## Open questions

- [ ] Check engine support for `Iterator.zip` and chunking (ES2027) before writing 040
