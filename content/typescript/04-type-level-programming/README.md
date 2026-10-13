# 04 — Type-level programming

> **Status:** 🔴 planned · **Published:** 0/6 · **Last verified:** —

Computing types from types: conditional types and `infer`, mapped types, template literal types, recursive types, and the built-in utility types.

## Learning goals

After this chapter you can:

- Write a conditional type and explain distribution over unions
- Extract parts of a type with `infer`
- Build a mapped type with key remapping and modifiers
- Implement common utility types from scratch
- Explain the limits of recursive types

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Conditional types, distributive behaviour, `[T] extends [U]` to disable it → 010
- `infer` in conditional types, constrained `infer` → 020
- Mapped types, `readonly` / `?` modifiers, `as` key remapping → 030
- Template literal types, intrinsic string types, pattern inference → 040
- `Partial`, `Required`, `Pick`, `Omit`, `Record`, `Exclude`, `Extract`, `NonNullable`, `ReturnType`, `Parameters` → 050
- Recursive and tail-recursive conditional types, instantiation depth limits → 060

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How do conditional types work, and what is distribution?](010-conditional-types.md) | hard | 🟡 draft |
| 020 | [What does `infer` do? Implement `ReturnType` and `Awaited`.](020-infer-keyword.md) | hard | 🟡 draft |
| 030 | [How do mapped types work, including key remapping and `+` / `-` modifiers?](030-mapped-types.md) | hard | 🟡 draft |
| 040 | [What are template literal types, and what are they used for?](040-template-literal-types.md) | medium | 🟡 draft |
| 050 | [Which built-in utility types do you use, and how would you implement them?](050-utility-types.md) | medium | 🟡 draft |
| 060 | [How do you write a recursive type such as `DeepPartial`, and what are the limits?](060-recursive-types.md) | hard | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [Creating Types from Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
- [Utility Types](https://www.typescriptlang.org/docs/handbook/2/utility-types.html)
