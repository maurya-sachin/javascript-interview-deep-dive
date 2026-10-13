---
title: "What do `skipLibCheck`, `declaration`, and `sourceMap` do?"
status: draft
difficulty: easy
frequency: 3
core: false
tags: [skiplibcheck, declaration, declarationmap, sourcemap, noemit, tsconfig]
related:
  - typescript/modules-and-declaration-files/declaration-files
  - typescript/tsconfig-and-strictness/project-references
  - typescript/tsconfig-and-strictness/target-lib-module
verified: 2026-10
sources:
  - https://www.typescriptlang.org/tsconfig/#skipLibCheck
  - https://www.typescriptlang.org/tsconfig/#declaration
  - https://www.typescriptlang.org/tsconfig/#declarationMap
  - https://www.typescriptlang.org/tsconfig/#sourceMap
  - https://www.typescriptlang.org/tsconfig/#inlineSources
  - https://www.typescriptlang.org/tsconfig/#noEmit
  - https://www.typescriptlang.org/tsconfig/#emitDeclarationOnly
  - https://nodejs.org/docs/latest-v24.x/api/cli.html#--enable-source-maps
tldr: >
  `skipLibCheck` stops `tsc` type-checking `.d.ts` files (yours and `node_modules`'), trading
  accuracy for speed. `declaration` emits `.d.ts` files, `declarationMap` maps them back to the
  `.ts` source, `sourceMap` emits `.js.map` for debuggers, and `noEmit` makes `tsc` only type-check.
---

## Answer

- **`skipLibCheck`** (default `false`): skip type-checking every declaration file, both those in `node_modules` and your own `.d.ts`. Your code is still checked against those types; only errors *inside* the `.d.ts` are not reported. It saves time and hides broken or conflicting third-party typings (two copies of one library's types, for example). The TSConfig reference tags it *Recommended*, and for applications I turn it on. For a library, the generated `.d.ts` is what consumers load, so I would keep it off at least where I build and validate them.
- **`declaration`**: emit a `.d.ts` beside each JS file, describing the public API. A published package needs it; `composite` turns it on. `emitDeclarationOnly` skips the JS, for when another tool produces it. `declarationDir` moves the `.d.ts` files elsewhere.
- **`declarationMap`**: emit `.d.ts.map` so "Go to Definition" lands in the `.ts` source instead of the `.d.ts`. The reference suggests it when you use project references.
- **`sourceMap`**: emit `.js.map` and append `//# sourceMappingURL=...` to the JS, so debuggers and error reports show TypeScript lines. Node ignores maps unless started with `--enable-source-maps`. `inlineSources` embeds the original source in the map; `inlineSourceMap` puts the map in the JS file and excludes `sourceMap`.
- **`noEmit`**: write nothing. Use it when a bundler, esbuild, or Node's type stripping produces the JavaScript and `tsc` is only the type-checker in CI.

Emit flags do not depend on errors: `noEmitOnError` defaults to `false`, so output is written even when type errors are reported.

## Example

```ts
// TypeScript 7.0.2 (the 5.9.3 greet.d.ts.map was byte-identical)
// tsconfig: { "compilerOptions": { "outDir": "out", "rootDir": "src", "declaration": true, "declarationMap": true, "sourceMap": true, ... } }
// src/greet.ts:  line 2:  if (name === "") throw new Error("empty name");

// tsc -p .   → out/greet.js  out/greet.js.map  out/greet.d.ts  out/greet.d.ts.map  (and the same for main)
// out/greet.d.ts
//   export declare function greet(name: string): string;
//   //# sourceMappingURL=greet.d.ts.map

// node out/main.js
// →   throw new Error("empty name");        (points into out/greet.js)
// node --enable-source-maps out/main.js
// → .../src/greet.ts:2                       (points into the .ts file)
// →   if (name === "") throw new Error("empty name");

// tsc -p . --noEmit            → no out/ directory
// tsc -p . --emitDeclarationOnly → only the .d.ts and .d.ts.map files
```

## Pitfalls

- Treating `skipLibCheck` as harmless. With a broken `node_modules/bad-types/index.d.ts` and a broken own `src/own.d.ts`, `tsc` printed `TS2304` for both on 5.9.3, 6.0.3 and 7.0.2; with `--skipLibCheck` it printed nothing, so your own `.d.ts` mistakes also disappear.
- Setting `sourceMap` and expecting Node stack traces to change. Without `--enable-source-maps` the trace still pointed at `out/greet.js`.
- Using `noEmit` and then looking for declarations. `declaration: true` with `noEmit` wrote no files; use `emitDeclarationOnly` to emit only `.d.ts`.
- Shipping source maps without sources. `sourceMap` alone references `../src/greet.ts` by path; add `inlineSources` (the map then has `sourcesContent`) when the original files will not be published.

## Follow-ups

**Q:** Does `skipLibCheck` change what types my code sees?
**A:** No: imported declarations are still used to type your code. Only diagnostics reported inside declaration files are skipped.

**Q:** What is `skipDefaultLibCheck`?
**A:** The reference says to use `skipLibCheck` instead; it only skips TypeScript's own default `lib` files.
