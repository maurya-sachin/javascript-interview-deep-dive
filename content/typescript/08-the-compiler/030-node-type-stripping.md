---
title: "How does Node.js run TypeScript files directly?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [node, type-stripping, amaro, transform-types, erasablesyntaxonly, verbatimmodulesyntax]
related:
  - typescript/the-compiler/type-erasure
  - typescript/the-compiler/checking-vs-emitting
  - typescript/classes-enums-runtime-output/erasable-syntax-only
  - typescript/modules-and-declaration-files/import-type-isolated-modules
verified: 2026-10
sources:
  - https://nodejs.org/docs/latest-v24.x/api/typescript.html
  - https://nodejs.org/docs/latest-v24.x/api/module.html#modulestriptypescripttypescode-options
  - https://nodejs.org/docs/latest-v24.x/api/cli.html
  - https://github.com/nodejs/amaro
  - https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly
  - https://www.typescriptlang.org/tsconfig/#verbatimModuleSyntax
tldr: >
  `node file.ts` strips the types by replacing them with whitespace and runs the result. There is no
  type checking and no tsconfig. Only erasable syntax works: enums, parameter properties, value
  namespaces and `import =` throw `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` unless you pass
  `--experimental-transform-types`. Imports need `.ts` extensions and `type` keywords.
---

## Answer

Node can run `.ts`, `.mts` and `.cts` files without a build step. Per the Node docs it "will replace TypeScript syntax with whitespace, and no type checking is performed". The work is done by Amaro, a wrapper around the SWC TypeScript parser. Support is on by default from v23.6.0 (and v22.18.0) and the docs mark it stable from v24.12.0; I ran everything on v24.19.0 with no warning.

Because only syntax is deleted, line and column numbers are preserved, so stack traces are right without source maps. The rules follow from "delete, never generate":

- **Only erasable syntax.** Anything that needs generated JavaScript throws `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`: enums, namespaces containing values, parameter properties, `import x = require()`. `--experimental-transform-types` (added v22.7.0) enables the transformation, still with an experimental warning and with source maps on.
- **No type checking.** A type error does not stop the program. Run `tsc --noEmit` separately.
- **No `tsconfig.json`.** `paths`, `target` and other options are ignored. `paths` aliases fail to resolve; the nearest equivalent is `package.json` subpath imports starting with `#`.
- **Real file extensions.** `import "./types.ts"`, not `"./types"`.
- **`type` keyword on type imports.** Node cannot know that `Config` is a type, so `import { Config }` stays and fails at link time. `verbatimModuleSyntax` makes `tsc` enforce this.
- **Not in `node_modules`.** Node refuses TypeScript files there, to discourage publishing `.ts` packages.
- **No `.tsx`** and no decorators: `@dec class A {}` failed with `SyntaxError: Invalid or unexpected token`.

The Node docs recommend `erasableSyntaxOnly`, `verbatimModuleSyntax`, `rewriteRelativeImportExtensions` and `module: nodenext`, so `tsc` rejects exactly what Node would reject.

## Example

```ts
// Node v24.19.0 for the `node` lines; TypeScript 7.0.2 and 5.9.3 for the `tsc` lines (same diagnostics)
// ok.ts — annotations, interface, generic:        node ok.ts            → runs; prints "hi Adastring"
// An error thrown on ok.ts line 5 is reported at line 5 (no source map).

// enum Color { Red, Green }
// node enum.ts
// → SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript enum is not supported in strip-only mode
// node --experimental-transform-types enum.ts
// → ExperimentalWarning: Transform Types is an experimental feature…  then runs, printing 1

// class P { constructor(public x: number) {} }    → TypeScript parameter property is not supported in strip-only mode
// namespace A { export let x = 1 }                → TypeScript namespace declaration is not supported in strip-only mode
// namespace T { export type A = string }          → runs (no runtime code)

// import { defaults, Config } from "./types.ts";  // Config is an interface
// → SyntaxError: The requested module './types.ts' does not provide an export named 'Config'
// import { defaults, type Config } from "./types.ts";  → 80
// import { defaults } from "./types";              → Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…/types'

// tsc -p . --noEmit with erasableSyntaxOnly + verbatimModuleSyntax reports the same files:
//   TS1294 (enum, namespace, parameter property, import =) and TS1484 (Config is a type…)
```

## Pitfalls

- Assuming types are checked. `const bad: number = "x" as unknown as number` ran, and `typeof bad` printed `string`. Node never loads the checker.
- Importing a type without `type`. It passes `tsc` when `verbatimModuleSyntax` is off and then fails when Node links the module.
- Expecting `tsconfig` features. `"paths": {"@/*": ["./src/*"]}` produced `ERR_MODULE_NOT_FOUND: Cannot find package '@/lib.ts'`.
- Trying it on a dependency. A file `node_modules/pkg/index.ts` failed with `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`; publish compiled JavaScript plus `.d.ts` files.

## Follow-ups

**Q:** What is the difference from `tsx` or `ts-node`?
**A:** The Node docs point to a third-party package such as `tsx` for full support, including `tsconfig.json`. Built-in stripping is the lightweight mode: no config, erasable syntax only. How `tsx` works inside is ❓ (I did not read its source).

**Q:** Can I see what Node strips?
**A:** `module.stripTypeScriptTypes(code)` (Stability 1.2) returns it: `const x: number = 1;` became `"const x         = 1;"`, the type replaced by spaces. The docs warn that the output is not stable across Node versions.

## Exercises

### What does Node print?

```ts
// order.ts
interface Item { id: number }
const items: Item[] = [{ id: 1 }];
console.log(items.length as string);
```

**Answer:** `1`. The `as string` is stripped without any check (the same mechanism that let `typeof bad` print `string` above). `tsc --noEmit` (7.0.2) reports `TS2352: Conversion of type 'number' to type 'string' may be a mistake…` on that cast; Node, run on v24.19.0, did not.
