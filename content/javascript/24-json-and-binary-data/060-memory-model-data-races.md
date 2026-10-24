---
title: "What does JavaScript's memory model guarantee when threads race on shared memory?"
status: draft
difficulty: hard
frequency: 1
core: false
tags: [memory-model, sharedarraybuffer, atomics, data-races, concurrency, workers]
related:
  - javascript/json-and-binary-data/sharedarraybuffer-atomics
  - javascript/json-and-binary-data/arraybuffer-typed-arrays
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-memory-model
  - https://tc39.es/ecma262/#sec-memory-model-fundamentals
  - https://tc39.es/ecma262/#sec-synchronizes-with
  - https://tc39.es/ecma262/#sec-happens-before
  - https://tc39.es/ecma262/#sec-races
  - https://tc39.es/ecma262/#sec-data-races
  - https://tc39.es/ecma262/#sec-data-race-freedom
  - https://tc39.es/ecma262/#sec-tear-free-aligned-reads
  - https://tc39.es/ecma262/#sec-memory-order
  - https://tc39.es/ecma262/#sec-shared-memory-guidelines
  - https://github.com/tc39/proposal-ecmascript-sharedmem
  - https://nodejs.org/docs/latest-v24.x/api/worker_threads.html
tldr: >
  If a program has no data races, every agent sees one sequentially consistent interleaving. A data
  race is a write and another access to the same bytes, unordered by happens-before, not both atomic.
  Racy reads may see surprising values, but only bytes some write produced: no undefined behaviour.
  `Atomics` operations are SeqCst and create the happens-before edges.
---

## Answer

ECMAScript's memory model (ES2017, with `SharedArrayBuffer` and `Atomics`) defines what shared-memory reads may return when several agents (workers, the main thread) run at once. It's axiomatic: constraints on event orderings, not an algorithm.

Two kinds of access exist:

- **Atomic** (`Atomics.load`, `store`, `add`, `compareExchange`, …): sequentially consistent (SeqCst). All agents agree on one total order of them. There's nothing weaker such as acquire/release.
- **Data** (plain `view[i]` reads and writes): unordered between agents.

Ordering comes from **happens-before**: program order within an agent (*agent-order*), plus **synchronizes-with** edges. A SeqCst write synchronizes-with a SeqCst read of the same range that reads its value; hosts add their own edges, such as sending a buffer with `postMessage` or starting and stopping a worker.

Two accesses **race** when neither happens-before the other and they are either two writes to overlapping bytes, or a read and the write it reads from. The race is a **data race** unless both are atomic with identical ranges.

The guarantees:

- **Data-race-free programs are sequentially consistent.** Every execution looks like some interleaving of each agent's steps. That's the model to program to.
- **Racy programs still have no undefined behaviour.** Unlike in C++, a racing read can't return arbitrary garbage or break the engine. It returns bytes that some write to that location produced (or the initial zeros), though not necessarily the latest, and different agents may disagree on order.
- **Aligned integer accesses don't tear.** A racing read through an integer typed array gets all its bytes from one of the equal-sized writes; float arrays and `DataView` may mix bytes.

So `x++` on shared memory loses updates (read, add, write can interleave), and a plain flag can't safely publish other data. Use `Atomics` for the flag or counter; that's what creates the happens-before edge.

## Example

```js
import { Worker } from 'node:worker_threads';

const counters = new Int32Array(new SharedArrayBuffer(8)); // [plain, atomic]

const workerCode = `
  const { workerData } = require('node:worker_threads');
  const counters = new Int32Array(workerData);
  for (let i = 0; i < 1_000_000; i++) {
    counters[0]++; // read, add, write: another thread can interleave
    Atomics.add(counters, 1, 1); // one indivisible read-modify-write
  }
`;
const run = () =>
  new Promise((resolve) => {
    new Worker(workerCode, { eval: true, workerData: counters.buffer }).on('exit', resolve);
  });
await Promise.all([run(), run()]);

console.log(Atomics.load(counters, 1)); // → 2000000
console.log(counters[0]); // varies run to run, usually below 2000000
```

## Pitfalls

- Treating a race as harmless because each increment is one line. `counters[0]++` is a read and a separate write; two agents can both read 5 and both write 6.
- Publishing data with a plain flag (`data = 42; ready = 1`). Without a SeqCst write and read, the reader may see `ready` as 1 and still read the old `data`.
- Spinning on a plain read (`while (flag[0] === 0) {}`). The spec explicitly lets compilers hoist non-atomic reads out of loops "even if that affects termination". Use `Atomics.load` or `Atomics.wait`.
- Mixing atomic and plain accesses, or different sizes, on the same bytes. The spec's guidelines advise treating shared memory as strongly typed: one access size and kind per location.

## Follow-ups

**Q:** Does `Atomics.load` cost more than a plain read?
**A:** It can. The spec's implementer notes say atomic loads and stores compile to sequentially consistent instructions, or to bare accesses with memory barriers where none exist. They also forbid compilers from removing or reordering SeqCst operations, so atomics block optimizations plain accesses allow.

**Q:** Why doesn't JavaScript offer acquire/release orderings like C++?
**A:** The spec just states that no ordering between SeqCst and unordered is supported; it gives no rationale. The practical effect: one strong ordering is simpler to reason about, but you can't ask for cheaper acquire/release barriers on weakly ordered CPUs.

**Q:** Is a data race possible without `SharedArrayBuffer`?
**A:** No. Ordinary objects are never shared between agents; `postMessage` copies or transfers them. Shared Data Blocks, reachable only through `SharedArrayBuffer`, are the only memory several agents access at once.

## Deep dive

### How it works

The spec models a run as a *candidate execution*: every shared-memory read and write becomes an event, and relations order them. *agent-order* is each agent's program order. *reads-from* says which write(s) each read's bytes came from. *synchronizes-with* links a SeqCst write to a SeqCst read of the same range that reads from it, plus host-provided pairs (sending a `SharedArrayBuffer`, starting or stopping an agent) and the Synchronize events of `Atomics.wait`/`notify`. *happens-before* is the transitive closure of agent-order and synchronizes-with.

A candidate is a *valid execution* only if reads are coherent (a read can't see a write that happens after it, or one already overwritten by a write that happens-before the read), aligned integer reads don't tear, and there's a total *memory order* consistent with happens-before for all SeqCst events. The spec also guarantees SeqCst writes become visible to SeqCst reads of the same range in finite time.

That's why the publish pattern is correct. The plain payload write is agent-order-before the `Atomics.store`; the store synchronizes-with the `Atomics.load` that reads 1; that load is agent-order-before the plain payload read. By transitivity, the payload write happens-before the payload read, so they don't race:

```js
import { Worker } from 'node:worker_threads';

const shared = new Int32Array(new SharedArrayBuffer(8)); // [data, ready]

new Worker(
  `
  const { workerData } = require('node:worker_threads');
  const shared = new Int32Array(workerData);
  shared[0] = 42; // plain write of the payload
  Atomics.store(shared, 1, 1); // seq-cst write publishes it
  Atomics.notify(shared, 1);
`,
  { eval: true, workerData: shared.buffer },
);

Atomics.wait(shared, 1, 0); // sleeps while ready is still 0 (allowed on Node's main thread)
console.log(Atomics.load(shared, 1), shared[0]); // → 1 42
```

In the earlier counter example, reading `counters[0]` after the workers exit is also race-free: the spec's notes list stopping an agent as a host synchronization that hosts should account for.

### Edge cases

- **Hoisted reads.** The guidelines list "hoisting non-atomic reads out of loops even if that affects termination" as a valid compiler transformation, so a plain spin loop may never see the flag change. In a Node.js 24 test the loop did exit, but that's an engine choice, not a guarantee.
- **Tearing.** Integer typed array accesses are tear-free when they're aligned and racing writes have equal ranges. `Float64Array` and `DataView` accesses carry no such promise, and overlapping writes of different sizes can always mix bytes.
- **"Reads must be stable."** Compilers may not turn one read in the source into several reads that observe different values (rematerialization), nor invent writes the program couldn't make. Racy code is unpredictable in timing, not in which values exist.
- **Atomics on non-shared buffers.** They work on ordinary `ArrayBuffer`s too, with no other agent to race; `Atomics.wait` requires an `Int32Array` or `BigInt64Array` on shared memory.

## Exercises

### Is this data-race-free?

```js
// shared = new Int32Array(sab): [data, ready]
// Worker A:
shared[0] = 42;
shared[1] = 1;
// Worker B:
while (Atomics.load(shared, 1) === 0);
console.log(shared[0]);
```

**Answer:** No. Worker A's write to `ready` is plain, so B's `Atomics.load` synchronizes with nothing; `shared[0] = 42` doesn't happen-before B's read of it. That's a data race: the model allows B to print `0` after seeing `ready` as 1, even though a test run (Node.js 24, arm64) printed `42`. Making A's write `Atomics.store(shared, 1, 1)` fixes it.

### Predict the output

```js
const view = new Int32Array(new SharedArrayBuffer(4));
view[0] = 5;
Atomics.add(view, 0, 2);
console.log(Atomics.load(view, 0), view[0], Atomics.compareExchange(view, 0, 7, 9), view[0]);
```

**Answer:** `7 7 7 9`. With one agent there's no race, so plain and atomic accesses agree. `compareExchange` returns the old value (7), and because it matched the expected 7, it wrote 9.
