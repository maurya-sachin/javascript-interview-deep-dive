---
title: "What are specified, computed, used, and resolved values?"
status: draft
difficulty: hard
frequency: 3
core: true
tags: [computed-value, used-value, resolved-value, getcomputedstyle, cssom, inheritance]
related:
  - html-and-css/the-cascade/cascade-sort-order
  - html-and-css/the-cascade/inheritance-and-global-keywords
  - html-and-css/modern-css/custom-properties
  - html-and-css/box-model-and-formatting/box-model-and-box-sizing
verified: 2026-10
perishable:
  - computedStyleMap() in Chrome 66, Safari 16.4; not in Firefox
sources:
  - https://www.w3.org/TR/css-cascade-5/#value-stages
  - https://www.w3.org/TR/css-cascade-5/#declared
  - https://www.w3.org/TR/css-cascade-5/#cascaded
  - https://www.w3.org/TR/css-cascade-5/#specified
  - https://www.w3.org/TR/css-cascade-5/#computed
  - https://www.w3.org/TR/css-cascade-5/#used
  - https://www.w3.org/TR/css-cascade-5/#actual
  - https://drafts.csswg.org/cssom/#resolved-values
  - https://drafts.csswg.org/cssom/#dom-window-getcomputedstyle
  - https://drafts.csswg.org/css-values-4/#snap-as-a-line-width
  - https://drafts.csswg.org/css-backgrounds-3/#border-width
  - https://developer.mozilla.org/en-US/docs/Web/API/Element/computedStyleMap#browser_compatibility
tldr: >
  A property's value goes through stages: declared values, one cascaded winner, a specified value
  after defaulting, a computed value with relative units made absolute (what children inherit), a
  used value after layout, and an actual value after device rounding. `getComputedStyle()` returns
  the resolved value: computed for most properties, used for layout ones like `width`.
---

## Answer

Cascade Level 5 defines a pipeline, per property, per element:

1. **Declared values**: every valid declaration that applies to the element. There can be none or many.
2. **Cascaded value**: the declaration that wins the cascade. There may be none.
3. **Specified value**: the cascaded value after **defaulting**. With no cascaded value, it's inherited or initial; CSS-wide keywords like `inherit` are resolved here. Every element has exactly one.
4. **Computed value**: the specified value resolved as far as possible **without layout**, following the property's "Computed value" line. `em`, `vw` and keywords like `bolder` become absolute; some percentages stay percentages because they need layout. This is the value **children inherit**.
5. **Used value**: computed value plus layout. `width: auto` or `width: 50%` becomes pixels. A property that doesn't apply (`flex` on a non-flex item) has no used value.
6. **Actual value**: the used value adjusted for the device, such as rounding to whole pixels or an available font.

`getComputedStyle()` returns neither exactly. For compatibility, CSSOM defines a **resolved value** per property:

- Colours (`color`, `background-color`, border colours, `box-shadow`…): the used value.
- `line-height`: `normal` if computed as `normal`, otherwise the used value.
- `width`, `height`, `margin-*`, `padding-*` and their logical forms: the used value if the property applies and `display` isn't `none` or `contents`; otherwise the computed value.
- `top`, `left`, `right`, `bottom`, `inset-*`: the used value on a positioned element (unless over-constrained), otherwise computed.
- Everything else: the computed value.

That's why `width: calc(50% + 1em)` reads back as `220px` on a laid-out element but `calc(50% + 20px)` under `display: none`: the `em` was made absolute at computed time, but the percentage needs layout.

Elements that aren't connected to the document have no values at all: Chrome 155 and Firefox 158 returned empty strings for a detached `<div>`.

## Example

```html
<style>
  .box { width: 400px; font-size: 20px; }
  #a { width: calc(50% + 1em); line-height: 1.5; }
  #b { width: calc(50% + 1em); display: none; }
  #c { line-height: normal; }
  #d { width: 50%; } /* a <span>: width doesn't apply */
</style>
<div class="box">
  <div id="a"></div><div id="b"></div><div id="c"></div><span id="d"></span>
</div>
<script>
  console.log(getComputedStyle(a).width);      // → 220px
  console.log(getComputedStyle(b).width);      // → calc(50% + 20px)
  console.log(getComputedStyle(a).lineHeight); // → 30px
  console.log(getComputedStyle(c).lineHeight); // → normal
  console.log(getComputedStyle(d).width);      // → 50%
</script>
```

Chrome 155 and Firefox 158 agreed. `#a` gets used values; `#b` and `#d` get computed values, because `#b` has `display: none` and `width` doesn't apply to a non-replaced inline box.

## Pitfalls

- Calling `getComputedStyle()` "the computed value". It's the resolved value, which is the used value for `width`, colours and `line-height`.
- Reading `el.style.width` to find an element's width. `style` holds only the `style` attribute's declarations; it returned `""` for a width set in a style sheet.
- Assuming a percentage is resolved before inheritance. A computed `50%` stays `50%`, so `width: inherit` in a child of a `200px`-wide `50%` box gave `100px`, not `200px`.
- Expecting `getComputedStyle()` to snapshot. It returns a live object: a detached `<div>` read `""`, and the same object read `10px` once the element was appended.

## Follow-ups

**Q:** Which value does a child inherit, `1.5` or `30px`?
**A:** The computed value. `line-height: 1.5` computes to the number `1.5`, so each child multiplies by its own font size; `150%` computes to a length, so children inherit the parent's pixels. `getComputedStyle` reports `30px` for both on a `20px` element.

**Q:** Why does `getComputedStyle` return used values for some properties at all?
**A:** History. It was defined to return the computed value, but CSS later changed what "computed value" means while browsers had to keep returning the same results for existing scripts. CSSOM named that result the resolved value.

**Q:** Where do I get layout boxes, if not from `getComputedStyle`?
**A:** `getBoundingClientRect()` reports the laid-out box in pixels, even for inline elements. `getComputedStyle().width` is the `width` property's used value, which with `box-sizing: border-box` is the border-box width: `200px` with `padding: 20px` in both browsers.

## Deep dive

### How it works

The pipeline starts with **filtering**: declarations from applicable style sheets, true conditions, matching selectors, and valid syntax become declared values. The **cascade** sorts them; the first is the cascaded value. **Defaulting** turns that into the specified value: if there's nothing, inherited properties take the parent's computed value and others their initial value; `inherit`, `initial`, `unset`, `revert` and `revert-layer` are resolved here.

The **computed value** follows the property definition's "Computed value" line. The spec's guidance is to resolve as much as possible without layout, network requests, or values from anything but the element and its parent. Relative lengths are absolutised, relative URLs become absolute, keywords such as `bolder` are replaced, and some percentages are multiplied out (for `font-size`, by the parent's font size). A computed value exists even when the property doesn't apply, which is what lets `text-transform` set on a `<p>` reach the text inside it.

The **used value** completes the calculation with layout: `auto` widths, percentages of the containing block, flex and grid sizes. The **actual value** reflects device limits.

Walking one declaration through the pipeline, `#a { width: calc(50% + 1em) }` in a `400px`, `20px`-font box:

```css
/* declared:  calc(50% + 1em)  (plus any losing declarations)
   cascaded:  calc(50% + 1em)
   specified: calc(50% + 1em)
   computed:  calc(50% + 20px)  em is absolute; % needs layout
   used:      220px
   resolved:  220px             width is a "used value" special case */
```

### Edge cases

**Border widths snap at computed time.** Backgrounds and Borders Level 3 defines `border-width`'s computed value as "absolute length, snapped as a border width": below one device pixel rounds up to 1, above it rounds down to a whole device pixel. At a device pixel ratio of 1, both browsers returned `1px` for `0.5px`, `2px` for `2.7px` and `4px` for `4.2px`. The cascade spec's own example table, which shows `4.2px` until the actual value, predates that rule.

**Positioned offsets.** `position: relative; bottom: 10px` read back `top` as `-10px` (the used value) in both browsers. On a static element, `top: 10px` read back `10px`: it doesn't apply, so the computed value is returned. On an absolutely positioned element, `left: auto` read back as `0px`, its used static position.

**Colours are always used values.** `currentcolor` in `border-color` reads back as the colour it stands for, e.g. `rgb(1, 2, 3)`. `red`, `#f00` and `hsl(0 100% 50%)` all read back as `rgb(255, 0, 0)`.

**Serialisation, not data.** Computed values are abstract; `getComputedStyle` serialises them. `transform: rotate(45deg)` read back as `matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, 0)` and a relative `url(img.png)` as an absolute `file:` URL in both browsers.

### Real-world scenario

A tooltip script reads `getComputedStyle(trigger).width` to position itself. It works until the trigger is an inline `<a>`: `width` doesn't apply, so it gets the computed value, `auto` in both browsers, and `parseFloat` gives `NaN`. The fix is to measure the box with `getBoundingClientRect()`, which always reports layout, and to use `getComputedStyle` only for style information, such as reading `line-height` or checking `display`.

A related bug: a theme toggle reads `getComputedStyle(el).color` and compares it to `"red"`. Resolved colours serialise as `rgb(255, 0, 0)`, so the comparison never matches. Compare serialised forms, or read a custom property you control.

Reading a used value like `width` requires up-to-date layout, so interleaving style writes and `getComputedStyle` reads in a loop forces the browser to lay out the page repeatedly; batch reads before writes.

### Trade-offs

Separating computed from used values is what makes inheritance cheap and predictable: children inherit a value that doesn't depend on their own layout, and layout runs once afterwards. The cost is that the value developers see in `getComputedStyle` is a compatibility compromise, used for some properties and computed for others. For typed values there's `computedStyleMap()` (CSS Typed OM), shipped in Chrome 66 and Safari 16.4 but not yet in Firefox.

## Exercises

### What does each line print?

```html
<div style="width: 400px; font-size: 10px">
  <p id="p" style="width: 25%; font-size: 2em; line-height: 150%; display: none"></p>
</div>
<script>
  const s = getComputedStyle(p);
  console.log(s.width, s.fontSize, s.lineHeight);
</script>
```

**Answer:** `25% 20px 30px`. With `display: none`, `width` falls back to its computed value, which keeps the percentage. `font-size: 2em` computes to `20px` without layout, and `line-height: 150%` computes to a length, `30px`. Chrome 155 and Firefox 158 agreed.
