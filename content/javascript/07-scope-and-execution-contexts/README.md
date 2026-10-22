# 07 — Scope, hoisting, and execution contexts

> **Status:** 🔴 planned · **Published:** 0/10 · **Last verified:** —

How bindings are created and found: scope, hoisting, the TDZ, and the spec machinery underneath — execution contexts, Environment Records, and realms.

## Learning goals

After this chapter you can:

- Explain hoisting and the TDZ in terms of when bindings are created and initialized
- Trace a variable lookup through the scope chain
- Describe what an execution context and the call stack contain
- Explain why objects from another realm fail `instanceof`

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Function, block, module, and global scope → 010, 040
- `var` vs `let`/`const`: scope, redeclaration, global properties; `const` isn't immutability → 010, 070
- Declaration instantiation — what "hoisting" means in the spec → 020
- Function declarations vs `var`; function declarations in blocks (Annex B) → 020
- TDZ, including `typeof` in the TDZ → 030
- Lexical scope, shadowing, scope chain lookup → 040
- Execution contexts, the call stack, the running execution context → 050
- Environment Records: declarative, function, object, global, module → 060
- Global object, global Environment Record, `globalThis` → 070
- Stack overflow, recursion depth, proper tail calls (JavaScriptCore only) → 080
- Realms and intrinsics; cross-realm `instanceof` → 090
- `with` and direct `eval` changing scope at run time → 100

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What's the difference between `var`, `let`, and `const`?](010-var-let-const.md) | easy | 🟡 draft |
| 020 | [What is hoisting, really?](020-hoisting.md) | medium | 🟡 draft |
| 030 | [What is the temporal dead zone?](030-temporal-dead-zone.md) | medium | 🟡 draft |
| 040 | [What is lexical scope, and how does the scope chain work?](040-lexical-scope-chain.md) | medium | 🟡 draft |
| 050 | [What is an execution context, and what does the call stack hold?](050-execution-context-call-stack.md) | medium | 🟡 draft |
| 060 | [What is an Environment Record?](060-environment-records.md) | hard | 🟡 draft |
| 070 | [What is the global object, and how does `globalThis` relate to global variables?](070-global-object-globalthis.md) | medium | 🟡 draft |
| 080 | [What causes "Maximum call stack size exceeded", and do tail calls help?](080-stack-overflow-tail-calls.md) | medium | 🟡 draft |
| 090 | [What is a realm, and why does `instanceof Array` fail across iframes?](090-realms.md) | hard | 🟡 draft |
| 100 | [How do `with` and direct `eval` change scope at run time?](100-with-and-direct-eval-scope.md) | hard | 🟡 draft |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Environment Records](https://tc39.es/ecma262/#sec-environment-records) · [Execution contexts](https://tc39.es/ecma262/#sec-execution-contexts) · [let and const](https://tc39.es/ecma262/#sec-let-and-const-declarations) · [Realms](https://tc39.es/ecma262/#sec-code-realms) · [Tail position calls](https://tc39.es/ecma262/#sec-tail-position-calls)
- **MDN:** [let](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let) · [Hoisting](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting) · [globalThis](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis)
