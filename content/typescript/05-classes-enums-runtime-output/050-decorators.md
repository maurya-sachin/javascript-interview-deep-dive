---
title: "How do decorators work in TypeScript?"
status: draft
difficulty: hard
frequency: 3
core: false
tags: [decorators, experimentaldecorators, tc39, emitdecoratormetadata, class-fields]
related:
  - typescript/classes-enums-runtime-output/class-members-access
  - typescript/classes-enums-runtime-output/erasable-syntax-only
  - typescript/the-compiler/type-erasure
verified: 2026-10
perishable:
  - "Decorators and decorator metadata listed at Stage 2.7 (checked 2026-10)"
  - "Node 24 has no native decorators or Symbol.metadata"
sources:
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html
  - https://www.typescriptlang.org/docs/handbook/decorators.html
  - https://www.typescriptlang.org/tsconfig/#experimentalDecorators
  - https://github.com/microsoft/TypeScript/pull/50820
  - https://github.com/tc39/proposal-decorators
  - https://github.com/tc39/proposals
  - https://github.com/tc39/proposal-decorator-metadata
tldr: >
  A decorator is a function called at class definition with the decorated value and a context
  object; it may return a replacement. Since TS 5.0 plain `@dec` implements the TC39 decorators
  proposal; `experimentalDecorators` keeps the older, incompatible form (`(target, key, descriptor)`,
  parameter decorators, `emitDecoratorMetadata`). Both emit helper code.
---

## Answer

A decorator is a function applied to a class or class element when the class is **defined**. It can observe, replace, or add initialisation logic. Conceptually `@dec` turns `member` into `dec(member, context) ?? member`.

**Standard decorators (TS 5.0+, no flag).** Signature `(value, context)`. `value` is the method, class, getter/setter, or `undefined` for a field. `context` has `kind` (`"method"`, `"field"`, `"class"`, `"accessor"`, ...), `name`, `static`, `private`, `addInitializer`, and since 5.2 `metadata`. Return a replacement of the same kind (a function for a method, an initializer function for a field) or nothing. TS types each kind with `ClassMethodDecoratorContext`, `ClassFieldDecoratorContext`, and so on. `accessor x = 1` is the proposal's auto-accessor keyword that decorators can wrap.

**Legacy decorators (`experimentalDecorators`).** Based on the old Stage 2 design: `(target, key, descriptor)`, parameter decorators, and `emitDecoratorMetadata` (used by dependency-injection frameworks). They are a separate type-check and a separate emit. The 5.0 notes say existing legacy decorators are unlikely to work as standard ones, and standard ones do not support parameter decorators or `emitDecoratorMetadata`.

**Status.** The proposal repository README says Stage 2.7, and the tc39/proposals page lists it under Stage 2.7 (fetched 2026-10). TS 5.0 implemented the then-Stage-3 version (PR 50820). ❓ I did not diff today's proposal text against TypeScript's implementation.

**Runtime.** Native Node 24 cannot parse `@dec` (SyntaxError, checked), so the code needs TypeScript, Babel, or a bundler. TS downlevels with `__esDecorate`/`__runInitializers` helpers for `--target es2022`, while `--target esnext` kept the `@` syntax in the output (6.0.3 and 7.0.2).

## Example

```ts
// TypeScript 7.0.2 and 6.0.3, --strict --target es2022 (standard decorators)
function logged<This, Args extends unknown[], R>(
  method: (this: This, ...args: Args) => R,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => R>,
) {
  return function (this: This, ...args: Args): R {
    console.log(`enter ${String(context.name)}`);
    return method.call(this, ...args);
  };
}
function atLeast(min: number) {
  return function <This>(_: undefined, context: ClassFieldDecoratorContext<This, number>) {
    return (initial: number) => Math.max(min, initial); // replaces the field's initializer
  };
}
class Counter {
  @atLeast(0) count = -5;
  @logged inc(by: number) { this.count += by; return this.count; }
}
console.log(new Counter().inc(2));
// → enter inc
// → 2

@logged class Wrong {}
// Error TS1238 and TS1270: `logged` expects a method, not a class.
```

## Pitfalls

- Mixing the two systems. Without `experimentalDecorators`, a three-argument legacy decorator fails on both versions with TS1241 ("The runtime will invoke the decorator with 2 arguments, but the decorator expects 3") and a parameter decorator gives TS1206.
- Typing the decorator loosely. `logged` above applied to a class or a field is a type error (TS1238 / TS1240) because `context` is typed `ClassMethodDecoratorContext`; a decorator typed with `any` would not catch the misuse.
- Expecting decorators to run per call or per instance. They run once at class definition; per-instance work goes in `context.addInitializer` or a returned field initializer.
- Assuming `reflect-metadata` is built in. `emitDecoratorMetadata` is legacy-only, and `__decorate` calls `Reflect.decorate` only when something has defined it.

## Follow-ups

**Q:** In what order do they run?
**A:** Checked on 6.0.3 and 7.0.2: for `@d("A") @d("B") m() {}` the output was `eval A`, `eval B`, `apply B`, `apply A`. Decorator expressions evaluate top to bottom; application is bottom to top, matching the 5.0 notes.

**Q:** What is `context.metadata`?
**A:** TS 5.2's decorator metadata (tc39/proposals lists it at Stage 2.7, its README says 3): a shared object per class, readable afterwards via `Class[Symbol.metadata]`. Node 24 printed `Symbol.metadata` as `undefined`, so I polyfilled it; with that, two `@tag` field decorators produced `[ 'name:req', 'age:opt' ]`.
