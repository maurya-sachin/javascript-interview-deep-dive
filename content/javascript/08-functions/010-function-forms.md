---
title: "Function declarations vs expressions vs arrow functions — what actually differs?"
status: draft
difficulty: easy
frequency: 5
core: true
tags: [functions, hoisting, arrow-functions, constructors, methods]
related:
  - javascript/scope-and-execution-contexts/hoisting
  - javascript/closures/what-is-a-closure
  - javascript/this/this-binding-rules
  - javascript/this/arrow-functions-this
  - javascript/functions/arguments-object
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-function-definitions
  - https://tc39.es/ecma262/#sec-runtime-semantics-instantiateordinaryfunctionobject
  - https://tc39.es/ecma262/#sec-runtime-semantics-instantiateordinaryfunctionexpression
  - https://tc39.es/ecma262/#sec-runtime-semantics-instantiatearrowfunctionexpression
  - https://tc39.es/ecma262/#sec-makeconstructor
  - https://tc39.es/ecma262/#sec-functiondeclarationinstantiation
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions
tldr: >
  A declaration is instantiated when its scope is entered, so it is callable before its line; an
  expression is created when evaluated. Declarations and `function` expressions have their own
  `this` and `arguments` and are constructors. Arrows have neither binding and can't be
  constructed. Method shorthand has its own `this`, can use `super`, and can't be constructed.
---

## Answer

The forms differ in three things: **when the function object exists**, **which bindings it owns** (`this`, `arguments`), and **whether it has `[[Construct]]`** (works with `new`).

- **Declaration** (`function f() {}`). The function object is created when the enclosing scope is entered (during `FunctionDeclarationInstantiation` or block/module setup), before any line runs. That is why you can call it above its definition.
- **Expression** (`const f = function () {}`). The function object is created when the expression is evaluated, so the binding follows normal `var`/`let`/`const` rules: `undefined` for `var` before the assignment, a TDZ `ReferenceError` for `let`/`const`. A *named* function expression also binds its own name, visible only inside the function.
- **Arrow** (`() => {}`). Also an expression, but with no `this`, `arguments`, `super`, or `new.target` of its own; it reads them from the enclosing environment. It has no `prototype` and no `[[Construct]]`, so `new` throws a `TypeError`.
- **Method shorthand** (`{ m() {} }`, class methods). Has its own `this` and can use `super`, but is not a constructor.

Which forms are constructors: declarations and `function` expressions are. Arrows, methods, getters/setters, and async functions are not. Generators are not either, though they do have a `prototype` property (used for the generator objects they create).

Rule of thumb: arrows for callbacks and short helpers where you want the surrounding `this`; declarations or methods when you want a hoisted name or a dynamic `this`; never an arrow as an object method that reads `this`.

## Example

```js
console.log(typeof declared); // → function
console.log(typeof expression); // → undefined
try {
  arrow();
} catch (e) {
  console.log(e.name); // → ReferenceError
}

function declared() {}
var expression = function () {};
const arrow = () => {};

const counter = {
  method() { return this === counter; },
  arrow: () => this, // `this` of the enclosing module scope
};
console.log(counter.method(), counter.arrow()); // → true undefined

function Tag() {}
console.log(new Tag() instanceof Tag); // → true
try {
  new arrow();
} catch (e) {
  console.log(e.message); // → arrow is not a constructor
}
```

## Pitfalls

- Saying "function expressions aren't hoisted". The `var`/`const` binding is hoisted; only the *function object* is created later. The error you get depends on the declaration keyword, not on the function.
- Using an arrow as an object method or prototype method and reading `this`. The arrow captured the outer `this`; in module code that is `undefined`.
- Calling `new` on an arrow, method, or async function and expecting it to work. These have no `[[Construct]]`.
- Relying on block-level function hoisting in sloppy mode. Behaviour there is a web-compatibility legacy, not clean scoping.

## Follow-ups

**Q:** What does `new` need from a function?
**A:** A `[[Construct]]` internal method. `MakeConstructor` adds it (and a `prototype` object) when a declaration or `function` expression is created. Arrow and method definitions never call it.

**Q:** Do arrows get `arguments`?
**A:** No. `FunctionDeclarationInstantiation` sets `argumentsObjNeeded` to false for lexical-this functions, so `arguments` resolves to the enclosing function's object. Use rest parameters.

**Q:** Does the form change the function's `name`?
**A:** Anonymous functions take a name from the binding or property they're assigned to (`const f = () => {}` gives `"f"`). The form doesn't matter; the assignment syntax does.

## Deep dive

### How it works

Every form goes through `OrdinaryFunctionCreate`, which records the current Environment Record in `[[Environment]]` (see the closures chapter), the parameter list, the body, and a `[[ThisMode]]`: *lexical* for arrows, *non-lexical* (strict or sloppy) for everything else. The differences come from what happens next.

- `InstantiateOrdinaryFunctionObject` (declarations) runs while the scope is being set up: for a function body, step "for each `funcDecl` of `funcsToInitialize`" in `FunctionDeclarationInstantiation`; for modules and scripts, the equivalent declaration-instantiation step. The binding is initialized with the finished function before the first statement executes. If a name is declared twice, the last declaration wins.
- `InstantiateOrdinaryFunctionExpression` runs when evaluation reaches the expression. It calls `OrdinaryFunctionCreate`, `SetFunctionName`, and then `MakeConstructor`, so a `function` expression is a constructor with a fresh `prototype` object.
- `InstantiateArrowFunctionExpression` calls `OrdinaryFunctionCreate` with *lexical-this* and `SetFunctionName`, and stops. No `MakeConstructor`, so no `[[Construct]]` and no `prototype`. When the arrow runs, `this`, `arguments`, `super`, and `new.target` aren't found in its own Function Environment Record and resolve outward.
- Method definitions (`DefineMethod`) create a non-lexical function and record a `[[HomeObject]]` so `super` works. They also skip `MakeConstructor`.

### Edge cases

Constructor status is not the same as having a `prototype`:

```js
const kinds = {
  method() {},
  fn: function () {},
  arrow: () => {},
  async af() {},
  *gen() {},
};
for (const [name, f] of Object.entries(kinds)) {
  let canNew = true;
  try { new f(); } catch { canNew = false; }
  console.log(name, canNew, 'prototype' in f);
}
// → method false false
// → fn true true
// → arrow false false
// → af false false
// → gen false true
```

A generator has a `prototype` (the prototype of its generator objects) but no `[[Construct]]`.

Name binding scope differs too. A declaration puts its name in the enclosing scope. A named function expression puts its name in a private scope visible only inside the function:

```js
const countdown = function tick(n) {
  return n === 0 ? 'done' : tick(n - 1);
};
console.log(countdown(2), typeof tick); // → done undefined
```

Function declarations inside blocks are scoped to the block in strict code and modules. *Legacy:* in sloppy mode, Annex B also creates a function-level `var` that is assigned when the declaration is evaluated, so the name leaks out of the block; its exact behaviour varies in corners, and strict code avoids all of it.

Duplicate parameter names are legal only in sloppy functions with a simple parameter list, and `function dup(a, a)` is a `SyntaxError` in strict code, in arrows, and in methods.

### Real-world scenario

Callbacks are where the choice shows up. A prototype method passed bare loses its receiver (see the `this` chapter), while an arrow written inline keeps it:

```js
class Poller {
  interval = 50;
  start() {
    // Arrow: `this` is the Poller, taken from start()'s environment.
    setTimeout(() => console.log(this.interval), 0);
    // A plain `function () {}` here would get its own `this` at call time.
  }
}
new Poller().start(); // → 50
```

The reverse: event-handler or method code that *wants* the caller-supplied `this` (`element.addEventListener('click', function () { this… })`, prototype methods, DOM libraries) must not be an arrow.

### Trade-offs

Arrows are shorter and remove a class of `this` bugs, but they can't be constructed, can't see their own call's `arguments`, and show up as anonymous in stack traces unless assigned to a name. Declarations are hoisted and named, which suits top-level utilities and mutual recursion; the cost is that code reads out of order if you lean on hoisting. Method shorthand is the clearest for object and class members: it gets `super` and a name, and the missing `[[Construct]]` stops accidental `new`.

## Exercises

### Predict the output

```js
const settings = {
  theme: 'dark',
  getTheme() { return this.theme; },
  getThemeArrow: () => typeof this,
};
const read = settings.getTheme;
console.log(settings.getTheme(), settings.getThemeArrow());
try {
  console.log(read());
} catch (e) {
  console.log(e.name);
}
```

**Answer:** Run as a module: `dark undefined`, then `TypeError`. The arrow's `this` is the module's `this`, which is `undefined`, so `typeof this` is `"undefined"`. The extracted `read()` is called with no receiver in strict code, so `this` is `undefined` and `this.theme` throws.

### Predict the output

```js
console.log(typeof a, typeof b);
function a() {}
var b = function () {};
```

**Answer:** `function undefined`. The declaration `a` is initialized to its function on scope entry; `b` is a hoisted `var` that is `undefined` until its assignment runs.
