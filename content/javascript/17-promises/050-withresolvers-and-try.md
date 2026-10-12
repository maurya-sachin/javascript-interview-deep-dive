---
title: "What do `Promise.withResolvers` and `Promise.try` solve?"
status: draft
difficulty: medium
frequency: 1
core: false
tags: [promise-withresolvers, promise-try, deferred, baseline, executor]
related:
  - javascript/promises/what-is-a-promise
  - javascript/promises/promise-chaining
  - javascript/async-and-the-event-loop/async-await-mechanics
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-promise.withresolvers
  - https://tc39.es/ecma262/#sec-promise.try
  - https://tc39.es/ecma262/#sec-promise-resolve
  - https://github.com/tc39/ecma262/pull/3883
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/try
  - https://github.com/mdn/browser-compat-data
  - https://github.com/web-platform-dx/web-features
tldr: >
  `Promise.withResolvers()` returns `{ promise, resolve, reject }` so you can settle a promise from outside
  the executor, replacing the "capture the resolvers in a variable" pattern. `Promise.try(fn, ...args)`
  calls `fn` synchronously and returns a promise, turning a synchronous throw into a rejection without
  delaying the call.
---

## Answer

**`Promise.withResolvers()`** returns a plain object `{ promise, resolve, reject }`. It replaces the old pattern of declaring `let resolve, reject` outside and assigning them inside the executor. Use it when the thing that settles the promise is not the code that creates it: event handlers, message queues, request/response matching, test helpers, or a "ready" signal. It is the same promise with the same once-only rules. The spec simply makes `NewPromiseCapability` available directly.

One difference from `new Promise(executor)`: there is no executor, so there is no automatic "throw becomes rejection". Setup code you write next to it throws normally.

**`Promise.try(callback, ...args)`** calls `callback(...args)` immediately and synchronously, then:

- if it returns a value or a promise, the result promise resolves with it, with the usual adoption rules;
- if it throws, the result promise is rejected with the error.

It solves the "sometimes sync, sometimes async" function. Without it, `fn()` may throw before you get a promise, so a `.catch` never sees the error. `Promise.resolve().then(fn)` catches it but delays `fn` by a microtask. `new Promise((resolve) => resolve(fn()))` and `(async () => fn())()` work but are noisy. `Promise.try` does it in one call, and passes arguments.

Both are static methods that read `this` as the constructor, so they must be called as `Promise.try(...)`, not detached.

**Availability.** Both run in Node 24. By MDN's browser-compat-data, `withResolvers` shipped in Chrome 119, Firefox 121 and Safari 17.4 (Node 22) and is Baseline widely available. `try` shipped in Chrome 128, Firefox 134 and Safari 18.2 (Node 23) and is Baseline newly available (since January 2025), so older browsers need a polyfill.

## Example

```js
const target = new EventTarget();

function nextEvent(name) {
  const { promise, resolve } = Promise.withResolvers();
  target.addEventListener(name, resolve, { once: true });
  return promise;
}

const waiting = nextEvent('ready');
target.dispatchEvent(new Event('ready'));
console.log((await waiting).type); // → ready

const parse = (text) => JSON.parse(text);
console.log(await Promise.try(parse, '{"ok":true}')); // → { ok: true }
await Promise.try(parse, '{bad').catch((error) => console.log(error.name)); // → SyntaxError

const order = [];
Promise.try(() => order.push('try callback')); // runs synchronously
Promise.resolve().then(() => order.push('then callback'));
order.push('after');
await null;
console.log(order);
// → [ 'try callback', 'after', 'then callback' ]
```

## Pitfalls

- Detaching the method: `const { try: t } = Promise; t(fn)` throws a `TypeError`, because `this` is no longer the constructor.
- Expecting `Promise.try` to defer the callback. It runs synchronously, before the call returns. Use `Promise.resolve().then(fn)` or `queueMicrotask` if you need it deferred.
- Handing out `resolve`/`reject` widely. Anyone holding them can settle the promise, and only the first call counts. A promise whose resolvers are lost stays pending forever.
- Using `withResolvers` where an executor would do. If the promise settles inside the code that creates it, `new Promise` is simpler and also converts throws into rejections.

## Follow-ups

**Q:** Why not just use an `async` function instead of `Promise.try`?
**A:** An async function wrapper also runs the body synchronously and converts throws. `Promise.try(fn, ...args)` does that for a function you already have, without writing a wrapper.

**Q:** Does `Promise.try(() => p)` return `p` itself?
**A:** The current draft spec says yes for a native promise with the same constructor, after a 2026 change (ecma262 PR 3883). Node 24 returns a new promise: the comparison is `false`. Do not depend on identity.

**Q:** How was a deferred written before `withResolvers`?
**A:** `let resolve, reject; const promise = new Promise((res, rej) => { resolve = res; reject = rej; });`. The executor runs synchronously, so the variables are set before `new Promise` returns.

## Exercises

### Order of callbacks

```js
Promise.try(() => console.log('A'));
Promise.resolve().then(() => console.log('B'));
console.log('C');
```

**Answer:** `A`, `C`, `B`. `Promise.try` runs its callback immediately, so `A` prints first. The `then` callback waits for a microtask, so `C` comes before `B`.

### First call wins

```js
const { promise, resolve, reject } = Promise.withResolvers();
resolve('first');
reject(new Error('ignored'));
resolve('second');
console.log(await promise);
```

**Answer:** `first`. The three functions share one already-resolved flag, as in the constructor, so later calls do nothing.
