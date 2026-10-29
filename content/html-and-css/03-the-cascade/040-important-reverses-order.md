---
title: "What does `!important` really do, and why does it reverse origin and layer order?"
status: draft
difficulty: hard
frequency: 3
core: false
tags: [important, cascade, origin, cascade-layers, animations, transitions, shadow-dom]
related:
  - html-and-css/the-cascade/cascade-sort-order
  - html-and-css/the-cascade/cascade-layers
  - html-and-css/the-cascade/specificity
  - html-and-css/typography-colour-motion/keyframe-animations
  - html-and-css/typography-colour-motion/transitions-and-discrete-properties
verified: 2026-10
sources:
  - https://www.w3.org/TR/css-cascade-5/#important
  - https://www.w3.org/TR/css-cascade-5/#cascade-origin
  - https://www.w3.org/TR/css-cascade-5/#cascade-context
  - https://www.w3.org/TR/css-cascade-5/#style-attr
  - https://www.w3.org/TR/css-cascade-5/#cascade-layering
  - https://drafts.csswg.org/css-animations-1/#animations
  - https://drafts.csswg.org/css-animations-1/#keyframes
  - https://drafts.csswg.org/css-transitions-1/#accessibility-cascade
  - https://html.spec.whatwg.org/multipage/rendering.html#hidden-elements
  - https://drafts.csswg.org/cssom/#dom-cssstyledeclaration-setproperty
tldr: >
  `!important` doesn't add specificity; it moves a declaration into a separate, higher band of the
  cascade. In that band the order flips: user-agent beats user beats author, the first layer beats
  later ones, and a shadow tree beats its host page. The flip lets the weaker party mark a value as
  non-negotiable. Animations lose to it; transitions don't.
---

## Answer

A declaration is **important** when its value ends with the tokens `!` and `important` (whitespace, comments and case don't matter). Importance is decided at the first cascade step, with origin, so an important declaration beats every normal one before selectors are compared.

The origin order, strongest first, is:

1. Transitions
2. Important user agent
3. Important user
4. Important author
5. Animations
6. Normal author
7. Normal user
8. Normal user agent

Normal declarations go author > user > UA; important ones go UA > user > author. The reason is a **balance of power**. Authors normally win, but a user who needs large text or high contrast can mark their styles important and override the page. The browser can do the same for things that must hold: the HTML user-agent style sheet has `input[type=hidden i] { display: none !important; }`, and no author style can show that input.

The same reversal applies at two later steps:

- **Layers**: for normal declarations the last layer wins; for important ones the **first** layer wins. A reset or vendor layer can mark a value as required, and a later layer can't override it with its own `!important`.
- **Shadow DOM context**: normal styles from the page beat a component's; important styles from inside the component beat the page's.

Other steps aren't reversed: inline `!important` beats any style sheet `!important`, and specificity and source order still decide within one layer.

Animations sit between normal and important author styles: a running `@keyframes` animation overrides normal rules but loses to `!important`, and `!important` inside a keyframe is ignored. Transitions sit above everything: they only animate between values the cascade already chose, so they can't be used to beat a user's styles.

## Example

```html
<style>
  @layer reset, theme;
  @layer reset { .btn { color: green !important; } }
  @layer theme { .btn { color: red !important; } }
  #save { color: red !important; }  /* unlayered, (1,0,0) */

  input[type=hidden] { display: block !important; }
</style>
<button class="btn" id="save">Save</button>
<input type="hidden" id="token">
<script>
  console.log(getComputedStyle(save).color);    // → rgb(0, 128, 0)
  console.log(getComputedStyle(token).display); // → none
</script>
```

Chrome 155 and Firefox 158 agreed. Among important declarations the first layer, `reset`, wins, ahead of `theme` and the unlayered ID rule; the UA's important `display: none` beats the author's.

## Pitfalls

- Fighting `!important` with a more specific `!important`. That only works within one layer; across layers, the earlier layer's important wins, and specificity is never reached.
- Unlayered `!important` as the "strongest" author style. For normal rules unlayered wins; for important ones it is the weakest author layer.
- Putting `!important` in `@keyframes`. The declaration is ignored: in both browsers `color: red !important` in a keyframe had no effect, while the keyframe's other properties still animated.
- Expecting `!important` to stop a transition. A transition between two important values still runs: halfway through a 100s transition from `rgb(0, 0, 0) !important` to `rgb(200, 0, 0) !important`, both browsers reported `rgb(100, 0, 0)`.

## Follow-ups

**Q:** How do you set an important inline style from JavaScript?
**A:** `el.style.setProperty("color", "red", "important")`. `el.style.color = "red !important"` is invalid and ignored. `el.style.getPropertyPriority("color")` returns `"important"`, and the attribute serialises as `color: red !important;`.

**Q:** Does `!important` on a shorthand apply to its longhands?
**A:** Yes: the shorthand expands to longhands that are each important. `#sh { margin: 5px !important }` beat a later `#sh { margin-top: 1px }`; `margin-top` stayed `5px`.

**Q:** Why can a web component's `:host { … !important }` beat the page?
**A:** At the context step, important declarations from the inner (shadow) context win. With both sides important, `:host` won in both browsers; with both normal, the page's `x-el` rule won.

## Exercises

### Animation vs important

```html
<style>
  @keyframes flash { from, to { color: red; } }
  #a { color: blue; animation: flash 100s; }
  #b { color: green !important; animation: flash 100s; }
</style>
<p id="a">A</p>
<p id="b">B</p>
```

**Answer:** `#a` is `rgb(255, 0, 0)`: the animation origin beats normal author declarations. `#b` is `rgb(0, 128, 0)`: important author declarations beat animations. Chrome 155 and Firefox 158 agreed.
