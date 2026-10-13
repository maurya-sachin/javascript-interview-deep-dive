# 08 — The compiler

> **Status:** 🔴 planned · **Published:** 0/6 · **Last verified:** —

What `tsc` does: checking versus emitting, type erasure, how other tools strip types, and the native compiler port.

## Learning goals

After this chapter you can:

- Explain that types are erased and cannot be used at runtime
- Separate type checking from transpiling and say why bundlers skip checking
- Explain how Node.js runs TypeScript by stripping types
- Describe the compiler pipeline and the native (Go) port
- Explain where the type system is intentionally unsound

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Type erasure; runtime validation (e.g. schema libraries); user-defined guards → 010
- `tsc` vs Babel/esbuild/swc, `noEmit`, `isolatedModules` → 020
- Type stripping, `--experimental-strip-types`, what it cannot handle → 030
- Scanner, parser, binder, checker, emitter; language service → 040
- `tsgo`, TypeScript 7 native port, what changes for tooling → 050
- Intentional unsoundness: `any`, assertions, array covariance, index signatures → 060

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What does TypeScript erase at compile time, and what does that mean for runtime checks?](010-type-erasure.md) | medium | 🟡 draft |
| 020 | [What is the difference between type checking and transpiling, and why do bundlers skip checking?](020-checking-vs-emitting.md) | medium | 🟡 draft |
| 030 | [How does Node.js run TypeScript files directly?](030-node-type-stripping.md) | medium | 🟡 draft |
| 040 | [What are the stages of the TypeScript compiler?](040-compiler-pipeline.md) | hard | 🟡 draft |
| 050 | [What is the native (Go) port of the TypeScript compiler?](050-native-compiler-port.md) | medium | 🔴 planned |
| 060 | [Is TypeScript's type system sound? Where does it not catch errors?](060-type-system-soundness.md) | hard | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [TypeScript for JS Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
- [Node.js — Running TypeScript natively](https://nodejs.org/docs/latest/api/typescript.html)
- [Announcing TypeScript Native Previews](https://devblogs.microsoft.com/typescript/announcing-typescript-native-previews/)
- [microsoft/TypeScript — Codebase notes](https://github.com/microsoft/TypeScript/wiki/Codebase)
