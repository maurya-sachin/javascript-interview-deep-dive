---
title: "Why does importing a CommonJS module sometimes fail, and what does `esModuleInterop` do?"
status: draft
difficulty: hard
frequency: 4
core: false
tags: [esmoduleinterop, allowsyntheticdefaultimports, commonjs, esm, export-equals, dual-package]
related:
  - typescript/modules-and-declaration-files/module-resolution
  - typescript/modules-and-declaration-files/import-type-isolated-modules
  - typescript/modules-and-declaration-files/declaration-files
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/modules/appendices/esm-cjs-interop.html
  - https://www.typescriptlang.org/tsconfig/#esModuleInterop
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
  - https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
  - https://www.typescriptlang.org/docs/handbook/modules/theory.html
  - https://nodejs.org/docs/latest-v24.x/api/esm.html
  - https://nodejs.org/docs/latest-v24.x/api/packages.html
tldr: >
  A CommonJS module is one `module.exports` value; an ES module has named exports plus a default.
  `esModuleInterop` makes `tsc` emit helpers (`__importDefault`, `__importStar`) and type default
  imports to match. `allowSyntheticDefaultImports` changes only the types, so it can compile code
  that crashes. TS 6.0 deprecates turning either off; 7.0 forces both on.
---

## Answer

CommonJS exports **one value** (`module.exports`, often a function). An ES module exports **named bindings** plus an optional default. Every tool bridges the two differently, and the failures come from `tsc`, your bundler, or Node disagreeing.

**What the flags do.**
- `esModuleInterop` affects emit and types. For `module: commonjs` output, `import x from "cjs"` becomes `__importDefault(require("cjs")).default` and `import * as ns` goes through `__importStar`. The helpers check the `__esModule` marker that transpiled ESM carries. Types follow: a default import of an `export =` module is allowed.
- `allowSyntheticDefaultImports` changes only type checking, so a default import of a module without one is permitted. Emit is unchanged, which is why the TypeScript handbook says to avoid it without `esModuleInterop`.

**Version note.** TS 6.0 deprecated setting either flag to `false` (TS5107 unless `ignoreDeprecations: "6.0"`), and `allowSyntheticDefaultImports` now defaults to `true` even when `esModuleInterop` is `false`; on TS 7.0.2 either `false` is error TS5108.

**Native Node ESM differs from the helpers.** Per the Node docs, `import x from "./c.cjs"` always gives `module.exports`. Named imports come from static analysis, so a name assigned dynamically is missing. Node does not look at `__esModule`, so a transpiled module gets a "double default" (`x.default`).

**Practical rules.**
- Default-import CommonJS modules that use `export =` / `module.exports = ...`.
- Do not write `import * as fn from "cjs"` and then call `fn()`.
- In Node-targeted code use `module: nodenext`, which checks per-file formats; `export =` is an error in ESM files (TS1203).
- A `.d.ts` file is ESM or CJS by the nearest `package.json` `"type"`, while `.d.mts` / `.d.cts` are fixed (handbook theory page). Dual packages ship the right one per `exports` condition.

## Example

```ts
// node_modules/legacy2/index.js:   module.exports = function hello() { return "hi from CJS"; };
// node_modules/legacy2/index.d.ts: declare function hello(): string;  export = hello;
// src/def.ts
import hello from "legacy2";
console.log(hello());

// tsc 6.0.3, --module commonjs --ignoreDeprecations 6.0, then:
// --esModuleInterop false --allowSyntheticDefaultImports false
// Error TS1259: Module '".../legacy2/index"' can only be default-imported using the 'esModuleInterop' flag
// --esModuleInterop true: emits __importDefault(require("legacy2")), node prints
// → hi from CJS
// --esModuleInterop false (synthetic defaults stay on): compiles, emits
//   (0, legacy2_1.default)() with no helper, and node throws
// → TypeError: (0 , legacy2_1.default) is not a function
// tsc 7.0.2: --esModuleInterop false
// Error TS5108: Option 'esModuleInterop=false' has been removed. Please remove it from your configuration.
```

Every outcome above was printed by the named `tsc` version; the runtime lines are from Node 24.19.0.

## Pitfalls

- Enabling `allowSyntheticDefaultImports` to silence TS1259 in a project where `tsc` emits CommonJS. It type-checks and then crashes, as shown.
- Relying on a named import from a CommonJS file. On Node 24.19.0, with `exports["worl" + "d"] = ...`, `import { world } from "./named.cjs"` throws `SyntaxError: Named export 'world' not found`, while `mod.world` through the default import works.
- Writing `import * as fn from "cjs"` and calling it. On 6.0.3 it reports TS2497; on 7.0.2 the same import is accepted, typed as `{ default: () => string }`, and `fn()` is TS2349 (❓ I found no release note for this difference).
- Trusting `.d.ts` files that disagree with the runtime. A CJS package whose types say `export default f` while the file sets `exports.default`, imported from an ESM `.mts` file, gave TS2349 on both TS versions, and Node threw `TypeError: f is not a function`.

## Follow-ups

**Q:** Can CommonJS `require()` an ES module?
**A:** In Node 22.12 and later, if the module has no top-level `await` (handbook interop appendix, Node docs). TS allows it under `module: nodenext` since 5.8 and disallows it under `node18`.

**Q:** Do bundlers need `esModuleInterop`?
**A:** The handbook says yes for checking, because bundlers use an `esModuleInterop`-like scheme. `module: preserve` implies it, but emit is unaffected since imports are not rewritten.
