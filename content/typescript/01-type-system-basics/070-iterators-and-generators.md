---
title: "How do you type iterators and generators in TypeScript?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [iterators, generators, iterable, async-iterators, iterator-helpers, strictbuiltiniteratorreturn]
related:
  - typescript/type-system-basics/function-types-overloads
  - typescript/inference-and-narrowing/discriminated-unions
  - typescript/tsconfig-and-strictness/strict-mode-flags
  - typescript/tsconfig-and-strictness/target-lib-module
verified: 2026-10
perishable:
  - "TS 6.0 deprecates, TS 7.0 removes target ES5 and downlevelIteration"
  - "Iterator helpers typed only with lib es2025 or later"
sources:
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-6.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-6.html
  - https://www.typescriptlang.org/tsconfig/#strictBuiltinIteratorReturn
  - https://www.typescriptlang.org/docs/handbook/iterators-and-generators.html
  - https://github.com/tc39/proposals/blob/main/finished-proposals.md
tldr: >
  `Iterable<T>` is what `for...of` and spread accept; `Iterator<T, TReturn, TNext>` is the `next()`
  protocol, returning a union narrowed by `done`. A generator returns `Generator<T, TReturn, TNext>`:
  yielded type, return type, and what `next(x)` sends into `yield`. Built-in iterators are
  `IteratorObject` subtypes; under `--strict` their return value is `undefined`.
---

## Answer

The lib files (`es2015.iterable`, `es2015.generator`, `es2018.asyncgenerator`) define a small ladder of types:

- **`Iterable<T>`**: has `[Symbol.iterator]()`. It is what `for...of`, spread, destructuring and `Array.from` accept, so use it for parameters.
- **`Iterator<T, TReturn, TNext>`**: the `next()` protocol. `next` returns `IteratorResult<T, TReturn>`, a discriminated union: `{ done?: false; value: T } | { done: true; value: TReturn }`. Check `done` before trusting `value`.
- **`IteratorObject<T, TReturn, TNext>`** (TS 5.6): an iterator that is also iterable and models the built-in iterator prototype. With `lib` es2025 it carries the iterator helpers (`map`, `filter`, `take`, `toArray`). Built-ins return subtypes such as `ArrayIterator`, `SetIterator` and `MapIterator`.
- **`Generator<T, TReturn, TNext>`**: what a `function*` returns. `T` is each `yield`ed value, `TReturn` the `return` value, and `TNext` the argument of `next(x)`, which is also the value of the `yield` expression. Async versions: `AsyncIterable`, `AsyncIterator`, `AsyncGenerator`, consumed by `for await`.

Unannotated generators are inferred. `function* g() { yield 1; return "done"; }` is `Generator<number, string, unknown>`; `TNext` comes from how `yield` results are used (`const x: string = yield` gives `string`), else `unknown`.

Choose the annotation by what callers may do: `Generator<…>` when they drive it with `next`, `Iterable<T>` when they should only iterate. `Iterator<T>` alone cannot be used in `for...of` (TS2488).

Two strict checks catch real bugs, identically on 6.0.3 and 7.0.2. `for...of`, spread and destructuring call `next()` with no argument, so iterating a generator whose `TNext` excludes `undefined` is an error (TS2763, TS2764, TS2765). And `strictBuiltinIteratorReturn` (part of `--strict` since 5.6) sets the intrinsic `BuiltinIteratorReturn` to `undefined` instead of `any`, so `set.values().next().value` is `T | undefined`.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3, --strict --target es2022 --lib esnext; run on Node 24.19
function* tokens(): Generator<string, number, boolean> {
  let count = 0;
  while (yield `token ${count}`) count++; // yield evaluates to TNext (boolean)
  return count;                           // TReturn (number)
}

const it = tokens();
console.log(it.next());      // → { value: 'token 0', done: false }
console.log(it.next(true));  // → { value: 'token 1', done: false }
const end = it.next(false);
if (end.done) console.log(end.value.toFixed(1)); // narrowed: value is number
// → 1.0
it.next("yes");
// Error TS2345: Argument of type '["yes"]' is not assignable to parameter of type '[] | [boolean]'.

for (const t of tokens()) console.log(t);
// Error TS2763: ...'next' method of its iterator expects type 'boolean', but for-of will always send 'undefined'.
// Emitted anyway, the loop stops after one step because yield received undefined:
// → token 0

const first = new Set(["a"]).values().next().value;
first.toUpperCase();
// Error TS18048: 'first' is possibly 'undefined'.
```

## Pitfalls

- Reading `.value` without checking `done`. The union includes `TReturn`; for built-in iterators under `--strict` that is `undefined`, so the value is `T | undefined`.
- Annotating `Iterator<T>` when you meant something iterable. `for...of` over it fails with TS2488 ("must have a '[Symbol.iterator]()' method"); use `Iterable<T>` or `IterableIterator<T>`.
- Expecting helpers on a hand-written iterator. They live on `IteratorObject`, so a plain `{ next }` object typed `Iterator<number>` has no `.map` (TS2339); wrap it with `Iterator.from(...)`. Generators have them, but only with `lib` es2025 or later.
- Giving `TNext` a type without `undefined` and then spreading or destructuring the generator: TS2764 / TS2765.

## Follow-ups

**Q:** How does `yield*` type?
**A:** The delegate's yielded type joins the outer `T`, and the `yield*` expression evaluates to the delegate's `TReturn`. `function* g3() { const r = yield* g1(); return r; }` with `g1` returning `"done"` inferred `Generator<number, string, unknown>` on both versions.

**Q:** What do you get from an `async function*`?
**A:** `AsyncGenerator<T, TReturn, TNext>`, whose `next()` returns `Promise<IteratorResult<…>>`. `async function* ag() { yield 1; }` inferred `AsyncGenerator<number, void, unknown>`. The `TNext` rule applies to `for await` too: a `string` `TNext` gave TS2763.

**Q:** Do you still need `downlevelIteration`?
**A:** No. It only mattered when emitting ES5. TypeScript 6.0.3 reports `target=ES5` and `downlevelIteration` as deprecated (TS5107, TS5101); 7.0.2 rejects both as removed (TS5108, TS5102).

**Q:** How do you make a class iterable?
**A:** Give it a generator method: `*[Symbol.iterator]() { for (let i = this.lo; i < this.hi; i++) yield i; }`, optionally with `implements Iterable<number>`. Spread and `for...of` then infer `number` elements.

## Exercises

### What is the inferred return type?

```ts
export function* handshake() {
  const n: number = yield "ready";
  return n > 0;
}
const [greeting] = handshake();
```

**Answer:** `Generator<string, boolean, number>`: `string` from the `yield` operand, `boolean` from `return`, `number` from the annotated `yield` result. The destructuring line is TS2765 on 6.0.3 and 7.0.2, because destructuring calls `next()` without an argument while `TNext` is `number`.

### Why doesn't this compile?

```ts
const handRolled: Iterator<number> = { next: () => ({ value: 1, done: false }) };
handRolled.map((n) => n * 2);
```

**Answer:** TS2339: `map` does not exist on `Iterator<number, any, any>`. Helpers are declared on `IteratorObject`, the type of real built-in iterators. `Iterator.from(handRolled).map((n) => n * 2)` type-checks with `lib` es2025, and Node 24 runs it.
