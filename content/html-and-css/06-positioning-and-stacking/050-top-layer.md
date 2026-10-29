---
title: "What is the top layer, and how do dialogs and popovers escape `z-index` and `overflow`?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [top-layer, backdrop, overlay, dialog, popover, stacking-context]
related:
  - html-and-css/positioning-and-stacking/stacking-contexts
  - html-and-css/positioning-and-stacking/transform-breaks-fixed
  - html-and-css/positioning-and-stacking/anchor-positioning
  - html-and-css/forms-dialog-popover/dialog-element
  - html-and-css/forms-dialog-popover/popover-attribute
verified: 2026-10
perishable:
  - "`overlay` in Chrome 117; not in Firefox 158 or Safari"
sources:
  - https://drafts.csswg.org/css-position-4/#top-layer
  - https://drafts.csswg.org/css-position-4/#top-styling
  - https://drafts.csswg.org/css-position-4/#backdrop
  - https://drafts.csswg.org/css-position-4/#overlay
  - https://drafts.csswg.org/css-position-4/#painting-order
  - https://html.spec.whatwg.org/multipage/interactive-elements.html#dom-dialog-showmodal
  - https://html.spec.whatwg.org/multipage/popover.html#dom-showpopover
  - https://html.spec.whatwg.org/multipage/rendering.html#flow-content-3
  - https://fullscreen.spec.whatwg.org/#dom-element-requestfullscreen
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overlay#browser_compatibility
tldr: >
  The top layer is a document-level list of elements painted after the whole page, each as if it
  were a sibling of the root. `showModal()`, `showPopover()` and fullscreen put elements there, so
  no ancestor's `z-index`, `transform`, `opacity` or `overflow` can bury or clip them. Order is
  last-opened on top, and each gets a `::backdrop` beneath it.
---

## Answer

The **top layer** is an ordered set of elements that the browser paints *after* the document. When an element is rendered in it, CSS Positioned Layout 4 says:

- It generates boxes **as if it were a sibling of the root element**, not where it sits in the DOM.
- It's its own stacking context whose parent is the root stacking context, painted atomically above the document. Ancestors' `overflow`, `opacity`, `transform`, `filter` and `z-index` can't touch it.
- Its containing block is the viewport if it's `position: fixed`, otherwise the initial containing block. A `position` other than `absolute` or `fixed` computes to `absolute`.
- Top-layer elements are painted in the order they were added: **the last one opened is on top**. `z-index` doesn't reorder them.

Authors can't put elements there directly. The HTML and Fullscreen APIs do it: `dialog.showModal()`, `showPopover()` (or a `popovertarget` button), and `requestFullscreen()`. `dialog.show()` and the `open` attribute don't; that dialog is laid out in place and gets buried like anything else.

Each element rendered in the top layer has a **`::backdrop`** pseudo-element, painted directly beneath it and above everything earlier. The UA gives it `position: fixed; inset: 0`; HTML styles a modal dialog's backdrop `rgba(0, 0, 0, 0.1)` and a popover's transparent with `pointer-events: none`.

Leaving is the subtle part. Closing takes the element out of the top layer at the next rendering update, which cuts off exit animations. The **`overlay`** property, set only by the browser, says whether an element in the top layer is actually rendered there. Authors can transition it with `transition: overlay 0.3s allow-discrete` (alongside `display`) so the element stays on top until its fade-out finishes. Chrome supports `overlay` since 117; Firefox 158 and Safari don't, and there the element drops out of the top layer immediately.

## Example

```html
<style>
  body { margin: 0; }
  .card { position: relative; z-index: -1; transform: scale(1); overflow: hidden; width: 50px; height: 50px; }
  .banner { position: fixed; inset: 0; z-index: 2147483647; }
  dialog { width: 200px; height: 100px; padding: 0; border: 0; }
</style>
<div class="card">
  <dialog id="inline"></dialog>
  <dialog id="modal"></dialog>
</div>
<div class="banner" id="banner"></div>
<script>
  const hit = (el) => {
    const { left, top } = el.getBoundingClientRect();
    return document.elementFromPoint(left + 10, top + 10).id;
  };
  const inline = document.getElementById("inline");
  inline.show();
  console.log("show()", getComputedStyle(inline).position, hit(inline));
  inline.close();
  const modal = document.getElementById("modal");
  modal.showModal();
  console.log("showModal()", getComputedStyle(modal).position, hit(modal), document.elementFromPoint(5, 5).id);
  // → show() absolute banner
  // → showModal() fixed modal modal
</script>
```

Chrome 156 and Firefox 158 agreed. The `show()` dialog stays inside a negative-`z-index`, transformed, clipping card and loses to the banner. The modal escapes all three and beats the maximum `z-index`. Hitting the corner returns `modal` too: its `::backdrop` covers the viewport, and a pseudo-element hit-tests as its element.

## Pitfalls

- Using `z-index` to order two open popovers. A popover with `z-index: 999` opened first lay *under* one with `z-index: 1` opened second; hiding and reopening the first put it on top.
- Expecting the top layer to override `display: none` on an ancestor. A popover inside a hidden `<div>` reported `:popover-open` but had a `0` width.
- Using `show()` and expecting overlay behaviour. Only `showModal()` uses the top layer; a non-modal dialog is clipped and stacked by its ancestors.
- Writing an exit animation without `overlay`. In Chrome 156, with `display` alone transitioned, a fading popover kept `display: block` but fell below a `z-index: 10` banner for the rest of the transition; adding `overlay … allow-discrete` kept it on top.

## Follow-ups

**Q:** Can you set `overlay: auto` yourself?
**A:** No. The UA stylesheet has `* { overlay: none !important; }` and adds an `!important` `overlay: auto` rule for each top-layer element. Authors can only control *when* the value flips by transitioning it.

**Q:** What's the containing block of a popover inside a transformed ancestor?
**A:** The viewport, because popovers are `position: fixed` by default and top-layer rendering ignores ancestors. Anchor positioning is the way to place it next to its invoker again.

**Q:** Where does the top layer sit relative to the root stacking context?
**A:** Above it. The document paints the root's stacking context first, then each top-layer element's `::backdrop` and the element itself, in top-layer order.

## Exercises

### Which popover is on top?

```html
<style>
  [popover] { inset: 0; width: 100px; height: 100px; margin: 0; padding: 0; border: 0; }
  #first { z-index: 999; }
  #second { z-index: 1; }
</style>
<div id="first" popover="manual"></div>
<div id="second" popover="manual"></div>
<script>
  document.getElementById("first").showPopover();
  document.getElementById("second").showPopover();
  console.log(document.elementFromPoint(50, 50).id);
  document.getElementById("first").hidePopover();
  document.getElementById("first").showPopover();
  console.log(document.elementFromPoint(50, 50).id);
</script>
```

**Answer:** `second`, then `first`. Top-layer order is the order elements were added, and reopening appends `first` again at the end; `z-index` plays no part.
