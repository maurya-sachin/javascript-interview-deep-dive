---
title: "How do landmarks and headings structure a page now that the outline algorithm is gone?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [landmarks, headings, document-outline, sectioning, hgroup, accessibility-tree]
related:
  - html-and-css/documents-and-semantics/semantic-elements
  - html-and-css/documents-and-semantics/content-model-and-parser-repair
verified: 2026-10
perishable:
  - headingoffset and :heading unsupported in Chrome 155 and Firefox 158
  - Chrome 155 accessibility tree roles in the example
sources:
  - https://html.spec.whatwg.org/multipage/sections.html#headings-and-outlines
  - https://html.spec.whatwg.org/multipage/sections.html#attr-headingoffset
  - https://html.spec.whatwg.org/multipage/sections.html#the-hgroup-element
  - https://html.spec.whatwg.org/multipage/grouping-content.html#the-search-element
  - https://html.spec.whatwg.org/multipage/grouping-content.html#the-main-element
  - https://html.spec.whatwg.org/multipage/rendering.html#sections-and-headings
  - https://github.com/whatwg/html/pull/7829
  - https://www.w3.org/TR/html-aria/#el-header
  - https://www.w3.org/TR/html-aria/#el-section
  - https://www.w3.org/TR/html-aria/#el-form
tldr: >
  Two separate structures. Landmarks (`header`, `nav`, `main`, `aside`, `footer`, `search`, named
  `section` and `form`) are regions users jump between. Headings form the outline, and since 2022
  the outline is simply every `h1`–`h6` in tree order at its own level: nesting `section`s never
  demotes an `h1`. Use one `h1` and don't skip levels.
---

## Answer

A page has two navigable structures, and screen reader users use both.

**Landmarks** are regions. Elements map to landmark roles (per *ARIA in HTML*): `header` → `banner` and `footer` → `contentinfo` when they're not inside `article`, `aside`, `main`, `nav` or `section`; `nav` → `navigation`; `main` → `main`; `aside` → `complementary`; `search` → `search`. A `section` or `form` becomes a `region` or `form` landmark only with an accessible name. When a page has two landmarks of the same type, such as primary and pagination `nav`, give each an `aria-label` so the list of landmarks can tell them apart.

**Headings** are the outline. HTML once specified an *outline algorithm* in which sectioning elements created nesting, so an `h1` inside a `section` counted as a level-2 heading. Browsers never implemented it for assistive technology, and in July 2022 WHATWG replaced it (PR #7829). Now the standard defines the outline as "all headings in a document, in tree order", each at its own level: `h2` is level 2 wherever it sits. The rules are that at least one heading should be level 1, and that each heading may go at most one level deeper than the one before it (`h2` → `h4` is non-conforming).

So in practice:

- One `h1` for the page topic, then `h2`, `h3`… following the structure.
- Sectioning elements group content and can give landmarks; they don't change heading levels.
- `hgroup` wraps a heading with subtitle paragraphs; only the heading enters the outline.

The standard now also defines `headingoffset` and `headingreset` attributes and a `:heading` pseudo-class for components that can't know their depth. `CSS.supports("selector(:heading)")` returned `false` in Chrome 155 and Firefox 158, and Chrome still exposed an `h1` inside `headingoffset="1"` as level 1, so don't rely on them yet.

## Example

```html
<!-- Roles and levels from Chrome 155's accessibility tree -->
<body>
  <header>                                   <!-- → banner -->
    <nav aria-label="Primary">…</nav>        <!-- → navigation "Primary" -->
    <search>…</search>                       <!-- → search -->
  </header>
  <main>                                     <!-- → main -->
    <hgroup>                                 <!-- → group -->
      <h1>Install</h1>                       <!-- → heading "Install" level=1 -->
      <p>Five minutes</p>                    <!-- → paragraph -->
    </hgroup>
    <section aria-labelledby="req">          <!-- → region "Requirements" -->
      <h2 id="req">Requirements</h2>         <!-- → heading "Requirements" level=2 -->
    </section>
    <section>                                <!-- → generic -->
      <h2>Steps</h2>                         <!-- → heading "Steps" level=2 -->
    </section>
    <form aria-label="Feedback">…</form>     <!-- → form "Feedback" -->
  </main>
  <aside>…</aside>                           <!-- → complementary -->
  <nav aria-label="Pagination">…</nav>       <!-- → navigation "Pagination" -->
  <footer>© Docs</footer>                    <!-- → contentinfo -->
</body>
```

## Pitfalls

- Using `<h1>` in every `section` and relying on nesting. Chrome 155 exposed all of them as level 1, and Chrome 155 and Firefox 158 both rendered a `section h1` at the same 32px as a top-level one.
- Skipping levels for visual size (`h2` straight to `h4`). It's non-conforming; size headings with CSS.
- Two unnamed `nav` elements. Both are announced as "navigation" with nothing to tell them apart.
- Expecting `<section>` alone to create a landmark. Without `aria-label` or `aria-labelledby` it is `generic`.

## Follow-ups

**Q:** Should there be only one `<main>`?
**A:** A document must not have more than one `main` without the `hidden` attribute. Its ancestors may only be `html`, `body`, `div`, an unnamed `form` and autonomous custom elements, so never inside `article`, `aside` or `nav`.

**Q:** Is `role="banner"` on `<header>` needed?
**A:** No. *ARIA in HTML* calls redundant roles "not recommended"; a `header` scoped to `body` is already `banner`. Add a role only when the element can't express it.

## Exercises

### What heading levels does Chrome expose?

```html
<h1>Guide</h1>
<section>
  <h1>Setup</h1>
  <article><h1>Linux</h1></article>
</section>
```

**Answer:** Level 1 for all three. The outline uses each element's own level, so nesting doesn't demote them; Chrome 155's accessibility tree showed `heading "Guide" level=1`, `heading "Setup" level=1` and `heading "Linux" level=1`. Use `h2` and `h3` instead.
