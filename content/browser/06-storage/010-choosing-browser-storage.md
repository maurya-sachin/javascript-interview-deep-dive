---
title: "Cookies, `localStorage`, `sessionStorage`, or IndexedDB — how do you choose?"
status: draft
difficulty: easy
frequency: 5
core: true
tags: [cookies, local-storage, session-storage, indexeddb, cache-api, web-storage]
related:
  - browser/storage/how-cookies-work
  - browser/storage/web-storage-scope
  - browser/storage/indexeddb-transactions
  - browser/storage/quotas-and-eviction
  - browser/workers/service-worker-caching
verified: 2026-10
perishable:
  - "localStorage cap: 5,242,880 UTF-16 units in Chrome 156, Firefox 159"
  - "Cookie Store API: Chrome 87+, Firefox 140+, Safari 18.4+"
  - Safari deletes script-written storage after 7 days without interaction
sources:
  - https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-set-cookie-header-field
  - https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-limits
  - https://html.spec.whatwg.org/multipage/webstorage.html#the-storage-interface
  - https://html.spec.whatwg.org/multipage/webstorage.html#the-sessionstorage-attribute
  - https://w3c.github.io/IndexedDB/#transaction-concept
  - https://storage.spec.whatwg.org/#storage-endpoints
  - https://cookiestore.spec.whatwg.org/#CookieStore
  - https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#web_storage
  - https://developer.mozilla.org/en-US/docs/Web/API/CookieStore#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/getDirectory#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#other_web_technologies
  - https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
  - https://privacysandbox.google.com/cookies/storage-partitioning
tldr: >
  Choose by who needs the data and its shape. Cookies (4 KiB each) travel with every matching
  request, so keep them for state the server needs, like a session id. `localStorage` and
  `sessionStorage` hold about 5 MiB of strings, synchronously, per origin or per tab. IndexedDB
  stores structured data asynchronously, in workers too. Cached responses go in the Cache API.
---

## Answer

Ask: does the server need it on every request, and what shape and size is it?

| | Cookies | `localStorage` | `sessionStorage` | IndexedDB | Cache API |
|---|---|---|---|---|---|
| Holds | one string, ≤ 4,096 bytes of name + value | strings | strings | structured clones: objects, `Date`, `Map`, `Blob`… | `Request` → `Response` pairs |
| API | `document.cookie`, sync | sync | sync | async, transactional | async (promises) |
| Scope | domain + path, sent to the server | origin, every tab | origin, one tab | origin | origin |
| Lifetime | session, or up to 400 days | until cleared | until the tab closes | until cleared or evicted | until cleared or evicted |
| In workers | service workers: `cookieStore` | no | no | yes | yes |

- **Cookies** are the only storage the server sees without your code sending it. Every byte goes up with each matching request, so keep them small: a session id, ideally `HttpOnly` so script can't read it.
- **`localStorage`** suits small client-only settings like a theme. It stores strings and blocks the main thread on every call. Both Chrome 156 and Firefox 159 cap it at 5 MiB of characters per origin.
- **`sessionStorage`** is the same API scoped to one tab: wizard steps, state that shouldn't leak into other tabs.
- **IndexedDB** is the client database: large or structured data, indexes, anything a worker needs.
- **Cache API** stores HTTP responses, usually for a service worker.

None of it is guaranteed: users clear it, browsers may evict it, and Safari deletes script-written storage after seven days of Safari use without the user interacting with the site. Keep a server copy of anything you can't lose.

## Example

```js
localStorage.setItem('count', 1);
console.log(typeof localStorage.getItem('count'));
// → string

const draft = { saved: new Date(0), tags: new Set(['a']) };
localStorage.setItem('draft', draft);
console.log(localStorage.getItem('draft'));
// → [object Object]
localStorage.setItem('draft', JSON.stringify(draft));
console.log(localStorage.getItem('draft'));
// → {"saved":"1970-01-01T00:00:00.000Z","tags":{}}

const open = indexedDB.open('app', 1);
open.onupgradeneeded = () => open.result.createObjectStore('drafts');
open.onsuccess = () => {
  const db = open.result;
  db.transaction('drafts', 'readwrite').objectStore('drafts').put(draft, 'd1');
  const read = db.transaction('drafts').objectStore('drafts').get('d1');
  read.onsuccess = () => {
    const { saved, tags } = read.result;
    console.log(saved instanceof Date, tags.has('a'));
    // → true true
  };
};
```

`localStorage` stringifies whatever it's given, and JSON turns the `Date` into a string and the `Set` into `{}`. IndexedDB stores a structured clone and hands back a real `Date` and `Set`. Chrome 156 and Firefox 159 printed the same.

## Pitfalls

- Keeping a session token in `localStorage`. Any script running on the origin, injected ones included, can read it; an `HttpOnly` cookie is out of script's reach. The full trade-off belongs to authentication and XSS defence.
- Putting application data in cookies. It's re-sent with every request to that domain and path, and a cookie over 4,096 bytes of name plus value is silently dropped.
- Forgetting that Web Storage holds strings: numbers come back as strings, objects as `"[object Object]"`, and a JSON round trip loses `Date`, `Map` and `Set`.
- Reaching for `localStorage` in a worker or service worker. It doesn't exist there; use IndexedDB.

## Follow-ups

**Q:** Can a service worker read cookies?
**A:** Not through `document.cookie`, which only documents have. Service workers get the asynchronous Cookie Store API (`cookieStore.get()`, `set()`, `change` events): Chrome 87+, Firefox 140+, Safari 18.4+. Dedicated workers have neither.

**Q:** Where do large binary files go?
**A:** IndexedDB stores `Blob`s, and the Origin Private File System (`navigator.storage.getDirectory()`, Chrome 86+, Firefox 111+, Safari 15.2+) gives file handles, with fast synchronous access in workers. Both count against the origin's quota.

**Q:** Does `sessionStorage` survive a reload?
**A:** Yes. It lasts as long as the tab and survives reloads and same-tab navigation. A tab opened by `window.open()` starts with a copy; a link with `target="_blank"` doesn't.

## Deep dive

### How it works

**Cookies** live in a store shared by the browser's networking code and `document.cookie`. When a response carries `Set-Cookie`, the browser stores the cookie with its domain, path, expiry and flags; for every later request it attaches the matching ones in a `Cookie` header. `document.cookie` is a string view of the same store, minus `HttpOnly` cookies. The cookie spec asks browsers to keep at least 50 cookies per domain and to ignore a cookie whose name plus value exceeds 4,096 bytes; Chrome 156 and Firefox 159 dropped a 4,097-byte one whether it came from script or a header.

**Web Storage** is a per-origin map of strings (`localStorage`) plus a per-tab, per-origin map (`sessionStorage`). Every call is synchronous: the script waits until the browser has read or written the value. Writing a 4 MiB string took about 4–6 ms in Chrome 156 and Firefox 159 (3 runs each). Other same-origin tabs get a `storage` event when a value changes.

**IndexedDB** keeps object stores of structured clones, with indexes, inside versioned databases. Every read and write is a request inside a transaction and reports back by event, so the main thread never waits on disk. It's available in windows, dedicated workers and service workers.

**The Cache API** maps `Request`s to `Response`s. Pages can use it, but its main client is a service worker answering fetches offline.

The Storage Standard registers `localStorage` and `sessionStorage` with a 5 MiB quota each, and gives IndexedDB, the Cache API and service worker registrations no fixed one: they share the origin's disk quota.

### Edge cases

| Check | Chrome 156 | Firefox 159 |
|---|---|---|
| Largest `localStorage` key + value | 5,242,880 UTF-16 units | 5,242,880 UTF-16 units |
| `é` (2 bytes in UTF-8) counted as | 1 unit | 1 unit |
| Error past the cap | `QuotaExceededError` | `QuotaExceededError` |
| `typeof localStorage` in a dedicated worker | `"undefined"` | `"undefined"` |
| `typeof indexedDB` in a dedicated worker | `"object"` | `"object"` |
| `typeof caches` on `http://example.test` | `"undefined"` | `"undefined"` |

The quota figures held across 3 runs. The last row is a secure-context rule: the Cache API and Cookie Store API exist only over HTTPS or on `localhost`, while cookies, Web Storage and IndexedDB work over plain HTTP. In a third-party iframe, Chrome 115+, Firefox and Safari partition this storage by the top-level site, so the same embed sees different data on different sites.

### Real-world scenario

A note-taking app: the session id is an `HttpOnly` cookie set by the login response. The theme lives in `localStorage` and is applied by an inline script in `<head>`. The note being edited is saved to IndexedDB on every pause in typing, with an outbox store of unsent changes that a service worker or the next page load syncs. The app shell and fonts are in the Cache API. `sessionStorage` keeps which panel each tab had open, so two tabs don't fight over it.

### Trade-offs

Synchronous storage is a feature when you need a value before first paint: reading a theme from `localStorage` in an inline `<script>` avoids a flash of the wrong theme, and IndexedDB can't answer that early. It becomes a cost when the data is large or written often, because each write blocks rendering and input.

IndexedDB's API is verbose and event-based. Most apps wrap it in a small promise helper or a library rather than use raw requests; keep the wrapper thin so you still see where transactions start and end.

Cookies cost bandwidth on every request and are readable by the server for free. That's the only reason to choose them.

## Exercises

### What does this print?

```js
localStorage.setItem('list', [1, 2]);
localStorage.setItem('flag', false);
console.log(localStorage.getItem('list'), localStorage.getItem('flag') === false);
```

**Answer:** `1,2 false`. `setItem()` converts both values to strings, so the array becomes `"1,2"` and `false` becomes `"false"`, which isn't `=== false`.
