---
title: "Is `dispatchEvent()` synchronous, and why do microtasks run differently for a real click?"
status: draft
difficulty: hard
frequency: 3
core: false
tags: [events, dispatchevent, microtasks, event-loop, click, testing]
related:
  - javascript/async-and-the-event-loop/event-loop
  - javascript/async-and-the-event-loop/task-microtask-ordering
  - browser/html-event-loop/rendering-steps
  - browser/events/custom-events
  - browser/events/default-actions-and-propagation
verified: 2026-10
sources:
  - https://dom.spec.whatwg.org/#dom-eventtarget-dispatchevent
  - https://dom.spec.whatwg.org/#concept-event-listener-inner-invoke
  - https://webidl.spec.whatwg.org/#call-a-user-objects-operation
  - https://html.spec.whatwg.org/multipage/webappapis.html#clean-up-after-running-script
  - https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint
  - https://dom.spec.whatwg.org/#concept-event-dispatch
  - https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model
tldr: >
  Yes: `dispatchEvent()` and `el.click()` run every listener before they return. Microtasks run
  whenever the JavaScript stack empties. During a real click the browser calls each listener from an
  empty stack, so each listener's microtasks run before the next listener. A scripted dispatch keeps
  the caller on the stack, so microtasks wait until that script finishes.
---

## Answer

**`dispatchEvent()` is synchronous.** It builds the path, calls every listener in order, runs any activation behaviour, and only then returns `true`, or `false` if the event was canceled. Code after the call sees every listener's side effects. A listener that throws is reported to `window`'s `error` event; the caller's code carries on.

**Microtasks** (promise reactions, `queueMicrotask()`) run at a *microtask checkpoint*. The HTML Standard performs one in *clean up after running script*: whenever a callback returns and the JavaScript execution context stack is now empty. Web IDL runs that cleanup after every listener call.

So the difference is who is on the stack:

- **A real click.** The browser dispatches the event from a task with no script running. Each listener returns to an empty stack, so its microtasks run before the next listener starts, and before the default action.
- **`dispatchEvent()` or `el.click()` from script.** Your calling code is still on the stack, so the stack never empties between listeners. All the microtasks wait until the outermost script returns, after the whole dispatch.

This is about the stack, not about `isTrusted`. A trusted `focus` event fired synchronously by `el.focus()` behaves like the scripted case.

It matters when a listener awaits and then touches the event. After an `await` in a real-click listener, dispatch is still in progress: `currentTarget` is set and `preventDefault()` still cancels the default action. With `el.click()`, the same code runs after dispatch ended: `currentTarget` is `null` and canceling is too late. Tests that use `el.click()` or `dispatchEvent()` can therefore pass while real users see different behaviour.

## Example

```js
// <button id="btn">Go</button>
const btn = document.getElementById('btn');
const log = [];
btn.addEventListener('click', () => {
  log.push('listener 1');
  queueMicrotask(() => log.push('microtask 1'));
});
btn.addEventListener('click', () => {
  log.push('listener 2');
  Promise.resolve().then(() => log.push('microtask 2'));
});

const notCanceled = btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
log.push(`after dispatchEvent(): ${notCanceled}`);
setTimeout(() => console.log(log.join(', ')));
// → listener 1, listener 2, after dispatchEvent(): true, microtask 1, microtask 2
```

`btn.click()` gives the same order. A trusted click on the same two listeners, sent with Puppeteer's `page.click()`, logged `listener 1, microtask 1, listener 2, microtask 2`. Chrome 156 and Firefox 159 agreed on both.

## Pitfalls

- Assuming `dispatchEvent()` is asynchronous like a posted message. Every listener has run before it returns.
- Calling `preventDefault()` after an `await` in a listener. It works for a real click and silently does nothing for `el.click()`; call it before the first `await`.
- Trusting a unit test that drives UI with `el.click()` to reproduce microtask ordering. Use real input (WebDriver, Puppeteer, Playwright) when ordering matters.
- Reading `event.currentTarget` after an `await`. It is `null` once dispatch ends; save it before awaiting.

## Follow-ups

**Q:** Does the microtask of a real click run before the browser paints?
**A:** Yes. Microtasks run within the task that dispatched the click; rendering happens only between tasks, so neither listener nor microtask is ever separated by a paint.

**Q:** What if a listener dispatches another event?
**A:** It runs synchronously inside the listener, and its listeners' microtasks wait because the outer listener is still on the stack. In a real click they run when that outer listener returns, before the next one.

**Q:** Do tasks (`setTimeout`) queued in a listener run between listeners?
**A:** No, never. A task runs only after the current task, including the whole dispatch and its default action, has finished.

## Exercises

### What does this print?

```js
// <input id="field">   — the page has focus
const field = document.getElementById('field');
const log = [];
field.addEventListener('focus', (event) => {
  log.push(`focus trusted=${event.isTrusted}`);
  queueMicrotask(() => log.push('microtask'));
});
field.addEventListener('focus', () => log.push('focus 2'));
field.focus();
log.push('after focus()');
setTimeout(() => console.log(log.join(', ')));
```

**Answer:** `focus trusted=true, focus 2, after focus(), microtask`. The browser fires `focus` itself, so it's trusted, but synchronously inside `field.focus()` while the script is on the stack, so the microtask waits until the script ends. Chrome 156 and Firefox 159 agreed.
