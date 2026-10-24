---
title: "How do function types, overloads, and the `void` return type work?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [functions, overloads, call-signatures, void, this-parameter, bivariance, generators]
related:
  - typescript/type-system-basics/structural-typing
  - typescript/type-system-basics/any-unknown-never
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/2/functions.html
  - https://www.typescriptlang.org/docs/handbook/type-compatibility.html#comparing-two-functions
  - https://www.typescriptlang.org/tsconfig/#strictFunctionTypes
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-6.html
tldr: >
  A function type `(a: A) => R` describes any callable; a call signature adds properties.
  Overloads give several call shapes over one hidden implementation signature; prefer a union
  parameter when you can. A `void` return type in a function type means "result ignored", so any
  function fits, but a `: void` declaration can't return a value.
---

## Answer

**Function types.** A function type expression, `(a: string) => number`, describes any function with that signature; the parameter name is required (`(string) => void` is a parameter *named* `string` of type `any`, which `noImplicitAny` rejects with TS7051). When a function also has properties, use a **call signature** in an object type: `{ description: string; (n: number): boolean }`, with `:` before the return type. A `new` in front makes a construct signature.

**Overloads.** Write two or more signatures, then one implementation compatible with all of them. Callers only see the overload signatures, not the implementation signature. TypeScript picks the first overload that matches, so put specific signatures before general ones (a general `unknown` overload listed first makes `g("a")` return the general type, checked on 7.0.2). The handbook says to prefer a union-typed parameter when the same return type works for all cases: overloads can't accept a union argument that no single overload covers.

**`this` parameter.** A fake first parameter, `function f(this: User)`, types `this` and is erased at compile time. It must be a `function`, not an arrow.

**`void`.** Two rules. A function *declaration* with return type `void` can't return a value. But a function *type* with a `void` return is satisfied by functions returning anything; the result is ignored. That is why `arr.forEach((n) => out.push(n))` compiles.

**Parameter bivariance.** Under `strictFunctionTypes` (in `strict`), parameters of function-typed properties are checked contravariantly, but **method-syntax** members are still compared bivariantly, because many JavaScript and DOM hierarchies rely on it. That is a deliberate unsoundness. Also, a function with fewer parameters is assignable to a type with more.

**Iterators and generators.** `Generator<T, TReturn, TNext>` types what a generator yields, returns, and what `next()` accepts; `Iterable<T>` is what `for...of` consumes.

## Example

```ts
// TypeScript 7.0.2, --strict
function len(x: string): number;
function len(x: unknown[]): number;
function len(x: string | unknown[]) { return x.length; } // implementation: not callable
declare const either: string | unknown[];
len(either);
// Error TS2769: No overload matches this call.
//   The last overload gave the following error.
//     Argument of type 'string | unknown[]' is not assignable to parameter of type 'unknown[]'.
//       Type 'string' is not assignable to type 'unknown[]'.
// (TS 6.0 lists the error for each overload instead.)
const len2 = (x: string | unknown[]) => x.length; // a union parameter accepts both

type VoidFn = () => void;
const f1: VoidFn = () => true; // OK: the return value is ignored
function f2(): void { return true; }
// Error TS2322: Type 'boolean' is not assignable to type 'void'.

function who(this: { name: string }) { return this.name; }
who();
// Error TS2684: The 'this' context of type 'void' is not assignable to method's 'this' of type '{ name: string; }'.
who.call({ name: "Ada" }); // OK
```

## Pitfalls

- Adding overloads where a union would do. `len(either)` above fails because no single overload accepts the union.
- Expecting the implementation signature to be callable. It's hidden, and an overload not compatible with it is `TS2394: This overload signature is not compatible with its implementation signature.`
- Treating a `: void` callback type as "returns nothing." It only means the caller won't use the result; `const r: void = f1()` is allowed, but the value is still returned at runtime.
- Declaring a callback parameter optional (`index?: number`) when you always pass it. The handbook says to write an optional parameter in a callback type only if you intend to call it without the argument.

## Follow-ups

**Q:** Why does `strictFunctionTypes` not flag method parameters?
**A:** The TSConfig reference cites the many inherently unsafe class hierarchies in JavaScript, including the DOM. A method `handle(d: Dog): void` is assignable to `{ handle(a: Animal): void }`; as a property `handle: (d: Dog) => void` it fails with TS2322.

**Q:** How do you type a generator that receives values?
**A:** With the third parameter: `function* g(): Generator<number, string, boolean> { if (yield 1) return "stopped"; return "done"; }`. On Node 24.19, `it.next()` gives `{ value: 1, done: false }`, then `it.next(true)` gives `{ value: 'stopped', done: true }`. `it.next("no")` is a type error.
