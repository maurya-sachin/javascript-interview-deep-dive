---
title: "What belongs in `<head>`, and what do `charset`, `viewport`, and `<base>` change?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [head, meta-charset, viewport-meta, base-element, title, metadata]
related:
  - html-and-css/documents-and-semantics/doctype-and-rendering-modes
  - html-and-css/documents-and-semantics/link-types
  - html-and-css/responsive-design/viewport-units
  - html-and-css/typography-colour-motion/dark-mode-color-scheme
verified: 2026-10
perishable:
  - Chrome 155's 980px layout viewport without a viewport tag
  - windows-1252 fallback observed for an en-US profile
sources:
  - https://html.spec.whatwg.org/multipage/semantics.html#the-head-element
  - https://html.spec.whatwg.org/multipage/semantics.html#the-title-element
  - https://html.spec.whatwg.org/multipage/semantics.html#the-base-element
  - https://html.spec.whatwg.org/multipage/semantics.html#charset
  - https://html.spec.whatwg.org/multipage/semantics.html#standard-metadata-names
  - https://html.spec.whatwg.org/multipage/parsing.html#determining-the-character-encoding
  - https://html.spec.whatwg.org/multipage/parsing.html#changing-the-encoding-while-parsing
  - https://drafts.csswg.org/css-viewport/#viewport-meta
tldr: >
  `<head>` holds metadata only: exactly one `<title>`, at most one `<base>`, plus `meta`, `link`,
  `style` and `script`. `<meta charset="utf-8">` must sit in the first 1024 bytes so the encoding is
  known before text is decoded. The viewport tag makes mobile browsers lay out at device width
  instead of a desktop-sized fallback. `<base href>` changes how every relative URL resolves.
---

## Answer

`<head>`'s content model is **metadata content**: exactly one `<title>` (unless a higher-level protocol supplies one, as in `srcdoc`), at most one `<base>`, and any number of `meta`, `link`, `style`, `script`, `noscript` and `template`. The important pieces:

- **`<meta charset="utf-8">`** declares the encoding. The value must be UTF-8, and the element must be fully inside the first 1024 bytes, because browsers *prescan* those bytes before parsing. A charset in the HTTP `Content-Type` header or a byte-order mark wins over it. Without any declaration the browser guesses, and on an en-US profile both Chrome 155 and Firefox 158 decoded a UTF-8 `café` served over HTTP as `cafÃ©` (windows-1252).
- **`<meta name="viewport" content="width=device-width, initial-scale=1">`** is defined by CSS Viewport, not HTML. Mobile browsers otherwise lay out the page on a wide fallback viewport and zoom out; with the tag, the layout viewport matches the device width and media queries see the real size.
- **`<title>`** names the document in tabs, history, bookmarks and search results; Chrome's accessibility tree uses it as the page's name. `document.title` reads the first `<title>` in the document.
- **`<base href>`** sets the document base URL. *Every* relative URL resolves against it: links, images, `fetch`, and even `href="#id"`. Only the first `base` with `href` counts. `target` sets the default browsing context for links and forms.
- **`<meta name>`** carries named metadata: the standard ones include `description`, `referrer`, `theme-color`, `color-scheme`, `application-name` and `generator`; others such as `robots` are extensions defined outside the standard.

`link` elements (stylesheets, icons, `canonical`) also live here; their relations are their own topic.

The parser enforces "metadata only": the first non-metadata element (a `div`, text) closes `head`, and everything after it, including later `meta` tags, goes into `body`.

## Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Orders</title>
  <base href="https://shop.example/app/">
</head>
<body>
  <a id="next" href="orders?page=2">Next</a>
  <a id="top" href="#top">Top</a>
  <script>
    console.log(document.characterSet); // → UTF-8
    console.log(document.title); // → Orders
    console.log(document.getElementById("next").href);
    // → https://shop.example/app/orders?page=2
    console.log(document.getElementById("top").href);
    // → https://shop.example/app/#top
    console.log(document.baseURI === location.href); // → false
  </script>
</body>
</html>
```

Chrome 155 and Firefox 158 printed the same. The `#top` link now points at another page, so clicking it navigates away instead of scrolling.

## Pitfalls

- Adding `<base>` to a single-page app and breaking in-page links: `href="#top"` resolved to `https://shop.example/app/#top`.
- Leaving the encoding to the browser for an ASCII-only page. Over HTTP both browsers chose windows-1252, which later affects form submission and URL encoding of non-ASCII input; on `file:` Chrome chose windows-1252 and Firefox UTF-8.
- Putting a `<div>` or stray text in `<head>`. A `meta name="description"` after it ended up in `body`.
- Using `maximum-scale=1` or `user-scalable=no` to stop zoom. Where a browser honours it, users who need to zoom can't.

## Follow-ups

**Q:** What happens without the viewport tag?
**A:** In Chrome 155 with mobile emulation at 390px, `innerWidth` was `980` and `(max-width: 600px)` didn't match; with the tag, `390` and it matched. The fallback width is browser-defined, not specified.

**Q:** Is a `charset` after the first 1024 bytes ignored?
**A:** It is non-conforming, but both browsers still honoured one placed after 1,100 bytes, because the parser can change the encoding when it meets a declaration: it swaps decoders on the fly or reloads the page. Keep it first to avoid that.

## Exercises

### Which title and base URL win?

```html
<head>
  <title>First</title>
  <div>oops</div>
  <title>Second</title>
  <base href="https://a.example/">
  <base href="https://b.example/">
</head>
```

**Answer:** `document.title` is `First` and `document.baseURI` is `https://a.example/`. The `div` closes `head`, so the second `title` and both `base` elements land in `body`, but `document.title` takes the first `<title>` in the document and the first `base` with `href` still sets the base URL wherever it is. Chrome 155 and Firefox 158 printed the same.
