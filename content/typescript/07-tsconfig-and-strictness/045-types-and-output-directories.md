---
title: "What do `types`, `typeRoots`, `rootDir`, and `outDir` default to, and what changed in TypeScript 6?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [types, typeroots, rootdir, outdir, typescript-6, tsconfig]
related:
  - typescript/tsconfig-and-strictness/paths-and-extends
  - typescript/tsconfig-and-strictness/project-references
  - typescript/tsconfig-and-strictness/migrating-to-typescript-7
  - typescript/modules-and-declaration-files/declaration-files
verified: 2026-10
perishable:
  - "types defaults to [] and rootDir to the tsconfig folder since 6.0"
  - "TS5011 when outDir is set and the inferred root differs"
sources:
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
  - https://www.typescriptlang.org/tsconfig/types.html
  - https://www.typescriptlang.org/tsconfig/typeRoots.html
  - https://www.typescriptlang.org/tsconfig/rootDir.html
  - https://www.typescriptlang.org/tsconfig/outDir.html
tldr: >
  `types` lists the `@types` packages whose globals load without an import; since TS 6.0 it
  defaults to `[]`, so `process` or `describe` need `"types": ["node", "jest"]`. `typeRoots` is
  where those names are looked up (every `node_modules/@types` upward). `rootDir` now defaults to
  the tsconfig's folder instead of being inferred; `outDir` unset means `.js` lands beside `.ts`.
---

## Answer

**`types` and `typeRoots`: which global declarations load.**
- Imports never depend on them: `import { m } from "modlib"` finds `@types/modlib` whatever `types` says (tsconfig reference).
- They control packages that add *globals*, like `process` from `@types/node` or `describe` from `@types/jest`.
- **TS 6.0 changed the `types` default to `[]`.** Before, `tsc` loaded every visible `@types` package. The 6.0 release notes say this was very expensive and that many projects built 20–50% faster with `types` set. You now list what you need (`"types": ["node", "jest"]`), or write `["*"]` for the old behaviour.
- `typeRoots` is where `types` names are found: by default every `node_modules/@types` from the tsconfig folder upward; set it and *only* those folders count.

**`rootDir` and `outDir`: where output goes.**
- `outDir` unset: each `.js` is written next to its `.ts`.
- With `outDir`, the output mirrors the source tree **relative to `rootDir`**. Before 6.0, `rootDir` was inferred as the common folder of all inputs, so `src/index.ts` became `dist/index.js`. **Since 6.0 it defaults to the folder containing `tsconfig.json`** (inferred only when running `tsc` without a tsconfig), so the same file becomes `dist/src/index.js`.
- 6.0.3 and 7.0.2 don't change your layout silently: with `outDir` set, no `rootDir`, and inputs that share a deeper folder, they report TS5011 and name the folder to use. Set `"rootDir": "./src"`.
- Every input must be under `rootDir`, or TS6059.

7.0 keeps both 6.0 defaults; I saw identical results on 6.0.3 and 7.0.2.

## Example

```ts
// node_modules/@types/globlib/index.d.ts: declare const GLOB: string;
// node_modules/@types/modlib/index.d.ts:  export declare const m: number;
// src/index.ts
import { m } from "modlib";          // resolves regardless of "types"
export const out = GLOB + m;

// tsconfig: { "compilerOptions": { "module": "nodenext", "outDir": "dist" } }   (6.0.3 and 7.0.2)
// Error TS5011: The common source directory of 'tsconfig.json' is './src'. The 'rootDir' setting
//   must be explicitly set to this or another path to adjust your output's file layout.
// (still emits, to dist/src/index.js)

// + "rootDir": "src"
// Error TS2304: Cannot find name 'GLOB'.     (types defaults to [])
// emits dist/index.js

// + "types": ["globlib"]   (or ["*"])
// → no errors; dist/index.js

// "rootDir": "src" and a stray scripts/build.ts matched by the default include
// Error TS6059: File '.../scripts/build.ts' is not under 'rootDir' '.../src'.
//   'rootDir' is expected to contain all source files.
```

## Pitfalls

- Reading only the first error. While TS5011 (a config error) was present, neither version printed the `GLOB` error; it appeared only after `rootDir` was set.
- Adding `typeRoots: ["./typings"]` and expecting its packages to load. With `types` at its new default `[]`, nothing loads until you name them in `types` (or use `"*"`). And once `typeRoots` is set, `"types": ["globlib"]` from `node_modules/@types` was TS2688 on both versions.
- Treating a `.d.ts` under the project folder as needing `types`. Files matched by `include` are always in the program; `types` only governs `@types`-style packages.
- Upgrading a build script that copies `dist/index.js`. If you add `"rootDir": "."` to silence TS5011, output moves to `dist/src/`; use the folder TS5011 names.

## Follow-ups

**Q:** Why did TS 6.0 change these defaults?
**A:** Speed and predictability, per the release notes: enumerating every `@types` package was expensive, and inferring `rootDir` meant analysing every input path, and a file's project couldn't be known without loading the whole project.

**Q:** Does `noEmit` care about `rootDir`?
**A:** No output, no layout. With `noEmit: true` (even alongside `outDir`) the same project gave no TS5011 on either version.
