# 06 — Modules and declaration files

> **Status:** 🔴 planned · **Published:** 0/10 · **Last verified:** —

How TypeScript resolves and types modules: `moduleResolution`, ESM/CJS interop, `.d.ts` files, `declare`, and augmentation.

## Learning goals

After this chapter you can:

- Explain what `import type` and `verbatimModuleSyntax` do
- Pick a `module` and `moduleResolution` setting for Node.js and bundlers
- Explain why ESM/CJS interop breaks and what `esModuleInterop` changes
- Write or consume a `.d.ts` file and augment a module or global
- Type plain JavaScript with JSDoc

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Type-only imports/exports, `isolatedModules`, `verbatimModuleSyntax` → 010
- `module` vs `moduleResolution`, `node16` / `nodenext` / `bundler`, file extensions, `exports` → 020
- `esModuleInterop`, `allowSyntheticDefaultImports`, `export =` → 030
- Dual-package publishing: `import`/`require` conditions, `.d.mts` / `.d.cts`, the masquerading-types problem → 035
- `.d.ts`, `declare`, `@types` / DefinitelyTyped, shipping types (`types`, `exports`) → 040
- Declaration authoring patterns: global/UMD/module-function templates, `export as namespace`, `typesVersions` → 045
- `declare module`, `declare global`, ambient declarations, triple-slash directives → 050
- Wildcard module declarations (`declare module "*.css"`) and `allowArbitraryExtensions` for non-JS imports → 055
- `checkJs`, `allowJs`, JSDoc types → 060
- JSDoc tag reference beyond the basics: `@callback`, `@overload`, `@this`, constrained `@template` → 070

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What do `import type`, `isolatedModules`, and `verbatimModuleSyntax` do?](010-import-type-isolated-modules.md) | medium | 🟡 draft |
| 020 | [How does `moduleResolution` work, and when do you use `bundler` or `nodenext`?](020-module-resolution.md) | hard | 🟡 draft |
| 030 | [Why does importing a CommonJS module sometimes fail, and what does `esModuleInterop` do?](030-esm-cjs-interop.md) | hard | 🟡 draft |
| 035 | [How do you ship types for a package that publishes both ESM and CommonJS?](035-dual-package-types.md) | hard | 🟡 draft |
| 040 | [What is a `.d.ts` file, and how do you write one for an untyped library?](040-declaration-files.md) | medium | 🟡 draft |
| 045 | [How do you write a declaration file for a global, UMD, or function-exporting library?](045-declaration-authoring-patterns.md) | hard | 🟡 draft |
| 050 | [How do you augment a module or add a global type?](050-module-augmentation-globals.md) | medium | 🟡 draft |
| 055 | [How do you type imports of CSS, SVG, and other non-JS files?](055-non-js-module-declarations.md) | medium | 🟡 draft |
| 060 | [How can you type-check JavaScript with TypeScript?](060-checkjs-jsdoc.md) | easy | 🟡 draft |
| 070 | [How do you type callbacks, overloads, `this`, and constrained generics in JSDoc?](070-jsdoc-advanced-tags.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [Modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)
- [Modules Reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
- [ESM/CJS Interoperability](https://www.typescriptlang.org/docs/handbook/modules/appendices/esm-cjs-interop.html)
- [Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
- [Type Checking JavaScript Files](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)
- [Triple-Slash Directives](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html)
