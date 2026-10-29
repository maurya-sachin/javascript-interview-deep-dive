---
title: "How do CSS transitions work, and how do you transition `display` or an element's entry?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [transitions, starting-style, transition-behavior, allow-discrete, display]
related:
  - html-and-css/typography-colour-motion/keyframe-animations
  - html-and-css/modern-css/registered-properties
  - html-and-css/the-cascade/important-reverses-order
  - html-and-css/positioning-and-stacking/top-layer
verified: 2026-10
perishable:
  - "Firefox 159 doesn't transition display; MDN marks allow-discrete partial"
  - "overlay transitions: Chrome 117 only"
  - "interpolate-size / calc-size(): Chrome 129 only"
sources:
  - https://www.w3.org/TR/css-transitions-1/#starting
  - https://www.w3.org/TR/css-transitions-1/#reversing
  - https://www.w3.org/TR/css-transitions-1/#transition-events
  - https://drafts.csswg.org/css-transitions-2/#event-dispatch
  - https://drafts.csswg.org/css-transitions-2/#transitionable
  - https://drafts.csswg.org/css-transitions-2/#transition-behavior-property
  - https://drafts.csswg.org/css-transitions-2/#defining-before-change-style
  - https://www.w3.org/TR/css-display-4/#display-animation
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transition-behavior#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/interpolate-size#browser_compatibility
tldr: >
  A transition starts when a style change gives a property a new computed value, the property is
  listed in `transition-property` with a duration plus delay above zero, and both values can
  interpolate. It needs a previous style, so entry needs `@starting-style`. Discrete properties like
  `display` need `transition-behavior: allow-discrete`; `display` then stays visible until the end.
---

## Answer

A transition animates a property from its old computed value to its new one when a style change happens. At each **style change event** the browser compares the **before-change style** (last frame's values) with the **after-change style** (the new ones) and starts a transition for a property only if:

- the value changed and both values can interpolate,
- `transition-property` lists it (or `all`),
- the duration plus delay is above `0s`.

It's driven by *changes*: nothing runs on page load or on an element that just appeared, because there's no before-change style to start from.

Two additions in CSS Transitions 2 cover the cases that used to need JavaScript:

- **`@starting-style`** supplies the start values for an element with no before-change style, i.e. one just inserted or one changing from `display: none`. The rules inside cascade like normal rules but only feed the starting style.
- **`transition-behavior: allow-discrete`** lets discrete properties (ones with no in-between values) transition. They flip at 50%, except `display`, which borrows `visibility`'s rule: between `none` and a visible value it stays visible for the whole transition, so a fade-out stays on screen until it ends.

So a fade-in and fade-out for a toggled element is:

```css
.panel { opacity: 1; transition: opacity 0.4s, display 0.4s allow-discrete; }
.panel[hidden] { display: none; opacity: 0; }
@starting-style { .panel { opacity: 0; } }
```

On show, `@starting-style` gives opacity a starting 0. On hide, `display: none` is held back until the end, so opacity can fade. Top-layer elements also need `overlay 0.4s allow-discrete`. `transition-behavior` and `@starting-style` shipped in Chrome 117 and Safari 17.4–17.5; Firefox 129 added both but, as of Firefox 159, doesn't transition `display`, so its exit simply cuts.

## Example

```html
<style>
  .panel { opacity: 1; transition: opacity 0.4s linear, display 0.4s allow-discrete; }
  .panel[hidden] { display: none; opacity: 0; }
  @starting-style { .panel { opacity: 0; } }
</style>
<div class="panel" hidden>Panel</div>
<script>
  const panel = document.querySelector(".panel");
  const seek = (ms) => {
    const transitions = panel.getAnimations();
    for (const transition of transitions) transition.currentTime = ms;
    const { display, opacity } = getComputedStyle(panel);
    return `${transitions.map((t) => t.transitionProperty)} | ${display} ${opacity}`;
  };
  panel.hidden = false;
  console.log(seek(100));
  // → opacity | block 0.25
  console.log(seek(400));
  // → opacity | block 1
  panel.hidden = true;
  console.log(seek(100));
  // → display,opacity | block 0.75
  console.log(seek(400));
  // → display,opacity | none 0
</script>
```

Output from Chrome 156. Firefox 159 matched on show but started no transition on hide: both lines printed ` | none 0`.

## Pitfalls

- Inserting an element and changing its class in the same task. There's no before-change style, so nothing transitions (`getAnimations()` was empty in both browsers); use `@starting-style` instead of forcing a reflow.
- Transitioning `height` to `auto`. Keywords don't interpolate, so it jumps; `interpolate-size: allow-keywords` fixes it in Chrome 129+ only, so other browsers need a fallback such as a measured pixel height.
- Listening for `transitionend` to clean up. A transition that's interrupted, overridden by `transition: none` or hidden with `display: none` fires `transitioncancel` instead; Firefox 159 fired nothing for one cancelled before its first frame.
- `transition: all … allow-discrete`. Every discrete property change now waits until 50%, including ones you never meant to animate.

## Follow-ups

**Q:** What happens when you reverse a transition halfway?
**A:** The running one is cancelled and a new one starts from the current value, shortened by how far the first had got. Paused at 25% of a 1s `width` transition and reversed, the new one lasted 250ms in both browsers.

**Q:** Does a `0s` duration with a delay transition?
**A:** Yes. The rule is duration plus delay above zero, so `width 0s 0.1s` created a transition that jumps after 100ms; `width 0s` created none.

**Q:** Where do transitions sit in the cascade?
**A:** In their own origin above `!important` author declarations, so a transition still runs on an `!important` value. Keyframe animations sit below important declarations.

## Deep dive

### How it works

Transitions are bookkeeping around style change events. For each element and longhand property the browser keeps at most one **running transition** and one **completed transition**. When style is recalculated:

1. **Before-change style** is the computed style from the previous style change event, with running animations and transitions advanced to the current time.
2. **After-change style** is the new computed style, without any transitions.
3. For each longhand, the browser finds the **matching `transition-property`** value (the last one in the list that matches), and through it the matching duration, delay, timing function and behaviour by list position.
4. If there's no running transition, the values differ, they're **transitionable**, the completed transition (if any) didn't already end at this value, there's a matching entry, and duration plus delay is above zero, a new transition starts. Its start time is now plus the delay.

"Transitionable" means the animation type is neither "not animatable" nor "discrete", or, in Transitions 2, discrete with `allow-discrete`. Some pairs are discrete even when the property isn't: `box-shadow` between an `inset` and a non-inset shadow can't interpolate. Custom properties are discrete unless registered with a type through `@property`.

A running transition is a `CSSTransition` object, visible through `element.getAnimations()`. Its effect writes into the **transitions origin** of the cascade, which sits above even `!important` author rules; that's what lets a transition animate a value the author marked important. You can pause it and set `currentTime`, which is how the example inspects mid-flight values deterministically.

**Starting style.** An element that wasn't rendered in the previous style change event (just inserted, or coming from `display: none`) has no before-change style. If `@starting-style` rules match it, the browser computes a **starting style** (after-change style plus those rules) and compares that instead. The rules inherit from the parent's after-change style and don't win by position: they cascade normally, so a more specific rule outside `@starting-style` can override them.

**Discrete values.** With `allow-discrete`, a discrete property's transition holds the start value until 50% progress and then switches. In Chrome 156 and Firefox 159, `text-align: left` to `right` over a 1s linear transition read `left` at 400ms and `right` at 600ms. `display` borrows the rule `visibility` already has: for progress strictly between 0 and 1, the interpolated value is the visible one. That gives "visible for the whole duration" in both directions, and CSS Display 4 makes the element inert while its real value is `none`.

**Events.** Four events report a transition's lifecycle: `transitionrun` when it's created (still in its delay), `transitionstart` when the delay ends, `transitionend` when it completes and `transitioncancel` when it's removed early. Each carries `propertyName` and `elapsedTime`. They're dispatched at animation-frame time, not synchronously.

### Edge cases

**Reversing.** Toggling a hover state back halfway shouldn't take the full duration to return. When a running transition's end value no longer matches but the new after-change value equals its *start* value, the browser starts the reverse transition with a **reversing shortening factor** that scales duration by how much of the first transition completed:

```js
box.classList.add("wide");            // width 100px → 200px over 1s linear
const [first] = box.getAnimations();
first.pause();
first.currentTime = 250;              // width is 125px
box.classList.remove("wide");
const [second] = box.getAnimations();
console.log(second.effect.getComputedTiming().duration);
// → 250
```

Chrome 156 and Firefox 159 agreed; `first` was cancelled (`playState` `idle`).

**Cancellation.** The browser cancels a running transition when the property drops out of `transition-property` (including `transition: none`, which jumps straight to the end value), when the element stops being rendered (`display: none`) or leaves the document. Cancellation fires `transitioncancel` only if the transition had already dispatched events. For one started and cancelled in the same task, before any frame, Chrome 156 still fired `transitioncancel` and Firefox 159 fired nothing; Firefox follows the event-dispatch table, where an `idle` to `idle` phase change dispatches nothing. The table guarantees exactly one `transitionend` or `transitioncancel` per `transitionrun`, so pair cleanup with `transitionrun` rather than with the class change.

**Delay-only transitions.** `transition: width 0s 0.1s` is valid and creates a `CSSTransition` (one entry in `getAnimations()` in both browsers), so the value jumps after 100ms.

**Inherited properties.** One change can start transitions on an ancestor and a descendant at once; the completed-transitions set exists so a child with a shorter duration doesn't keep restarting while the parent's transition is still feeding it new values.

**Intrinsic sizes.** `height: auto` isn't interpolable. Chrome 129 added `interpolate-size: allow-keywords` (and `calc-size()`); Firefox 159 doesn't support it, so plan a fallback.

### Real-world scenario

A toast or menu built on the popover API needs an entry and exit fade. Exiting a popover removes it from the top layer, which would otherwise clip the fade and stack it under the page, so `overlay` joins `display` in the discrete list:

```css
[popover] {
  opacity: 1;
  transition: opacity 0.2s, display 0.2s allow-discrete, overlay 0.2s allow-discrete;
}
[popover]:not(:popover-open) { opacity: 0; }
@starting-style { [popover]:popover-open { opacity: 0; } }
```

After `hidePopover()` in Chrome 156, `:popover-open` no longer matched, but transitions for `display`, `opacity` and `overlay` were running; halfway through, `display` was `block`, opacity `0.5`, and `overlay` still `auto`. Firefox 159 doesn't support `overlay` and started no transition on hide, so the popover vanished at once while the entry fade still worked. That degrades acceptably, so the pattern needs no fallback. The same shape works for `<dialog>` with `[open]`.

### Trade-offs

Transitions suit **state changes**: one start and one end value, triggered by a class, attribute or pseudo-class, with reversing for free. They can't loop, run without a trigger, or pass through intermediate keyframes; that's `@keyframes`. They also restart from wherever the value is, which keyframe animations don't, so interrupted hover effects look smooth.

`@starting-style` plus `allow-discrete` replaces the old pattern of removing `display: none`, forcing a reflow with `offsetWidth`, then adding the class. The CSS version is declarative and runs in the browser's normal style pass, but its exit half depends on `display` transitions, which Firefox 159 doesn't do yet; design so a cut is acceptable.

Which properties are cheap to animate is a rendering question (`opacity` and `transform` usually avoid layout), covered in the web-performance topic; honouring `prefers-reduced-motion` belongs to the accessibility topic.
