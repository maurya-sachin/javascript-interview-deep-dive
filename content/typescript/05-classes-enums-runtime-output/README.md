# 05 — Classes, enums, and runtime output

> **Status:** 🔴 planned · **Published:** 0/9 · **Last verified:** —

TypeScript features that are more than types: classes, enums, namespaces, and decorators, and which of them emit JavaScript.

## Learning goals

After this chapter you can:

- Use parameter properties and access modifiers, and contrast `private` with `#private`
- Choose between an enum, a `const` object, and a union
- Explain declaration merging and when namespaces still matter
- Say which syntax emits code and what `erasableSyntaxOnly` forbids

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Numeric, string, and `const` enums; emitted code; `as const` objects → 010
- `public` / `private` / `protected` / `readonly`, parameter properties, `override` → 020
- `static` blocks, `declare` fields, `useDefineForClassFields` field-order semantics → 025
- `abstract` classes, `implements` vs `extends` → 030
- Mixins (constructor-type pattern, constrained mixins) → 035
- Interface merging, namespace merging, namespaces vs modules → 040
- Standard (TC39) decorators vs `experimentalDecorators` → 050
- Decorator metadata, `emitDecoratorMetadata` runtime type metadata for DI frameworks, `accessor` auto-accessors → 055
- Enums, namespaces, parameter properties, `import =`; `erasableSyntaxOnly` → 060

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [Should you use enums or union types?](010-enums-vs-unions.md) | medium | 🟡 draft |
| 020 | [How do TypeScript classes differ from JavaScript classes: modifiers, parameter properties, `#private`?](020-class-members-access.md) | medium | 🟡 draft |
| 025 | [How do `useDefineForClassFields`, `declare` fields, and `static` blocks change class fields?](025-class-field-semantics.md) | hard | 🟡 draft |
| 030 | [When do you use `abstract` classes versus `implements` an interface?](030-abstract-classes-implements.md) | medium | 🟡 draft |
| 035 | [How do you type a mixin in TypeScript?](035-mixins.md) | hard | 🟡 draft |
| 040 | [What is declaration merging, and are namespaces still used?](040-declaration-merging-namespaces.md) | medium | 🟡 draft |
| 050 | [How do decorators work in TypeScript?](050-decorators.md) | hard | 🟡 draft |
| 055 | [How do decorator metadata and `accessor` fields work, and what did `emitDecoratorMetadata` give DI frameworks?](055-decorator-metadata.md) | hard | 🔴 planned |
| 060 | [Which TypeScript syntax has runtime output, and why does `erasableSyntaxOnly` exist?](060-erasable-syntax-only.md) | hard | 🟡 draft |
<!-- generated:questions:end -->

## Sources

- [Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html)
- [Enums](https://www.typescriptlang.org/docs/handbook/enums.html)
- [Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [Namespaces](https://www.typescriptlang.org/docs/handbook/namespaces.html)
- [Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [Mixins](https://www.typescriptlang.org/docs/handbook/mixins.html)
- [TSConfig — erasableSyntaxOnly](https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly)
