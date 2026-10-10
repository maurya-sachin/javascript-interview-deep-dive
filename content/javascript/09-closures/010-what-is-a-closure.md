---
title: "What is a closure?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [closures, environment-records, lexical-scope, scope-chain]
related:
  - javascript/scope-and-execution-contexts/environment-records
  - javascript/scope-and-execution-contexts/lexical-scope-chain
  - javascript/closures/closures-in-loops
  - javascript/closures/closure-memory
  - javascript/closures/private-state
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-environment-records
  - https://tc39.es/ecma262/#sec-ordinaryfunctioncreate
  - https://tc39.es/ecma262/#sec-newfunctionenvironment
  - https://tc39.es/ecma262/#sec-getidentifierreference
  - https://tc39.es/ecma262/#sec-runtime-semantics-instantiateordinaryfunctionexpression
  - https://tc39.es/ecma262/#sec-functiondeclarationinstantiation
  - https://tc39.es/ecma262/#sec-createdynamicfunction
  - https://tc39.es/ecma262/#sec-getthisenvironment
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures
  - https://chromium.googlesource.com/v8/v8.git/+/main/docs/runtime/function-architecture.md
  - https://react.dev/reference/react/useEffect
tldr: >
  A closure is a function plus the environment it was created in. When a function object
  is created, the spec stores the current Environment Record in its [[Environment]] slot;
  each call's new environment links to it as its outer scope. So the function resolves
  outer names lexically, against live bindings, even after the outer function has returned.
---

## Answer

A closure is a function together with the lexical environment it was created in. The spec has no separate "closure" object — it's two steps every ECMAScript function goes through, plus the lookup rule.

1. **Creation.** When a function declaration, expression, arrow, or method is instantiated, `OrdinaryFunctionCreate` stores the current Environment Record in the new function's `[[Environment]]` slot. (The spec's own algorithms name the result `closure`.)
2. **Call.** Each call runs `NewFunctionEnvironment`, which creates a fresh Function Environment Record for that call and sets its `[[OuterEnv]]` to the function's `[[Environment]]`.
3. **Lookup.** `GetIdentifierReference` checks the current record, then follows `[[OuterEnv]]` links outward until it finds the name or runs out of records (an unresolvable reference, so reading it throws a `ReferenceError`).

Three consequences interviewers look for:

- **Lexical, not dynamic.** The chain is fixed by where the function is written, not where it's called from.
- **Bindings, not values.** The function holds a reference to the record, so it sees later assignments and can assign too. Nothing is copied.
- **One environment per call.** Calling an outer function twice creates two records, so the functions it returns have independent state; functions created during the same call share one record.

So "every function is a closure" is technically true: a top-level function's `[[Environment]]` is the module or global environment. The word earns its keep when a function outlives the call that created its environment — returned, stored, or passed as a callback — and keeps that environment reachable. That's what private state, factories, and event handlers rely on, and it's also why closures can keep memory alive.

## Example

```js
function makeCounter() {
  let count = 0; // a binding in this call's environment
  return {
    increment: () => ++count, // both arrows capture that same environment
    read: () => count,
  };
}

const a = makeCounter(); // call 1 → environment #1
const b = makeCounter(); // call 2 → environment #2

a.increment();
a.increment();
b.increment();
console.log(a.read(), b.read()); // → 2 1

let label = 'draft';
const getLabel = () => label; // captures the binding, not the string
label = 'final';
console.log(getLabel()); // → final
```

## Pitfalls

- Saying a closure "snapshots" values. It holds the binding, so later writes are visible. The React "stale closure" is a different binding, not a snapshot: each render is a new call with its own `const count`, and a callback registered once keeps pointing at the first render's environment.
- Thinking only returned inner functions are closures. Callbacks passed to `setTimeout`, `addEventListener`, or `.then` capture their environment the same way.
- Assuming the caller's scope matters. A function called from a place with a same-named local still resolves names through its own `[[Environment]]`.
- Using `new Function(...)` and expecting it to see local variables. It is created with the realm's global environment, so it can't see function or module scope.

## Follow-ups

**Q:** Is the closure created when the function is defined or when it's called?
**A:** When the function object is created. Declarations are instantiated on entry to their enclosing scope (that's hoisting); expressions and arrows each time they're evaluated, so one inside a loop yields a new function object with its own `[[Environment]]` every iteration. A call only creates the inner environment.

**Q:** Do arrow functions close over `this`?
**A:** In effect, yes. An arrow's Function Environment Record has no `this` binding, so `GetThisEnvironment` walks outward to the nearest record that has one. Ordinary functions bind `this` per call, so they never inherit it from where they were written.

**Q:** When can the captured environment be garbage-collected?
**A:** Once no reachable function or running code references it. The spec doesn't define collection or say how environments are stored; in V8, only variables some inner function references are kept in a heap "context", and closures from one scope share it.

## Deep dive

### How it works

Trace the example with spec names. The module body runs in a Module Environment Record holding `makeCounter`, `a`, `b`, `label`, and `getLabel`. The function declaration `makeCounter` is instantiated when the module environment is set up, with that record as its `[[Environment]]` — which is why a declaration is callable before its line.

`makeCounter()` creates call environment #1 with `[[OuterEnv]]` = the module record. `let count = 0` creates a binding there. Evaluating each arrow runs `InstantiateArrowFunctionExpression`, which passes the running execution context's LexicalEnvironment — record #1 — to `OrdinaryFunctionCreate`. The call returns; the execution context is popped, but record #1 is still referenced by two function objects, so it stays alive.

```text
Module Environment Record { makeCounter, a, b, label, getLabel }
├─ call #1 record { count: 2 }  ← [[Environment]] of a.increment, a.read
└─ call #2 record { count: 1 }  ← [[Environment]] of b.increment, b.read
   (each call record's [[OuterEnv]] is the module record)
```

When `a.increment()` runs, `NewFunctionEnvironment` creates a short-lived record whose `[[OuterEnv]]` is record #1. Resolving `count` misses in the arrow's own record, follows `[[OuterEnv]]`, and finds the binding in #1; `++count` writes to that binding. `b`'s functions follow a different chain.

Two clarifications. First, the "current environment" at creation is the innermost one: a function created inside a block captures the block's Declarative Environment Record, not just the function's. That's the hook `for (let …)` loops use to give each iteration its own binding. Second, the spec states that Environment Records are purely specification mechanisms that need not correspond to anything in an implementation. Engines may store captured variables however they like, as long as the observable behaviour matches. In V8, each closure is a `JSFunction` pointing to shared, compiled code and to the `Context` it was created in.

### Edge cases

A named function expression gets one extra environment. `InstantiateOrdinaryFunctionExpression` creates a Declarative Environment Record between the function and its surroundings, holding an immutable binding of the function's own name. That's why the name is visible inside but not outside, and why reassigning it fails:

```js
const countdown = function tick(n) {
  if (n === 0) return 'done';
  return tick(n - 1); // `tick` resolves in a private environment
};
console.log(typeof tick); // → undefined
console.log(countdown(3)); // → done

const g = function self() {
  self = null; // immutable binding: TypeError in strict code
};
try { g(); } catch (e) { console.log(e.constructor.name); } // → TypeError
```

Parameter default values get their own environment when a function has parameter expressions. `FunctionDeclarationInstantiation` puts body `var`s in a separate record so closures created in the parameter list don't see body declarations:

```js
const x = 'outer';
function f(get = () => x) {
  var x = 'body';
  return get();
}
console.log(f()); // → outer
```

Other edges worth naming:

- `new Function(...)` runs `CreateDynamicFunction`, which uses the realm's global environment as `[[Environment]]`. In a module, that means it can't see module-level `const`s either.
- Arrow functions also have no `arguments` object of their own; `arguments` inside an arrow resolves outward like any other name.
- A direct `eval` inside a closure can name any binding in the chain at run time, so an engine can't prove any outer variable is unused.

### Real-world scenario

The classic React "stale closure" is this mechanism, not a snapshot. Every render is a fresh call of the component function, so each render has its own environment with its own `count`. A callback registered once — an effect with an empty dependency list that starts an interval — keeps the first render's environment for its whole life:

```js
let onTick;

function render(count) {
  // Each render is a new call → a new environment with its own `count`.
  onTick ??= () => console.log(`count is ${count}`); // registered once, like an effect with []
}

render(0);
render(1);
render(2);
onTick(); // → count is 0
```

The fixes follow from the mechanism: re-create the callback when `count` changes (list it as a dependency), or stop reading the captured binding at all — React's state updater form `setCount(c => c + 1)` receives the current value as an argument.

### Trade-offs

Closures are the cheapest way to pair behaviour with state that nobody else can reach, with no `this` to lose. The costs are allocation and retention. Each evaluation of a function expression creates a new function object, so a factory that returns five methods allocates five functions per instance, where class or prototype methods are shared; MDN recommends prototype methods for that reason when you create many instances. In V8 the compiled code is shared through the `SharedFunctionInfo`, so the per-closure cost is an object, not a copy of the code. Retention matters more: a long-lived closure keeps its environment chain reachable, which is the usual way closures leak memory.

## Exercises

### Predict the output

```js
const x = 'module';
function read() {
  return x;
}
function run() {
  const x = 'run';
  const local = () => x;
  const dynamic = new Function('return typeof x');
  return [read(), local(), dynamic()];
}
console.log(run());
```

**Answer:** `[ 'module', 'run', 'undefined' ]`. `read` resolves `x` through its own `[[Environment]]` (the module record), not through `run`'s scope. `local` was created inside `run`, so it finds `run`'s `x`. The `new Function` body is closed over the global environment, which has no `x` at all, because module-level declarations live in the Module Environment Record, not the global one.

### Predict the output

```js
function makeAccount() {
  let balance = 0;
  const deposit = (n) => (balance += n);
  return { deposit, balance, read: () => balance };
}
const account = makeAccount();
account.deposit(50);
console.log(account.balance, account.read());
```

**Answer:** `0 50`. The `balance` property was copied from the binding when the object literal was evaluated; it's an ordinary data property and never changes. `deposit` and `read` share the call's environment, so `read()` sees the updated binding.
