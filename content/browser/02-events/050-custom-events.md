---
title: "How do you create and dispatch custom events, and what does `isTrusted` mean?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [events, customevent, dispatchevent, eventtarget, istrusted, user-activation]
related:
  - browser/events/event-dispatch-phases
  - browser/events/default-actions-and-propagation
  - browser/events/dispatch-and-microtasks
  - browser/web-components/shadow-dom-encapsulation
verified: 2026-10
sources:
  - https://dom.spec.whatwg.org/#interface-customevent
  - https://dom.spec.whatwg.org/#dictdef-eventinit
  - https://dom.spec.whatwg.org/#dom-eventtarget-eventtarget
  - https://dom.spec.whatwg.org/#dom-eventtarget-dispatchevent
  - https://dom.spec.whatwg.org/#dom-event-istrusted
  - https://dom.spec.whatwg.org/#concept-event-dispatch
  - https://dom.spec.whatwg.org/#action-versus-occurrence
  - https://html.spec.whatwg.org/multipage/interaction.html#activation-triggering-input-event
  - https://html.spec.whatwg.org/multipage/interaction.html#user-activation-gated-apis
  - https://fullscreen.spec.whatwg.org/#dom-element-requestfullscreen
  - https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/EventTarget#browser_compatibility
tldr: >
  Create `new CustomEvent(type, { detail, bubbles, cancelable, composed })` and call
  `target.dispatchEvent(event)`; it returns `false` if a listener canceled it. All three flags default
  to `false`. Any object can be a target by extending `EventTarget`. `isTrusted` is `true` only for
  events the browser fires from real input; scripted events never grant user activation.
---

## Answer

**Creating.** `new CustomEvent('cart:add', { detail })` makes an event whose `detail` carries any value, by reference. Also pass the flags you need, because each defaults to `false`:

- `bubbles: true` so ancestors and delegates hear it;
- `cancelable: true` so a listener can veto with `preventDefault()`;
- `composed: true` so it crosses shadow-root boundaries.

You can also subclass `Event` (`class AddEvent extends Event`) and put typed fields on it instead of `detail`.

**Dispatching.** `target.dispatchEvent(event)` runs the listeners synchronously and returns `false` if the event was cancelable and some listener canceled it. That return value is how a component asks permission ("may I close?") before acting. An event can't be dispatched while it's already being dispatched (`InvalidStateError`).

**Non-DOM targets.** `new EventTarget()`, or a class that extends it, gives any object `addEventListener()` and `dispatchEvent()`: a store, a WebSocket wrapper, a media controller. Such targets have no parent, so nothing propagates. The constructor arrived in Chrome 64, Firefox 59 and Safari 14.

**`isTrusted`** is `true` when the browser dispatched the event because of real input or its own algorithms, and `false` for anything from `dispatchEvent()`, including `el.click()`. It matters because:

- only trusted `keydown`, `mousedown`, `pointerdown`, `pointerup` and `touchend` events grant **user activation**, which activation-gated APIs such as `requestFullscreen()` require;
- events notify; they don't cause actions. A synthetic `keydown` types nothing. The exception is activation behaviour: a `MouseEvent` named `click` follows a link or toggles a checkbox even when untrusted.

Name custom events so they can't clash with built-in ones, for example with a prefix (`cart:add`).

## Example

```js
// <ul id="cart"><li id="item">Book</li></ul>
const cart = document.getElementById('cart');
const item = document.getElementById('item');
cart.addEventListener('cart:add', (event) => {
  console.log(event.detail.sku, event.target.id, event.isTrusted);
  // → b-42 item false
  if (event.detail.qty > 5) event.preventDefault(); // veto
});
const accepted = item.dispatchEvent(new CustomEvent('cart:add', {
  detail: { sku: 'b-42', qty: 9 },
  bubbles: true,
  cancelable: true,
}));
console.log(accepted);
// → false

class Counter extends EventTarget {
  #count = 0;
  increment() {
    this.#count += 1;
    this.dispatchEvent(new CustomEvent('change', { detail: this.#count }));
  }
}
const counter = new Counter();
counter.addEventListener('change', (event) => console.log('count', event.detail));
counter.increment();
// → count 1
```

Chrome 156 and Firefox 159 printed the same.

## Pitfalls

- Forgetting `bubbles: true`. A delegate on an ancestor never hears the event.
- Calling `preventDefault()` on an event created without `cancelable: true`. It's ignored, and `dispatchEvent()` returns `true`.
- Treating `isTrusted` as a security boundary for your own code. It tells you the browser fired the event, nothing more; it doesn't authenticate data in `detail`.
- Expecting `el.click()` or a dispatched `pointerdown` to unlock `requestFullscreen()`. Untrusted events grant no user activation.

## Follow-ups

**Q:** Is `el.click()` trusted?
**A:** No. The DOM Standard calls it the legacy exception: it runs activation behaviour like a real click, but `isTrusted` is `false`. In Chrome 156 and Firefox 159, `navigator.userActivation.isActive` stayed `false` in its listener and was `true` for a real click.

**Q:** Can the same event object be dispatched twice?
**A:** After the first dispatch finishes, yes. Dispatch resets the stop flags but not the canceled flag, so a canceled event stays `defaultPrevented` and `dispatchEvent()` returns `false` again.

**Q:** How does a web component announce a change to the page?
**A:** Dispatch a bubbling `CustomEvent` on the host itself. An event dispatched inside the shadow root also needs `composed: true` to cross the boundary; outside listeners then see it retargeted to the host.

## Exercises

### What does this print?

```js
// <input type="checkbox" id="box">
const box = document.getElementById('box');
box.dispatchEvent(new Event('click', { bubbles: true }));
console.log(box.checked);
box.dispatchEvent(new MouseEvent('click', { bubbles: true }));
console.log(box.checked);
```

**Answer:** `false`, then `true`. Dispatch runs activation behaviour only for a `MouseEvent` (or subclass) whose type is `click`, trusted or not; a plain `Event` named `click` reaches listeners but toggles nothing. Chrome 156 and Firefox 159 agreed.
