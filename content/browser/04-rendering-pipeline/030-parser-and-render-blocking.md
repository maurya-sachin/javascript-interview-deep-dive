---
title: "What blocks the parser, and what blocks rendering?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [parser-blocking, render-blocking, script-blocking-style-sheet, preload-scanner, blocking-attribute, critical-rendering-path]
related:
  - browser/rendering-pipeline/script-loading
  - browser/rendering-pipeline/pixel-pipeline
  - browser/html-event-loop/rendering-steps
verified: 2026-10
perishable:
  - blocking="render" support (Chrome 105, Safari 18.2, not Firefox)
  - Chrome stops parsing at in-body style sheets; Firefox doesn't
  - Firefox 159 preload scanner skipped a body image
sources:
  - https://html.spec.whatwg.org/multipage/scripting.html#prepare-the-script-element
  - https://html.spec.whatwg.org/multipage/semantics.html#contributes-a-script-blocking-style-sheet
  - https://html.spec.whatwg.org/multipage/semantics.html#has-a-style-sheet-that-is-blocking-scripts
  - https://html.spec.whatwg.org/multipage/dom.html#render-blocking-mechanism
  - https://html.spec.whatwg.org/multipage/urls-and-fetching.html#blocking-attributes
  - https://html.spec.whatwg.org/multipage/links.html#link-type-stylesheet
  - https://html.spec.whatwg.org/multipage/parsing.html#speculative-html-parsing
  - https://web.dev/articles/preload-scanner
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script#browser_compatibility
tldr: >
  Only a classic `<script>` without `async`, `defer` or `type="module"` stops the parser. Style
  sheets block scripts that come after them, not the parser, and with `<head>` scripts and
  `blocking="render"` elements they block rendering: nothing paints until `<body>` starts and
  they've loaded. A non-matching `media` makes a sheet non-blocking. The preload scanner keeps
  fetching meanwhile.
---

## Answer

Two different things get blocked: building the DOM, and painting it.

**Parser-blocking.** The HTML parser stops for one thing only: a parser-created classic `<script>` without `async`, `defer` or `type="module"`. The parser waits until it has been fetched and run, because the script could call `document.write()` and change what comes next.

**Script-blocking style sheets.** A parser-created `<link rel="stylesheet">` or `<style>` whose `media` matches blocks *scripts*, not the parser. An inline or parser-blocking script after it waits until the sheet loads, so `getComputedStyle()` sees its rules; deferred scripts wait too. Since that script blocks the parser, "CSS then script" stalls parsing indirectly.

**Render-blocking.** HTML treats a document as render-blocked, so it isn't painted, while `<body>` hasn't started or any render-blocking element is pending, up to an implementation-defined timeout. Render-blocking by default: parser-created style sheets with matching media and parser-blocking scripts in `<head>`. `blocking="render"` adds other elements, such as an `async` script, but only while the parser is still in `<head>`. Chrome 105+ and Safari 18.2+ support it; Firefox doesn't.

A style sheet whose `media` doesn't match (`media="print"` on screen) is neither script- nor render-blocking, though it still downloads.

**The preload scanner.** While the parser waits, browsers scan the markup ahead and start fetching later style sheets, scripts and images. HTML permits this as *speculative HTML parsing* but doesn't require it, and it only speeds up downloads; execution order is unchanged.

Rule of thumb: CSS in `<head>` delays the first paint; classic scripts delay the parser; `defer`, `async` and modules delay neither.

## Example

```html
<script>
  const start = performance.now();
  let midParsedAt;
  const poll = setInterval(() => {
    midParsedAt ??= document.getElementById('mid') && performance.now() - start;
  }, 20);
</script>
<!-- the server delays these style sheets by 500 ms and 1,500 ms -->
<link rel="stylesheet" href="/css?delay=500">
<link rel="stylesheet" media="print" href="/css?delay=1500">
<p id="mid">text</p>
<script>
  clearInterval(poll);
  const elapsed = performance.now() - start;
  console.log(midParsedAt < 500, elapsed >= 500, elapsed < 1500);
  // → true true true
  console.log(getComputedStyle(document.getElementById('mid')).color);
  // → rgb(0, 128, 0)
</script>
```

The parser built `#mid` before the first sheet arrived, the script waited for that sheet (which sets `p { color: rgb(0, 128, 0) }`), and the print sheet blocked nothing. Chrome 156 and Firefox 159 agreed in three loads each, served from a local server.

## Pitfalls

- Saying "CSS blocks the parser". It blocks later scripts and rendering; the parser carries on until it reaches such a script.
- Placing an analytics or config `<script>` right after a large style sheet. It now waits for the CSS and holds up parsing, though it never reads styles.
- Relying on `blocking="render"` to prevent a flash in every browser. Firefox ignores it and paints without waiting.
- Using `<script>` at the end of `<body>` as a substitute for `defer`. It still blocks the parser and waits for style sheets; it just has less left to block.

## Follow-ups

**Q:** Does a `<link rel="stylesheet">` inside `<body>` block rendering?
**A:** Not under HTML: render-blocking elements can only be added before `<body>` starts. Browsers differ. Chrome 156 painted content above the sheet but stopped parsing at it until it loaded; Firefox 159 parsed and painted past it at once.

**Q:** Is a style sheet inserted by script render-blocking?
**A:** Not by default; only parser-created sheets are implicitly render-blocking. With `blocking="render"`, inserted while the document is still in `<head>`, it is, where supported.

**Q:** What if a render-blocking resource never loads?
**A:** The document stays render-blocked only until an implementation-defined timeout passes; then it renders anyway.

## Deep dive

### Edge cases

Times to first contentful paint, read from the Paint Timing API, with the blocking resource delayed by 800 ms (three loads per browser, local server):

| Page | Chrome 156 | Firefox 159 |
|---|---|---|
| `<link rel="stylesheet">` in `<head>` | 828–832 ms | 827–836 ms |
| Same with `media="print"` | 32–44 ms | 20 ms |
| Classic `<script src>` before any body content | 824–832 ms | 828–861 ms |
| Classic `<script src>` after a paragraph in `<body>` | 24–40 ms | 19–20 ms |
| `<script async blocking="render">` in `<head>` | 824–832 ms | 20 ms |
| `<script async>` in `<head>` | 24–40 ms | 20 ms |

- **In-body style sheets.** With a coloured block above an in-body `<link>` and another below it, a screenshot 600 ms into a 1,500 ms CSS delay showed both blocks in Firefox 159 and only the upper one in Chrome 156. Chrome's parser hadn't created the lower block yet, and `DOMContentLoaded` fired only after the sheet loaded. That's Chrome behaviour, not the spec's.
- **The preload scanner differs too.** Behind a 1,000 ms parser-blocking script, Chrome 156 requested the later style sheet, script and `<img>` at once. Firefox 159 requested the style sheet and script at once but the `<img>` only after the blocking script ran (two loads each).
- **Parser-blocking scripts in `<body>`.** They stop the parser but aren't render-blocking, so content above them paints while they load, as the fourth row shows.
