---
title: "How do `localStorage` and `sessionStorage` behave across tabs?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [local-storage, session-storage, storage-event, web-storage, tabs]
related:
  - browser/storage/choosing-browser-storage
  - browser/workers/cross-tab-communication
  - browser/storage/quotas-and-eviction
verified: 2026-10
perishable:
  - "Web Storage cap: 5,242,880 UTF-16 units in Chrome 156, Firefox 159"
sources:
  - https://html.spec.whatwg.org/multipage/webstorage.html#the-localstorage-attribute
  - https://html.spec.whatwg.org/multipage/webstorage.html#the-sessionstorage-attribute
  - https://html.spec.whatwg.org/multipage/webstorage.html#dom-storage-setitem
  - https://html.spec.whatwg.org/multipage/webstorage.html#concept-storage-broadcast
  - https://html.spec.whatwg.org/multipage/webstorage.html#the-storageevent-interface
  - https://html.spec.whatwg.org/multipage/document-sequences.html#copy-session-storage
  - https://html.spec.whatwg.org/multipage/links.html#get-an-element's-noopener
  - https://storage.spec.whatwg.org/#legacy-clone-a-traversable-storage-shed
  - https://storage.spec.whatwg.org/#storage-endpoints
  - https://privacysandbox.google.com/cookies/storage-partitioning
  - https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/State_Partitioning
tldr: >
  `localStorage` is one string map per origin, shared by every tab and kept until cleared.
  `sessionStorage` is per origin and per tab: it survives reloads, is empty in a new tab, and
  `window.open()` hands the new tab a one-time copy. A change fires a `storage` event in the
  origin's other documents, never in the one that wrote it.
---

## Answer

Both are `Storage` objects with the same synchronous, string-only API: `getItem()`, `setItem()`, `removeItem()`, `clear()`, `key()`, `length`. They differ in scope.

**`localStorage`** belongs to the origin (scheme, host and port). Every tab and same-origin iframe shares one map, and it stays until script or the user clears it. `localhost:8061` and `localhost:8062` don't see each other's.

**`sessionStorage`** belongs to the origin *and* one tab (a top-level traversable, in spec terms). It survives reloads and navigation within the tab, including leaving the site and coming back, and same-origin iframes in the tab share it. A second tab on the same URL starts empty. It's deleted when the tab closes.

`window.open()` copies the opener's session storage into the new tab: a snapshot, after which the two drift apart. With `noopener`, which `<a target="_blank">` implies, nothing is copied.

**The `storage` event** fires on every *other* same-origin `Window` that shares the changed storage, never on the one that made the change. It carries `key`, `oldValue`, `newValue`, `url` and `storageArea`; `clear()` sends `key: null`. Setting a key to the value it already has fires nothing. For `localStorage` the event reaches other tabs; for `sessionStorage` only same-origin iframes in the same tab, since other tabs have their own copy.

That makes the event a cheap way to sync small state such as a logout or a theme change across tabs. `BroadcastChannel` is the general tool for messages that aren't stored.

The Storage Standard gives each 5 MiB per origin. Chrome 156 and Firefox 159 both threw `QuotaExceededError` once keys plus values passed 5,242,880 UTF-16 code units.

## Example

```js
// The same page is open in tabs A and B
addEventListener('storage', (e) => {
  const area = e.storageArea === localStorage ? 'local' : 'session';
  console.log(`${area} ${e.key} ${e.oldValue} ${e.newValue}`);
});

// Then, in tab A:
localStorage.setItem('k', '1');
// → local k null 1
localStorage.setItem('k', 1);
localStorage.removeItem('k');
// → local k 1 null
localStorage.clear();
sessionStorage.setItem('step', '2');
```

The `→` lines are what tab B printed; tab A printed nothing. `setItem('k', 1)` stores the string `"1"` again, so no event; `clear()` on an empty store fires none; and tab B has its own `sessionStorage`. Same output in Chrome 156 and Firefox 159, driven with Puppeteer.

## Pitfalls

- Waiting for your own `storage` event to update the UI. The writing document never receives it; update locally, and use the event only for other tabs.
- Expecting a new tab to share `sessionStorage`. A `target="_blank"` link starts empty, and a `window.open()` tab gets only a snapshot.
- Calling `setItem()` without `try`/`catch`. Past the quota it throws `QuotaExceededError`, and the write is lost.
- Reading storage in a hot loop or on every render. Each call is synchronous; read once into memory and write back when the value changes.

## Follow-ups

**Q:** Does a same-origin iframe in the writing tab get the event?
**A:** Yes. The event goes to every other same-origin document sharing that storage, so an iframe got a `sessionStorage` event when its parent wrote, in Chrome 156 and Firefox 159.

**Q:** How do you keep a `window.open()` tab from inheriting session state?
**A:** Pass `noopener` in the features string, or use a link with `target="_blank"`. Both open the tab with no opener, so the spec's copy step doesn't run; `rel="opener"` on the link brought the copy back in Chrome 156 and Firefox 159.

**Q:** Why might an embedded iframe see different `localStorage` on two sites?
**A:** Browsers partition third-party storage by the top-level site, so the same origin embedded in two sites gets two separate maps.

## Deep dive

### Edge cases

Checked with two Puppeteer-driven tabs on `http://localhost:8061`; Chrome 156 and Firefox 159 agreed on every row.

| Action | Result |
|---|---|
| Reload the tab | `sessionStorage` kept |
| Navigate to another page and back in the same tab | `sessionStorage` kept |
| Same URL in a second tab | `localStorage` shared, `sessionStorage` empty |
| `window.open(url)` | copy at open time; later writes in either tab stay separate |
| `window.open(url, '_blank', 'noopener')` | `sessionStorage` empty |
| `<a target="_blank">` | `sessionStorage` empty, `window.opener` is `null` |
| `removeItem()` of a missing key | no event |
| `localhost:8062` | can't see `localhost:8061`'s `localStorage` |

The quota held at exactly 5,242,880 code units across 3 runs per browser, counting key and value: a character like `é` counted as one unit, the same as `a`.

## Exercises

### What does the new tab read?

```js
sessionStorage.setItem('step', '1');
window.open(location.href);
sessionStorage.setItem('step', '2');

// Later, in the tab that window.open() created:
console.log(sessionStorage.getItem('step'));
```

**Answer:** `1`. The new tab gets a copy of the opener's session storage when it's created; the opener's later write to `step` doesn't reach it. Chrome 156 and Firefox 159 printed `1` in 3 runs each.
