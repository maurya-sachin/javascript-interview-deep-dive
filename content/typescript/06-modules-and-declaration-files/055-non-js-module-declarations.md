---
title: "How do you type imports of CSS, SVG, and other non-JS files?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [wildcard-module-declarations, allowarbitraryextensions, css-modules, assets, nouncheckedsideeffectimports, ambient-modules]
related:
  - typescript/modules-and-declaration-files/module-augmentation-globals
  - typescript/modules-and-declaration-files/declaration-files
  - typescript/modules-and-declaration-files/module-resolution
  - typescript/tsconfig-and-strictness/flags-beyond-strict
verified: 2026-10
perishable:
  - "noUncheckedSideEffectImports defaults to true since TS 6.0"
sources:
  - https://www.typescriptlang.org/docs/handbook/modules/reference.html#ambient-modules
  - https://www.typescriptlang.org/tsconfig/allowArbitraryExtensions.html
  - https://www.typescriptlang.org/tsconfig/noUncheckedSideEffectImports.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
tldr: >
  `tsc` knows nothing about `.css` or `.svg`; your bundler does. Tell `tsc` what such an import
  gives with a wildcard ambient declaration, `declare module "*.svg" { const url: string; export
  default url; }`, in a global `.d.ts`. For exact per-file types, put an `app.d.css.ts` beside
  `app.css` and turn on `allowArbitraryExtensions`. Neither checks that the file exists.
---

## Answer

Importing `./logo.svg` only works because a **bundler** (or a loader) turns it into JavaScript: a URL string, a CSS Modules class map, a component. `tsc` can't see that, so on 6.0.3 and 7.0.2 a value import of an unknown file is TS2307. Since TS 6.0 `noUncheckedSideEffectImports` is on by default, so even `import "./global.css"` fails, with TS2882.

Two ways to describe what the bundler produces:

- **Pattern ambient modules** (one `*` wildcard). In a `.d.ts` that the project includes (a script file, not a module), write `declare module "*.svg" { const url: string; export default url; }`. Any specifier matching the pattern gets that shape. `declare module "*.css" {}` is enough for side-effect imports. Framework starters often ship these (the TypeScript docs mention Vite's `vite-env.d.ts`).
- **Per-file declarations (TS 5.0+).** For `./button.module.css`, `tsc` looks for `button.module.d.css.ts`, the pattern `{basename}.d.{extension}.ts`. It can list the real class names, so typos fail. Using it needs `allowArbitraryExtensions`; without it 6.0.3 and 7.0.2 report TS6263. CSS Modules tooling can generate these files.

The trade-off: a wildcard is one line and covers everything, but its types are generic (`{ readonly [className: string]: string }` accepts any class name). Per-file declarations are exact but must be generated and kept in sync.

Both are claims, not checks. The declaration says what the bundler will return; if your bundler is configured differently (an SVG as a React component, say), the types lie. Match the declaration to the loader's real output.

## Example

```ts
// types/assets.d.ts (no import/export, so the declarations are global)
declare module "*.module.css" {
  const classes: { readonly [className: string]: string };
  export default classes;
}
declare module "*.css" {}         // side-effect imports only
declare module "*.svg" {
  const url: string;
  export default url;
}

// src/with.ts; tsc --strict --module preserve (6.0.3 and 7.0.2 agree)
import "./global.css";
import styles from "./button.module.css";
import logoUrl from "./logo.svg";
const a: string = styles.btn;      // OK
const b: string = styles.typo;     // also OK: the wildcard type allows any name
const c: number = logoUrl;
// Error TS2322: Type 'string' is not assignable to type 'number'.
import missing from "./nope.svg";  // OK: no file needed for a wildcard match

// With src/button.module.d.css.ts declaring { readonly btn: string } and --allowArbitraryExtensions:
//   styles.typo → Error TS2339: Property 'typo' does not exist on type '{ readonly btn: string; }'.
```

## Pitfalls

- Declaring `"*.css"` before `"*.module.css"`. Both have an empty prefix before `*`; 6.0.3's source picks the longest prefix and keeps the first on a tie. With `"*.css" {}` first, `styles.btn` was TS2339 on both versions.
- Putting the declarations in a file with a top-level `import` or `export`. The modules reference says the same syntax is then a module augmentation; adding `export {}` to `assets.d.ts` made the SVG import TS2307 on both versions.
- Using the older `app.css.d.ts` naming. The tsconfig reference says the `.d.css.ts` form is what works with `node16`/`nodenext`, where relative imports keep their real extension.
- Trusting index-signature class maps. Turn on `noUncheckedIndexedAccess` and `styles.btn` becomes `string | undefined`, or generate per-file declarations.

## Follow-ups

**Q:** Does JSON need a declaration?
**A:** No. With `moduleResolution: bundler` or `nodenext`, 6.0.3 and 7.0.2 typed `import d from "./d.json"` from the file's contents. Under `nodenext` an ES module must add `with { type: "json" }`, or it is error TS1543.

**Q:** Why did my side-effect CSS import start failing after upgrading?
**A:** TS 6.0 made `noUncheckedSideEffectImports` default to `true`. Add `declare module "*.css" {}` to a global declaration file rather than turning the check off; it still catches typos in package side-effect imports.
