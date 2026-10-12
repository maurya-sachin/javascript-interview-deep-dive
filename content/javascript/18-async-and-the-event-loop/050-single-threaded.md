---
title: "Is JavaScript single-threaded?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [agent, thread, worker, web-worker, worker-threads, sharedarraybuffer, atomics, run-to-completion]
related:
  - javascript/async-and-the-event-loop/event-loop
  - javascript/async-and-the-event-loop/sequential-vs-parallel-await
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-agents
  - https://tc39.es/ecma262/#sec-agent-clusters
  - https://tc39.es/ecma262/#sec-jobs
  - https://nodejs.org/docs/latest-v24.x/api/worker_threads.html
  - https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop
  - https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/wait
tldr: >
  Each JavaScript agent runs on one thread and runs jobs to completion, so your code never races with
  itself. But the program is not limited to one thread: hosts do I/O and timers outside your code, and
  workers are extra agents with their own heap and event loop. They talk by messages, or by shared memory
  through `SharedArrayBuffer` and `Atomics`.
---

## Answer

"Single-threaded" is true of one **agent**, and misleading for a whole program.

- **The language.** The spec defines an agent: one execution context stack, one set of jobs, and an executing thread. Jobs run to completion, one at a time. Two pieces of JavaScript in the same agent never run at the same time, so a variable cannot change between two synchronous statements.
- **The host.** Waiting is not done by your thread. Browsers and Node.js do network, timer and file work outside the JavaScript thread (in Node.js, partly in a worker pool of threads) and queue a callback when it finishes. That is why `await fetch()` does not freeze the page.
- **More agents.** Web Workers in browsers and `worker_threads` in Node.js run JavaScript on other threads. Each worker is a separate agent with its own global object, heap and event loop. Objects are not shared: `postMessage` copies values (structured clone), or transfers ownership of some objects such as an `ArrayBuffer`.
- **Shared memory.** A `SharedArrayBuffer` can be passed to several agents in the same agent cluster. Use `Atomics` for race-free updates and for waiting. `Atomics.wait` blocks the thread, so it is not allowed on a browser's main thread.

A good answer: JavaScript has no shared-memory threads by default and no preemption within an agent, but a program can use several threads through the host and workers.

## Example

```js
import { Worker, isMainThread, parentPort } from 'node:worker_threads';

if (isMainThread) {
  globalThis.counter = 1;
  const worker = new Worker(new URL(import.meta.url));
  worker.on('message', (message) => {
    console.log('main got:', message, '| main counter:', globalThis.counter);
    worker.terminate();
  });
  worker.postMessage({ numbers: [1, 2, 3] });
} else {
  parentPort.once('message', ({ numbers }) => {
    numbers.push(4); // a copy: the main thread's array is unchanged
    parentPort.postMessage({ sum: numbers.reduce((a, b) => a + b), seesMainCounter: typeof globalThis.counter });
  });
}
// → main got: { sum: 10, seesMainCounter: 'undefined' } | main counter: 1
```

## Pitfalls

- Saying "JavaScript is single-threaded, so it cannot be parallel". Workers are real parallelism, and the host's I/O happens off-thread. What is true is that one agent runs one job at a time.
- Thinking `async`/`await` or promises use threads. They are scheduling on one agent. A CPU-bound loop inside an `async` function still blocks the loop. Move CPU-bound work to a worker.
- Expecting shared variables between workers. Each worker has its own globals; only `SharedArrayBuffer` memory is shared.
- Using a worker for I/O-bound work. Node.js's docs say workers help with CPU-intensive JavaScript but not much with I/O, because built-in async I/O is already more efficient.

## Follow-ups

**Q:** What is run-to-completion and why does it matter?
**A:** Once a job starts, nothing else in that agent runs until it finishes. You need no locks for plain variables inside one agent. The cost is that one long job blocks everything else there.

**Q:** How do workers communicate?
**A:** By messages (`postMessage`), where data is cloned or transferred, or through shared memory with `SharedArrayBuffer` and `Atomics`.

**Q:** Can two agents race?
**A:** Only on shared memory. Plain reads and writes on a `SharedArrayBuffer` can race, so use `Atomics` operations to avoid it.

## Exercises

### Count with two workers

```js
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

if (isMainThread) {
  const shared = new Int32Array(new SharedArrayBuffer(4));
  const workers = Array.from({ length: 2 }, () => new Worker(new URL(import.meta.url), { workerData: shared }));
  await Promise.all(workers.map((worker) => new Promise((resolve) => worker.once('exit', resolve))));
  console.log('shared counter:', shared[0]);
} else {
  for (let i = 0; i < 1000; i++) Atomics.add(workerData, 0, 1);
}
```

**Answer:** `shared counter: 2000`. Both workers update the same memory. `Atomics.add` makes each increment indivisible. With plain `workerData[0]++` the total can come out lower, because two threads can read the same old value. It varies from run to run, so no output is shown for that version.
