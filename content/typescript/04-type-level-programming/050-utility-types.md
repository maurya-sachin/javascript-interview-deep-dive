---
title: "Which built-in utility types do you use, and how would you implement them?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [utility-types, partial, pick, omit, record, exclude, extract, nonnullable]
related:
  - typescript/type-level-programming/mapped-types
  - typescript/type-level-programming/conditional-types
  - typescript/type-level-programming/infer-keyword
  - typescript/generics/keyof-typeof-indexed-access
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/utility-types.html
  - https://raw.githubusercontent.com/microsoft/TypeScript-Website/v2/packages/documentation/copy/en/reference/Utility%20Types.md
  - https://raw.githubusercontent.com/microsoft/TypeScript/v6.0.3/src/lib/es5.d.ts
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-8.html
  - https://github.com/microsoft/TypeScript/pull/21919
tldr: >
  Utility types are aliases in `lib.es5.d.ts`. Object ones are homomorphic mapped types
  (`Partial`, `Required`, `Readonly`, `Pick`, `Record`); union ones are distributive
  conditionals (`Exclude`, `Extract`); `Omit` is `Pick` over `Exclude<keyof T, K>`;
  `NonNullable<T>` is `T & {}`; `ReturnType` and `Parameters` use `infer`.
---

## Answer

Utility types are ordinary generic aliases in `lib.es5.d.ts`, so each one is a mapped type, a conditional type, or `infer`:

```ts
type Partial<T>  = { [P in keyof T]?: T[P] };
type Required<T> = { [P in keyof T]-?: T[P] };
type Readonly<T> = { readonly [P in keyof T]: T[P] };
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type Record<K extends keyof any, T> = { [P in K]: T };
type Exclude<T, U> = T extends U ? never : T;
type Extract<T, U> = T extends U ? T : never;
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
type NonNullable<T> = T & {};
type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;
```

(From the TS 6.0.3 lib, identical in 7.0.2; `NonNullable` became `T & {}` in 4.8.)

What to say about them:

- **Homomorphic ones keep modifiers.** `Partial` and `Readonly` add `?` / `readonly`; `Required` removes `?` with `-?`. `Pick` keeps the picked properties' modifiers.
- **All are shallow.** `Partial<User>` leaves `address` as a full object; for nested use a recursive type.
- **`Exclude` / `Extract` filter unions** by distribution. `Omit` is not distributive.
- **`Omit`'s key type is `keyof any`**, so a typo such as `Omit<User, "nope">` compiles silently, while `Pick<User, "nope">` is an error.
- **`Record<string, T>`** is an index signature; `Record<"a" | "b", T>` is an object with exactly those keys.
- **`Awaited`, `InstanceType`, `ConstructorParameters`** follow the same `infer` pattern.

Use them to derive types from one source of truth: DTO variants, partial updates, component props minus a prop.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3, --strict
interface User { readonly id: number; name: string; email?: string; address: { city: string } }
type MyRequired<T> = { [K in keyof T]-?: T[K] };
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
type MyExclude<T, U> = T extends U ? never : T;
type MyOmit<T, K extends keyof any> = MyPick<T, MyExclude<keyof T, K>>;

type A = MyRequired<User>; // { readonly id: number; name: string; email: string; address: { city: string; }; }
type B = MyPick<User, "id" | "name">; // { readonly id: number; name: string; }
type C = MyOmit<User, "id" | "address">; // { name: string; email?: string | undefined; }
type D = MyExclude<"a" | "b" | "c", "a">; // "b" | "c"
type E = NonNullable<string | null | undefined>; // string

type Typo = Omit<User, "nope">; // compiles: the key is not checked
type Bad = Pick<User, "nope">;
// Error TS2344: Type '"nope"' does not satisfy the constraint 'keyof User'.

type Shape = { kind: "a"; a: 1 } | { kind: "b"; b: 2 };
type Lost = Omit<Shape, "kind">; // {}
type DistOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;

declare const frozen: Readonly<{ a: { b: number } }>;
frozen.a.b = 2; // compiles: Readonly is shallow
frozen.a = { b: 1 };
// Error TS2540: Cannot assign to 'a' because it is a read-only property.
```

## Pitfalls

- Using `Omit` or `Pick` on a union. They collapse it: `Omit<Shape, "kind">` is `{}` and `Pick<Shape, "kind">` is `{ kind: "a" | "b" }`. Distribute with a helper like `DistOmit` above.
- Treating `Partial` / `Readonly` as deep. They only touch top-level properties.
- Trusting `Omit`'s key argument for typo safety. It accepts any key; wrap it in a stricter alias with `K extends keyof T` if you want the check.
- Assuming `Record<string, T>` indexing is safe. `Record<string, number>["anything"]` is `number` (without `noUncheckedIndexedAccess`), not `number | undefined`.

## Follow-ups

**Q:** Why is `NonNullable<T>` now `T & {}`?
**A:** Intersections can be simplified and assigned to, unlike conditional types (TS 4.8 notes). `NonNullable<NonNullable<T>>` simplifies, and narrowing a `T` by `!= null` yields `T & {}`, which is `NonNullable<T>`.

**Q:** What does `Required` do to `undefined`?
**A:** `-?` on a homomorphic type also removes the `undefined` that `?` had added (PR 21919), so `Required<{ a?: string }>` is `{ a: string }`.

**Q:** What do `ReturnType` and `Parameters` see on an overloaded function?
**A:** Only the last signature, since `infer` matches that one (handbook, Conditional Types).

## Deep dive

### How it works

The mapped-type utilities depend on being **homomorphic**: the key source is `keyof T` or `K extends keyof T`, so the compiler copies each property's `readonly` and `?` unless a `+` / `-` says otherwise. That is why `MyPick<User, "id" | "name">` kept `readonly` on `id`, and why `Omit` (built on `Pick`) also keeps modifiers.

`Exclude` and `Extract` are distributive conditionals, so a union input is filtered member by member. `Exclude<boolean, true>` is `false` because `boolean` is `true | false`. They are also the base of key-level filtering: `Omit` first computes `Exclude<keyof T, K>` and then picks.

### Edge cases

- `Partial<User>["address"]` is `{ city: string } | undefined`: the optional adds `undefined`.
- `Record<"a" | "b", number>` is `{ a: number; b: number }`; `Record<string, number>` is `{ [x: string]: number }`.
- `NonNullable<unknown>` printed `{}`.
- `Pick<Shape, "kind">` on the union is `{ kind: "a" | "b" }` (checked by type equality; diagnostics print the alias).
- `Parameters<(a: string, ...r: number[]) => void>` keeps labels and the rest element as a tuple.

### Real-world scenario

A form draft holds partially filled input, then submits the full entity: `type Draft = Partial<Omit<User, "id">>` for the editing state, and `Required<Pick<User, "name" | "email">>` for the fields the submit handler must have. The compiler rejects a submit that omits `email`.

### Trade-offs

Derived types stay in sync with their source but compound quickly (`Partial<Omit<Pick<...>>>`); hover output becomes unreadable and errors point at the alias chain. Prefer one or two layers. When a variant becomes a domain concept in its own right (`CreateUserInput`), give it a name or write it out as an interface.

## Exercises

### Implement `Readonly` deeply

Write `DeepReadonly<T>` so nested object properties are readonly too.

```ts
type DeepReadonly<T> = unknown;
```

**Answer:** `type DeepReadonly<T> = { readonly [K in keyof T]: DeepReadonly<T[K]> };`. Recursion is allowed because property types are resolved lazily. Checked: it makes arrays `readonly number[]` (no `push`), but a function property becomes `DeepReadonly<() => void>` and is no longer callable (TS2349), so functions need an extra branch (see the recursive types question).
