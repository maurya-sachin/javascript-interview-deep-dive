---
title: "What is the back/forward cache, and what keeps a page out of it?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [bfcache, pageshow, pagehide, unload, performance]
related:
  - browser/navigation/page-lifecycle-events
  - browser/navigation/history-api-routing
  - browser/network-apis/sending-data-on-exit
  - browser/workers/cross-tab-communication
  - browser/storage/indexeddb-transactions
verified: 2026-10
perishable:
  - "Chrome 155+: unload handlers don't run unless Permissions-Policy re-enables them"
  - Chrome caches Cache-Control no-store pages; Firefox 159 doesn't
  - "notRestoredReasons: Chrome 125+ only"
  - Eligibility results from Chrome 156 and Firefox 159 under Puppeteer
sources:
  - https://html.spec.whatwg.org/multipage/document-lifecycle.html#unload-a-document
  - https://html.spec.whatwg.org/multipage/document-lifecycle.html#concept-document-salvageable
  - https://html.spec.whatwg.org/multipage/browsing-the-web.html#make-document-unsalvageable
  - https://html.spec.whatwg.org/multipage/browsing-the-web.html#reactivate-a-document
  - https://html.spec.whatwg.org/multipage/nav-history-apis.html#dom-pagetransitionevent-persisted
  - https://web.dev/articles/bfcache#never-use-the-unload-event
  - https://web.dev/articles/bfcache#avoid-window-opener
  - https://web.dev/articles/bfcache#close-open-connections
  - https://developer.chrome.com/docs/web-platform/deprecating-unload
  - https://developer.chrome.com/docs/web-platform/bfcache-ccns
  - https://chromedevtools.github.io/devtools-protocol/tot/Page/
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/unload_event#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming/notRestoredReasons#browser_compatibility
tldr: >
  The bfcache keeps a page you navigate away from alive but paused, so Back or Forward shows it
  instantly with its DOM and JS state intact. `pageshow` then has `persisted: true`. Which pages
  qualify is mostly engine policy: a running `unload` handler, a `window.opener` link, and in
  Firefox `Cache-Control: no-store` keep a page out.
---

## Answer

When you navigate away, the browser may keep the whole document instead of destroying it: DOM, JavaScript heap, pending timers and promises, all frozen. Back or Forward then reactivates it without a request or a single script re-running.

In HTML terms, unloading decides whether the document stays *salvageable*. `pagehide` fires with `persisted` set to that value; `unload` fires only when it's `false`. On restore, `pageshow` fires with `persisted: true`, and there's no `load` and no `popstate`. Timers resume as if no time had passed.

The spec forces a few cases out (an open WebSocket, a document whose loading was aborted mid-fetch); the rest is engine policy. What kept a page out in Chrome 156 and Firefox 159:

- **A `unload` handler that will run.** Firefox runs them, so the page isn't cached. Chrome's docs say that since Chrome 155 handlers don't run unless the page sends `Permissions-Policy: unload=(self)`; with that header Chrome ran it and didn't cache.
- **`window.opener` links.** A window opened by `window.open()` without `noopener` wasn't cached in either.
- **`Cache-Control: no-store`.** Firefox didn't cache; Chrome did, then evicted the page when a cookie changed.

Not blockers: `beforeunload` handlers, an open IndexedDB connection (both evicted the page when another tab upgraded the database) and an open `BroadcastChannel` (Chrome evicts when a message arrives).

Two jobs follow. Keep pages eligible: no `unload`, use `pagehide`; open windows with `noopener`; close connections other tabs may wait on. And handle restores: in `pageshow` with `persisted`, refresh anything that may be stale, like a cart, login state or analytics view.

To see why a page wasn't restored, Chrome has DevTools' *Back/forward cache* test, `PerformanceNavigationTiming.notRestoredReasons` (Chrome 125+) and the protocol event `Page.backForwardCacheNotUsed`. All three are Chrome-only.

## Example

```js
addEventListener('pagehide', (event) => {
  console.log('pagehide, may be cached:', event.persisted);
  // → pagehide, may be cached: true
});

addEventListener('pageshow', (event) => {
  if (event.persisted) {
    console.log('restored'); // DOM, JS state and timers as you left them
    // → restored
    refreshCart(); // re-fetch what may have changed while the page was away
  } else {
    console.log('loaded', performance.getEntriesByType('navigation')[0].type);
    // → loaded navigate
  }
});
```

Loaded, then link to another page and Back: `loaded navigate`, `pagehide, may be cached: true`, `restored`, in Chrome 156 and Firefox 159. With an `unload` listener added, Firefox 159 printed `pagehide, may be cached: false`, then ran `unload` and on Back printed `loaded back_forward`. Chrome 156 launched with `--enable-features=DeprecateUnload` did the same only with `Permissions-Policy: unload=(self)`; under Puppeteer's default flags it ran the listener even without the header.

## Pitfalls

- Using `unload` for cleanup or analytics. Where it runs it costs the cache, and in Chrome it doesn't run by default. Send data on `pagehide` or `visibilitychange`.
- Treating `pagehide` as final. With `persisted: true` the page may come back; anything torn down there must be rebuilt in `pageshow`.
- Initialising only on `load` or `DOMContentLoaded`. A restored page gets neither, so per-visit work (analytics page views, fresh data) belongs in `pageshow`.
- Assuming one engine's rules. Eligibility differs between Chrome, Firefox and Safari, and changes between versions.

## Follow-ups

**Q:** Why can't a page with a running `unload` handler be cached?
**A:** Pages assume nothing runs after `unload`, so a page that survived it could break. The spec makes them exclusive: `unload` fires only for a document that isn't salvageable, so an engine that runs the handler must discard the page.

**Q:** Does a single-page app's router see a bfcache restore?
**A:** Not through `popstate`: the restored document's own entry comes back, so the router's state is already right. Use `pageshow` to refresh data.

**Q:** What does the protocol report in Chrome?
**A:** `Page.backForwardCacheNotUsed` lists reasons such as `UnloadHandlerExistsInMainFrame`. The in-page `notRestoredReasons` gave `response-cache-control-no-store` after a cookie change and `non-trivial-browsing-context-group` for an opener popup.
