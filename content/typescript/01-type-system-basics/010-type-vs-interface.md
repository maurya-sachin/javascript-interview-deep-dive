---
title: "What is the difference between `type` and `interface`?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [type-alias, interface, declaration-merging, intersection, object-types]
related: []
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces
  - https://www.typescriptlang.org/docs/handbook/2/objects.html#interfaces-vs-intersections
  - https://www.typescriptlang.org/docs/handbook/declaration-merging.html
  - https://github.com/microsoft/TypeScript/wiki/Performance
  - https://github.com/microsoft/TypeScript/issues/15300
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html
tldr: >
  For object shapes they are nearly interchangeable. The real differences: interfaces can be
  re-opened (declaration merging) and extend with conflict checking; type aliases can name
  unions, tuples, mapped and conditional types, and compose with `&`, which silently yields
  `never` on conflicts. Default to `interface` for object shapes; use `type` when you need a type-only feature.
---

## Answer

Both name an object type, and for plain object shapes they are interchangeable: either can be implemented by a class, extended, or used as a function parameter type. The handbook says almost every `interface` feature is available in `type`; the key distinction is that a type alias cannot be re-opened.

**Where they differ:**

- **Declaration merging.** Two `interface User` declarations in one scope merge into one type. Two `type` aliases with one name are a `Duplicate identifier` error. Merging is what makes module and global augmentation (`interface Window`) possible.
- **Composition.** `interface B extends A` checks that `B` is compatible with `A` and reports a conflict at the declaration. `type B = A & {...}` accepts anything; a conflicting property silently becomes `never` (or the whole intersection collapses to `never` when the conflict is a discriminant).
- **What they can name.** Only `type` can alias unions, tuples, primitives, mapped types, and conditional types. An interface can only describe an object-like type.
- **Implicit index signatures.** A type alias of an object literal type is assignable to `Record<string, string>`; an interface is not, by design, because it could still be merged with more members.
- **Performance and messages.** The handbook says interfaces with `extends` can be cheaper for the compiler than intersections, and interface names always appear in error messages.

**What to say in an interview:** use `interface` for object shapes that are extended or augmented, `type` when you need unions, tuples, or type-level computation, and stay consistent within a codebase. The handbook's heuristic is "use `interface` until you need features from `type`."

## Example

```ts
// TypeScript 7.0.2, --strict
interface User { name: string }
interface User { id: number } // merges: User is { name; id }
const u: User = { name: "Ada" };
// Error TS2741: Property 'id' is missing in type '{ name: string; }' but required in type 'User'.

type Point = { x: number };
type Point = { y: number };
// Error TS2300: Duplicate identifier 'Point'. (reported on both declarations)

interface Base { tag: string }
interface Child extends Base { tag: number }
// Error TS2430: Interface 'Child' incorrectly extends interface 'Base'.
//   Types of property 'tag' are incompatible.
//     Type 'number' is not assignable to type 'string'.

type Both = Base & { tag: number }; // no error: Both["tag"] is string & number, i.e. never
type Id = string | number;          // only `type` can alias a union
```

## Pitfalls

- Saying "interfaces are for objects, types are for everything else" as if it were a rule. Both describe objects equally well; the differences are merging, conflict handling, and the types only `type` can name.
- Treating `&` as a drop-in for `extends`. An incompatible property doesn't error; it becomes `never`, and the failure shows up later at a use site.
- Relying on merging by accident. A second `interface Foo` in another file of the same scope silently changes `Foo`; a `type` would have errored.
- Passing an interface-typed value where `Record<string, X>` is expected and being surprised by `Index signature for type 'string' is missing`. Declare the index signature, or use a type alias.

## Follow-ups

**Q:** Can a class `implements` a type alias?
**A:** Yes, if the alias is an object type (or an intersection of object types with statically known members). If the alias is a union, `implements` fails with TS2422 and `interface ... extends` with TS2312 (checked on TS 7.0.2).

**Q:** Why does `Base & { tag: number }` not error?
**A:** An intersection type is valid even when members conflict. TypeScript only reduces it to `never` when the conflicting property is a discriminant (a unit/literal type), as of TS 3.9; `string & number` on a plain property just gives that property type `never`.

## Deep dive

### How it works

An `interface` declaration creates (or adds to) a single named object type. Declarations with the same name in the same scope merge: non-function members must be unique or have identical types, and function members with the same name become overloads, with later declarations ordered first. This is the only mechanism for augmenting a type you don't own:

```ts
// in a module file
declare global {
  interface Window { analytics: { track(name: string): void } }
}
window.analytics.track("signup"); // OK (checked with lib: es2022, dom)
```

A `type` alias is just a name for any type expression, so it is resolved, never merged. The compiler treats `interface B extends A` as one flat object type whose members are checked against `A` at the declaration; the Performance wiki adds that relationships between interfaces are cached, while an intersection is checked constituent by constituent before the flattened type. That is the basis for the handbook's note that `extends` can be faster.

### Edge cases

Conflict handling is where intersections surprise people. A conflicting plain property becomes `never`, but the object itself is still usable; a conflicting discriminant collapses the whole type (TS 3.9 release notes):

```ts
type IsNever<T> = [T] extends [never] ? true : false;
type Both = { tag: string } & { tag: number };
type Disc = { kind: "a"; x: 1 } & { kind: "b" };
const a: IsNever<Both> = true;
// Error TS2322: Type 'true' is not assignable to type 'false'.  (Both is not never)
const b: IsNever<Both["tag"]> = true; // OK: the property is never
const c: IsNever<Disc> = true;        // OK: the whole intersection is never
```

The implicit index signature rule is the other gotcha. With `type Alias = { a: string }` and `interface Iface { a: string }`, assigning `Alias` to `Record<string, string>` works and `Iface` fails with `Index signature for type 'string' is missing in type 'Iface'`. The TypeScript team's reason (issue #15300, closed as not planned): interfaces can be augmented by later declarations, so inferring an implicit index signature for them is unsafe; changing it would be a disruptive breaking change.

Also: `interface` can only extend an object type with statically known members. `interface Bad extends U` where `U` is a union alias gives `TS2312`.

### Real-world scenario

Typing something a library owns. You add a field to `Window`, or to a framework's request type, via module augmentation (`declare module "pkg" { interface Request { user?: User } }`). It only works because the target is an interface and your declaration merges. If the library had exported `type Request = {...}` you could not do it. This is also why library authors who want their types extensible export interfaces for objects meant to be augmented.

### Trade-offs

Default to `interface` for named object shapes: merging is available, `extends` reports conflicts where they happen, and error messages show the interface name. Reach for `type` for unions, tuples, utility-type results, and anything computed. Don't mix both for the same kind of thing without a reason; the handbook says the choice is mostly preference, so consistency matters more than the choice. ❓ Compiler-speed differences are described qualitatively by the handbook and wiki; no benchmark was run here.
