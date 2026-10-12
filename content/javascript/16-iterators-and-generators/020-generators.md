---
title: "How do generators pause and resume?"
status: draft
difficulty: hard
frequency: 3
core: true
tags: [generator, yield, yield-star, execution-context, coroutine, iterator]
related:
  - javascript/iterators-and-generators/iteration-protocols
  - javascript/async-and-the-event-loop/async-await-mechanics
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-generator-objects
  - https://tc39.es/ecma262/#sec-generatorresume
  - https://tc39.es/ecma262/#sec-generatorresumeabrupt
  - https://tc39.es/ecma262/#sec-generatorstart
  - https://tc39.es/ecma262/#sec-generator-function-definitions-runtime-semantics-evaluation
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator
tldr: >
  Calling a `function*` runs its parameter setup and returns a generator object without running the body.
  Each `next(value)` resumes the body's suspended execution context until the next `yield`, which hands a
  value out and suspends again; `value` becomes the result of the `yield` expression. `return()` and
  `throw()` resume it with a return or throw completion, so `finally` blocks run.
---

## Answer

A generator function (`function*`) returns an iterator-and-iterable called a generator object. Calling it evaluates the arguments and parameter defaults and creates the object in the suspended-start state, but runs none of the body.

`next(value)` resumes the body. It runs until a `yield` expression, which suspends the function's execution context and makes `next()` return `{ value: <yielded>, done: false }`. The generator's local variables, scope and position are all kept. The next `next(arg)` resumes right there, and `arg` becomes the value of the `yield` expression. That makes communication two-way. The argument of the very first `next()` has no `yield` to receive it, so it is ignored.

When the body returns, or runs off the end, `next()` gives `{ value: returnValue, done: true }`; afterwards it keeps returning `{ value: undefined, done: true }`.

Two more methods resume with an abrupt completion at the suspended `yield`:

- `gen.return(v)` behaves like a `return v` at that point. `finally` blocks run, and a `yield` inside `finally` can suspend it again.
- `gen.throw(e)` behaves like `throw e` at that point. A surrounding `try…catch` in the generator can handle it.

On a generator that has not started, both skip the body: `return(v)` completes it with `v`, and `throw(e)` completes it and throws `e`.

`yield* iterable` delegates: it forwards `next`, `throw` and `return` to the inner iterator, and its value is the inner iterator's return value.

Generators are lazy, single-pass, and run to completion only if you drive them. They are the practical way to write an iterator, and a `for…of` that `break`s calls `return()`, which runs the generator's `finally`. A generator cannot be an arrow function or used with `new`, and calling `next()` from inside itself throws a `TypeError`.

## Example

```js
function* session() {
  console.log('body started');
  try {
    const name = yield 'name?';
    const age = yield `hi ${name}, age?`;
    return `${name} is ${age}`;
  } finally {
    console.log('cleanup');
  }
}

const first = session();
console.log('created');               // → created
console.log(first.next('ignored'));   // → body started
                                      // → { value: 'name?', done: false }
console.log(first.next('Ada'));       // → { value: 'hi Ada, age?', done: false }
console.log(first.next(36));          // → cleanup
                                      // → { value: 'Ada is 36', done: true }

const second = session();
second.next();                        // → body started
console.log(second.return('stop'));   // → cleanup
                                      // → { value: 'stop', done: true }
```

## Pitfalls

- Expecting the body to run when the function is called. Only parameter binding does. Side effects at the top of the body appear on the first `next()`.
- Expecting the first `next(x)` to deliver `x`. It is dropped; prime the generator with a plain `next()`.
- Reading the return value from `for…of`, spread or `Array.from`. They ignore the `value` of the `done: true` result, so `return 2` is invisible to them.
- Assuming `return()` always finishes the generator at once. A `yield` inside `finally` suspends it again and returns `done: false`.

## Follow-ups

**Q:** Is a generator a thread or a coroutine?
**A:** A stackless coroutine. It suspends only at its own `yield` expressions, not from nested function calls, and all execution is still on the one thread. Delegating to another generator needs `yield*`.

**Q:** What does `yield*` return?
**A:** The inner iterator's final `value` (the one on its `done: true` result). Spread and `for…of` over the inner iterator discard that value; `yield*` is how you get it.

**Q:** How does this relate to `async`/`await`?
**A:** Same suspension mechanism, different driver. `await` suspends a function and resumes it from a promise reaction; a generator waits for the caller's `next()`.

## Deep dive

### How it works

The spec models a generator object with `[[GeneratorState]]` and `[[GeneratorContext]]`. The state is one of `suspended-start`, `suspended-yield`, `executing` or `completed`.

When you call a generator function, `EvaluateGeneratorBody` runs `FunctionDeclarationInstantiation` (arguments, defaults, scope setup), creates the generator object with `OrdinaryCreateFromConstructor` from the function's `prototype`, sets it to `suspended-start`, and runs `GeneratorStart`. `GeneratorStart` stores an Abstract Closure that evaluates the body and returns the object. Nothing in the body has run.

`next(value)` calls `GeneratorResume`:

1. `GeneratorValidate` requires the receiver to be a generator object, and throws a `TypeError` if the state is `executing`. That is the re-entrancy check.
2. If the state is `completed`, return `{ value: undefined, done: true }`.
3. Set the state to `executing` and resume the saved execution context with the normal completion `value`.

At a `yield`, `GeneratorYield` sets the state to `suspended-yield` and hands an IteratorResult back to the caller's execution context. The generator's context is kept off the execution context stack. The next resume pops it back on, and the `yield` expression evaluates to the resumption value. If the body finishes, the state becomes `completed` and the spec notes that its context is never resumed and can be discarded.

`return()` and `throw()` use `GeneratorResumeAbrupt`, which resumes with a return or throw completion. If the state is `suspended-start`, it first sets `completed`. For a `completed` generator, `return(v)` gives `{ value: v, done: true }` and `throw(e)` throws `e`.

The spec says nothing about how an engine stores the suspended context; only the observable behaviour is specified.

### Edge cases

Unstarted generators, `finally` that yields, and re-entrancy:

```js
function* body() { console.log('never runs'); try { yield 1; } finally { console.log('never'); } }
const a = body();
console.log(a.return('early')); // → { value: 'early', done: true }
console.log(a.next());          // → { value: undefined, done: true }

function* retry() {
  try { yield 1; } finally { yield 'cleanup-step'; }
}
const b = retry();
b.next();
console.log(b.return('R')); // → { value: 'cleanup-step', done: false }
console.log(b.next());      // → { value: 'R', done: true }

let running;
function* reenter() { running.next(); yield 1; }
running = reenter();
try { running.next(); } catch (e) { console.log(e.constructor.name); } // → TypeError
```

Because `return()` on an unstarted generator never enters the body, no `finally` runs. That is the rule: cleanup only exists once a `try` has been entered.

`yield*` delegation, including the result value:

```js
function* inner() {
  const received = yield 'a';
  return `inner got ${received}`;
}
function* outer() {
  const result = yield* inner();
  console.log(result);
  yield 'b';
}
const it = outer();
console.log(it.next());       // → { value: 'a', done: false }
console.log(it.next('sent')); // → inner got sent
                              // → { value: 'b', done: false }
console.log([...outer()]);    // → inner got undefined
                              // → [ 'a', 'b' ]
```

Per the spec's `yield*` steps, `next(x)` is forwarded to the inner `next`, `throw(e)` to the inner `throw` (if there is none, the spec closes the inner iterator and throws a `TypeError`), and `return(v)` to the inner `return` (if there is none, the outer generator just returns `v`). `yield*` works with any iterable, including arrays and strings.

### Real-world scenario

Before `async`/`await`, libraries such as `co` drove generators with promises. The shape is the one `async`/`await` later gave syntax to: the function body suspends at each `yield`, a driver resumes it with `next(value)` for a fulfilled promise, or `throw(error)` for a rejected one, so `try…catch` works across the suspension.

```js
function run(generatorFn) {
  const gen = generatorFn();
  function step(method, arg) {
    let result;
    try {
      result = gen[method](arg);
    } catch (error) {
      return Promise.reject(error);
    }
    if (result.done) return Promise.resolve(result.value);
    return Promise.resolve(result.value).then(
      (value) => step('next', value),
      (error) => step('throw', error),
    );
  }
  return step('next');
}

const wait = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));
run(function* () {
  const a = yield wait(10, 1);
  try {
    yield Promise.reject(new Error('boom'));
  } catch (error) {
    console.log('caught', error.message); // → caught boom
  }
  return a + (yield wait(10, 2));
}).then(console.log); // → 3
```

Today you write `async`/`await`; the practical uses of plain generators are lazy sequences, custom iterables, tree walks with `yield*`, and state machines driven by `next(input)`.

### Trade-offs

Generators give you pull-based laziness and resource-safe iteration in a few lines, where a hand-written iterator needs explicit state and `return()`. The costs: each generator object holds its suspended context while it lives, so abandoned half-finished generators keep their scope alive until collected; they are single-pass; the two-way `next(value)` channel is obscure, which makes it a poor fit for ordinary code (a plain callback or an object with methods is easier to read); and stack traces through `yield*` chains are harder to follow than plain calls.

## Exercises

### Predict the output

```js
function* counter() {
  let total = 0;
  while (true) {
    const step = yield total;
    total += step ?? 1;
  }
}
const c = counter();
console.log(c.next(10).value, c.next(5).value, c.next().value);
console.log(c.return(99), c.next());
```

**Answer:** `0 5 6`, then `{ value: 99, done: true } { value: undefined, done: true }`. The first `next(10)` is ignored and runs to the first `yield total` (0). `next(5)` makes `step` 5, so `total` is 5. `next()` gives `step` `undefined`, so `total` becomes 6. `return(99)` ends the loop (there is no `try`), and the generator stays completed.
