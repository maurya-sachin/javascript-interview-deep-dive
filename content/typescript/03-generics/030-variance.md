---
title: "What are covariance and contravariance, and what do `in` and `out` do?"
status: draft
difficulty: hard
frequency: 4
core: false
tags: [variance, covariance, contravariance, strictfunctiontypes, in-out, generics]
related:
  - typescript/type-system-basics/structural-typing
  - typescript/type-system-basics/function-types-overloads
  - typescript/generics/generics-and-constraints
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-6.html
  - https://www.typescriptlang.org/tsconfig/#strictFunctionTypes
  - https://github.com/microsoft/TypeScript/pull/48240
  - https://github.com/microsoft/TypeScript/pull/18654
tldr: >
  Variance says how `G<Sub>` relates to `G<Super>`. Output positions are covariant (`Dog[]` to
  `Animal[]`), input positions contravariant (a handler of `Animal` can stand in for a handler of
  `Dog`), both is invariant. `strictFunctionTypes` enforces this for function types but not
  method syntax. `in` / `out` (TS 4.7) declare and check it.
---

## Answer

Given `Dog` is a subtype of `Animal`, variance describes how a generic `G<T>` treats that relation:

- **Covariant** (`out T`): `G<Dog>` is assignable to `G<Animal>`. `T` is only produced: return types, readonly properties, `ReadonlyArray<T>`.
- **Contravariant** (`in T`): `G<Animal>` is assignable to `G<Dog>`. `T` is only consumed: function parameters. A function accepting any `Animal` is safe wherever a function accepting `Dog` is expected, not the reverse.
- **Invariant** (`in out T`): neither direction. `T` is both read and written, like a mutable box.

**`strictFunctionTypes`** (TS 2.6, in `strict`) checks function parameters contravariantly. Without it they were bivariant (either direction passed). The PR excludes anything declared with **method syntax**, so `Array<T>` and most interfaces stay covariant: `interface H { handle(x: Dog): void }` is still bivariant, while `handle: (x: Dog) => void` is checked strictly. This is a deliberate unsoundness; `dogs` assigned to `Animal[]` then `push` of a non-Dog compiles.

**`in` / `out` annotations** (TS 4.7) are written on type parameters of classes, interfaces and aliases. TypeScript normally measures variance itself by relating instantiations structurally; the annotation (a) documents intent, (b) is **checked**, producing TS2636 when the body contradicts it, and (c) lets the compiler compare type arguments directly instead of walking the structure, which the 4.7 notes say is faster for complex or recursive types.

An annotation overrides the method exemption: `Box<in out T>` with method-syntax `get()` and `set(v)` is invariant (neither direction assigns, checked), while the same members without annotations let `Plain` (with `Dog`) assign to `PlainA` (with `Animal`). The reverse also holds: `out T` on an interface whose `set(v: T)` is a method does not error (checked), because method parameters are bivariant, so the annotation cannot catch that unsoundness.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3, --strict
interface Animal { name: string }
interface Dog extends Animal { bark(): void }
declare let dogs: Dog[];
declare let dogHandler: (d: Dog) => void;
declare let animalHandler: (a: Animal) => void;

animalHandler = dogHandler;
// Error TS2322: Type '(d: Dog) => void' is not assignable to type '(a: Animal) => void'.
dogHandler = animalHandler; // OK: a handler of any Animal handles Dogs

const animals: Animal[] = dogs; // OK, but unsound: methods are checked bivariantly
animals.push({ name: "cat" }); // compiles, and `dogs` now holds a non-Dog
interface Handler { handle(x: Animal): void }
interface HandlerFn { handle: (x: Animal) => void }
declare let method: Handler;
declare let property: HandlerFn;
declare let dogMethod: { handle(x: Dog): void };
declare let dogProperty: { handle: (x: Dog) => void };
method = dogMethod; // OK: method syntax stays bivariant
property = dogProperty;
// Error TS2322: Type '{ handle: (x: Dog) => void; }' is not assignable to type 'HandlerFn'.
interface Box<in out T> { get(): T; set(v: T): void }
declare let dogBox: Box<Dog>;
declare let animalBox: Box<Animal>;
animalBox = dogBox;
// Error TS2322: Type 'Box<Dog>' is not assignable to type 'Box<Animal>'.
interface Wrong<out T> { get: () => T; set: (v: T) => void }
// Error TS2636: Type 'Wrong<sub-T>' is not assignable to type 'Wrong<super-T>' as implied by variance annotation.
```

## Pitfalls

- Believing `Dog[]` to `Animal[]` is checked soundly. Array methods are method syntax, so it is covariant and unsound for writes. `readonly Dog[]` to `readonly Animal[]` is the sound covariant case.
- Treating `strictFunctionTypes` as covering everything. `handle(x: Dog)` (method) remains bivariant; `handle: (x: Dog) => void` (property) does not. Choose the syntax deliberately.
- Annotating `out T` on a type that takes `T` in a method parameter and assuming it is checked. It passed on 7.0.2 and 6.0.3; only function-typed properties trip TS2636.
- Adding annotations only for speed. The 4.7 notes describe a type-checking speedup for complex or recursive types; ❓ the gain was not measured here, so add them for the checked contract first.

## Follow-ups

**Q:** Why is a callback parameter contravariant?
**A:** The callee supplies the argument, so the callback must accept at least everything the declared type could receive. A `(a: Animal) => void` accepts every `Dog`; a `(d: Dog) => void` does not accept every `Animal`.

**Q:** Which position is covariant in `(x: A) => B`?
**A:** `B` (return) is covariant, `A` (parameter) is contravariant. Nesting flips it: `Handler<T> = (cb: (x: T) => void) => void` is covariant in `T` (`Handler<Dog>` assigns to `Handler<Animal>`, checked).
