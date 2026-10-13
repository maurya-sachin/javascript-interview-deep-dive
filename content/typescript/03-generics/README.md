# 03 — Generics

> **Status:** 🔴 planned · **Published:** 0/5 · **Last verified:** —

Parameterised types and functions: constraints, defaults, inference of type arguments, variance, and the `keyof` / `typeof` / indexed-access operators.

## Learning goals

After this chapter you can:

- Write a generic function and constrain its type parameter
- Explain how type arguments are inferred and when to supply them
- Describe covariance and contravariance and the `in` / `out` annotations
- Use `keyof`, `typeof`, and indexed access types to derive types

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Generic functions, interfaces, classes; `extends` constraints, defaults → 010
- Inference candidates, widening, inference from multiple sites → 020
- Variance, `strictFunctionTypes`, `in` / `out` annotations; Array and function parameter variance → 030
- `keyof`, `typeof` (type position), indexed access, `T[number]` → 040
- `const` type parameters, `NoInfer<T>` → 050

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What are generics, and how do `extends` constraints work?](010-generics-and-constraints.md) | medium | 🔴 planned |
| 020 | [How are generic type arguments inferred, and when does inference go wrong?](020-generic-inference.md) | hard | 🔴 planned |
| 030 | [What are covariance and contravariance, and what do `in` and `out` do?](030-variance.md) | hard | 🔴 planned |
| 040 | [What do `keyof`, `typeof`, and indexed access types do?](040-keyof-typeof-indexed-access.md) | medium | 🔴 planned |
| 050 | [What are `const` type parameters and `NoInfer`?](050-const-type-params-noinfer.md) | hard | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [Keyof Type Operator](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)
- [Typeof Type Operator](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)
- [Indexed Access Types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)
- [TypeScript 4.7 — Variance Annotations](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html)
