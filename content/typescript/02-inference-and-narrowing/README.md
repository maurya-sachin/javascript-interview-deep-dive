# 02 — Inference and narrowing

> **Status:** 🔴 planned · **Published:** 0/6 · **Last verified:** —

How the compiler infers types and narrows them through control flow: type guards, discriminated unions, `satisfies`, and assertions.

## Learning goals

After this chapter you can:

- Predict what type TypeScript infers for a declaration and why
- Narrow a union with `typeof`, `in`, `instanceof`, and equality
- Write a user-defined type guard and an assertion function
- Model state with a discriminated union and check it exhaustively
- Choose between annotation, `as`, and `satisfies`

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Best common type, contextual typing, return type inference; Where explicit annotations belong (public APIs, empty collections) → 010
- Control-flow analysis; `typeof`, truthiness, equality, `in`, `instanceof`; Why narrowing is lost in callbacks and after mutation → 020
- `x is T` predicates, `asserts x is T`, inferred type predicates → 030
- Discriminated unions, tag property, `never` exhaustiveness check → 040
- `satisfies` vs annotation vs `as` → 050
- Type assertions, double assertion, non-null `!`, definite assignment `!:` → 060

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How does TypeScript infer types, and when should you annotate explicitly?](010-how-inference-works.md) | medium | 🟡 draft |
| 020 | [How does narrowing work, and what built-in checks narrow a type?](020-control-flow-narrowing.md) | medium | 🔴 planned |
| 030 | [How do you write a user-defined type guard or assertion function?](030-custom-type-guards.md) | medium | 🔴 planned |
| 040 | [What is a discriminated union, and how do you check it exhaustively?](040-discriminated-unions.md) | medium | 🔴 planned |
| 050 | [What does `satisfies` do, and how is it different from a type annotation?](050-satisfies-operator.md) | medium | 🔴 planned |
| 060 | [What do `as`, `!`, and `!:` actually do, and when are they safe?](060-assertions-and-non-null.md) | easy | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Type Inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)
- [Everyday Types — Type Assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)
- [TypeScript 4.9 — `satisfies`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)
