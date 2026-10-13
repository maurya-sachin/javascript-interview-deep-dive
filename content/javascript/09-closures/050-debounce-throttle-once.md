---
title: "Implement `debounce`, `throttle`, and `once`."
status: draft
difficulty: medium
frequency: 5
core: true
tags: [closures, debounce, throttle, once, timers, higher-order-functions]
related:
  - javascript/closures/what-is-a-closure
  - javascript/closures/closure-memory
  - javascript/functions/higher-order-functions
  - javascript/this/lost-this-callbacks
  - javascript/async-and-the-event-loop/cancelling-async-work
verified: 2026-10
sources:
  - https://developer.mozilla.org/en-US/docs/Glossary/Debounce
  - https://developer.mozilla.org/en-US/docs/Glossary/Throttle
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
  - https://developer.mozilla.org/en-US/docs/Web/API/AbortController
  - https://nodejs.org/docs/latest-v24.x/api/test.html#class-mocktimers
tldr: >
  Each returns a wrapper whose state — a timer, the pending `this` and arguments, a called
  flag — lives in a closure shared by every call to that wrapper. `debounce` runs once
  calls stop for `wait` ms; `throttle` runs at most once per `wait` ms; `once` runs the
  first time and caches the result. Forward `this` and arguments with `fn.apply`.
---

## Answer

Each is a factory: it takes `fn` and returns a wrapper. The wrapper's state lives in the factory call's environment, so every call to *that wrapper* shares it — which is why you create the wrapper once and reuse it.

- **`debounce(fn, wait)`** — each call restarts a timer; `fn` runs once calls have stopped for `wait` ms, with the last call's arguments. Use it when only the final value matters: search-as-you-type, autosave, resize end.
- **`throttle(fn, wait)`** — `fn` runs at most once per `wait` ms window while calls keep coming. Use it for steady updates during continuous activity: scroll position, drag, progress.
- **`once(fn)`** — the first call runs `fn` and caches its result; later calls return the cache. Use it for idempotent setup.

What interviewers check:

1. **`this` and arguments.** Make the wrapper a regular `function` so it receives the caller's `this`, take `...args`, and call `fn.apply(this, args)` from an arrow inside `setTimeout` — the arrow has no `this` of its own, so it uses the wrapper's.
2. **Leading and trailing edges.** Debounce usually fires on the trailing edge; `leading` fires at the start of a burst instead or as well. With both, a lone call runs once, not twice. Throttle usually does both: the first call runs at once, and the latest call made during the window runs when it ends — dropping it would lose the final state.
3. **`cancel`.** Clear the timer and drop the pending arguments, so nothing runs after teardown.
4. **`once` details.** Mark it called *before* invoking `fn`, so a re-entrant call can't run it twice, and drop the reference to `fn` so it and everything its closure holds can be collected.

A deferred call can't hand its result back to the caller, so the debounced and throttled wrappers return `undefined`.

## Example

```js
import { mock } from 'node:test';
mock.timers.enable({ apis: ['setTimeout'] }); // a fake clock, so the timing is exact

function debounce(fn, wait) {
  let timer;
  function debounced(...args) {
    clearTimeout(timer); // every call restarts the wait
    timer = setTimeout(() => fn.apply(this, args), wait); // arrow keeps this call's `this`
  }
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

const search = {
  query: 'books',
  run: debounce(function (page) {
    console.log(this.query, page);
  }, 300),
};

search.run(1);
mock.timers.tick(200);
search.run(2); // restarts the 300 ms wait
mock.timers.tick(299);
console.log('nothing yet'); // → nothing yet
mock.timers.tick(1); // → books 2
search.run(3);
search.run.cancel();
mock.timers.tick(1000); // (prints nothing: cancelled)
```

## Pitfalls

- Creating the wrapper inside the event handler or render function. Each call makes a new closure with its own timer, so nothing is ever debounced.
- Writing the wrapper as an arrow: `this` comes from where `debounce` was called, not from the caller. Or using a regular `function` inside `setTimeout`: `this` and `arguments` become the timer's.
- A throttle with no trailing call. The last event in a burst — the final scroll position — is never handled.
- No `cancel` on teardown: the deferred call runs after the component or request it belonged to is gone.

## Follow-ups

**Q:** How would you add `flush()` to `debounce`?
**A:** Run the owed call now: clear the timer, and if pending arguments exist, reset the state and call `fn` with the saved `this` and arguments. It's useful before navigation or form submit, so the last edit isn't lost.

**Q:** What should `once` do if `fn` throws?
**A:** It's a design choice. Marking it called before invoking means a failure isn't retried and later calls return `undefined`. Allowing retries means resetting the flag in a `catch` — keep the flag set during the call so re-entrant calls still can't run `fn` twice.

**Q:** How do you test timing code without waiting?
**A:** Fake the clock. With `node:test`, `t.mock.timers.enable({ apis: ['setTimeout'] })` replaces the timers and `t.mock.timers.tick(ms)` advances time synchronously, firing due timers. Mocks enabled through the test context are restored when the test ends.

**Q:** Why can't debounce alone prevent stale search results?
**A:** It only limits how often requests start. Two requests can still be in flight and resolve out of order. Abort the previous one with an `AbortController` (or ignore responses that aren't the latest) as well as debouncing.

## Deep dive

### How it works

Full versions with options. Each factory call creates one environment holding `timer`, `pendingThis`, and `pendingArgs`; the wrapper, its timer callback, and `cancel` are all closures over it. `pendingArgs` doubles as the "a trailing call is owed" flag.

```js
export function debounce(fn, wait, { leading = false, trailing = true } = {}) {
  let timer = null;
  let pendingThis;
  let pendingArgs = null; // set only when a trailing call is owed

  function reset() {
    timer = null;
    pendingThis = undefined;
    pendingArgs = null;
  }

  function endWait() {
    const context = pendingThis;
    const latest = pendingArgs;
    reset();
    if (trailing && latest) {
      timer = setTimeout(endWait, wait); // no leading call within `wait` of this one
      fn.apply(context, latest);
    }
  }

  function debounced(...args) {
    const startsBurst = timer === null;
    clearTimeout(timer);
    timer = setTimeout(endWait, wait); // every call restarts the wait

    if (leading && startsBurst) {
      fn.apply(this, args);
    } else {
      pendingThis = this;
      pendingArgs = args;
    }
  }

  debounced.cancel = () => {
    clearTimeout(timer);
    reset();
  };
  return debounced;
}
```

The burst state is just `timer`: `null` means no call within the last `wait` ms. After a trailing call, `endWait` re-arms the timer once more, so a call right after it isn't treated as the leading edge of a new burst — with both edges on, calls stay at least `wait` apart.

Throttle keeps the same state but never restarts a running timer. The window ends on schedule; if a call is owed, it runs with the latest arguments and opens the next window, so invocations stay at least `wait` apart.

```js
export function throttle(fn, wait, { leading = true, trailing = true } = {}) {
  let timer = null;
  let pendingThis;
  let pendingArgs = null;

  function reset() {
    timer = null;
    pendingThis = undefined;
    pendingArgs = null;
  }

  function endWindow() {
    const context = pendingThis;
    const latest = pendingArgs;
    reset();
    if (trailing && latest) {
      timer = setTimeout(endWindow, wait); // the trailing call opens a new window
      fn.apply(context, latest);
    }
  }

  function throttled(...args) {
    if (timer === null) {
      timer = setTimeout(endWindow, wait);
      if (leading) {
        fn.apply(this, args);
        return;
      }
    }
    pendingThis = this;
    pendingArgs = args;
  }

  throttled.cancel = () => {
    clearTimeout(timer);
    reset();
  };
  return throttled;
}
```

`once` needs no flag beyond the reference itself:

```js
export function once(fn) {
  let pending = fn;
  let result;
  return function (...args) {
    if (pending) {
      const call = pending;
      pending = null; // mark as called before running (re-entrancy) and release `fn`
      result = call.apply(this, args);
    }
    return result;
  };
}
```

### Edge cases

- **Last caller wins.** A trailing call uses the `this` and arguments of the most recent call, not the first.
- **`leading: false, trailing: false`** never calls `fn`. It's a legal but useless configuration.
- **Errors.** A throw from a deferred call happens inside a timer callback, so it surfaces as an uncaught exception, not at the call site. Both wrappers arm the timer before calling `fn`, so a throw doesn't break the next window.
- **Fake timers and nested scheduling.** In Node 24, timers that fire during one `tick(ms)` see the clock at the end of that tick, so a timer they schedule starts late. When a callback re-arms a timer, as throttle's does, tick to each boundary.

```js
// Run with: node --test (with the three functions above saved as timing.mjs)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { debounce, throttle, once } from './timing.mjs';

test('debounce: one trailing call with the last this and args', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [];
  const obj = { name: 'obj', run: debounce(function (...args) { calls.push([this.name, ...args]); }, 300) };
  obj.run(1);
  t.mock.timers.tick(200);
  obj.run(2, 'x'); // restarts the wait
  t.mock.timers.tick(299);
  assert.deepEqual(calls, []);
  t.mock.timers.tick(1);
  assert.deepEqual(calls, [['obj', 2, 'x']]);
});

test('debounce: leading + trailing, and cancel', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [];
  const run = debounce((n) => calls.push(n), 100, { leading: true });
  run(1); // leading
  t.mock.timers.tick(500);
  run(2); // leading of a new burst
  run(3); // owed as trailing…
  run.cancel(); // …until cancelled
  t.mock.timers.tick(500);
  assert.deepEqual(calls, [1, 2]);
});

test('throttle: leading call, then the latest args once per window', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [];
  const run = throttle((n) => calls.push(n), 100);
  run(1); // runs now
  run(2);
  run(3);
  t.mock.timers.tick(100); // trailing: 3, which opens a new window
  run(4);
  t.mock.timers.tick(100); // trailing: 4
  t.mock.timers.tick(100); // nothing pending: the window closes
  run(5); // runs now
  assert.deepEqual(calls, [1, 3, 4, 5]);
});

test('once: runs fn once, even when called re-entrantly', () => {
  let runs = 0;
  const init = once(function (n) {
    runs++;
    init(n); // re-entrant call gets the (still undefined) cached result
    return this.base + n;
  });
  const obj = { base: 10, init };
  assert.equal(obj.init(1), 11);
  assert.equal(obj.init(2), 11);
  assert.equal(runs, 1);
});
```

### Real-world scenario

Search-as-you-type combines the pieces. Create the debounced search once per input (outside render, or memoised so it survives re-renders — a new wrapper each render is a new closure with a new timer). Debounce on the trailing edge so the request starts after typing pauses. Inside the search, abort the previous request with an `AbortController` before starting the next one, because debouncing doesn't stop responses arriving out of order. On teardown, call `cancel()` and abort the in-flight request.

### Trade-offs

These timer-based versions cost one timer per window or burst and are easy to reason about. A timestamp-based throttle (compare `Date.now()` with the last run) avoids a timer on the leading path but still needs one for the trailing call. Debounce has a starvation risk: if calls never pause, `fn` never runs; a `maxWait` option — force a call after at most that long — fixes it, at the cost of more state. Keep the API small: options you don't need are more edge cases to test.

## Exercises

### Fix the bug

```js
import { mock } from 'node:test';
mock.timers.enable({ apis: ['setTimeout'] });

function debounce(fn, wait) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(this, arguments);
    }, wait);
  };
}

const field = {
  name: 'email',
  validate: debounce(function (value) {
    console.log(this === field, value);
  }, 100),
};
field.validate('a@b.co');
mock.timers.tick(100);
```

**Answer:** It prints `false undefined`. The inner callback is a regular function, so `this` is whatever the timer passes (in Node, the `Timeout` object), and `arguments` is the timer callback's own, empty list. Capture both in the wrapper and forward from an arrow: `return function (...args) { …setTimeout(() => fn.apply(this, args), wait); }`. It then prints `true a@b.co`.

### Why isn't this debounced?

```js
import { mock } from 'node:test';
mock.timers.enable({ apis: ['setTimeout'] });

function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

const search = (query) => console.log('search', query);
const input = new EventTarget();
input.addEventListener('input', (event) => debounce(search, 300)(event.detail));

for (const query of ['r', 're', 'rea']) {
  input.dispatchEvent(new CustomEvent('input', { detail: query }));
}
mock.timers.tick(300);
```

**Answer:** It prints `search r`, `search re`, `search rea`. `debounce` runs inside the listener, so each event creates a new wrapper with its own `timer` binding, and each clears only its own (empty) timer. Create it once — `const debouncedSearch = debounce(search, 300)` — and call that in the listener; it then prints only `search rea`.

### Predict the output

```js
import { mock } from 'node:test';
import { debounce, throttle } from './timing.mjs'; // the Deep dive implementations
mock.timers.enable({ apis: ['setTimeout'] });

const debounced = debounce((n) => console.log('debounce', n), 100);
const throttled = throttle((n) => console.log('throttle', n), 100);

for (let n = 1; n <= 5; n++) {
  debounced(n);
  throttled(n);
  mock.timers.tick(40); // calls at 0, 40, 80, 120, 160 ms
}
mock.timers.tick(500);
```

**Answer:** `throttle 1`, `throttle 3`, `throttle 5`, `debounce 5`. Throttle runs 1 at once (0 ms), then at the end of its window (100 ms) runs the latest owed call, 3, and opens a new window; 4 and 5 arrive in it and 5 runs at 200 ms. Debounce restarts on every call, so it runs only once: 100 ms after the last call (260 ms), with 5.
