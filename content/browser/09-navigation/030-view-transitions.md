---
title: "How do View Transitions work within a page and across pages?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [view-transitions, start-view-transition, view-transition-name, animation, navigation]
related:
  - browser/navigation/navigation-api
  - browser/navigation/history-api-routing
  - html-and-css/typography-colour-motion/keyframe-animations
  - html-and-css/typography-colour-motion/transitions-and-discrete-properties
  - browser/rendering-pipeline/compositing
  - browser/html-event-loop/rendering-steps
verified: 2026-10
perishable:
  - "startViewTransition(): Chrome 111, Firefox 144, Safari 18"
  - "Cross-document @view-transition: Chrome 126, Safari 18.2; not Firefox 159"
sources:
  - https://drafts.csswg.org/css-view-transitions-1/#lifecycle
  - https://drafts.csswg.org/css-view-transitions-1/#dom-document-startviewtransition
  - https://drafts.csswg.org/css-view-transitions-1/#setup-view-transition
  - https://drafts.csswg.org/css-view-transitions-1/#capture-the-old-state
  - https://drafts.csswg.org/css-view-transitions-1/#view-transition-pseudos
  - https://drafts.csswg.org/css-view-transitions-1/#propdef-view-transition-name
  - https://drafts.csswg.org/css-view-transitions-1/#dom-viewtransition-skiptransition
  - https://drafts.csswg.org/css-view-transitions-2/#cross-doc-lifecycle
  - https://drafts.csswg.org/css-view-transitions-2/#view-transition-rule
  - https://drafts.csswg.org/css-view-transitions-2/#navigation-can-trigger-a-cross-document-view-transition
  - https://drafts.csswg.org/css-view-transitions-2/#resolve-inbound-cross-document-view-transition
  - https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering
  - https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition#browser_compatibility
tldr: >
  `document.startViewTransition(update)` captures the old rendering, pauses rendering, runs `update`
  to change the DOM, captures the new state, then animates pseudo-elements from old to new: a
  cross-fade by default, and a size-and-position morph for each element with a unique
  `view-transition-name`. Across same-origin pages, both opt in with `@view-transition { navigation: auto; }`.
---

## Answer

A view transition animates between two states of the page without you keeping both in the DOM. The browser takes pictures and animates those.

**Within a page**, `document.startViewTransition(updateCallback)`:

1. At the next rendering step, captures the old state: an image of the page, plus a separate image and box of every element with a `view-transition-name`.
2. Pauses rendering, so the user keeps seeing the old frame, and calls your callback, which changes the DOM (sync or async).
3. When the callback's promise settles, captures the new state and builds a pseudo-element tree over the page: `::view-transition` › `::view-transition-group(name)` › `::view-transition-image-pair(name)` › `::view-transition-old(name)` and `::view-transition-new(name)`. The root is named `root` by default.
4. Resumes rendering and animates. By default, old fades out, new fades in, and each group animates from the old size and position to the new one. They're ordinary CSS animations, so you restyle them with `animation` on those pseudo-elements.

The returned `ViewTransition` has three promises: `updateCallbackDone` (the DOM change finished), `ready` (pseudo-elements exist, animations about to run) and `finished`. `skipTransition()` skips the animation; the callback still runs.

**Across pages**, add `@view-transition { navigation: auto; }` to both documents. On a same-origin navigation the old page is captured before it's swapped out, and the new page animates in on its first rendering opportunity. Names match across the two pages. `pageswap` (old page) and `pagereveal` (new page) expose the `ViewTransition` for customising. Reloads, cross-origin navigations and URLs typed in the address bar don't transition; back and forward do.

Support: same-document since Chrome 111, Firefox 144 and Safari 18; cross-document in Chrome 126 and Safari 18.2, not in Firefox 159.

## Example

```html
<style>
  .card { view-transition-name: card; width: 100px; }
  .card.big { width: 300px; }
  ::view-transition-group(card) { animation-duration: 0.3s; }
</style>
<div class="card">Card</div>

<script type="module">
  const card = document.querySelector('.card');
  const transition = document.startViewTransition(() => {
    card.classList.add('big'); // runs after the old state is captured
    console.log('updated');
  });
  console.log('started');
  // → started

  await transition.updateCallbackDone;
  // → updated
  await transition.ready; // pseudo-elements built, animations created
  const pseudos = new Set(document.getAnimations().map((a) => a.effect.pseudoElement));
  console.log([...pseudos].filter((name) => name.includes('group')).sort().join(' '));
  // → ::view-transition-group(card) ::view-transition-group(root)

  await transition.finished;
  console.log('finished', document.getAnimations().length);
  // → finished 0
</script>
```

Chrome 156 and Firefox 159 printed the same. `requestAnimationFrame` callbacks didn't run at all while a 200 ms update callback was pending: the event loop skips documents whose rendering is suppressed for a view transition.

## Pitfalls

- Giving two rendered elements the same `view-transition-name`. The whole transition is skipped: `ready` rejects with `InvalidStateError`, though the DOM update still runs.
- Slow update callbacks. The page is frozen on the old frame until the callback settles; fetch data first, then start the transition.
- Expecting cross-document transitions from one side. If the new page doesn't opt in, the old page's `pageswap` reports a transition but the new page's `pagereveal` gets none (Chrome 156).
- Ignoring `prefers-reduced-motion`. Put the `@view-transition` rule or your animation styles inside a media query.

## Follow-ups

**Q:** What happens if you start a second transition before the first finishes?
**A:** The first is skipped with `AbortError`: its `ready` rejects, its callback still runs and its `finished` resolves. Then the second runs normally (Chrome 156 and Firefox 159).

**Q:** Are the old and new layers live?
**A:** The old one is a captured image; the new one shows the new state as it renders. Both are replaced elements, so `object-fit` and similar properties apply. Animating them doesn't re-lay out or repaint your real elements.

**Q:** How does a router use it?
**A:** It wraps the DOM update: inside the `intercept()` handler, or in place of rendering right after `pushState()`, call `document.startViewTransition(() => render(url))`.

## Exercises

### What does this log?

```js
// Two visible elements both have view-transition-name: card.
const transition = document.startViewTransition(() => console.log('update'));
transition.ready.catch((error) => console.log('ready', error.name));
transition.finished.then(() => console.log('finished'));
```

**Answer:** `ready InvalidStateError`, `update`, `finished`. Capturing the old state fails on the duplicate name, so the transition is skipped before the callback runs, but the callback still runs and `finished` resolves (Chrome 156 and Firefox 159; Chrome also logs a console message).
