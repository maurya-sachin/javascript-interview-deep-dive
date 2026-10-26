# 01 — Documents and semantics

> **Status:** 🔴 planned · **Published:** 0/7 · **Last verified:** —

What an HTML document is before any CSS touches it: the doctype and rendering modes, the content model the parser enforces, semantic elements and landmarks, and the metadata in `<head>`.

## Learning goals

After this chapter you can:

- Explain what the doctype switches and what quirks mode changes
- Predict how the parser repairs invalid nesting such as a `<div>` inside a `<p>`
- Choose a semantic element over a `div`, and say when a `div` is correct
- Structure a page with landmarks and headings, knowing the outline algorithm is gone
- Say what each common `<head>` element and link relation does

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- `<!DOCTYPE html>`; no-quirks, limited-quirks, and quirks modes; what quirks mode changes → 010
- Content categories and content models; implied end tags and parser error recovery → 020
- Semantic elements vs generic `div`/`span`; what semantics buy (accessibility tree, reader modes, search) → 030
- Sectioning elements, landmarks, heading levels; the removed outline algorithm → 040
- `<head>` contents: `charset`, `viewport`, `<title>`, `<base>`, `<meta name>` → 050
- Link types: `canonical`, `alternate`, `icon`, `noopener`, `noreferrer`, `nofollow` → 060
- Global attributes: `data-*`, `hidden` and `until-found`, boolean attribute rules → 070

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What does `<!DOCTYPE html>` do, and what are quirks and standards modes?](010-doctype-and-rendering-modes.md) | medium | 🟡 draft |
| 020 | [What is HTML's content model, and what happens when you put a `<div>` inside a `<p>`?](020-content-model-and-parser-repair.md) | medium | 🟡 draft |
| 030 | [Why use semantic HTML, and when is a `div` the right element?](030-semantic-elements.md) | easy | 🔴 planned |
| 040 | [How do landmarks and headings structure a page now that the outline algorithm is gone?](040-landmarks-and-headings.md) | medium | 🔴 planned |
| 050 | [What belongs in `<head>`, and what do `charset`, `viewport`, and `<base>` change?](050-head-metadata.md) | medium | 🔴 planned |
| 060 | [What do link types like `canonical`, `noopener`, and `nofollow` do?](060-link-types.md) | easy | 🔴 planned |
| 070 | [How do `data-*`, `hidden`, and other global and boolean attributes behave?](070-global-attributes.md) | easy | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [HTML — The DOCTYPE](https://html.spec.whatwg.org/multipage/syntax.html#the-doctype)
- [Quirks Mode Standard](https://quirks.spec.whatwg.org/)
- [DOM — document mode](https://dom.spec.whatwg.org/#concept-document-mode)
- [HTML — Content models](https://html.spec.whatwg.org/multipage/dom.html#content-models)
- [HTML — Tree construction](https://html.spec.whatwg.org/multipage/parsing.html#tree-construction)
- [HTML — Headings and outlines](https://html.spec.whatwg.org/multipage/sections.html#headings-and-outlines)
- [HTML — The `head` element](https://html.spec.whatwg.org/multipage/semantics.html#the-head-element)
- [HTML — Link types](https://html.spec.whatwg.org/multipage/links.html#linkTypes)
- [HTML — Global attributes](https://html.spec.whatwg.org/multipage/dom.html#global-attributes)
- [ARIA in HTML](https://www.w3.org/TR/html-aria/)
