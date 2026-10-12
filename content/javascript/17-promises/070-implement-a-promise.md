---
title: "Implement a Promise from scratch."
status: draft
difficulty: hard
frequency: 3
core: false
tags: [promise, implementation, promises-aplus, thenable, microtask, queuemicrotask, interview-coding]
related:
  - javascript/promises/what-is-a-promise
  - javascript/promises/promise-chaining
  - javascript/promises/implement-promise-all
verified: 2026-10
sources:
  - https://promisesaplus.com/
  - https://github.com/promises-aplus/promises-tests
  - https://tc39.es/ecma262/#sec-createresolvingfunctions
  - https://tc39.es/ecma262/#sec-promise.prototype.then
  - https://tc39.es/ecma262/#sec-newpromisereactionjob
  - https://tc39.es/ecma262/#sec-newpromiseresolvethenablejob
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/queueMicrotask
tldr: >
  A promise is a state machine (pending, then fulfilled or rejected once) plus a queue of reactions.
  `then` returns a new promise and registers a reaction; reactions run as microtasks. Handler results
  go through the resolution procedure: reject on self-reference, adopt thenables, else fulfill. The
  full version below passes all 872 Promises/A+ tests.
---

## Answer

Say the design before writing code. There are five pieces:

1. **State.** `pending`, `fulfilled` or `rejected`, plus the value or reason. Once settled, it never changes.
2. **Reactions.** `then` called on a pending promise stores a callback. When the promise settles, every stored reaction is scheduled in registration order.
3. **Asynchronous handlers.** Handlers never run inside `then` or inside `resolve`. Use `queueMicrotask`, available in browsers and Node, which is what native promises effectively do with their job queue.
4. **`then` returns a new promise.** Run the matching handler, and settle the new promise from the result: a returned value resolves it, a throw rejects it, and a missing handler passes the original outcome through.
5. **The resolution procedure.** `resolve(x)` is not "fulfill with x". If `x` is the promise itself, reject with `TypeError`. If `x` is an object or function, read `x.then` once. If it is callable, call it with fresh one-shot `resolve`/`reject` functions so that `x`'s outcome is adopted. Otherwise fulfill with `x`. A throw while reading or calling `then` rejects, unless a resolving function already ran.

Also: the `resolve`/`reject` pair given to the executor must be **one-shot** (the first call wins, the rest are ignored), and a throwing executor rejects.

The short version below covers pieces 1 to 4 (about 28 lines). It does not do piece 5, so `resolve(promise)` fulfills with the promise object itself, which is the difference between a toy and a Promises/A+ implementation. Piece 5 is in the deep dive.

What the full version skips, compared with the native `Promise`: unhandled-rejection tracking, `finally` and the static methods, subclassing and `Symbol.species`, and the extra job the spec uses to call a thenable's `then` (so it takes fewer microtask ticks than native when handlers return promises).

## Example

```js
class MiniPromise {
  #state = 'pending';
  #value;
  #reactions = [];

  constructor(executor) {
    const settle = (state) => (value) => {
      if (this.#state !== 'pending') return;
      [this.#state, this.#value] = [state, value];
      for (const reaction of this.#reactions.splice(0)) queueMicrotask(reaction);
    };
    try { executor(settle('fulfilled'), settle('rejected')); } catch (error) { settle('rejected')(error); }
  }

  then(onFulfilled, onRejected) {
    return new MiniPromise((resolve, reject) => {
      const react = () => {
        const ok = this.#state === 'fulfilled';
        const handler = ok ? onFulfilled : onRejected;
        if (typeof handler !== 'function') return (ok ? resolve : reject)(this.#value);
        try { resolve(handler(this.#value)); } catch (error) { reject(error); }
      };
      if (this.#state === 'pending') this.#reactions.push(react);
      else queueMicrotask(react);
    });
  }
}
new MiniPromise((resolve) => setTimeout(resolve, 10, 1)).then((n) => n + 1).then(console.log); // → 2
```

## Pitfalls

- Running handlers synchronously when the promise is already settled. Callers can no longer rely on ordering, and Promises/A+ forbids it. Always go through a microtask.
- Treating `resolve(x)` as `fulfill(x)`. Without the resolution procedure, returning a promise from a handler fulfills the next promise with that promise object, and chains stop waiting.
- Letting both `resolve` and `reject` run. Without a one-shot guard, an executor that calls both, or a thenable that calls its callbacks twice, can settle the promise twice or change its value.
- Reading `x.then` more than once. A getter can return different values each time, so read it once, check it, and call that same reference.

## Follow-ups

**Q:** Why `queueMicrotask` and not `setTimeout`?
**A:** `setTimeout` makes handlers macrotasks, so they run after rendering and timers that should come later. Native promises use the microtask queue, so `queueMicrotask` matches their ordering relative to other work.

**Q:** Why does `then` need a new promise?
**A:** Each `then` creates an independent step. Its handler can fail or return a promise without affecting the original, and chaining is just calling `then` on the new promise.

**Q:** How would you add `finally`?
**A:** `finally(f)` is `then` with two handlers that call `f()`, wait for its result if it returns a promise, then return the original value or rethrow the original reason. A throw or rejection from `f` replaces the outcome.

## Deep dive

### How it works

This version adds the resolution procedure and keeps each rule next to the Promises/A+ clause it implements.

```js
class MyPromise {
  #state = 'pending';
  #value;
  #reactions = [];

  constructor(executor) {
    const { resolve, reject } = this.#resolvingFunctions();
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  // Each pair is one-shot: the first call to either function wins.
  #resolvingFunctions() {
    let called = false;
    const once = (fn) => (arg) => {
      if (called) return;
      called = true;
      fn(arg);
    };
    return {
      resolve: once((resolution) => this.#resolve(resolution)),
      reject: once((reason) => this.#settle('rejected', reason)),
    };
  }

  // Promises/A+ 2.3: the Promise Resolution Procedure.
  #resolve(resolution) {
    if (resolution === this) {
      return this.#settle('rejected', new TypeError('A promise cannot resolve to itself'));
    }
    const isObjectLike =
      typeof resolution === 'function' || (typeof resolution === 'object' && resolution !== null);
    if (!isObjectLike) return this.#settle('fulfilled', resolution);

    let then;
    try {
      then = resolution.then; // read once
    } catch (error) {
      return this.#settle('rejected', error);
    }
    if (typeof then !== 'function') return this.#settle('fulfilled', resolution);

    const { resolve, reject } = this.#resolvingFunctions();
    try {
      then.call(resolution, resolve, reject);
    } catch (error) {
      reject(error); // ignored if resolve or reject already ran
    }
  }

  #settle(state, value) {
    this.#state = state;
    this.#value = value;
    for (const reaction of this.#reactions.splice(0)) queueMicrotask(reaction);
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const react = () => {
        const fulfilled = this.#state === 'fulfilled';
        const handler = fulfilled ? onFulfilled : onRejected;
        if (typeof handler !== 'function') {
          return fulfilled ? resolve(this.#value) : reject(this.#value);
        }
        let result;
        try {
          result = handler(this.#value);
        } catch (error) {
          return reject(error);
        }
        resolve(result);
      };
      if (this.#state === 'pending') this.#reactions.push(react);
      else queueMicrotask(react);
    });
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }
}
```

How the pieces map to Promises/A+ 1.1:

- **2.1 States.** `#state` and `#value` change only in `#settle`. `#settle` is reachable only through a one-shot pair, so a promise settles once.
- **2.2 `then`.** Both arguments are optional (2.2.1); handlers are called once with the value (2.2.2, 2.2.3); they run through `queueMicrotask` (2.2.4); they are plain calls inside a class, which is strict, so `this` is `undefined` (2.2.5); `then` can be called many times and reactions run in registration order (2.2.6); `then` returns a new promise that is resolved from the handler result, rejected on a throw, or given the original outcome when the handler is not a function (2.2.7).
- **2.3 Resolution procedure.** Self-resolution is a `TypeError` (2.3.1). A promise is handled as an ordinary thenable, which 2.3.2 and 2.3.3 both allow; `then` is read once and called with `resolution` as `this` and one-shot callbacks, and when `y` arrives it re-enters the procedure (2.3.3.3.1), which handles nested thenables. A throw from reading or calling `then` rejects unless a callback already ran (2.3.3.2, 2.3.3.3.4). A non-thenable is fulfilled (2.3.3.4, 2.3.4).

The one-shot pair is created again each time a thenable is adopted. The outer pair is already used up at that point, so the thenable's callbacks get their own guard, and calling both of them does nothing the second time.

### Edge cases

Running the official suite, `promises-aplus-tests` 2.1.2 (installed with `npx` in a scratch directory), against `MyPromise` through the usual adapter (`resolved`, `rejected` and `deferred` built on the constructor) gave **872 passing, 0 failing**. For contrast, the short `MiniPromise` fails most of the suite in the same setup (266 passing, 592 failing), because it has no resolution procedure. The one A+ note `MyPromise` does not follow is optional: 3.6 encourages detecting a circular chain of distinct thenables, and this code recurses until the stack overflows instead.

Timing differs from the native promise when a handler returns a promise. The native `resolve` schedules a separate job to call `then` on the returned promise, which costs extra ticks. `MyPromise` calls `then` immediately, which A+ allows. The result is observable:

```js
for (const [name, P] of [['native', Promise], ['MyPromise', MyPromise]]) {
  const log = [];
  new P((r) => r()).then(() => { log.push('a1'); return new P((r) => r('x')); }).then(() => log.push('a2'));
  new P((r) => r()).then(() => log.push('b1')).then(() => log.push('b2'))
    .then(() => log.push('b3')).then(() => log.push('b4')).then(() => console.log(name, log.join(' ')));
}
// → native a1 b1 b2 b3 a2 b4
// → MyPromise a1 b1 b2 a2 b3 b4
```

(This uses the `MyPromise` class from above.) The A+ suite checks behaviour that the spec of both implementations shares, so passing it says nothing about matching native tick counts. Use native promises when tick-for-tick ordering matters.

### Trade-offs

Both versions leave out `finally`, the static methods (`resolve`, `reject`, `all`) and unhandled-rejection reporting, because the interview version is about the state machine and the resolution procedure. For production, native promises are faster, report unhandled rejections to the host, and integrate with `async`/`await`; `await` on a custom thenable still works because `await` reads `then` the same way.

## Exercises

### No adoption

```js
// MiniPromise is the class from the example above.
const outer = new MiniPromise((resolve) => resolve(new MiniPromise((r) => r('inner'))));
outer.then((value) => console.log(value instanceof MiniPromise));
```

**Answer:** `true`. `MiniPromise` fulfills `outer` with the inner promise object because it has no resolution procedure. The native `Promise` would print `false` for the same code, because `value` would be `'inner'`.

### The handler's `this`

```js
// MiniPromise is the class from the example above.
new MiniPromise((resolve) => resolve(1)).then(function () {
  console.log(this);
});
```

**Answer:** `undefined`. The handler is called as a plain function inside module (strict) code, as Promises/A+ 2.2.5 requires. In sloppy mode it would be the global object.
