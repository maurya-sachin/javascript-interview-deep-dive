---
title: "When do observer callbacks run compared with events, microtasks, and rendering?"
status: draft
difficulty: hard
frequency: 3
core: false
tags: [mutation-observer, resize-observer, intersection-observer, event-loop, microtasks, rendering]
related:
  - browser/html-event-loop/rendering-steps
  - browser/html-event-loop/request-animation-frame
  - javascript/async-and-the-event-loop/task-microtask-ordering
  - browser/events/dispatch-and-microtasks
  - browser/observers/mutation-observer
  - browser/observers/resize-observer
  - browser/observers/intersection-observer
verified: 2026-10
perishable:
  - "Hidden tab: Chrome 156 delivers no ResizeObserver/IntersectionObserver callbacks"
  - "Hidden tab: Firefox 159 delivered them in rare frames"
  - "Timer queued in ResizeObserver callback ran before IntersectionObserver callback"
sources:
  - https://dom.spec.whatwg.org/#queue-a-mutation-observer-compound-microtask
  - https://dom.spec.whatwg.org/#notify-mutation-observers
  - https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering
  - https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint
  - https://drafts.csswg.org/resize-observer/#broadcast-active-resize-observations
  - https://w3c.github.io/IntersectionObserver/#run-the-update-intersection-observations-steps
  - https://w3c.github.io/IntersectionObserver/#queue-an-intersection-observer-task
  - https://w3c.github.io/IntersectionObserver/#pending-initial-intersectionobserver-targets
tldr: >
  `MutationObserver` callbacks are microtasks: they run as soon as the script that changed the DOM
  returns, with no rendering involved. `ResizeObserver` callbacks run inside the rendering update,
  after animation frame callbacks and layout, before paint. `IntersectionObserver` entries are
  computed in that update too, but the callback is a separate task that runs after the frame.
---

## Answer

The three observers deliver in three different places in the event loop.

**`MutationObserver`: a microtask.** The first DOM change queues one mutation observer microtask; it runs at the next microtask checkpoint, when the current script, listener or callback returns to an empty stack. Rendering isn't involved, so it runs in hidden pages too. During a real click it runs between listeners; after `el.click()` it waits until the whole dispatch returns, as with any microtask.

**`ResizeObserver`: inside the rendering update.** After animation frame callbacks, the browser runs style and layout, then delivers resize observations, then repeats layout for any deeper elements those callbacks resized. All of that happens before paint, so a change made in the callback appears in the same frame. A microtask checkpoint follows each callback, so mutation observers triggered there run before the next observer.

**`IntersectionObserver`: computed in the update, delivered as a task.** After the resize loop, the browser computes intersections and queues one *notify intersection observers* task. That task runs after the update finishes, so after that frame is painted, and other tasks can run first. Changes made in an `IntersectionObserver` callback show in the next frame.

**Initial notifications.** `ResizeObserver` and `IntersectionObserver` deliver their first entries in the first rendering update after `observe()`. The IntersectionObserver spec stops the browser from skipping that update as unnecessary while a target still awaits its first entry. `MutationObserver` has no initial call.

**Hidden pages** get no rendering updates, or very few. In Chrome 156, a size change and an intersection change in a background tab produced no `ResizeObserver` or `IntersectionObserver` callback for 3 s; both arrived within 0.5 s of the tab becoming visible. Firefox 159 still ran 2 animation frames in those 3 s and delivered both in them. The `MutationObserver` callback ran immediately in both.

## Example

```js
const box = document.createElement('div');
document.body.append(box);
const log = [];

new MutationObserver(() => log.push('MutationObserver')).observe(box, { attributes: true });
new ResizeObserver(() => {
  log.push('ResizeObserver');
  setTimeout(() => log.push('timer'));
}).observe(box);
new IntersectionObserver(() => {
  log.push('IntersectionObserver');
  console.log(log.join(', '));
}).observe(box);

requestAnimationFrame(() => log.push('rAF'));
box.title = 'changed';
Promise.resolve().then(() => log.push('promise'));
log.push('script end');
// → script end, MutationObserver, promise, rAF, ResizeObserver, timer, IntersectionObserver
```

Same order in Chrome 156 and Firefox 159, 15 runs each. The mutation observer microtask was queued before the promise reaction, so it ran first. A timer queued from the `ResizeObserver` callback ran before the `IntersectionObserver` callback every time; that order between two tasks isn't guaranteed by any spec.

## Pitfalls

- Toggling visible content from an `IntersectionObserver` callback and expecting it in the current frame. The callback runs after that frame's paint; for same-frame adjustments, use `ResizeObserver` or `requestAnimationFrame`.
- Expecting a `MutationObserver` callback to have run by the next line. It's a microtask: it runs after the current script returns, never in the middle of it.
- Counting impressions with `IntersectionObserver` in background tabs. Chrome delays the entries until the tab is visible; check `document.visibilityState` when timing matters.
- Relying on task order between an `IntersectionObserver` callback and timers or messages queued around the same frame. It's implementation order, not spec order.

## Follow-ups

**Q:** A `ResizeObserver` callback sets an attribute that a `MutationObserver` watches. What runs next?
**A:** The mutation observer, before any other resize observer callback: the checkpoint after each callback drains microtasks. Two resize observers logged `RO 1, MO, RO 2, IO` in both browsers.

**Q:** Do changes made in `requestAnimationFrame` show up in that frame's observer entries?
**A:** Yes. Animation frame callbacks run before the style and layout loop, so sizes and intersections are computed from the DOM they left.

**Q:** Which observer would you use to size a canvas's backing store?
**A:** `ResizeObserver` with `box: 'device-pixel-content-box'`: it runs after layout and before paint, so you can resize and redraw without a stretched frame.

## Deep dive

### How it works

**Mutation observers.** *Queue a mutation observer microtask* checks a flag on the similar-origin window agent; if it's clear, it sets it and queues *notify mutation observers* as a microtask. Any number of mutations before the next checkpoint share that one microtask. Checkpoints run after every callback the browser invokes from an empty stack: each event listener during a user-dispatched event, each animation frame callback, each observer callback, and after every task.

**Resize observers.** In *update the rendering*, after animation frame callbacks, each document runs a loop: recalculate styles and layout, *gather active resize observations at depth* (starting at depth 0), and if any are active, *broadcast* them and continue with the shallowest depth just delivered. Each pass can only deliver elements deeper than the last, so the loop ends; leftover observations make the browser report the loop error and wait for the next frame.

**Intersection observers.** Later in the same update, after focus fix-up and view transition steps, *run the update intersection observations steps* computes every target and queues entries. Queuing the first entry for a document *queues an intersection observer task* on the IntersectionObserver task source, guarded by a per-document flag. Painting happens at the end of the update; the task can only run once the update is done.

### Edge cases

Measured in Chrome 156 and Firefox 159:

| Case | Result |
|---|---|
| Two click listeners each set an attribute, real click | `listener 1, MO, listener 2, MO` |
| Same, `btn.click()` | `listener 1, listener 2, click() returned, MO` |
| `ResizeObserver` callback mutates an observed attribute | MO runs before the next resize observer |
| Background tab, Chrome 156 | MO immediately; RO and IO only after becoming visible |
| Background tab, Firefox 159 | MO immediately; RO and IO in the next throttled frame |

The click rows follow from microtask checkpoints between listeners, covered in the event dispatch question.
