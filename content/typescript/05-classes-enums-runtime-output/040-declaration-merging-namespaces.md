---
title: "What is declaration merging, and are namespaces still used?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [declaration-merging, namespaces, interfaces, module-augmentation, erasable-syntax]
related:
  - typescript/type-system-basics/type-vs-interface
  - typescript/modules-and-declaration-files/module-augmentation-globals
  - typescript/classes-enums-runtime-output/erasable-syntax-only
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/declaration-merging.html
  - https://www.typescriptlang.org/docs/handbook/namespaces.html
  - https://www.typescriptlang.org/docs/handbook/namespaces-and-modules.html
  - https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly
tldr: >
  Declaration merging combines declarations that share a name into one entity: interfaces merge
  members, namespaces merge exports and can attach members to a function, class, or enum. Type
  aliases and classes do not merge. New code organises with ES modules; namespaces survive in
  ambient typings, augmentation, and legacy code.
---

## Answer

A declaration creates a **namespace**, a **type**, a **value**, or a mix (Handbook table: a class makes type and value, an interface only a type, a namespace makes namespace and value). When two declarations with the same name create compatible meanings, TypeScript merges them.

- **Interface + interface** (the common case): members join into one interface. Function members become overloads, later declarations first. Non-function members with the same name must have the same type, else TS2717.
- **Namespace + namespace**: exported members are combined. Non-exported members are visible only to the block that declared them, so the second block cannot see them (TS2304).
- **Namespace + function / class / enum** (the namespace comes after): adds properties to the function, inner types or statics to the class, or helper functions to the enum. This is the only way to type a callable-with-properties built in plain JavaScript.
- **Interface + class** merges too, which types members the class does not initialise.
- **Do not merge**: `type` aliases, class + class, class + variable (duplicate identifier, TS2300).
- **Module augmentation** (`declare module "./x"`, `declare global`) is merging across files: it patches existing declarations only.

**Are namespaces still used?** Not to organise application code: a file is already a module and the importer names it, so wrapping exports in a `namespace` is "needless namespacing" (Handbook). They remain for `declare namespace` in global/UMD typings, for function and enum merging, and in older codebases. A namespace containing values emits an IIFE, so it is runtime code, and `erasableSyntaxOnly` rejects it (TS1294). Type-only and `declare` namespaces are still allowed.

## Example

```ts
// TypeScript 7.0.2 and 5.9.3, --strict
interface Box { height: number }
interface Box { width: number }
const box: Box = { height: 1, width: 2 }; // one merged interface, no emitted code

interface Config { port: number }
interface Config { port: string }
// Error TS2717: Subsequent property declarations must have the same type.  Property 'port' must be of type 'number', but here has type 'string'.

function buildLabel(name: string) { return buildLabel.prefix + name; }
namespace buildLabel { export let prefix = "Hello, "; } // adds a property to the function

namespace Animal {
  let hidden = true;
  export function a() { return hidden; }
}
namespace Animal {
  export function b() { return hidden; }
  // Error TS2304: Cannot find name 'hidden'.
}
console.log(buildLabel("Sam"), Animal.a(), box.width);
// → Hello, Sam true 2
```

## Pitfalls

- Assuming a merged `interface Foo` on a `class Foo` creates the property. `interface Foo { extra: number } class Foo {}` compiles and `f.extra` is typed `number`, but nothing assigns it, so the value is `undefined` at runtime.
- Expecting `type` to merge. A `type T` and an `interface T` of the same name give `Duplicate identifier 'T'` on both compilers; this is the practical reason libraries expose interfaces that users can augment.
- Declaring the namespace before the function/class/enum it should merge with. The Handbook requires the namespace to follow it.
- Reaching for `namespace` to group related exports in a module file, which forces consumers to write `shapes.Shapes.Triangle`.

## Follow-ups

**Q:** How do you add a method to a library's class?
**A:** Module augmentation: `declare module "./observable" { interface Observable<T> { map<U>(f: (x: T) => U): Observable<U> } }`, plus assigning `Observable.prototype.map`. Checked under `module: nodenext` on both versions (`declare global` for `Array.prototype.last` too). Only named exports; no new top-level names.

**Q:** Which namespaces survive `erasableSyntaxOnly`?
**A:** Checked on both versions: one with values is TS1294; type-only and `declare namespace` pass. 7.0.2 also reports `module Old {}` as TS1540; 5.9.3 did not.

## Deep dive

### How it works

Each declaration contributes up to three meanings (namespace, type, value), and merging is allowed when the meanings do not clash. A class (type and value) plus a namespace (namespace and value) works because the namespace extends the class value, so it must come second.

A namespace with values compiles to a function that receives the existing object, or `{}` if none. Output from 7.0.2 (`--target es2022`) for the example above:

```js
function buildLabel(name) { return buildLabel.prefix + name; }
(function (buildLabel) {
    buildLabel.prefix = "Hello, ";
})(buildLabel || (buildLabel = {}));
var Animal;
(function (Animal) {
    let hidden = true;
    function a() { return hidden; }
    Animal.a = a;
})(Animal || (Animal = {}));
(function (Animal) {
    function b() { return hidden; }
    Animal.b = b;
})(Animal || (Animal = {}));
```

The `X || (X = {})` argument is what makes the second block extend the first. `hidden` is a local of the first closure, which is why `b` cannot see it. The compiler reports it as TS2304 rather than letting it become a runtime `ReferenceError`.

### Edge cases

- Overload order from interface merging: later declarations come first, and a signature with a single string-literal parameter bubbles to the top (Handbook). Checked on both versions: with `g(x: string): "plain"` then a later `g(x: string): "later"`, `g("zz")` resolved to `"later"`, and `g("lit")` to a `g(x: "lit")` overload.
- Ambient `declare namespace` emits nothing; it only describes a global, which is why DefinitelyTyped-style typings for script-tag libraries use it.
- Augmentation cannot introduce new top-level names or augment `default` exports (Handbook).

### Trade-offs

Interface merging is what makes open extension work (plugins adding to a shared options type), at the price of any file in the program being able to change a type. Namespace merging onto a function or enum is concise but is runtime code with an IIFE shape, and it is not erasable. For new code, a `const` object with `Object.assign` or separate exports plus a type usually says the same thing without a nonstandard construct.
