# 01 — Type system basics

> **Status:** 🔴 planned · **Published:** 0/6 · **Last verified:** —

How TypeScript decides whether one type fits another, and the core building blocks: structural typing, `any` / `unknown` / `never`, literal types, object and function types.

## Learning goals

After this chapter you can:

- Explain structural typing and why excess property checks exist
- Choose between `type` and `interface` and defend the choice
- Distinguish `any`, `unknown`, and `never` and say when each is right
- Explain literal widening and what `as const` changes
- Describe where assignability is deliberately unsound

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- `type` aliases vs `interface`: declaration merging, `extends` vs intersections, unions, error messages → 010
- Structural typing and assignability; branding to simulate nominal types → 020
- Top type, bottom type, and the escape hatch; `never` in exhaustiveness and unreachable code → 030
- Literal types, widening, `const` vs `let` inference, `as const`, `unique symbol` → 040
- Excess property checks and fresh object literals; Object types: optional, `readonly`, index signatures, `exactOptionalPropertyTypes` → 050
- Function type expressions, call signatures, overloads, `this` parameters; Parameter bivariance and `void` return assignability; Typing iterators and generators → 060

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What is the difference between `type` and `interface`?](010-type-vs-interface.md) | medium | 🟡 draft |
| 020 | [What is structural typing, and how does it differ from nominal typing?](020-structural-typing.md) | medium | 🟡 draft |
| 030 | [What is the difference between `any`, `unknown`, and `never`?](030-any-unknown-never.md) | medium | 🔴 planned |
| 040 | [What are literal types, and what does `as const` do?](040-literal-types-as-const.md) | medium | 🔴 planned |
| 050 | [Why does TypeScript report an error on an object literal but not on a variable with the same shape?](050-excess-property-checks.md) | medium | 🔴 planned |
| 060 | [How do function types, overloads, and the `void` return type work?](060-function-types-overloads.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html)
- [Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
