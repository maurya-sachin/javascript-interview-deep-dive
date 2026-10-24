---
title: "Which TypeScript features break under single-file transpilers, and what does `isolatedDeclarations` add?"
status: draft
difficulty: hard
frequency: 3
core: false
tags: [isolated-modules, isolated-declarations, esbuild, swc, babel, const-enum, namespaces, class-fields, decorators]
related:
  - typescript/the-compiler/checking-vs-emitting
  - typescript/modules-and-declaration-files/import-type-isolated-modules
  - typescript/classes-enums-runtime-output/erasable-syntax-only
  - typescript/classes-enums-runtime-output/class-field-semantics
  - typescript/classes-enums-runtime-output/declaration-merging-namespaces
  - typescript/tsconfig-and-strictness/project-references
verified: 2026-10
perishable:
  - "Checked on esbuild 0.28.2, @swc/core 1.16.20, Babel 8.0.9"
  - "swc and Babel lose cross-block namespace scope"
  - "Babel 8 removed allowDeclareFields (always on)"
  - "isolatedDeclarations: TS9007 on 6.0.3, TS9013 on 7.0.2"
sources:
  - https://esbuild.github.io/content-types/#typescript-caveats
  - https://github.com/evanw/esbuild/releases/tag/v0.14.7
  - https://babeljs.io/docs/babel-plugin-transform-typescript
  - https://swc.rs/docs/configuration/compilation
  - https://www.typescriptlang.org/tsconfig/#useDefineForClassFields
  - https://www.typescriptlang.org/tsconfig/#isolatedDeclarations
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html
tldr: >
  esbuild, swc and Babel compile one file without types, so output that depends on other files or
  types differs from `tsc`: const enums become real objects, merged namespaces can lose shared
  scope, class-field semantics follow each tool's defaults, and decorator metadata is guessed or
  missing. `isolatedDeclarations` requires explicit export types so `.d.ts` files can be emitted
  per file too.
---

## Answer

`tsc` emits with the whole program and its checker; esbuild, swc and Babel see one file's syntax. `isolatedModules` makes `tsc` reject code they cannot compile at all, but output still differs where it depends on types or settings. Checked on esbuild 0.28.2, @swc/core 1.16.20 and Babel 8.0.9 against `tsc` 6.0.3 and 7.0.2:

- **Const enums.** `tsc` without `isolatedModules` inlines every use and emits no object. The tools emit a real enum object and inline only same-file uses (Babel only with `optimizeConstEnums`); an importing file reads the member at runtime. esbuild also inlines across files when bundling. A `declare const enum` has no object anywhere, hence TS2748 under `isolatedModules`.
- **Namespaces.** All three compile them, but swc and Babel treat each block of a merged namespace as its own scope, so an unqualified reference to another block's export throws a `ReferenceError`. Babel documents this; `isolatedModules` does not catch it.
- **Class fields.** `tsc` derives `useDefineForClassFields` from `target` (on from ES2022). esbuild copies that rule from tsconfig's `target`; swc defined fields even with `target: es2020`; Babel 8 always keeps type-only fields.
- **Decorator metadata.** `emitDecoratorMetadata` serialises types. esbuild does not support it; swc guesses from syntax (`typeof T === "undefined" ? Object : T`); Babel's TypeScript preset has no option for it.

`isolatedDeclarations` (TS 5.5) applies the same idea to `.d.ts` files. Every export needs a type a reader of that one file can write down: explicit return types and property annotations, with trivial inferences such as literals or `as` assertions allowed. It requires `declaration` or `composite`. In return, any tool can emit declarations per file without a checker (`ts.transpileDeclaration`, swc's `jsc.experimental.emitIsolatedDts`), and a monorepo can emit every project's declarations in parallel instead of waiting on dependencies.

## Example

```ts
// shapes.ts, compiled one file at a time
export namespace Shapes {
  export const unit = 1;
}
export namespace Shapes {
  export const double = unit * 2; // tsc resolves `unit` to Shapes.unit
}
console.log(Shapes.double);
// tsc 6.0.3 and 7.0.2, --isolatedModules --verbatimModuleSyntax: no errors,
//   emits `Shapes.double = Shapes.unit * 2;` → 2
// esbuild 0.28.2           → 2
// @swc/core 1.16.20        → ReferenceError: unit is not defined
// @babel/preset-typescript 8.0.9 → ReferenceError: unit is not defined

// limits.ts, --isolatedDeclarations --declaration
export const max = 10; // OK: a literal is a trivial inference
export function add(a: number, b: number) {
  // 6.0.3 Error (on `add`): TS9007: Function must have an explicit return type annotation with --isolatedDeclarations.
  return a + b;
  // 7.0.2 Error (on `a + b`): TS9013: Expression type can't be inferred with --isolatedDeclarations.
}
```

## Pitfalls

- Treating `isolatedModules` as "per-file output equals `tsc` output". It only rejects code that cannot be compiled at all; namespace scope, field semantics and metadata still differ.
- Testing const enums only in a bundled build. esbuild's cross-file inlining hides differences that return in per-file builds (test runners, dev servers), and a `declare const enum` from a library's `.d.ts` has no runtime object.
- Setting field semantics only in tsconfig. Babel ignores tsconfig changes and swc takes its own options, so set `jsc.transform.useDefineForClassFields` explicitly.
- Enabling `isolatedDeclarations` without a consumer. The 5.5 notes call adoption case by case: it buys nothing unless per-file or parallel declaration emit uses it.

## Follow-ups

**Q:** Does `isolatedDeclarations` make `tsc` itself faster?
**A:** Not by itself: it makes declaration emit possible without a checker. The speedup comes from tools or build orchestration that exploit that, such as per-file emitters or emitting all projects' declarations in parallel before checking.

**Q:** What does `erasableSyntaxOnly` remove from this list?
**A:** It bans enums, namespaces with values, parameter properties and `import =`, so the const-enum and namespace gaps cannot occur. Class-field semantics and decorator metadata still differ between tools.

**Q:** Which tsconfig fields does esbuild read?
**A:** A fixed subset: `target`, `useDefineForClassFields`, `experimentalDecorators`, `verbatimModuleSyntax`, `paths`/`baseUrl`, the `jsx*` options, `strict`/`alwaysStrict` and `extends`, among a few others. Everything else, including `isolatedModules`, is ignored.

## Exercises

### Same class, two esbuild configs

```ts
class Base {
  constructor() { this.init(); }
  init() {}
}
class Child extends Base {
  name?: string;
  init() { this.name = "set in init"; }
}
console.log(new Child().name);
// esbuild 0.28.2 --loader=ts, (a) no tsconfig, (b) tsconfig target "es2020"
```

**Answer:** (a) `undefined`: with no `target`, esbuild defines `name` after `super()` returns, resetting it. (b) `"set in init"`: a `target` below ES2022 makes esbuild default `useDefineForClassFields` to false and drop the type-only field.
