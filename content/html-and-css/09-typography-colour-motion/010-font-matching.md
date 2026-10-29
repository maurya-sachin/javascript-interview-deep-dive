---
title: "How does the browser pick a font face, and when does it synthesise bold or italic?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [fonts, font-face, font-matching, font-synthesis, variable-fonts]
related:
  - html-and-css/the-cascade/inheritance-and-global-keywords
  - html-and-css/typography-colour-motion/text-truncation-and-wrapping
verified: 2026-10
perishable:
  - "font-synthesis-position: Firefox 118 only, not Chrome or Safari"
sources:
  - https://www.w3.org/TR/css-fonts-4/#font-matching-algorithm
  - https://www.w3.org/TR/css-fonts-4/#font-style-matching
  - https://www.w3.org/TR/css-fonts-4/#font-prop-desc
  - https://www.w3.org/TR/css-fonts-4/#font-synthesis-intro
  - https://www.w3.org/TR/css-fonts-4/#font-synthesis
  - https://www.w3.org/TR/css-fonts-4/#font-weight-numeric-values
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-synthesis-weight#browser_compatibility
tldr: >
  The browser walks `font-family` left to right. In each family it narrows faces by width, then style,
  then weight, in fixed search orders, and uses the result only if it has the glyph; otherwise it tries the next family, then system fonts. A family with no bold or
  italic face gets a synthesised one unless `font-synthesis` forbids it.
---

## Answer

Font matching (CSS Fonts 4, §5) runs per character, not per element:

1. Take the next name in `font-family`. A generic (`serif`, `system-ui`) maps to a real family; other names are looked up in `@font-face` rules first, then installed fonts. A name defined by `@font-face` never falls through to an installed font of the same name, even if every face fails to load.
2. Narrow that family's faces by `font-width`, then `font-style`, then `font-weight`. For `@font-face` faces the **descriptors** count, not what the file contains.
3. If the chosen face has a glyph for the character, use it. If not, move to the next family; other faces in the same family aren't tried.
4. After the list runs out, the browser's own system fallback picks a font.

The weight search is the part people get wrong. A target below 400 looks lighter first, then heavier; above 500, heavier first, then lighter. From 400 to 500 it looks up to 500, then lighter, then above 500. So `font-weight: 400` with faces at 300, 500 and 700 picks 500.

Order matters too: style beats weight. `font: italic 700` in a family with a regular italic and an upright bold picks the italic and makes it bold another way.

That other way is **synthesis**. When the matched face is lighter or more upright than asked, the browser may fake bold (thickening strokes) or oblique (shearing glyphs). `font-synthesis: none`, or the longhands `font-synthesis-weight` and `font-synthesis-style`, turn it off, so missing faces render at their real weight. A variable font's `wght`, `wdth`, `slnt` and `ital` axes aren't synthesis: declare a range (`font-weight: 100 900`) and the browser treats every value in it as an available face.

## Example

```html
<style>
  @font-face { font-family: Demo; src: local("Courier New"); font-weight: 300; }
  @font-face { font-family: Demo; src: local("Georgia"); font-weight: 500; }
  @font-face { font-family: Demo; src: local("Arial"); font-weight: 700; }
  @font-face { font-family: Demo; src: local("Times New Roman"); font-style: italic; }
</style>
<script type="module">
  const match = async (font) =>
    (await document.fonts.load(font)).map((face) => `${face.weight} ${face.style}`).join();
  console.log(await match("400 16px Demo"));
  // → 500 normal
  console.log(await match("350 16px Demo"));
  // → 300 normal
  console.log(await match("600 16px Demo"));
  // → 700 normal
  console.log(await match("italic 700 16px Demo"));
  // → normal italic
</script>
```

`document.fonts.load()` runs the same matching and returns the faces it chose. Chrome 156 and Firefox 159 on macOS agreed.

## Pitfalls

- Loading a bold file without `font-weight: 700` on its `@font-face`. The descriptor defaults to `auto`, which matches as `normal`. Firefox 159 then synthesised bold over the real bold (text widened from 362.6px to 375.8px); Chrome 156 didn't.
- Expecting a missing bold to fall back to the next family. Fallback happens only when no face matches or a glyph is missing; a missing weight is synthesised or approximated within the family.
- Giving an italic file the same family name without `font-style: italic`. It matches as an upright face; with two upright faces at 400, the later rule rendered plain text in italics in Chrome 156 and Firefox 159.
- Animating `font-weight` over static faces. The value changes continuously but the face jumps at the search boundaries; only a variable font moves smoothly.

## Follow-ups

**Q:** Does synthetic bold change layout?
**A:** It depends on the engine. With Georgia Regular faked to 700, Firefox 159 widened the text from 310.4px to 323.6px; Chrome 156 kept 310.4px and only thickened the strokes. Georgia's real bold was 362.6px in both.

**Q:** What's the first available font?
**A:** The first font in the list whose `unicode-range` covers U+0020 (space), whether or not it has a space glyph. Font-relative units like `ex` and `line-height` use its metrics, so it matters even when other fonts draw the glyphs.

**Q:** Why do browsers keep synthesis on by default?
**A:** Faking is better than showing the wrong weight when a family ships only one face. Turn it off for scripts where shearing or thickening damages legibility, or when a design system ships every face it uses.

## Exercises

### Which face renders `font-weight: 450`?

```css
@font-face { font-family: Brand; src: url(brand-300.woff2); font-weight: 300; }
@font-face { font-family: Brand; src: url(brand-400.woff2); font-weight: 400; }
@font-face { font-family: Brand; src: url(brand-600.woff2); font-weight: 600; }
p { font-family: Brand; font-weight: 450; }
```

**Answer:** The 400 face. From 450 the search looks heavier only as far as 500 (none there), then lighter in descending order, so 400 wins before 600. For `document.fonts.load("450 16px Brand")`, Chrome 156 and Firefox 159 fetched only `brand-400.woff2`; the other faces stayed `unloaded`.
