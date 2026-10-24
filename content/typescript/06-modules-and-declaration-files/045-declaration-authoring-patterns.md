---
title: "How do you write a declaration file for a global, UMD, or function-exporting library?"
status: draft
difficulty: hard
frequency: 2
core: false
tags: [declaration-files, umd, export-as-namespace, export-equals, declaration-merging, typesversions]
related:
  - typescript/modules-and-declaration-files/declaration-files
  - typescript/modules-and-declaration-files/module-augmentation-globals
  - typescript/modules-and-declaration-files/esm-cjs-interop
  - typescript/modules-and-declaration-files/dual-package-types
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/declaration-files/library-structures.html
  - https://www.typescriptlang.org/docs/handbook/declaration-files/templates.html
  - https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-d-ts.html
  - https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-function-d-ts.html
  - https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html#version-selection-with-typesversions
  - https://www.typescriptlang.org/docs/handbook/modules/reference.html#packagejson-typesversions
  - https://www.typescriptlang.org/tsconfig/#allowUmdGlobalAccess
tldr: >
  First identify how the library is loaded. A global library gets a script `.d.ts` of top-level
  `declare` statements. A CommonJS module whose export is a function gets `export =` plus a
  namespace merged into the function for its types. A UMD library adds `export as namespace Name`
  so script files can use the global. `typesVersions` picks files per TypeScript version.
---

## Answer

The shape of a declaration file follows **how the JavaScript is loaded**, so I first read the library's code. The handbook maps library kinds to templates (`global.d.ts`, `module.d.ts`, `module-function.d.ts`, `module-class.d.ts`, plus plugin variants).

- **Global library** (a `<script>` that assigns `window.myLib`). The `.d.ts` is a **script**: no top-level `import`/`export`, just `declare function myLib(...)`, `declare namespace myLib { ... }` and interfaces, all of which become global. The handbook warns that most "global" libraries are really UMD, so check for `define`/`module.exports` first.
- **Module whose export is one function or class** (`module.exports = fn`). An ES module can't express "the module *is* this function", so write `export = fn`. To export types too, declare a `namespace` with the same name: it merges with the function, so `fn.Options` is a type and `fn.version` a property. Consumers write a default import (with `esModuleInterop`: 6.0.3 and 7.0.2 emitted `__importDefault` without the flag) or `import fn = require(...)`.
- **UMD library** (works as a module and as a global). Write the module form and add `export as namespace myLib;`. Script files (no imports) can then use `myLib` directly; module files must import it, or `tsc` reports TS2686 unless `allowUmdGlobalAccess` is on.
- **Plain ES-style module**: named `export declare` statements (the `module.d.ts` template).

**Per-version types.** `typesVersions` in `package.json` maps a semver range of the *TypeScript* version to other files, first match wins, falling back to `types`. When `exports` is read, the modules reference says `typesVersions` is ignored; use versioned conditions such as `"types@>=5.2"` there instead.

## Example

```ts
// node_modules/slugify-lite/index.js: UMD wrapper, module.exports = slugify or root.slugify = slugify
// node_modules/slugify-lite/index.d.ts
export as namespace slugify;      // UMD: a global for script files
export = slugify;                 // the module *is* the function

declare function slugify(input: string, options?: slugify.Options): string;
declare namespace slugify {       // merges with the function: types + properties
  interface Options { separator?: string }
  const version: string;
}

// src/app.ts (module); tsc --strict --module commonjs
import slugify from "slugify-lite";
const opts: slugify.Options = { separator: "_" };
console.log(slugify("Hello World", opts), slugify.version);
// → hello_world 1.0.0          (Node 24.19.0)

// src/script.ts (no import/export, so a script)
/// <reference types="slugify-lite" />
const s: string = slugify("A B"); // OK: the UMD global

// src/mod-global.ts (a module)
export const t = slugify("A B");
// Error TS2686: 'slugify' refers to a UMD global, but the current file is a module. Consider adding an import instead.
```

Identical output on `tsc` 6.0.3 and 7.0.2.

## Pitfalls

- Writing `import * as slug from "slugify-lite"` and calling `slug()`. With the merged namespace, both 6.0.3 and 7.0.2 report TS2349 (`Type 'typeof slugify' has no call signatures`); the template comment says "WRONG! DO NOT DO THIS!".
- Testing a global script under `module: nodenext`. In 6.0.3's source, `moduleDetection` then defaults to `force` (the tsconfig reference documents only `auto`), so every file is a module and `script.ts` above also got TS2686. With `--moduleDetection auto` it passed.
- Adding `typesVersions` to a package with `exports` and expecting it to work. In my test, a `typesVersions` entry pointing at a missing folder was silently ignored, while `"types@>=7.0"` inside `exports` picked the new file on 7.0.2 and the plain `types` file on 6.0.3.
- Writing `export default` for a library that sets `module.exports = fn`. That claims an `exports.default` property the runtime never sets.

## Follow-ups

**Q:** What if a module adds methods to another library or to globals?
**A:** Use the plugin templates: `module-plugin.d.ts` augments another module with `declare module "x"`, and `global-modifying-module.d.ts` uses `declare global` inside a module. Augmentation itself is its own topic.

**Q:** How do you describe a module whose export is a class?
**A:** The `module-class.d.ts` template: `export = MyClass` with `declare class MyClass`, plus a same-named namespace for its option and result types, exactly like the function case.
