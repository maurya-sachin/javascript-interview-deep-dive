# 04 — The rendering pipeline

> **Status:** 🔴 planned · **Published:** 0/5 · **Last verified:** —

How bytes become pixels: parsing, style, layout, paint and compositing, how scripts and style sheets block the parser or rendering, and which operations force layout.

## Learning goals

After this chapter you can:

- Walk through parse, style, layout, paint and composite
- Predict execution order for classic, `defer`, `async` and module scripts
- Tell parser-blocking resources from render-blocking ones
- Spot DOM reads that force a synchronous layout, and say why `transform` animates cheaply

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Parse, style, layout, paint, composite; the render tree; first paint → 010
- Classic, `defer`, `async` and module scripts; execution order; `document.write()` → 020
- Parser-blocking vs render-blocking; script-blocking style sheets; the preload scanner; `blocking="render"` → 030
- Style and layout invalidation; forced synchronous layout; which reads flush layout → 040
- Paint vs composite; compositor layers; why `transform` and `opacity` skip layout and paint → 050

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How does the browser turn HTML and CSS into pixels?](010-pixel-pipeline.md) | medium | 🟡 draft |
| 020 | [How do `defer`, `async`, and module scripts change loading and execution order?](020-script-loading.md) | medium | 🟡 draft |
| 030 | [What blocks the parser, and what blocks rendering?](030-parser-and-render-blocking.md) | medium | 🔴 planned |
| 040 | [Which DOM reads force a synchronous layout, and why?](040-forced-synchronous-layout.md) | medium | 🔴 planned |
| 050 | [What is compositing, and why do `transform` and `opacity` animate cheaply?](050-compositing.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [HTML — Overview of the parsing model](https://html.spec.whatwg.org/multipage/parsing.html#overview-of-the-parsing-model)
- [HTML — The `script` element](https://html.spec.whatwg.org/multipage/scripting.html#the-script-element)
- [HTML — Script-blocking style sheets](https://html.spec.whatwg.org/multipage/semantics.html#contributes-a-script-blocking-style-sheet)
- [HTML — Render-blocking mechanism](https://html.spec.whatwg.org/multipage/dom.html#render-blocking-mechanism)
- [CSSOM View](https://drafts.csswg.org/cssom-view/)
- [Chromium — RenderingNG architecture](https://developer.chrome.com/docs/chromium/renderingng-architecture)
