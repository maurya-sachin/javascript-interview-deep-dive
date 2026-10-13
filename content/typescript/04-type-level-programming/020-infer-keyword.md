---
title: "What does `infer` do? Implement `ReturnType` and `Awaited`."
status: draft
difficulty: hard
frequency: 5
core: true
tags: [infer, conditional-types, returntype, awaited, pattern-matching]
related:
  - typescript/type-level-programming/conditional-types
  - typescript/generics/generic-inference
  - typescript/generics/variance
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-8.html
  - https://github.com/microsoft/TypeScript/pull/48112
  - https://github.com/microsoft/TypeScript/pull/40002
tldr: >
  `infer X` declares a type variable inside the `extends` clause of a conditional type; the
  compiler fills it by pattern-matching the checked type, and `X` is usable in the true
  branch. `ReturnType` infers from a function's return slot; `Awaited` recurses on
  `PromiseLike<infer U>`. `infer X extends C` (4.7) adds a constraint.
---

## Answer

`infer` introduces a type variable in the `extends` clause of a conditional type. The compiler solves it by matching the checked type against the pattern, the same way it infers type arguments at a call; if the match fails, you get the false branch. The variable is in scope only in the true branch, and `infer` is a syntax error anywhere else (TS1338).

```ts
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;
type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;   // simplified
```

`ReturnType` matches "a function returning something" and names that something `R`. The lib version of `Awaited` (TS 4.5) is more careful: it only unwraps object types with a callable `then`, and special-cases `null | undefined`, mirroring what `await` does at runtime.

**Rules worth knowing:**

- **Positions work anywhere a type can be matched:** return slot, parameter list (`infer P` yields a tuple), tuple head/tail (`[infer H, ...infer T]`), array element, object property, template literal segments.
- **Several candidates.** Same `infer U` in covariant positions (properties, returns) gives a *union*; in contravariant positions (function parameters) gives an *intersection*.
- **Overloads.** Inference uses the *last* signature. Generic signatures are inferred with their parameters as `unknown`.
- **`infer X extends C`** (TS 4.7) constrains the inferred variable and falls to the false branch if it does not fit, replacing a nested conditional. From 4.8, in template literals it also parses literals: `"42"` infers `42`.
- **Distribution** still applies to a naked checked type, so `infer` over a union maps member by member.

## Example

```ts
// TypeScript 7.0.2 and 5.9.3, --strict
type MyReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : never;
type MyAwaited<T> = T extends PromiseLike<infer U> ? MyAwaited<U> : T;

declare function f(a: string, b?: number): Promise<boolean>;
type A = MyReturnType<typeof f>; // Promise<boolean>
type B = MyAwaited<A>; // boolean
type C = MyAwaited<string | Promise<number>>; // string | number
declare function over(x: string): number;
declare function over(x: number): string;
type D = MyReturnType<typeof over>; // string: the last overload

type Both<T> = T extends { a: infer U; b: infer U } ? U : never;
type E = Both<{ a: string; b: number }>; // string | number
type Args<T> = T extends { a: (x: infer U) => void; b: (x: infer U) => void } ? U : never;
type F = Args<{ a: (x: { p: 1 }) => void; b: (x: { q: 2 }) => void }>; // { p: 1 } & { q: 2 }

type FirstStr<T> = T extends [infer S extends string, ...unknown[]] ? S : never;
type G = FirstStr<["a", 1]>; // "a"
type H = FirstStr<[1, "a"]>; // never
type ToNum<S> = S extends `${infer N extends number}` ? N : never;
type I = ToNum<"42">; // 42
type Elem<T> = T extends (infer E)[] ? E : never;
type J = Elem<readonly string[]>; // never: a readonly array is not a mutable array
type K = MyReturnType<string>;
// Error TS2344: Type 'string' does not satisfy the constraint '(...args: any) => any'.
```

## Pitfalls

- Reading `infer` as a runtime operation. It only works as pattern matching inside a conditional type; if the pattern does not match, nothing is inferred and you get the false branch.
- Matching `T[]` and expecting readonly arrays or tuples to fit. `Elem<readonly string[]>` is `never`; write `readonly (infer E)[]` to accept both (checked: gives `string` for a readonly array and the element union for a tuple).
- Relying on `ReturnType` for overloaded functions. Only the last signature is seen, and a generic function's type parameters come out as `unknown`.
- Hand-rolling `Awaited` with `PromiseLike<infer U>` and assuming equivalence: for a thenable like `{ then(cb: (v: number) => void): void }`, the simple version returns the object unchanged while the lib `Awaited` gives `number` (checked on 5.9.3).

## Follow-ups

**Q:** Why does the constraint on `ReturnType` use `(...args: any) => any` and not `unknown`?
**A:** Parameters are contravariant: `(x: string) => void` is not assignable to `(...args: unknown[]) => unknown` (checked) but is to the `any` and `never[]` forms. The handbook version uses `never[]`.

**Q:** What did `infer X extends C` replace?
**A:** A nested conditional (`T extends [infer U] ? U extends C ? ... : never : never`), per PR 48112, which also noted the helper-alias workaround breaks when the same variable is inferred in two places.

## Deep dive

### How it works

Each `infer X` creates a fresh type parameter scoped to the conditional. When the conditional is instantiated, the checker infers from the check type to the extends type, as for a call's type arguments, collecting candidates for every `infer` variable. Covariant candidates are combined into a union and contravariant ones into an intersection, which is why `F` above is an intersection and `E` a union. Then it checks assignability of the check type to the extends type with the inferred values substituted; only then is the true branch taken.

Without `extends C`, the compiler may derive an implicit constraint from where the variable sits; PR 48112 says an explicit `extends` overrides it.

### Edge cases

- `MyReturnType<typeof gen>` for `function gen<T>(x: T): T` printed `unknown` (checked).
- `Pa<(a: string, ...r: number[]) => void>` infers `[a: string, ...r: number[]]`, keeping labels and rest elements.
- `Parameters<(...a: string[]) => void>` is `string[]`; the simple `Awaited` can be wrapped as `Promise<Awaited<ReturnType<F>>>` and still compiles (checked, with `Retry<typeof g>` printing `(a: string) => Promise<number>`).
- Reusing one `infer` name in a pattern is legal; it is how `Both` collects two candidates.

### Real-world scenario

Typing a wrapper that must not lose the wrapped function's signature: `function retry<F extends (...a: any) => Promise<any>>(fn: F): (...a: Parameters<F>) => Promise<Awaited<ReturnType<F>>>`. Both utilities are `infer` underneath; the wrapper's public type tracks the original without the author restating it.

### Trade-offs

`infer` pattern-matching is declarative and short, but errors show only the resolved `never` with no hint why the pattern failed. Debug by inferring one piece at a time into a named alias. Prefer a plain indexed access (`T["message"]`, `T[number]`) when the position is known and constrained; use `infer` when you need to match structure that cannot be indexed (return types, parameters, template segments).

## Exercises

### Last element of a tuple

Write `Last<T>` so `Last<[1, 2, 3]>` is `3` and `Last<[]>` is `never`.

```ts
type Last<T extends unknown[]> = unknown;
```

**Answer:** `type Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never;`. A leading rest followed by `infer L` matches the final element, and an empty tuple does not match. Checked: this form and `[...infer _, infer L]` both gave `3` for `[1, 2, 3]`, and `never` for `[]`.
