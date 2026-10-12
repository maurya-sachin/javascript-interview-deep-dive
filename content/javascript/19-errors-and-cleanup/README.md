# 19 — Errors and cleanup

> **Status:** 🔴 planned · **Published:** 0/5 · **Last verified:** —

Throwing, catching, and custom errors; why async errors escape `try`; and deterministic cleanup with `using`.

## Learning goals

After this chapter you can:

- Predict what `finally` does to a `return` or `throw`
- Create custom errors with a `cause`
- Catch errors from callbacks and promises correctly
- Release resources with `using` and `DisposableStack`

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- `try`/`catch`/`finally` completions; `finally` overriding a return → 010
- Optional catch binding; throwing non-Error values → 010
- Error types, `cause`, `stack` (non-standard), `Error.isError`, extending `Error`, `AggregateError` → 020
- Errors in callbacks vs `await`; error-first callbacks → 030
- `using`, `await using`, `Symbol.dispose`, `Symbol.asyncDispose`, `DisposableStack`, `SuppressedError` → 040
- Global handlers: `error`, `unhandledrejection`, `process.on("uncaughtException")` → 050
- Error stack accessor (Stage 3) → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How do `try`, `catch`, and `finally` interact with `return`?](010-try-catch-finally.md) | medium | 🟡 draft |
| 020 | [How do you create custom errors?](020-custom-errors.md) | easy | 🟡 draft |
| 030 | [Why doesn't `try`/`catch` catch errors in a callback?](030-async-error-boundaries.md) | medium | 🟡 draft |
| 040 | [What do `using` and `await using` do?](040-explicit-resource-management.md) | medium | 🟡 draft |
| 050 | [How do you handle errors you didn't catch?](050-uncaught-errors.md) | medium | 🟡 draft |
<!-- generated:questions:end -->

## Sources

- **Spec:** [The try statement](https://tc39.es/ecma262/#sec-try-statement) · [Error objects](https://tc39.es/ecma262/#sec-error-objects) · [Resource management](https://tc39.es/ecma262/#sec-resource-management) · [DisposableStack objects](https://tc39.es/ecma262/#sec-disposablestack-objects)
- **MDN:** [try...catch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch) · [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) · [using](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/using) · [Resource management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Resource_management)
