---
title: "Which TypeScript syntax has runtime output, and why does `erasableSyntaxOnly` exist?"
status: draft
difficulty: hard
frequency: 3
core: false
tags: [erasablesyntaxonly, type-stripping, node, enums, namespaces, parameter-properties, verbatimmodulesyntax]
related:
  - typescript/the-compiler/type-erasure
  - typescript/the-compiler/node-type-stripping
  - typescript/classes-enums-runtime-output/enums-vs-unions
  - typescript/classes-enums-runtime-output/declaration-merging-namespaces
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html
  - https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly
  - https://github.com/microsoft/TypeScript/pull/61011
  - https://nodejs.org/docs/latest-v24.x/api/typescript.html
  - https://nodejs.org/docs/latest/api/typescript.html
tldr: >
  Most TypeScript syntax is erased. A few constructs need generated JavaScript: enums, namespaces
  with values, parameter properties, `import =`/`export =`, and `<T>x` assertions. Node's type
  stripping only deletes types, so it rejects those. `erasableSyntaxOnly` (TS 5.8) makes `tsc`
  report them up front.
---

## Answer

Almost everything TypeScript adds is **erased**: annotations, interfaces, type aliases, generics, `as`, `satisfies`, `private`/`readonly`/`abstract`/`override`, `declare`. Deleting those leaves valid JavaScript. A few constructs instead **generate** code:

- `enum` and `const enum` (an object, or inlined values)
- `namespace` / `module` containing values (an IIFE)
- constructor **parameter properties** (`constructor(public x: number)`, which add `this.x = x`)
- `import x = require()`, `import A = B.C`, and `export =`
- angle-bracket assertions `<T>expr` (`as` is erasable; the angle form is a different syntax)

**Why the flag exists.** Node 24 can run `.ts` files by *type stripping*: it blanks out type syntax without checking or transforming anything, and it does not read `tsconfig.json` (Node docs). Constructs that need generated code fail at runtime, e.g. `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX: TypeScript enum is not supported in strip-only mode` (checked on Node 24.19.0). TS 5.8 added `--erasableSyntaxOnly`, which reports the same set at compile time as TS1294, so editor and CI see it before `node` does.

**Not on the list.** Type-only namespaces and `declare` namespaces/enums pass. Decorators are also not flagged, yet Node cannot parse them (SyntaxError, checked), so the flag does not guarantee Node-runnable code.

**Pair it with `verbatimModuleSyntax`** so imports are not silently elided: importing a type without `type` is TS1484, and Node otherwise fails with "does not provide an export named 'Foo'". The Node docs suggest `erasableSyntaxOnly` and `verbatimModuleSyntax` together.

**Escape hatch.** `node --experimental-transform-types` handled an enum and a parameter property on 24.19.0. The docs of the 24.x line mention the flag; the latest docs say it was removed in v26.0.0, so do not build on it.

## Example

```ts
// TypeScript 7.0.2 and 5.9.3, --erasableSyntaxOnly
enum Dir { Up }
// Error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.
class Point { constructor(public x: number) {} }
// Error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.
namespace Util { export const two = 2; }
// Error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.
const one = <number>1;
// Error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.

declare enum Ambient { A } // OK: declare emits nothing
namespace TypeOnly { export type T = string; } // OK: no runtime code
class Fine { private a = 1; readonly b = 2; get sum() { return this.a + this.b; } } // OK

// Erasable rewrites of the flagged code:
const Direction = { Up: 0 } as const;
type Direction = (typeof Direction)[keyof typeof Direction];
class Pt {
  x: number;
  constructor(x: number) { this.x = x; }
}
const two = 2; // the namespace becomes a plain const (or its own module)
console.log(Direction.Up, new Pt(3).x, two, new Fine().sum);
// → 0 3 2 3
```

The `Fine` class and the rewrites were run alone as a `.ts` file on Node 24.19.0 and printed `0 3 2 3`.

## Pitfalls

- Treating it as a style flag. It exists for runtimes that strip types (Node, and tools like Amaro or ts-blank-space per the 5.8 notes) and for you to find incompatibilities before running.
- Assuming a clean `erasableSyntaxOnly` build is strip-safe. Decorators pass the flag but give a SyntaxError in Node, and path aliases are ignored because Node does not read `tsconfig.json`.
- Forgetting `import type` / `type` modifiers. With only `erasableSyntaxOnly`, `tsc` accepted `import { Foo }` for an interface on both versions, and Node then failed with "does not provide an export named 'Foo'".
- Reading "const enum is erased" as safe. It is still flagged (TS1294) and Node rejects it with the same enum error.

## Follow-ups

**Q:** Which TypeScript version added it?
**A:** 5.8, per the release notes (PR 61011, merged 2025-01-23). Checked on 5.9.3 and 7.0.2: the same four errors for the example, including the angle-bracket assertion.

**Q:** What replaces an enum under this flag?
**A:** An `as const` object plus a derived union type; see the enums-vs-unions question. Parameter properties become explicit fields assigned in the constructor, and value namespaces become module exports.
