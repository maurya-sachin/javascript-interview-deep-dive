---
title: "How does event dispatch work — capture, target, and bubble?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [events, dispatch, capture, bubbling, event-phase, composed-path]
related:
  - browser/events/event-delegation
  - browser/events/default-actions-and-propagation
  - browser/events/listener-options
  - browser/events/dispatch-and-microtasks
  - browser/web-components/shadow-dom-encapsulation
verified: 2026-10
sources:
  - https://dom.spec.whatwg.org/#concept-event-dispatch
  - https://dom.spec.whatwg.org/#concept-event-listener-invoke
  - https://dom.spec.whatwg.org/#concept-event-listener-inner-invoke
  - https://dom.spec.whatwg.org/#get-the-parent
  - https://dom.spec.whatwg.org/#dom-event-eventphase
  - https://dom.spec.whatwg.org/#dom-event-composedpath
  - https://w3c.github.io/uievents/#event-type-focus
  - https://www.w3.org/TR/pointerevents/#mouse-event-types
tldr: >
  Dispatch first fixes the event's path: the target, its ancestors, the `Document` and the `Window`.
  Capture listeners run from `Window` down; at the target, capture listeners run before the others;
  then, only if `bubbles` is true, non-capture listeners run back up. `eventPhase` is 1, 2 or 3, and
  after dispatch it, `currentTarget` and `composedPath()` are reset.
---

## Answer

When an event is dispatched at a target, the DOM Standard's *dispatch* algorithm first builds the **event path**: the target, each parent up to the root, then the `Document` and its `Window`. The path is fixed before any listener runs, so moving or removing nodes mid-dispatch doesn't change who gets called.

It then walks the path twice:

1. **Capture.** From `Window` down to the target's parent, running listeners added with `capture: true`. `eventPhase` is `CAPTURING_PHASE` (1).
2. **Target.** At the target itself `eventPhase` is `AT_TARGET` (2). Capture listeners run first, then the rest, whatever order they were added in.
3. **Bubble.** From the target's parent back up to `Window`, running non-capture listeners with `eventPhase` `BUBBLING_PHASE` (3), but only when `event.bubbles` is true.

So `bubbles: false` removes only phase 3. The target's own listeners and every capture listener still run.

`event.target` is the node the event was dispatched at; `event.currentTarget` is the node whose listener is running now. `composedPath()` returns the path as an array, target first.

Most input events bubble (`click`, `input`, `keydown`). `focus`, `blur`, `mouseenter` and `mouseleave` don't, nor does `load` on an element, but a capture listener on an ancestor still sees them.

Once dispatch ends the event is reset: `eventPhase` is 0, `currentTarget` is `null` and `composedPath()` returns `[]`. Read them inside the listener, not after an `await` or in a `setTimeout`.

Across a shadow root, outside listeners see `target` retargeted to the host, and only `composed: true` events leave the shadow tree at all (see shadow DOM encapsulation).

## Example

```js
// <div id="outer"><button id="btn">Go</button></div>
const outer = document.getElementById('outer');
const btn = document.getElementById('btn');
const log = [];
const record = (label) => (event) => log.push(`${label}:${event.eventPhase}`);

document.addEventListener('click', record('document capture'), true);
outer.addEventListener('click', record('outer capture'), true);
outer.addEventListener('click', record('outer bubble'));
btn.addEventListener('click', record('btn bubble')); // registered first…
btn.addEventListener('click', record('btn capture'), true); // …runs first
document.addEventListener('click', record('document bubble'));

let path, seen;
btn.addEventListener('click', (event) => {
  seen = event;
  path = event.composedPath().map((target) => target.nodeName ?? 'Window');
});
btn.click();
console.log(log.join(', '));
// → document capture:1, outer capture:1, btn capture:2, btn bubble:2, outer bubble:3, document bubble:3
console.log(path.join(' > '));
// → BUTTON > DIV > BODY > HTML > #document > Window
console.log(seen.eventPhase, seen.currentTarget === null, seen.composedPath().length);
// → 0 true 0
```

Chrome 156 and Firefox 159 printed the same.

## Pitfalls

- Confusing `target` with `currentTarget`. In a listener on a list, `target` may be a child `<span>`; `currentTarget` is the list.
- Assuming `bubbles: false` hides the event from ancestors. Capture listeners on ancestors still run.
- Reading `currentTarget` or `composedPath()` after an `await`. Dispatch has finished, so they are `null` and `[]`.
- Expecting registration order at the target. Capture listeners there run before non-capture ones.

## Follow-ups

**Q:** Why is the default for `addEventListener()` bubble, not capture?
**A:** Bubbling lets the most specific handler run first and ancestors react afterwards, which is what delegation needs. Capture is for seeing an event before the target's own handlers do.

**Q:** Does `window` see every bubbling event?
**A:** Not `load`. A `Document` returns no parent for `load` events, so an `<img>`'s `load` reaches `document` listeners but never `window` ones.

**Q:** What does `this` refer to in a listener?
**A:** `currentTarget` for a regular function. An arrow function keeps the surrounding `this`, so use `event.currentTarget` there.

## Deep dive

### How it works

Each `EventTarget` has a *get the parent* algorithm, and dispatch calls it repeatedly to build the path. A node returns its assigned slot if it has one, otherwise its parent. A `Document` returns its `Window`, except for `load` events or when it has no browsing context. A shadow root returns its host unless the event isn't `composed` and the shadow root is the root of the original target. A `Window`, and a plain `new EventTarget()`, return null, which is why a standalone `EventTarget` never propagates anywhere.

With the path built, dispatch *invokes* each entry twice: once in reverse order with phase "capturing", once in order with phase "bubbling". At each entry, *inner invoke* takes a **clone** of that node's listener list before calling anything. So a listener added to the current node during dispatch doesn't run for this event, while one added to a node the walk hasn't reached yet does. A removed listener is skipped even if it's in the clone, because removal sets its `removed` flag.

```js
// <div id="outer"><button id="btn">Go</button></div><div id="other"></div>
const [outer, btn, other] = ['outer', 'btn', 'other'].map((id) => document.getElementById(id));
const log = [];
btn.addEventListener('click', () => {
  log.push('btn');
  btn.addEventListener('click', () => log.push('btn, added late'));
  outer.addEventListener('click', () => log.push('outer, added late'));
  other.append(btn); // move the target mid-dispatch
});
outer.addEventListener('click', (event) => {
  log.push(`outer, target now in #${event.target.parentNode.id}`);
});
btn.click();
console.log(log.join(' | '));
// → btn | outer, target now in #other | outer, added late
```

`#outer` still runs although the button has left it, because the path was built before the first listener.

If a listener throws, the error is reported to `window`'s `error` event and dispatch moves on to the next listener; one broken handler doesn't stop the others.

### Edge cases

A node outside the document has a shorter path: its ancestors only, with no `Document` or `Window`.

```js
const div = document.createElement('div');
const span = div.appendChild(document.createElement('span'));
span.addEventListener('ping', (e) => console.log(e.composedPath().map((n) => n.nodeName).join()));
span.dispatchEvent(new Event('ping'));
// → SPAN,DIV
```

Resource `load` events stop at the `Document`, so a capture listener on `document` is the way to observe every image load in one place:

```js
const img = new Image();
const isImg = (event) => event.target === img;
window.addEventListener('load', (e) => isImg(e) && console.log('window capture'), true);
document.addEventListener('load', (e) => isImg(e) && console.log('document capture'), true);
img.addEventListener('load', () => console.log('img'));
img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
document.body.append(img);
// → document capture
// → img
```

Chrome 156 and Firefox 159 printed the same for all three blocks.

`focus` and `blur` don't bubble, but `focusin` and `focusout` do and fire for the same focus changes. Delegated focus handling uses those, or a capture listener.

### Real-world scenario

A "click outside to close" handler on `document` in the bubble phase silently stops working when some component calls `stopPropagation()` on its clicks. Registering it with `capture: true` lets it see the click on the way down, before any target-side handler can stop it. The same applies to analytics and focus-trap code that must see every event: capture at the top, and don't call `stopPropagation()` there.

### Trade-offs

Capture listeners on `document` run before every component's own handlers, which is what you want for observation and wrong for behaviour that a component should be able to override. Bubble-phase handlers let inner code run first and decide (`preventDefault()`), at the cost of being skippable by `stopPropagation()`. Choose by asking who should get the last word.

## Exercises

### Which listeners run?

```js
// <div id="parent"><span id="child"></span></div>
const parent = document.getElementById('parent');
const child = document.getElementById('child');
const log = [];
parent.addEventListener('ping', () => log.push('parent capture'), true);
parent.addEventListener('ping', () => log.push('parent bubble'));
child.addEventListener('ping', () => log.push('child'));
child.dispatchEvent(new Event('ping'));
console.log(log.join(', '));
```

**Answer:** `parent capture, child`. `new Event('ping')` has `bubbles: false`, which skips only the bubble phase: the capture listener on the parent and the target's own listener still run. Chrome 156 and Firefox 159 agreed.
