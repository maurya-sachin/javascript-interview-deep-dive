---
title: "How do you type a mixin in TypeScript?"
status: draft
difficulty: hard
frequency: 2
core: false
tags: [mixins, classes, constructor-types, intersection-types, declaration-emit]
related:
  - typescript/classes-enums-runtime-output/abstract-classes-implements
  - typescript/classes-enums-runtime-output/declaration-merging-namespaces
  - typescript/type-level-programming/class-and-this-utility-types
  - typescript/classes-enums-runtime-output/class-members-access
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/mixins.html#how-does-a-mixin-work
  - https://www.typescriptlang.org/docs/handbook/mixins.html#constrained-mixins
  - https://www.typescriptlang.org/docs/handbook/mixins.html#alternative-pattern
  - https://www.typescriptlang.org/docs/handbook/mixins.html#constraints
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#support-for-mix-in-classes
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-2.html#abstract-construct-signatures
tldr: >
  A mixin is a function that takes a base class and returns `class extends Base { ... }`. Type the
  parameter as a type parameter constrained to `new (...args: any[]) => T`; the result is the
  intersection of the new class and the base, so base constructor checks and statics survive.
  Constrain `T` to require members from the base.
---

## Answer

A mixin is a function from a class to a subclass; `const Sprite = Movable(Timestamped(Point))` builds a chain at runtime. TypeScript gives this pattern dedicated rules (TS 2.2):

- A **mixin constructor type** has one construct signature with a single `...args: any[]` rest parameter and an object return type: `type Constructor<T = {}> = new (...args: any[]) => T`.
- A **mixin class** is a class that `extends` a value whose type is a type parameter constrained to such a type: `function M<TBase extends Constructor>(Base: TBase) { return class extends Base {} }`.
- Its result is `typeof C & TBase`. When resolving `new` on that intersection, the mixin's `any[]` signature is dropped and its instance members are merged into the base's signatures. So `new Sprite("a", 2)` is still checked against `Point`'s `(x: number, y: number)`, and the base's statics remain.

**Constrained mixins.** Write `TBase extends Constructor<{ x: number; y: number }>` and the mixin body can use `this.x`; applying it to a class without those members fails at the call (TS2345).

**Rules the checker enforces.** A mixin class's own constructor must be `constructor(...args: any[])` and pass them to `super(...args)`, otherwise TS2545. The constraint must be `any[]`, not `unknown[]` (also TS2545). If the constraint is an `abstract new` signature (TS 4.2), the mixin class must be declared `abstract` (TS2797).

**Library output.** With `declaration` on, the returned class is an anonymous class type in the `.d.ts`, so `private`, `protected` and `#private` members are rejected (TS4094). The fix is an explicit return type: `TBase & Constructor<Disposable>`, with the members described by an interface.

The handbook's alternative, interface merging plus a runtime `applyMixins` that copies prototype methods, is unchecked: the interface promises members the copy might not provide.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3, --strict --target es2022; run on Node 24.19
type Constructor<T = {}> = new (...args: any[]) => T;

function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    createdAt = Date.UTC(2026, 0, 1);
  };
}
// Constrained mixin: the base must already have numeric x and y
function Movable<TBase extends Constructor<{ x: number; y: number }>>(Base: TBase) {
  return class extends Base {
    move(dx: number, dy: number) { this.x += dx; this.y += dy; return this; }
  };
}
class Point { constructor(public x: number, public y: number) {} }
class Label { constructor(public text: string) {} }

const Sprite = Movable(Timestamped(Point));
type Sprite = InstanceType<typeof Sprite>;    // Point & { createdAt } & { move }
const s: Sprite = new Sprite(1, 2).move(3, 4); // Point's (x, y) is still checked
console.log(s.x, s.y, s.createdAt); // → 4 6 1767225600000

Movable(Label);
// Error TS2345: ...Type 'Label' is missing the following properties from type '{ x: number; y: number; }': x, y

function WithId<TBase extends Constructor>(Base: TBase) {
  return class extends Base { constructor(id: string) { super(); } };
}
// Error TS2545: A mixin class must have a constructor with a single rest parameter of type 'any[]'.
```

## Pitfalls

- Giving the mixin its own constructor parameters. TS2545 forbids it; pass configuration to the mixin function instead (`Timestamped(Base, clock)`), or read it from the base.
- Exporting a mixin with private state from a library. Under `declaration`, TS4094: "Property '#secret' of exported anonymous class type may not be private or protected". Annotate the return type.
- Expecting `instanceof` to work per mixin. Each call creates a new class: two `WithDispose(Conn)` results are different (`A === B` printed `false`), and an instance of one is not `instanceof` the other. Add a brand or `Symbol.hasInstance` if you need it.
- Reading tooltips. 7.0.2 printed `Movable.(Anonymous class) & Timestamped.(Anonymous class) & Point` where 6.0.3 printed the full instantiated chain; name the type with `InstanceType<typeof Sprite>`.

## Follow-ups

**Q:** How do you type a mixin over an abstract class?
**A:** Constrain to `abstract new (...args: any[]) => T` and declare the returned class `abstract class M extends Base {}`. Returning a plain `class extends Base` is TS2797 on both versions, because the result could otherwise be instantiated.

**Q:** Why `any[]` rather than `unknown[]`?
**A:** The mixin's construct signature is meant to vanish into the base's (TS 2.2 rule). With `unknown[]` it is no longer a mixin constructor type, so the class body is rejected with TS2545 on 6.0.3 and 7.0.2.

**Q:** Do mixins work with decorators?
**A:** Not for typing. The handbook's Constraints section says decorators cannot provide mixins through code-flow analysis: a class decorator that returns a subclass doesn't change the decorated class's type. Use the function form.

## Exercises

### Why does this fail, and how do you fix it?

```ts
type Constructor<T = {}> = new (...args: any[]) => T;
function Boxed<TBase extends Constructor>(Base: TBase) {
  return class Boxed<V> extends Base { value?: V };
}
```

**Answer:** TS2545 on 6.0.3 and 7.0.2: a generic class is not accepted as a mixin class. Move the type parameter to the function, `function Boxed<V, TBase extends Constructor>(Base: TBase) { return class extends Base { value?: V } }`, which compiles.

### What does this print?

```ts
type Constructor<T = {}> = new (...args: any[]) => T;
function WithDispose<TBase extends Constructor>(Base: TBase) {
  return class extends Base { #done = false; dispose() { this.#done = true; } };
}
class Conn {}
const A = WithDispose(Conn), B = WithDispose(Conn);
console.log(A === B, new A() instanceof Conn, new A() instanceof B);
```

**Answer:** `false true false`. Each call evaluates a new class expression, but all of them extend the same `Conn`.
