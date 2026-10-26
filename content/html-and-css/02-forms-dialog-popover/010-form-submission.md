---
title: "What happens when a form is submitted — what is sent, and how?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [forms, form-submission, formdata, enctype, implicit-submission, requestsubmit]
related:
  - html-and-css/forms-dialog-popover/button-types-and-form-owner
  - html-and-css/forms-dialog-popover/constraint-validation
  - html-and-css/forms-dialog-popover/dialog-element
verified: 2026-10
sources:
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#form-submission-algorithm
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constructing-the-form-data-set
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fs-method
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fs-enctype
  - https://html.spec.whatwg.org/multipage/input.html#attr-input-readonly
  - https://html.spec.whatwg.org/multipage/forms.html#dom-form-submit
  - https://html.spec.whatwg.org/multipage/forms.html#dom-form-requestsubmit
  - https://url.spec.whatwg.org/#concept-urlencoded-serializer
  - https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData#browser_compatibility
tldr: >
  The browser validates the controls, fires a cancelable `submit` event, then builds the entry list:
  named, enabled controls in tree order, only checked checkboxes and radios, and only the button that
  submitted. GET puts it in the URL query; POST encodes it as the body per `enctype`. Then it
  navigates to `action`. `submit()` skips validation and the event; `requestSubmit()` doesn't.
---

## Answer

Submission is one algorithm in the HTML standard, run in a fixed order:

1. **A trigger and a submitter.** Clicking a submit button, pressing Enter in a text field (implicit submission), `form.requestSubmit(button)`, or `form.submit()`. The button that caused it is the *submitter*; with no button, it's the form itself.
2. **Validation.** Unless the form has `novalidate` or the submitter has `formnovalidate`, the browser checks the constraints. If any control is invalid it reports it and stops.
3. **The `submit` event.** It bubbles, is cancelable, and carries `event.submitter`. `preventDefault()` here is how script takes over.
4. **The entry list.** Every submittable element owned by the form, in tree order, except controls that are disabled, have no `name` (or an empty one), are unchecked checkboxes or radios, or are buttons other than the submitter. A checkbox with no `value` sends `on`; a `select` sends each selected option. A `formdata` event then lets script add entries.
5. **Encoding.** `method` defaults to GET: the entries are serialised as `application/x-www-form-urlencoded` and *replace* the query of `action`. POST sends them as the body, encoded by `enctype`: `application/x-www-form-urlencoded` (default), `multipart/form-data`, or `text/plain`. Only multipart sends file contents; the other two send just the file name. `method="dialog"` sends nothing and closes the enclosing `<dialog>`.
6. **Navigation.** The browser navigates `target` (default: this page) to `action`, which defaults to the document's URL. The page is replaced by the response.

`form.submit()` runs only steps 4–6: no validation and no `submit` event, so your handlers don't run. `form.requestSubmit(submitter)` runs everything, exactly like a click, and throws a `TypeError` if the argument isn't a submit button. Use `requestSubmit()` when script needs to submit.

## Example

```html
<form action="/search">
  <input name="q" value="cats & dogs">
  <input name="note" value="x" disabled>
  <input value="no name">
  <input type="checkbox" name="safe" checked>
  <input type="checkbox" name="images">
  <select name="sort"><option>new<option selected>top</select>
  <button name="view" value="list">List</button>
  <button name="view" value="grid">Grid</button>
</form>

<!-- Clicking Grid requested: -->
<!-- → GET /search?q=cats+%26+dogs&safe=on&sort=top&view=grid -->
```

Chrome 155 and Firefox 158 sent the same request to a local server. The disabled field, the nameless field, the unchecked box and the List button are not in it.

## Pitfalls

- Calling `form.submit()` and expecting `submit` listeners or validation to run. Neither does; use `requestSubmit()`.
- Building data with `new FormData(form)` inside a `submit` handler and losing the clicked button's `name`/`value`. Pass it: `new FormData(form, event.submitter)`.
- Putting parameters in a GET form's `action` (`/search?lang=en`). The form's entries replace the whole query, so `lang` is not sent.
- Uploading a file without `enctype="multipart/form-data"`. The default encoding sends only the file's name.

## Follow-ups

**Q:** Why do disabled fields disappear from the submission, and what keeps them?
**A:** The entry list skips disabled controls by definition. To show a value the user can't edit but still submit it, use `readonly` on inputs and textareas; it doesn't apply to `select` or checkboxes, so pair those with a hidden input.

**Q:** When does pressing Enter submit a form?
**A:** In a field such as text, email or number, Enter clicks the form's *default button*: its first submit button in tree order. If that button is disabled, nothing happens. With no submit button, the form submits only if it has at most one such field.

**Q:** What is `text/plain` encoding for?
**A:** Little. It writes `name=value` lines with no escaping, so a name containing `=` or a value containing a line break can't be parsed back reliably. The standard itself says it's meant for humans to read.

## Deep dive

### How it works

The standard's "submit" algorithm guards against re-entry with two flags. *Firing submission events* stops a `submit` listener that calls `requestSubmit()` from starting a second submission; *constructing entry list* does the same for a `formdata` listener. Before validating, the algorithm marks every control's *user validity* true. That is what makes `:user-invalid` start matching after a failed submit (see the constraint validation question).

After the events, the browser checks again whether the form can still navigate, because a listener may have removed it from the document. It then picks a behaviour from a table of URL scheme × method: for `http(s)`, GET mutates the action URL and POST submits an entity body; for `mailto:`, the entries become headers or a `body=` parameter.

The navigation is *planned*: it's queued as a task, and a second submission of the same form before that task runs removes the first one. So two `requestSubmit()` calls in the same task produce one request, carrying the second call's data; both browsers did this.

`submit()` and `requestSubmit()` differ only in the first branch:

```js
// <form id="f" action="/s"><input name="email" type="email" required>
// <button name="act" value="save">Save</button></form>
f.addEventListener("submit", (e) => console.log("submit", e.submitter.value));
f.addEventListener("formdata", (e) => console.log("formdata", [...e.formData].join(" ")));

f.requestSubmit(); // the empty required field fails validation: nothing logged, no request
f.submit();
// → formdata email,
// The browser then requested /s?email= — no submit event, no validation.
```

Chrome 155 and Firefox 158 logged the same.

### Edge cases

- **Implicit submission with no button.** The standard counts the fields that *block* implicit submission (text, search, tel, URL, email, password, the date and time types, number). One such field: Enter submits with `event.submitter` set to `null`. Two or more: nothing happens. Both browsers matched this.
- **Image buttons** send their click coordinates as `name.x` and `name.y`.
- **An empty file input** in a multipart form still sends a part, with `filename=""` and type `application/octet-stream`.
- **`<input type="hidden" name="_charset_">`** is sent with the encoding's name as its value.
- **Line breaks** in names and values are normalised to CRLF before encoding.
- **`accept-charset`** picks the encoding; without it, the document's encoding is used.

### Real-world scenario

Progressive enhancement keeps the form working without script and upgrades it with `fetch`:

```js
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form, event.submitter);
  await fetch(form.action, { method: form.method, body: new URLSearchParams(data) });
});
```

`form.action` is the resolved absolute URL and `form.method` is the lower-cased state (`"post"`). Passing a `FormData` as the body sends `multipart/form-data`, not what a plain POST form sends; wrapping it in `URLSearchParams` sent `application/x-www-form-urlencoded;charset=UTF-8` in both browsers. The `submitter` argument to `FormData` shipped in Chrome 112, Firefox 111 and Safari 16.4.

### Trade-offs

GET submissions put the data in the URL: shareable, bookmarkable and cacheable, but visible in history, server logs and the `Referer` of the next page. Use it for searches and filters. POST keeps data out of the URL and is the method for anything that changes state. `multipart/form-data` costs a boundary and headers per field, so use it only when you upload files.

## Exercises

### What is sent?

```html
<form action="/s">
  <input type="checkbox" name="opt">
  <input type="checkbox" name="tos" checked>
  <input name="q" value="a+b">
  <button>Go</button>
</form>
```

**Answer:** `GET /s?tos=on&q=a%2Bb`. The unchecked `opt` is skipped, `tos` has no `value` so it sends `on`, the `+` is percent-encoded, and the button has no `name`, so it adds nothing.
