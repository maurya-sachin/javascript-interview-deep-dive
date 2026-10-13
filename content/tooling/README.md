# Tooling

> **Track:** Engineering practice
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

The tools between source code and what ships: package managers, bundlers, transpilers, linters, and monorepos.
Interviews ask about them when something breaks — a duplicate dependency, a bundle that won't tree-shake, a dual-package bug.

## Scope

- **In:** package managers and dependency resolution, publishing packages, bundlers and dev servers, transpilers, tree-shaking and code splitting as mechanisms, source maps, linting and formatting, monorepo workspaces and task runners.
- **Out:** module semantics → [JavaScript](../javascript/) · `tsconfig` → [TypeScript](../typescript/) · Node's module resolution → [Node.js runtime](../nodejs/) · bundle-size impact on users → [Web performance](../web-performance/) · CI pipelines → [CI/CD](../ci-cd/) · monorepo vs polyrepo and version control → [Git](../git/).

## Prerequisites

[JavaScript](../javascript/) — especially modules.

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- Package managers: npm, pnpm, Yarn; lockfiles, semver ranges, peer dependencies, `node_modules` layouts
- Publishing: `package.json` `exports`, dual ESM/CJS packages, types
- Bundlers: Vite, Rollup, webpack, esbuild — dependency graphs, chunking, dev servers, HMR
- Transpilers: Babel, SWC, what "downlevelling" costs
- Tree-shaking: side effects, `sideEffects`, why it fails
- Source maps
- Linting and formatting: ESLint, Prettier, how rules work
- Monorepos: workspaces, task runners, caching

## Sources

- [npm docs](https://docs.npmjs.com/)
- [Vite docs](https://vite.dev/guide/)
- [Rollup docs](https://rollupjs.org/introduction/)
- [ESLint docs](https://eslint.org/docs/latest/)
- [Source Map specification](https://tc39.es/ecma426/) — ECMA-426
