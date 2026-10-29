---
title: "How does native constraint validation work, and how do you customise it?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [forms, constraint-validation, validitystate, setcustomvalidity, user-invalid, pattern]
related:
  - html-and-css/forms-dialog-popover/form-submission
  - html-and-css/forms-dialog-popover/input-types-and-autofill
  - html-and-css/forms-dialog-popover/button-types-and-form-owner
verified: 2026-10
perishable:
  - Default validation messages differ between Chrome 155 and Firefox 158
sources:
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constraints
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#statically-validate-the-constraints
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#interactively-validate-the-constraints
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#the-constraint-validation-api
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#dom-cva-setcustomvalidity
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#user-validity
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fs-novalidate
  - https://html.spec.whatwg.org/multipage/input.html#compiled-pattern-regular-expression
  - https://html.spec.whatwg.org/multipage/semantics-other.html#selector-user-invalid
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:user-invalid#browser_compatibility
tldr: >
  Attributes such as `required`, `type`, `pattern`, `min` and `maxlength` set constraints; each
  control reports them as `ValidityState` flags. On submit the browser fires `invalid` at each
  failing control, shows a message and stops. `setCustomValidity()` adds your own error until you
  clear it. Style with `:user-invalid`, which waits for user interaction, not `:invalid`.
---

## Answer

Every submittable control that isn't *barred* (disabled, `readonly`, hidden inputs, non-submit buttons) is a **candidate for constraint validation**; `willValidate` tells you which. Its attributes define constraints, and `element.validity`, a `ValidityState`, reports each failure as a flag:

- `valueMissing` (`required`), `typeMismatch` (`email`, `url`), `patternMismatch` (`pattern`)
- `tooLong`, `tooShort` (`maxlength`, `minlength`), `rangeUnderflow`, `rangeOverflow`, `stepMismatch` (`min`, `max`, `step`)
- `badInput` (text the browser can't convert, such as letters in a number field)
- `customError`, set by `setCustomValidity(message)`
- `valid`: true when none of the above is

`checkValidity()` returns the result and fires a cancelable, non-bubbling `invalid` event at each failing control. `reportValidity()` does the same, then shows the browser's message for a control whose event wasn't cancelled; both browsers focused the first such control. Submitting a form runs the interactive version: if anything is invalid, no `submit` event fires and nothing is sent. `novalidate` on the form, or `formnovalidate` on the button, skips that step.

To customise:

- **Your own rules:** `setCustomValidity("That name is taken")` makes the control invalid with that message. It stays set until you call `setCustomValidity("")`, so update it on every `input`.
- **Your own error UI:** listen for `invalid` in the capture phase, call `preventDefault()` to suppress the browser's bubble, and render `validationMessage` yourself.
- **Styling:** `:invalid` matches from page load, so empty required fields look wrong before anyone touches them. `:user-invalid` matches only after the user has changed and left the field, or tried to submit.

Native validation is a usability layer only; the server must still validate.

## Example

```html
<style>
  input:user-invalid { outline: 2px solid crimson; }
</style>
<form>
  <input id="email" type="email" required>
  <input id="user" required>
  <button>Join</button>
</form>
<script>
  console.log(email.matches(":invalid"), email.matches(":user-invalid")); // → true false
  email.value = "ab";
  console.log(email.validity.typeMismatch, email.validity.valueMissing); // → true false
  console.log(email.matches(":user-invalid")); // → false
  user.value = "ann";
  user.setCustomValidity("That name is taken");
  console.log(user.validity.customError, user.validationMessage); // → true That name is taken
  user.setCustomValidity("");
  console.log(user.validity.valid); // → true

  const form = document.querySelector("form");
  form.addEventListener("invalid", (e) => console.log("invalid:", e.target.id), true);
  console.log(form.checkValidity());
  // → invalid: email
  // → false
</script>
```

Chrome 155 and Firefox 158 logged the same. A script-set value never turns on `:user-invalid`.

## Pitfalls

- Setting `setCustomValidity()` once and never clearing it. The field stays invalid however the user edits it, and the form can't be submitted.
- Listening for `invalid` on the form without `capture: true`. The event doesn't bubble.
- Styling `:invalid`. Every empty required field is red on load; use `:user-invalid`.
- Writing `pattern` as if it were an old-style regular expression. It is compiled with the `v` flag and anchored, so `[\w-]+` is a syntax error and the pattern is ignored.

## Follow-ups

**Q:** Why doesn't setting `value` longer than `maxlength` from script make the field invalid?
**A:** `tooLong` and `tooShort` apply only when the value was last changed by a user edit. After `max.value = "abcdef"` on a `maxlength="3"` input, `tooLong` was `false` in both browsers.

**Q:** Do disabled fields block submission?
**A:** No. They are barred from constraint validation (`willValidate` is `false`) and left out of the submitted data. Some flags are still computed: a disabled field failing its `pattern` reported `patternMismatch: true` and didn't match `:invalid`. `required` needs a mutable field, so it never flags one.

**Q:** What is `validationMessage`?
**A:** The text the browser would show: your custom message if one is set, otherwise the browser's own localised string. For an empty required field, Chrome 155 returned "Please fill in this field." and Firefox 158 "Please fill out this field."

## Deep dive

### How it works

The standard defines two procedures. **Statically validating** a form collects its candidate controls in tree order, keeps those that fail their constraints, and fires `invalid` at each one; controls whose event is not cancelled are "unhandled". `checkValidity()` stops there. **Interactively validating** also reports the problem for at least one unhandled control, and the browser may focus and scroll to it. `reportValidity()` and form submission use this one.

`:user-invalid` depends on a per-control *user validity* flag. It starts false and becomes true when the user commits a change (the `change` event), when focus leaves a field whose value the user changed, when a `<select>`'s selection changes, and for every control in the form when submission is attempted. Resetting the form sets it back to false. The selector matches a candidate control with user validity true that fails its constraints.

The `pattern` attribute is compiled twice: once on its own with the `v` flag, to reject patterns that are only valid inside the wrapper, and then as `^(?:pattern)$`. If the first compile fails, the control has no pattern constraint at all:

```html
<input id="code" pattern="[0-9]{3}" value="1234">
<input id="slug" pattern="[\w-]+" value="a b">
<script>
  console.log(code.validity.patternMismatch); // → true
  console.log(slug.validity.patternMismatch); // → false
</script>
```

`1234` fails because the pattern is anchored. `[\w-]` is invalid in `v` mode, where `-` in a class must be escaped (`[\w\-]`). Chrome 155 and Firefox 158 both logged an "invalid regular expression" error and treated the field as matching.

### Edge cases

- **All `invalid` events cancelled.** Submission is still blocked, but the browser has nothing to report, so it doesn't move focus. In both browsers focus stayed on the clicked button; your handler must focus the first invalid field.
- **`required` on radio buttons** applies to the whole group: one checked radio in the group satisfies every member.
- **`setCustomValidity()` normalises newlines** in the message, and the empty string is the only way to clear it.
- **Custom elements** take part through `ElementInternals.setValidity()`, which sets the same flags.

### Real-world scenario

A sign-up form keeps the browser's rules and replaces only the presentation:

```js
form.addEventListener("invalid", (event) => {
  event.preventDefault();
  showError(event.target, event.target.validationMessage);
}, true);

form.addEventListener("submit", () => clearErrors());

username.addEventListener("input", async () => {
  username.setCustomValidity(await isTaken(username.value) ? "That name is taken" : "");
});
```

The capture listener sees every failing control. `showError` and `clearErrors` are your own rendering; how to associate the message with the field for assistive technology belongs to the accessibility topic. An asynchronous check can resolve after the user has typed again, so production code should ignore stale responses.

### Trade-offs

The browser's bubble costs nothing, is localised, and appears at the right moment, but it can't be styled and its wording differs between engines. Custom UI gives full control but makes you own focus management and timing. `novalidate` turns off the automatic check on submit while keeping the whole API, which suits forms that call `reportValidity()` or run their own checks before sending with `fetch`.

## Exercises

### Does this form submit?

```html
<form action="/s">
  <input name="a" required disabled>
  <input name="b" maxlength="2">
  <button>Go</button>
</form>
<script>document.querySelector("[name=b]").value = "toolong";</script>
```

**Answer:** Yes: `GET /s?b=toolong`. The disabled field is barred from validation and isn't sent, and `maxlength` doesn't flag a value set by script.
