---
title: "How does the event loop work?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [event-loop, call-stack, task, microtask, job, run-to-completion, host]
related:
  - javascript/promises/what-is-a-promise
  - javascript/async-and-the-event-loop/task-microtask-ordering
  - javascript/async-and-the-event-loop/single-threaded
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-jobs
  - https://tc39.es/ecma262/#sec-hostenqueuepromisejob
  - https://tc39.es/ecma262/#sec-agents
  - https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model
  - https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint
  - https://html.spec.whatwg.org/multipage/webappapis.html#hostenqueuepromisejob
  - https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick
  - https://nodejs.org/docs/latest-v24.x/api/process.html#when-to-use-queuemicrotask-vs-processnexttick
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model
tldr: >
  The language only defines jobs that run to completion, one at a time per agent; the event loop belongs to
  the host (browser, Node.js). The loop repeatedly takes one task from a task queue, runs it, then drains the
  whole microtask queue, where promise reactions live, before the next task. Nothing interrupts running code.
---

## Answer

JavaScript code runs on a call stack. When the stack is empty, the host decides what runs next. That scheduler is the **event loop**, and it is defined by the host, not by ECMAScript.

- **What the spec defines.** A *job* is a piece of work started when the execution context stack is empty. Once a job starts, it runs to completion before another job starts in that agent. Promise reactions are enqueued through the host hook `HostEnqueuePromiseJob`. The spec says nothing about `setTimeout`, I/O, or user events.
- **What the host adds.** The HTML Standard (browsers) defines *tasks* in task queues. One iteration of the loop runs one task, then performs a **microtask checkpoint**: it runs microtasks until the microtask queue is empty, including microtasks queued by microtasks. Rendering is not a step after every task: when the browser has a rendering opportunity, it queues a separate *update the rendering* task. Promise jobs go on the microtask queue.
- **Node.js** implements its own loop (libuv) with phases such as timers, poll and check, and runs promise jobs and `process.nextTick` callbacks between callbacks.

Consequences interviewers want to hear:

1. **Run-to-completion.** A running function cannot be interrupted by a timer, event handler or promise callback. A long synchronous loop blocks everything else, including rendering in a browser.
2. **Microtasks before the next task.** A `.then` callback runs before any `setTimeout` callback that was queued earlier.
3. **Timers are minimum delays.** `setTimeout(fn, 0)` queues a task after the delay. It runs when the stack is empty and the loop picks it.
4. **Async I/O does not run JavaScript in parallel.** The host does the waiting, then queues a task to run your callback.

## Example

```js
const start = performance.now();
setTimeout(() => {
  console.log('timer waited at least 100 ms:', performance.now() - start >= 100);
}, 0);

while (performance.now() - start < 100) {
  // synchronous work: no timer, event or promise job can run until this task ends
}
console.log('sync work done');
// → sync work done
// → timer waited at least 100 ms: true
```

## Pitfalls

- Saying "the event loop is part of JavaScript". ECMAScript defines jobs and the host hooks that enqueue them. Browsers and Node.js each define the loop, and they differ in details.
- Treating `setTimeout(fn, 0)` as "run immediately after this line". It runs in a later task, after the current task and all of its microtasks.
- Assuming a strict global order between all callbacks. A browser may have several task queues and picks one in an implementation-defined way, so order is guaranteed only within a source, such as two timers with the same delay.
- Blocking the loop with a long synchronous task or an endless microtask chain, then wondering why timers and events never fire.

## Follow-ups

**Q:** What is the difference between a task and a microtask?
**A:** The loop runs one task per iteration. After each task it runs all microtasks until the queue is empty, so a microtask queued during a task runs before the next task. Promise reactions and `queueMicrotask` callbacks are microtasks.

**Q:** Where does the call stack fit in?
**A:** It is the execution context stack. A job, task or microtask starts only when the stack is empty, and the stack must be empty again when it ends.

**Q:** Do web workers share the event loop?
**A:** No. Each worker is its own agent with its own event loop, stack and heap. See the single-threaded question.

## Deep dive

### How it works

ECMA-262 describes *Jobs and Host Operations to Enqueue Jobs*. A Job is an Abstract Closure with no parameters, run when no other computation is in progress in that agent. The requirements are: the execution context stack must be empty when it starts and again when it ends, only one job is active at a time, and it runs to completion. The spec also says hosts may treat jobs non-uniformly. Browsers and Node.js give promise jobs higher priority than other work. The hook `HostEnqueuePromiseJob` requires only that these jobs run in the same order they were enqueued.

The HTML Standard fills in the rest. Its event loop processing model, in the order the spec writes the steps, is:

1. Choose a task queue that has a runnable task, in an implementation-defined way.
2. Remove the oldest task from that queue and run it.
3. Perform a microtask checkpoint.
4. Report long tasks and update timing bookkeeping.

Rendering is not one of these steps. For a window event loop, a parallel process waits for a rendering opportunity and then queues an *update the rendering* task on the rendering task source, so rendering happens between tasks, not after every task. Rendering is covered in the browser topic.

HTML's `HostEnqueuePromiseJob` queues the job on the microtask queue. The microtask checkpoint dequeues and runs microtasks while the queue is not empty. A flag, *performing a microtask checkpoint*, prevents re-entrant checkpoints when a callback finishes while a checkpoint is already running. After the queue is empty, the checkpoint notifies about rejected promises, which is why unhandled rejection reports arrive after microtasks.

Here is a runnable model of the idea. It is a teaching model, not an engine:

```js
const taskQueue = [];
const microtaskQueue = [];

function runEventLoop() {
  while (taskQueue.length > 0) {
    taskQueue.shift()();
    while (microtaskQueue.length > 0) microtaskQueue.shift()();
  }
}

taskQueue.push(() => {
  console.log('task 1');
  microtaskQueue.push(() => console.log('microtask from task 1'));
});
taskQueue.push(() => console.log('task 2'));
runEventLoop();
// → task 1
// → microtask from task 1
// → task 2
```

### Edge cases

A microtask that keeps queueing microtasks prevents the loop from ever reaching the next task, because the checkpoint runs until the queue is empty. Timers, input and rendering starve. See the ordering question.

Different task sources are different queues. HTML lets the browser choose between queues, so two callbacks from different sources, such as a timer and a message event, have no guaranteed order. The only guarantee is order within one queue.

Node.js runs microtasks at different moments than a browser. Its docs describe phases: *timers* runs expired `setTimeout` and `setInterval` callbacks, *poll* retrieves I/O events, and *check* runs `setImmediate` callbacks. After each callback Node drains the `process.nextTick` queue and then the microtask queue. In a CommonJS main script the `nextTick` queue runs first, so `nextTick` runs before a promise job. In an ES module the module is already being evaluated inside a microtask drain, so the promise job runs first. Ordering of `setTimeout(fn, 0)` against `setImmediate` in the main module depends on process performance, so it is not guaranteed. Phase detail belongs in the Node.js topic.

```js
// run as CommonJS (.cjs)
setTimeout(() => console.log('timer'), 0);
Promise.resolve().then(() => console.log('promise job'));
process.nextTick(() => console.log('nextTick'));
console.log('sync');
// → sync
// → nextTick
// → promise job
// → timer
```

### Real-world scenario

A page freezes for a second while it processes a large array in one loop. The click handlers and the render are tasks stuck behind that one task. The fix is to split the work into chunks and yield to the loop between them, for example by queueing the next chunk with `setTimeout`, so input tasks can run in between. A microtask is not a yield: it runs before the loop moves on, so chunking with `queueMicrotask` or `await` of an already-resolved promise freezes the page just the same.

### Trade-offs

Run-to-completion makes code easy to reason about: between two statements no other JavaScript can change your variables, so you do not need locks. The price is that you cannot preempt a long task, so latency-sensitive work has to be written cooperatively, by chunking work or moving it to a worker.

## Exercises

### Where does the callback run

```js
console.log('a');
setTimeout(() => console.log('b'), 0);
Promise.resolve().then(() => console.log('c'));
console.log('d');
```

**Answer:** `a`, `d`, `c`, `b`. The script is one task and runs synchronously first. When it ends the microtask checkpoint runs `c`. `b` is a separate, later task.

### Does this ever print

```js
let count = 0;
function again() {
  if (++count < 3) queueMicrotask(again);
}
queueMicrotask(again);
setTimeout(() => console.log('timer, count =', count), 0);
```

**Answer:** It prints `timer, count = 3`. The checkpoint keeps running microtasks until none are left, so all three run before the timer task. With a version that never stops, the timer would never run.
