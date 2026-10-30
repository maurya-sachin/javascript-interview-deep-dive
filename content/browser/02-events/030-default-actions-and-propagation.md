---
title: "What's the difference between `preventDefault()`, `stopPropagation()`, and `stopImmediatePropagation()`?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [events, prevent-default, stop-propagation, default-action, cancelable, event-handlers]
related:
  - browser/events/event-dispatch-phases
  - browser/events/event-delegation
  - browser/events/listener-options
  - html-and-css/forms-dialog-popover/form-submission
  - html-and-css/forms-dialog-popover/button-types-and-form-owner
verified: 2026-10
sources:
  - https://dom.spec.whatwg.org/#dom-event-preventdefault
  - https://dom.spec.whatwg.org/#set-the-canceled-flag
  - https://dom.spec.whatwg.org/#dom-event-defaultprevented
  - https://dom.spec.whatwg.org/#dom-event-stoppropagation
  - https://dom.spec.whatwg.org/#dom-event-stopimmediatepropagation
  - https://dom.spec.whatwg.org/#concept-event-dispatch
  - https://dom.spec.whatwg.org/#eventtarget-legacy-pre-activation-behavior
  - https://html.spec.whatwg.org/multipage/input.html#checkbox-state-(type=checkbox)
  - https://html.spec.whatwg.org/multipage/webappapis.html#the-event-handler-processing-algorithm
tldr: >
  They control different things. `preventDefault()` cancels the browser's default action (following a
  link, submitting, toggling a checkbox) if the event is cancelable; the event keeps propagating.
  `stopPropagation()` stops the event reaching further nodes but lets the current node's other
  listeners run; `stopImmediatePropagation()` skips those too. Neither stop method cancels the default.
---

## Answer

An event has two independent outcomes: which listeners hear it, and whether the browser then does its **default action**. Each method touches only one.

**`preventDefault()`** sets the event's *canceled flag*, so `defaultPrevented` becomes `true` and the default action doesn't happen: a link doesn't navigate, a form doesn't submit, a checkbox click is undone, a key press inserts no character. It works only when `event.cancelable` is true, and not inside a `passive` listener; otherwise it silently does nothing. Propagation continues normally.

**`stopPropagation()`** sets the *stop propagation flag*. Remaining listeners on the current node still run, but the event goes no further along the path. Called in a capture listener on an ancestor, it stops the event before it reaches the target.

**`stopImmediatePropagation()`** also stops the remaining listeners on the current node.

Neither stop method cancels the default action: a link whose click was stopped still navigates.

Defaults that come from *activation behaviour* (links, buttons, checkboxes, form submission) run after dispatch finishes, so any listener on the path can cancel them, and so can a `click()` or `dispatchEvent()` from script. A checkbox is special: it toggles *before* listeners run, so the handler reads the new value, and a canceled click restores the old one.

Event handler properties have a shortcut: returning `false` from `onclick` cancels the event. Returning `false` from an `addEventListener()` callback does nothing.

Legacy: `event.returnValue = false` is an alias for `preventDefault()`, and `cancelBubble = true` for `stopPropagation()`.

## Example

```js
// <div id="wrap"><input type="checkbox" id="box"></div>
const wrap = document.getElementById('wrap');
const box = document.getElementById('box');
const log = [];
box.addEventListener('click', (event) => {
  log.push(`box 1 sees checked=${box.checked}`);
  event.stopImmediatePropagation(); // skips box 2 and every ancestor
});
box.addEventListener('click', () => log.push('box 2'));
wrap.addEventListener('click', () => log.push('wrap'));

box.click();
console.log(`${log.join(', ')} | after: ${box.checked}`);
// → box 1 sees checked=true | after: true

log.length = 0;
wrap.addEventListener('click', (event) => event.preventDefault(), true);
box.click();
console.log(`${log.join(', ')} | after: ${box.checked}`);
// → box 1 sees checked=false | after: true
```

The first click is stopped but not canceled, so the box stays checked. The second is canceled in an ancestor's capture listener, but still reaches the box; the toggle is undone afterwards. Chrome 156 and Firefox 159 printed the same.

## Pitfalls

- Calling `stopPropagation()` to stop a link navigating. It doesn't; only `preventDefault()` does.
- Calling `preventDefault()` on a non-cancelable event (`new Event('x')` defaults to `cancelable: false`). Nothing happens; check `defaultPrevented`.
- Returning `false` from an `addEventListener()` callback and expecting it to cancel. Only `on*` handler properties and attributes treat `false` that way.
- Using `stopPropagation()` to keep a click to yourself. It also blinds delegates and document-level handlers (analytics, click-outside); prefer checking `defaultPrevented` there.

## Follow-ups

**Q:** How can a later listener know an earlier one canceled the event?
**A:** `event.defaultPrevented` is `true`. Dispatchers read it too: `dispatchEvent()` returns `false` when a cancelable event was canceled.

**Q:** Does `return true` from `window.onerror` mean "carry on"?
**A:** No, it's the inverted case: for `error` events on a global object, returning `true` cancels the event, which suppresses the default error report. `onbeforeunload` is the other exception.

**Q:** Why does a click handler on a checkbox already see the new `checked` value?
**A:** The checkbox's *legacy-pre-activation behaviour* toggles it before dispatch; if the event ends up canceled, *legacy-canceled-activation behaviour* restores the old value.

## Exercises

### What does this print?

```js
// <input type="checkbox" id="box2">
const box = document.getElementById('box2');
const click = () => box.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
box.addEventListener('click', () => false);
console.log(click(), box.checked);
box.onclick = () => false;
console.log(click(), box.checked);
```

**Answer:** `true true`, then `false true`. The `addEventListener()` callback's `false` is ignored, so the first click toggles the box on. The `onclick` property's `false` cancels the second click, so `dispatchEvent()` returns `false` and the toggle is reverted. Chrome 156 and Firefox 159 agreed.
