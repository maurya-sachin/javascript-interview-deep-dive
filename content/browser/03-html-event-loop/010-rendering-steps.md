---
title: "Where does rendering happen in the event loop?"
status: draft
difficulty: hard
frequency: 4
core: true
tags: [event-loop, rendering, update-the-rendering, rendering-opportunity, request-animation-frame, frames]
related:
  - javascript/async-and-the-event-loop/event-loop
  - javascript/async-and-the-event-loop/task-microtask-ordering
  - browser/html-event-loop/request-animation-frame
  - browser/html-event-loop/task-priority-and-scheduler
  - browser/events/dispatch-and-microtasks
  - browser/rendering-pipeline/pixel-pipeline
  - browser/rendering-pipeline/forced-synchronous-layout
  - browser/observers/observer-timing
verified: 2026-10
sources:
  - https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model
  - https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering
  - https://html.spec.whatwg.org/multipage/webappapis.html#rendering-opportunity
  - https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint
  - https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#run-the-animation-frame-callbacks
tldr: >
  Between tasks, never inside one. The loop runs a task, then drains microtasks. When the display
  can show a new frame (a rendering opportunity, about every 16.7 ms at 60 Hz), the browser runs
  "update the rendering": resize and scroll events, `requestAnimationFrame` callbacks, style and
  layout, observers, then paint. Hidden or unchanged documents skip it.
---

## Answer

The HTML event loop repeats one cycle: pick a runnable task, run it, then perform a microtask checkpoint that drains every promise reaction and `queueMicrotask()` callback. Rendering is not part of that cycle. Separately, whenever a document has a **rendering opportunity**, the browser queues a task on the *rendering task source* that runs **update the rendering**.

A rendering opportunity is a moment when the browser can actually present a new frame. The spec leaves the model to the browser: usually the display's refresh rate (about every 16.7 ms at 60 Hz), lower when the page can't keep up, and much lower or never for hidden documents.

Update the rendering then runs these steps for each document, in this order:

1. Resize steps (`resize` events) and scroll steps (`scroll` events).
2. Media query changes, then animation updates and their events.
3. `requestAnimationFrame` callbacks, all with the same frame timestamp.
4. Style and layout, repeated while `ResizeObserver` callbacks change sizes.
5. Intersection observations, paint timing, then the actual update of what's on screen.

What follows for interviews:

- **A task always finishes before a frame.** Ten DOM writes in one task produce one frame showing the final state; nothing in between is ever painted.
- **Microtasks finish before a frame too.** A microtask that keeps queueing microtasks blocks rendering as surely as a `while` loop.
- **A long task delays the next frame.** The rendering task can't start until the current task and its microtasks are done.
- **Rendering can be skipped.** The browser drops documents that are hidden, render-blocked, or have nothing to repaint and no animation frame callbacks.

Reading layout (`offsetWidth`) inside a task runs style and layout early, but painting still waits for update the rendering.

## Example

```js
// <body style="height: 3000px"><div id="box">box</div>
const log = [];
const box = document.getElementById('box');
addEventListener('scroll', () => log.push('scroll event'), { once: true });
new ResizeObserver(() => log.push('ResizeObserver')).observe(box);
requestAnimationFrame(() => {
  log.push('rAF');
  requestAnimationFrame(() => console.log(log.join(', ')));
});
scrollTo(0, 100);
Promise.resolve().then(() => log.push('microtask'));
log.push('task ends');
// → task ends, microtask, scroll event, rAF, ResizeObserver
```

The scroll happens synchronously, but its event waits for the next frame's scroll steps, which run before animation frame callbacks; `ResizeObserver` delivers its first observation after layout. Chrome 156 and Firefox 159 printed the same order in three runs each.

## Pitfalls

- Expecting a "Loading…" message set before a long synchronous job to appear. It is never painted; yield to the event loop first.
- Assuming a `setTimeout(fn, 0)` runs before or after the next `requestAnimationFrame` callback. The spec doesn't order a timer task against the rendering task.
- Believing every event loop iteration renders. Rendering happens only at rendering opportunities, and only for documents with something to update.
- Using a long chain of microtasks to "break up" work. The checkpoint drains them all before any frame.

## Follow-ups

**Q:** Do `requestAnimationFrame` callbacks run in a hidden tab?
**A:** Not by the spec: update the rendering filters out documents whose visibility state is `"hidden"`, so their callbacks wait until the page is visible again.

**Q:** Where do `IntersectionObserver` callbacks run?
**A:** The observations are computed in update the rendering after layout, but the callbacks are delivered in a separate task queued from there. `ResizeObserver` callbacks run inside the step itself.

**Q:** Can two timer callbacks run with no frame between them?
**A:** Yes. The spec lets the browser skip rendering, for example to coalesce timer callbacks so they run back to back with only microtask checkpoints between them.

## Deep dive

### How it works

The processing model in the HTML Standard has two parts that run side by side.

The loop itself chooses a task queue in an implementation-defined way, takes the first runnable task, runs its steps, and performs a microtask checkpoint. It then reports long tasks and, if there's nothing runnable left, computes an idle deadline for `requestIdleCallback`. Nothing in this loop draws anything.

In parallel, a window event loop waits until some navigable "might have a rendering opportunity", records the time as the *last render opportunity time*, and queues a global task on the rendering task source for each navigable with an opportunity. That task is update the rendering. Because it is a task, it competes with other task queues; the spec doesn't fix its priority, and browsers prioritise it in their own ways.

Inside update the rendering, `frameTimestamp` is the last render opportunity time. The browser builds the list of fully active documents on this event loop, ordered so an iframe's document comes after its parent and siblings follow tree order. Then it filters the list:

- **Non-renderable:** render-blocked, hidden, suppressed for a view transition, or without a rendering opportunity right now.
- **Unnecessary rendering:** no visible effect expected *and* no animation frame callbacks.
- **Other reasons:** any document the browser prefers to skip, for example to run timer callbacks back to back.

For the documents that remain, the steps run in order: reveal, flush autofocus candidates, resize steps, scroll steps, evaluate media queries and report changes, update animations and send events, fullscreen steps, canvas context-lost checks, animation frame callbacks, then the style and layout loop. That loop recalculates style and layout, determines `content-visibility: auto` proximity, and delivers `ResizeObserver` notifications at increasing depth until there are none left. After it: focus fix-up when the focused element stopped being focusable, pending view transition operations, intersection observations, paint timing, and finally "update the rendering or user interface … to reflect the current state", which is where the frame is painted and presented.

Every callback in these steps is invoked from an empty stack, so a microtask checkpoint runs after each one. A promise resolved in a scroll listener settles before the animation frame callbacks start.

### Edge cases

- **Same event loop, many documents.** Same-origin iframes are in their parent's agent and share its event loop, so one frame's update the rendering processes all of them, and a slow iframe callback delays the parent's paint.
- **Rendering opportunities are per navigable.** An iframe can lack an opportunity while its parent has one; the spec checks again inside the task for that reason.
- **Throttled opportunities.** The spec's own example: a browser that can't sustain 60 Hz might drop a page to 30 opportunities per second, and a hidden page to 4 per second or fewer.
- **Forced layout.** Reading geometry mid-task runs style and layout synchronously. It doesn't paint, fire `resize` or `scroll` events, or run animation frame callbacks; those still wait for the rendering task.
- **Timer versus frame order.** In headless Chrome 156, a `setTimeout(fn, 0)` queued alongside a `requestAnimationFrame` callback ran first in 60 of 60 trials; in headless Firefox 159 the animation frame callback ran first in 60 of 60. Neither order is guaranteed.

### Real-world scenario

A click handler shows a spinner, then parses a large file synchronously:

```js
saveButton.addEventListener('click', () => {
  status.textContent = 'Saving…';
  const data = parseHugeFile(file); // 300 ms of synchronous work
  status.textContent = 'Saved';
  render(data);
});
```

The user sees nothing for 300 ms, then "Saved". The spinner text existed in the DOM, but no rendering task could run until the click task ended. The fix is to end the task after the feedback: put the slow part after `await scheduler.yield()`, or in a `setTimeout` queued from a `requestAnimationFrame` callback so it starts after the frame. Better still, move the parsing to a worker so the main thread stays free.

Long tasks also delay the response to the next input, which is what Interaction to Next Paint measures.

### Trade-offs

Batching all visual work into one step per frame is what lets the browser compute style and layout once, however many DOM writes a task made. The cost is that the page has no way to "flush" a paint: the only way to show an intermediate state is to end the task and let a rendering opportunity arrive. Code that needs to show progress has to be written as several tasks, and anything that reads layout between writes pays for extra synchronous layouts.

## Exercises

### What does the frame show?

```js
// <button id="save">Save</button> <span id="status"></span>
const status = document.getElementById('status');
document.getElementById('save').addEventListener('click', () => {
  status.textContent = 'Saving…';
  requestAnimationFrame(() => console.log(`frame shows: ${status.textContent}`));
  const end = performance.now() + 300;
  while (performance.now() < end) {} // stand-in for slow synchronous work
  status.textContent = 'Saved';
});
document.getElementById('save').click();
```

**Answer:** `frame shows: Saved`. The animation frame callback runs in the next update the rendering, which can only start after the click task ends, so "Saving…" never reaches a frame. Chrome 156 and Firefox 159 agreed.
