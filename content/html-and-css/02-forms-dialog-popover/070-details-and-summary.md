---
title: "How do `<details>` and `<summary>` work, including exclusive accordions?"
status: draft
difficulty: easy
frequency: 2
core: false
tags: [details, summary, accordion, disclosure, toggle-event]
related:
  - html-and-css/forms-dialog-popover/popover-attribute
  - html-and-css/documents-and-semantics/global-attributes
  - html-and-css/documents-and-semantics/semantic-elements
verified: 2026-10
perishable:
  - Find-in-page opens details in Chrome 97+, Firefox 148+; Safari partial
sources:
  - https://html.spec.whatwg.org/multipage/interactive-elements.html#the-details-element
  - https://html.spec.whatwg.org/multipage/interactive-elements.html#attr-details-name
  - https://html.spec.whatwg.org/multipage/interactive-elements.html#details-name-group
  - https://html.spec.whatwg.org/multipage/interactive-elements.html#ensure-details-exclusivity-by-closing-other-elements-if-needed
  - https://html.spec.whatwg.org/multipage/interactive-elements.html#the-summary-element
  - https://html.spec.whatwg.org/multipage/rendering.html#the-details-and-summary-elements
  - https://html.spec.whatwg.org/multipage/interaction.html#ancestor-revealing-algorithm
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::details-content#browser_compatibility
tldr: >
  `<details>` is a native disclosure widget: its first `<summary>` is the always-visible toggle, and
  the rest shows only while `open` is set. Clicking, Enter or Space on the summary toggles it and a
  non-bubbling `toggle` event follows. Giving several `<details>` the same `name` makes an exclusive
  accordion: opening one closes the others.
---

## Answer

`<details>` is a **disclosure widget** that works without script. Its first `<summary>` child is the label and toggle; everything else is the content, shown only while the boolean `open` attribute is present. Without a `<summary>`, the browser supplies its own label (the standard's example is "Details").

- The summary is focusable, and a click, Enter or Space on it toggles `open`. Script can do the same with `details.open = true`.
- Every change queues a `toggle` event with `oldState` and `newState`. It fires on the `<details>` and doesn't bubble, so delegate with a capture listener. Changes made in one task are coalesced into one event.
- The marker comes from CSS: the summary is `display: list-item` with `list-style-type: disclosure-closed` or `disclosure-open`, so `summary { list-style: none }` removes it and `::marker` styles it. The content sits in a slot hidden with `content-visibility: hidden`, which `::details-content` can style.
- Navigating to a fragment inside a closed `<details>` opens it, and so does find-in-page in browsers that support it (Chrome 97, Firefox 148; Safari partly).

**Exclusive accordions.** Give several `<details>` the same `name` and they form a *details name group*: opening one closes the others in the group. The browser enforces it everywhere: on user toggles, on `open = true` from script, and while parsing, where a second `open` member is closed. Closing the open one is allowed, so the group can be fully collapsed. Members only need the same `name` in the same tree; they don't have to be siblings.

Use `<details>` for show-more content, FAQs and filters. The standard rules it out for tabs and menus, which are different widgets.

## Example

```html
<section>
  <h2>FAQ</h2>
  <details name="faq" open>
    <summary>Shipping</summary>
    <p>Orders ship within two days.</p>
  </details>
  <details name="faq" open>
    <summary>Returns</summary>
    <p>Return anything within 30 days.</p>
  </details>
  <details name="faq">
    <summary>Warranty</summary>
    <p>Everything carries a one-year warranty.</p>
  </details>
</section>
<script>
  const items = [...document.querySelectorAll("details")];
  console.log(JSON.stringify(items.map((d) => d.open))); // → [true,false,false]
  addEventListener("load", () => {
    for (const d of items) {
      d.addEventListener("toggle", (e) => console.log(d.firstElementChild.textContent, e.newState));
    }
  });
  // Click "Warranty": → Warranty open
  //                   → Shipping closed
  // Click "Warranty": → Warranty closed
</script>
```

Chrome 155 and Firefox 158 logged the same. The parser closed the second `open` member, Returns, as soon as it was inserted.

## Pitfalls

- Expecting `toggle` to bubble to a container. It doesn't; listen on each `<details>` or use `addEventListener("toggle", fn, true)`.
- Expecting a parse-time `toggle` to mean something. A member opened and then closed during parsing fires `toggle` with `oldState` and `newState` both `"closed"`, because the two changes were coalesced.
- Adding a second `<summary>`. Only the first `summary` child is the toggle; any other is part of the content and hidden while closed.
- Using an exclusive group for content people compare. The standard warns that it forces opening items one at a time.

## Follow-ups

**Q:** How do you animate opening and closing?
**A:** Target the content with the `::details-content` pseudo-element (Chrome 131, Firefox 143, Safari 18.4) and transition it there. Without it, the content slot can't be selected at all. Animating to an automatic height is a CSS transitions question rather than a `<details>` one.

**Q:** Is the hidden content in the DOM and readable by script?
**A:** Yes. It's only skipped for rendering: `checkVisibility()` returned `false` for a paragraph in a closed `<details>` in both browsers, but `textContent` and `querySelector` see it as usual.

**Q:** `<details>` or `popover` for a dropdown?
**A:** `<details>` pushes content down in the flow and stays open until toggled. A popover floats in the top layer and light-dismisses, which suits menus and pickers.

## Exercises

### What does this log?

```html
<details id="a" name="g" open><summary>A</summary>…</details>
<details id="b" name="g"><summary>B</summary>…</details>
<details id="c" name="h" open><summary>C</summary>…</details>
<script>
  b.open = true;
  console.log(a.open, b.open, c.open);
</script>
```

**Answer:** `false true true`. Opening `b` closes `a`, synchronously, because they share the name `g`; `c` is in a different group. Chrome 155 and Firefox 158 logged the same.
