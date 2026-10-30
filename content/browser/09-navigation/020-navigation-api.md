---
title: "What does the Navigation API fix over the History API?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [navigation-api, navigate-event, intercept, client-side-routing, session-history]
related:
  - browser/navigation/history-api-routing
  - browser/navigation/view-transitions
  - browser/events/default-actions-and-propagation
  - html-and-css/forms-dialog-popover/form-submission
verified: 2026-10
perishable:
  - "Navigation API: Chrome 102, Firefox 147, Safari 26.2"
  - Chrome 156 turned navigate() before load into a replace
sources:
  - https://html.spec.whatwg.org/multipage/nav-history-apis.html#navigation-api
  - https://html.spec.whatwg.org/multipage/nav-history-apis.html#the-navigate-event
  - https://html.spec.whatwg.org/multipage/nav-history-apis.html#dom-navigateevent-intercept
  - https://html.spec.whatwg.org/multipage/nav-history-apis.html#dom-navigateevent-canintercept
  - https://html.spec.whatwg.org/multipage/nav-history-apis.html#inner-navigate-event-firing-algorithm
  - https://html.spec.whatwg.org/multipage/nav-history-apis.html#dom-navigation-navigate
  - https://html.spec.whatwg.org/multipage/nav-history-apis.html#dom-navigation-back
  - https://html.spec.whatwg.org/multipage/nav-history-apis.html#dom-navigation-entries
  - https://html.spec.whatwg.org/multipage/nav-history-apis.html#shared-history-push/replace-state-steps
  - https://html.spec.whatwg.org/multipage/browsing-the-web.html#getting-session-history-entries-for-the-navigation-api
  - https://developer.mozilla.org/en-US/docs/Web/API/Navigation#browser_compatibility
tldr: >
  The History API only changes the URL and reports back/forward after the fact. The Navigation API
  fires one cancelable `navigate` event before every navigation: links, forms, `location`,
  `pushState()`, back/forward. `event.intercept({ handler })` turns it into a same-document navigation
  whose promise tracks completion. You also get readable entries and promise-returning methods.
  Chrome 102, Firefox 147, Safari 26.2.
---

## Answer

A History API router has no single place where navigations start. It catches link clicks itself, misses form submissions and `location.href = …` unless it patches them, and learns about back and forward only from `popstate`, after the URL has changed and too late to cancel. `pushState()` is synchronous, so there's no notion of a navigation still loading, and the history list can't be read.

The Navigation API (`window.navigation`) fixes this with one event and a few objects:

- **`navigate`** fires before every navigation of the frame: link clicks, form submissions (with `event.formData`), `location` changes, `pushState()`/`replaceState()`, back/forward, reloads and `navigation.navigate()`. It reports `navigationType` (`push`, `replace`, `reload`, `traverse`), `destination`, `userInitiated`, `hashChange`, `downloadRequest` and a `signal`. `preventDefault()` cancels it when `cancelable` is true.
- **`event.intercept({ handler })`** turns it into a same-document navigation. The URL and `navigation.currentEntry` change at once; the handler's promise is the navigation. The browser shows loading while it runs, fires `navigatesuccess` or `navigateerror`, then resets focus and scroll. It's allowed only when `canIntercept` is true: a same-origin URL, and not a traversal to another document.
- **Methods return promises.** `navigate()`, `back()`, `forward()`, `traverseTo(key)` and `reload()` return `{ committed, finished }`.
- **Entries.** `navigation.entries()` lists this origin's contiguous entries, each with `url`, `key`, `index` and `getState()`; `currententrychange` fires on every change. This state is separate from `history.state`.

Two things stay out of reach: navigations to other origins and back/forward to other documents can be watched but not intercepted, and those traversals can't be cancelled. Every engine has it now: Chrome 102, Firefox 147, Safari 26.2.

## Example

```js
navigation.addEventListener('navigate', (event) => {
  if (!event.canIntercept || event.hashChange || event.downloadRequest !== null) return;
  console.log('navigate', event.navigationType, new URL(event.destination.url).pathname);

  event.intercept({
    async handler() {
      // The URL has already changed; render the view for it.
      await new Promise((resolve) => setTimeout(resolve, 50)); // stand-in for fetching data
      console.log('rendered', location.pathname);
    },
  });
});

// Later, after the page has loaded (a link click to /about goes through the same listener):
const { committed, finished } = navigation.navigate('/about', { state: { tab: 'team' } });
// → navigate push /about

await committed;
console.log('committed', location.pathname, navigation.currentEntry.getState().tab);
// → committed /about team

await finished;
// → rendered /about

await navigation.back().finished;
// → navigate traverse /index.html
// → rendered /index.html
```

Chrome 156 and Firefox 159 printed the same, on a page served as `/index.html`.

## Pitfalls

- Intercepting everything. Check `canIntercept`, and leave `hashChange` and `downloadRequest` navigations to the browser.
- Ignoring `event.signal`. When a newer navigation starts, the old one's `finished` rejects with `AbortError` and its signal aborts, but the handler keeps running; pass the signal to `fetch()`.
- Expecting to block the back button. A traversal to another document fired `navigate` with `cancelable` and `canIntercept` both `false` in Chrome 156 and Firefox 159.
- Navigating before `load`. Called from a module script, `navigation.navigate('/about')` became a `replace` in Chrome 156 and a `push` in Firefox 159.

## Follow-ups

**Q:** Does `history.pushState()` fire `navigate`?
**A:** Yes, as a `push` with `canIntercept` true. Calling `preventDefault()` there makes `pushState()` return without changing the URL or state, and without throwing.

**Q:** What does a cross-origin link look like?
**A:** `navigate` fires with `canIntercept: false` and `cancelable: true`. You can cancel it but not intercept it; `intercept()` threw `SecurityError` in both browsers.

**Q:** Why are only some entries in `navigation.entries()`?
**A:** The spec walks out from the current entry and stops at the first entry from another origin in each direction, so another site's pages, and your entries beyond them, aren't exposed.
