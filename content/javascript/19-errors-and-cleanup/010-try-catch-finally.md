---
title: "How do `try`, `catch`, and `finally` interact with `return`?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [try-catch, finally, completion-record, return, throw, control-flow]
related:
  - javascript/promises/promise-error-handling
  - javascript/errors-and-cleanup/custom-errors
  - javascript/errors-and-cleanup/async-error-boundaries
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-try-statement
  - https://tc39.es/ecma262/#sec-completion-record-specification-type
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch
  - https://eslint.org/docs/latest/rules/no-unsafe-finally
tldr: >
  `finally` always runs after `try` or `catch`, however control leaves them. If `finally` completes normally,
  the earlier `return` or `throw` still happens, and the returned value was already computed. If `finally`
  itself returns, throws, breaks, or continues, that replaces the earlier outcome, so a `return` there
  swallows a pending error.
---

## Answer

A `try` statement evaluates its block to a **completion**: normal, `return`, `throw`, `break`, or `continue`. The `catch` and `finally` clauses then run according to that completion.

- **`catch` runs only for a throw.** Its parameter is bound to the thrown value, and the `catch` block's own completion becomes the result. If `catch` throws, the new error replaces the old one.
- **`finally` runs for every completion.** That includes `return`, `break`, `continue`, and a throw that no `catch` handled.
- **A normal `finally` is transparent.** The original `return` or `throw` is resumed afterwards. A `return` operand is evaluated *before* `finally` runs, so changes `finally` makes to that variable do not change the returned value.
- **An abrupt `finally` wins.** A `return`, `throw`, `break`, or `continue` inside `finally` discards the pending outcome. A `return` in `finally` therefore silently swallows an error from `try`. Linters flag this (`no-unsafe-finally`), so avoid it.
- **Optional catch binding.** `catch { ... }` is allowed when you do not need the error.
- **You can throw any value.** `throw 'oops'` or `throw { code: 1 }` is legal, and `catch` receives it as is. Such values have no `stack`, and `instanceof Error` is `false`. Throw `Error` objects so callers get a stack and a `message`.

Use `finally` for cleanup that must run on every path, such as releasing a lock or hiding a spinner. Do not put control flow in it.

## Example

```js
function normalFinally() {
  const log = [];
  try {
    return log;
  } finally {
    log.push('finally ran'); // mutates the object that is returned
  }
}
function primitiveReturn() {
  let value = 1;
  try {
    return value; // operand evaluated here
  } finally {
    value = 2;
  }
}
function overridesReturn() {
  try {
    throw new Error('boom');
  } finally {
    return 'swallowed'; // replaces the pending throw
  }
}

console.log(normalFinally());
// → [ 'finally ran' ]
console.log(primitiveReturn());
// → 1
console.log(overridesReturn());
// → swallowed
```

## Pitfalls

- `return`, `throw`, `break`, or `continue` inside `finally` replaces the pending result. The most harmful form is a `return` that hides a real error.
- Throwing in `finally` (or in `catch`) loses the original error. If both matter, attach the first as `cause`, or use `using`, which keeps both (see the explicit resource management question).
- Expecting `finally` to change a returned primitive. The value was captured when `return` evaluated its operand. For an object, `finally` can still mutate the same object.
- Wrapping a promise-returning call in `try` without `await`. `return promise` leaves the `try` block before the promise settles, so `catch` cannot see the rejection (see the async error boundaries question).

## Follow-ups

**Q:** Does `finally` run if `try` calls `return`?
**A:** Yes. The `return` operand is evaluated first, then `finally` runs, then the function returns that value. Only an abrupt completion in `finally` can replace it.

**Q:** Does `finally` run when a generator is closed early?
**A:** Yes. Leaving a `for...of` loop with `break` calls the iterator's `return()`. For a generator that resumes it at the `yield` with a return completion, so its `finally` blocks run.

**Q:** When does `finally` not run?
**A:** When the process or thread ends first: `process.exit()`, a crash, a killed worker, or an infinite loop in `try`.

## Deep dive

### How it works

The spec models every statement result as a **Completion Record** with a type (`normal`, `return`, `throw`, `break`, `continue`) and a value. The `try` evaluation rules in the spec are short:

1. Evaluate the `try` block, giving `blockResult`.
2. If it is a `throw` completion and there is a `catch`, evaluate the catch clause with the thrown value. Its completion becomes `catchResult`. Otherwise `catchResult` is `blockResult`.
3. If there is a `finally`, evaluate it to get `finallyResult`. **If `finallyResult` is normal, use `catchResult`; otherwise use `finallyResult`.**

That third rule is the whole story of "finally overrides return". A `return` statement does not leave the function immediately. It produces a `return` completion that travels outward, and `finally` runs in the middle of that trip. Because the operand of `return` is evaluated when the completion is created, `readsBeforeFinally` returns `1`.

The `catch` clause creates a new declarative environment for its parameter. A thrown value of any type is bound there, so `catch (e)` works for strings and numbers, and a destructuring pattern such as `catch ({ code })` is allowed.

### Edge cases

Because `break` and `continue` are completions too, a `finally` can cancel a pending throw or return from inside a loop.

```js
for (const i of [1, 2]) {
  try {
    throw new Error(`error ${i}`);
  } finally {
    break; // discards the pending throw
  }
}
console.log('no error escaped');
// → no error escaped

try {
  try {
    throw new Error('first');
  } catch {
    throw new Error('second');
  } finally {
    throw new Error('third');
  }
} catch (error) {
  console.log(error.message);
}
// → third
```

Each newer error replaces the older one with no trace of it. Nothing links them unless you do it yourself, for example with `new Error('...', { cause })`.

Nesting follows the same rule at each level. An inner `finally` runs before the outer `catch`, and the outer `finally` runs last:

```js
function nested() {
  try {
    try {
      throw new Error('inner');
    } finally {
      console.log('inner finally');
    }
  } catch (error) {
    console.log('caught', error.message);
    return 'done';
  } finally {
    console.log('outer finally');
  }
}
console.log(nested());
// → inner finally
// → caught inner
// → outer finally
// → done
```

### Trade-offs

Prefer a narrow `try`. Wrapping a whole function hides which call failed and catches programming errors (`TypeError`) along with expected failures. Catch what you can handle, and rethrow the rest. Keep `finally` to cleanup that cannot fail. If cleanup itself can throw, you are choosing which error to lose. That is the problem `using` solves by combining both errors.

## Exercises

### Order of evaluation

```js
const trace = (label, value) => {
  console.log(label);
  return value;
};

function run() {
  try {
    return trace('evaluate return operand', 'result');
  } finally {
    trace('finally');
  }
}
console.log(run());
```

**Answer:** `evaluate return operand`, `finally`, `result` (run in Node 24). The operand is evaluated first, `finally` runs next, and the function then returns the saved value.

### Which error escapes

```js
function f() {
  try {
    try {
      throw new Error('inner');
    } finally {
      console.log('inner finally');
    }
  } catch (error) {
    console.log('caught', error.message);
    return 'done';
  } finally {
    console.log('outer finally');
  }
}
console.log(f());
```

**Answer:** `inner finally`, `caught inner`, `outer finally`, `done` (run in Node 24). No error escapes: the outer `catch` handles it and returns, and the outer `finally` then runs without overriding `'done'`.

### `finally` with `continue`

```js
for (const n of [1, 2, 3]) {
  try {
    if (n === 2) continue;
    console.log('body', n);
  } finally {
    console.log('finally', n);
  }
}
```

**Answer:** `body 1`, `finally 1`, `finally 2`, `body 3`, `finally 3` (run in Node 24). `continue` is a completion, so `finally` still runs for iteration 2, but `body 2` is skipped.
