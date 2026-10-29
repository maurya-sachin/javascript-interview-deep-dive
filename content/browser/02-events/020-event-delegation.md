---
title: "What is event delegation, and when does it break?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [events, delegation, bubbling, closest, focusin, composed-path]
related:
  - browser/events/event-dispatch-phases
  - browser/events/default-actions-and-propagation
  - browser/the-dom/querying-and-traversal
  - browser/web-components/shadow-dom-encapsulation
verified: 2026-10
sources:
  - https://dom.spec.whatwg.org/#concept-event-dispatch
  - https://dom.spec.whatwg.org/#dom-element-closest
  - https://dom.spec.whatwg.org/#dom-event-composedpath
  - https://w3c.github.io/uievents/#event-type-focus
  - https://w3c.github.io/uievents/#event-type-focusin
  - https://www.w3.org/TR/pointerevents/#mouse-event-types
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#enabling-and-disabling-form-controls:-the-disabled-attribute
tldr: >
  Delegation puts one listener on a common ancestor and finds the real item with
  `event.target.closest(selector)`, so items added later need no listener of their own. It relies
  on bubbling, so it breaks for events that don't bubble (`focus`, `mouseenter`, `scroll`), when inner
  code calls `stopPropagation()`, inside shadow roots, and on disabled controls.
---

## Answer

**Event delegation** handles events for many elements with one listener on an ancestor. A `click` on any descendant bubbles up to it, and the handler works out which item was meant:

1. Start from `event.target`, the innermost element hit, often a `<span>` or icon inside the button.
2. Call `event.target.closest(selector)` to find the nearest matching ancestor (or the element itself).
3. Check the match is inside the container with `container.contains(match)`, because `closest()` keeps climbing past it.

Why use it: items rendered later (a new list row) work without wiring, there's one listener instead of thousands, and nothing needs removing when rows are deleted. `event.currentTarget` is still the container.

When it breaks:

- **Events that don't bubble.** `focus`, `blur`, `mouseenter`, `mouseleave`, `pointerenter`, `pointerleave`, `scroll` on an element, `invalid`, and `load`/`error` on an image never reach an ancestor's bubble listener. Use the bubbling twins (`focusin`/`focusout`, `pointerover`/`pointerout`) or a capture listener.
- **`stopPropagation()` below.** Any handler between the target and the container that stops propagation hides the event from the delegate.
- **Shadow DOM.** Outside a shadow root, `event.target` is retargeted to the host, so `closest()` can't see the inner element. `composedPath()` can, for open shadow roots.
- **Disabled controls.** A real click on a disabled `<button>`, or on an element inside one, fires no `click` at all, so the delegate hears nothing.

Delegate for clicks, input and key events on lists, tables and toolbars; attach directly when an element has behaviour of its own that must not be skipped.

## Example

```js
// <ul id="todos"><li><button data-action="done"><b>Done</b></button> <input></li></ul>
const todos = document.getElementById('todos');
const log = [];
todos.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || !todos.contains(button)) return;
  log.push(`${button.dataset.action} via ${event.target.nodeName}`);
});
todos.addEventListener('focus', () => log.push('focus')); // children's focus never reaches it
todos.addEventListener('focusin', (event) => log.push(`focusin ${event.target.nodeName}`));

todos.insertAdjacentHTML('beforeend', '<li><button data-action="delete">Delete</button></li>');
todos.querySelector('b').click();
todos.querySelector('[data-action="delete"]').click();
todos.querySelector('input').focus();
console.log(log.join(' | '));
// → done via B | delete via BUTTON | focusin INPUT
```

Chrome 156 and Firefox 159 printed the same.

## Pitfalls

- Testing `event.target.matches('button')`. A click on the `<b>` inside the button fails it; use `closest()`.
- Skipping the `contains()` check. With nested lists, `closest()` can return an ancestor outside the container.
- Delegating `focus`, `blur` or `mouseenter` in the bubble phase. They don't bubble; use `focusin`, `focusout`, `pointerover` or a capture listener.
- Delegating clicks on `<div>`s. The handler works, but keyboard and screen-reader users can't reach a div; delegate on real `<button>`s.

## Follow-ups

**Q:** Is delegation faster?
**A:** It saves memory and setup when there are many items or they change often. Each event then pays for a `closest()` walk, which matters only for high-frequency events like `pointermove`.

**Q:** How do you delegate `mouseenter` per item?
**A:** Listen for `pointerover` (it bubbles), find the item with `closest()`, and ignore the event when `event.relatedTarget` is inside the same item, meaning the pointer moved between the item's own children.

**Q:** Why does a delegated `submit` listener on `document` work but `invalid` doesn't?
**A:** `submit` bubbles; `invalid` is fired without `bubbles`. Register `invalid` with `capture: true` on the form or document.

## Deep dive

### How it works

Delegation is nothing more than the bubble phase plus a lookup. Dispatch builds the path from the target up to `Window`, and a non-capture listener on the container runs when the walk reaches it, with `target` still pointing at the original node. `closest()` walks from that node up through ancestors and returns the first that matches the selector, which may be the node itself or something above the container. Hence the `contains()` guard.

Because the lookup runs at event time, the container doesn't care when its children were created. That is the whole case for delegation in lists that re-render: no listener bookkeeping, and nothing to leak when rows are removed.

### Edge cases

**Non-bubbling events.** In Chrome 156 and Firefox 159 a capture listener on `document` saw `bubbles: false` for `focus`, `blur`, `mouseenter`, `mouseleave`, `pointerenter`, element `scroll`, `invalid`, and an image's `load` and `error`; `focusin`, `focusout`, `mouseover` and `pointerover` were `true`. To emulate a per-item `pointerenter`, delegate `pointerover` and filter out moves inside the same item:

```js
// <ul id="list"><li id="one">One <b>bold</b></li><li id="two">Two</li></ul>
const list = document.getElementById('list');
const log = [];
list.addEventListener('pointerover', (event) => {
  const item = event.target.closest('li');
  if (!item || item.contains(event.relatedTarget)) return; // moved within the item
  log.push(`enter ${item.id}`);
});
list.addEventListener('mouseenter', (event) => log.push(`mouseenter ${event.target.id}`));
// real mouse: over <b>, then the rest of #one, <b> again, then #two
console.log(log.join(', '));
// → enter one, mouseenter list, enter two
```

The mouse was moved with Puppeteer's `page.mouse.move()` (trusted input) in Chrome 156 and Firefox 159; both printed the same. `mouseenter` fired once, for the list itself, never for an item.

**Shadow DOM.** By the time a click inside a shadow root reaches a delegate outside it, `target` is the host. `composedPath()` still lists the inner nodes when the shadow root is open:

```js
// <div id="menu"><my-button id="host"></my-button></div>
const menu = document.getElementById('menu');
const host = document.getElementById('host');
host.attachShadow({ mode: 'open' }).innerHTML = '<button data-cmd="paste">Paste</button>';
menu.addEventListener('click', (event) => {
  const viaClosest = event.target.closest('[data-cmd]');
  const viaPath = event.composedPath().find((node) => node.dataset?.cmd);
  console.log(`${event.target.nodeName} ${viaClosest} ${viaPath.dataset.cmd}`);
});
host.shadowRoot.querySelector('button').click();
// → MY-BUTTON null paste
```

Chrome 156 and Firefox 159 printed the same. A closed shadow root's internals are left out of `composedPath()` for outside listeners, so a component that wants to be delegated to should dispatch its own composed event instead.

**Disabled controls.** The HTML Standard requires a disabled form control to suppress user `click` events. Browsers go further: with a trusted Puppeteer click on a disabled `<button>`, and on a `<span>` inside one, Chrome 156 and Firefox 159 dispatched `pointerdown` to the delegate but no `mousedown`, `mouseup` or `click`. A delegate that must react (to show "why is this disabled?") needs `pointerdown`, or the button should use `aria-disabled` instead of `disabled`.

### Real-world scenario

A data table with 5,000 rows and edit/delete buttons per row: one `click` listener on `<tbody>`, `closest('button[data-action]')`, and `closest('tr').dataset.id` for the row. Re-rendering the body costs no listener work, and the handler can't leak references to removed rows. Keyboard support comes free if the targets are real buttons, because Enter and Space on a focused `<button>` fire `click`.

### Trade-offs

Delegation moves work from setup time to event time: every event in the container runs the lookup, including ones that match nothing. For `click` and `input` that's negligible; for `pointermove` or `scroll` it isn't, and a direct listener on the few elements that care is cheaper. It also gives up per-element control: one delegate can't easily be removed for one item, and its order relative to item-level handlers is fixed by the bubble phase.

## Exercises

### What does this print?

```js
// <ul><li data-id="7">Post <ul id="tags"><li><span>red</span></li></ul></li></ul>
const tags = document.getElementById('tags');
tags.addEventListener('click', (event) => {
  const item = event.target.closest('li[data-id]');
  console.log(item?.dataset.id, tags.contains(item));
});
tags.querySelector('span').click();
```

**Answer:** `7 false`. The tag's own `<li>` has no `data-id`, so `closest()` keeps climbing past `#tags` to the outer post item. Without the `contains()` check the tag click would act on the post. Chrome 156 and Firefox 159 agreed.
