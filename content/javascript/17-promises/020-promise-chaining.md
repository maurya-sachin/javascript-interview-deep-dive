---
title: "How does promise chaining work?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [promise, then, chaining, thenable, adoption, microtask, species]
related:
  - javascript/promises/what-is-a-promise
  - javascript/promises/promise-error-handling
  - javascript/async-and-the-event-loop/task-microtask-ordering
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-promise.prototype.then
  - https://tc39.es/ecma262/#sec-performpromisethen
  - https://tc39.es/ecma262/#sec-newpromisereactionjob
  - https://tc39.es/ecma262/#sec-createresolvingfunctions
  - https://tc39.es/ecma262/#sec-newpromiseresolvethenablejob
  - https://tc39.es/ecma262/#sec-newpromisecapability
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
tldr: >
  `then` always returns a new promise. Whatever its handler returns resolves that promise through the same
  resolution procedure as `resolve()`: a plain value fulfills it, a thrown error rejects it, a returned
  promise or thenable is adopted. A missing handler passes the result through. Returning a native promise
  costs two extra microtask ticks.
---

## Answer

`p.then(onFulfilled, onRejected)` returns a **new** promise, `p2`, and never changes `p`. When `p` settles, the matching handler runs as a microtask, and its outcome decides `p2`:

- The handler **returns a value:** `p2` is resolved with it, so a plain value fulfills it.
- The handler **throws:** `p2` is rejected with the error.
- The handler **returns a promise or thenable:** `p2` adopts it, staying pending until it settles and then copying its state. This is how async steps sequence.
- The handler is **missing or not a function:** the result passes through. A fulfillment reaches the next `onFulfilled`, a rejection reaches the next `onRejected` or `catch`. That is why one `.catch` at the end handles any earlier failure.

Chaining is `.then` on the promise that `.then` returned. A flat chain such as `step1().then(step2).then(step3).catch(handleError)` replaces nested callbacks, because each step receives the previous step's result.

Remember to `return` the inner promise. A handler that starts async work without returning it makes `p2` fulfill with `undefined` immediately, so the next step does not wait.

Chaining and branching are different. `p.then(a).then(b)` runs `b` after `a`. `p.then(a); p.then(b)` runs both from `p` independently, in registration order, and a failure in one does not affect the other.

Adopting a returned native promise is not free: it takes two extra microtask ticks compared to returning a plain value, so ordering between interleaved chains can surprise you (see the deep dive).

Handlers are called with `this` as `undefined`, and `then` may be called many times on the same promise.

## Example

```js
const wait = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));

wait(10, 2)
  .then((n) => n * 10)
  .then((n) => wait(10, n + 1))
  .then((n) => {
    console.log(n);
    throw new Error('bad');
  })
  .then(() => console.log('skipped'))
  .catch((error) => `recovered: ${error.message}`)
  .then(console.log);
// → 21
// → recovered: bad
```

## Pitfalls

- Forgetting `return` in a handler. The next `then` runs at once with `undefined`, and the inner promise's rejection is not part of the chain.
- Nesting `.then` inside `.then` instead of returning the inner promise. It works, but it brings back the pyramid and separates errors from the outer `catch`.
- Passing a call instead of a function, as in `.then(doNext())`. `doNext()` runs immediately, and its result (not a function) is ignored by `then`.
- Assuming `.catch` ends the chain. It returns a promise that fulfills with the handler's return value, so later `then` handlers run unless the handler rethrows.

## Follow-ups

**Q:** Does `p.then()` return `p`?
**A:** No. It returns a new promise that mirrors `p`. Both handlers are missing, so the result passes through unchanged.

**Q:** What if a handler returns the promise `then` itself returned?
**A:** That promise would wait for itself, so the resolution procedure rejects it with a `TypeError` (the self-resolution check).

**Q:** Do subclasses chain into the subclass?
**A:** Yes. `then` asks `SpeciesConstructor` for the constructor, so `Sub.resolve().then()` is a `Sub`. `Symbol.species` can override this.

## Deep dive

### How it works

`then` does three things. It checks that `this` is a real promise (`IsPromise`), uses `SpeciesConstructor` to pick the constructor, and calls `NewPromiseCapability(ctor)` to make the result promise `p2` with its `resolve` and `reject`. `PerformPromiseThen` then creates two **reaction records**, one for fulfill and one for reject, each holding the handler (or "empty") and the capability for `p2`.

If `p` is pending, the records are appended to its reaction lists. If `p` is already settled, a reaction job is enqueued immediately. When a pending promise settles, `TriggerPromiseReactions` enqueues one job per record in order.

The reaction job, `NewPromiseReactionJob`, is where chaining happens:

1. If the handler is empty, the result is the incoming value (for fulfill) or a throw of the reason (for reject). That is the pass-through.
2. Otherwise, call the handler with `undefined` as `this`.
3. If it returned normally, call `capability.[[Resolve]](result)`. If it threw, call `capability.[[Reject]](error)`.

Step 3 is the same resolving function the constructor hands to an executor. So returning a promise or thenable follows the exact rules for `resolve(x)` in the previous question: a self-reference rejects with `TypeError`, a `then` getter that throws rejects, a callable `then` is called from a `NewPromiseResolveThenableJob`.

### Edge cases

The extra ticks. A handler that returns a native promise does not fulfill `p2` directly. `p2`'s resolve function enqueues a `NewPromiseResolveThenableJob` (tick 2), which calls `returned.then(resolveP2, rejectP2)`. The returned promise is already fulfilled, so that enqueues a reaction job (tick 3), which fulfills `p2` and enqueues its handlers (tick 4).

```js
Promise.resolve()
  .then(() => { console.log('a1'); return Promise.resolve('x'); })
  .then(() => console.log('a2'));
Promise.resolve()
  .then(() => console.log('b1'))
  .then(() => console.log('b2'))
  .then(() => console.log('b3'))
  .then(() => console.log('b4'));
// → a1
// → b1
// → b2
// → b3
// → a2
// → b4
```

Return `'x'` instead of a promise and `a2` runs right after `b1`, in tick 2. Ordering like this is spec-defined, because every engine must queue the same jobs; it is the observable cost of calling `then` on the returned promise instead of reading its state directly.

Pass-through and `then` never touching `p`:

```js
const p = Promise.resolve('kept');
console.log(p.then() === p);                       // → false
p.then(null).then(undefined, 1).then(console.log); // → kept

Promise.reject(new Error('r'))
  .then((value) => value)                           // skipped: reject passes through
  .then(null, (error) => `recovered ${error.message}`)
  .then(console.log);                               // → recovered r
```

### Real-world scenario

Running async tasks one after another from a list: each `.then` waits for the previous task's returned promise because it adopts it.

```js
const sleep = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));
const tasks = [() => sleep(20, 'a'), () => sleep(10, 'b'), () => sleep(1, 'c')];

const results = [];
tasks
  .reduce(
    (chain, task) => chain.then(task).then((value) => results.push(value)),
    Promise.resolve(),
  )
  .then(() => console.log(results)); // → [ 'a', 'b', 'c' ]
```

Even though `c` is the fastest, the order is fixed by the chain. A plain `for…of` with `await` is the same thing with less ceremony; the `reduce` form still appears in older code and in interview questions.

### Trade-offs

In the spec's model, each `then` creates a promise, two reaction records and a job, even when you ignore the result; engines may optimise the details. `async`/`await` avoids the visible nesting but uses the same machinery underneath. Chains are good when each step is a short pure transformation; once the steps need shared variables or loops, `await` reads better. Chains also keep errors in one place: a single `.catch` at the end covers every step before it.

## Exercises

### Branches and a chain

```js
const p = Promise.resolve();
p.then(() => console.log('A'));
p.then(() => console.log('B')).then(() => console.log('D'));
p.then(() => console.log('C'));
console.log('sync');
```

**Answer:** `sync`, `A`, `B`, `C`, `D`. Three reactions are queued on `p` in registration order and run in that order. `D` is queued only after `B` has run, so it comes after `C`.

### The missing return

```js
const wait = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));

Promise.resolve(1)
  .then((n) => {
    wait(10, n + 1).then(console.log);
  })
  .then((value) => console.log('next', value));
```

**Answer:** `next undefined`, then `2` about 10 ms later. The first handler returns `undefined`, so the second `then` does not wait for the inner promise. Writing `return wait(10, n + 1)` instead would make the second `then` wait and print only `next 2`.
