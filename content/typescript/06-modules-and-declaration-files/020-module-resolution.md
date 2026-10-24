---
title: "How does `moduleResolution` work, and when do you use `bundler` or `nodenext`?"
status: draft
difficulty: hard
frequency: 4
core: false
tags: [moduleresolution, nodenext, bundler, package-exports, file-extensions, tsconfig]
related:
  - typescript/modules-and-declaration-files/import-type-isolated-modules
  - typescript/modules-and-declaration-files/esm-cjs-interop
  - typescript/tsconfig-and-strictness/target-lib-module
  - typescript/tsconfig-and-strictness/paths-and-extends
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/modules/reference.html
  - https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html
  - https://www.typescriptlang.org/tsconfig/#moduleResolution
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
  - https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
  - https://nodejs.org/docs/latest-v24.x/api/packages.html
  - https://nodejs.org/docs/latest-v24.x/api/esm.html
tldr: >
  `moduleResolution` tells `tsc` how an import specifier maps to a file, and it must copy the real
  resolver. Use `nodenext` when Node runs your output: extensions are required and package
  `exports` is enforced. Use `bundler` (with `module: preserve`) when a bundler handles the files.
  `node10` and `classic` are deprecated in TS 6.0 and removed in 7.0.
---

## Answer

Two options work as a pair. `module` says what import syntax your output uses. `moduleResolution` says how `tsc` finds the file behind `"./util.js"` or `"dep/feature"`. TypeScript does not resolve modules on its own terms: the setting should **mimic the tool that will actually run your code**, or `tsc` accepts imports that fail at runtime (or rejects ones that work).

- **`nodenext`** (also `node16`, `node18`, `node20`). Models Node.js. Each file is ESM or CommonJS depending on its extension (`.mts`/`.cts`) and the nearest `package.json` `"type"`. In ESM files, relative imports need an explicit extension, and you write the *output* extension (`./util.js` finds `util.ts`). Packages are entered through `"exports"`, with the `import` or `require` condition chosen per file. Setting `module: nodenext` implies `moduleResolution: nodenext`, and mismatches are errors (TS5109/TS5110).
- **`bundler`**. Models Vite, webpack, esbuild, Bun. Extensionless paths and directory indexes are allowed, and `"exports"` and `"imports"` are honoured. Pair it with `module: preserve` (or `esnext`), usually with `noEmit`.
- **`node10`** and **`classic`**. Legacy. `node10` ignores `"exports"`. TS 6.0 deprecated both; TS 7.0 removed them.

Choose by who consumes the emitted JavaScript: Node directly gives `nodenext`; a bundler or runtime that reads TypeScript gives `bundler`. For libraries, the TypeScript docs advise `nodenext`-style settings: `bundler` accepts extensionless relative exports that then break in Node.

Conditions in `"exports"` are tried in object order, and `tsc` always matches `types` and `default`, so list `types` before `default`. A subpath not listed in `"exports"` cannot be imported, in `tsc` or in Node.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3. package.json: { "type": "module" }; tsconfig: "module": "nodenext"
// node_modules/dep/package.json "exports": {
//   ".":         { "types": "./index.d.ts",   "default": "./index.js" },
//   "./feature": { "types": "./feature.d.ts", "default": "./feature.js" } }
// (internal.d.ts exists in the package folder but is not exported)

import { helper } from "./util";
// Error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './util.js'?
import { helper as same } from "./util.js"; // OK: tsc finds util.ts
import { dep } from "dep";                  // OK: "." entry
import { feature } from "dep/feature";      // OK: listed subpath
import { secret } from "dep/internal.js";
// Error TS2307: Cannot find module 'dep/internal.js' or its corresponding type declarations.
```

With `--module preserve` (which selects `bundler`) the first error disappears and the last one remains, on both versions. Compiled with `nodenext` and run on Node 24.19.0, the extensionless import threw `ERR_MODULE_NOT_FOUND` and the unexported subpath threw `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## Pitfalls

- Using `bundler` for code you publish or run in Node. It never requires extensions, so `tsc` passes code that Node rejects with `ERR_MODULE_NOT_FOUND`.
- Writing `./util.ts` or `./util` instead of `./util.js` under `nodenext`. Write the extension of the file that will exist after the build.
- Leaving `moduleResolution` unset and expecting Node's rules. On 6.0.3 and 7.0.2, `--traceResolution` reports `using 'Bundler'` for `module: esnext` and even `commonjs` (5.x picked `classic` or `node10`), so extensionless imports pass; the tsconfig reference's default table still describes 5.x.
- Expecting `node10` to follow `"exports"`. On 6.0.3 (TS5107 unless `ignoreDeprecations: "6.0"`) it resolved `dep` through `"types": "./legacy.d.ts"` instead, and `dep/internal.js` was accepted. On 7.0.2 the option is an error (TS5108).

## Follow-ups

**Q:** Can a CommonJS file `require()` an ESM-only package?
**A:** Under `module: nodenext` since TS 5.8, per its release notes (Node 22+), and under `node20`. `node18` still disallows it (TS1479). A `.cts` file importing the ESM-only `dep` compiled to `require("dep")` on 6.0.3 and 7.0.2.

**Q:** How do I see why a specifier resolved where it did?
**A:** `tsc --traceResolution`. For `dep/feature` it printed the conditions tried (`import`, `types`, `node`), `Matched 'exports' condition 'types'`, and the final `.d.ts` path (6.0.3 and 7.0.2).
