---
title: "How does client-side routing work with the History API?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [history-api, push-state, popstate, client-side-routing, scroll-restoration]
related:
  - browser/navigation/navigation-api
  - browser/navigation/view-transitions
  - browser/navigation/back-forward-cache
  - browser/events/default-actions-and-propagation
  - browser/storage/web-storage-scope
verified: 2026-10
perishable:
  - Firefox 159 updates the URL after a fragment link click asynchronously
sources:
  - https://html.spec.whatwg.org/multipage/nav-history-apis.html#the-history-interface
  - https://html.spec.whatwg.org/multipage/nav-history-apis.html#dom-history-pushstate
  - https://html.spec.whatwg.org/multipage/nav-history-apis.html#shared-history-push/replace-state-steps
  - https://html.spec.whatwg.org/multipage/nav-history-apis.html#can-have-its-url-rewritten
  - https://html.spec.whatwg.org/multipage/nav-history-apis.html#dom-history-scroll-restoration
  - https://html.spec.whatwg.org/multipage/browsing-the-web.html#url-and-history-update-steps
  - https://html.spec.whatwg.org/multipage/browsing-the-web.html#update-document-for-history-step-application
  - https://html.spec.whatwg.org/multipage/browsing-the-web.html#navigate-fragid
  - https://html.spec.whatwg.org/multipage/browsing-the-web.html#scroll-restoration-mode
  - https://html.spec.whatwg.org/multipage/structured-data.html#structuredserializeforstorage
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event#browser_compatibility
tldr: >
  Intercept same-origin link clicks, call `preventDefault()`, then `history.pushState(state, '', url)`
  to add a session history entry and change the URL without loading anything, and render the view
  yourself. `pushState()` fires no event; `popstate` fires when back/forward moves between your
  entries, so render from `location` there too. The server must answer every route with the app.
---

## Answer

A client-side router keeps one document and swaps views, while making the address bar and back button behave as if pages changed. The History API gives it two pieces:

1. **`history.pushState(state, unused, url)`** adds a session history entry for the same document and sets the URL. Nothing is fetched, nothing unloads, and no event fires, so the router renders the new view itself. `replaceState()` does the same without adding an entry: use it for redirects and for filter or tab changes that shouldn't add a back step.
2. **`popstate`** fires on `window` when a traversal (back, forward, `history.go()`) lands on another entry of the same document. The router renders from `location` and reads `event.state`, the clone of what was pushed. A traversal to an entry that belongs to another document loads or restores that document instead; no `popstate` fires.

The router also has to handle:

- **Clicks.** Listen for `click` on the document, ignore anything that isn't a plain left click on a same-origin link without `target` or modifier keys, then `preventDefault()` to cancel the navigation.
- **First load.** Render from `location` at startup. Current browsers don't fire `popstate` on load.
- **Deep links.** A reload or shared link requests `/about` from the server, which must return the app shell for every route.
- **Scroll, focus, title.** Update `document.title`, move focus to the new content, and decide on scrolling.

Rules worth knowing: the state is stored with `StructuredSerializeForStorage`, so functions and DOM nodes throw `DataCloneError`; a URL with another scheme, host or port throws `SecurityError`; and `history.state` survives a reload.

Framework routers wrap these same calls. The Navigation API replaces the click interception with one `navigate` event.

## Example

```js
// The page has <a href="/about">About</a>; the server returns this page for /about too.
const views = { '/': 'Home', '/about': 'About' };

function render() {
  const view = views[location.pathname] ?? 'Not found';
  console.log(view, JSON.stringify(history.state));
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link || link.origin !== location.origin || link.target ||
      event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
  event.preventDefault(); // cancel the browser's navigation
  history.pushState({ from: location.pathname }, '', link.href);
  render(); // pushState() loads nothing and fires no event
});

addEventListener('popstate', render); // back/forward between our entries
render();
// → Home null

document.querySelector('a[href="/about"]').click();
// → About {"from":"/"}

history.back();
// → Home null
```

Chrome 156 and Firefox 159 printed the same. `history.back()` is asynchronous: the last line comes from the `popstate` listener after the script has finished. Loading `/about` directly printed `About null`.

## Pitfalls

- Expecting `pushState()` to fire `popstate` or load the URL. It does neither; call your render function after it.
- Rendering only in the click handler. Back and forward then change the URL but not the view.
- Storing functions, class instances or DOM nodes in the state. Functions and nodes throw `DataCloneError`; class instances come back as plain objects.
- Forgetting the server fallback, so a reload on `/about` returns 404.

## Follow-ups

**Q:** Can `history.length` tell you whether back leaves your app?
**A:** No. It counts every entry in the tab, including other sites and entries ahead of the current one, and doesn't say where you are among them. In the same Puppeteer run it read `2` in Chrome 156 and `1` in Firefox 159, because Chrome kept the initial `about:blank` entry.

**Q:** Hash routing or `pushState()`?
**A:** Hash URLs (`/#/about`) never reach the server, so they need no fallback, and fragment changes fire `hashchange`. `pushState()` gives clean URLs the server can render and crawlers see as distinct pages.

**Q:** Where should per-entry data go?
**A:** In the state object if it's small and belongs to that entry, like a scroll offset or a selected tab. It's restored with the entry, even after a reload.

## Deep dive

### How it works

The tab's session history is a list of entries, each with a URL, a document, a classic state and a scroll restoration mode. `pushState()` runs the URL and history update steps: it serializes the state, checks the URL, fires the Navigation API's `navigate` event (which can cancel it), then creates an entry that shares the current document, truncates any forward entries and makes the new one current. Because the document doesn't change, nothing unloads and no network request is made.

The URL check is "can have its URL rewritten": for `http:` and `https:` the scheme, credentials, host and port must match, while path, query and fragment can change. `http://localhost:8091/x` from a page on port 8090 threw `SecurityError` in both browsers, as did switching to `https:`.

On traversal, the browser compares the target entry's document with the current one. Same document: it sets `history.state`, fires `popstate` synchronously, restores scroll if the mode is `"auto"`, and queues `hashchange` if only the fragment differs. Different document: it loads the page, or restores it from the back/forward cache, and that page gets `pageshow` instead.

### Edge cases

- **Fragment navigations fire `popstate` too.** Setting `location.hash` or clicking `#section` creates a same-document entry with `history.state` reset to `null`, then fires `popstate` before `hashchange`. A router that renders on `popstate` must ignore in-page anchors.
- **`pushState()` to a fragment fires no `hashchange`.** Only real fragment navigations do; `pushState(null, '', '#x')` is a URL update.
- **Firefox updates the URL later after a fragment link click.** Right after `link.click()` on `#section`, `location.hash` read `#section` in Chrome 156 and `""` in Firefox 159; setting `location.hash` updated it synchronously in both.
- **The clone isn't the object.** A pushed `Date` and `Map` came back as a `Date` and `Map`, but not the same objects. Browsers may also limit how many entries a page adds.
- **`popstate` on load.** *Legacy:* Chrome before 34 and Safari before 10 fired `popstate` on page load, and older routers guarded against it.

### Real-world scenario

A product list with filters and infinite scroll. Filters use `replaceState()` with the query string, so back leaves the list instead of undoing each checkbox. Opening a product uses `pushState()`. To return the user to the same item, set `history.scrollRestoration = 'manual'` and save the offset in state: in both browsers, the default `"auto"` restored `scrollY` to 1200 on back, while `"manual"` left it at 0. Manual matters when the list re-renders asynchronously: the browser restores scroll right after `popstate`, before your data is back. The mode belongs to each entry; a new entry copies the current one's.

For data that should outlive one entry but stay in this tab, `sessionStorage` is per tab and also survives reloads.

Accessibility needs explicit work: after `pushState()`, focus stays where it was, often on a link the new view removed, and the title doesn't change. Move focus to the new heading or main region and update `document.title`.

### Trade-offs

| Approach | Gains | Costs |
|---|---|---|
| Full page loads | Nothing to build; scroll, focus, title and back work natively | A full document load per route |
| `pushState()` router | Keeps app state and lets you choose what to fetch | You rebuild click handling, focus, scroll and the server fallback |
| Navigation API | One `navigate` event for links, forms and traversals | Only since Firefox 147 and Safari 26.2 (Chrome 102) |

View Transitions now animate full page loads too, which removes one old reason to build a router.

## Exercises

### What does this log?

```js
addEventListener('popstate', (event) => console.log('popstate', location.pathname, event.state?.n));
history.pushState({ n: 1 }, '', '/a');
history.pushState({ n: 2 }, '', '/b');
history.replaceState({ n: 3 }, '', '/c');
history.back();
console.log('sync', location.pathname);
```

**Answer:** `sync /c`, then `popstate /a 1`. The pushes fire nothing, `replaceState()` turned `/b` into `/c`, and `history.back()` traverses after the script ends.

### In what order do these log?

```js
addEventListener('popstate', () => console.log('popstate'));
addEventListener('hashchange', () => console.log('hashchange'));
location.hash = 'reviews';
console.log('set');
```

**Answer:** `popstate`, `set`, `hashchange`. A fragment navigation fires `popstate` synchronously and queues `hashchange` as a task (Chrome 156 and Firefox 159).
