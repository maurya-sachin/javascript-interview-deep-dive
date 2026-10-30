---
title: "Which page lifecycle events can you rely on when a page is hidden or closed?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [page-lifecycle, visibilitychange, pagehide, beforeunload, freeze]
related:
  - browser/navigation/back-forward-cache
  - browser/network-apis/sending-data-on-exit
  - browser/navigation/history-api-routing
verified: 2026-10
perishable:
  - "freeze/resume and wasDiscarded: Chromium only (Chrome 68+)"
  - Chrome 155+ doesn't run unload handlers by default
  - Event orders observed in Chrome 156 and Firefox 159
sources:
  - https://html.spec.whatwg.org/multipage/interaction.html#page-visibility
  - https://html.spec.whatwg.org/multipage/interaction.html#update-the-visibility-state
  - https://html.spec.whatwg.org/multipage/document-lifecycle.html#unload-a-document
  - https://html.spec.whatwg.org/multipage/browsing-the-web.html#checking-if-unloading-is-canceled
  - https://wicg.github.io/page-lifecycle/#sec-lifecycle-states
  - https://wicg.github.io/page-lifecycle/#dom-document-onfreeze
  - https://developer.chrome.com/docs/web-platform/page-lifecycle-api#states
  - https://developer.chrome.com/docs/web-platform/page-lifecycle-api#the_beforeunload_event
  - https://developer.chrome.com/docs/web-platform/deprecating-unload
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event#browser_compatibility
tldr: >
  `visibilitychange` to `"hidden"`: it fires on tab switches, minimising, navigation and closing,
  and on mobile it's often the last event before the page is killed. Save state there. `pagehide`
  marks leaving the page (`persisted` says it may come back). `beforeunload` is only for an
  unsaved-changes prompt. `unload` is unreliable, and Chrome no longer runs it by default.
---

## Answer

Think of the page as going through states (visible, hidden, frozen, gone) rather than as getting one "goodbye" event.

- **`visibilitychange`** (on `document`) fires whenever `document.visibilityState` flips between `"visible"` and `"hidden"`: tab switches, minimising, locking the phone, and also navigating away and closing. Chrome's lifecycle docs call `"hidden"` often the last state change you can observe, especially on mobile, where the OS can kill a backgrounded browser without firing `beforeunload`, `pagehide` or `unload`. Save drafts and flush analytics here; the page may also come back, so make it repeatable.
- **`pagehide`** fires when the page is being left: navigation, reload or close, but not a tab switch. `event.persisted` is `true` if it may enter the back/forward cache, so don't treat it as the end.
- **`beforeunload`** exists for one job: asking "leave with unsaved changes?". Call `event.preventDefault()` (or set `returnValue` to a non-empty string). Browsers show their own text, never yours, and only if the user has interacted with the page. Add the listener only while there are unsaved changes.
- **`unload`** fires last, only when the page won't be cached. It's often skipped on mobile, keeps the page out of the back/forward cache where it runs, and Chrome's docs say it stopped running by default in Chrome 155. Don't use it.
- **`freeze`** and **`resume`** (on `document`) come from the WICG Page Lifecycle draft and exist only in Chromium. Chrome's docs say it freezes hidden pages to save resources; Chrome 156 also fired `freeze` when a page entered the back/forward cache. After a discarded tab is reloaded, `document.wasDiscarded` is `true`.

On navigation, the HTML order is `beforeunload`, `pagehide`, `visibilitychange` to `"hidden"`, then `unload`.

## Example

```js
// The page has a <textarea>; saveDraft() stores its value.
let unsaved = false;
document.querySelector('textarea').addEventListener('input', () => { unsaved = true; });

document.addEventListener('visibilitychange', () => {
  console.log('visibilitychange', document.visibilityState);
  // → visibilitychange hidden
  if (document.visibilityState === 'hidden') saveDraft(); // can be the last event on mobile
});

addEventListener('pagehide', (event) => {
  console.log('pagehide', event.persisted);
  // → pagehide true
});

addEventListener('beforeunload', (event) => {
  console.log('beforeunload');
  // → beforeunload
  if (unsaved) event.preventDefault(); // asks only if the user has interacted with the page
});
```

Chrome 156 and Firefox 159 logged the same. Following a link: `beforeunload`, `pagehide true`, `visibilitychange hidden`; Chrome then fired `freeze` as the page entered the cache. Switching tabs and back: `visibilitychange hidden`, `visibilitychange visible`, nothing else. Closing the tab: `beforeunload`, `pagehide false`, `visibilitychange hidden`. After typing in the textarea, following the link showed a `beforeunload` prompt in both.

## Pitfalls

- Saving only in `pagehide` or `unload`. A tab switch fires neither, and a mobile browser killed in the background fires none of them.
- Expecting a custom `beforeunload` message. Chrome 156's dialog reported an empty message, Firefox 159's a fixed sentence, even with `returnValue = 'custom text'`.
- Relying on `beforeunload` firing. In Chrome 156 and Firefox 159 it fired without user interaction, but Chrome's docs warn that some browsers skip it for pages headed into the back/forward cache.
- Treating `visibilitychange` to `"hidden"` as the end. The user can switch back; the next `"visible"` may need to refresh data.

## Follow-ups

**Q:** In what order do the events fire when the user follows a link?
**A:** `beforeunload`, `pagehide`, `visibilitychange` (`"hidden"`), then `unload` if it runs. On restore from the back/forward cache, Chrome 156 fired `resume`, then `visibilitychange` (`"visible"`), then `pageshow` with `persisted: true`; Firefox 159 the same without `resume`.

**Q:** How do you test `freeze` and `resume`?
**A:** In Chrome, the DevTools protocol's `Page.setWebLifecycleState` with `"frozen"` then `"active"` fired both events on a hidden page. Firefox 159 has neither event, and `document.wasDiscarded` is `undefined` there.

**Q:** Where does sending the data belong?
**A:** In the `visibilitychange` (`"hidden"`) and `pagehide` handlers, using `navigator.sendBeacon()` or a keepalive `fetch()`, which outlive the page.
