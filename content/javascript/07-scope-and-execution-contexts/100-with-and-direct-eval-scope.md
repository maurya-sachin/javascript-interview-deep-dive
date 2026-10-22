---
title: "How do `with` and direct `eval` change scope at run time?"
status: draft
difficulty: hard
frequency: 2
core: false
tags: [scope, with, eval, environment-records, symbol-unscopables, sloppy-mode]
related:
  - javascript/metaprogramming/eval-direct-indirect
  - javascript/scope-and-execution-contexts/environment-records
  - javascript/scope-and-execution-contexts/var-let-const
  - javascript/scope-and-execution-contexts/global-object-globalthis
  - javascript/metaprogramming/well-known-symbols
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-performeval
  - https://tc39.es/ecma262/#sec-evaldeclarationinstantiation
  - https://tc39.es/ecma262/#sec-with-statement
  - https://tc39.es/ecma262/#sec-with-statement-runtime-semantics-evaluation
  - https://tc39.es/ecma262/#sec-with-statement-static-semantics-early-errors
  - https://tc39.es/ecma262/#sec-object-environment-records-hasbinding-n
  - https://tc39.es/ecma262/#sec-object-environment-records-withbaseobject
  - https://tc39.es/ecma262/#sec-array.prototype-%symbol.unscopables%
  - https://chromium.googlesource.com/v8/v8/+/main/src/ast/scopes.cc
tldr: >
  Sloppy direct `eval` runs in the caller's scope and can add `var` bindings to the caller's
  function or global scope. Strict eval gets its own variable environment, and `let`/`const` in eval
  never leak. `with (obj)` pushes an object Environment Record, so free names resolve against
  `obj`'s properties, filtered by `Symbol.unscopables`. Neither name set is knowable before run time.
---

## Answer

Normally scope is fixed by the source text, so each name can be resolved before the code runs. Two features break that, and both only fully work in sloppy code.

**Direct `eval`** (indirect eval is a separate question) runs the string in the caller's environments. `PerformEval` gives the eval code a fresh declarative record for its `let`, `const` and `class`, so those never escape. Its `var` and function declarations go into the caller's VariableEnvironment — so sloppy `eval('var x = 1')` inside a function creates a new local `x` at run time, possibly shadowing an outer `x` that earlier lines used. If the caller or the eval code is strict, step "If strictEval is true, set variableEnv to lexicalEnv" applies: `var`s stay inside the eval. `EvalDeclarationInstantiation` also throws a SyntaxError if a hoisted `var` would collide with a `let` or `const` between the eval and the function scope, and creates eval's `var`s as deletable bindings.

**`with (obj) stmt`** wraps the current scope in an Object Environment Record whose bindings are `obj`'s properties, own and inherited. Each free identifier in `stmt` first asks `HasProperty(obj, name)`. If the property exists and `obj[Symbol.unscopables]` doesn't mark the name true, reads and writes go to `obj`; otherwise lookup continues outward — so assigning a name `obj` lacks can create an implicit global. The unscopables check is why `Array.prototype` hides `values`, `keys`, `includes` and other post-ES5 methods from `with` blocks. Functions found on `obj` are called with `obj` as `this`. `with` is a SyntaxError in strict code, so it can't appear in modules or classes.

The result is the same in both cases: whether a name refers to a local, an outer variable, a property, or a global can depend on run-time data. Tools can't rename or remove variables safely, and engines lose static resolution.

## Example

```js
// Run as sloppy code: CommonJS (.cjs) or a classic script, not a module.
var x = 'outer';
function inject(code) {
  const before = x;    // outer x
  eval(code);          // sloppy direct eval: var lands in this function
  return [before, x];  // now the injected local
}
console.log(inject('var x = "injected"'), x); // → [ 'outer', 'injected' ] outer

function strictEval() {
  eval('"use strict"; var x = "eval-only"');
  return x;
}
console.log(strictEval()); // → outer

function clash() {
  let y = 1;
  { eval('var y = 2'); } // var would hoist over the let
}
try { clash(); } catch (e) { console.log(e.name); } // → SyntaxError

const cfg = { a: 1 };
with (cfg) { a = 2; b = 3; } // b isn't on cfg: implicit global
console.log(cfg.a, cfg.b, globalThis.b); // → 2 undefined 3

const values = 'outer values';
with ([10, 20]) { console.log(length, values); } // → 2 outer values
```

## Pitfalls

- Expecting `let` or `const` inside `eval` to be visible afterwards. Only sloppy `var` and function declarations reach the caller.
- Assigning inside `with` to a name the object doesn't have. It goes to the outer scope, or creates a global in sloppy code.
- Assuming `with` sees only own properties. Inherited ones count too, which is why `Symbol.unscopables` exists.
- Treating `with` plus a Proxy as a sandbox. It changes name lookup, not what code can reach through the objects it's given.

## Follow-ups

**Q:** Why does `Array.prototype` have a `Symbol.unscopables` object?
**A:** ES2015 and later editions added methods such as `values`, `keys` and `includes`. Code like `with (arr) { values.push(x) }` that meant an outer `values` would suddenly resolve to the method. The null-prototype object lists names `with` must skip, so old code keeps working.

**Q:** Why do engines optimise these functions worse?
**A:** Optimisers rely on knowing each name's binding ahead of time. In V8's scope analysis, a name inside `with` can't be statically resolved, and any variable an inner direct `eval` might reach is forced into a heap context instead of a stack slot and marked as possibly assigned.

**Q:** Does strict mode remove direct eval's scope effects entirely?
**A:** No. Strict direct eval still reads and writes the caller's existing bindings, and its `var`s just stay private. It can't create new bindings in the caller.

## Deep dive

### How it works

Every free identifier is resolved by `GetIdentifierReference`, which calls `HasBinding` on each record outward. For a `with` record that call is user-observable: `HasProperty` can hit a Proxy `has` trap, and when the property exists, `Get(obj, @@unscopables)` can run a getter. A spy shows that every free name in the block is checked against the object at run time:

```js
const seen = [];
const spy = new Proxy({}, { has(target, key) { seen.push(key); return false; } });
with (spy) { Math.max(1, 2); }
console.log(seen); // → [ 'Math' ]
```

`max` isn't looked up, because it's a property access, not an identifier. Sloppy direct eval is the other half: it can only add bindings to the nearest function or global VariableEnvironment, but the compiler can't know which names in advance.

V8 handles both conservatively. The comments in `src/ast/scopes.cc` say a variable that might be accessed "through an eval() call or a runtime with lookup" must be allocated in the heap context, and names inside a `with` scope "can not be statically resolved". So those names are resolved by searching the context chain at run time instead of loading a known slot.

### Trade-offs

Neither feature has a modern use that a clearer construct doesn't cover. Destructuring replaces `with` for short names; `new Function` with explicit parameters, or an indirect eval, runs generated code without touching local scope. Keep code strict (modules and classes are) and these effects disappear, apart from strict direct eval still reading local bindings.

## Exercises

### Predict the output

```js
// sloppy code
function f() {
  eval('var n = 1; let m = 2');
  return [typeof n, typeof m, delete n, typeof n];
}
console.log(f());
```

**Answer:** `[ 'number', 'undefined', true, 'undefined' ]`. The sloppy direct eval adds `n` to `f`'s variable environment; `m` lives in the eval's own lexical record. Bindings created by eval are deletable, so `delete n` removes it — unlike an ordinary `var`, where `delete` returns `false`.
