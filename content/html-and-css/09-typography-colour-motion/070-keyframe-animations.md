---
title: "How do `@keyframes` animations differ from transitions?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [animations, keyframes, animation-fill-mode, animation-composition, animation-events]
related:
  - html-and-css/typography-colour-motion/transitions-and-discrete-properties
  - html-and-css/the-cascade/important-reverses-order
  - html-and-css/modern-css/registered-properties
verified: 2026-10
perishable:
  - "animationcancel fully supported: Chrome 145, Firefox 54, Safari 13.1"
sources:
  - https://www.w3.org/TR/css-animations-1/#keyframes
  - https://www.w3.org/TR/css-animations-1/#animation-fill-mode
  - https://www.w3.org/TR/css-animations-1/#animation-iteration-count
  - https://www.w3.org/TR/css-animations-1/#events
  - https://drafts.csswg.org/css-animations-2/#animation-composition
  - https://drafts.csswg.org/css-animations-2/#event-dispatch
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-composition#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/API/Element/animationcancel_event#browser_compatibility
tldr: >
  A transition is implicit: it runs between an old and a new value when something changes. A
  keyframe animation is explicit: it runs whenever `animation-name` applies, through any number of
  keyframes, with delays, repeats and direction. Outside its active time it has no effect unless
  `animation-fill-mode` says so, and it stops, rather than reverses, when removed.
---

## Answer

**Transitions** react to a change: two values (before and after), one trigger, automatic reversing. **Animations** are declared: `@keyframes` names a sequence of states and `animation` runs it on any element it applies to, including on page load or insertion, with no change needed.

What animations add:

- **Keyframes.** `from`/`to` or percentages, each with its own `animation-timing-function`. A missing `0%` or `100%` keyframe is built from the element's computed value, so `@keyframes grow { to { scale: 1.2 } }` starts from wherever the element is. `!important` inside a keyframe is ignored.
- **Repetition.** `animation-iteration-count` (`infinite` for loops) and `animation-direction` (`alternate` swings back and forth).
- **Fill modes.** The default `animation-fill-mode: none` means the animation affects nothing during its delay or after it ends: the element snaps back to its own value. `backwards` applies the first keyframe during the delay, `forwards` holds the last one after the end, `both` does both.
- **Composition.** `animation-composition: add` (Chrome 112, Firefox 115, Safari 16) adds keyframe values to the underlying value instead of replacing it, so two animations on `transform` can stack.
- **Events.** `animationstart`, `animationiteration`, `animationend`, and `animationcancel` when it's removed early.

Lifecycle differences matter. Removing the class (or `animation-name`) cancels the animation and the value jumps back; there's no reverse like a transition's. Changing duration or other `animation-*` values updates the running animation without restarting it. `display: none` cancels it, and showing the element again starts it over.

In the cascade, animations sit above normal author declarations but below `!important` ones; transitions sit above `!important`.

Pick a transition for state changes (hover, open/closed) and a keyframe animation for anything that loops, plays on arrival, or needs more than two steps.

## Example

```html
<style>
  @keyframes slide { from { margin-left: 0px; } to { margin-left: 100px; } }
  p { margin-left: 50px; animation: slide 1s linear 0.5s; }
  .both { animation-fill-mode: both; }
</style>
<p class="none">none</p>
<p class="both">both</p>
<script>
  const at = (selector, ms) => {
    const element = document.querySelector(selector);
    for (const animation of element.getAnimations()) animation.currentTime = ms;
    return getComputedStyle(element).marginLeft;
  };
  console.log(at(".none", 250), at(".none", 1250), at(".none", 1600));
  // → 50px 75px 50px
  console.log(at(".both", 250), at(".both", 1250), at(".both", 1600));
  // → 0px 75px 100px
</script>
```

Chrome 156 and Firefox 159 agreed. At 250ms the animation is in its delay, at 1250ms it's three-quarters through, at 1600ms it has ended; with `fill-mode: none` the element shows its own `50px` outside the active time.

## Pitfalls

- Using `forwards` to set a final state. The filled value keeps winning over normal declarations: setting `margin-left: 10px` inline afterwards still computed `100px`; only `!important` got through. Set the end state in a class instead.
- Expecting re-adding the same class to replay the animation. It doesn't; remove it, force a style recalculation, then add it back, or seek the `CSSAnimation` from `getAnimations()`.
- Putting `!important` in keyframes. That declaration is dropped from the keyframe, and an `!important` author rule beats the animation anyway.
- Animating `margin` or `width` for movement. It works, but `transform` usually avoids layout work; that's covered in the web-performance topic.

## Follow-ups

**Q:** What does `alternate` with three iterations do?
**A:** Odd iterations run forwards, even ones backwards. For a 1s `0px`→`100px` slide, 250ms read `25px`, 1250ms `75px` and 2250ms `25px`; at 3000ms it had ended and showed the element's own value.

**Q:** When does `animationcancel` fire?
**A:** When a running animation stops early: its `animation-name` no longer applies (a removed class, `animation: none`) or the element gets `display: none`. Chrome 156 and Firefox 159 fired it for both `animation: none` and `display: none` set 150ms into a 1s animation, and no `animationend` followed.

**Q:** Can a keyframe animation move a custom property smoothly?
**A:** Only if it's registered with `@property` and a type such as `<length>`. Over a 1s linear `0px`→`100px` animation, a registered one read `40px` at 400ms and `60px` at 600ms; an unregistered one flipped from `0px` to `100px` at the halfway point.

## Exercises

### What does each element compute at 500ms?

```html
<style>
  @keyframes slide { from { margin-left: 0px; } to { margin-left: 100px; } }
  div { margin-left: 50px; animation: slide 1s linear; }
  .important { margin-left: 50px !important; }
  .add { animation-composition: add; }
</style>
<div class="important"></div>
<div class="add"></div>
```

**Answer:** `.important` stays at `50px`: important author declarations beat animations. `.add` computes `100px`: the keyframe's `50px` is added to the underlying `50px`. Chrome 156 and Firefox 159 agreed.
