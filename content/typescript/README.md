# TypeScript

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

TypeScript's type system and compiler: how types are checked, inferred, and erased.
Most frontend and Node.js codebases are TypeScript now, and interviews probe whether you can reason about types rather than just annotate.

## Scope

- **In:** structural typing, inference, narrowing, generics, conditional/mapped/template literal types, declaration files, `tsconfig` and module resolution, what `tsc` emits and what it erases.
- **Out:** runtime behaviour → [JavaScript](../javascript/) · bundlers and transpilers → [Tooling](../tooling/) · typing components and hooks → [React](../react/).

## Prerequisites

[JavaScript](../javascript/) — especially objects, classes, and modules.

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- Type system basics: structural typing, assignability, `any` / `unknown` / `never`, literal types
- Inference and narrowing (control-flow analysis, type guards, discriminated unions, `satisfies`)
- Generics (constraints, defaults, variance)
- Type-level programming: conditional types and `infer`, mapped types, template literal types, utility types
- Classes, enums, and features with runtime output (and why `erasableSyntaxOnly` exists)
- Modules: declaration files, `declare`, module augmentation, `moduleResolution`, ESM/CJS interop
- `tsconfig` and strictness flags; project references
- The compiler: checking vs emitting, type stripping in Node.js, the native (Go) compiler port

## Sources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [TSConfig reference](https://www.typescriptlang.org/tsconfig/)
- [TypeScript release notes](https://www.typescriptlang.org/docs/handbook/release-notes/overview.html)
- [microsoft/TypeScript](https://github.com/microsoft/TypeScript) — issues and design notes, for confirming edge cases
