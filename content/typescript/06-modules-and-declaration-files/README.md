# 06 — Modules and declaration files

> **Status:** 🔴 planned · **Published:** 0/6 · **Last verified:** —

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
- `esModuleInterop`, `allowSyntheticDefaultImports`, `export =`, dual packages → 030
- `.d.ts`, `declare`, `@types` / DefinitelyTyped, shipping types (`types`, `exports`) → 040
- `declare module`, `declare global`, ambient declarations, triple-slash directives → 050
- `checkJs`, `allowJs`, JSDoc types → 060

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What do `import type`, `isolatedModules`, and `verbatimModuleSyntax` do?](010-import-type-isolated-modules.md) | medium | 🟡 draft |
| 020 | [How does `moduleResolution` work, and when do you use `bundler` or `nodenext`?](020-module-resolution.md) | hard | 🟡 draft |
| 030 | [Why does importing a CommonJS module sometimes fail, and what does `esModuleInterop` do?](030-esm-cjs-interop.md) | hard | 🟡 draft |
| 040 | [What is a `.d.ts` file, and how do you write one for an untyped library?](040-declaration-files.md) | medium | 🟡 draft |
| 050 | [How do you augment a module or add a global type?](050-module-augmentation-globals.md) | medium | 🟡 draft |
| 060 | [How can you type-check JavaScript with TypeScript?](060-checkjs-jsdoc.md) | easy | 🟡 draft |
<!-- generated:questions:end -->

## Sources

- [Modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)
- [Modules Reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
- [ESM/CJS Interoperability](https://www.typescriptlang.org/docs/handbook/modules/appendices/esm-cjs-interop.html)
- [Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
- [Type Checking JavaScript Files](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)
- [Triple-Slash Directives](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html)
