# 07 — tsconfig and strictness

> **Status:** 🔴 planned · **Published:** 0/9 · **Last verified:** —

What `tsconfig.json` controls: strictness flags, targets and libs, path mapping, and project references.

## Learning goals

After this chapter you can:

- List what `strict` turns on and why `strictNullChecks` matters most
- Explain flags beyond `strict`, such as `noUncheckedIndexedAccess`
- Distinguish `target`, `lib`, and `module`
- Explain that `paths` does not rewrite emitted imports
- Set up project references for a monorepo

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- `strict` family: `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `strictPropertyInitialization`, … → 010
- `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns` → 020
- `noUnusedLocals` / `noUnusedParameters`, `noFallthroughCasesInSwitch` → 025
- Emit target vs available types vs module format; no polyfilling → 030
- Path mapping (types only), `extends`, `include` / `exclude` / `files` → 040
- `types` / `typeRoots` (default `[]` since 6.0), `rootDir` / `outDir` defaults → 045
- Project references, `composite`, `tsc -b`, incremental builds → 050
- `skipLibCheck`, `declaration`, `declarationMap`, `sourceMap`, `noEmit` → 060
- TS 6 → 7 migration: `ignoreDeprecations`, removed options, `--checkers` / `--builders` → 070

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What does `strict` enable, and why is `strictNullChecks` the important one?](010-strict-mode-flags.md) | medium | 🟡 draft |
| 020 | [Which flags beyond `strict` do you turn on, such as `noUncheckedIndexedAccess`?](020-flags-beyond-strict.md) | medium | 🟡 draft |
| 025 | [What do `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch` catch, and when do you leave them to a linter?](025-unused-and-fallthrough-checks.md) | easy | 🔴 planned |
| 030 | [What is the difference between `target`, `lib`, and `module`?](030-target-lib-module.md) | medium | 🟡 draft |
| 040 | [How do `paths`, `baseUrl`, and `extends` work?](040-paths-and-extends.md) | medium | 🟡 draft |
| 045 | [What do `types`, `typeRoots`, `rootDir`, and `outDir` default to, and what changed in TypeScript 6?](045-types-and-output-directories.md) | medium | 🔴 planned |
| 050 | [What are project references, and how do `composite` and `incremental` help?](050-project-references.md) | hard | 🟡 draft |
| 060 | [What do `skipLibCheck`, `declaration`, and `sourceMap` do?](060-skiplibcheck-declaration-sourcemaps.md) | easy | 🟡 draft |
| 070 | [How do you migrate a project from TypeScript 6 to TypeScript 7?](070-migrating-to-typescript-7.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [What is a tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)
- [TSConfig reference](https://www.typescriptlang.org/tsconfig/)
- [Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Choosing Compiler Options](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html)
