# 02 — Forms, dialog, and popover

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

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

- Form submission: the form data set, `method`, `enctype`, implicit submission, the submitter, `requestSubmit()` vs `submit()` → —
- Input types, `inputmode`, `autocomplete` tokens, `enterkeyhint` → —
- Button `type` default, the `form` attribute, `formaction`/`formmethod`/`formnovalidate` → —
- Constraint validation: `ValidityState`, `setCustomValidity()`, `reportValidity()`, `novalidate`, `:invalid` vs `:user-invalid` → —
- `<dialog>`: `show()` vs `showModal()`, `close()` and `returnValue`, `method="dialog"`, `cancel` event, `closedby` → —
- The `popover` attribute: `auto`/`manual`/`hint`, light dismiss, `popovertarget`, invoker commands → —
- `<details>` and `<summary>`, the `name` attribute for exclusive groups → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
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
