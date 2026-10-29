---
title: "Why does a `<button>` inside a form submit it, and how do you control which form and action it uses?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [forms, button, form-owner, formaction, formnovalidate, invoker-commands]
related:
  - html-and-css/forms-dialog-popover/form-submission
  - html-and-css/forms-dialog-popover/popover-attribute
  - html-and-css/forms-dialog-popover/dialog-element
  - html-and-css/documents-and-semantics/content-model-and-parser-repair
verified: 2026-10
perishable:
  - command and commandfor shipped in Chrome 135, Firefox 144, Safari 26.2
sources:
  - https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element
  - https://html.spec.whatwg.org/multipage/form-elements.html#attr-button-type
  - https://html.spec.whatwg.org/multipage/form-elements.html#dom-button-type
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#form-owner
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fae-form
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fs-formaction
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fs-formnovalidate
  - https://html.spec.whatwg.org/multipage/popover.html#popover-target-attribute-activation-behavior
  - https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inbody
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button#browser_compatibility
tldr: >
  A `<button>` with no valid `type` is a submit button, unless it has `command` or `commandfor`. So
  inside a form it submits; write `type="button"` for script-only buttons. Its form owner is the
  ancestor `<form>`, or the form named by its `form` attribute. `formaction`, `formmethod`,
  `formenctype`, `formtarget` and `formnovalidate` override the form for that one button.
---

## Answer

A button's `type` has three keywords: `submit`, `reset`, and `button`. A missing or invalid value puts it in the **Auto** state, and an Auto button is a *submit button* unless it has `command` or `commandfor` (or is the button inside a customisable `<select>`). Submitting is the historical default, kept for compatibility. So:

- `<button>Save</button>` in a form submits it.
- `type="button"` does nothing by default; use it for anything script handles.
- `type="reset"` restores every control to its default value.

The rule in practice: always write `type`.

**Which form?** A control's *form owner* is its nearest ancestor `<form>`, unless it has a `form` attribute, which names a form by `id` anywhere in the same document. That lets a button or input sit outside the form's markup, for example in a sticky footer. `element.form` returns the owner, and `form.elements` includes controls attached by `form`. Forms can't nest: the parser ignores a `<form>` start tag while another form is open.

**Which action?** Submit buttons (`<button>` and `<input type="submit">` or `"image"`) can override the form for the submissions they trigger: `formaction`, `formmethod`, `formenctype`, `formtarget`, and `formnovalidate` to skip validation. Combined with `name` and `value`, which are sent only for the button that was clicked, one form can offer "Save draft" and "Publish" with different endpoints and rules.

Two interactions with newer features follow from the Auto rule. A type-less button with `popovertarget` in a form is still a submit button, so it submits and the popover doesn't open. A type-less button with `commandfor` in a form does nothing at all: the standard returns early for Auto buttons that have a form owner.

## Example

```html
<form id="post" action="/save" method="post">
  <input name="title" required>
  <button>Publish</button>
  <button name="as" value="draft" formaction="/draft" formmethod="get" formnovalidate>
    Save draft
  </button>
  <button type="button" onclick="preview()">Preview</button>
</form>
<button form="post" name="as" value="final">Publish (footer)</button>

<!-- Empty title, click "Save draft" (skips validation): -->
<!-- → GET /draft?title=&as=draft -->
<!-- Empty title, click "Publish": validation message, no request -->
<!-- Title "Hi", click "Publish (footer)": -->
<!-- → POST /save (body title=Hi&as=final) -->
<!-- Click "Preview": no submission -->
```

Chrome 155 and Firefox 158 sent the same requests to a local server.

## Pitfalls

- Omitting `type` on a script button inside a form. Clicking it submits the form and reloads the page.
- Adding `popovertarget` or `commandfor` to a type-less button in a form. The first submits instead of toggling; the second does nothing. Chrome 155 logs a console warning for the `commandfor` case.
- Putting `formaction` or `formnovalidate` on a `type="button"` or `type="reset"` button. They apply only to submit buttons, so nothing changes.
- Ordering a destructive button first. Pressing Enter in a field clicks the form's first submit button in tree order.

## Follow-ups

**Q:** What does `button.type` return for a button without the attribute?
**A:** `"submit"` if it is a submit button, otherwise `"button"`. A type-less button with `commandfor` reported `"button"` in both browsers, even inside a form; one with only `popovertarget` reported `"submit"`.

**Q:** `<button>` or `<input type="submit">`?
**A:** Submission behaviour is the same. `<input>`'s `value` is both its label and the value sent; `<button>` can contain markup such as an icon and keeps its label separate from its `value`.

## Exercises

### What happens on click?

```html
<form action="/search">
  <input name="q" value="x">
  <button popovertarget="menu">Menu</button>
</form>
<div id="menu" popover>…</div>
```

**Answer:** The form submits to `/search?q=x` and the popover never opens. The button has no `type`, so it's a submit button, and a submit button with a form owner has no popover target. Adding `type="button"` makes it toggle the popover. Chrome 155 and Firefox 158 behaved the same.
