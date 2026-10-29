---
title: "How do `color-scheme` and `light-dark()` support dark mode?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [dark-mode, color-scheme, light-dark, system-colors, theming]
related:
  - html-and-css/responsive-design/media-queries
  - html-and-css/modern-css/custom-properties
  - html-and-css/typography-colour-motion/oklch-and-wide-gamut
verified: 2026-10
perishable:
  - "light-dark() with images: Chrome 150, Firefox 150, Safari 27"
sources:
  - https://www.w3.org/TR/css-color-adjust-1/#color-scheme-prop
  - https://www.w3.org/TR/css-color-adjust-1/#color-scheme-effect
  - https://www.w3.org/TR/css-color-adjust-1/#color-scheme-override
  - https://drafts.csswg.org/css-color-5/#light-dark
  - https://www.w3.org/TR/css-color-4/#css-system-colors
  - https://html.spec.whatwg.org/multipage/semantics.html#meta-color-scheme
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark#browser_compatibility
tldr: >
  `color-scheme: light dark` tells the browser the page supports both schemes, so its own parts
  (canvas background, default text, form controls, scrollbars, system colours) follow the user's
  preference. `light-dark(a, b)` picks `a` or `b` from the element's used colour scheme, not from a
  media query, so it only returns the dark value where `color-scheme` allows dark.
---

## Answer

`@media (prefers-color-scheme: dark)` lets you change **your** colours, but the browser keeps painting **its** parts light: the page background, default text colour, inputs, scrollbars, spellcheck underlines. It can't darken them on its own, because a page written before dark mode might put dark text on them.

**`color-scheme`** (CSS Color Adjustment 1) is the opt-in. Each element lists the schemes it supports; the browser picks a **used colour scheme** per element: the user's preference if it's listed, otherwise the first listed one, otherwise light.

```css
:root { color-scheme: light dark; }
```

That one line turns the canvas, default text, form controls and the system colours (`Canvas`, `CanvasText`, `Field`, `LinkText`…) dark for users who prefer dark. On the root element it also covers the viewport's scrollbars and background. `<meta name="color-scheme" content="light dark">` sets the page's supported schemes from the HTML, so it takes effect without waiting for a stylesheet. A subtree can pin itself with `color-scheme: dark`, and the `only` keyword (`light only`) forbids the browser from force-darkening the page.

**`light-dark(light, dark)`** (CSS Color 5) is the author version of a system colour: it computes to its first colour when the element's used scheme is light and the second when it's dark. So tokens are written once:

```css
:root {
  color-scheme: light dark;
  --surface: light-dark(white, oklch(20% 0 0));
  --text: light-dark(oklch(20% 0 0), oklch(95% 0 0));
}
[data-theme="dark"] { color-scheme: dark; }
```

A theme toggle now only changes `color-scheme`; every `light-dark()` follows, with no duplicated `@media` block. `light-dark()` shipped in Chrome 123, Firefox 120 and Safari 17.5; it accepts only colours, plus images since Chrome 150, Firefox 150 and Safari 27.

## Example

```html
<style>
  .card { color: light-dark(#0000ff, #81d9fe); background-color: Canvas; }
  .light { color-scheme: light; }
  .dark { color-scheme: dark; }
</style>
<p class="card plain">no color-scheme</p>
<p class="card light">light</p>
<p class="card dark">dark</p>
<script>
  const log = (selector) => {
    const style = getComputedStyle(document.querySelector(selector));
    console.log(style.color, style.backgroundColor);
  };
  log(".plain");
  // → rgb(0, 0, 255) rgb(255, 255, 255)
  log(".light");
  // → rgb(0, 0, 255) rgb(255, 255, 255)
  log(".dark");
  // → rgb(129, 217, 254) rgb(18, 18, 18)
</script>
```

Output from Chrome 156, with either preference; Firefox 159 matched except its dark `Canvas`, `rgb(28, 27, 34)`. A `.card` with `color-scheme: light dark` printed the light pair under a light preference and the dark pair under a dark one in both (emulated with Puppeteer in Chrome; Firefox needed the `layout.css.prefers-color-scheme.content-override` pref).

## Pitfalls

- Using `light-dark()` without `color-scheme`. The used scheme stays light, so it always returns the first colour, even for users who prefer dark.
- Opting in with `color-scheme: light dark` but hard-coding one surface (`body { background: white }`). Default text turns light in dark mode, so the page goes white-on-white.
- Setting `color-scheme` on `body` instead of `:root`. The canvas and viewport scrollbars follow the root, and `color` inherits from the root's `CanvasText`: with only `body` dark, text stayed `rgb(0, 0, 0)`.
- Passing non-colours: `padding: light-dark(1px, 2px)` was rejected as invalid.

## Follow-ups

**Q:** How do you respect the system setting but let users override it?
**A:** Default to `color-scheme: light dark` on `:root`, and let the toggle set `light` or `dark` there (via a class or attribute) and store the choice. `light-dark()` tokens, system colours and form controls all follow the one property.

**Q:** Why isn't `@media (prefers-color-scheme)` enough?
**A:** It changes only what you style. Without `color-scheme`, inputs, scrollbars, the canvas and `Canvas`/`CanvasText` stay light, so a dark page still shows bright form fields and scrollbars.

**Q:** What does the `only` keyword do?
**A:** Without it, a browser with a user override may force the page into the preferred scheme and auto-adjust its colours. `color-scheme: light only` tells it the page must not be recoloured.

## Exercises

### What colour is the paragraph for a user who prefers dark?

```html
<style>
  :root { color-scheme: light dark; }
  body { background: white; }
</style>
<p>Hello</p>
```

**Answer:** Nearly white on white. `color` defaults to `CanvasText`, which follows the root's dark scheme: Chrome 156 computed `rgb(255, 255, 255)` and Firefox 159 `rgb(251, 251, 254)`. Use `background: Canvas` or `light-dark()` for the background.
