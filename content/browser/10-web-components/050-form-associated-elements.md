---
title: "How can a custom element take part in a form?"
status: draft
difficulty: hard
frequency: 2
core: false
tags: [web-components, form-associated-custom-elements, elementinternals, forms, validation]
related:
  - browser/web-components/custom-elements
  - html-and-css/forms-dialog-popover/form-submission
  - html-and-css/forms-dialog-popover/constraint-validation
  - html-and-css/forms-dialog-popover/button-types-and-form-owner
verified: 2026-10
perishable:
  - "ElementInternals form APIs: Chrome 77+, Firefox 98+, Safari 16.4+"
sources:
  - https://html.spec.whatwg.org/multipage/custom-elements.html#form-associated-custom-element
  - https://html.spec.whatwg.org/multipage/custom-elements.html#dom-attachinternals
  - https://html.spec.whatwg.org/multipage/custom-elements.html#form-associated-custom-elements
  - https://html.spec.whatwg.org/multipage/custom-elements.html#dom-elementinternals-setformvalue
  - https://html.spec.whatwg.org/multipage/custom-elements.html#dom-elementinternals-setvalidity
  - https://html.spec.whatwg.org/multipage/custom-elements.html#face-entry-construction
  - https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals#browser_compatibility
tldr: >
  Declare `static formAssociated = true` and call `this.attachInternals()`. The element then gets a
  form owner, a `name`, `disabled` and `<label>` support, and `formResetCallback`-style callbacks.
  `internals.setFormValue()` puts its value into `FormData` and submissions; `setValidity()` makes
  it `:invalid` and blocks submission like a built-in control.
---

## Answer

A plain custom element is invisible to forms: a `<form>` collects only its *form-associated* elements. A custom element becomes one with two steps:

1. `static formAssociated = true` on the class.
2. `this.attachInternals()`, which returns an `ElementInternals` object, the element's private connection to the browser. Keep it private; it can be attached only once.

The browser then treats the element like a built-in control:

- **Form owner**: the ancestor `<form>`, or the one named by its `form` attribute; read it with `internals.form`. It's listed in `form.elements`.
- **`name`, `disabled`, `readonly`** attributes work: a disabled element (or one in a disabled `<fieldset>`) matches `:disabled` and isn't submitted; `readonly` bars it from validation.
- **Labels**: `<label for="id">` is associated (`internals.labels`), and clicking it focuses the element if it's focusable.

What the browser can't infer, you provide through `internals`:

- **Value**: `setFormValue(value, state)`. `value` is a string, a `File`, a `FormData` (several entries, names ignoring `name`) or `null` (not submitted). `state` is what the browser should hand back when it restores the form.
- **Validity**: `setValidity({ valueMissing: true }, 'Pick a rating', anchor)` makes the element `:invalid`, makes `form.checkValidity()` false, fires `invalid` and blocks submission, with the message shown at `anchor`. `setValidity({})` clears it.
- **Callbacks**: `formAssociatedCallback(form)` when the owner changes, `formResetCallback()` on `form.reset()`, `formDisabledCallback(disabled)`, and `formStateRestoreCallback(state, mode)` with `mode` `"restore"` or `"autocomplete"`.

`internals` is private, so expose the usual control API yourself: `value`, `form`, `validity`, `checkValidity()`. `ElementInternals` also sets default ARIA semantics (`internals.role`); accessibility is a separate topic. `attachInternals()` throws `NotSupportedError` on a second call, on customized built-ins and on non-custom elements. MDN's data lists the form APIs in Chrome 77, Firefox 98 and Safari 16.4.

## Example

```js
// The page has <form id="form"><star-input name="rating"></star-input></form>.
class StarInput extends HTMLElement {
  static formAssociated = true;
  #internals = this.attachInternals();
  #value = '';
  constructor() { super(); this.value = ''; }
  get value() { return this.#value; }
  set value(value) {
    this.#value = value;
    this.#internals.setFormValue(value || null); // null leaves it out of the form data
    if (value) this.#internals.setValidity({});
    else this.#internals.setValidity({ valueMissing: true }, 'Pick a rating');
  }
  get form() { return this.#internals.form; }
  formResetCallback() { this.value = ''; }
}
customElements.define('star-input', StarInput);

const input = document.querySelector('star-input');
console.log(input.form === form, input.matches(':invalid'), form.checkValidity());
// → true true false
input.value = '4';
console.log(input.matches(':invalid'), [...new FormData(form)].join());
// → false rating,4
form.reset();
console.log([...new FormData(form)].length, input.value === '', form.checkValidity());
// → 0 true false
```

Chrome 156 and Firefox 159 logged the same. Submitting to a local server with a real click: with no value, the element got `invalid`, no `submit` event fired and nothing was sent; with `'5'`, the request body included `rating=5`.

## Pitfalls

- Forgetting `static formAssociated = true`. `attachInternals()` still works, but `setFormValue()` and `setValidity()` throw `NotSupportedError`.
- Leaving reset to the browser. It doesn't know your default, so without `formResetCallback` the old value stays after `form.reset()`.
- Calling `setValidity()` with a flag but no message: it throws `TypeError`.
- Expecting form association to make the element focusable or announce it as a control. Add `tabindex` (outside the constructor) and a role through `internals.role` yourself.

## Follow-ups

**Q:** When does `formStateRestoreCallback` run?
**A:** When the browser restores form state, such as on back navigation to a page not kept in the back/forward cache. Chrome 156 called it with the `state` from `setFormValue()` and `"restore"` after going back to a `no-store` page; Firefox 159 restored nothing in the same test.

**Q:** What happens inside a disabled `<fieldset>`?
**A:** `formDisabledCallback(true)` runs, the element matches `:disabled`, `willValidate` becomes `false`, and its value is left out of `FormData`. Re-enabling calls `formDisabledCallback(false)`.

**Q:** Why can't a customized built-in use `attachInternals()`?
**A:** It already is a native element: a `<button is="…">` or `<input is="…">` keeps the built-in's own form behaviour, so the spec makes `attachInternals()` throw `NotSupportedError` when the element has an `is` value.

**Q:** How do you submit several fields from one element?
**A:** Pass a `FormData`: `setFormValue(entries)` appends each entry with its own name, ignoring the `name` attribute. Chrome 156 and Firefox 159 put `min` and `max` entries into the form's `FormData`.
