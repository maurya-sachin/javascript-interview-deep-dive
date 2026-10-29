---
title: "What are cascade layers, and how do they change what overrides what?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [cascade-layers, layer, import, cascade, specificity, architecture]
related:
  - html-and-css/the-cascade/cascade-sort-order
  - html-and-css/the-cascade/specificity
  - html-and-css/the-cascade/important-reverses-order
  - html-and-css/the-cascade/inheritance-and-global-keywords
verified: 2026-10
perishable:
  - "@layer shipped in Chrome 99, Firefox 97, Safari 15.4"
  - Chrome 155 and Firefox 158 accept CSS-wide keywords as layer names
sources:
  - https://www.w3.org/TR/css-cascade-5/#cascade-layering
  - https://www.w3.org/TR/css-cascade-5/#layering
  - https://www.w3.org/TR/css-cascade-5/#layer-names
  - https://www.w3.org/TR/css-cascade-5/#unnamed-layers
  - https://www.w3.org/TR/css-cascade-5/#layer-ordering
  - https://www.w3.org/TR/css-cascade-5/#layer-block
  - https://www.w3.org/TR/css-cascade-5/#layer-empty
  - https://www.w3.org/TR/css-cascade-5/#at-import
  - https://www.w3.org/TR/css-cascade-5/#layer-apis
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@layer#browser_compatibility
tldr: >
  `@layer` splits author styles into ordered groups. The cascade compares layers before specificity,
  so a later layer beats an earlier one whatever their selectors, and unlayered styles beat every
  layer. Order comes from each layer's first appearance, best fixed up front with
  `@layer reset, vendor, components;`. For `!important`, layer order reverses.
---

## Answer

A cascade layer is a named bucket of style rules inside one origin. The cascade compares layers after origin, shadow context and inline styles, but **before specificity**. So when two normal declarations are in different layers, the one in the later layer wins, even if the earlier layer's selector has IDs in it.

You create layers three ways:

- `@layer name { … }` puts rules into a layer (repeat the name to add more).
- `@layer a, b, c;` declares layers, and their order, without rules.
- `@import url(lib.css) layer(vendor);` puts a whole file into a layer; `layer` without a name makes an anonymous one.

**Order is the order of first appearance.** Writing `@layer reset, vendor, components;` at the top fixes the order, and later blocks only add rules. Without it, the first `@layer vendor {}` in the source decides vendor's place, wherever its later blocks are.

**Unlayered styles count as an implicit last layer**, so they beat every named layer. That's why adding layers to part of a codebase can make the unlayered rest win conflicts it used to lose.

**Nesting**: `@layer framework { @layer base { … } }`, or `framework.base` for short. Nested layers are sorted inside their parent, and the parent's own rules (outside any child) come after its children.

Two exceptions to "later layer wins":

- For **`!important`**, the order reverses: an important declaration in the *first* layer wins. That keeps `!important` meaningful for a reset or vendor layer.
- A **`style` attribute** isn't in a layer; it's decided before layers, so it beats them all.

`revert-layer` rolls a property back to what the earlier layers would give. Layers shipped in Chrome 99, Firefox 97 and Safari 15.4.

## Example

```html
<style>
  @layer reset, vendor, components;

  @layer components {
    .btn { color: green; }          /* (0,1,0) */
  }
  @layer vendor {
    #app button.btn { color: red; } /* (1,1,1) */
    #app .note { color: red; }
  }
  .note { color: blue; }            /* unlayered */
</style>
<div id="app">
  <button class="btn" id="save">Save</button>
  <p class="note" id="note">Note</p>
</div>
<script>
  console.log(getComputedStyle(save).color); // → rgb(0, 128, 0)
  console.log(getComputedStyle(note).color); // → rgb(0, 0, 255)
</script>
```

Chrome 155 and Firefox 158 agreed. `components` is declared after `vendor`, so its single class wins; the unlayered `.note` beats the vendor layer's ID selector.

## Pitfalls

- Expecting layers to be ordered by where their rules are. Only the first mention counts: after `@layer b {} @layer a {}`, `a` wins even if more `b` rules come later.
- Layering only the third-party CSS and forgetting the unlayered rest. Unlayered rules win over all layers, which is usually the intent, but a stray unlayered reset will now beat your component layer.
- Writing `@layer` between `@import` rules. Any `@layer` statement after an `@import` makes the following `@import`s invalid; both browsers dropped them from `cssRules`.
- Using `!important` inside a high layer to win. Important order is reversed, so the earliest layer's `!important` wins instead.

## Follow-ups

**Q:** Can you put `<link>`ed CSS into a layer?
**A:** Not with an attribute: the spec has an open issue for one. Use `@import url(x.css) layer(name);` or wrap the file's contents in `@layer name { … }`.

**Q:** What happens to `@layer` inside `@media`?
**A:** A layer declared inside a false `@media` or `@supports` doesn't take its place in the order. In both browsers, `@media (max-width: 1px) { @layer b, a; }` didn't stop a later `@layer a` and `@layer b` from ordering as written.

**Q:** How do you read layers from script?
**A:** `CSSLayerBlockRule.name`, `CSSLayerStatementRule.nameList`, and `CSSImportRule.layerName`, which gave `"vendor"`, `""` for an anonymous layer and `null` for an unlayered import in both browsers.

## Deep dive

### How it works

The layer step sits between element-attached styles and specificity in the cascade's sort. Within each origin and context, every declaration belongs to a layer; declarations outside any `@layer` belong to an implicit final layer. Normal declarations in a later layer win; for important ones the earliest layer wins.

Layers are sorted by first declaration, with nested layers grouped inside their parent, each parent's own rules forming an implicit sub-layer after its children:

```css
h1 { color: darkslateblue; }                 /* unlayered */
@layer reset.type { strong { font-weight: bold; } }
@layer framework {
  .title { font-weight: 100; }
  @layer theme { h1, h2 { color: maroon; } }
}
@layer reset { [hidden] { display: none; } }

/* Order, weakest first:
   reset.type, reset, framework.theme, framework, unlayered */
```

Names are dotted paths. `framework.base` and a top-level `base` are different layers, and a nested layer can't refer to layers outside its parent. Each anonymous `@layer { }` is a separate layer that nothing else can add to, which libraries use to hide internal ordering.

`@import` gets layers too. Statement rules may come before `@import`, which lets inline layers and imported ones be interleaved in one declared order:

```css
@layer reset, vendor, app;
@import url(reset.css) layer(reset);
@import url(vendor.css) layer(vendor);
@layer app { .btn { color: green; } }
```

Layers also decide name collisions between `@keyframes` (and other name-defining rules): with `@layer fw, over;`, keyframes named `k` in `over` replaced those in `fw` in both browsers.

### Edge cases

- **Layer names that are keywords.** The spec reserves the CSS-wide keywords and makes `@layer initial { }` invalid. Chrome 155 and Firefox 158 both accepted `initial`, `revert` and `unset.foo` as layer names and ordered them like any other.
- **Inline styles and layers.** `style="color: green"` beat `@layer a { #t { color: red } }` in both browsers: element-attached styles are compared before layers.
- **Important vs unlayered.** `@layer a { p { color: green !important } }` beat an unlayered `#t { color: red }`. Importance is decided at the origin step, before layers.
- **Anonymous import layers.** `@import url(lib.css) layer;` and a later `@import url(lib.css) layer(vendor)` create two layers; nothing can be added to the anonymous one later.

### Real-world scenario

A product page imports a UI kit whose selectors look like `.kit .kit-btn:not(.kit-disabled)`. Today the team overrides it with longer selectors and `!important`. With layers:

```css
@layer kit, app;
@import url(kit.css) layer(kit);
@layer app {
  .btn { padding: 0.5rem 1rem; }
}
```

Every `app` rule now beats every `kit` rule. If the kit uses `!important`, its important declarations still beat `app`'s important ones, so the right move is to remove `!important` from the app side. Utilities that must always win can stay unlayered or go in the last layer.

### Trade-offs

Layers make conflict resolution explicit and global: one line decides precedence between whole groups of rules. They don't help inside a layer, where specificity and source order still apply. The order is global per document, so separately authored style sheets have to agree on names; a misspelled layer name silently creates a new layer wherever it first appears.

## Exercises

### Which layer wins?

```css
@layer theme { #intro { color: red; } }
@layer base, theme;
@layer base { p { color: green; } }
/* <p id="intro"> */
```

**Answer:** Green. `theme` first appears in the first line, so the statement only adds `base` after it; it can't move `theme`. The order is `theme`, then `base`, so `base`'s `p` beats `theme`'s `#intro` despite the ID. Chrome 155 and Firefox 158 both gave `rgb(0, 128, 0)`.
