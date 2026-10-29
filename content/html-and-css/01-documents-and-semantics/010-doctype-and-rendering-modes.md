---
title: "What does `<!DOCTYPE html>` do, and what are quirks and standards modes?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [doctype, quirks-mode, compat-mode, html-parser, rendering-modes]
related:
  - html-and-css/documents-and-semantics/content-model-and-parser-repair
  - html-and-css/documents-and-semantics/head-metadata
  - html-and-css/box-model-and-formatting/line-boxes-and-vertical-align
verified: 2026-10
perishable:
  - Chrome 155 and Firefox 158 outputs in the example
sources:
  - https://html.spec.whatwg.org/multipage/syntax.html#the-doctype
  - https://html.spec.whatwg.org/multipage/parsing.html#the-initial-insertion-mode
  - https://dom.spec.whatwg.org/#concept-document-mode
  - https://dom.spec.whatwg.org/#dom-document-compatmode
  - https://quirks.spec.whatwg.org/#css
  - https://html.spec.whatwg.org/multipage/rendering.html#tables-2
  - https://drafts.csswg.org/selectors-4/#class-html
  - https://drafts.csswg.org/cssom-view/#dom-document-scrollingelement
tldr: >
  The doctype carries no version and loads no DTD; it only switches the parser out of quirks mode.
  Every document has a mode: no-quirks (standards), limited-quirks, or quirks. A missing or old
  doctype gives quirks mode, where CSS emulates pre-standard browsers: unitless lengths, hashless
  colours, percentage heights, case-insensitive class selectors. `<!DOCTYPE html>` first in the file
  gives no-quirks.
---

## Answer

`<!DOCTYPE html>` is not a version declaration and the browser never fetches a DTD. The HTML standard calls it a "required preamble" kept for legacy reasons: its only job is to choose the document's **mode**.

The DOM gives every document one of three modes, set by the parser's "initial" insertion mode when it sees the first token:

- **no-quirks** (standards mode): the doctype is `<!DOCTYPE html>` (any case), optionally with `SYSTEM "about:legacy-compat"`.
- **limited-quirks**: a few transitional doctypes, such as XHTML 1.0 Transitional. Only the line-height quirks apply, so an image alone in a table cell has no gap below it.
- **quirks**: no doctype, a doctype whose name isn't `html`, or one of 61 listed legacy identifiers (HTML 3.2, HTML 4.01 Transitional without a system identifier, and so on).

The doctype must come first. Comments and whitespace before it are fine; any text or element before it means the parser saw "anything else", which is a parse error and sets quirks mode.

What quirks mode changes is collected in the Quirks Mode Standard, plus a few rules in other specs:

- CSS accepts `width: 200` (unitless length) and `color: ff0000` (hashless hex).
- Percentage heights look past `auto`-height ancestors, and `body` stretches to fill the viewport.
- Tables reset inherited font properties (HTML's quirks-mode UA styles), and text decoration doesn't propagate into them.
- Class and ID selectors match case-insensitively (Selectors 4).
- `document.scrollingElement` is `body`, not `html` (CSSOM View).

You can read the mode from `document.compatMode`: `"BackCompat"` for quirks, `"CSS1Compat"` for both no-quirks and limited-quirks. Every new page should start with `<!DOCTYPE html>`; quirks mode exists so pages from the 1990s keep rendering as their authors saw them.

## Example

```html
<!-- No DOCTYPE, so the parser sets quirks mode -->
<style>
  .box { width: 200; height: 50%; }
  p { color: ff0000; }
</style>
<div class="box"></div>
<p class="Note">Hi</p>
<script>
  const box = getComputedStyle(document.querySelector(".box"));
  const p = document.querySelector("p");

  console.log(document.compatMode); // → BackCompat
  console.log(box.width, box.height); // → 200px 376px
  console.log(getComputedStyle(p).color); // → rgb(255, 0, 0)
  console.log(document.querySelectorAll(".note").length); // → 1
</script>
```

Run in Chrome 155 and Firefox 158 at 1024×768, both printed the same. Adding `<!DOCTYPE html>` as the first line changed the output to `CSS1Compat`, `1008px 0px`, `rgb(0, 0, 0)` and `0`: the unitless width and hashless colour are invalid and dropped, the percentage height resolves against an `auto` body, and `.note` no longer matches `Note`.

## Pitfalls

- Putting anything before the doctype. In both browsers, `x<!DOCTYPE html>` gave `BackCompat`; a leading comment did not.
- Treating `CSS1Compat` as proof of full standards mode. Limited-quirks reports it too, so an XHTML Transitional page still gets the table-cell image quirk.
- Copying an HTML 4.01 Transitional doctype. Without the system identifier (the URL) it is quirks mode; with it, limited-quirks.
- Expecting an `iframe srcdoc` document to need a doctype. The parser never sets quirks mode for it: `srcdoc="<p>no doctype here"` gave `CSS1Compat` in both browsers.

## Follow-ups

**Q:** Does the doctype affect how the HTML is parsed?
**A:** Barely. Tree construction is the same in all modes with one exception: in quirks mode a `<table>` start tag does not close an open `<p>`. The real differences are in CSS and a few DOM APIs.

**Q:** Why does limited-quirks mode exist?
**A:** Some browsers kept the old shrink-wrapping of images in table cells even in standards mode, and sites came to depend on it. Browsers that followed CSS strictly added a third mode keeping only that behaviour, per the Quirks Standard's history section.

## Exercises

### What does each line print?

```js
const mode = (html) =>
  new DOMParser().parseFromString(html, "text/html").compatMode;

console.log(mode("<!doctype HTML><p>x"));
console.log(mode("<!-- build 42 --><!DOCTYPE html><p>x"));
console.log(mode("x<!DOCTYPE html><p>x"));
console.log(mode('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'));
```

**Answer:** `CSS1Compat`, `CSS1Compat`, `BackCompat`, `CSS1Compat`. The doctype is case-insensitive and comments may precede it; text before it sets quirks mode; XHTML 1.0 Transitional is limited-quirks, which `compatMode` reports as `CSS1Compat`. Chrome 155 and Firefox 158 printed the same.
