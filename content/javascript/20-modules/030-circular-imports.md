---
title: "What happens with circular imports?"
status: draft
difficulty: hard
frequency: 2
core: false
tags: [esm, commonjs, circular-dependency, tdz, live-bindings, evaluation-order]
related:
  - javascript/modules/es-module-loading
  - javascript/modules/esm-vs-commonjs
  - javascript/scope-and-execution-contexts/temporal-dead-zone
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-cyclic-module-records
  - https://tc39.es/ecma262/#sec-source-text-module-record-initialize-environment
  - https://tc39.es/ecma262/#sec-module-environment-records
  - https://nodejs.org/docs/latest-v24.x/api/modules.html#cycles
tldr: >
  An import cycle is allowed. In ES modules, linking succeeds, then the module that isn't the entry point
  runs first, and any import it reads from the cycle that hasn't been initialized yet throws a `ReferenceError`
  (TDZ). Function declarations already work. In CommonJS, `require` returns the other module's partial
  `exports` object as it is at that moment.
---

## Answer

Neither system rejects a cycle. What differs is what a module sees from a partner that hasn't finished.

**ES modules.** Linking handles the whole cycle as a unit, so every import binding exists before any code runs. Evaluation is depth-first: starting from the entry module, a module that is already being evaluated is skipped rather than waited for. So the last module in the cycle to be reached runs first, and the entry module runs last.

When a module's body reads a binding that comes from a module that hasn't run yet:

- `export function` declarations already work, because functions are initialized at link time.
- `export const`, `let`, and `class` are in their Temporal Dead Zone: a `ReferenceError`, "Cannot access 'a' before initialization".
- `export var` reads `undefined`.

Reading the binding later, for example inside a function called after startup, works because the binding is live.

**CommonJS.** `require` returns the `module.exports` object that exists at that moment. If the partner is mid-execution, you get whatever it had assigned so far, usually a partial object. A property added later shows up on the same object, but destructuring (`const { x } = require(...)`) or replacing `module.exports` freezes in the early view.

The fix is usually structural: move the shared code into a third module, or read the other side lazily, inside a function.

## Example

```js
// a.mjs (entry point)
import { b } from './b.mjs';

export const a = 'a';
export function hello() {
  return 'hello from a';
}
console.log('a sees b =', b);

// b.mjs
import { a, hello } from './a.mjs';

console.log('hello() ->', hello());
try {
  console.log(a);
} catch (error) {
  console.log(error.name, error.message);
}
export const b = 'b';
// → hello() -> hello from a
// → ReferenceError Cannot access 'a' before initialization
// → a sees b = b
```

## Pitfalls

- Believing the entry file always runs first. In a cycle, the entry runs last. Which module hits the TDZ depends on which file starts the program or is imported first, so the same code can break from a different entry point (`node b.mjs` throws in `a.mjs`).
- Using `const f = () => ...` where `function f() {}` would have survived. Both can be exported, but only the declaration is available during the cycle.
- In CommonJS, `const { x } = require('./other')` in a cycle gives `undefined` forever. Read `other.x` when you need it.
- Relying on cycles that "happen to work" today. Adding an import or reordering them changes evaluation order.

## Follow-ups

**Q:** Why doesn't ESM deadlock on a cycle?
**A:** `InnerModuleEvaluation` returns immediately for a module whose status is `evaluating`, so the cycle is cut at the first repeat visit. The skipped module's bindings are not initialized yet.

**Q:** How do you detect or avoid cycles?
**A:** Lint rules such as ESLint's `import/no-cycle` report them. Fix them by extracting shared code to a leaf module or by passing dependencies in as arguments.

## Deep dive

### How it works

Link-time and run-time are separate. During linking, `InitializeEnvironment` creates all bindings of every module in the cycle: `var` as `undefined`, function declarations as real function objects, `let`/`const`/`class` as uninitialized. Import bindings are created as indirect links to those. Only then does `Evaluate` run bodies. When `b.mjs` runs in the example, `a.mjs` is `evaluating`, its function declaration `hello` exists, and `a` is still uninitialized. `GetBindingValue` on the indirect binding throws `ReferenceError` for an uninitialized target.

### Edge cases

CommonJS has no TDZ, so the same program behaves differently. In Node.js 24:

```js
// a.cjs (entry point)
exports.done = false;
const b = require('./b.cjs');
console.log('in a, b.done =', b.done);
exports.done = true;

// b.cjs
exports.done = false;
const a = require('./a.cjs');
console.log('in b, a.done =', a.done);
exports.done = true;
// → in b, a.done = false
// → in a, b.done = true
```

`b.cjs` receives `a`'s partial `exports` (`done: false`). Reading a property that doesn't exist yet gives `undefined`, and Node.js prints a warning, "Accessing non-existent property 'x' of module exports inside circular dependency". Here the cycle is silent but the data is stale; in ESM the same mistake is a loud `ReferenceError`.

### Trade-offs

ESM's behavior makes mistakes visible and keeps live bindings useful, but code that works in a cycle depends on evaluation order. Lazy access (reading the import inside a function) is robust in both systems. Refactoring to remove the cycle is better still.

## Exercises

### Change the entry point

What happens when the program starts from the other file?

```js
// Same a.mjs and b.mjs as in the example, started with:
//   node b.mjs
```

**Answer:** It throws `ReferenceError: Cannot access 'b' before initialization` from `a.mjs`, and prints nothing from `b.mjs` (run in Node.js 24). From `b.mjs`, the cycle is entered at `b`, so `a.mjs` runs first and reads `b` before `b.mjs` has executed `export const b`.
