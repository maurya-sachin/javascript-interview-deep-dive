---
title: "What do link types like `canonical`, `noopener`, and `nofollow` do?"
status: draft
difficulty: easy
frequency: 3
core: false
tags: [link-types, rel, noopener, noreferrer, canonical, nofollow]
related:
  - html-and-css/documents-and-semantics/head-metadata
  - html-and-css/documents-and-semantics/global-attributes
verified: 2026-10
perishable:
  - Chrome and Firefox disagree on relList.supports("canonical") for link
sources:
  - https://html.spec.whatwg.org/multipage/links.html#linkTypes
  - https://html.spec.whatwg.org/multipage/links.html#link-type-canonical
  - https://html.spec.whatwg.org/multipage/links.html#rel-alternate
  - https://html.spec.whatwg.org/multipage/links.html#rel-icon
  - https://html.spec.whatwg.org/multipage/links.html#link-type-nofollow
  - https://html.spec.whatwg.org/multipage/links.html#link-type-noopener
  - https://html.spec.whatwg.org/multipage/links.html#link-type-noreferrer
  - https://html.spec.whatwg.org/multipage/links.html#link-type-opener
  - https://html.spec.whatwg.org/multipage/links.html#get-an-element's-noopener
  - https://www.rfc-editor.org/rfc/rfc6596
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a#browser_compatibility
tldr: >
  `rel` says how the linked resource relates to this page. Some values fetch something
  (`stylesheet`, `icon`); others only describe the link: `canonical` names the preferred URL,
  `alternate` points to feeds or translations, `nofollow` tells search engines it isn't endorsed.
  `noopener` and `noreferrer` change navigation: no `window.opener`, and for `noreferrer` no
  `Referer`. `target="_blank"` already implies `noopener`.
---

## Answer

`rel` takes a space-separated set of **link types**. The HTML standard sorts them into kinds:

- **External resources** that the browser fetches and uses: `stylesheet`, `icon`, `manifest`, and the resource hints (`preload`, `preconnect`, covered under performance).
- **Hyperlinks** that describe another document without fetching it: `canonical`, `alternate`, `next`, `license`.
- **Annotations** on a link that `a`, `area` or `form` creates: `nofollow`, `noopener`, `noreferrer`, `opener`.

The ones interviewers ask about:

- **`canonical`** (`<link>` only): the preferred URL for this content, so search engines can merge duplicates such as `?utm_source=` variants (RFC 6596). The standard gives browsers nothing to do with it.
- **`alternate`**: with `type="application/atom+xml"` or `rss+xml`, a feed for autodiscovery; with `hreflang`, a translation; with `stylesheet`, an alternative stylesheet.
- **`icon`**: the favicon. With several, the browser picks by `type`, `media` and `sizes`; with none, it may request `/favicon.ico`.
- **`nofollow`**: the author doesn't endorse the link, or it exists because of a commercial relationship. It changes nothing in the browser; search engines read it.
- **`noopener`**: a new top-level tab opened by the link gets no `window.opener`, so it can't navigate or script the page that opened it.
- **`noreferrer`**: no `Referer` header and an empty `document.referrer`, and it also implies `noopener`.
- **`opener`**: the opt-out. It restores `window.opener`.

The standard's "get an element's noopener" step returns true when `rel` contains `noopener` or `noreferrer`, *or* when `target` is `_blank` and `rel` lacks `opener`. So `target="_blank"` is already safe from reverse tabnabbing (the opened page redirecting its opener to a phishing page); adding `rel="noopener"` is harmless and covers browsers older than Chrome 88, Firefox 79 and Safari 12.1, which made `_blank` imply it.

## Example

```html
<!-- links.html, served from http://localhost:8765/ -->
<a href="report.html" target="_blank">Plain</a>
<a href="report.html" target="_blank" rel="opener">Opener</a>
<a href="report.html" target="_blank" rel="noopener">Noopener</a>
<a href="report.html" target="_blank" rel="noreferrer">Noreferrer</a>
<script>
  new BroadcastChannel("tabs").onmessage = (event) => console.log(event.data);
</script>

<!-- report.html -->
<script>
  const ref = document.referrer || "(none)";
  new BroadcastChannel("tabs").postMessage(`opener: ${opener !== null}, referrer: ${ref}`);
</script>

<!-- Clicking the four links in order logged: -->
<!-- → opener: false, referrer: http://localhost:8765/links.html -->
<!-- → opener: true, referrer: http://localhost:8765/links.html -->
<!-- → opener: false, referrer: http://localhost:8765/links.html -->
<!-- → opener: false, referrer: (none) -->
```

Chrome 155 and Firefox 158 logged the same lines. The referrer is the full URL here because the pages are same-origin; cross-origin, both browsers sent only the origin (`Referer: http://localhost:8765/`).

## Pitfalls

- Thinking `rel="noopener"` is still required on every `target="_blank"` link. Current browsers imply it; `window.opener` was `null` for the plain link.
- Using `noreferrer` when you only want `noopener`. It also sends no `Referer`, so the destination can't see where the visit came from.
- Putting `canonical` on `<a>`. It is allowed only on `<link>`.
- Expecting `nofollow` to stop crawling or indexing. It only annotates the link; it is not an access control.

## Follow-ups

**Q:** How can script check which `rel` values a browser supports?
**A:** `element.relList.supports(token)`. For `<a>`, both browsers reported `noopener` supported and `nofollow` not. They disagree on `<link>`: `relList.supports("canonical")` was `true` in Chrome 155 and `false` in Firefox 158.

**Q:** Does `window.open` get the same protection?
**A:** No. In both browsers `window.open("report.html")` returned a `Window` and the new page saw its opener. With `"noopener"` in the features string it returned `null` and `opener` was `null`.

## Exercises

### What does the new tab report?

```html
<a href="report.html" target="_blank" rel="noreferrer opener">Help</a>
```

**Answer:** `opener: false, referrer: (none)`. `noreferrer` implies `noopener`, and the "get an element's noopener" step checks `noopener`/`noreferrer` before it looks at `opener`, so `opener` can't undo it. Chrome 155 and Firefox 158 logged the same.
