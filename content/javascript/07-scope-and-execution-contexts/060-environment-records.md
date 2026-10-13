---
title: "What is an Environment Record?"
status: draft
difficulty: hard
frequency: 1
core: true
tags: [environment-records, spec, scope, closures, modules, global]
related:
  - javascript/scope-and-execution-contexts/lexical-scope-chain
  - javascript/scope-and-execution-contexts/execution-context-call-stack
  - javascript/scope-and-execution-contexts/global-object-globalthis
  - javascript/closures/what-is-a-closure
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-environment-records
  - https://tc39.es/ecma262/#sec-the-environment-record-type-hierarchy
  - https://tc39.es/ecma262/#sec-function-environment-records
  - https://tc39.es/ecma262/#sec-module-environment-records
  - https://tc39.es/ecma262/#sec-global-environment-records
  - https://tc39.es/ecma262/#sec-object-environment-records-hasbinding-n
  - https://tc39.es/ecma262/#sec-createimportbinding
tldr: >
  An Environment Record is the spec's table of identifier bindings for one scope, plus an
  `[[OuterEnv]]` link to the enclosing one. There are declarative, function, module, object, and
  global kinds. Each evaluation of a function or block creates a new record, and closures keep the
  records they captured alive. They are spec-only: you can't touch them from code.
---

## Answer

An **Environment Record** maps identifier names to bindings for one scope. Every record has an `[[OuterEnv]]` field pointing to the surrounding record (or `null`), so records form the scope chain. Each time a function, block, or `catch` clause is *evaluated*, a new record is created; that is why two calls to the same function never share locals.

They are a specification device. An engine may store the bindings in registers, stack slots, or heap objects, and no JavaScript code can obtain a record.

The spec defines an abstract type and these concrete kinds:

| Kind | Used for | Notable |
|---|---|---|
| **Declarative** | Blocks, `catch`, `let`/`const`/`class`, plain scope | Bindings are stored directly and can be mutable, immutable, or uninitialized |
| **Function** (subtype) | One function invocation | Adds the `this` binding, the function object, and `new.target`; arrow functions don't have their own `this` |
| **Module** (subtype) | A module's top level | Adds *indirect* immutable bindings for imports, which read the exporter's live binding |
| **Object** | `with` statements and the global object | Bindings are the properties of an object; `with` consults `Symbol.unscopables` |
| **Global** | Scripts' top level | A composite of an Object record (the global object) and a Declarative record (`let`/`const`/`class`) |

Each binding has attributes: mutable or immutable, strict, deletable, initialized or not. These explain the observable rules: a `const` is an immutable binding (assignment throws a `TypeError`), a `let` before its declaration is an uninitialized binding (reads throw a `ReferenceError`), and a closure is a function whose `[[Environment]]` points at a record that outlives its call.

The operations are `HasBinding`, `CreateMutableBinding`, `CreateImmutableBinding`, `InitializeBinding`, `SetMutableBinding`, `GetBindingValue`, and `DeleteBinding`. Name resolution is `HasBinding` repeated along `[[OuterEnv]]`.

## Example

```js
function makeCounter() {
  let count = 0; // one binding in this call's Function Environment Record
  return {
    increment: () => ++count,
    read: () => count, // shares the same record as `increment`
  };
}

const first = makeCounter();
const second = makeCounter(); // a new call creates a new record
first.increment();
first.increment();
second.increment();
console.log(first.read(), second.read()); // → 2 1
```

## Pitfalls

- Equating a record with an object you can inspect. There is no API for it, and `globalThis` is only one part of the global record.
- Saying a closure "copies" variables. It keeps a reference to the record, so later assignments are visible and the record stays alive.
- Believing `let` at the top of a script is a property of the global object. It lives in the global record's Declarative part, so it has no property.
- Forgetting that blocks create records. A loop body with `let` makes a new record per iteration, while a `var` shares the function's single record.

## Follow-ups

**Q:** How does a function's `this` relate to Environment Records?
**A:** A non-arrow Function Environment Record stores `this`. An arrow function's record is marked lexical, so looking up `this` continues outward to the nearest enclosing record that has one.

**Q:** What is an immutable indirect binding?
**A:** A binding in a Module Environment Record for an `import`. It is read-only for the importer, and reads go to the exporting module's own binding, which is why imports are live and can't be reassigned.

**Q:** Why is the global record a composite?
**A:** Historical `var` and function declarations had to become properties of the global object, while `let` and `const` (added later) must not. One record holds both: an Object record for the properties and a Declarative record for lexical declarations.

## Deep dive

### How it works

When a function is called, `PrepareForOrdinaryCall` calls `NewFunctionEnvironment`, which makes a record with `[[OuterEnv]]` set to the function's `[[Environment]]`. `FunctionDeclarationInstantiation` then fills it:

1. Parameters become mutable bindings, initialized from the arguments.
2. Function declarations are created and initialized; `var` names are created and initialized to `undefined`.
3. `let`, `const`, and `class` names get *uninitialized* bindings, which `InitializeBinding` later sets when the declaration is evaluated.

If the parameter list contains expressions, the body's `var`s go into a second record whose outer link is the parameter record.

A block statement does `NewDeclarativeEnvironment(current)`, runs `BlockDeclarationInstantiation`, swaps the context's `LexicalEnvironment` to it, and swaps it back on exit. This is cheap in theory and often free in practice: engines can skip creating a record when nothing in the block is captured.

### Edge cases

- **Module records are live.** An import binding doesn't copy the value; it indirects to the exporter's record. A module's own namespace object shows this:

```js
export let count = 0;
export function bump() {
  count += 1;
}

import(import.meta.url).then((self) => {
  const before = self.count;
  bump();
  console.log(before, self.count, count); // → 0 1 1
  try {
    self.count = 5;
  } catch (error) {
    console.log(error.name); // → TypeError
  }
});
```

  (Run this as an ES module. Importing your own URL avoids a second file.)
- **Object records** make `with (obj) { … }` resolve names through `obj`'s properties. `HasBinding` there asks `HasProperty`, then, for `with`, skips any name whose `Symbol.unscopables` entry is truthy. That is how `Array.prototype` methods added later (like `flat`) stay out of old `with` code.
- **Global record lookups** check the Declarative part first, then the Object part. That is why a global `let Array = 1` shadows `Array` without touching the property, but `let undefined` is a `SyntaxError`: the global object's `undefined` is non-configurable.
- **`delete` on a binding** only works for bindings created as deletable, such as those from sloppy-mode `eval` or implicit globals.

### Trade-offs

The record model keeps the semantics of scopes small and uniform: one chain, one lookup algorithm, different storage rules. The cost is a gap between the model and reality. Engines optimize the records away, merge them, or allocate them on the stack, and they only have to match what code can observe. When you read V8 or SpiderMonkey internals, expect "contexts" or "scope objects" that approximate this model rather than copy it.

## Exercises

### Shared or separate?

```js
function make() {
  let total = 0;
  return [() => (total += 1), () => total];
}
const [addA, readA] = make();
const [, readB] = make();
addA();
addA();
console.log(readA(), readB());
```

**Answer:** `2 0`. Each `make()` call creates its own record. `addA` and `readA` close over the same one, so they share `total`; `readB` closes over the second call's record.

### Which binding kind?

```js
const answer = 42;
try {
  answer = 43;
} catch (error) {
  console.log(error.name);
}
try {
  console.log(later);
} catch (error) {
  console.log(error.name);
}
let later = 1;
```

**Answer:** `TypeError`, then `ReferenceError`. `answer` is an immutable binding, so assignment throws a `TypeError`. `later` exists in the module's record but is uninitialized until its declaration runs, so reading it throws a `ReferenceError`.
