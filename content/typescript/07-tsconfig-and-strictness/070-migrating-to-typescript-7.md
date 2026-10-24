---
title: "How do you migrate a project from TypeScript 6 to TypeScript 7?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [typescript-7, typescript-6, migration, ignoredeprecations, deprecations, checkers, tsconfig]
related:
  - typescript/the-compiler/native-compiler-port
  - typescript/tsconfig-and-strictness/types-and-output-directories
  - typescript/tsconfig-and-strictness/paths-and-extends
  - typescript/modules-and-declaration-files/module-resolution
  - typescript/modules-and-declaration-files/esm-cjs-interop
verified: 2026-10
perishable:
  - "6.0 deprecations are hard errors (TS5108) in 7.0.2"
  - "--checkers defaults to 4; 7.0 has no stable API"
sources:
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
  - https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
  - https://github.com/microsoft/TypeScript/blob/main/tsc/CHANGES.md
tldr: >
  Go through 6.0 first. Make the project compile on 6.0 with no `ignoreDeprecations` and with
  `--stableTypeOrdering`, because 7.0 deletes every option 6.0 deprecated (`target: es5`,
  `moduleResolution: node`, `baseUrl`, `outFile`, AMD/UMD/System, …). Then switch `tsc`, tune
  `--checkers`, and keep 6.0 beside it for tools that need the compiler API.
---

## Answer

TypeScript 7.0 is the native port with 6.0's defaults; 6.0 was the bridge release that deprecated everything 7.0 removes. So the migration is mostly a **6.0 cleanup**:

1. **Upgrade to 6.0 and remove `ignoreDeprecations`.** On 6.0.3 each deprecated option is TS5101/TS5107. `"ignoreDeprecations": "6.0"` silences them, but 7.0.2 ignores that and reports TS5102/TS5108 ("has been removed").
2. **Replace what 7.0 removes** (6.0 release notes):
   - `target: es5`, `downlevelIteration` → ES2015+; use another tool for ES5.
   - `moduleResolution: node`/`classic` → `nodenext` or `bundler`.
   - `module: amd`/`umd`/`system`/`none`, `outFile` → ESM plus a bundler.
   - `baseUrl` → fold it into `paths`, which must then be relative (`"./src/*"`, else TS5090 on 6.0.3 and 7.0.2).
   - `esModuleInterop`/`allowSyntheticDefaultImports`/`alwaysStrict: false` → delete; they're always on.
   - Syntax: `module Foo {}` → `namespace` (TS1540), `assert {}` → `with {}` (TS2880).
3. **Set the new defaults explicitly** where you relied on old ones: `types` (now `[]`), `rootDir` (now the tsconfig folder), `strict` (now `true`), `module`/`target` (now `esnext`/`es2025`).
4. **Compare outputs with `--stableTypeOrdering` on 6.0.** The 7.0 announcement says code that compiles cleanly on 6.0 with it, and without `ignoreDeprecations`, should compile identically on 7.0. It's diagnostic only: the 6.0 notes warn of up to 25% slowdown.
5. **Switch the CLI.** `--checkers` (default 4) sets type-checking workers per project and `--builders` sets concurrent project-reference builds; more of either costs memory. `--singleThreaded` turns parallelism off for constrained CI.
6. **Keep 6.0 for API consumers.** 7.0 has no stable JavaScript API, so typescript-eslint and language-service-plugin tools stay on `@typescript/typescript6` (`tsc6`) until 7.1.

JavaScript projects also check `tsc/CHANGES.md` in the TypeScript repo: JSDoc support was rewritten and some old forms are gone.

## Example

```ts
// tsconfig.json (legacy): target es5, moduleResolution node, baseUrl ".", paths {"@/*": ["src/*"]},
//                         esModuleInterop false, downlevelIteration true
// tsc 6.0.3 -p .
// error TS5107: Option 'target=ES5' is deprecated and will stop functioning in TypeScript 7.0.
//   Specify compilerOption '"ignoreDeprecations": "6.0"' to silence this error.
// error TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0. …
//   (also moduleResolution=node10, esModuleInterop=false, downlevelIteration)
// tsc 6.0.3 -p . --ignoreDeprecations 6.0   → only the source error is left:
// error TS1540: A 'namespace' declaration should not be declared using the 'module' keyword.
//   Please use the 'namespace' keyword instead.

// tsc 7.0.2 -p .   (with or without --ignoreDeprecations 6.0)
// error TS5108: Option 'target=ES5' has been removed. Please remove it from your configuration.
// error TS5102: Option 'baseUrl' has been removed. Please remove it from your configuration.
//   Use '"paths": {"*": ["./*"]}' instead.
// error TS5090: Non-relative paths are not allowed. Did you forget a leading './'?
//   (also TS5108 for moduleResolution=node10, esModuleInterop=false; TS5102 for downlevelIteration)

// fixed: { "target": "es2022", "module": "nodenext", "paths": { "@/*": ["./src/*"] },
//          "outDir": "dist", "rootDir": "src", "types": [] }   + `namespace Legacy`
// → no errors on 6.0.3 (also with --stableTypeOrdering) and on 7.0.2 (also with --checkers 2)
```

## Pitfalls

- Shipping with `ignoreDeprecations: "6.0"` and calling the migration done. It defers the work; 7.0.2 fails on the same config.
- Putting `"checkers": 2` in a tsconfig that `tsc6` also reads. 7.0.2 accepts it there; 6.0.3 rejects it with TS5025 (`Unknown compiler option 'checkers'`). Pass it on the 7.0 command line instead.
- Removing `baseUrl` but leaving `paths` entries like `"src/*"`. Without a base they must start with `./` (TS5090 on both versions).
- Expecting every 6.0 deprecation to be skippable. `module Foo {}` (TS1540) and `assert { type: "json" }` (TS2880) were errors on 6.0.3 even with `ignoreDeprecations`.

## Follow-ups

**Q:** Is there a codemod for the config changes?
**A:** The 6.0 release notes point to an experimental `ts5to6` tool that rewrites `baseUrl` and `rootDir` settings; review its diff like any other config change.

**Q:** What does `--stableTypeOrdering` do on 7.0?
**A:** 7.0.2's `tsc --all` lists it as a boolean that defaults to `true`: 7.0 always orders types deterministically, which 6.0 can only imitate with the flag.
