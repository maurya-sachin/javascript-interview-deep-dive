---
title: "What are `SharedArrayBuffer` and `Atomics` for?"
status: draft
difficulty: hard
frequency: 1
core: false
tags: [sharedarraybuffer, atomics, workers, threads, cross-origin-isolation, concurrency]
related:
  - javascript/json-and-binary-data/arraybuffer-typed-arrays
  - javascript/json-and-binary-data/modern-binary-data
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-sharedarraybuffer-objects
  - https://tc39.es/ecma262/#sec-atomics-object
  - https://tc39.es/ecma262/#sec-dowait
  - https://tc39.es/ecma262/#sec-memory-model
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/wait
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/waitAsync
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated
  - https://nodejs.org/docs/latest/api/worker_threads.html
tldr: >
  A `SharedArrayBuffer` is memory that several workers can read and write at once instead of copying it with
  `postMessage`. Plain reads and writes on it can race, so `Atomics` provides indivisible operations (`add`,
  `compareExchange`) and sleeping/waking (`wait`, `notify`). Browsers only expose it on cross-origin isolated pages.
---

## Answer

Workers normally share nothing: `postMessage` copies data, or **transfers** an `ArrayBuffer` so only one side owns it. A **`SharedArrayBuffer`** (SAB) is a buffer that several agents (the main thread and workers) see at the same time. Posting it sends a handle to the same memory, not a copy. It is the building block for multi-threaded code such as WebAssembly threads, and the right tool only when copying or transferring is too slow or you need real concurrent access.

Concurrent access is dangerous. `counter[0]++` is a read, an add, and a write, so two threads can both read 5 and both write 6 (a **data race**, a lost update). `Atomics` fixes this for integer typed arrays over a buffer:

- **Atomic read-modify-write:** `Atomics.add`, `sub`, `and`, `or`, `xor`, `exchange`, `compareExchange`. Each completes indivisibly. Atomic accesses are sequentially consistent.
- **`load` / `store`:** atomic reads and writes of one element.
- **`Atomics.wait(ta, i, expected, timeout?)`** blocks the agent while `ta[i] === expected`, returning `"ok"`, `"not-equal"`, or `"timed-out"`. It needs an `Int32Array` or `BigInt64Array` on a SAB, and throws `TypeError` where the agent may not block, such as a browser's main thread.
- **`Atomics.waitAsync`** (ES2024) does the same without blocking: it returns `{ async, value }`, where `value` is a Promise when `async` is `true`.
- **`Atomics.notify(ta, i, count?)`** wakes waiters and returns how many it woke.
- **`Atomics.pause()`** (stage 4, ES2027; Node 24+) is a CPU hint for spin loops.

**Browser requirement.** `SharedArrayBuffer` needs a secure context and a **cross-origin isolated** page: the document is served with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` (or `credentialless`). Without them the constructor is hidden and `postMessage` of a SAB throws. Check `crossOriginIsolated`. Node has no such restriction.

## Example

```js
// race.mjs, Node 24: four workers each add 100,000 to two counters
import { Worker, isMainThread, workerData } from 'node:worker_threads';

if (isMainThread) {
  const shared = new Int32Array(new SharedArrayBuffer(8)); // [0] plain, [1] atomic
  const exits = [];
  for (let i = 0; i < 4; i++) {
    const worker = new Worker(new URL(import.meta.url), { workerData: shared });
    exits.push(new Promise((resolve) => worker.on('exit', resolve)));
  }
  await Promise.all(exits);
  console.log('plain  :', shared[0]);
  console.log('atomic :', Atomics.load(shared, 1));
} else {
  for (let i = 0; i < 100_000; i++) {
    workerData[0]++;                  // read, add, write: updates get lost
    Atomics.add(workerData, 1, 1);    // one indivisible step
  }
}
// → plain  : (varies every run, below 400000; saw 241424, 195457, 197707)
// → atomic : 400000
```

## Pitfalls

- Using `x[i]++` or `x[i] = x[i] + 1` on shared memory. It compiles and mostly "works" in light testing, then loses updates under load. The race is non-deterministic, so tests may not catch it.
- Calling `Atomics.wait` on a browser's main thread. It throws `TypeError`, because blocking would freeze the page. Use `waitAsync` there, or wait only inside workers. Node's main thread can block, so code that works in Node may fail in a browser.
- Waiting without re-checking the condition. `wait` only sleeps if the value still equals `expected`, and a wake-up does not guarantee the state you want. Loop: `while (cond) Atomics.wait(...)`, as in the lock below.
- Forgetting the headers. If either `COOP` or `COEP` is missing (a proxy or CDN can strip them), the page is not isolated and `SharedArrayBuffer` is unavailable. Feature-detect `typeof SharedArrayBuffer` and `crossOriginIsolated`.

## Follow-ups

**Q:** How do you build a mutex?
**A:** Use one slot as state. Acquire with `Atomics.compareExchange(s, 0, 0, 1)` until it returns `0`, sleeping with `Atomics.wait(s, 0, 1)` when it fails. Release with `Atomics.store(s, 0, 0)` then `Atomics.notify(s, 0, 1)`. Four Node workers doing 20,000 locked increments each gave `80000` in every run.

**Q:** Why did browsers require cross-origin isolation?
**A:** Browsers disabled shared memory and high-resolution timers in 2018 because of Spectre side-channel attacks. Cross-origin isolation is the later, secure way to re-enable them: it keeps untrusted cross-origin content out of the page's process.

**Q:** When do I not need SAB?
**A:** When one thread owns the data at a time. `postMessage` with a transfer list moves an `ArrayBuffer` without copying, which is simpler and race-free.

**Q:** Does `Atomics.notify` work on a normal `ArrayBuffer`?
**A:** It returns `0`, because nobody can be waiting. `Atomics.wait` on a non-shared buffer throws `TypeError`, though `Atomics.add` and the other read-modify-write operations accept plain integer typed arrays.

## Exercises

### What does each call return?

```js
const ia = new Int32Array(new SharedArrayBuffer(8));
console.log(Atomics.add(ia, 0, 5), Atomics.load(ia, 0));
console.log(Atomics.compareExchange(ia, 0, 5, 9), Atomics.compareExchange(ia, 0, 5, 1), ia[0]);
console.log(Atomics.wait(ia, 0, 0, 10), Atomics.notify(ia, 0));
```

**Answer:** `0 5`, then `5 9 9`, then `not-equal 0`. `add` returns the *old* value. The first `compareExchange` sees `5`, matches, stores `9`, and returns the old `5`. The second sees `9`, no match, and changes nothing. `wait` returns `not-equal` immediately because the slot holds `9`, not `0`, and nobody is waiting, so `notify` wakes `0`. (Run in Node; `wait` throws on a browser's main thread.)

### Sync or async?

```js
const ia = new Int32Array(new SharedArrayBuffer(4));
const pending = Atomics.waitAsync(ia, 0, 0, 1000);
console.log(pending.async, Atomics.notify(ia, 0));
pending.value.then((result) => console.log(result));
console.log(Atomics.waitAsync(ia, 0, 1).value);
```

**Answer:** `true 1`, then `not-equal`, then `ok`. The slot equals `0`, so the first call really waits (`async: true`) and `notify` wakes it. The second call expects `1`, the slot is `0`, so it settles immediately with the string `'not-equal'` (`async: false`, no Promise). The Promise from the first call resolves with `'ok'` on a later microtask.
