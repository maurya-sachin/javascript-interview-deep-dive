---
title: "How do `paths`, `baseUrl`, and `extends` work?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [paths, baseurl, extends, include, exclude, tsconfig]
related:
  - typescript/modules-and-declaration-files/module-resolution
  - typescript/tsconfig-and-strictness/project-references
  - typescript/tsconfig-and-strictness/target-lib-module
verified: 2026-10
sources:
  - https://www.typescriptlang.org/tsconfig/#paths
  - https://www.typescriptlang.org/tsconfig/#extends
  - https://www.typescriptlang.org/tsconfig/#include
  - https://www.typescriptlang.org/tsconfig/#exclude
  - https://www.typescriptlang.org/docs/handbook/modules/reference.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
  - https://github.com/microsoft/TypeScript/pull/62509
tldr: >
  `paths` only tells `tsc` where an alias lives; it never rewrites the emitted import, so your
  bundler or runtime needs the same alias. `baseUrl` is removed in TS 7. `extends` copies a base
  config; `include`, `exclude` and `files` replace rather than merge, and `exclude` does not stop imports.
---

## Answer

**`paths`** maps an import specifier to a location for the type checker. Patterns have at most one `*`; the longest matching prefix wins; each key may list fallbacks. It does **not** change the emitted import. A `@lib/util.js` import is written to the output exactly as typed, so the runtime or bundler must resolve the alias itself (via bundler config, or Node's `package.json` `"imports"`, which the TypeScript docs call a standard replacement for aliases). Libraries should not use `paths` aliases: consumers cannot resolve them. Do not point `paths` at `node_modules` or monorepo packages; resolution then skips `exports` and `main`. Use workspaces symlinks.

**`baseUrl`** (from the AMD era) made bare specifiers resolve from a directory, and `paths` values were relative to it. Since TS 4.1 `paths` needs no `baseUrl` and resolves relative to the config file. TS 6.0 deprecated `baseUrl` (TS5101) and TS 7.0 removed it (TS5102): fold its directory into each `paths` value.

**`extends`** loads a base config first, then applies the child over it. Relative paths in a config resolve against the file that wrote them. Since TS 5.0 it accepts an array; later entries win. `references` is the one top-level key not inherited.

**What gets compiled**: `files` is an exact list (a missing file is an error); `include` is a glob list (default `**/*` when `files` is absent); `exclude` only filters what `include` found. A file excluded this way still compiles if something imports it, references it, or lists it in `files`. `files`, `include` and `exclude` in the child replace the base's, they are not merged.

## Example

```jsonc
// TypeScript 7.0.2 and 6.0.3. package.json: { "type": "module" }
// configs/base.json: { "compilerOptions": { "outDir": "../out", "module": "nodenext", ... }, "include": ["../src"] }
// tsconfig.json
{
  "extends": "./configs/base.json",
  "compilerOptions": { "rootDir": "./src", "paths": { "@lib/*": ["./src/lib/*"] } },
  "include": ["src"],
  "exclude": ["tests"]
}
// src/main.ts:  import { double } from "@lib/util.js";   ← resolves to src/lib/util.ts, tsc is happy
```

`tsc -p .` printed no errors on both versions, and `out/main.js` began `import { double } from "@lib/util.js";`. Running it on Node 24.19.0 threw `ERR_MODULE_NOT_FOUND: Cannot find package '@lib/util.js'`. `tsc --showConfig` showed `"outDir": "./out"` (base's `../out` rewritten against the root) and `"include": ["src"]` only (the base's list was replaced).

## Pitfalls

- Assuming `paths` rewrites output. It does not; add the same alias to the bundler, or use `"imports"` in `package.json`.
- Writing an extensionless alias under `nodenext`. On 6.0.3 and 7.0.2, `@lib/util` gave `TS2307` while `@lib/util.js` resolved; the mapped path follows the normal relative-path rules for the `moduleResolution` mode.
- Expecting `paths` in a child to add to the base's. Setting `paths` in the child replaced the base's entirely (`--showConfig`, 6.0.3 and 7.0.2).
- Using `exclude` to keep a file out of the build. `src/main.ts` importing `../tests/main.test.js` made `tests/main.test.ts` appear in `--listFiles` despite `"exclude": ["tests"]`.

## Follow-ups

**Q:** Which `extends` entry wins in an array?
**A:** The last. With `a1` setting `noImplicitAny: false` and `a2` setting `true`, `["./a1.json", "./a2.json"]` gave `true` in `--showConfig`; reversing the array gave `false` (6.0.3 and 7.0.2).

**Q:** What changed for `rootDir` in 6.0?
**A:** It defaults to the config's directory instead of being inferred. With sources in `src/` and no `rootDir`, 6.0.3 and 7.0.2 reported `TS5011` (common source directory is `./src`); 5.x inferred `src` silently.
