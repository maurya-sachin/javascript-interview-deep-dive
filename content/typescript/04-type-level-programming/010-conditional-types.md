---
title: "How do conditional types work, and what is distribution?"
status: draft
difficulty: hard
frequency: 5
core: true
tags: [conditional-types, distribution, infer, never, generics]
related:
  - typescript/generics/generics-and-constraints
  - typescript/type-system-basics/any-unknown-never
  - typescript/type-level-programming/infer-keyword
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
  - https://github.com/microsoft/TypeScript/pull/21316
  - https://raw.githubusercontent.com/microsoft/TypeScript-Website/v2/packages/documentation/copy/en/reference/Utility%20Types.md
tldr: >
  `T extends U ? X : Y` picks `X` when `T` is assignable to `U`, else `Y`, and stays deferred
  while type variables remain. When the checked type is a naked type parameter it distributes
  over unions and `never` gives `never`. `[T] extends [U]` compares the union whole.
---

## Answer

`T extends U ? X : Y` is a type-level `if`: it resolves to `X` when `T` is assignable to `U`, otherwise `Y`. While `T` or `U` still contains an unresolved type parameter the conditional is **deferred**: it stays as written until the alias is instantiated. That is why a function returning `T extends string ? "s" : "n"` cannot return a plain `"s"` from its body: the compiler cannot know which branch applies.

**Distribution.** If the checked type is a *naked type parameter* (just `T`, not `T[]`, `keyof T` or `[T]`), the conditional is distributive. Instantiated with a union, it is applied to each member and the results are unioned:

- `IsString<string | number>` is `boolean`, because it is `true | false`.
- `never` is the empty union, so a distributive conditional over `never` yields `never`, not either branch.
- `any` evaluates to the union of both branches.

Distribution is usually what you want: `Exclude<T, U>` and `Extract<T, U>` rely on it to filter unions.

**Turning it off.** Wrap both sides in a tuple: `[T] extends [U]`. The union is now compared as one type. This is also the reliable way to detect `never` (`[T] extends [never]`).

**Constraints in the true branch.** Inside `X`, `T` is treated as also being `U`, and `infer` can name parts of the matched type (see the `infer` question).

Distribution depends only on the *written form* of the check type. It happens at instantiation, so a non-generic `string | number extends string ? 1 : 2` is just `2`, and the same check through a naked `T` gives a union.

Interview-level summary: conditional types are lazy, distribute over naked type parameters, collapse on `never`, and are opted out with `[T] extends [U]`.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3, --strict
type IsString<T> = T extends string ? true : false;
type A = IsString<"a">; // true
type B = IsString<string | number>; // boolean
type C = IsString<never>; // never
type D = IsString<any>; // boolean

type Whole<T> = [T] extends [string] ? true : false;
type E = Whole<string | number>; // false
type F = Whole<never>; // true

type ToArray<T> = T extends unknown ? T[] : never;
type NoDist<T> = [T] extends [unknown] ? T[] : never;
type G = ToArray<string | number>; // string[] | number[]
type H = NoDist<string | number>; // (string | number)[]

type Literal = string | number extends string ? 1 : 2; // 2: not generic, no distribution

function label<T extends string | number>(x: T): T extends string ? "s" : "n" {
  return typeof x === "string" ? "s" : "n";
}
// Error TS2322: Type '"s"' is not assignable to type 'T extends string ? "s" : "n"'.
// Error TS2322: Type '"n"' is not assignable to type 'T extends string ? "s" : "n"'.
```

## Pitfalls

- Expecting `IsX<never>` to return `false`. A distributive conditional over `never` is `never`. Use `[T] extends [never]` to test for it.
- Writing `T[] extends U[]` or `keyof T extends ...` and expecting distribution. Only a bare `T` distributes.
- Returning a literal from a function whose return type is a deferred conditional. Use an overload, or a single assertion at the boundary, and keep the conditional in the public signature.
- Using `[T] extends [U]` to "fix" a union and then being surprised that `Whole<never>` is `true`: `never` is assignable to everything.

## Follow-ups

**Q:** How do you detect `any`?
**A:** `0 extends 1 & T ? true : false`. `1 & any` is `any`, which accepts `0`; for any other `T` the intersection is `1`, a narrower `1 & …` or `never`, none of which accepts `0`. Checked on 6.0.3 and 7.0.2 with `any`, `unknown`, `string` and `never`.

**Q:** Does `Exclude<boolean, true>` work?
**A:** Yes. `boolean` is `true | false`, so it distributes and leaves `false`.

## Deep dive

### How it works

Introduced in TypeScript 2.8 (PR 21316). At instantiation the checker substitutes the type arguments, and if the check type is a naked type parameter that became a union, it maps over the members, evaluates each, and unions the results. If, after substitution, either side still contains a type variable, the result is a deferred conditional type object that is re-evaluated when more is known. A plain literal is not assignable to a still-deferred conditional, which produced the two TS2322 errors above.

In the true branch of a distributive conditional, references to `T` are the individual member and carry the additional constraint `U`, so `T extends string ? Uppercase<T> : never` type-checks without a cast.

### Edge cases

- `never`: zero members, zero results. Checked on both versions: `IsString<never>` is `never`, while `Whole<never>` and `IsNever<never>` are `true`.
- `any` as the check type produces both branches (`IsString<any>` printed `boolean`).
- `boolean` is `true | false`, so `IsString<boolean>` is `false` per member.
- `keyof T extends "a" | "b" ? 1 : 2` is not distributive: with `{ a: 1 }` it gives `1`, with `{ a: 1; c: 2 }` it gives `2` (checked on 6.0.3 and 7.0.2).
- A union inside an object, function return, or tuple position is not distributed by an outer alias; the conditional there distributes when its own check type is a naked parameter at instantiation, e.g. `Obj<string | number>` printed `{ v: 1 | 2 }` on 7.0.2 and `{ v: 2 | 1 }` on 6.0.3.
- To force distribution without a conditional you otherwise need, the idiom `T extends T ? ... : never` works (checked: `Dist<1 | 2>` gave `[1] | [2]`, printed in either order).

### Trade-offs

Conditional return types make call sites precise but make implementations unprovable: you need overloads, a cast, or a runtime check plus assertion. Prefer overloads when there are two or three input shapes; use a conditional when the mapping is open-ended or computed from the input type. Deeply nested conditionals are hard to read and slow to check, so split them into named aliases.

## Exercises

### Detect a union

Write `IsUnion<T>` so that `IsUnion<1 | 2>` is `true` and `IsUnion<1>` is `false`.

```ts
type IsUnion<T> = unknown;
```

**Answer:** `type IsUnion<T, U = T> = T extends unknown ? ([U] extends [T] ? false : true) : never;`. It distributes over `T`; for a single member `[U] extends [T]` holds, for a union the whole union (`U`) is not assignable to one member. Checked: `IsUnion<boolean>` is `true` too, since `boolean` is `true | false`.
