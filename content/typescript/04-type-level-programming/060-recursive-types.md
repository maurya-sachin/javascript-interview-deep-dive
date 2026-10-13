---
title: "How do you write a recursive type such as `DeepPartial`, and what are the limits?"
status: draft
difficulty: hard
frequency: 3
core: false
tags: [recursive-types, deeppartial, conditional-types, tail-recursion, instantiation-depth]
related:
  - typescript/type-level-programming/conditional-types
  - typescript/type-level-programming/mapped-types
  - typescript/type-level-programming/utility-types
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html
  - https://github.com/microsoft/TypeScript/pull/40002
  - https://github.com/microsoft/TypeScript/pull/45711
tldr: >
  A type may refer to itself inside an object property, an array or tuple element
  (TS 3.7), a mapped type, or a conditional branch (TS 4.1). `DeepPartial` is a mapped type
  that recurses into properties, with a branch for functions. Limits: a depth cap, TS2589
  beyond it, and 4.5 tail-recursion elimination for accumulator-style conditionals.
---

## Answer

A type alias can reference itself when the reference sits somewhere resolved lazily: an object property, an array or tuple element (TS 3.7), a mapped type's property type, or a branch of a conditional type (TS 4.1). A bare `type A = A | string` is still an error (TS2456).

`DeepPartial` is a mapped type that recurses on each property:

```ts
type DeepPartial<T> = T extends (...args: any) => any ? T
  : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
```

The first branch keeps functions callable, the second recurses on objects (arrays and tuples keep their shape, since the mapped type is homomorphic), and primitives fall through. The naive `{ [K in keyof T]?: DeepPartial<T[K]> }` alone turns function properties into `Naive<(v: string) => void>`, which is not callable.

**Limits.**

- **Depth cap.** The checker bounds nested type instantiations. A non-tail-recursive conditional that returns something built from the recursive call (`C | GetChars<R>`) fails with TS2589 ("excessively deep and possibly infinite") after only dozens of levels.
- **Tail recursion (TS 4.5).** If a branch is *just* another conditional (the recursive call is in tail position), the compiler loops instead of nesting and allows about a thousand iterations. Rewrite with an **accumulator** parameter to get there.
- **Cost.** Recursive types slow checking and degrade error messages; the 4.1 notes tell you to use them sparingly.

**Pitfalls in the type itself:** built-in classes like `Date`, `Map`, `Set` and `Promise` are objects, so `DeepPartial` maps their methods into optional ones. Add a branch for the types you want treated as leaves. Arrays get `(T | undefined)[]` elements because `?` is applied per element.

## Example

```ts
// TypeScript 7.0.2 and 5.9.3, --strict
interface Cfg { tags: string[]; db: { host: string; port: number }; onChange: (v: string) => void }
type DeepPartial<T> = T extends (...args: any) => any ? T
  : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
type Db = DeepPartial<Cfg>["db"]; // { host?: string | undefined; port?: number | undefined; } | undefined
type Tags = DeepPartial<Cfg>["tags"]; // (string | undefined)[] | undefined
const ok: DeepPartial<Cfg> = { db: { host: "h" } };
const bad: DeepPartial<Cfg> = { db: { port: "x" } };
// Error TS2322: Type 'string' is not assignable to type 'number'.

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
const j: Json = { a: [1, { b: null }] };
type Circ = Circ | string;
// Error TS2456: Type alias 'Circ' circularly references itself.

type Flat<T> = T extends readonly (infer U)[] ? Flat<U> : T;
type F = Flat<number[][][]>; // number

type TupleOfRec<T, N extends number, Acc extends unknown[]> =
  Acc["length"] extends N ? Acc : TupleOfRec<T, N, [T, ...Acc]>;
type Ok = TupleOfRec<0, 999, []>["length"]; // 999
type TooDeep = TupleOfRec<0, 1000, []>["length"];
// Error TS2589: Type instantiation is excessively deep and possibly infinite.
```

## Pitfalls

- Recursing blindly into every object. `Date` comes out as a type with every method optional (checked), and functions lose their call signatures unless you add a function branch.
- Building a result from the recursive call (`Char | GetChars<Rest>`) and hitting TS2589 on inputs of around 50 characters. Measured: 48 characters passed and 49 failed on 5.9.3 and 7.0.2; the accumulator form `GetCharsRec<Rest, Char | Acc>` handled a 104-character string.
- Assuming the limit is a documented constant. PR 45711 describes a depth of 100 and 1000 tail iterations; I measured 999 passing and 1000 failing for the tuple builder above, but those are implementation details that may change.
- Forgetting that the "recursive" part must sit under a lazy position. Direct self-union (`A = A | string`) errors; `A = string | A[]` does not.

## Follow-ups

**Q:** Why can `Json` refer to itself but `Circ` cannot?
**A:** In `Json` the self-references are inside an array element and an object index signature, which the compiler resolves lazily. In `Circ` the alias must be resolved just to know what it is (TS 3.7 widened which positions count as lazy).

**Q:** How do you make a conditional type tail recursive?
**A:** Put the recursive call in a branch with nothing wrapped around it, and carry partial results in an extra parameter, as in `TupleOfRec` above (TS 4.5, PR 45711).
