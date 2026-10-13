---
title: "What is the difference between type checking and transpiling, and why do bundlers skip checking?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [tsc, noemit, nocheck, isolatedmodules, esbuild, swc, babel, vite, transpile]
related:
  - typescript/the-compiler/type-erasure
  - typescript/the-compiler/node-type-stripping
  - typescript/modules-and-declaration-files/import-type-isolated-modules
  - typescript/tsconfig-and-strictness/skiplibcheck-declaration-sourcemaps
verified: 2026-10
sources:
  - https://www.typescriptlang.org/tsconfig/#noEmit
  - https://www.typescriptlang.org/tsconfig/#noEmitOnError
  - https://www.typescriptlang.org/tsconfig/#noCheck
  - https://www.typescriptlang.org/tsconfig/#isolatedModules
  - https://esbuild.github.io/content-types/#typescript-caveats
  - https://babeljs.io/docs/babel-plugin-transform-typescript
  - https://swc.rs/docs/usage/core
  - https://vite.dev/guide/features
tldr: >
  Type checking builds the whole program and reports type errors; transpiling rewrites one file
  from TypeScript to JavaScript and needs no types. `tsc` does both, but esbuild, swc and Babel
  only transpile, so they emit code with type errors. Run `tsc --noEmit` in CI for checking, and
  set `isolatedModules` so `tsc` flags what per-file tools cannot compile.
---

## Answer

**Type checking** needs the whole program: it resolves imports across files, builds types, and reports errors. **Transpiling** (emit) turns TypeScript into JavaScript. Because types are erased, most of that is deleting syntax, and it can be done one file at a time without knowing any type.

`tsc` does both, and they are independent: by default it writes output even when it reports errors (`noEmitOnError` is `false`). esbuild, swc and Babel's TypeScript preset only transpile. Babel's docs say plainly that its plugin "does not add the ability to type-check", and Vite's docs say the same of its transformer. They are faster because they skip the expensive part, and they can work per file in parallel.

So in a typical setup the two jobs are split:

- the bundler or runtime transpiles (fast feedback, no type information);
- `tsc --noEmit` type-checks, in CI and in the editor. The TSConfig reference describes `noEmit` as leaving emit to "another tool like Babel, or swc" while you keep TypeScript as the type-checker.

The catch is that a few constructs cannot be compiled correctly without type information. The classic one is an import or re-export that might be a type: a one-file tool cannot tell whether `Config` is erased or kept. `isolatedModules` makes `tsc` report those constructs (for example TS1205 for `export { Config } from "./types"`), so the code stays safe for per-file tools. esbuild's docs tell you to enable it.

`--noCheck` (TSConfig reference: released in 5.6) is the inverse of `--noEmit`: emit and skip type checking, useful when a faster tool already checked, such as in a separate CI job.

Gap to remember: if only the bundler runs on deploy, type errors ship.

## Example

```ts
// src/bad.ts            const n: number = "oops"; console.log(n.toFixed(1));
// TypeScript 7.0.2, esbuild 0.28.2, @swc/core 1.16.18, @babel/core 8.0.7 + preset-typescript

// tsc -p .            → error TS2322: Type 'string' is not assignable to type 'number'.
//                       exit 2, but out/bad.js was still written
// tsc -p . --noEmit   → the same error, exit 1 (5.9.3 and 6.0.3 exit 2), no files
// tsc -p . --noCheck  → exit 0, out/bad.js written

// esbuild, swc, Babel → no error; each printed:
//   const n = "oops";
//   console.log(n.toFixed(1));
// node out/bad.js     → TypeError: n.toFixed is not a function

// src/index.ts:  export { Config, defaults } from "./types.ts";   (Config is an interface)
// tsc --isolatedModules → error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.
// esbuild, swc, Babel   → kept `Config` in the export list (they cannot see it is a type)
// node src/main.ts      → (Node 24.19.0) SyntaxError: The requested module './types.ts' does not provide an export named 'Config'
```

## Pitfalls

- Treating a green bundler build as type safety. All three transpilers emitted the file above without complaint, and the program then crashed at runtime.
- Assuming `tsc` stops on errors. With errors it exited non-zero but still wrote `out/bad.js`. Set `noEmitOnError` if a failed check must block output, or use `--noEmit` and let another tool emit.
- Relying on an exact exit code. `--noEmit` with a type error exited 2 on 5.9.3 and 6.0.3 but 1 on 7.0.2; treat any non-zero as failure.
- Skipping `isolatedModules` when another tool emits. Without it, `tsc` (which can see across files) elides the type re-export and compiles cleanly, so the break only shows when the per-file tool or Node runs the code.

## Follow-ups

**Q:** Why can't esbuild just ask TypeScript for types?
**A:** Its design compiles each file independently for speed and parallelism; the esbuild docs list this as a TypeScript caveat. Full checking would need the whole program graph.

**Q:** Does `isolatedModules` change what `tsc` emits?
**A:** No. On 5.9.3, 6.0.3 and 7.0.2, a file using only `import type`/`export type` emitted byte-identical output with and without `--isolatedModules`; the flag added diagnostics, such as TS1205 for the re-export above.

## Exercises

### Which command catches this?

```ts
export const retries: number = "3";
```

Which of `tsc --noEmit`, esbuild, swc and Babel reports an error, and what do the others emit?

**Answer:** Only `tsc --noEmit` (`TS2322: Type 'string' is not assignable to type 'number'.`, checked on 7.0.2). esbuild, swc and Babel each emitted `export const retries = "3";`.
