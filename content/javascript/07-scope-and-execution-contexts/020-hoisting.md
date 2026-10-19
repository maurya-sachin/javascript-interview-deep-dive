---
title: "What is hoisting, really?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [hoisting, scope, declarations, var, functions, annex-b]
related:
  - javascript/scope-and-execution-contexts/var-let-const
  - javascript/scope-and-execution-contexts/temporal-dead-zone
  - javascript/scope-and-execution-contexts/environment-records
  - javascript/functions/function-forms
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-globaldeclarationinstantiation
  - https://tc39.es/ecma262/#sec-functiondeclarationinstantiation
  - https://tc39.es/ecma262/#sec-blockdeclarationinstantiation
  - https://tc39.es/ecma262/#sec-block-level-function-declarations-web-legacy-compatibility-semantics
  - https://nodejs.org/docs/latest-v24.x/api/modules.html#the-module-wrapper
  - https://developer.mozilla.org/en-US/docs/Glossary/Hoisting
tldr: >
  The spec has no "hoisting" step and moves no code. Before a scope's code runs, the engine
  instantiates every declaration in it: `var` bindings start as `undefined`, function declarations
  are created already holding their function, and `let`/`const`/`class` bindings exist but are
  uninitialized (the TDZ). "Hoisting" is the name for the visible effect.
---

## Answer

"Hoisting" is informal. The spec describes it as **declaration instantiation**: when a scope is entered (a script, a function call, or a block), the engine first scans it for declarations and creates all their bindings in that scope's Environment Record. Only then does the code run, top to bottom. Nothing is physically moved; the bindings simply already exist.

What each declaration gets at that point:

- **`var`**: binding created and initialized to `undefined`. Reading it early gives `undefined`; the assignment happens when execution reaches the statement.
- **Function declaration**: binding created and initialized with the function object. You can call it before the line where it appears. If the same name is declared twice, the last declaration wins.
- **`let`, `const`, `class`**: binding created but uninitialized. Reading it before the declaration runs throws a `ReferenceError` (the temporal dead zone).
- **Function expressions and arrow functions**: just the variable's own rule. `var f = function () {}` hoists `f` as `undefined`, not the function.
- **`import`**: bindings are created when the module is linked, before any of its code runs.

Two details come up in interviews. Function declarations beat `var` of the same name at instantiation, and `var f;` without an initializer doesn't overwrite them. And a function declared in a block is block-scoped in strict code, but sloppy-mode web code also gets a function-scoped `var` copy (Annex B).

## Example

```js
console.log(typeof declared); // → function
console.log(counter); // → undefined
try {
  console.log(limit);
} catch (error) {
  console.log(error.name); // → ReferenceError
}
console.log(typeof expression); // → undefined

function declared() {}
var counter = 1;
let limit = 10;
var expression = function () {};
```

## Pitfalls

- Saying "declarations are moved to the top". The code order never changes, and `let`/`const` prove it: their bindings exist but cannot be read until the declaration runs.
- Saying "`let` and `const` aren't hoisted". They are instantiated at scope entry; they just start uninitialized.
- Expecting `var x = 1` to hoist the assignment. Only the binding is created early; the `= 1` runs in place.
- Relying on sloppy-mode block functions. `if (ok) { function f() {} }` leaks `f` to the function scope in browsers but not in strict code, and the leak is `undefined` until the block runs.

## Follow-ups

**Q:** Why can you call a function declaration before its definition but not an arrow function?
**A:** The function declaration is instantiated with its function object at scope entry. `const fn = () => {}` only creates an uninitialized binding; the arrow is created when that line runs.

**Q:** Does hoisting happen per function call?
**A:** Yes. Every call creates a new Function Environment Record and instantiates the body's declarations again, so each call has its own bindings.

**Q:** Why did `let` need a TDZ instead of being initialized to `undefined`?
**A:** An early read of `let` or `const` is almost always a bug, and `const` could not be "initialized to `undefined`, then assigned". Throwing catches the mistake. See the TDZ question.

## Deep dive

### How it works

The spec has one instantiation operation per scope kind, each run before the scope's first statement:

- **GlobalDeclarationInstantiation** for scripts.
- **FunctionDeclarationInstantiation** for every function call.
- **BlockDeclarationInstantiation** for blocks, `switch` bodies, and so on.
- Module and `eval` code have their own variants.

Each follows the same pattern. First it collects the names. *Var-scoped* declarations are `var` and top-level function declarations; *lexically scoped* ones are `let`, `const`, `class`, and block-level functions. Conflicts inside one scope (a `let` that clashes with a `var`) are early errors, so the code never runs; `GlobalDeclarationInstantiation` also checks names against earlier scripts and throws a `SyntaxError` at run time. Then it creates bindings. Plain `var` names that aren't already bound (as a parameter, say) are initialized to `undefined`. Function declarations are *initialized* with a function object from `InstantiateFunctionObject`, which beats a `var` of the same name. `let`, `const`, and `class` get uninitialized bindings, and `InitializeBinding` runs later when the declaration is evaluated.

That ordering explains the classic puzzles:

```js
function order() {
  console.log(typeof item); // → function
  var item = 1; // the assignment runs in place
  console.log(typeof item); // → number
  function item() {}
}
order();

function param(value) {
  var value; // no initializer, so the parameter's value survives
  return value;
}
console.log(param(5)); // → 5
```

When one name has several function declarations, instantiation keeps only the last, so `function a(){}; function a(){}` leaves the second.

### Edge cases

- **Block-level functions in strict code.** Inside a block, a function declaration is lexically scoped like `let`, and is initialized at block entry. Outside the block the name isn't visible:

```js
console.log(typeof inner); // → undefined
{
  console.log(typeof inner); // → function
  function inner() {}
}
console.log(typeof inner); // → undefined
```

- **Annex B for sloppy code.** *Legacy:* in non-strict scripts on web-compatible hosts, a block function also creates a function-scoped `var` binding (initialized to `undefined`) if that wouldn't cause an early error. When the declaration is evaluated, the block's value is copied to that `var`, which holds `undefined` until then. Node.js wraps each CommonJS file in a plain function, which is sloppy, so this runs there too, but ES modules don't see it:

```js
// Sloppy script or CommonJS file, not an ES module
console.log(typeof legacy); // → undefined
if (true) {
  function legacy() {}
}
console.log(typeof legacy); // → function
```

- **Default parameters** create a second environment for the body's `var`s, so a body `var x` doesn't share a binding with a parameter-scope closure. This is covered in the scope-chain question.
- **`class` and `let` at the top of a block** shadow outer names from the first line of the block, even before the declaration, which is why `{ console.log(x); let x; }` throws instead of reading an outer `x`.

### Trade-offs

Function-declaration hoisting lets you put the main logic first and helpers below, and it makes mutually recursive functions work with no ordering. The cost is that `var` hoisting hides bugs: using a variable before assignment gives `undefined` instead of an error. Modern style (`const` for values, function declarations or arrows after use) leans on each rule where it is safe.

## Exercises

### Predict the output

```js
function run() {
  console.log(typeof helper, typeof maybe);
  var maybe = function () {};
  function helper() {}
}
run();
```

**Answer:** `function undefined`. `helper` is instantiated with its function at call time. `maybe` is a `var` initialized to `undefined`; the function expression is assigned later.

### Which line throws?

```js
let size = 1;
function measure() {
  console.log(size);
  let size = 2;
}
measure();
```

**Answer:** The `console.log` throws `ReferenceError` ("Cannot access 'size' before initialization" in V8). The inner `let size` is instantiated at function entry and shadows the outer `size`, but it is uninitialized until its declaration line runs.
