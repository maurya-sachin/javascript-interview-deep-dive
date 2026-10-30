---
title: "How does the browser turn HTML and CSS into pixels?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [rendering, parsing, style, layout, paint, compositing, box-tree, content-visibility]
related:
  - browser/html-event-loop/rendering-steps
  - browser/html-event-loop/request-animation-frame
  - browser/rendering-pipeline/parser-and-render-blocking
  - browser/rendering-pipeline/forced-synchronous-layout
  - browser/rendering-pipeline/compositing
  - html-and-css/positioning-and-stacking/stacking-contexts
  - html-and-css/box-model-and-formatting/block-formatting-context
  - html-and-css/documents-and-semantics/content-model-and-parser-repair
  - html-and-css/documents-and-semantics/head-metadata
verified: 2026-10
perishable:
  - Chromium RenderingNG stage names and thread layout
  - Style and layout counts measured in Chrome 156
  - content-visibility support (Chrome 85, Firefox 125, Safari 18)
sources:
  - https://html.spec.whatwg.org/multipage/parsing.html#overview-of-the-parsing-model
  - https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering
  - https://drafts.csswg.org/css-display-4/#box-tree
  - https://drafts.csswg.org/css-display-4/#valdef-display-none
  - https://drafts.csswg.org/css-display-4/#valdef-visibility-hidden
  - https://drafts.csswg.org/css-contain-2/#skips-its-contents
  - https://drafts.csswg.org/css-contain-2/#relevant-to-the-user
  - https://www.w3.org/TR/CSS2/zindex.html
  - https://w3c.github.io/paint-timing/#first-contentful-paint
  - https://developer.chrome.com/docs/chromium/renderingng-architecture#pipeline
  - https://developer.chrome.com/docs/chromium/blinkng
  - https://firefox-source-docs.mozilla.org/gfx/RenderingOverview.html#high-level-overview
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility#browser_compatibility
tldr: >
  The parser builds the DOM as bytes arrive, and style sheets are parsed alongside. At each
  rendering update the browser computes every element's style, generates boxes and lays them out,
  paints a display list in stacking order, then rasterizes and composites layers on the GPU. A
  change re-runs only the stages it invalidates, at most once per frame.
---

## Answer

Five stages. Parsing runs as the document arrives; the rest run when the event loop gets to "update the rendering", at most once per frame.

1. **Parse.** The HTML tokenizer and tree builder turn bytes into the DOM incrementally. CSS from `<style>` and `<link>` is parsed into style sheets (the CSSOM). Classic scripts can pause the parser.
2. **Style.** For every element and pseudo-element, the cascade and inheritance produce a computed value for each property.
3. **Layout.** Elements generate boxes: the CSS *box tree*. `display: none` generates no boxes for the element or its descendants; `visibility: hidden` keeps the box but makes it invisible; `::before` gets a box with no DOM node. Layout then gives each box a size and position. "Render tree" is an old engine name for this structure; Chromium calls it the layout tree, Gecko the frame tree, and no spec uses the term.
4. **Paint.** The engine records drawing commands in paint order (backgrounds, borders, text, stacking contexts by `z-index`) into a display list, not pixels.
5. **Composite.** The display list is split into layers, rasterized into tiles, and the GPU draws them into the frame. In Chromium raster and compositing run off the main thread; Firefox hands its display list to WebRender.

Each stage feeds the next, so a change re-runs from the first stage it dirties: `color` needs style and paint; `width` needs style, layout and paint; changing an existing `transform` can skip layout and paint. DOM writes only mark things dirty, so ten writes in one task cost one style and layout pass at the next frame, unless script reads geometry in between and forces it early.

The first frame showing anything other than the default background is *first paint*; the first showing text, an image or a canvas is *first contentful paint*.

## Example

```html
<style>
  #gone { display: none; }
  #hidden { visibility: hidden; }
  #pseudo::before { content: "Hi"; }
</style>
<p id="gone">gone</p>
<p id="hidden">hidden</p>
<span id="pseudo"></span>
<script>
  const boxes = (id) => document.getElementById(id).getClientRects().length;
  console.log(boxes('gone'), boxes('hidden'), boxes('pseudo'));
  // → 0 1 1
  const pseudo = document.getElementById('pseudo');
  console.log(pseudo.childNodes.length, pseudo.offsetWidth > 0);
  // → 0 true
</script>
```

`getClientRects()` returns one rectangle per box fragment. The hidden paragraph keeps its box and its space; the empty `<span>` is wide only because of its generated content. Chrome 156 and Firefox 159 printed the same.

## Pitfalls

- Treating the DOM as what gets laid out. Boxes are: one element can generate several (an inline that wraps) or none, and pseudo-elements generate boxes without nodes.
- Treating `visibility: hidden` like `display: none`. The hidden element still takes up space and is laid out on every pass.
- Believing each DOM write repaints. Writes mark style and layout dirty; the work runs once at the next frame unless a read forces it sooner.
- Thinking "paint" puts pixels on screen. It records commands; rasterization and compositing produce pixels, in Chromium on other threads.

## Follow-ups

**Q:** What does `content-visibility: auto` change in the pipeline?
**A:** While the element isn't relevant to the user (off-screen, not focused or selected) it *skips its contents*: they aren't painted and mostly aren't restyled, and size containment lets `contain-intrinsic-size` stand in for their size, so layout can skip them. Chrome 85, Firefox 125, Safari 18.

**Q:** Does the browser wait for the whole HTML before rendering?
**A:** No. Parsing is incremental, and a partly parsed document can render. HTML treats it as render-blocked only until `<body>` starts and render-blocking resources from `<head>` arrive, with an implementation-defined timeout.

**Q:** What is paint holding?
**A:** A Chrome behaviour, not a spec rule: on same-origin navigations Chrome keeps showing the old page and defers compositor commits for the new one until first contentful paint or a timeout, to avoid a white flash.

## Deep dive

### How it works

**Parse.** The HTML Standard's parsing model runs bytes through encoding detection (a `<meta charset>` in the first 1,024 bytes is found by a prescan), a tokenizer state machine, and tree construction, which inserts elements by *insertion mode* and repairs mis-nested markup. The parser runs inside the event loop and can be paused: a classic `<script>` without `async` or `defer` stops tree construction until it has run.

**Style.** Selector matching finds the rules for each element; the cascade picks a winner per property; inheritance and value computation turn `em`, `currentcolor` and `var()` into computed values.

**Layout.** Box generation applies `display`: `none` drops a subtree, `contents` drops the element's own box but keeps its children's, and anonymous boxes wrap stray text and inline runs. Each box joins a formatting context (block, inline, flex, grid) whose rules size it. In Chromium, LayoutNG produces an immutable *fragment tree* of positioned fragments.

**Paint.** Paint walks the layout result in the order CSS 2 Appendix E defines. Within each stacking context: its background, children with negative `z-index`, block backgrounds, floats, inline content, then positioned descendants and positive `z-index` children. Chromium's pre-paint stage first builds *property trees* (transform, clip, effect, scroll), so paint can emit display items that refer to them.

**Composite.** Chromium commits property trees and the display list to the compositor thread, *layerizes* the list, rasterizes tiles on raster threads and the GPU, and the Viz process aggregates frames from all tabs and draws them. In Firefox, the content process serialises a WebRender display list and sends it to the GPU process, which builds a scene, culls it to a frame, and renders it on the GPU.

### Edge cases

Which stages a change dirties is visible in Chrome through the DevTools Protocol. This snippet reads `Performance.getMetrics` (`RecalcStyleCount`, `LayoutCount`) before and after each change, each followed by an `offsetWidth` read to force style and layout:

```js
// <div id="box" style="width: 100px">: static position, no transform yet
box.style.color = 'red';
// → style +1, layout +0
box.style.width = '120px';
// → style +1, layout +1
box.style.transform = 'translateX(10px)';
// → style +1, layout +1
box.style.transform = 'translateX(20px)';
// → style +1, layout +0
box.style.left = '5px';
// → style +1, layout +0
```

Chrome 156 only; three runs gave identical counts. `left` on a statically positioned box doesn't apply, so layout stays clean. The first switch from no transform to a transform ran layout once; later transform changes didn't.

- **Hidden documents.** Update the rendering skips documents that are hidden or render-blocked, so they don't style, lay out or paint until shown.
- **Skipped subtrees.** `content-visibility: hidden` always skips its contents; `auto` skips them while they aren't relevant to the user. Reading geometry inside them still works: the browser styles and lays them out on demand (Chrome 156 logs a console warning), which throws the saving away.

### Real-world scenario

A feed renders 3,000 cards, each with a heading and two long paragraphs. Resizing the container relaid every card: in a test page, forcing layout after a width change took 45–55 ms in Chrome 156 and 41–45 ms in Firefox 159 (15 measurements each, 3 page loads). Adding `content-visibility: auto; contain-intrinsic-size: auto 120px` to each card dropped it to 1–2 ms in both, because off-screen cards are size-contained placeholders whose contents layout skips. The cost moves to scroll time, when cards near the viewport are laid out for the first time.

### Trade-offs

A staged, retained pipeline lets the browser cache each stage's output and redo only what a change dirtied, and lets compositing run on other threads. The price is that cost depends on which stage a property dirties: the same visual change is cheap as a `transform` and expensive as `margin-left` or `width`. Extra layers speed up animation but cost GPU memory, and very large DOMs make every style and layout pass slower whatever was changed.
