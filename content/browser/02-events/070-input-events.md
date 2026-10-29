---
title: "Which input events should you listen to — pointer, mouse, touch, keyboard, or `input`?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [events, pointer-events, keyboard, beforeinput, composition, ime]
related:
  - browser/events/event-dispatch-phases
  - browser/events/default-actions-and-propagation
  - browser/events/listener-options
  - browser/html-event-loop/rendering-steps
verified: 2026-10
perishable:
  - IME event order checked only in Chrome 156, via CDP emulation
sources:
  - https://www.w3.org/TR/pointerevents/#pointerevent-interface
  - https://www.w3.org/TR/pointerevents/#dom-pointerevent-pointertype
  - https://www.w3.org/TR/pointerevents/#compatibility-mapping-with-mouse-events
  - https://www.w3.org/TR/pointerevents/#setting-pointer-capture
  - https://www.w3.org/TR/pointerevents/#the-touch-action-css-property
  - https://w3c.github.io/uievents/#dom-keyboardevent-key
  - https://w3c.github.io/uievents/#dom-keyboardevent-code
  - https://w3c.github.io/uievents/#code-examples
  - https://w3c.github.io/uievents/#legacy-keyboardevent-event-types
  - https://w3c.github.io/uievents/#dom-keyboardevent-iscomposing
  - https://www.w3.org/TR/input-events-2/#interface-InputEvent-Attributes
  - https://www.w3.org/TR/input-events-2/#input-event-order-during-composition
  - https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event#browser_compatibility
tldr: >
  Pick by intent. Pointer events cover mouse, touch and pen with one model (`pointerType`,
  `setPointerCapture()`, CSS `touch-action`). For shortcuts use `keydown` with `key` for the character
  meant or `code` for the physical key. For text use `input`, and `beforeinput` to veto an edit,
  ignoring `isComposing` updates while an IME composes.
---

## Answer

Choose the event that matches what you want to know, not the device.

**Pointing: pointer events.** `pointerdown`, `pointermove`, `pointerup` and `pointercancel` fire for mouse, touch and pen alike; `pointerType` says which, and `pointerId` separates simultaneous touches. Two tools matter for drags:

- `el.setPointerCapture(event.pointerId)` sends that pointer's later events to `el` even after the pointer leaves it, until `pointerup`.
- CSS `touch-action` tells the browser which panning or zooming it may start itself. Without `touch-action: none` on a touch drag, the browser may take the gesture to pan or zoom, and fires `pointercancel` when it does.

Mouse events still fire after pointer events for compatibility; canceling `pointerdown` suppresses the later `mousedown`/`mouseup`, but not `click`. Touch events are needed only for code that predates pointer events.

**Activation: `click`.** It fires for mouse, touch, and Enter or Space on a focused button, so it's the right event for "the user activated this".

**Keys: `keydown`.** `event.key` is the value produced, after layout and modifiers (`"a"`, `"A"`, `"!"`, `"Enter"`). `event.code` is the physical key (`"KeyA"`, `"Digit1"`), the same on every layout. Use `key` for shortcuts named by character and `code` for position-based controls such as WASD. `keypress` is deprecated.

**Text: `input` and `beforeinput`.** Text arrives by typing, paste, drag, autocorrect, dictation and IMEs, so key events can't track it. `beforeinput` fires before the edit with `inputType` and `data`, and canceling it blocks the edit. `input` fires after and can't be canceled.

**Composition.** IMEs build text in steps between `compositionstart` and `compositionend`. Those steps fire `beforeinput`/`input` with `isComposing: true`, and that `beforeinput` can't be canceled. Validate or search on `compositionend`, not on every step.

## Example

```js
// <input id="field">   — the user types Shift+A, then 1, then Shift+1
const field = document.getElementById('field');
const log = [];
field.addEventListener('keydown', (event) => {
  if (event.key !== 'Shift') log.push(`keydown ${event.key} ${event.code}`);
});
field.addEventListener('beforeinput', (event) => {
  if (/\d/.test(event.data)) {
    event.preventDefault(); // reject digits before they land
    log.push(`rejected ${event.data}`);
  }
});
field.addEventListener('input', (event) => log.push(`${event.inputType} "${field.value}"`));
// …once the typing is done:
console.log(log.join('\n'));
// → keydown A KeyA
// → insertText "A"
// → keydown 1 Digit1
// → rejected 1
// → keydown ! Digit1
// → insertText "A!"
```

Keys were sent with Puppeteer's `page.keyboard` (trusted input). Chrome 156 and Firefox 159 printed the same.

## Pitfalls

- Filtering text in `keydown`. Paste, drag-and-drop, autocorrect and IMEs bypass it; use `beforeinput`.
- Matching shortcuts on `code` when the user means a character. On a French layout the key in the "2" position produces `"é"` but its `code` is still `"Digit2"`.
- Acting on every `input` during IME composition. Japanese or Chinese text arrives as `insertCompositionText` steps with `isComposing: true`; wait for `compositionend`.
- Building a touch drag without `touch-action: none`. The browser may take the gesture to scroll and send `pointercancel`.

## Follow-ups

**Q:** Why does a drag stop updating when the pointer leaves the element?
**A:** Pointer events go to the element under the pointer. Call `setPointerCapture(event.pointerId)` in `pointerdown`; later events then target the capturing element until `pointerup` releases it and `lostpointercapture` fires.

**Q:** Can `beforeinput` be canceled for every edit?
**A:** Input Events Level 2 makes every `beforeinput` cancelable except those inside an IME composition. In Chrome 156, an emulated composition's `insertCompositionText` events had `cancelable: false`, and canceling them changed nothing.

**Q:** Which `key` does a dead key produce?
**A:** `"Dead"` on its `keydown`. In the UI Events example, a composition follows: the next `keydown` already reports `"ê"` and `compositionend` carries `"ê"`. Read text from input and composition events, not by reassembling keys.

## Exercises

### Which events does `#knob` log?

```js
// <div id="knob"></div>   — press on it, drag 300px right off it, release there
const knob = document.getElementById('knob');
const log = [];
for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 'lostpointercapture']) {
  knob.addEventListener(type, () => log.push(type));
}
knob.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  knob.setPointerCapture(event.pointerId);
});
```

**Answer:** `pointerdown, pointerup, lostpointercapture, click`. Capture sends the `pointerup` (and the `click`) to the knob even though the release happened elsewhere; canceling `pointerdown` suppresses `mousedown` and `mouseup` but not `click`. Driven with Puppeteer's `page.mouse` in Chrome 156 and Firefox 159, which agreed.
