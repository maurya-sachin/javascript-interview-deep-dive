---
title: "Why does a `for (var i…)` loop with `setTimeout` print the same number?"
status: draft
difficulty: medium
frequency: 5
core: true
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

## Deep dive

### How it works

Read `ForBodyEvaluation` as a loop with a fixed order of steps:

1. `ForLoopEvaluation` evaluates `let i = 0` in an initial `loopEnv`, then calls `ForBodyEvaluation`.
2. `CreatePerIterationEnvironment` runs once before the first test. It builds a new Declarative Environment Record whose outer environment is the same as the old one's, creates a binding for each name in `perIterationBindings`, and initializes it with the previous record's current value.
3. Each pass then runs, in the current record: the test, the body, a *new* `CreatePerIterationEnvironment`, and finally the increment.

Two consequences follow from that order. The increment never touches the record the body used, and the body's last write to `i` is what gets copied forward. For `const` declarations, `ForLoopEvaluation` passes an empty `perIterationBindings` list, so no copy is made, which is the spec reason `for (const i = 0; …; i++)` increments the one immutable binding and throws.

You can see the order by putting closures in the other clauses:

```js
const fns = [];
for (let i = 0; i < 3; fns.push(() => i), i++) {}
console.log(fns.map((fn) => fn())); // → [ 1, 2, 3 ]

const inTest = [];
for (let i = 0; (inTest.push(() => i), i < 3); i++) {}
console.log(inTest.map((fn) => fn())); // → [ 0, 1, 2, 3 ]

const bodyEdits = [];
for (let i = 0; i < 6; i++) {
  bodyEdits.push(() => i);
  i++; // changes this iteration's `i`, then the value is copied forward
}
console.log(bodyEdits.map((fn) => fn())); // → [ 1, 3, 5 ]
```

The closure in the increment clause is created *after* the new record exists and *before* `i++`, so the increment then mutates the very record it captured: it sees `1, 2, 3`, not `0, 1, 2`. The closure in the test is created in the record the body will use, so it keeps that iteration's final value, and the fourth test (which fails) adds a record with `3`.

### Edge cases

- **Mutating the counter in the body is visible later.** The `bodyEdits` loop above skips by two because the in-body `i++` is copied into the next record, and each closure keeps the value its own record ended with.
- **`for…of` and `for…in` are different machinery.** With a `let` or `const` head, `ForIn/OfBodyEvaluation` creates a new Declarative Environment Record for every iteration and binds the next value into it. There is no copy because there is no increment, so `for (const x of list)` is safe; a `var` head is still one binding.
- **A `var` declared in the body is still one binding** per function call, whatever the loop head does, as the first exercise shows.

### Real-world scenario

The classic production form of this bug is attaching listeners in a loop and reading state when the event fires, long after the loop ended. The handler isn't slow or flaky, it just reads the final counter, and the symptom (`undefined` or the last item) looks like a data problem:

```js
const buttons = [new EventTarget(), new EventTarget(), new EventTarget()];
const labels = ['save', 'undo', 'redo'];

for (var i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', () => console.log('var:', labels[i]));
}
for (let j = 0; j < buttons.length; j++) {
  buttons[j].addEventListener('click', () => console.log('let:', labels[j]));
}

buttons[0].dispatchEvent(new Event('click'));
// → var: undefined
// → let: save
```

With `var`, the first button's handler reads `labels[3]`, which is `undefined`. The example uses Node's `EventTarget` so it runs without a browser. Prefer iterating over the data (`labels.forEach((label, index) => …)` or `for (const [index, label] of labels.entries())`) so each handler captures its own argument instead of a shared index.

### Trade-offs

A `let` loop head is the smallest change and keeps index-based control (skipping, reverse iteration, early exit). `for…of` or array methods remove the counter entirely, so there is no mutable shared state to get wrong, at the cost of needing `entries()` when you want the index. An IIFE or `.bind` per iteration is a pre-ES2015 workaround that adds a function call and noise in code that can use `let`. Keep any mutation of the loop variable inside the body out of loops whose closures matter, since the next record inherits it.

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
