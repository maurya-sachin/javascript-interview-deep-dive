---
title: "What does the `popover` attribute give you, and how is it different from `<dialog>`?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [popover, light-dismiss, popovertarget, top-layer, invoker-commands]
related:
  - html-and-css/forms-dialog-popover/dialog-element
  - html-and-css/positioning-and-stacking/top-layer
  - html-and-css/forms-dialog-popover/button-types-and-form-owner
  - html-and-css/forms-dialog-popover/details-and-summary
verified: 2026-10
perishable:
  - popover="hint" shipped in Chrome 151, Firefox 153; Safari not yet
  - command and commandfor shipped in Chrome 135, Firefox 144, Safari 26.2
sources:
  - https://html.spec.whatwg.org/multipage/popover.html#the-popover-attribute
  - https://html.spec.whatwg.org/multipage/popover.html#attr-popover
  - https://html.spec.whatwg.org/multipage/popover.html#show-popover
  - https://html.spec.whatwg.org/multipage/popover.html#hide-popover-algorithm
  - https://html.spec.whatwg.org/multipage/popover.html#topmost-popover-ancestor
  - https://html.spec.whatwg.org/multipage/popover.html#popover-light-dismiss
  - https://html.spec.whatwg.org/multipage/popover.html#popover-focusing-steps
  - https://html.spec.whatwg.org/multipage/popover.html#attr-popovertarget
  - https://html.spec.whatwg.org/multipage/interaction.html#focus-navigation-scope-owner
  - https://html.spec.whatwg.org/multipage/rendering.html#flow-content-3
  - https://html.spec.whatwg.org/multipage/form-elements.html#attr-button-command
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover#browser_compatibility
tldr: >
  `popover` turns any element into a top-layer overlay shown by `popovertarget` or `showPopover()`.
  `auto` popovers close on Escape or an outside click and close each other unless nested; `manual`
  ones stay until told; `hint` ones don't close `auto` ones. Unlike a modal `<dialog>`, a popover
  leaves the page interactive, doesn't move focus, and returns no value.
---

## Answer

`popover` is a global attribute: any element can have it. A popover is hidden until shown, then rendered in the **top layer**, above all `z-index` stacking and outside any `overflow` clipping. You show it without script from a button, `<button popovertarget="menu">`, with `popovertargetaction="show"`, `"hide"` or the default `"toggle"`; or with `showPopover()`, `hidePopover()` and `togglePopover()`. `:popover-open` matches while it's shown, and `beforetoggle` and `toggle` events report `oldState` and `newState`.

Its value picks the behaviour:

- **`auto`** (also `popover` with no value): **light dismiss**, meaning a click outside or Escape closes it. Opening one closes every other open `auto` popover that isn't its ancestor. A popover opened from inside another, or nested in its DOM, keeps the outer one open, so menus and submenus work.
- **`manual`** (and any invalid value): no light dismiss, no Escape, closes nothing else. Use it for toasts and anything you close yourself.
- **`hint`**: light dismiss like `auto`, but opening it closes only other hints, not `auto` popovers. It's meant for tooltips. Chrome 151 and Firefox 153 support it; Safari doesn't yet.

How it differs from `<dialog>`:

- A popover is **never modal**. The page stays clickable and focus stays where it was; in tab order, the popover's contents come right after the button that opened it. `showModal()` makes the page inert and moves focus inside.
- A popover has **no role** of its own and no `returnValue` or `method="dialog"`. It's behaviour you add to an element that keeps its own semantics.
- `<dialog>` has no light dismiss unless you set `closedby="any"`.

Pick `showModal()` for anything that must block the page until answered. Use `popover` for menus, pickers, tooltips and toasts. `<dialog popover>` gives a non-modal dialog with light dismiss; its `open` stays `false`, so check `:popover-open`.

## Example

```html
<button popovertarget="menu">Menu</button>
<div id="menu" popover>
  <a href="#profile">Profile</a>
  <button popovertarget="help">Help</button>
</div>
<div id="help" popover>Keyboard shortcuts…</div>
<div id="toast" popover="manual">Saved</div>
<script>
  document.addEventListener("toggle", (e) => console.log(e.target.id, e.newState), true);
  document.querySelector("#toast").showPopover();
  // On load:              → toast open
  // Click "Menu":         → menu open
  // Click "Help":         → help open
  // Press Escape:         → help closed
  // Click "Help" again:   → help open
  // Click the page:       → help closed
  //                       → menu closed
  // Press Escape:         (nothing: the toast is manual)
</script>
```

Chrome 155 and Firefox 158 logged the same sequence. `help` opened from inside `menu`, so `menu` stayed open; Escape closed only the topmost popover.

## Pitfalls

- Expecting a popover to block the page. A click outside reaches its target *and* light-dismisses the popover: both browsers fired the outside button's `click` handler while closing it.
- Putting `popovertarget` on a type-less button inside a form. It's a submit button, so it submits instead of toggling; add `type="button"`.
- Calling `showPopover()` on an element without the attribute. It throws `NotSupportedError`; on an already-open popover it does nothing.
- Writing a typo like `popover="atuo"`. Invalid values mean `manual`, so it silently loses light dismiss; `el.popover` returned `"manual"` in both browsers.

## Follow-ups

**Q:** How do you position a popover next to its button?
**A:** By default it's `position: fixed` and centred by `inset: 0; margin: auto`. Anchoring it to the button is a CSS job, done with anchor positioning or script; the popover attribute itself only handles showing, stacking and dismissal.

**Q:** Can you stop a popover from opening?
**A:** Yes: `beforetoggle` is cancelable when opening. It isn't when closing (`cancelable` was `false` in both browsers), so a light dismiss can't be refused.

**Q:** What do invoker commands add?
**A:** `commandfor="id"` with `command="toggle-popover"`, `"show-popover"` or `"hide-popover"` does what `popovertarget` does, and the same pair also drives dialogs (`"show-modal"`, `"close"`) and custom `--commands`. Chrome 135, Firefox 144 and Safari 26.2 support it.

## Exercises

### Which popovers are open at the end?

```js
// <div id="a" popover>…</div> <div id="b" popover="hint">…</div> <div id="c" popover>…</div>
a.showPopover();
b.showPopover();
c.showPopover();
```

**Answer:** Only `c`. Showing `b` (a hint) leaves `a` open, but showing `c` (an auto popover unrelated to the others) closes every other open auto popover and every open hint, so `a` and `b` both close. Chrome 155 and Firefox 158 agreed.
