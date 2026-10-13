---
title: "Implement a concurrency-limited task runner with retry."
status: draft
difficulty: hard
frequency: 4
core: false
tags: [concurrency-limit, promise-pool, retry, exponential-backoff, worker-pool, promise-all, implementation]
related:
  - javascript/promises/promise-combinators
  - javascript/promises/implement-promise-all
  - javascript/async-and-the-event-loop/sequential-vs-parallel-await
  - javascript/async-and-the-event-loop/cancelling-async-work
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-promise.all
  - https://tc39.es/ecma262/#await
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch
tldr: >
  Take tasks as functions that return promises, so nothing starts early. Start `limit` workers, each looping:
  claim the next index, run it with retry, store the result at that index. `Promise.all` over the workers gives
  the limit, ordered results and fail-fast. Retry is a loop that waits `baseDelayMs * 2 ** attempt` between attempts.
---

## Answer

Two ideas, composed.

**Concurrency limit.** Promises start running when they are created, so the runner cannot accept promises. It accepts **task functions** and decides when to call each one. The simplest correct pool starts `limit` *workers*. Each worker is an async loop that claims the next unclaimed index, runs that task, stores the result at the same index, and repeats until nothing is left. Because JavaScript runs one job at a time, `nextIndex++` needs no lock, and no two workers get the same task. At most `limit` tasks are in flight, a slot is reused as soon as a task ends, and `results[index]` keeps input order whatever the finish order.

**Retry with backoff.** A loop calls the task, returns on success, and after a failure waits `baseDelayMs * 2 ** attempt` (100, 200, 400, ...) before the next attempt. When the attempts are used up it throws the last error. Retrying lives *inside* the worker, so a task being retried keeps its slot and the limit still holds during backoff.

**Failure.** The runner is fail-fast like `Promise.all`. The first task that exhausts its retries rejects the whole call, and a `failed` flag stops workers from claiming new tasks. Tasks already in flight cannot be cancelled and finish on their own.

**What this skips**, on purpose: jitter on the delay and a maximum delay, a predicate to decide which errors are worth retrying, a per-task timeout, cancellation of in-flight tasks via `AbortSignal`, and settled-style results (`allSettled`) instead of fail-fast. Each is a small addition, but each adds options and states, so add them when a requirement asks for them.

## Example

```js
async function withRetry(task, { retries, baseDelayMs }) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await task();
    } catch (error) {
      if (attempt >= retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** attempt));
    }
  }
}

async function runTasks(tasks, { limit, retries = 0, baseDelayMs = 100 }) {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError('limit must be a positive integer');
  const results = new Array(tasks.length);
  let nextIndex = 0;
  let failed = false;
  async function worker() {
    while (!failed && nextIndex < tasks.length) {
      const index = nextIndex++;
      try {
        results[index] = await withRetry(tasks[index], { retries, baseDelayMs });
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}
```

## Pitfalls

- Accepting an array of promises. They have already started, so the limit would limit nothing. Take functions.
- Chunking: `for (const batch of chunks(tasks, limit)) await Promise.all(batch)`. It is correct but wasteful: each batch waits for its slowest task while slots sit idle. Workers that pull the next task keep all slots busy.
- Forgetting the stop flag. Without it, after one task fails, the other workers keep claiming and running the remaining tasks although the caller already got a rejection.
- Retrying everything. A validation error or a 404 will fail the same way every time. Real code passes a `shouldRetry(error)` predicate, which this version leaves out.

## Follow-ups

**Q:** Why does the limit still hold during a retry delay?
**A:** The delay happens inside the worker's `await withRetry(...)`. The worker does not claim another task until the current one finally succeeds or fails.

**Q:** How would you add cancellation?
**A:** Accept `signal`, call `signal.throwIfAborted()` before claiming each task and after each backoff, make the backoff wait abortable, and pass the signal to each task so it can stop.

**Q:** Why not use a semaphore with a queue instead of workers?
**A:** It works, but it needs a queue of waiting resolvers and a release step. The worker loop reuses the language's own control flow, so the code is shorter and has fewer states.

## Exercises

### Trace the pool

```js
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const job = (name, ms) => async () => {
  console.log('start', name);
  await sleep(ms);
  console.log('end  ', name);
  return name;
};
console.log(await runTasks([job('A', 40), job('B', 10), job('C', 20), job('D', 15)], { limit: 2 }));
// → start A
// → start B
// → end   B
// → start C
// → end   C
// → start D
// → end   A
// → end   D
// → [ 'A', 'B', 'C', 'D' ]
```

**Answer:** With `limit: 2`, A and B start together. B ends at 10 ms and frees its slot for C, which ends at 30 ms. D then starts and ends at 45 ms, after A (40 ms). Results stay in input order even though the finish order was B, C, A, D. Timings are chosen far enough apart for this order to be stable.

### Prove the limit

```js
let running = 0;
let peak = 0;
const task = (value) => async () => {
  peak = Math.max(peak, ++running);
  await new Promise((resolve) => setTimeout(resolve, 10));
  running--;
  return value;
};
const values = await runTasks(Array.from({ length: 8 }, (_, i) => task(i)), { limit: 3 });
console.log(values.join(), 'peak', peak);
// → 0,1,2,3,4,5,6,7 peak 3
```

**Answer:** `peak` reaches 3 and never more, because only three workers exist. The result array is in input order. Run this check whenever you change the pool: the limit is the property that is easy to break and hard to see.

### Backoff arithmetic

```js
const start = performance.now();
let calls = 0;
await runTasks([async () => { calls++; throw new Error('down'); }], { limit: 1, retries: 3, baseDelayMs: 20 })
  .catch((error) => console.log(error.message, 'after', calls, 'calls,', `~${Math.round((performance.now() - start) / 20) * 20} ms`));
// → down after 4 calls, ~140 ms
```

**Answer:** `retries: 3` allows four attempts. The waits are 20, 40 and 80 ms, about 140 ms in total (rounded to the nearest 20 ms here, because timers are not exact). The error from the last attempt is the one that rejects.
