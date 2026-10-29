---
title: "What do the `once`, `passive`, `capture`, and `signal` listener options do?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [events, addeventlistener, passive, once, abortsignal, event-handlers]
related:
  - browser/events/event-dispatch-phases
  - browser/events/default-actions-and-propagation
  - javascript/async-and-the-event-loop/cancelling-async-work
  - browser/rendering-pipeline/compositing
verified: 2026-10
perishable:
  - Default-passive wheel listeners not in Safari (bcd 8.1.7)
  - EventTarget.when() shipped in Chrome 135 only, experimental
sources:
  - https://dom.spec.whatwg.org/#dom-eventtarget-addeventlistener
  - https://dom.spec.whatwg.org/#event-flatten-more
  - https://dom.spec.whatwg.org/#add-an-event-listener
  - https://dom.spec.whatwg.org/#default-passive-value
  - https://dom.spec.whatwg.org/#observing-event-listeners
  - https://dom.spec.whatwg.org/#dom-eventtarget-removeeventlistener
  - https://dom.spec.whatwg.org/#concept-event-listener-inner-invoke
  - https://dom.spec.whatwg.org/#set-the-canceled-flag
  - https://html.spec.whatwg.org/multipage/webappapis.html#event-handler-attributes
  - https://html.spec.whatwg.org/multipage/webappapis.html#activate-an-event-handler
  - https://wicg.github.io/observable/#dom-eventtarget-when
  - https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/when#browser_compatibility
tldr: >
  `capture` runs the listener on the way down instead of up. `once` removes it before its first call.
  `passive` promises not to cancel, so `preventDefault()` does nothing and scrolling needn't wait.
  `signal` removes it when an `AbortSignal` aborts. A listener's identity is type, callback and
  `capture`: adding it twice is a no-op, and removal matches only those three.
---

## Answer

`addEventListener(type, callback, options)` takes either a boolean (meaning `capture`) or an options object:

- **`capture`** registers the listener for the capture phase, so an ancestor hears the event before the target does. Default `false`.
- **`once`** removes the listener just before its first call, even if the callback then throws.
- **`passive`** declares that the listener won't call `preventDefault()`; if it does, the call is ignored and Chrome logs "Unable to preventDefault inside passive event listener invocation." For `touchstart`, `touchmove` and `wheel`, the browser can then scroll without waiting for script, which is why non-passive listeners for them cause scroll jank. When `passive` isn't given, those event types on `window`, `document`, `<html>` or `<body>` default to passive.
- **`signal`** takes an `AbortSignal`; aborting it removes the listener. One `AbortController` can remove a whole component's listeners at once, with no function references kept. A signal that is already aborted means the listener is never added.

A listener is identified by **type, callback and `capture`**. Adding the same trio again is ignored, even with different `once` or `passive` values, and `removeEventListener()` looks only at those three. So a listener added with `capture: true` must be removed with `capture: true`.

**Event handler properties** (`el.onclick = fn`) hold one handler per event type. Assigning replaces it, `null` removes it, and returning `false` cancels the event. The first non-null assignment adds a non-capture listener at that point in the list; later assignments keep that position.

Support: `once` arrived in Chrome 55, Firefox 50 and Safari 10; `signal` in Chrome 90, Firefox 86 and Safari 15. Default-passive touch listeners exist in Chrome 55, Firefox 61 and Safari 11.1; default-passive `wheel` listeners in Chrome 73 and Firefox 84, not Safari.

## Example

```js
// <button id="btn">Go</button>
const btn = document.getElementById('btn');
const controller = new AbortController();
const log = [];
const onClick = () => log.push('capture');

btn.addEventListener('click', () => log.push('once'), { once: true });
btn.addEventListener('click', onClick, { capture: true, signal: controller.signal });
btn.addEventListener('click', onClick, { capture: true, passive: true }); // same key: ignored
btn.addEventListener('click', (event) => {
  event.preventDefault(); // no-op in a passive listener
  log.push(`prevented=${event.defaultPrevented}`);
}, { passive: true });

btn.click();
btn.click();
console.log(log.join(', '));
// → capture, once, prevented=false, capture, prevented=false

log.length = 0;
controller.abort(); // removes onClick
btn.addEventListener('click', onClick, { signal: controller.signal }); // already aborted: not added
btn.click();
console.log(log.join(', '));
// → prevented=false
```

Chrome 156 and Firefox 159 printed the same; Chrome also logged the passive warning three times.

## Pitfalls

- Removing a capture listener without `capture: true`. Nothing matches, and the listener stays.
- Passing a new arrow function to `removeEventListener()`. It's a different callback; keep the reference or use `signal`.
- Marking a `wheel` or `touchmove` listener `passive` and still relying on `preventDefault()` to block scrolling. Use `passive: false`, or CSS `touch-action` for touch.
- Assigning `el.onclick` from two places. The second replaces the first; use `addEventListener()` when several parts of the code listen.

## Follow-ups

**Q:** What happens to `cancelable` when every `wheel` listener is passive?
**A:** The DOM Standard lets the browser dispatch it uncancelable, so scrolling can start in parallel. In Chrome 156 and Firefox 159, a real wheel with only a default-passive `window` listener arrived with `cancelable: false`, and the page scrolled.

**Q:** Is there a promise- or stream-style alternative to `addEventListener()`?
**A:** `EventTarget.when(type)` from the WICG Observable proposal returns an Observable of events. It shipped in Chrome 135; Firefox and Safari don't have it, so treat it as experimental.

**Q:** Does `once` work with `removeEventListener()` before it fires?
**A:** Yes. `once` doesn't change identity, so removing with the same type, callback and `capture` removes it.

## Exercises

### How many times does this log?

```js
// <button id="b2">b2</button>
const b2 = document.getElementById('b2');
const handler = () => console.log('ran');
b2.addEventListener('click', handler, { capture: true, once: true });
b2.removeEventListener('click', handler);
b2.click();
b2.click();
```

**Answer:** Once. `removeEventListener()` without `capture` looks for a non-capture listener and finds none, so the listener survives to the first click; `once` removes it before the second. Chrome 156 and Firefox 159 agreed.
