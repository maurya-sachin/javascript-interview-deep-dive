---
title: "How do variadic tuple types work, and how do you do arithmetic with tuples at the type level?"
status: draft
difficulty: hard
frequency: 3
core: false
tags: [tuples, variadic-tuples, rest-elements, type-level-arithmetic, infer, readonly]
related:
  - typescript/type-level-programming/recursive-types
  - typescript/type-level-programming/infer-keyword
  - typescript/type-level-programming/conditional-types
  - typescript/type-system-basics/function-types-overloads
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#labeled-tuple-elements
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-2.html#leadingmiddle-rest-elements-in-tuple-types
  - https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types
  - https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-tuple-types
tldr: >
  Since TS 4.0 a tuple can spread a generic, `[...T, ...U]`, so `concat` and partial
  application keep each position's type. A tuple may hold one rest element anywhere
  (4.2). Because a tuple's `"length"` is a numeric literal, you can build a tuple of length N and
  read lengths back to add, subtract and compare small non-negative integers.
---

## Answer

**Variadic tuples (TS 4.0).** In tuple syntax a spread can name a type parameter: `[...T, ...U]` with `T extends readonly unknown[]`. When `T` is instantiated with a tuple, the spread flattens (`[...[1, 2], ...[3]]` is `[1, 2, 3]`); with an array it becomes a rest element (`[...T]` for `number[]` is `number[]`). Function signatures can therefore describe tuple transformations without overload ladders: `concat`, `tail`, `partial(f, ...head)`, `pipe`, `Promise.all`-style mappers.

**Inference.** In the other direction, `(...args: [...H, ...R]) => Out` lets the checker split a parameter list: it infers `H` from the arguments you supplied and gives `R` the remaining parameters, keeping their labels. Writing a parameter as `[...T]` instead of `T` also hints that an array literal should be inferred as a tuple: `[1, "a"]` gives `[number, string]` rather than `(string | number)[]`.

**Rest anywhere (TS 4.2).** `[...string[], number]` and `[boolean, ...string[], boolean]` are legal, with one rest element per tuple and no optional element after it (TS1265, TS1266).

**Arithmetic.** A tuple's `"length"` is a numeric literal type, so tuples act as unary numbers. Build a tuple of length N recursively, then:

- add: `[...Tuple<A>, ...Tuple<B>]["length"]`
- subtract: `Tuple<A> extends [...Tuple<B>, ...infer Rest] ? Rest["length"] : never`
- compare: `A` is at least `B` exactly when the subtraction matches.

This only works for small non-negative integers. The builder is a recursive conditional type, so it hits the instantiation-depth limit described in the recursive-types question, and negative or fractional inputs never reach their target length (TS2589). It is a puzzle-and-library technique (fixed-length vectors, typed `range`), not something to put on a hot path in application code.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3, --strict; run on Node 24.19
// 1. Generic spreads keep every element's position and type
function concat<T extends readonly unknown[], U extends readonly unknown[]>(
  a: T, b: U,
): [...T, ...U] {
  return [...a, ...b];
}
const both = concat([1, 2] as const, ["x"] as const); // [1, 2, "x"]
console.log(both); // → [ 1, 2, 'x' ]

// 2. Inference splits a parameter list: bind the head now, the tail later
function partial<H extends unknown[], R extends unknown[], Out>(
  f: (...args: [...H, ...R]) => Out, ...head: H
) {
  return (...rest: R) => f(...head, ...rest);
}
const greet = (greeting: string, name: string, end: "!" | "?") => `${greeting}, ${name}${end}`;
const hello = partial(greet, "Hello"); // (name: string, end: "!" | "?") => string
console.log(hello("Ada", "!"));        // → Hello, Ada!
hello("Ada");
// Error TS2554: Expected 2 arguments, but got 1.

// 3. Arithmetic: a number becomes a tuple of that length, and back via ["length"]
type Tuple<N extends number, Acc extends unknown[] = []> =
  Acc["length"] extends N ? Acc : Tuple<N, [...Acc, unknown]>;
type Add<A extends number, B extends number> = [...Tuple<A>, ...Tuple<B>]["length"];
type Sub<A extends number, B extends number> =
  Tuple<A> extends [...Tuple<B>, ...infer Rest] ? Rest["length"] : never;
type Checks = [Add<7, 5>, Sub<7, 5>, Sub<5, 7>]; // [12, 2, never]
```

## Pitfalls

- Constraining to `unknown[]` and passing an `as const` tuple. A readonly tuple is not assignable to a mutable one: 7.0.2 reports TS4104 ("The type 'readonly [1, 2]' is 'readonly' and cannot be assigned to the mutable type 'unknown[]'"), 6.0.3 reports TS2345 with that line as elaboration. Constrain to `readonly unknown[]`.
- Spreading an unconstrained type parameter. `type G<T> = [...T]` is TS2574, "A rest element type must be an array type".
- Forgetting the `[...T]` hint. `<T extends unknown[]>(a: T)` called with `[1, "a"]` infers `(string | number)[]`, losing positions.
- Feeding arithmetic a non-literal. `Add<number, 3>` is `3`, because `Tuple<number>` stops at `[]` (`0 extends number`).

## Follow-ups

**Q:** How do you get the last element of a tuple?
**A:** Use a leading rest in the pattern: `type Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never`. `Last<[1, 2, 3]>` is `3` on both versions. A leading rest in a non-generic tuple needs TS 4.2 or later.

**Q:** What happens to labels when tuples are spread?
**A:** They are kept, so they reappear as parameter names: `[id: number, ...rest: [name: string, ok?: boolean]]` flattens to `[id: number, name: string, ok?: boolean | undefined]`, and `partial` above returns `(name: string, end: "!" | "?") => string`.

**Q:** What does spreading an array in the middle give?
**A:** An open tuple with fixed ends: `[...[1, 2], ...string[], ...[3]]` is `[1, 2, ...string[], 3]`. Only one rest may remain, so `[...string[], ...number[]]` is TS1265.

## Exercises

### Predict the types

```ts
type Tuple<N extends number, Acc extends unknown[] = []> =
  Acc["length"] extends N ? Acc : Tuple<N, [...Acc, unknown]>;
type Add<A extends number, B extends number> = [...Tuple<A>, ...Tuple<B>]["length"];
type X = Add<number, 3>;
type Y = Add<-1, 1>;
```

**Answer:** `X` is `3`: `Tuple<number>` returns `[]` at once because `0 extends number`. `Y` is TS2589 ("Type instantiation is excessively deep and possibly infinite") on 6.0.3 and 7.0.2, because no tuple has length `-1`, so the recursion never stops.

### Type `tail`

```ts
function tail<T extends readonly unknown[]>(arr: readonly [unknown, ...T]): T {
  const [, ...rest] = arr; // rest: [...T]
  return rest;
}
const t = tail([1, "a", true] as const);
console.log(t);
```

**Answer:** It logs `[ 'a', true ]`, and `t` is `["a", true]`, not readonly: `readonly` belongs to the parameter's outer tuple, while `T` is inferred from the elements after the first. No cast is needed, because rest destructuring of that parameter is typed `[...T]` (6.0.3 and 7.0.2).
