---
title: "Why use semantic HTML, and when is a `div` the right element?"
status: draft
difficulty: easy
frequency: 5
core: true
tags: [semantic-html, accessibility-tree, implicit-roles, div, span, aria]
related:
  - html-and-css/documents-and-semantics/landmarks-and-headings
  - html-and-css/documents-and-semantics/content-model-and-parser-repair
  - html-and-css/forms-dialog-popover/button-types-and-form-owner
verified: 2026-10
perishable:
  - Chrome 155 maps a scoped header to sectionheader
  - ARIA in HTML lists generic for a scoped header
sources:
  - https://html.spec.whatwg.org/multipage/dom.html#semantics-2
  - https://html.spec.whatwg.org/multipage/grouping-content.html#the-div-element
  - https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-span-element
  - https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-b-element
  - https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-i-element
  - https://www.w3.org/TR/html-aria/#docconformance
  - https://www.w3.org/TR/html-aria/#el-section
  - https://www.w3.org/TR/html-aria/#el-header
  - https://w3c.github.io/html-aam/#el-header
tldr: >
  A semantic element says what content is (`nav`, `button`, `article`, `h2`), and that meaning
  reaches browsers, assistive technology and search engines without extra code: an implicit ARIA
  role, plus behaviour such as focus, keyboard activation and form submission. A `div` means nothing;
  use it for layout wrappers and styling hooks, when no element with a meaning fits.
---

## Answer

HTML elements carry **semantics**: the standard defines what each one represents. `<ol>` is an ordered list, `<nav>` is a block of navigation links, `<button>` is a control that does something. Any program that reads the page, not only the screen renderer, can use that meaning. The standard's own examples are speech browsers that read headings in a different voice and let users jump between them, and search engines that use headings to index sections.

In practice semantics buy three things:

1. **The accessibility tree.** Browsers map elements to roles (the table is in *ARIA in HTML*): `nav` → `navigation`, `main` → `main`, `button` → `button`, `ul` → `list`. Screen readers announce the role and let users navigate by landmark, heading or list. `div` and `span` map to `generic`, which is announced as nothing.
2. **Built-in behaviour.** A `<button>` is focusable, activates on click and on the keyboard, can be `disabled`, and submits its form. A `<div class="btn">` has none of that until you write it, and the hand-made version usually misses something.
3. **Other consumers.** Reader modes, search engines and browser features like "jump to heading" read the same structure.

A `div` is right when there is no meaning to express. The HTML standard calls it "an element of last resort": a wrapper for flexbox or grid, a hook for a class, a group sharing a `lang` attribute, or a `dt`/`dd` group inside `<dl>`. `span` is the inline equivalent. Picking `section` or `article` for every layout box doesn't add meaning either; it adds noise.

`role="button"` on a `div` changes only what assistive technology is told. It doesn't add focus, keyboard handling or form behaviour, so the native element is the better tool.

## Example

```html
<!DOCTYPE html>
<form id="order">
  <button id="real">Save</button>
  <div id="fake" class="btn">Save</div>
</form>
<script>
  const real = document.getElementById("real");
  const fake = document.getElementById("fake");

  console.log(real.tabIndex, fake.tabIndex); // → 0 -1
  console.log(real.type, real.form.id); // → submit order
  console.log(document.forms.order.elements.length); // → 1

  let clicks = 0;
  real.addEventListener("click", () => clicks++);
  real.disabled = true;
  real.click();
  console.log(clicks, real.matches(":disabled")); // → 0 true
</script>
```

Chrome 155 and Firefox 158 printed the same. The `<button>` is in the tab order, belongs to the form as a submit button, and stops firing `click` when disabled. The `div` gets none of it. In Chrome's accessibility tree the first is `button "Save"`; the second is only the text `Save`.

## Pitfalls

- Adding `role="button"` and stopping there. In Chrome 155, a `div` with `role="button" tabindex="0"` was focusable, but Enter and Space did not fire its `click` handler; only the mouse did.
- Forgetting that `<button>` defaults to `type="submit"` inside a form. A "toggle" button without `type="button"` submits the form.
- Using a heading element for its size, or skipping one because it looks too big. Choose the level for the structure and size it with CSS.
- Wrapping every block in `section`. Without an accessible name it maps to `generic`, the same as a `div`.

## Follow-ups

**Q:** Is `<b>` or `<i>` non-semantic?
**A:** They have defined meanings in current HTML (`b` draws attention without importance; `i` marks an alternate voice such as a term), but they map to `generic`. `<strong>` (importance) and `<em>` (stress) are the elements with their own roles.

**Q:** Do semantic elements affect styling?
**A:** Only through the user-agent stylesheet (headings are bold, lists get markers). That's a default you override, never a reason to pick an element.

## Deep dive

### How it works

The pipeline has three layers. The HTML standard defines what an element *represents*. *ARIA in HTML* lists each element's **implicit ARIA role** and which explicit roles authors may set. The *HTML Accessibility API Mappings* (HTML-AAM) tells browsers how to expose each element to the platform accessibility API that screen readers query. The browser builds an accessibility tree in parallel with the DOM, skipping nodes that carry no meaning.

Here is a page as Chrome 155 exposed it (read with Puppeteer's accessibility snapshot, every node included):

```html
<header><a href="/">Shop</a></header>      <!-- → banner -->
<nav><a href="/orders">Orders</a></nav>   <!-- → navigation -->
<main>                                     <!-- → main -->
  <article>                                <!-- → article -->
    <header><h2>Order 42</h2></header>     <!-- → sectionheader -->
    <ul><li>Lamp</li></ul>                 <!-- → list -->
    <section><p>Shipped</p></section>      <!-- → generic -->
    <section aria-label="Returns">…</section> <!-- → region "Returns" -->
    <button type="button">Track</button>   <!-- → button "Track" -->
    <div class="btn">Cancel</div>          <!-- → generic -->
  </article>
</main>
<footer><p>Help</p></footer>               <!-- → contentinfo -->
```

With the default filter ("interesting" nodes only), the `generic` nodes disappeared and `Cancel` was just text inside `main`.

### Edge cases

- **Context changes the role.** A `header` or `footer` that is a child of `body` is the page `banner`/`contentinfo` landmark; inside `article`, `aside`, `main`, `nav` or `section` it isn't. *ARIA in HTML* lists `generic` for the scoped case, while the HTML-AAM editor's draft maps it to `sectionheader`, which is what Chrome 155 exposed. The two specs disagree today.
- **`section` needs a name.** It is a `region` landmark only with an accessible name (`aria-label`, `aria-labelledby`); otherwise `generic`.
- **`a` needs `href`.** `<a>` without `href` is `generic` and not focusable; with `href` it is a `link`.
- **Explicit roles override implicit ones.** `<ul role="tablist">` is allowed, and the list semantics are replaced. *ARIA in HTML* says which overrides are allowed and warns against redundant ones such as `<nav role="navigation">`.

### Real-world scenario

A design system ships `<div class="btn" onClick={save}>`. An audit finds it can't be reached by Tab, isn't announced as a button, ignores Enter and Space, can't be disabled, and doesn't submit the surrounding form. Fixing it by hand means `role="button"`, `tabindex="0"`, a `keydown` handler for Enter and Space, `aria-disabled` plus guards in the handler, and form submission code. Replacing it with `<button type="button">` and resetting its styles (`appearance`, `border`, `background`, `font: inherit`) gets every one of those for free and keeps them correct across browsers.

### Trade-offs

| Choose | When |
|---|---|
| A semantic element | The content has a meaning HTML names: navigation, a list, a heading, a control, a self-contained article |
| `div` / `span` | Pure layout or styling: grid and flex wrappers, a `class` hook, grouping for `lang` |
| ARIA on a `div` | Only for a widget HTML has no element for (a tree, a grid), and then you own focus and keyboard behaviour |

The cost of semantics is small: you learn the element's defaults (a `button`'s `submit` type, a heading's margins) and override them. The cost of `div` everywhere is rebuilding behaviour the browser already has, and leaving assistive technology with nothing to announce.

## Exercises

### Which elements here are landmarks?

```html
<body>
  <header>Logo</header>
  <main>
    <section><h2>News</h2></section>
    <aside>Related</aside>
  </main>
</body>
```

**Answer:** `header` (`banner`, as a child of `body`), `main` (`main`) and `aside` (`complementary`). The `section` has no accessible name, so it is `generic`, not a `region` landmark. Chrome 155's accessibility tree showed `banner`, `main` and `complementary`, and `generic` for the `section`.
