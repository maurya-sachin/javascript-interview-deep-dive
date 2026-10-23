---
title: "What are project references, and how do `composite` and `incremental` help?"
status: draft
difficulty: hard
frequency: 3
core: false
tags: [project-references, composite, incremental, tsbuildinfo, build-mode, monorepo]
related:
  - typescript/tsconfig-and-strictness/paths-and-extends
  - typescript/tsconfig-and-strictness/skiplibcheck-declaration-sourcemaps
  - typescript/modules-and-declaration-files/module-resolution
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/project-references.html
  - https://www.typescriptlang.org/tsconfig/#composite
  - https://www.typescriptlang.org/tsconfig/#incremental
  - https://www.typescriptlang.org/tsconfig/#tsBuildInfoFile
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-6.html
  - https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
tldr: >
  A project reference splits a codebase into separately compiled projects: importers read the
  dependency's output `.d.ts` instead of its source. `composite` makes a project referenceable
  (it implies `declaration` and `incremental`), and `tsc -b` builds in order and skips anything
  whose inputs and dependency declarations did not change.
---

## Answer

A **project reference** is an entry in `references` pointing at another `tsconfig.json`. The referenced project must set **`composite: true`**. After that, importing from it loads its output declaration (`.d.ts`) rather than re-checking its source, so a package is checked once, and projects cannot import files outside their own `include`. This gives layering (tests cannot be imported by `src`), separate output folders, and faster editor and CI checks.

What `composite` enforces: `declaration` is on (turning it off is `TS6304`), `rootDir` defaults to the config's folder, every source file must be matched by `include` or `files`, and `incremental` defaults to true.

**`incremental`** saves the previous program's state to a `.tsbuildinfo` file so the next run re-checks and re-emits only what changed. It works on a single project and is not tied to references.

**`tsc --build` (`-b`)** is the orchestrator. It finds the referenced projects, builds them in dependency order, and skips projects that are up to date. A plain `tsc -p app` does not build its dependencies. If a dependency's source changes but its `.d.ts` output does not (a function body edit), dependents are not rebuilt; only their timestamps are updated.

Since TS 5.6, `-b` continues past errors in upstream projects and writes best-effort output; `--stopBuildOnErrors` stops at the first failing project. TS 7.0 adds an experimental `--builders N` flag for building several projects in parallel.

Practical layout: a base config for shared options, one `composite` project per package, and a "solution" root with `"files": []` and the list of references. Consume sibling packages by package name (workspaces symlinks), not by relative paths across project folders.

## Example

```jsonc
// TypeScript 7.0.2, excerpts without timestamps (6.0.3 decided the same; its last line names input 'packages/core'). Layout: packages/core, packages/app
// packages/core/tsconfig.json: { "extends": "../../tsconfig.base.json", "compilerOptions": { "rootDir": "src", "outDir": "dist" }, "include": ["src"] }
// packages/app/tsconfig.json:  same, plus "references": [{ "path": "../core" }]
// tsconfig.base.json: { "compilerOptions": { "composite": true, "strict": true, "module": "nodenext", ... } }
// tsconfig.json (root): { "files": [], "references": [{ "path": "packages/core" }, { "path": "packages/app" }] }
// app imports: import { add } from "@demo/core";  (node_modules/@demo/core → packages/core)

// tsc -b --verbose, first run
// → Project 'packages/core/tsconfig.json' is out of date because output file 'packages/core/tsconfig.tsbuildinfo' does not exist
// → Project 'packages/app/tsconfig.json' is out of date because output file 'packages/app/tsconfig.tsbuildinfo' does not exist
// tsc -b --verbose, after changing only a function body in core
// → Building project 'packages/core/tsconfig.json'...
// → Project 'packages/app/tsconfig.json' is up to date with .d.ts files from its dependencies
// tsc -b --verbose, after changing core's exported signature
// → Project 'packages/app/tsconfig.json' is out of date because output 'packages/app/tsconfig.tsbuildinfo' is older than input 'packages/core/dist/index.d.ts'
```

After `tsc -b`, `node packages/app/dist/main.js` printed `3`.

## Pitfalls

- Running `tsc -p packages/app` before core is built. With the package import above it gave `TS2307: Cannot find module '@demo/core'` on 6.0.3 and 7.0.2; with a relative import into core, both gave `TS6305: Output file ... has not been built from source file`. Use `tsc -b`.
- Importing a sibling by relative path (`../../core/src/index.js`). `tsc` was satisfied through the reference, but the emitted import stayed as written and Node threw `ERR_MODULE_NOT_FOUND` because `core/src/index.js` does not exist.
- Importing a project's files without listing it in `references`: `TS6307: File ... is not listed within the file list of project`. The same import also tripped `TS6059` (not under `rootDir`).
- Trusting the Handbook's statement that `-b` acts as `noEmitOnError`. On 6.0.3 and 7.0.2 a type error in core still wrote `core/dist` and built `app/dist`, as the 5.6 notes describe. Note: the 5.6 notes call the stop flag `--stopOnBuildErrors`, but the CLI flag is `--stopBuildOnErrors` (7.0.2 said `TS5072: Unknown build option '--stopOnBuildErrors'`; 6.0.3 said TS5077 and suggested `stopBuildOnErrors`).

## Follow-ups

**Q:** Do I need `composite` just for faster rebuilds?
**A:** No. `incremental: true` alone wrote `out/tsconfig.tsbuildinfo`, and a second run with no changes emitted nothing (`--listEmittedFiles`, 6.0.3 and 7.0.2). `composite` is for being referenced.

**Q:** Where does the `.tsbuildinfo` go?
**A:** Per the reference it depends on `outDir`, `rootDir` and the config name. Here, with `rootDir: src` and `outDir: dist`, it was `packages/core/tsconfig.tsbuildinfo`, beside the config.

**Q:** Why can the editor still jump to source across projects?
**A:** Per the Handbook, `declarationMap` enables Go to Definition and Rename across projects, and VS Code (since 3.7) generates declarations in memory from source. `disableSourceOfProjectReferenceRedirect` opts out of that for very large setups. ❓ I did not test editor behavior.
