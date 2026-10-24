---
title: "What do `InstanceType`, `ConstructorParameters`, and the `this` utility types do?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [utility-types, instancetype, constructorparameters, this-parameter, thistype, bind]
related:
  - typescript/type-level-programming/utility-types
  - typescript/type-level-programming/infer-keyword
  - typescript/classes-enums-runtime-output/abstract-classes-implements
  - typescript/type-system-basics/function-types-overloads
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/utility-types.html#instancetypetype
  - https://www.typescriptlang.org/docs/handbook/utility-types.html#constructorparameterstype
  - https://www.typescriptlang.org/docs/handbook/utility-types.html#thisparametertypetype
  - https://www.typescriptlang.org/docs/handbook/utility-types.html#omitthisparametertype
  - https://www.typescriptlang.org/docs/handbook/utility-types.html#thistypetype
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-2.html#abstract-construct-signatures
  - https://www.typescriptlang.org/tsconfig/#noImplicitThis
  - https://www.typescriptlang.org/tsconfig/#strictBindCallApply
tldr: >
  `InstanceType<C>` and `ConstructorParameters<C>` read the result and the parameter tuple of a
  construct signature, so they take `typeof MyClass`, not `MyClass`. `ThisParameterType` and
  `OmitThisParameter` read or strip a function's `this` parameter, and type `bind`. `ThisType<T>`
  transforms nothing: it marks the `this` type inside an object literal.
---

## Answer

All five are declared in `lib.es5.d.ts`; four are conditional types using `infer`.

**Class utilities.** A class name used as a type means the instance; the class value's type is `typeof C`, which has a construct signature. `ConstructorParameters<typeof C>` infers that signature's parameters as a labelled tuple (`constructor(x: number, y = 0)` gives `[x: number, y?: number | undefined]`), and `InstanceType<typeof C>` infers what `new` returns. Both are constrained to `abstract new (...args: any) => any`, so they also accept abstract classes (TS 4.2 abstract construct signatures). They are what you reach for when a value is a class: factories, DI containers, registries keyed by constructor.

They work on one signature and they don't keep generics. An overloaded constructor gives the parameters of the last overload, and `InstanceType<typeof Box>` for `class Box<T>` is `Box<unknown>`. When writing a generic factory, inferring `new (...args: A) => T` directly is usually better, because `T` and `A` are inferred per call.

**`this` utilities.** A function can declare a fake first parameter `this: X`. `ThisParameterType<F>` extracts `X` (or `unknown` if there is none), and `OmitThisParameter<F>` returns `F` without it. Their main client is the lib itself: with `strictBindCallApply` (part of `--strict`), `bind` is declared as `bind<T>(this: T, thisArg: ThisParameterType<T>): OmitThisParameter<T>`. `OmitThisParameter` rebuilds the function type from the last overload, so generics become `unknown`.

**`ThisType<T>`** is an empty interface the checker treats as a marker: in an object literal whose contextual type includes `ThisType<T>`, methods see `this: T`. It powers "options object" APIs in which methods reach data defined elsewhere in the same object. It requires `noImplicitThis` (on under `--strict`); without that flag `this` is just `any`.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3, --strict; run on Node 24.19
class Box<T> { constructor(public value: T) {} }

// A factory built from the two class utilities...
function make<C extends new (...args: any) => any>(
  ctor: C, ...args: ConstructorParameters<C>
): InstanceType<C> {
  return new ctor(...args);
}
const loose = make(Box, "hi");   // Box<unknown>: the class's own generic is lost
// ...versus inferring the parts directly, which keeps it
function create<A extends unknown[], T>(ctor: new (...args: A) => T, ...args: A): T {
  return new ctor(...args);
}
const tight = create(Box, "hi"); // Box<string>
console.log(tight.value.toUpperCase()); // → HI

// The `this` parameter utilities type Function.prototype.bind
function toHex(this: number, pad: number) { return this.toString(16).padStart(pad, "0"); }
type Self = ThisParameterType<typeof toHex>; // number
const ffHex = toHex.bind(255);               // OmitThisParameter<typeof toHex>: (pad: number) => string
console.log(ffHex(4)); // → 00ff

// ThisType<T> only marks what `this` is inside an object literal
type Options<D, M> = { data: D; methods: M & ThisType<D & M> };
function define<D, M>(o: Options<D, M>): D & M { return { ...o.data, ...o.methods }; }
const counter = define({ data: { count: 0 }, methods: { inc() { this.count++; } } });
counter.inc();
console.log(counter.count); // → 1
```

## Pitfalls

- Passing the instance type. `InstanceType<Point>` is TS2344: "Type 'Point' does not satisfy the constraint 'abstract new (...args: any) => any'". Write `InstanceType<typeof Point>`.
- Private constructors. `InstanceType<typeof Singleton>` is TS2344 too ("Cannot assign a 'private' constructor type to a 'public' constructor type"), because the constraint is a public construct signature.
- Trusting them with overloads or generics: only the last overload survives, and type parameters become `unknown`.
- Relying on `ThisType` with `noImplicitThis` off. The marker is ignored and `this.missing` type-checks silently; with `--strict` it is TS2339.

## Follow-ups

**Q:** Why does the constraint say `(...args: any)` rather than `unknown[]`?
**A:** Parameters are compared contravariantly, so `typeof Point` (taking `number`) is not assignable to `new (...args: unknown[]) => unknown`: TS2345 on both versions. 7.0.2 elaborates "Types of parameters 'x' and 'args' are incompatible", 6.0.3 "Types of construct signatures are incompatible". `any` or `never[]` accepts every constructor.

**Q:** How is this different from a `this` return type?
**A:** `add(p: string): this` in a class is polymorphic `this`: called on a subclass, it returns the subclass, so fluent chains keep subclass methods. `ThisType` sets `this` inside object literals; the `this` parameter utilities read a function's declared receiver.

**Q:** What does calling `toHex(2)` directly do?
**A:** TS2684: "The 'this' context of type 'void' is not assignable to method's 'this' of type 'number'". The `this` parameter is checked at every call site and erased from the emitted JavaScript.

## Exercises

### Predict the types

```ts
class Over {
  constructor(a: string);
  constructor(a: number, b: number);
  constructor(..._: unknown[]) {}
}
type P = ConstructorParameters<typeof Over>;
function id<T>(this: Date, x: T) { return x; }
type O = OmitThisParameter<typeof id>;
```

**Answer:** `P` is `[a: number, b: number]`, the last overload only. `O` is `(x: unknown) => unknown`: the `this` parameter is gone and so is the generic. Same on 6.0.3 and 7.0.2.

### What is `ThisParameterType<(a: number) => void>`?

```ts
type T = ThisParameterType<(a: number) => void>;
```

**Answer:** `unknown`: there is no declared `this` to infer. `OmitThisParameter` relies on this: its definition starts with `unknown extends ThisParameterType<T> ? T : ...`, so a function without a `this` parameter comes back unchanged.
