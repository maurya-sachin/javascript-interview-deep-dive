# 02 — Forms, dialog, and popover

> **Status:** 🔴 planned · **Published:** 0/7 · **Last verified:** —

The interactive parts of HTML that work without JavaScript: form submission and validation, button behaviour, and the `<dialog>`, `popover`, and `<details>` primitives.

## Learning goals

After this chapter you can:

- Trace what a form submission sends, from the form data set to the request
- Pick input types and attributes that give the right keyboard and autofill
- Use and customise native constraint validation instead of rebuilding it
- Open, close, and read the result of a modal and non-modal `<dialog>`
- Choose between `popover`, `<dialog>`, and `<details>` for a given UI

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Form submission: the form data set, `method`, `enctype`, implicit submission, the submitter, `requestSubmit()` vs `submit()` → 010
- Input types, `inputmode`, `autocomplete` tokens, `enterkeyhint` → 020
- Button `type` default, the `form` attribute, `formaction`/`formmethod`/`formnovalidate` → 030
- Constraint validation: `ValidityState`, `setCustomValidity()`, `reportValidity()`, `novalidate`, `:invalid` vs `:user-invalid` → 040
- `<dialog>`: `show()` vs `showModal()`, `close()` and `returnValue`, `method="dialog"`, `cancel` event, `closedby` → 050
- The `popover` attribute: `auto`/`manual`/`hint`, light dismiss, `popovertarget`, invoker commands → 060
- `<details>` and `<summary>`, the `name` attribute for exclusive groups → 070

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What happens when a form is submitted — what is sent, and how?](010-form-submission.md) | medium | 🟡 draft |
| 020 | [How do input types, `inputmode`, and `autocomplete` shape what the user gets?](020-input-types-and-autofill.md) | easy | 🟡 draft |
| 030 | [Why does a `<button>` inside a form submit it, and how do you control which form and action it uses?](030-button-types-and-form-owner.md) | easy | 🟡 draft |
| 040 | [How does native constraint validation work, and how do you customise it?](040-constraint-validation.md) | medium | 🟡 draft |
| 050 | [How does `<dialog>` work — `show()` vs `showModal()`, closing, and the return value?](050-dialog-element.md) | medium | 🟡 draft |
| 060 | [What does the `popover` attribute give you, and how is it different from `<dialog>`?](060-popover-attribute.md) | medium | 🔴 planned |
| 070 | [How do `<details>` and `<summary>` work, including exclusive accordions?](070-details-and-summary.md) | easy | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [HTML — Form submission](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#form-submission-2)
- [HTML — The `input` element](https://html.spec.whatwg.org/multipage/input.html#the-input-element)
- [HTML — Autofill](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill)
- [HTML — Constraints](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constraints)
- [HTML — The `button` element](https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element)
- [HTML — The `dialog` element](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element)
- [HTML — Popover](https://html.spec.whatwg.org/multipage/popover.html)
- [HTML — The `details` element](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-details-element)
