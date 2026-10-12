---
title: "What is lexical scope, and how does the scope chain work?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [scope, lexical-scope, scope-chain, shadowing, closures]
related:
  - javascript/scope-and-execution-contexts/environment-records
  - javascript/scope-and-execution-contexts/hoisting
  - javascript/closures/what-is-a-closure
  - javascript/this/this-binding-rules
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-environment-records
  - https://tc39.es/ecma262/#sec-getidentifierreference
  - https://tc39.es/ecma262/#sec-newfunctionenvironment
  - https://tc39.es/ecma262/#sec-functiondeclarationinstantiation
  - https://developer.mozilla.org/en-US/docs/Glossary/Scope
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions#function_scope
  - https://chromium.googlesource.com/v8/v8.git/+/main/docs/runtime/scopes-and-scope-infos.md
tldr: >
  Lexical (static) scope means a variable's visibility is fixed by where the code is written, not
  where it is called. Each function remembers the environment it was created in; each call's
  Environment Record points to it, and name lookup walks that outer chain until it finds a binding
  or reaches the global scope.
---

## Answer

**Lexical scope** means that which variables a piece of code can see is decided by the *nesting of the source text*, not by the call stack. A function sees its own bindings, then those of the function or block around it, and so on outward to the global scope.

The mechanism, in spec terms:

1. Every scope is an **Environment Record** with an `[[OuterEnv]]` pointer to the record that surrounds it in the source.
2. When a function is created, it stores the current environment in its `[[Environment]]` slot.
3. When it is called, a new Function Environment Record is created whose `[[OuterEnv]]` is that stored environment. The *caller's* environment plays no part.
4. To resolve an identifier, `GetIdentifierReference` checks the current record, then follows `[[OuterEnv]]` one link at a time. The first record with a binding wins; reaching `null` without a hit means the name is unresolvable, which throws a `ReferenceError` on read.

That chain is the **scope chain**. A nearer binding hides a farther one of the same name; this is **shadowing**. The kinds of scope are the global scope, module scope, function scope, block scope (including `catch` and `for` loop heads), and class static blocks.

Contrast this with **dynamic scope**, where a function sees the caller's variables. JavaScript doesn't do that for identifiers. The one thing that is chosen by the call site is `this`.

Because the chain is known from the source, engines resolve most names at compile time. V8, for instance, resolves each reference to a stack slot or a context slot when it compiles the function, rather than searching by name at run time.

## Example

```js
const label = 'global';

function makeReader() {
  const label = 'makeReader';
  return function read() {
    return label; // found one link out, in makeReader's record
  };
}

function runFromElsewhere() {
  const label = 'runFromElsewhere'; // the caller's variables are not on the chain
  return makeReader()();
}

console.log(runFromElsewhere()); // → makeReader
console.log(makeReader().name); // → read
```

## Pitfalls

- Answering that a function sees the variables of whoever called it. That is dynamic scope; JavaScript resolves names by where the function was *defined*.
- Thinking `var` and `let` shadow the same way. A `var` inside a block is visible to the whole function, so it can shadow or collide with names you thought were block-local.
- Shadowing by accident. Reusing `data`, `item`, or `err` in an inner scope silently hides the outer one; a linter rule (`no-shadow`) catches it.
- Assigning to an undeclared name in sloppy mode. It creates a global property instead of failing; strict mode and modules throw a `ReferenceError`.

## Follow-ups

**Q:** Is the scope chain the same as the call stack?
**A:** No. The call stack records who called whom; the scope chain records where each function was written. They only line up for a function defined inside the function that calls it.

**Q:** Does a block create a scope?
**A:** For `let`, `const`, `class`, and function declarations inside it, yes: a new Declarative Environment Record. A `var` skips it and attaches to the function.

**Q:** Why is lexical scope good for tooling?
**A:** Bundlers, linters, and minifiers can rename and resolve variables from the source alone. Dynamic scope would make that impossible.

## Deep dive

### How it works

Take the example above. When `makeReader()` is called, a Function Environment Record `R1` is created with `label = 'makeReader'`, and `R1.[[OuterEnv]]` is the module record. The inner `read` function object is created while `R1` is the running `LexicalEnvironment`, so `read.[[Environment]]` is `R1`. Calling `read()` creates `R2` with `R2.[[OuterEnv]] = R1`. Resolving `label` checks `R2` (empty), then `R1` (hit). `runFromElsewhere`'s record is never visited.

This is also what a closure is: a function plus its `[[Environment]]`. The chain keeps `R1` reachable as long as `read` is.

Every call creates a new record, so two calls to `makeReader` produce two independent chains.

### Edge cases

- **Named function expressions** get their own tiny scope holding just their name, outside the function's own scope. The name is visible inside but not around it:

```js
const outer = function inner() {
  return typeof inner;
};
console.log(outer()); // → function
console.log(typeof inner); // → undefined
```

- **Default parameters** can add a second environment. When parameters contain expressions, the spec puts the body's `var`s in a separate record, so a closure created in a default expression sees the parameters, not the body's declarations:

```js
const x = 'outer';
function pick(read = () => x) {
  var x = 'body';
  return read();
}
console.log(pick()); // → outer
```

  Here `read` was created in the parameter scope, where `x` resolves to the outer `x`; the body's `var x` lives one level in.

- **`catch (e)`** creates a scope for `e`. A `for (let …)` head creates a scope per iteration.
- **Direct `eval` and `with`** can add bindings or change lookup at run time, which defeats compile-time resolution. They're covered nowhere else in this chapter; avoid them.
- **Scripts vs modules.** In a classic script, top-level names live in the Global Environment Record and are shared by every script on the page. In a module they live in a private Module Environment Record.

### Trade-offs

Static scope costs flexibility (you can't inject variables into a function from outside) but buys predictability and speed: reading a local is a slot access rather than a name lookup. The deeper the chain, the more records a lookup crosses, but engines only keep a record on the heap when a closure actually needs it, so shallow, closure-free code pays almost nothing.

## Exercises

### Which `value`?

```js
const value = 'global';
function show() {
  console.log(value);
}
function run() {
  const value = 'local';
  show();
}
run();
```

**Answer:** `global`. `show` was defined at module level, so its `[[Environment]]` is the module record. `run`'s local `value` is not on `show`'s chain, even though `run` called it.

### Block shadowing with `var`

```js
function f() {
  var n = 1;
  {
    var n = 2;
  }
  return n;
}
function g() {
  let n = 1;
  {
    let n = 2;
  }
  return n;
}
console.log(f(), g());
```

**Answer:** `2 1`. In `f` there is only one `n` (function-scoped), so the block's `var n = 2` reassigns it. In `g` the inner `let n` is a separate binding in the block's own record and shadows the outer one only inside the block.
