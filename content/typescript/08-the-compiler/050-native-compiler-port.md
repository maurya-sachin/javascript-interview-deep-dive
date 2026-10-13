---
title: "What is the native (Go) port of the TypeScript compiler?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [typescript-7, native-port, go, tsgo, performance, language-server, compiler-api]
related:
  - typescript/the-compiler/compiler-pipeline
  - typescript/the-compiler/checking-vs-emitting
  - typescript/tsconfig-and-strictness/strict-mode-flags
  - typescript/tsconfig-and-strictness/target-lib-module
verified: 2026-10
sources:
  - https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
  - https://devblogs.microsoft.com/typescript/typescript-native-port/
  - https://devblogs.microsoft.com/typescript/announcing-typescript-native-previews/
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
  - https://github.com/microsoft/typescript-go/discussions/411
  - https://github.com/microsoft/typescript-go
  - https://github.com/microsoft/TypeScript/blob/main/tsc/CHANGES.md
tldr: >
  TypeScript 7.0 (July 2026) is the compiler and language server ported from TypeScript to Go
  and shipped as the normal `typescript` package with a native `tsc`. It is a port, not a
  redesign: same checking as 6.0, with parallel parse, check and emit, about 8-12x faster on
  large builds. 7.0 has no JavaScript API, so API-based tools stay on 6.0.
---

## Answer

TypeScript 7 is a **native port**: the compiler and language service written in TypeScript (internal codename *Strada*, versions up to 6.x) were ported to Go (*Corsa*). The team's stated aim was to keep it faithful: same logic and structure, so results stay consistent between the two. Go was chosen because idiomatic Go resembles the existing code, giving a structurally similar codebase that makes porting changes feasible, with memory-layout control and a garbage collector that costs little for a batch compiler (from the team's "Why Go?" discussion).

Gains come from native code plus **parallelism**: 7.0 parses, type-checks and emits in parallel. The announcement reports 8x to 12x faster full builds on large open-source projects (vscode 125.7s to 10.6s) and an editor that loads far faster.

What it means in practice:

- **Install and CLI.** `npm i -D typescript` now gives a native `tsc` (my 7.0.2 install used a per-platform binary package). The previews used `@typescript/native-preview` and `tsgo`; nightlies move to `typescript@next`. New flags: `--checkers`, `--builders`, `--singleThreaded`.
- **Same language, 6.0 defaults.** 7.0 adopts 6.0's defaults (`strict: true`, `types: []`, …) and turns 6.0's deprecations into hard errors, such as `target: es5` and `moduleResolution: node10`.
- **Editor.** The language server speaks the Language Server Protocol instead of the old `tsserver` protocol.
- **No JavaScript API in 7.0.** Tools that import `typescript` (typescript-eslint, Volar-based Vue/Astro/Svelte tooling) stay on 6.0, side by side via `@typescript/typescript6` (which provides `tsc6`). A new API is expected in 7.1.

For migration I would first move to 6.0, fix its deprecations (`--stableTypeOrdering` helps compare outputs), then switch the CLI to 7.

## Example

```text
# 38-file Vite/React app in this repo, tsc --noEmit, 3 runs each, Apple M1 Pro, wall time
5.9.3   1.09s  1.07s  1.15s
6.0.3   1.10s  1.02s  1.05s
7.0.2   0.21s  0.16s  0.16s      (--singleThreaded: 0.25s 0.24s 0.24s)

# deprecations: tsc --noEmit --target es5 --moduleResolution node a.ts
5.9.3  (no output)
6.0.3  error TS5107: Option 'moduleResolution=node10' is deprecated and will stop functioning in TypeScript 7.0. …
7.0.2  error TS5108: Option 'moduleResolution=node10' has been removed. Please remove it from your configuration.
       error TS5108: Option 'target=ES5' has been removed. …
# 6.0.3 with --ignoreDeprecations 6.0 → exit 0; 7.0.2 with it still → TS5108

# package.json: "@typescript/native": "npm:typescript@7.0.2", "typescript": "npm:@typescript/typescript6@6.0.2"
tsc -v → 7.0.2     tsc6 -v → 6.0.3     require("typescript").createProgram → function (6.0.3)
```

## Pitfalls

- Expecting identical speedups. On the repo's small app the gap was about 6x (about 1.1s to 0.16s), not 10x; the announced numbers are for large codebases and several cores. One machine, three runs each, no warm-up control.
- Importing the compiler API from 7.0. `require("typescript")` on 7.0.2 returned only `{ version, versionMajorMinor }`; the 7.0 announcement says it ships no API. Pin `typescript` to the 6.0 compat package for tools that need it.
- Assuming 7.0 reads old configs. `target: es5`, `moduleResolution: node10` and similar now fail with `TS5108` and `--ignoreDeprecations 6.0` no longer helps. Also `tsc a.ts` with a `tsconfig.json` present errors with `TS5112` on 6.0.3 and 7.0.2 unless you pass `--ignoreConfig`.
- Treating `--checkers`/`--singleThreaded` as correctness knobs. The announcement says the number of checkers can, in rare cases, surface order-dependent results, so pin one number in CI. (Not reproduced here.)

## Follow-ups

**Q:** Why not rewrite it from scratch or use Rust?
**A:** The team says many languages would suit a ground-up rewrite, but they wanted a port that preserves behavior and code structure so changes can move between the two codebases. Go fit that best. I only read their stated reasons, not the prototypes.

**Q:** Where does the Go code live?
**A:** The `typescript-go` repo is closed and says development continues in `microsoft/TypeScript`; on `main` there I listed `tsc/internal/` containing `scanner`, `parser`, `binder`, `checker`, `printer`, `transformers`, `ls` and `lsp`. How each is implemented I did not read: ❓.

**Q:** What is still different from 6.0?
**A:** `tsc/CHANGES.md` lists intentional changes; JavaScript/JSDoc support was rewritten rather than ported, and declaration emit from `.js` files differs. The 7.0 post lists the removed JSDoc forms.
