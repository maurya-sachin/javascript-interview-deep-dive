---
title: "How do you truncate text with an ellipsis on one line or several?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [text-overflow, line-clamp, ellipsis, text-wrap, overflow-wrap]
related:
  - html-and-css/box-model-and-formatting/overflow-and-scroll-containers
  - html-and-css/typography-colour-motion/font-matching
verified: 2026-10
perishable:
  - "Unprefixed line-clamp: flags or previews only; none ship it"
  - "text-wrap: pretty: Chrome 117, Safari 26, not Firefox"
  - "text-wrap: balance: Chrome 114, Firefox 121, Safari 17.5"
sources:
  - https://www.w3.org/TR/css-overflow-3/#text-overflow
  - https://www.w3.org/TR/css-overflow-4/#line-clamp
  - https://www.w3.org/TR/css-overflow-4/#webkit-line-clamp
  - https://drafts.csswg.org/css-overflow-4/#continue
  - https://www.w3.org/TR/css-text-4/#text-wrap-style
  - https://www.w3.org/TR/css-text-4/#overflow-wrap-property
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-clamp#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-wrap#browser_compatibility
tldr: >
  One line needs three declarations together: `white-space: nowrap` so the text overflows sideways,
  `overflow: hidden` so it's clipped, and `text-overflow: ellipsis` to draw the "…". Several lines
  still need the legacy quartet `display: -webkit-box`, `-webkit-box-orient: vertical`,
  `-webkit-line-clamp: N` and `overflow: hidden`; no stable browser ships unprefixed `line-clamp`.
---

## Answer

**One line.** `text-overflow` only decides how clipped inline content is drawn, so it needs content that overflows and a box that clips it:

```css
.one-line { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
```

Drop `nowrap` and the text wraps instead of overflowing; drop `overflow: hidden` and it spills out visibly. `text-overflow` applies to block containers and isn't inherited, so set it on the box that clips, not on an inline child or a flex container.

**Several lines.** CSS Overflow 4 defines `line-clamp: 3` as a shorthand for `max-lines`, `block-ellipsis` and `continue`, which fragments away everything after line 3 and puts an ellipsis at the end of the last line. No stable browser ships it yet, so production code uses the legacy form the spec keeps for compatibility:

```css
.three-lines {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}
```

`-webkit-line-clamp` only works with both of the other two `-webkit-` declarations. It sets the box's height to the clamped lines and draws the ellipsis; `overflow: hidden` is still needed to hide the lines after the clamp, which otherwise keep painting. The current draft turns such a box's `display` into `flow-root`, and Chrome 156 and Firefox 159 report that.

**Wrapping, not truncating.** `overflow-wrap: anywhere` (or `break-word`) breaks a long word or URL that would overflow. `text-wrap: balance` evens out line lengths in short blocks like headings; `text-wrap: pretty` asks for slower, better breaking, such as avoiding a lone last word.

## Example

```html
<style>
  p { width: 160px; font: 16px/20px Arial; }
  .one-line { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .two-lines {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
  .standard { line-clamp: 2; overflow: hidden; }
</style>
<p class="one-line">The quick brown fox jumps over the lazy dog again and again</p>
<p class="two-lines">The quick brown fox jumps over the lazy dog again and again and again and again</p>
<p class="standard">The quick brown fox jumps over the lazy dog again and again and again and again</p>
<script>
  const [oneLine, twoLines, standard] = document.querySelectorAll("p");
  console.log(oneLine.clientWidth, oneLine.scrollWidth);
  // → 160 435
  console.log(twoLines.clientHeight, twoLines.scrollHeight);
  // → 40 80
  console.log(getComputedStyle(twoLines).display);
  // → flow-root
  console.log(standard.clientHeight, CSS.supports("line-clamp: 2"));
  // → 80 false
</script>
```

Chrome 156 and Firefox 159 on macOS printed the same values. `scrollWidth > clientWidth` (or `scrollHeight > clientHeight`) is how script detects truncated text.

## Pitfalls

- `-webkit-line-clamp` alone. Without `display: -webkit-box` and `-webkit-box-orient: vertical` it did nothing: the paragraph stayed 80px tall.
- Leaving out `overflow: hidden` on a clamped box. It shrank to two lines and drew the ellipsis, but lines three and four painted below it in both browsers.
- Putting the ellipsis on a flex container. Flex containers aren't block containers; style the item, which is blockified.
- Shipping only `line-clamp: 2` because it reads better. No stable browser applies it; write the `-webkit-` form, optionally with `line-clamp` alongside.

## Follow-ups

**Q:** Do Chrome and Firefox balance a heading the same way?
**A:** No; the spec leaves the algorithm to the browser. A 320px heading broke into three lines in both, but Chrome 156 started "How do you truncate" and Firefox 159 "How do you truncate text". The spec lets browsers treat `balance` as `auto` beyond ten lines.

**Q:** What's the difference between `overflow-wrap: anywhere` and `break-word`?
**A:** Both break an unbreakable word that would overflow. Only `anywhere` counts those breaks in min-content size, so a flex item with a long word shrank to its 120px container with `anywhere` but stayed 191px wide with `break-word`.

**Q:** Can the ellipsis show where the text was cut in the middle, like `file…name.pdf`?
**A:** Not in CSS: `text-overflow` cuts at the end edge of the line. Middle truncation needs script that measures and rewrites the text, keeping the full string in `title` or an accessible name.

## Exercises

### Why is there no ellipsis, and the button is cut off?

```html
<style>
  .row { display: flex; width: 200px; overflow: hidden; }
  .title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
<div class="row">
  <div class="item"><p class="title">A very long file name that will not fit.pdf</p></div>
  <button>Delete</button>
</div>
```

**Answer:** A flex item's `min-width: auto` keeps `.item` at its content width, so `.title` never overflows (its `clientWidth` equalled its `scrollWidth`: 263 in Chrome 156, 264 in Firefox 159) and the button is pushed past the row. Add `min-width: 0` to `.item`; the title then clipped with an ellipsis and the button ended at the row's edge (208px).
