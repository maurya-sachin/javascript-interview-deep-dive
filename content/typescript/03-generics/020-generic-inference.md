---
title: "How are generic type arguments inferred, and when does inference go wrong?"
status: draft
difficulty: hard
frequency: 3
core: false
tags: [generics, inference, type-arguments, candidates, widening, contravariance]
related:
  - typescript/generics/generics-and-constraints
  - typescript/inference-and-narrowing/how-inference-works
  - typescript/generics/const-type-params-noinfer
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/2/generics.html
  - https://www.typescriptlang.org/docs/handbook/type-inference.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-6.html
  - https://github.com/microsoft/TypeScript/pull/56794
tldr: >
  At each call TypeScript gathers candidates for every type parameter from the arguments (and the
  expected return type), then picks one: the common supertype for covariant positions, the
  common subtype for contravariant ones, widening literals unless a constraint says otherwise.
  Inference fails quietly to `unknown` or `never` when no argument mentions the parameter.
---

## Answer

For `f<T>(...)`, the checker walks each argument against its parameter type and records **candidates** for `T` wherever `T` appears. It then resolves them:

- **Covariant positions** (values going in, like `a: T`, `T[]`): the handbook's best common type rule applies: pick the candidate compatible with the others. When none fits, the observed behaviour is that the first candidate wins and later arguments are checked against it: `same(1, "a")` reports `"a"` is not assignable to `1`, and `same("a", 1)` reports `1` is not assignable to `"a"` (both checked).
- **Contravariant positions** (callback parameters, `(x: T) => void`): since TS 2.6 the result is the best common **subtype**, so `both(onAnimal, onDog)` infers `Dog`.
- **Literal widening.** An unconstrained `T` from `"a"` and `"b"` becomes `string`. A constraint such as `T extends string` keeps `"a" | "b"`.
- **Return-type context.** The expected type is also a source: `const x: string = parse("{}")` infers `T = string`.
- **No source.** If no argument mentions `T`, you get the constraint, or `unknown` when there is none. An empty array literal gives `never`.

**When it goes wrong:** the argument you intended as the source of truth is one of several candidates (the `NoInfer` case: a default value widens the union and a wrong value is accepted); a type parameter appears only in the return type, so callers get `unknown`; or you wrote one type argument and the compiler demands the rest.

**Explicit arguments are all or nothing.** TypeScript has no partial inference: `two<string>("a", 1)` is error TS2558. Parameters with defaults may be omitted from the right, and then the default is used, not inferred. Fixes: supply every argument, or give the trailing parameters defaults.

Use `NoInfer` to say which position must not contribute candidates.

## Example

```ts
// TypeScript 7.0.2 and 5.9.3, --strict
interface Animal { name: string }
interface Dog extends Animal { bark(): void }

declare function same<T>(a: T, b: T): T;
const widened = same("a", "b"); // string
same(1, "a");
// Error TS2345: Argument of type '"a"' is not assignable to parameter of type '1'.

declare function sameLiteral<T extends string>(a: T, b: T): T;
const kept = sameLiteral("a", "b"); // "a" | "b"

declare function both<T>(a: (x: T) => void, b: (x: T) => void): T;
declare const onAnimal: (x: Animal) => void;
declare const onDog: (x: Dog) => void;
const narrowest = both(onAnimal, onDog); // Dog: contravariant candidates pick the subtype

declare function parse<T>(json: string): T;
const unknownResult = parse("{}"); // unknown: no argument mentions T
const fromContext: string = parse("{}"); // string: the declared type is the source

declare function first<T>(xs: T[]): T;
const nothing = first([]); // never

declare function pair<A, B = A>(a: A): [A, B];
const defaulted = pair<string>("a"); // [string, string]
declare function two<A, B>(a: A, b: B): [A, B];
two<string>("a", 1);
// Error TS2558: Expected 2 type arguments, but got 1.
```

## Pitfalls

- Return-only type parameters (`parse<T>(json: string): T`). With no argument to infer from, `T` is `unknown` unless the context supplies one; it is a disguised assertion. Validate at runtime (or take a schema/parser argument) instead.
- Assuming order does not matter. With mismatching candidates the first one wins, so swapping the arguments changes which one is reported (`same(1, "a")` vs `same("a", 1)`).
- Expecting partial explicit arguments to infer the rest. `two<string>("a", 1)` is an error; defaults are used, not inferred.
- Trusting `[]`: `first([])` is `never`, and the empty array has nothing to widen from.

## Follow-ups

**Q:** Why does `apply((x) => x.toFixed(), 1)` work when the callback comes first?
**A:** Checked on 7.0.2 and 5.9.3: `x` is typed `number`, so `1` still supplied the candidate for `T` before the callback's parameter was typed. ❓ The exact internal ordering was not read from the compiler source.

**Q:** How do I stop an argument from widening the inferred type?
**A:** Mark it `NoInfer<T>` (TS 5.4). Inferences to the marked position are blocked, so a mismatching value is an error instead of a new candidate.
