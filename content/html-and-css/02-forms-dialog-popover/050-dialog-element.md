---
title: "How does `<dialog>` work — `show()` vs `showModal()`, closing, and the return value?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [dialog, modal, showmodal, returnvalue, closedby, inert]
related:
  - html-and-css/positioning-and-stacking/top-layer
  - html-and-css/forms-dialog-popover/popover-attribute
  - html-and-css/forms-dialog-popover/form-submission
  - html-and-css/forms-dialog-popover/button-types-and-form-owner
verified: 2026-10
perishable:
  - closedby shipped in Chrome 134, Firefox 141; Safari not yet
  - requestClose() shipped in Chrome 134, Firefox 139, Safari 18.4
  - Firefox 158 sets returnValue "" for a value-less dialog submitter
  - Chrome 155 sets returnValue "" when Escape closes a dialog
sources:
  - https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element
  - https://html.spec.whatwg.org/multipage/interactive-elements.html#show-a-modal-dialog
  - https://html.spec.whatwg.org/multipage/interactive-elements.html#close-the-dialog
  - https://html.spec.whatwg.org/multipage/interactive-elements.html#attr-dialog-closedby
  - https://html.spec.whatwg.org/multipage/interactive-elements.html#dialog-focusing-steps
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#form-submission-algorithm
  - https://html.spec.whatwg.org/multipage/interaction.html#close-watcher-request-close
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/requestClose#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button#browser_compatibility
tldr: >
  `show()` opens a non-modal dialog; `showModal()` puts it in the top layer, makes the rest of the
  page inert, and lets Escape close it. `close(value)` closes it, `requestClose(value)` fires a
  cancelable `cancel` first, and a `<form method="dialog">` closes it with the clicked button's
  `value`. The result lands in `returnValue`; a `close` event follows.
---

## Answer

A `<dialog>` is hidden until it has the `open` attribute. There are two ways to show it:

- **`show()`** opens it **non-modally**. The rest of the page stays interactive, and by default Escape doesn't close it.
- **`showModal()`** opens it **modally**. It goes into the top layer, above every `z-index`, with a `::backdrop` behind it. The rest of the document becomes **inert**: no clicks, no focus. Escape closes it, and it matches `:modal`.

Both move focus into the dialog (its `autofocus` descendant, otherwise its first focusable element), and closing returns focus to whatever had it before.

Three ways to close it, all ending in the same steps:

- **`close(value)`** closes immediately.
- **`requestClose(value)`** first fires a cancelable `cancel` event, exactly as Escape does. Use it for your own close buttons so one `cancel` handler covers every route.
- **A `<form method="dialog">`** inside it closes the dialog on submit instead of sending a request. The submit button's `value` becomes the result. Validation still runs first.

The result is stored in **`returnValue`**, a string. It is updated only when a value is given, and it isn't reset when the dialog reopens, so reset it yourself before `showModal()`. After closing, a `close` event fires as a separate task; `open` is already `false` by then.

**`closedby`** chooses what the user can do: `any` (Escape or a click outside), `closerequest` (Escape only, the modal default) or `none` (the non-modal default). `requestClose()` ignores it. Chrome 134 and Firefox 141 support `closedby`; Safari doesn't yet. Buttons can also act without script: `commandfor="id"` with `command="show-modal"`, `"close"` or `"request-close"` (Chrome 135, Firefox 144, Safari 26.2).

Don't remove the `open` attribute by hand: no `close` event fires, and a modal dialog leaves the page blocked.

## Example

```html
<button id="open">Delete file…</button>
<dialog id="confirm-delete">
  <form method="dialog">
    <p>Delete report.pdf?</p>
    <button value="cancel">Cancel</button>
    <button value="delete" autofocus>Delete</button>
  </form>
</dialog>
<script>
  const dialog = document.querySelector("#confirm-delete");
  document.querySelector("#open").addEventListener("click", () => {
    dialog.returnValue = "";
    dialog.showModal();
    console.log("focused:", document.activeElement.value); // → focused: delete
  });
  dialog.addEventListener("cancel", () => console.log("cancel"));
  dialog.addEventListener("close", () => {
    console.log("close:", JSON.stringify(dialog.returnValue), "focus back on", document.activeElement.id);
  });
  // Click "Delete":  → close: "delete" focus back on open
  // Press Escape:    → cancel
  //                  → close: "" focus back on open
  // Click "Cancel":  → close: "cancel" focus back on open
</script>
```

Chrome 155 and Firefox 158 logged the same lines.

## Pitfalls

- Reading `returnValue` without resetting it. The standard keeps the last result when a close gives no value, so after an earlier "delete", an Escape still reads `"delete"` in Firefox 158. Chrome 155 sets it to `""` on Escape, but keeps it for `requestClose()` and light dismiss.
- Putting a `required` field in a `method="dialog"` form and expecting Cancel to close it. Submission validates first; add `formnovalidate` to the Cancel button.
- Opening with `show()` and expecting modal behaviour. The page stays interactive and Escape does nothing.
- Expecting `showModal()` to stop the page scrolling. Inert stops interaction, not scrolling; both browsers scrolled the page behind on a wheel event.

## Follow-ups

**Q:** What does `cancel.preventDefault()` do, and can it trap the user?
**A:** It keeps the dialog open after Escape or `requestClose()`. Not for long: the standard allows preventing an Escape close only while the page has history-action user activation, so a second Escape with no click in between closes it anyway. Firefox 158 did this.

**Q:** What happens if you call `showModal()` on a dialog opened with `show()`?
**A:** It throws an `InvalidStateError`. It also throws if the dialog isn't connected or is an open popover. Calling it on a dialog that's already modal does nothing. Close a non-modal dialog first to reopen it as modal.

**Q:** How do you stop the page scrolling behind a modal?
**A:** With CSS: `html:has(dialog:modal) { overflow: hidden; }`. In both browsers the page stayed at `scrollY` 0 under a wheel event with this rule, and scrolled to 600 without it.

## Deep dive

### How it works

`showModal()` runs "show a modal dialog". It throws if the dialog is already open non-modally, isn't connected, or is a showing popover. It fires a cancelable `beforetoggle`, adds `open`, and marks the document as *blocked by a modal dialog*: everything outside the dialog becomes inert. It adds the dialog to the top layer, remembers the focused element, hides unrelated open popovers, and runs the **dialog focusing steps**: the dialog if it has `autofocus`, otherwise its focus delegate (the `autofocus` descendant or first focusable one), otherwise the dialog itself.

"Close the dialog" reverses it. It removes `open` and the top-layer entry, sets `returnValue` only when the result isn't null, restores focus to the remembered element if focus was inside the dialog or the dialog was modal, and queues the `close` event. Because the event is queued, code after `close()` sees `open === false` before any `close` listener runs.

Escape, the Android back gesture and `requestClose()` go through a **close watcher**. It fires `cancel`; if that isn't cancelled, the dialog closes with the pending return value. `closedby` decides whether the watcher is enabled, and `closedby="any"` adds light dismiss: a click outside also goes through `cancel`.

With `method="dialog"`, the form submission algorithm validates, fires `submit` and builds the form data as usual, then closes the nearest ancestor dialog with the submitter's value instead of navigating. An image button supplies its click coordinates as `"x,y"`.

### Edge cases

- **A submit button with no `value`.** Its optional value is null, so the standard leaves `returnValue` unchanged. Chrome 155 kept the previous value; Firefox 158 set it to `""`. Give every closing button a `value`.
- **`close()` and `requestClose()` with no argument** keep the previous `returnValue` in both browsers.
- **Non-modal dialogs and the top layer.** `show()` doesn't use the top layer, so a non-modal dialog stacks and clips like any element; see the top layer question for how modal dialogs escape that.
- **`show()` on a modal dialog** throws `InvalidStateError`; on an open non-modal one it does nothing.

### Real-world scenario

A confirm flow that reads like `window.confirm()` but is styled and accessible:

```js
function ask(dialog) {
  dialog.returnValue = "";
  dialog.showModal();
  return new Promise((resolve) => {
    dialog.addEventListener("close", () => resolve(dialog.returnValue), { once: true });
  });
}

const answer = await ask(document.querySelector("#confirm-delete"));
if (answer === "delete") deleteFile();
```

Escape resolves with `""`, a form button with its `value`, `close("x")` with `"x"`. Both browsers resolved `""` for Escape and the button's value for a click.

### Trade-offs

A modal `<dialog>` replaces most of a hand-built modal: top layer instead of `z-index` battles, native inertness instead of a focus trap and `aria-hidden` on siblings, Escape handling and focus return for free. You still own scroll locking, enter and exit animations, and choosing initial focus with `autofocus`. For non-modal UI such as menus, tooltips and toasts, the `popover` attribute is a better fit: it adds light dismiss and stacking without the dialog's semantics.

## Exercises

### What does this log?

```js
// <dialog id="d"><form method="dialog"><button id="b">OK</button></form></dialog>
d.returnValue = "ok";
d.showModal();
b.click();
console.log(JSON.stringify(d.returnValue), d.open);
```

**Answer:** Chrome 155 logs `"ok" false`, which is what the standard says: the button has no `value`, so the result is null and `returnValue` is left alone. Firefox 158 logs `"" false`. Either way the dialog closes synchronously.
