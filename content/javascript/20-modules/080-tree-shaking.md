---
title: "How does tree shaking work, and what stops it?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [modules, tree-shaking, bundlers, side-effects, dead-code-elimination]
related:
  - javascript/modules/es-module-loading
  - javascript/modules/esm-vs-commonjs
  - javascript/modules/dynamic-import
verified: 2026-10
perishable:
  - esbuild 0.28.2, Rollup 4.65.0, webpack 5.112.1 outputs shown
  - Rollup core ignores package.json sideEffects; node-resolve plugin reads it
sources:
  - https://tc39.es/ecma262/#sec-imports
  - https://tc39.es/ecma262/#sec-exports
  - https://esbuild.github.io/api/#tree-shaking
  - https://esbuild.github.io/api/#pure
  - https://esbuild.github.io/api/#ignore-annotations
  - https://rollupjs.org/configuration-options/#treeshake-annotations
  - https://rollupjs.org/configuration-options/#treeshake-modulesideeffects
  - https://webpack.js.org/guides/tree-shaking/
  - https://webpack.js.org/configuration/optimization/#optimizationusedexports
  - https://webpack.js.org/configuration/optimization/#optimizationsideeffects
  - https://webpack.js.org/blog/2020-10-10-webpack-5-release/#commonjs-tree-shaking
tldr: >
  Tree shaking is a bundler's dead-code elimination across modules. ES module syntax is static, so the
  tool can see which exports are used and drop the rest. It keeps any top-level code that might have a
  side effect, and it can't analyse CommonJS. `/*#__PURE__*/` marks a call as removable if unused;
  `"sideEffects": false` lets whole unused modules be skipped.
---

## Answer

Tree shaking is dead-code elimination done by bundlers and minifiers (esbuild, Rollup, webpack with Terser), not by the language. ECMAScript contributes syntax a tool can analyse without running it: `import` and `export` declarations only appear at the top level of a module, and their specifiers are string literals. So the tool can build the import graph statically, mark which exports the entry point actually reaches, and leave out the rest.

Removal is conservative: top-level code that *might* have a side effect stays. Calls, property reads (a getter could run) and global writes are kept even when their result is unused. Two hints relax that:

- **`/*#__PURE__*/` (or `/* @__PURE__ */`) before a call or `new`:** "this call can be removed if its result is unused." It promises nothing about the function being pure in the functional sense, and it covers only the call, not side effects in its arguments.
- **`"sideEffects"` in a package's `package.json`:** a webpack convention, also honoured by esbuild, saying which files have side effects. With `false`, a module whose exports are all unused can be skipped entirely, including its top-level code. Rollup's core doesn't read this field; `@rollup/plugin-node-resolve` passes it on.

What defeats tree shaking:

- **CommonJS.** `require` is an ordinary call that can take a computed path anywhere, and `module.exports` is a mutable object read and written by computed keys. esbuild doesn't shake CommonJS at all; webpack 5 recognises a few static patterns (`exports.x = …`, `require('a').x`) and bails out on anything else.
- **Compiling ESM to CommonJS too early**, e.g. a Babel config that transforms modules before bundling.
- **Exporting one big object** (`export default { a, b, c }`): the object is used, so all of it stays.
- **Top-level side effects** in libraries, such as patching prototypes on import.

## Example

```js
// math.js
export const add = (a, b) => a + b;
export const multiply = (a, b) => a * b;
const makeTable = () => Array.from({ length: 4 }, (_, i) => i * i);
export const squares = makeTable(); // a call: kept, it might have side effects
export const cubes = /*#__PURE__*/ makeTable(); // "drop me if unused"

// main.js
import { add } from './math.js';
console.log(add(2, 3));

// $ npx esbuild main.js --bundle --format=esm   (esbuild 0.28.2) writes:
// // math.js
// var add = (a, b) => a + b;
// var makeTable = () => Array.from({ length: 4 }, (_, i) => i * i);
// var squares = makeTable();
//
// // main.js
// console.log(add(2, 3));
```

## Pitfalls

- Setting `"sideEffects": false` on a package that imports CSS or polyfills for their effect. Those files are then dropped in production; list them instead (`"sideEffects": ["*.css", "./src/polyfills.js"]`).
- Assuming an unused export is gone in every build. webpack enables `usedExports` by default only in `production` mode, and esbuild shakes only when bundling or emitting `iife`.
- Reading `/*#__PURE__*/` as "this function is pure". It means only "this call may be deleted if its value is unused"; it doesn't make repeated calls cacheable.
- Blaming the tool when a CommonJS dependency ends up whole in the bundle. Prefer packages that ship ES modules (via `exports` or `module`).

## Follow-ups

**Q:** How do webpack's `usedExports` and `sideEffects` differ?
**A:** `usedExports` marks unused exports so they aren't generated, and the minimizer (Terser) then removes the dead declarations if it can prove them side-effect-free. `sideEffects` skips whole modules and their dependency subtrees when none of their exports are used. webpack's guide calls the `sideEffects` flag the more effective of the two.

**Q:** How do you mark a whole function as removable rather than one call?
**A:** Put `/*#__NO_SIDE_EFFECTS__*/` before the function declaration. Rollup then treats every unused call as removable, across modules. esbuild 0.28.2 also reads it, but in a test it removed only calls in the declaring file, not calls to an imported function.

**Q:** Does dynamic `import()` prevent tree shaking?
**A:** It limits it. `import('./x.js')` yields the whole namespace object, and a tool can't always see which properties are read from it. With `--splitting`, esbuild 0.28.2 put every export of the example's `math.js` into the lazy chunk, unused ones included. Static `import { x }` gives tools the most information.

## Exercises

### Predict what esbuild keeps

`node_modules/fake-ui/package.json` has `"sideEffects": false`. Each file logs on load.

```js
// node_modules/fake-ui/index.js
export { Button } from './button.js';
export { Chart } from './chart.js';
// node_modules/fake-ui/button.js
console.log('button loaded'); export const Button = 'Button';
// node_modules/fake-ui/chart.js
console.log('chart loaded'); export const Chart = 'Chart';
// app.js, bundled with: npx esbuild app.js --bundle --format=esm
import { Button } from 'fake-ui';
console.log(Button);
```

**Answer:** The bundle contains `button.js` (its log and `Button`) and `app.js`; `index.js` and `chart.js` are gone, log included. `sideEffects: false` promised that unused modules have no effects, so esbuild 0.28.2 skips them. With `"sideEffects": true`, it keeps `console.log("chart loaded")` while still dropping the unused `Chart` binding.

### Predict what webpack keeps

The same `math.js` and `main.js` as the example, built with `npx webpack --mode=production --entry ./main.js` (webpack 5.112.1).

```js
// main.js
import { add } from './math.js';
console.log(add(2, 3));
```

**Answer:** `(()=>{"use strict";Array.from({length:4},(o,r)=>r*r),console.log(5)})();`. `multiply` and `cubes` are removed, `add` is inlined as `5` by the minimizer, and the `squares` call survives as a bare `Array.from(...)` expression because it isn't annotated as pure.
