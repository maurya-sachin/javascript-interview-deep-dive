---
title: "How does the service worker lifecycle work, and how do updates reach users?"
status: draft
difficulty: hard
frequency: 4
core: true
tags: [service-worker, lifecycle, skip-waiting, clients-claim, updates, pwa]
related:
  - browser/workers/web-workers
  - browser/workers/service-worker-caching
  - browser/storage/choosing-browser-storage
  - browser/navigation/page-lifecycle-events
verified: 2026-10
perishable:
  - "Service workers: Chrome 40, Firefox 44, Safari 11.1"
sources:
  - https://w3c.github.io/ServiceWorker/#service-worker-lifetime
  - https://w3c.github.io/ServiceWorker/#dom-serviceworkercontainer-register
  - https://w3c.github.io/ServiceWorker/#installation-algorithm
  - https://w3c.github.io/ServiceWorker/#try-activate-algorithm
  - https://w3c.github.io/ServiceWorker/#update-algorithm
  - https://w3c.github.io/ServiceWorker/#soft-update-algorithm
  - https://w3c.github.io/ServiceWorker/#service-worker-registration-stale
  - https://w3c.github.io/ServiceWorker/#dfn-update-via-cache
  - https://w3c.github.io/ServiceWorker/#dom-serviceworkerglobalscope-skipwaiting
  - https://w3c.github.io/ServiceWorker/#dom-clients-claim
  - https://w3c.github.io/ServiceWorker/#extendableevent-active
  - https://w3c.github.io/ServiceWorker/#secure-context
  - https://w3c.github.io/webappsec-secure-contexts/#is-origin-trustworthy
  - https://web.dev/articles/service-worker-lifecycle
  - https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#browser_compatibility
tldr: >
  `register()` downloads the script and fires `install`; the worker then activates and controls pages
  loaded after that, not the one that registered it unless it calls `clients.claim()`. An update is a
  byte-different script: it installs, then waits until no tab uses the old version. `skipWaiting()`
  skips the wait, so an old page can meet a new worker.
---

## Answer

A service worker is a worker the browser keeps per *registration* (an origin plus a URL scope). It sits between the pages in that scope and the network, and runs only when an event needs it. It requires a secure context; `http://localhost` counts.

**First install:**

1. `navigator.serviceWorker.register('/sw.js')` fetches the script and runs it.
2. `install` fires. `event.waitUntil(promise)` keeps it installing, usually while it caches assets; if the promise rejects, the worker is discarded.
3. With no older version, it activates at once: `activate` fires, the place to delete old caches.
4. It controls pages that *load* after that. The page that registered it stays uncontrolled (`navigator.serviceWorker.controller` is `null`) until it's reloaded, unless the worker calls `clients.claim()`.

**Updates.** The browser checks for a new script on every navigation into the scope, on `registration.update()`, and on other events when the last check is more than 24 hours old. By default (`updateViaCache: 'imports'`) the main script bypasses the HTTP cache. If it's byte-for-byte identical, nothing happens. Otherwise the new version installs and then **waits** while any tab is still controlled by the old one.

A reload doesn't end the wait: the old page is still a client when the reloaded one is requested. The new version activates only after every controlled tab has closed or navigated elsewhere.

**Skipping the wait.** `self.skipWaiting()` activates the new worker immediately, and every open tab fires `controllerchange`. That's fast but risky: a page built for v1 is now served by v2, which may have deleted the caches v1's lazy-loaded chunks need. The usual compromise is to let the waiting worker skip only when the user accepts an "Update available" prompt, then reload.

## Example

```js
// sw.js (v2): skip waiting only when the page asks
addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') skipWaiting();
});

// page.js: runs in a tab controlled by v1
const reg = await navigator.serviceWorker.register('/sw.js');

reg.addEventListener('updatefound', () => {
  const worker = reg.installing;
  worker.addEventListener('statechange', () => {
    console.log(worker.state);
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
      // Show "A new version is available"; when the user accepts:
      worker.postMessage('SKIP_WAITING');
    }
  });
});

navigator.serviceWorker.addEventListener('controllerchange', () => {
  console.log('controllerchange');
  location.reload();
}, { once: true });
// → installed
// → activating
// → controllerchange
// → activated
```

Printed after v2 was deployed and `update()` ran, in Chrome 156 and Firefox 159 (2 runs each). The `controller` check skips the prompt on a first install, when there's nothing to replace.

## Pitfalls

- Expecting the first page load to be controlled. Without `clients.claim()`, the controller is `null` until the next navigation.
- Telling users "reload to update". With one tab open, the reload overlaps the old page and v2 keeps waiting.
- Calling `skipWaiting()` unconditionally while `activate` deletes old caches. Open v1 pages lose the files they still request.
- Serving `sw.js` from a URL that changes per build, such as `sw.3f9a.js`. A new URL is a different worker, and the old page still registers the old one.

## Follow-ups

**Q:** What happens if `install` fails?
**A:** If a `waitUntil()` promise rejects, the new worker becomes `redundant` and the current one keeps control. The browser tries again at the next update check.

**Q:** What do `waiting` and `installing` mean on a registration?
**A:** They're the three slots: `installing` runs `install`, `waiting` holds an installed version blocked by open clients, `active` is the one controlling pages. Each `ServiceWorker` also has a `state`: `installing`, `installed`, `activating`, `activated` or `redundant`.

**Q:** How long can a cached `sw.js` delay an update?
**A:** With the default `updateViaCache: 'imports'`, not at all: the main script is always revalidated. With `'all'`, a `max-age` on it is honoured, but a registration last checked over 24 hours ago bypasses the cache anyway.

## Deep dive

### How it works

The Service Workers spec runs register, update and unregister as *jobs* queued per scope, so calls never interleave. A registration holds up to three workers in `installing`, `waiting` and `active`.

The **Update** algorithm fetches the script with a `Service-Worker: script` header. Unless `updateViaCache` is `'all'`, the request uses cache mode `no-cache`; a registration is *stale* when its last update check was more than 86,400 seconds ago, and a stale one also gets `no-cache`. The fetched body is compared byte for byte with the stored one. If it's unchanged, scripts the worker loaded with `importScripts()` are fetched and compared too; they may come from the HTTP cache unless `updateViaCache` is `'none'`. No difference, no new worker.

**Install** runs the new worker, fires `install`, and waits for every `waitUntil()` promise. On success the worker moves to `waiting`, and **Try Activate** runs. It activates the waiting worker when there's no active worker, or when the active one has no pending events and either no client uses the registration or the waiting one set its *skip waiting flag*. Try Activate runs again when the last client unloads and when `skipWaiting()` is called.

**Activate** moves the worker to `active`, makes it the controller of every client the old one controlled (firing `controllerchange` there), then fires `activate`. A client's controller is otherwise chosen once, when it's created: the navigation that loads a page picks the registration's active worker.

`waitUntil()` and `respondWith()` need an *active* event. In both browsers:

```js
addEventListener('install', async (event) => {
  await null;                                   // a microtask: still inside dispatch
  event.waitUntil(Promise.resolve());           // allowed
  await new Promise((r) => setTimeout(r, 0));   // a task later: dispatch has ended
  event.waitUntil(Promise.resolve());           // throws InvalidStateError
});
```

Microtasks run before the event finishes dispatching, so an `await` on an already-settled promise still counts as synchronous here; `await fetch(...)` doesn't. The same held for `respondWith()`. Call them first and do the async work inside the promise you pass.

### Edge cases

Driven with Puppeteer against `http://localhost`, fresh profile per run; Chrome 156 and Firefox 159 agreed on every row.

| Situation | Result |
|---|---|
| First visit | controller `null`; `active.state` is `activating` when `ready` resolves |
| First visit, `activate` calls `clients.claim()` | `controllerchange` fires; the page becomes controlled |
| v2 deployed, reload the only tab | v2 installs and waits; controller is still v1 |
| Reload again | still waiting |
| Navigate the tab elsewhere, then back | v2 activates; controller is v2 |
| Two tabs, close one | still waiting; the other tab still on v1 |
| `update()` with byte-identical script | script fetched, no `install` |
| `sw.js` with `max-age=3600`, `updateViaCache: 'imports'` | `update()` found v2 |
| Same, `updateViaCache: 'all'` | `update()` didn't request the script |
| v3 calls `skipWaiting()` in `install` | open v2 tab gets `controllerchange` |

### Real-world scenario

A versioned precache that cleans up only once the new version has taken over:

```js
const CACHE = 'static-v2';
const ASSETS = ['/', '/app.js', '/app.css'];

addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
    ),
  );
});
```

While v2 waits, both `static-v1` and `static-v2` exist, so v1 pages keep working. After activation only `static-v2` remained, in both browsers. Deleting in `install` instead would break v1 pages that are still open.

### Trade-offs

- **Wait (the default)** is always safe: one tab never runs two versions. The cost is that a user who keeps a tab open for days stays on the old version.
- **`skipWaiting()` on every install** gets fixes out immediately, but open pages run against a worker they weren't built for. It's fine when the worker only does network-first caching and never deletes what old pages need.
- **Prompt, then skip** combines both: the page decides when to switch and reloads right after.
- **`clients.claim()`** helps when the worker should control the first visit, for example to cache its requests. Without it, the first page's requests bypass the worker.
