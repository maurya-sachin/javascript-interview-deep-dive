---
title: "How do input types, `inputmode`, and `autocomplete` shape what the user gets?"
status: draft
difficulty: easy
frequency: 3
core: false
tags: [forms, input-types, inputmode, autocomplete, autofill, enterkeyhint]
related:
  - html-and-css/forms-dialog-popover/constraint-validation
  - html-and-css/forms-dialog-popover/form-submission
verified: 2026-10
perishable:
  - Chrome drops letters typed into type=number; Firefox keeps them
sources:
  - https://html.spec.whatwg.org/multipage/input.html#attr-input-type
  - https://html.spec.whatwg.org/multipage/input.html#value-sanitization-algorithm
  - https://html.spec.whatwg.org/multipage/input.html#number-state-(type=number)
  - https://html.spec.whatwg.org/multipage/input.html#e-mail-state-(type=email)
  - https://html.spec.whatwg.org/multipage/input.html#telephone-state-(type=tel)
  - https://html.spec.whatwg.org/multipage/interaction.html#attr-inputmode
  - https://html.spec.whatwg.org/multipage/interaction.html#attr-enterkeyhint
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill-detail-tokens
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fe-autocomplete-off
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fe-autocomplete-new-password
  - https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
tldr: >
  `type` defines the data: its validation, how `value` is sanitised, the widget, and the default
  keyboard. `inputmode` only picks the virtual keyboard and validates nothing. `autocomplete` names
  the value for autofill (`email`, `postal-code`, `cc-number`, `new-password`). A card number is
  `type="text" inputmode="numeric" autocomplete="cc-number"`, not `type="number"`.
---

## Answer

Three attributes, three different jobs.

**`type` says what the data is.** Each type has a *value sanitisation algorithm* and its own checks. `email` and `url` flag malformed values as a type mismatch; `number` keeps `value` only if it's a valid floating-point number, otherwise it becomes `""`; `email` strips surrounding whitespace. Types such as `date`, `time` and `color` get native pickers. `tel` and `search` behave like `text`: `tel` has no format check, because phone formats vary. An unknown type falls back to `text`.

Choose `number` only for quantities. The standard's test is whether up and down arrows would make sense; for card numbers or postal codes they don't, so use `text`.

**`inputmode` picks the virtual keyboard, nothing else.** Values: `none`, `text`, `decimal`, `numeric`, `tel`, `email`, `url`, `search`. It doesn't validate or sanitise. It's how a text field for digits-only identifiers gets a number pad: `inputmode="numeric"`, with `pattern="[0-9]*"` if you also want validation. Its sibling **`enterkeyhint`** labels the Enter key: `enter`, `done`, `go`, `next`, `previous`, `search`, `send`.

**`autocomplete` tells autofill which value belongs here.** It's a token list: an optional `section-*` group, an optional `shipping` or `billing`, then a field name such as `name`, `email`, `tel`, `street-address`, `postal-code`, `cc-number`, `username`, `current-password`, `new-password` or `one-time-code`. A trailing `webauthn` asks the browser to offer saved passkeys (WebAuthn credentials) for the field. Exact tokens let autofill fill related fields together and tell sign-in fields from sign-up ones. `off` marks a value as sensitive or never reused. Without the attribute, a control takes its form's `on` or `off` state.

## Example

```html
<input id="n" type="number">
<input id="e" type="email">
<input id="x" type="currency">
<input id="t" type="tel">
<input id="c" inputmode="numeric" pattern="[0-9]*" autocomplete="cc-number">
<script>
  n.value = "12abc";
  console.log(JSON.stringify(n.value)); // → ""
  n.value = "1e3";
  console.log(n.value, n.valueAsNumber); // → 1e3 1000
  e.value = "  a@b.co ";
  console.log(JSON.stringify(e.value)); // → "a@b.co"
  console.log(x.type, x.getAttribute("type")); // → text currency
  t.value = "not a phone";
  console.log(t.validity.valid); // → true
  c.value = "4242 4242";
  console.log(c.value, c.validity.patternMismatch); // → 4242 4242 true
</script>
```

Chrome 155 and Firefox 158 logged the same lines. `inputmode` left `c.value` untouched; only `pattern` caught the space.

## Pitfalls

- Using `type="number"` for card numbers, postal codes or one-time codes. It accepts `1e3`, offers a spinner, and `valueAsNumber` turns `"02134"` into `2134`.
- Expecting `inputmode` to restrict input. It changes only the keyboard; `pattern` or script has to validate.
- Reading `value` to see what the user typed in a number field. When the text isn't a number, `value` is `""`; check `validity.badInput`. Firefox 158 kept typed letters and set `badInput`; Chrome 155 dropped the letters as they were typed.
- Inventing tokens such as `autocomplete="nope"`. The IDL `autocomplete` property returned `""` for it in both browsers, so the browser treats it as no valid value; use `off` or a real field name.

## Follow-ups

**Q:** Why does `type="email"` accept `a@b`?
**A:** The standard's "valid email address" grammar requires an `@` with text on both sides, but the domain needs no dot, so intranet addresses pass. `a@b` was valid in both browsers and `ab` was a type mismatch. Real checks belong on the server.

**Q:** Why separate `new-password` from `current-password`?
**A:** The standard defines `current-password` as the password for the account in the username field, as when logging in, and `new-password` as one being created or changed. A password manager can then fill a saved password into one and not the other. A change-password form uses both.

**Q:** What does `autocomplete` on `<form>` do?
**A:** It sets the default for controls that have no `autocomplete` of their own. The control's IDL property still reflects only its own attribute: an input inside `<form autocomplete="off">` reported `""` in both browsers.

## Exercises

### What does each line log?

```js
// <input id="a" type="number" value="1,5">
// <input id="b" autocomplete="Shipping Postal-Code">
console.log(JSON.stringify(a.value));
console.log(b.autocomplete);
```

**Answer:** `""` and `shipping postal-code`. `1,5` isn't a valid floating-point number (the decimal separator is always `.`), so sanitisation empties it; the IDL property returns the valid tokens lower-cased. Chrome 155 and Firefox 158 logged the same; Chrome also warned that the value couldn't be parsed.
