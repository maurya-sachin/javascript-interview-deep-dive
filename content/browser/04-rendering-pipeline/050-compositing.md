---
title: "What is compositing, and why do `transform` and `opacity` animate cheaply?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [compositing, compositor-thread, layers, will-change, transform, opacity, animation-performance]
related:
  - browser/rendering-pipeline/pixel-pipeline
  - browser/rendering-pipeline/forced-synchronous-layout
  - html-and-css/positioning-and-stacking/stacking-contexts
  - html-and-css/typography-colour-motion/keyframe-animations
  - html-and-css/typography-colour-motion/transitions-and-discrete-properties
verified: 2026-10
perishable:
  - Chrome 156 layer promotion reasons and trace counts
  - Compositor animation demo checked in Chrome 156 only
sources:
  - https://developer.chrome.com/docs/chromium/renderingng-architecture#pipeline
  - https://developer.chrome.com/blog/inside-browser-part3#compositing
  - https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count#manage_layers_and_avoid_layer_explosions
  - https://firefox-source-docs.mozilla.org/gfx/RenderingOverview.html#webrender
  - https://firefox-source-docs.mozilla.org/gfx/RenderingOverview.html#asynchronous-panning-and-zooming
  - https://firefox-source-docs.mozilla.org/devtools-user/page_inspector/how_to/work_with_animations/index.html#further-information-about-animation-compositing
  - https://drafts.csswg.org/css-will-change/#will-change
  - https://chromedevtools.github.io/devtools-protocol/tot/LayerTree/
tldr: >
  Compositing draws separately rasterized layers into each frame, applying their transforms,
  opacity and clips on the GPU. Neither `transform` nor `opacity` changes layout or an element's
  painted content, so on its own layer the compositor can animate them without the main thread.
  Layers are an engine detail: they cost memory, and a stacking context isn't one.
---

## Answer

**Compositing** is the last rendering stage. The browser keeps parts of the page as separately rasterized *layers* (GPU textures) and combines them into each frame, applying each layer's transform, opacity and clip as it draws. In Chromium a compositor thread does this from property trees and display lists the main thread committed; in Firefox, WebRender renders it, in a separate GPU process on platforms that use one. No spec defines layers: when an element gets one is engine behaviour.

`transform` and `opacity` are cheap because neither changes layout or the element's painted content. A transform moves the painted result, not the box, so nothing else reflows. On its own layer, a new frame is the same texture drawn at a new position or alpha. The compositor can then run a declarative animation (CSS, transitions, `element.animate()`) by itself, frame after frame, even while the main thread is busy. Firefox's DevTools mark such animations with a lightning bolt.

Other properties cost more. Animating `width` or `margin-left` reruns layout and paint every frame; `background-color` repaints; `left` and `top` skipped layout in Chrome 156 but still ran on the main thread. All of them need the main thread for every frame, so a long task freezes them.

When an element gets a layer is engine behaviour too. Chrome promotes an element while a `transform` or `opacity` animation is running, and for `will-change: transform` or `opacity` ahead of time. Each layer costs GPU memory and texture uploads, so promoting everything backfires.

A **stacking context is not a layer**. Stacking contexts group paint order and are defined by CSS; `opacity: 0.5` and `z-index: 1` each create one, yet in Chrome 156 neither got its own composited layer. Layers are how an engine caches and moves pixels.

## Example

```html
<style>
  .box { position: relative; left: 0; width: 40px; height: 40px; }
  #by-transform { background: red; animation: slide-transform 2s linear infinite alternate; }
  #by-left { background: blue; animation: slide-left 2s linear infinite alternate; }
  @keyframes slide-transform { to { transform: translateX(300px); } }
  @keyframes slide-left { to { left: 300px; } }
</style>
<div class="box" id="by-transform"></div>
<div class="box" id="by-left"></div>
<script>
  setTimeout(() => {
    const end = performance.now() + 1000;
    while (performance.now() < end) {} // the main thread does nothing else
  }, 400);
</script>
```

Recorded with the Chrome DevTools Protocol's screencast in Chrome 156 (three runs): over the 59 frames during the 1 s block, the `transform` box moved from about 70 px to 215 px, while the `left` box stayed at 65–68 px, then jumped to 215–218 px in the first frame after. Headless Firefox can't capture frames while the main thread is blocked, so this was checked in Chrome only.

## Pitfalls

- Treating `will-change` or `translateZ(0)` as a free speed-up. Every promoted element is another texture in GPU memory; add `will-change` shortly before an animation and remove it afterwards.
- Assuming JavaScript-driven animations get the same benefit. Setting `style.transform` from `requestAnimationFrame` needs the main thread every frame; only declarative animations can run on the compositor.
- Moving things with `top`, `left` or `margin` "because it's simpler". They depend on the main thread every frame; `transform: translate()` doesn't.
- Calling every stacking context a layer, or expecting `z-index` to give an element its own layer.

## Follow-ups

**Q:** Does `will-change: transform` change how the page looks?
**A:** It can. The spec requires `will-change` on a property to create a stacking context, and a containing block for positioned descendants, whenever a real value of that property would. Layer promotion is only a hint the browser may take.

**Q:** Does compositing help scrolling too?
**A:** Yes. Chromium can scroll on the compositor thread by updating a scroll offset in the property trees, and Firefox's Asynchronous Panning and Zooming shifts already-rasterized content, without waiting for the main thread in the common case.

**Q:** Do transitions of `transform` get the same treatment?
**A:** Yes. In Chrome 156 a running `transform` transition promoted the element to its own layer with the reason "Has an active accelerated transform animation or transition", the same as a keyframe animation.

## Deep dive

### Edge cases

Main-thread layout and paint events in Chrome 156, counted in a performance trace over 60 frames of a CSS animation on a relatively positioned box (identical across three runs):

| Animated property | Layout events | Paint events |
|---|---|---|
| `transform` | 1 | 3 |
| `opacity` | 1 | 2 |
| `left` | 1 | 2 |
| `margin-left` | 59 | 118 |
| `width` | 59 | 118 |
| `background-color` | 0 | 120 |

- **`left` and `top` in Chrome.** On a positioned box they produced no per-frame layout or paint events in this trace. They still ran style and pre-paint on the main thread every frame, which is why the example froze.
- **Layer promotion in Chrome 156**, read with the DevTools Protocol's `LayerTree` domain: `will-change: transform`, `will-change: opacity`, `transform: translateZ(0)` and running `transform` or `opacity` animations each gave the box its own layer. `transform: translateX(10px)`, `opacity: 0.5`, `z-index: 1`, `isolation: isolate`, `will-change: left` and a running `left` animation didn't.
