---
title: "What is the temporal dead zone?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [tdz, let, const, class, scope, typeof]
related:
  - javascript/scope-and-execution-contexts/hoisting
  - javascript/scope-and-execution-contexts/var-let-const
  - javascript/scope-and-execution-contexts/environment-records
  - javascript/functions/default-and-rest-parameters
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-let-and-const-declarations-runtime-semantics-evaluation
  - https://tc39.es/ecma262/#sec-declarative-environment-records-getbindingvalue-n-s
  - https://tc39.es/ecma262/#sec-typeof-operator-runtime-semantics-evaluation
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cant_access_lexical_declaration_before_init
tldr: >
  The TDZ is the period between entering a scope and evaluating a `let`, `const`, or `class`
  declaration. The binding already exists but is uninitialized, and reading or assigning it throws
  a `ReferenceError`. It is defined by execution time, not by position in the source, and
  `typeof` doesn't escape it.
---

## Answer

The **temporal dead zone** (TDZ) is the span of time from entering a scope until a `let`, `const`, or `class` declaration in it is evaluated. During that span the binding exists but is *uninitialized*. Any read or write of it throws a `ReferenceError`; the spec's `GetBindingValue` and `SetMutableBinding` on a Declarative Environment Record check for this.

Key points:

- **"Temporal", not "textual".** The zone is about *when* code runs. A function defined above a `let` can read it safely, as long as it is called after the `let` line has run.
- **It proves the binding was hoisted.** An inner `let x` makes an earlier read of `x` in the same block throw, instead of falling through to an outer `x`.
- **`typeof` is not safe.** `typeof undeclared` returns `"undefined"` because the name is unresolvable. `typeof tdzName` throws, because the name resolves to an uninitialized binding.
- **Applies to `class` and parameters too.** `class` declarations behave like `let`, and parameters are initialized left to right, so a default can't use a later parameter.
- **Why it exists.** It turns a use-before-define bug into a loud error, and it makes `const` coherent: a constant can't be observed holding `undefined` first.

The zone ends when the declaration is evaluated. `let x;` with no initializer then sets `x` to `undefined`. The V8 message is "Cannot access 'x' before initialization"; the text is engine-specific, but the error type is not.

## Example

```js
function readLimit() {
  return limit;
}

try {
  readLimit();
} catch (error) {
  console.log(error.name, error.message);
  // → ReferenceError Cannot access 'limit' before initialization
}

let limit = 10;
console.log(readLimit()); // → 10

console.log(typeof neverDeclared); // → undefined

{
  try {
    typeof inBlock;
  } catch (error) {
    console.log(error.name); // → ReferenceError
  }
  let inBlock;
}
```

## Pitfalls

- Treating the TDZ as "the lines above the declaration". `readLimit` sits above `let limit` and works once the declaration has run.
- Assuming `typeof` never throws. It only avoids the error for names that aren't declared anywhere in scope.
- Writing `let value = value`, `class A extends A {}`, or `const x = x + 1` and expecting an outer variable. The new binding is in the TDZ while its own initializer runs.
- Using `typeof` as a guard for a `const` or `let` declared later in the same scope. It throws; guard with an explicit initialization order instead.

## Follow-ups

**Q:** Does the TDZ apply to `var`?
**A:** No. A `var` is initialized to `undefined` at scope entry, so there is no uninitialized state to observe.

**Q:** How can a default parameter hit the TDZ?
**A:** Parameters are bound in order. In `function f(a = b, b = 1) {}`, evaluating `a`'s default reads `b` before it is initialized, so calling `f()` throws a `ReferenceError`.

**Q:** Does the TDZ exist in module scope?
**A:** Yes. A module's top-level `let`, `const`, and `class` follow the same rule, which is why a circular import that reads another module's `let` export too early throws.

## Exercises

### Shadowed by a later `let`

```js
const level = 'outer';
function show() {
  if (true) {
    console.log(level);
    const level = 'inner';
  }
}
try {
  show();
} catch (error) {
  console.log(error.name);
}
```

**Answer:** `ReferenceError`. The `const level` is instantiated when the `if` block is entered, so `console.log(level)` resolves to it, not to the outer `level`, and finds it uninitialized.

### Default parameters

```js
function build(first = second, second = 'b') {
  return [first, second];
}
console.log(build('a'));
try {
  build();
} catch (error) {
  console.log(error.name);
}
```

**Answer:** `[ 'a', 'b' ]`, then `ReferenceError`. With `'a'` passed, the default for `first` is never evaluated. Without it, the default reads `second`, which is still uninitialized.
