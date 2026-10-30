---
title: "How does a service worker intercept requests, and which caching strategies are common?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [service-worker, cache-api, fetch-event, caching-strategies, offline, navigation-preload]
related:
  - browser/workers/service-worker-lifecycle
  - browser/network-apis/fetch-request-options
  - browser/network-apis/streaming-bodies
  - browser/storage/choosing-browser-storage
  - browser/storage/quotas-and-eviction
verified: 2026-10
perishable:
  - "Navigation preload: Chrome 59, Firefox 99, Safari 15.4"
sources:
  - https://w3c.github.io/ServiceWorker/#fetchevent-interface
  - https://w3c.github.io/ServiceWorker/#dom-fetchevent-respondwith
  - https://w3c.github.io/ServiceWorker/#handle-fetch
  - https://w3c.github.io/ServiceWorker/#cache-objects
  - https://w3c.github.io/ServiceWorker/#dom-cache-addall
  - https://w3c.github.io/ServiceWorker/#dom-cache-put
  - https://w3c.github.io/ServiceWorker/#batch-cache-operations-algorithm
  - https://w3c.github.io/ServiceWorker/#navigation-preload-manager
  - https://w3c.github.io/ServiceWorker/#dom-fetchevent-preloadresponse
  - https://web.dev/blog/navigation-preload
  - https://developer.chrome.com/docs/workbox/caching-strategies-overview
  - https://developer.mozilla.org/en-US/docs/Web/API/NavigationPreloadManager#browser_compatibility
tldr: >
  Every request from a controlled page fires `fetch` in the service worker; `event.respondWith()` supplies
  the response, otherwise the request goes to the network. Responses are kept in the Cache API, a store
  only your code reads and writes. Cache-first suits versioned assets, network-first suits HTML and fresh
  data, stale-while-revalidate suits data that may lag a little.
---

## Answer

A service worker sees every request its controlled pages make: the navigations into its scope and every subresource request, cross-origin ones included. Each fires a `fetch` event with `event.request`. Calling `event.respondWith(promise)` during dispatch makes that promise's `Response` the answer; not calling it lets the request go to the network as usual.

The **Cache API** (`caches.open(name)`, then `match`, `put`, `add`, `addAll`, `delete`, `keys`) is where responses usually come from. It's a store of request/response pairs that only your code reads and writes, unrelated to the HTTP cache that `fetch`'s `cache` option controls. Entries are keyed by URL, query included, and only `GET` requests can be stored. They stay until deleted or until the origin is evicted, and count against the origin's storage quota.

**Strategies**, by what the resource needs:

- **Cache-first:** return the cached copy; go to the network only on a miss. For versioned static files (`app.3f9a.js`) that never change at the same URL.
- **Network-first:** try the network, update the cache, fall back to the cache when offline. For HTML and data that must be current when possible.
- **Stale-while-revalidate:** answer from the cache immediately, refresh the cache in the background. The next visit sees the update. For avatars and data that may lag one load behind.
- **Cache-only / network-only:** for precached assets, and for requests that must never be cached, like analytics or `POST`.

**Navigation preload.** A navigation that hits a stopped service worker waits for it to boot before the request even starts. `registration.navigationPreload.enable()` makes the browser send the navigation request in parallel, with a `Service-Worker-Navigation-Preload` header; the worker uses it through `event.preloadResponse`.

Workbox packages these strategies, but they're a few lines each.

## Example

```js
// sw.js: stale-while-revalidate for /api/count
async function putInCache(request, response) {
  const cache = await caches.open('runtime-v1');
  await cache.put(request, response);
}

async function staleWhileRevalidate(event) {
  const cached = await caches.match(event.request);
  const fresh = fetch(event.request).then((response) => {
    if (response.ok) event.waitUntil(putInCache(event.request, response.clone()));
    return response;
  });
  event.waitUntil(fresh.catch(() => {})); // keep the worker alive for the refresh
  return cached ?? fresh;
}

addEventListener('fetch', (event) => {
  if (new URL(event.request.url).pathname === '/api/count') event.respondWith(staleWhileRevalidate(event));
});

// page.js: the server answers 1, 2, 3… one higher per request
const pause = () => new Promise((resolve) => setTimeout(resolve, 300));
for (let i = 0; i < 3; i++) {
  console.log(await (await fetch('/api/count')).text());
  await pause();
}
// → 1
// → 1
// → 2
```

Each answer is the value cached one request earlier; the server is always a step ahead. With the server unreachable, a fourth request answered `3` from the cache. Same in Chrome 156 and Firefox 159.

## Pitfalls

- Caching every response blindly. A 404, a 500 or a redirect gets served forever under cache-first; check `response.ok` before `put()`.
- Caching opaque `no-cors` responses. `cache.put()` accepts them, but their status is hidden and browsers pad their quota cost (Chrome 156 counted one tiny response as about 7 MB).
- Using the response body twice. A body can be read once; `put()` a `clone()` and return the original.
- Enabling navigation preload without using `event.preloadResponse`. The preload request goes out anyway, so a handler that calls `fetch(event.request)` itself hits the server twice per navigation, as it did in Chrome 156 and Firefox 159.

## Follow-ups

**Q:** Is `cache.addAll()` atomic?
**A:** Yes. If any request fails or returns a non-2xx status, it rejects with a `TypeError` and stores nothing. Chrome 156 and Firefox 159 left the cache empty after one 404 in the list.

**Q:** Why can't `cache.add()` store a `no-cors` response?
**A:** `add()` rejects any response that isn't 2xx, and an opaque response's status reads as 0. Both browsers threw `TypeError`; `put()` stores it.

**Q:** How do you stream a response from a service worker?
**A:** Pass a `Response` built on a `ReadableStream` to `respondWith()`. The page reads chunks as the worker enqueues them: in both browsers a chunk enqueued 500 ms after the first arrived 500 ms later. Cached header HTML can go out before the network body.

**Q:** Does a query string matter for `match()`?
**A:** Yes: `/q?a=1` doesn't match `/q?a=2`. Pass `{ ignoreSearch: true }` to match on the path alone.

## Exercises

### What does the fourth request print?

```js
// sw.js: network-first; /api/count answers 1, 2, 3… one higher per request
async function networkFirst(event) {
  try {
    const response = await fetch(event.request);
    if (response.ok) event.waitUntil(putInCache(event.request, response.clone()));
    return response;
  } catch {
    return (await caches.match(event.request)) ?? Response.error();
  }
}
// The page fetches /api/count three times, then once more with the server unreachable.
```

**Answer:** `3`. The first three requests reach the network and print `1`, `2`, `3`, each replacing the cached copy. The fourth `fetch()` rejects inside the worker, so the `catch` serves the last cached response. Chrome 156 and Firefox 159 printed `1 2 3 3`.
