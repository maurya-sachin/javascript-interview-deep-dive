---
title: "What's the difference between a polyfill and a transpiler?"
status: draft
difficulty: easy
frequency: 3
core: false
tags: [polyfill, transpiler, babel, swc, esbuild, browser-support]
related:
  - javascript/how-javascript-runs/tc39-process
  - javascript/how-javascript-runs/ecmascript-engine-host
verified: 2026-10
sources:
  - https://developer.mozilla.org/en-US/docs/Glossary/Polyfill
  - https://babeljs.io/docs/babel-preset-env
  - https://babeljs.io/docs/babel-plugin-transform-nullish-coalescing-operator
  - https://esbuild.github.io/api/#target
  - https://swc.rs/docs/configuration/supported-browsers
  - https://github.com/browserslist/browserslist
  - https://esbuild.github.io/content-types/
  - https://www.typescriptlang.org/tsconfig/#target
  - https://babeljs.io/docs/babel-plugin-transform-async-to-generator
tldr: >
  A polyfill is run-time code that adds a missing API (a function or object) to an old engine. A
  transpiler is a build-time tool that rewrites new syntax into older syntax. Syntax an old engine cannot
  parse can only be transpiled; missing built-ins are polyfilled. Both are driven by your target browsers.
---

## Answer

Both let you write modern JavaScript for older engines, but they fix different problems.

- **Polyfill:** JavaScript that runs in the user's engine and defines a missing *API* (`Array.prototype.at`, `Promise.withResolvers`, `structuredClone`) when it is absent. It works because adding a property needs no new syntax. Examples: `core-js`, or a hand-written, feature-detected shim.
- **Transpiler:** a build-time tool that compiles source to source, rewriting new *syntax* (`??`, `?.`, classes, `async` functions) into older equivalents. It has to run before the code ships, because an engine that does not know the syntax throws a `SyntaxError` for the whole file. Examples: Babel, SWC, and esbuild (which also bundles and minifies).

The rule of thumb: **new syntax is transpiled, new built-ins are polyfilled.** Some features need both: a transpiled `async` function or generator relies on a runtime helper, and on `Promise`, which may itself need a polyfill.

Neither is perfect. A transpiler can only emit what the older language can express, so some features are approximated with heavier output (esbuild lowers private `#fields` to `WeakMap` lookups). A polyfill can only use what exists, so behaviour that needs engine support cannot be reproduced faithfully.

Both are driven by **target environments**. A Browserslist query, or a tool option such as esbuild's `target`, states which engines you support, and the tool applies only the transforms and polyfills those engines lack. A wider target means larger, slower output.

## Example

```js
// Polyfill: add a missing API at run time, only if it is absent.
if (!Array.prototype.at) {
  Object.defineProperty(Array.prototype, 'at', {
    value(index) {
      const i = Math.trunc(index) || 0;
      return this[i < 0 ? this.length + i : i];
    },
    writable: true,
    configurable: true,
  });
}
console.log([10, 20, 30].at(-1)); // → 30

// Transpiler: rewrite new syntax at build time. An old engine cannot even
// parse `??`, so no run-time code can help. The rewrite below is a simplified
// version of what a transpiler targeting older engines emits.
const user = { nickname: null };
const modern = user.nickname ?? 'anonymous';
let tmp;
const lowered = (tmp = user.nickname) !== null && tmp !== undefined ? tmp : 'anonymous';
console.log(modern, lowered); // → anonymous anonymous
```

## Pitfalls

- Expecting a polyfill to fix a `SyntaxError`. If the engine cannot parse the file, no run-time code gets to execute.
- Shipping every polyfill to every user. Load only what the target browsers lack, or modern browsers pay for code they never need.
- Overwriting a native implementation. Always feature-detect first; a polyfill must not replace a correct built-in with a slower or less complete one.
- Letting the target go stale. An outdated target keeps generating bulky transpiled output long after those browsers have left your audience.

## Follow-ups

**Q:** Is TypeScript a transpiler?
**A:** In the broad sense, yes: it compiles TypeScript to JavaScript and can lower syntax according to its `target` option. It does not add polyfills.

**Q:** What is a ponyfill?
**A:** A module that exports the feature as a function instead of modifying globals, so it never changes the environment. The cost is that callers must import and use it explicitly.

**Q:** Where does `@babel/preset-env` fit?
**A:** It reads your targets and enables only the syntax transforms those engines need. In Babel 7 it can also inject `core-js` polyfills, configured through its `useBuiltIns` option.
