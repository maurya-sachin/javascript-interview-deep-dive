---
title: "How do mapped types work, including key remapping and `+` / `-` modifiers?"
status: draft
difficulty: hard
frequency: 5
core: true
tags: [mapped-types, key-remapping, modifiers, homomorphic, keyof]
related:
  - typescript/generics/keyof-typeof-indexed-access
  - typescript/type-level-programming/conditional-types
  - typescript/type-level-programming/template-literal-types
  - typescript/type-level-programming/utility-types
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html
  - https://github.com/microsoft/TypeScript/pull/21919
  - https://github.com/microsoft/TypeScript/pull/40336
tldr: >
  `{ [K in Keys]: V }` builds an object type with one property per member of the key union.
  With `keyof T` (or `K extends keyof T`) it is homomorphic and copies `readonly` / `?` from `T`.
  `-readonly` / `-?` remove, `+` adds. `as` (TS 4.1) renames keys, and mapping a key to `never`
  drops it.
---

## Answer

A mapped type iterates a union of keys and builds one property per member: `{ [K in "a" | "b"]: number }`. The key union is usually `keyof T`, and `T[K]` reads the original property type.

**Modifiers.** When the keys come from `keyof T` (or from a type parameter constrained to `keyof T`), the mapped type is *homomorphic*: it copies each property's `readonly` and `?` from `T`. You change that with `+` / `-` prefixes (PR 21919):

- `-readonly` removes readonly, `+readonly` (or plain `readonly`) adds it.
- `-?` makes a property required and, under `strictNullChecks`, also strips `undefined` that `?` had added; `?` / `+?` makes it optional.

This is how `Partial`, `Required` and `Readonly` are defined.

**Key remapping** (TS 4.1): `[K in keyof T as NewKey]: T[K]`. `NewKey` can be any type computed from `K`, typically a template literal (`get${Capitalize<K>}`). If it resolves to `never` for a key, that property is dropped, so `as Exclude<K, "kind">` filters without a helper `Omit`. Because `as` is a clause on a `keyof T` mapping, modifiers are still copied. `K` in the `as` clause ranges over the original keys, so `T[K]` stays valid.

**Behaviours to know:**

- Homomorphic mapped types **distribute over unions** and leave primitives unchanged; applied to arrays and tuples they map the elements and keep the array or tuple shape.
- You cannot declare extra properties next to the `[K in ...]` part (TS7061); intersect two types instead.
- Iterating `Exclude<keyof T, X>` directly (no `as`) is not homomorphic and **loses modifiers**.
- With `as`, the key set can be any union, not only `string | number | symbol`: you can map over a union of objects with `as E["kind"]`.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3, --strict
type Point = { readonly x: number; y?: string; z: boolean };

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type Concrete<T> = { [K in keyof T]-?: T[K] };
type A = Mutable<Point>; // { x: number; y?: string | undefined; z: boolean; }
type B = Concrete<Point>; // { readonly x: number; y: string; z: boolean; }

type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
type C = Getters<{ name: string; age: number }>; // { getName: () => string; getAge: () => number; }

type OmitAs<T, K> = { [P in keyof T as Exclude<P, K>]: T[P] };
type D = OmitAs<Point, "z">; // { readonly x: number; y?: string | undefined; }

type Loose<T, K extends keyof T> = { [P in Exclude<keyof T, K>]: T[P] };
type E = Loose<Point, "z">; // { x: number; y: string | undefined; }: modifiers lost

type F = Mutable<readonly string[]>; // string[]

type Bad = { [K in "a"]: K; extra: 1 };
// Error TS7061: A mapped type may not declare properties or methods.
```

## Pitfalls

- Writing the key union by hand (`[K in Exclude<keyof T, X>]`) and silently dropping `readonly` and `?`. Keep `keyof T` and filter with `as`, or use `Pick`, which is homomorphic.
- Expecting `-?` to keep `undefined`. On a homomorphic type it removes the `undefined` the optional added (`Required<{ a?: string }>` is `{ a: string }`).
- Using `` `get${K}` `` where `K` can be `symbol` or `number`. Template literal placeholders only accept `string | number | bigint | boolean | null | undefined` (checked: `` `x${symbol}` `` is TS2322), so write `string & K`, as the handbook does.
- Assuming mapped types are "deep". They touch only the first level; nested objects need recursion.

## Follow-ups

**Q:** What makes a mapped type homomorphic?
**A:** Its key source is `keyof T` for some `T`, or a type parameter constrained to `keyof T`. Then the compiler knows the keys originate from `T` and copies each property's modifiers.

**Q:** How do you rename keys and filter some out in one pass?
**A:** `as` with a conditional or `Exclude`: a key mapped to `never` is removed, any other result is the new key.

## Deep dive

### How it works

The mapped type `{ [K in C]: V }` is evaluated by iterating the constituents of `C` (after resolving `keyof T` for the instantiation) and creating a property whose name is each string, number or symbol literal. Non-literal members such as `string` become index signatures (checked: `[K in string | number | symbol]: 1` printed three index signatures). If `C` is `keyof T` for a type parameter, the type is homomorphic: for each key the declared `readonly` and optionality of `T`'s property are carried over, unless the mapping says `+` or `-`.

Because instantiation of a homomorphic type over a union distributes, `Plain<{ a: 1 } | { b: 2 }>` is a union of two mapped results (checked: it equals `{ a: 1 } | { b: 2 }`; diagnostics name a member `Plain<{ a: 1; }>`). Primitives map to themselves: `Plain<string>` printed `string`.

### Edge cases

- Arrays and tuples: `Plain<[a: 1, b?: 2]>` printed `[a: 1, b?: 2 | undefined]`, and `Mutable<readonly string[]>` printed `string[]`.
- Index signatures survive: `Plain<{ [k: string]: number; a: 1 }>` equals `{ [x: string]: number; a: 1 }`.
- `as never` for every key gives `{}`.
- Mapping over a union of objects with `as`: `{ [E in Ev as E["kind"]]: (e: E) => void }` with `Ev = { kind: "sq"; s: number } | { kind: "ci"; r: number }` printed `{ sq: (e: { kind: "sq"; s: number; }) => void; ci: (e: { kind: "ci"; r: number; }) => void; }` on 6.0.3; 7.0.2 lists `ci` first.
- `Omit` keeps modifiers (checked: `Omit<Point, "z">` equals `D`) even though it is defined with `Exclude<keyof T, K>`, because it goes through the homomorphic `Pick`.

### Real-world scenario

Deriving a handler interface from a state shape: `type Setters<S> = { [K in keyof S as `set${Capitalize<string & K>}`]: (v: S[K]) => void }`. Adding a field to `S` adds its setter automatically, and a typo in a call site is a compile error.

### Trade-offs

Mapped types remove repetition and keep derived types in sync with the source, but heavy nesting yields unreadable hover output and slower checking. Prefer the built-in utilities for the common cases, name each step of a complex mapping as its own alias, and avoid a deep mapped type when an explicit interface would be clearer.

## Exercises

### Make selected keys optional

Write `PartialBy<T, K>` so that `PartialBy<{ id: number; name: string }, "name">` has `id` required and `name` optional.

```ts
type PartialBy<T, K extends keyof T> = unknown;
```

**Answer:** `type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;`. Intersect the untouched keys with the optional ones. Checked: `{ id: 1 }` is accepted and `{ name: "a" }` is rejected for the missing `id`. The result is an intersection, which prints less tidily than a single object.
