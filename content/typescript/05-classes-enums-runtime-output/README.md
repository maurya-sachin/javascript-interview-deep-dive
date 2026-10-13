# 05 — Classes, enums, and runtime output

> **Status:** 🔴 planned · **Published:** 0/6 · **Last verified:** —

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
- `public` / `private` / `protected` / `readonly`, parameter properties, `override`; Mixins → 020
- `abstract` classes, `implements` vs `extends` → 030
- Interface merging, namespace merging, namespaces vs modules → 040
- Standard (TC39) decorators vs `experimentalDecorators` → 050
- Enums, namespaces, parameter properties, `import =`; `erasableSyntaxOnly` → 060

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [Should you use enums or union types?](010-enums-vs-unions.md) | medium | 🔴 planned |
| 020 | [How do TypeScript classes differ from JavaScript classes: modifiers, parameter properties, `#private`?](020-class-members-access.md) | medium | 🔴 planned |
| 030 | [When do you use `abstract` classes versus `implements` an interface?](030-abstract-classes-implements.md) | medium | 🔴 planned |
| 040 | [What is declaration merging, and are namespaces still used?](040-declaration-merging-namespaces.md) | medium | 🔴 planned |
| 050 | [How do decorators work in TypeScript?](050-decorators.md) | hard | 🔴 planned |
| 060 | [Which TypeScript syntax has runtime output, and why does `erasableSyntaxOnly` exist?](060-erasable-syntax-only.md) | hard | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html)
- [Enums](https://www.typescriptlang.org/docs/handbook/enums.html)
- [Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [Namespaces](https://www.typescriptlang.org/docs/handbook/namespaces.html)
- [Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [Mixins](https://www.typescriptlang.org/docs/handbook/mixins.html)
- [TSConfig — erasableSyntaxOnly](https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly)
