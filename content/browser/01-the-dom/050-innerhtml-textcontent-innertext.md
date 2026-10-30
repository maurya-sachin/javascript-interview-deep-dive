---
title: "How do `innerHTML`, `textContent`, `innerText`, and `setHTML()` differ?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [dom, innerhtml, textcontent, innertext, sethtml, sanitizer]
related:
  - browser/the-dom/inserting-and-moving-nodes
  - browser/rendering-pipeline/forced-synchronous-layout
  - browser/web-components/declarative-shadow-dom
  - html-and-css/documents-and-semantics/content-model-and-parser-repair
verified: 2026-10
perishable:
  - setHTML() and Sanitizer shipped in Chrome 146 and Firefox 148; not Safari
sources:
  - https://dom.spec.whatwg.org/#dom-node-textcontent
  - https://dom.spec.whatwg.org/#string-replace-all
  - https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-element-innerhtml
  - https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#fragment-parsing-algorithm-steps
  - https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-element-sethtml
  - https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-element-sethtmlunsafe
  - https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#built-in-safe-default-configuration
  - https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-sanitizer-removeunsafe
  - https://html.spec.whatwg.org/multipage/dom.html#the-innertext-idl-attribute
  - https://html.spec.whatwg.org/multipage/dom.html#get-the-text-steps
  - https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML#browser_compatibility
tldr: >
  `innerHTML` serialises children to markup and parses markup on set; inserted `<script>`s don't
  run, but event-handler attributes do. `textContent` reads all descendant text, hidden or not,
  and sets plain text. `innerText` reads text as rendered, so it depends on CSS and needs layout.
  `setHTML()` parses and sanitises, always stripping script-capable markup.
---

## Answer

**`innerHTML`.** The getter serialises the element's children as HTML. The setter runs the HTML fragment parser with the element as context and replaces all children with the result. Two consequences:

- `<script>` elements it creates never execute: the fragment is parsed in an inert scripting mode.
- Everything else is live markup. `<img src=x onerror=…>` runs its handler when the image fails, so assigning untrusted strings is an XSS hole.

**`textContent`.** Defined by the DOM Standard on every node. On an element it returns the concatenated data of all descendant `Text` nodes in tree order: including text in `<script>`, `<style>`, and elements hidden by CSS or `hidden`. On `document` it's `null`. The setter replaces all children with one `Text` node (none for `""`), so markup is never parsed. It's the safe, cheap way to write text.

**`innerText`.** Defined by the HTML Standard on `HTMLElement`, it returns the text *as rendered*: elements with `display: none` or non-visible `visibility` are skipped, `text-transform` is applied, and block boundaries and `<br>` become line breaks. That needs up-to-date styles and layout, so reading it after DOM changes forces a synchronous layout. If the element itself isn't rendered, it falls back to `textContent`-style output. The setter turns `\n` into `<br>`.

**`setHTML(html, { sanitizer })`.** Parses like `innerHTML`, then sanitises before inserting. With no sanitizer it uses the built-in safe default, which keeps only elements categorised Default (`<b>`, `<p>`… but not `<img>`), and drops comments, `data-*` attributes and `javascript:` URLs. With a custom config it still removes everything unsafe, such as `<script>` and `on*` handlers, whatever the config allows. `setHTMLUnsafe()` is the unsanitised counterpart that, unlike `innerHTML`, parses declarative shadow roots. The Sanitizer API moved from its WICG draft into the HTML Standard; `setHTML()` shipped in Chrome 146 and Firefox 148, not in Safari.

## Example

```js
// <div id="box"><p>Hello <span hidden>secret</span>
//   <span style="text-transform: uppercase">world</span></p></div>   (no whitespace between tags)
// <div id="out"></div>
const box = document.getElementById('box');
console.log(JSON.stringify(box.textContent));
// → "Hello secretworld"
console.log(JSON.stringify(box.innerText));
// → "Hello WORLD"

const out = document.getElementById('out');
const payload = '<img src="x" onerror="console.log(\'onerror ran\')">' +
  '<script>console.log("script ran")<\/script><b>ok</b>';

out.setHTML(payload);
console.log(out.innerHTML);
// → <b>ok</b>
out.setHTML(payload, { sanitizer: { elements: ['img', 'script', 'b'], attributes: ['src', 'onerror'] } });
console.log(out.innerHTML);
// → <img src="x"><b>ok</b>
out.textContent = payload;
console.log(out.childNodes.length, out.firstChild.nodeName);
// → 1 #text
out.innerHTML = payload;
// The script never runs; the image fails and its handler logs:
// → onerror ran
```

Chrome 156 and Firefox 159 printed the same.

## Pitfalls

- Using `innerHTML` to insert text. Any `<` in user data becomes markup; use `textContent`.
- Expecting a `<script>` added with `innerHTML` to run. It won't; create it with `createElement('script')` and insert it.
- Reading `innerText` in a loop that also writes to the DOM. Each read needs fresh layout; read `textContent` unless you need the rendered text.
- Trusting `setHTML()` with a permissive config to keep event handlers. Unsafe content is always removed; use `setHTMLUnsafe()` only for trusted markup.

## Follow-ups

**Q:** Does `el.innerHTML += '<li>x</li>'` just append?
**A:** No. It serialises all children, concatenates, and re-parses: every existing child is replaced by a new node, losing listeners, form state and references. Use `insertAdjacentHTML('beforeend', …)` or `append()`.

**Q:** What does `innerText` return on an element with `display: none`?
**A:** Its descendant text content, as `textContent` would, because the "not being rendered" case falls back to it. A hidden *child* of a rendered element is skipped instead.

## Exercises

### What do the three logs print?

```js
// <ul id="menu"><li>Home</li><li style="display: none">Admin</li><li>About</li></ul>
const menu = document.getElementById('menu');
console.log(JSON.stringify(menu.textContent));
console.log(JSON.stringify(menu.innerText));
menu.style.display = 'none';
console.log(JSON.stringify(menu.innerText));
```

**Answer:** `"HomeAdminAbout"`, `"Home\nAbout"`, `"HomeAdminAbout"`. `textContent` ignores CSS. `innerText` skips the hidden `<li>` and puts a line break between the block-level items; once the whole list is `display: none`, it falls back to the descendant text. Chrome 156 and Firefox 159 agreed.
