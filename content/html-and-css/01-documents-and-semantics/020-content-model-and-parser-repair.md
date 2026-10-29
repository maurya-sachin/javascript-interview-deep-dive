---
title: "What is HTML's content model, and what happens when you put a `<div>` inside a `<p>`?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [content-model, content-categories, html-parser, parse-errors, implied-end-tags, foster-parenting]
related:
  - html-and-css/documents-and-semantics/doctype-and-rendering-modes
  - html-and-css/documents-and-semantics/semantic-elements
verified: 2026-10
sources:
  - https://html.spec.whatwg.org/multipage/dom.html#content-models
  - https://html.spec.whatwg.org/multipage/dom.html#kinds-of-content
  - https://html.spec.whatwg.org/multipage/dom.html#transparent-content-models
  - https://html.spec.whatwg.org/multipage/grouping-content.html#the-p-element
  - https://html.spec.whatwg.org/multipage/syntax.html#optional-tags
  - https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inbody
  - https://html.spec.whatwg.org/multipage/parsing.html#has-an-element-in-button-scope
  - https://html.spec.whatwg.org/multipage/parsing.html#close-a-p-element
  - https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element
  - https://html.spec.whatwg.org/multipage/parsing.html#foster-parent
tldr: >
  Every element has a content model: which categories (flow, phrasing, metadata, interactive…) it
  may contain. `<p>` accepts only phrasing content, and the parser enforces that for block starts:
  `<div>` closes the open `<p>`, so `<p>a<div>b</div></p>` becomes `<p>a</p><div>b</div><p></p>`.
  Most other violations, like `<div>` in `<span>`, stay in the DOM as written.
---

## Answer

A **content model** is the HTML standard's description of what an element may contain. It is stated in terms of **content categories**: flow content (almost everything in `body`), phrasing content (text and inline-level elements like `span`, `a`, `em`, `img`), plus metadata, sectioning, heading, embedded and interactive content. `<p>`'s content model is *phrasing content*; `<div>` is flow content but not phrasing, so `<div>` inside `<p>` is non-conforming.

Some elements are **transparent**: `<a>`, `<ins>`, `<del>` take the content model of their parent. That is why `<a href><div>…</div></a>` is valid where its parent allows flow content, but `<p><a><div>` is not.

Content models are conformance rules for authors; validators report them. The browser's parser has its own rules, and it repairs only the cases its tree-construction algorithm names. For `<p>` the rule is concrete: in the "in body" insertion mode, a start tag such as `div`, `ul`, `section`, `table`, `h1`–`h6` or another `p` first checks for an open `p` "in button scope" and, if there is one, **closes the `p`**. That is also why `<p>`'s end tag is optional. Then the stray `</p>` finds no open `p`, which is a parse error, and the parser inserts an empty `<p>` and closes it.

So `<p>Intro<div>Block</div></p>` produces three siblings: `<p>Intro</p>`, `<div>Block</div>`, `<p></p>`. CSS like `p > div` never matches, and the empty paragraph adds its default margins.

Other violations are left alone. `<span><div>` and `<button><div>` stay nested exactly as written. The parser also rewrites a few more cases: a second `<a>` closes the first, a nested `<form>` start tag is ignored, and non-table content inside `<table>` is **foster-parented** to just before the table.

## Example

```js
// Chrome 155 and Firefox 158 printed the same
const box = document.createElement("div");
function parse(html) {
  box.innerHTML = html;
  return box.innerHTML;
}

console.log(parse("<p>Intro<div>Block</div></p>"));
// → <p>Intro</p><div>Block</div><p></p>
console.log(parse("<span><div>Kept</div></span>"));
// → <span><div>Kept</div></span>
console.log(parse('<a href="/1">one<a href="/2">two</a>'));
// → <a href="/1">one</a><a href="/2">two</a>
console.log(parse("<table><div>x</div><tr><td>c</td></tr></table>"));
// → <div>x</div><table><tbody><tr><td>c</td></tr></tbody></table>

const p = document.createElement("p");
p.append(document.createElement("div"));
console.log(p.outerHTML);
// → <p><div></div></p>
console.log(parse(p.outerHTML));
// → <p></p><div></div><p></p>
```

## Pitfalls

- Assuming the browser "doesn't care". It keeps rendering, but the DOM differs from the source: selectors, `children` indexes and styles written for the nested shape stop matching.
- Treating parser repair as validation. `<span><div>` survives parsing and is still invalid; run a validator to find content-model errors.
- Building `p > div` with DOM APIs and expecting it to survive serialization. `append` allows it, but `outerHTML` re-parsed through `innerHTML` became three siblings.
- Wrapping a `<div>` in `<p>` to get a paragraph margin. Use a `div` or `section` and style it instead.

## Follow-ups

**Q:** Why does this break server-side rendering?
**A:** The server sends `<p><div>` as text. The browser's parser turns it into sibling elements, so the DOM no longer matches the tree the framework rendered, and hydration finds a mismatch.

**Q:** Does `<p>` close when a `<div>` appears inside a `<button>` inside it?
**A:** No. "Button scope" stops at `button`, so the check finds no open `p`. See the exercise.

## Exercises

### What does this print?

```js
const box = document.createElement("div");
box.innerHTML = "<p>a<button><div>b</div></button></p>";
console.log(box.innerHTML);
```

**Answer:** `<p>a<button><div>b</div></button></p>`. The "has a `p` element in button scope" check walks up the stack of open elements and stops at `button`, so the `<p>` is not closed; the markup is still invalid, because `<button>` accepts only phrasing content. Chrome 155 and Firefox 158 printed the same.
