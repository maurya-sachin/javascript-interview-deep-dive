---
title: "Why does a `for (var i…)` loop with `setTimeout` print the same number?"
status: draft
difficulty: medium
frequency: 5
core: false
tags: [closures, loops, let, var, environment-records]
related:
  - javascript/closures/what-is-a-closure
  - javascript/scope-and-execution-contexts/var-let-const
  - javascript/async-and-the-event-loop/event-loop
  - javascript/functions/iife
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-createperiterationenvironment
  - https://tc39.es/ecma262/#sec-forbodyevaluation
  - https://tc39.es/ecma262/#sec-runtime-semantics-forloopevaluation
  - https://tc39.es/ecma262/#sec-runtime-semantics-forin-div-ofbodyevaluation-lhs-stmt-iterator-lhskind-labelset
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout
  - https://chromium.googlesource.com/v8/v8.git/+/main/docs/runtime/scopes-and-scope-infos.md
tldr: >
  `var i` creates one binding for the whole function, and every callback closes over that
  same binding. The timers run after the loop has finished, when `i` is 3. With
  `for (let i…)`, the spec copies `i` into a fresh Environment Record for each iteration
  (CreatePerIterationEnvironment), so each callback captures its own `i`.
---

## Answer

`for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))` logs `3` three times. Two facts combine:

1. **There is only one `i`.** `var` is function-scoped: it's declared once in the enclosing function's (or module's) environment, and the loop reassigns that single binding. Each arrow closes over the environment, not over a value of `i`.
2. **The callbacks run later.** `setTimeout` queues a task; tasks run only after the current synchronous code finishes. By then the loop has exited — and it exits when `i < 3` is false, so `i` is `3`, not `2`.

**Fix 1: `let`.** A `for (let …)` loop gets special treatment in the spec, beyond normal block scoping. `ForLoopEvaluation` marks the `let` names as per-iteration bindings, and `ForBodyEvaluation` calls `CreatePerIterationEnvironment` before the first test and again after every body, before the increment. Each call creates a new Declarative Environment Record and copies the current value into it. A callback created in iteration *k* captures record *k*; the increment then runs against the next record, so it never changes an earlier one.

**Fix 2: give each callback its own binding with a function call** — the pre-ES2015 approach. An IIFE or factory function taking `i` as a parameter creates a new Function Environment Record per call. `setTimeout(fn, 0, i)` and `array.forEach((item, i) => …)` work the same way: the value arrives as an argument, bound fresh for each call.

`for…of` and `for…in` with `let` or `const` also create a new environment per iteration, so they're safe. `const` in a classic `for (;;)` is not: it has no per-iteration copy and throws a `TypeError` at the first `i++`.

## Example

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log('var', i)); // one shared `i`
}

for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log('let', j)); // a new `j` per iteration
}

for (var k = 0; k < 3; k++) {
  ((n) => setTimeout(() => console.log('param', n)))(k); // each call binds its own `n`
}

// → var 3
// → var 3
// → var 3
// → let 0
// → let 1
// → let 2
// → param 0
// → param 1
// → param 2
```

## Pitfalls

- Answering `2 2 2`. The loop only stops once the test fails, so the shared `i` ends at `3`.
- Blaming the delay. `setTimeout(fn, 0)` still runs after the loop; changing the delay changes nothing. The bug is the shared binding.
- Explaining the `let` fix as "block scoping" alone. Block scoping would give the whole loop one `i`; the fix is the per-iteration copy the spec makes for `let` declared in the loop head. Declare `let i` before the loop and assign it in the head, and you're back to `3 3 3`.
- Fixing only the counter. Any other `var` assigned inside the body (say `var item = list[i]`) is still one shared binding.

## Follow-ups

**Q:** If `i++` runs after the copy, why doesn't it change the previous callback's `i`?
**A:** Because the increment runs in the new record. `CreatePerIterationEnvironment` makes the next record, copies the value, and switches the running context to it before `i++` evaluates. The previous record keeps whatever value it had at the end of its body.

**Q:** What does a closure created in the loop's initializer see?
**A:** The environment created for the declaration, before any per-iteration copy. In `for (let i = 0, first = () => i; …)`, `first()` returns `0` forever: increments happen only in the copies.

**Q:** Does creating a new environment per iteration cost anything?
**A:** Rarely enough to matter. The spec describes a copy per iteration, but engines only have to preserve the observable behaviour; in V8, a variable no closure references isn't heap-allocated at all. When closures do capture it, each needs its own storage — that's the point.

## Exercises

### Fix the bug

```js
function makeHandlers(names) {
  const handlers = [];
  for (let i = 0; i < names.length; i++) {
    var name = names[i];
    handlers.push(() => `clicked ${name}`);
  }
  return handlers;
}
console.log(makeHandlers(['save', 'undo']).map((handler) => handler()));
```

**Answer:** It prints `[ 'clicked undo', 'clicked undo' ]`. Switching the counter to `let` wasn't enough: `var name` is one function-scoped binding, reassigned every iteration, and both handlers close over it. Change it to `const name = names[i]`; the loop body block gets a new Declarative Environment Record each iteration, so it prints `[ 'clicked save', 'clicked undo' ]`.

### Predict the output

```js
const seen = [];
for (let i = 0, first = () => i; i < 3; i++) {
  seen.push(() => [i, first()]);
}
console.log(seen.map((f) => f()));
```

**Answer:** `[ [ 0, 0 ], [ 1, 0 ], [ 2, 0 ] ]`. Each pushed arrow captures that iteration's copy of `i`. `first` was created in the initializer, so it captured the original loop environment, whose `i` stays `0` — every increment happens in a later copy.
