---
title: "What is an IIFE, and do you still need one?"
status: draft
difficulty: easy
frequency: 3
core: false
tags: [functions, iife, scope, modules]
related:
  - javascript/closures/private-state
  - javascript/scope-and-execution-contexts/var-let-const
  - javascript/functions/function-forms
  - javascript/modules/es-module-loading
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-expression-statement
  - https://developer.mozilla.org/en-US/docs/Glossary/IIFE
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
tldr: >
  An IIFE is a function expression called as soon as it is created, wrapped in parentheses so it
  parses as an expression: `(function () { ... })()`. It gave classic scripts a private scope. Block
  scope and ES modules replaced that; today it mostly survives as an async IIFE or a way to compute
  a value with several statements.
---

## Answer

An **immediately invoked function expression** is a function expression that is called right where it is written: `(function () { ... })()` or `(() => { ... })()`.

**Why the parentheses.** A statement cannot *start* with the token `function`. The grammar for `ExpressionStatement` has a lookahead restriction against `{`, `function`, `async function`, `class`, and `let [`, so `function () {}()` is parsed as a declaration, which needs a name and can't be called. Wrapping in `(...)`, or any operator that forces expression context (`!`, `void`, `=`), makes it an expression. The expression position removes the ambiguity.

**What it gave you.** Calling a function creates a new function scope, so `var`s and helper functions inside stay private, and the closure lets the IIFE return an API (the module pattern). That solved global-namespace pollution in classic scripts before modules existed.

**Do you still need one?** Mostly no:

- Private scope: `{ let x }` blocks, or an ES module, where top-level declarations are module-scoped.
- Private state: a module-level variable, a factory function, or a class `#private` field.
- Per-iteration capture in loops: `let` in `for` creates a binding per iteration.

**Still useful:** an `async` IIFE to use `await` in a context without top-level `await` (CommonJS, older scripts), and a one-off initialisation that needs statements but must produce a `const` value.

## Example

```js
// Run as CommonJS or a classic script; in an ES module top-level `var` is already module-scoped.
(function () {
  var hidden = 'inside'; // never reaches the outer scope
})();
console.log(typeof hidden); // → undefined

const total = (() => {
  const prices = [3, 4, 5];
  return prices.reduce((sum, p) => sum + p, 0); // many statements, one expression
})();
console.log(total); // → 12

const counter = (function () {
  let n = 0;
  return { next: () => ++n };
})();
counter.next();
console.log(counter.next()); // → 2

console.log(!function () { return 1; }()); // → false  (a leading `!` also forces an expression)

// The modern replacements:
{
  let blockScoped = 'block';
}
console.log(typeof blockScoped); // → undefined
(async () => {
  console.log(await Promise.resolve('async IIFE')); // → async IIFE
})();
```

## Pitfalls

- Omitting the leading semicolon in code that gets concatenated or lacks semicolons. A line like `foo\n(function () {})()` is parsed as `foo(function...)`, so a previous statement without `;` gets called as a function.
- Forgetting the final `()` (or the wrapping parentheses). `(function () { ... })` just creates a function.
- Using `this` inside a non-arrow IIFE and expecting the outer `this`. A plain call gives `undefined` in strict code and `globalThis` in sloppy code.
- Leaving an async IIFE without error handling. A rejection becomes an unhandled promise rejection; add `.catch(...)` or `try/catch`.

## Follow-ups

**Q:** Is `(function () {}())` different from `(function () {})()`?
**A:** No. Both put the function in expression position and call it. The first wraps the whole call in parentheses, the second only the function.

**Q:** Why was `void function () {}()` or `!function () {}()` used?
**A:** Same reason: the operator forces expression context without needing a pair of parentheses. The result of the operator is discarded or negated, so use it only when the value doesn't matter.

**Q:** What replaced the module pattern?
**A:** ES modules, which give each file its own scope and explicit `export`s.

## Exercises

### Predict the output

Run as CommonJS.

```js
const fns = [];
for (var i = 0; i < 3; i++) {
  (function (j) {
    fns.push(() => j);
  })(i);
}
console.log(fns.map((f) => f()));
```

**Answer:** `[ 0, 1, 2 ]`. Each iteration calls the IIFE with the current `i`, creating a new function scope whose `j` is that value. With `let i` in the `for` head and no IIFE, you get the same result.
