---
title: "How do tabs of the same site talk to each other?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [broadcastchannel, sharedworker, web-locks, tabs, messaging]
related:
  - browser/workers/structured-clone-and-transfer
  - browser/workers/web-workers
  - browser/storage/web-storage-scope
  - browser/navigation/back-forward-cache
  - browser/navigation/page-lifecycle-events
verified: 2026-10
perishable:
  - "SharedWorker: Chrome Android 148; Safari 16 (removed after 7)"
  - "BroadcastChannel and Web Locks: Safari 15.4"
  - "Chrome 156 evicts a bfcached page when its channel gets a message"
sources:
  - https://html.spec.whatwg.org/multipage/web-messaging.html#broadcasting-to-other-browsing-contexts
  - https://html.spec.whatwg.org/multipage/web-messaging.html#dom-broadcastchannel-postmessage
  - https://storage.spec.whatwg.org/#obtain-a-storage-key-for-non-storage-purposes
  - https://html.spec.whatwg.org/multipage/workers.html#shared-workers-and-the-sharedworker-interface
  - https://w3c.github.io/web-locks/#lock-manager
  - https://w3c.github.io/web-locks/#api-lock-manager-request
  - https://w3c.github.io/web-locks/#dom-lockoptions-ifavailable
  - https://w3c.github.io/web-locks/#dom-lockoptions-steal
  - https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel#browser_compatibility
tldr: >
  `BroadcastChannel` sends a structured-cloned message to every other same-origin context that opened a
  channel of the same name, but not back to the sending object. A `SharedWorker` gives tabs one shared
  thread and state. Web Locks (`navigator.locks.request()`) make tabs take turns, for example so only one
  tab syncs. The `storage` event works too, but only for stored strings.
---

## Answer

Tabs of one origin share no JavaScript objects, so they coordinate through the browser:

**`BroadcastChannel`** is a named pub/sub bus. `new BroadcastChannel('auth')` in each tab, `postMessage(data)` in one, a `message` event in all the others. Data is structured-cloned, like `postMessage()` to a worker. It reaches every other channel object with that name in the same origin, including workers and a second channel object in the sending tab; only the object that sent it is skipped. Matching uses the storage key, so a third-party iframe only reaches copies of itself embedded under the same top-level site.

**`SharedWorker`** is one worker shared by every same-origin page that creates it with the same URL and name. Each page talks to it through its own `MessagePort` (`worker.port`), and the worker gets a `connect` event per page. Use it for shared state or one shared connection, such as a single WebSocket for all tabs. It runs while any page is connected. Chrome Android shipped it only in Chrome 148.

**Web Locks** coordinate rather than message. `navigator.locks.request('sync', async (lock) => {…})` runs the callback once no other tab or worker of the origin holds `'sync'`, and releases the lock when the returned promise settles or the tab closes. `{ ifAvailable: true }` gives `null` instead of waiting; `{ steal: true }` takes the lock and rejects the holder's request with `AbortError`; `mode: 'shared'` allows several readers.

**Others:** the `storage` event fires in other tabs when `localStorage` changes; `window.opener` and iframes can `postMessage` each other directly; a service worker can message every client with `clients.matchAll()`.

Pick by need: notifications → `BroadcastChannel`; one owner of a resource → a lock, or a `SharedWorker` where supported.

## Example

```js
// Every tab of the app runs this
const channel = new BroadcastChannel('auth');
channel.onmessage = (event) => {
  if (event.data.type === 'logout') console.log(`logged out in another tab: ${event.data.reason}`);
};

function logout(reason) {
  // …clear the session locally, then tell the other tabs
  channel.postMessage({ type: 'logout', reason });
}

// In tab A:
logout('user');
// → logged out in another tab: user
```

Tabs B and C each printed the line, and a dedicated worker in tab C listening on `'auth'` got the message too; tab A printed nothing. A tab on `http://127.0.0.1:8070` with the same code got nothing either, since it's another origin. Same in Chrome 156 and Firefox 159, driven with Puppeteer.

## Pitfalls

- Expecting the sender to receive its own message. Update the sending tab directly; the channel is for the others.
- Assuming `steal` stops the old holder. Its request rejects with `AbortError`, but its callback keeps running; code inside must check whether it still owns the work.
- Relying on `SharedWorker` everywhere. Safari dropped it after version 7 and restored it in 16; Chrome Android got it in 148.
- Leaving channels open on pages you want back-forward cached. Chrome 156 cached a page with an open channel, but a message sent while it was cached evicted it.

## Follow-ups

**Q:** How do you elect one leader tab?
**A:** Every tab calls `navigator.locks.request('leader', () => new Promise(() => {}))`. The first holds the lock forever; the rest queue. When the leader's tab closes, the browser releases its lock and the next tab's callback runs. Chrome 156 and Firefox 159 granted the waiting tab the lock when the holder closed.

**Q:** `BroadcastChannel` or the `storage` event?
**A:** The `storage` event only reports `localStorage` writes, as strings, and only when the value changes. `BroadcastChannel` sends any cloneable value without storing it. Use storage when the state must also survive a reload.

**Q:** Do messages reach a page in the back-forward cache?
**A:** No. The spec delivers only to documents that are fully active. Headless Firefox didn't restore pages from the cache under Puppeteer, so only Chrome was checked.

## Exercises

### What does tab B print?

```js
// Tab A
navigator.locks.request('sync', async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
});

// Tab B, 100 ms later
navigator.locks.request('sync', { ifAvailable: true }, async (lock) => {
  console.log(lock === null);
});
```

**Answer:** `true`. Tab A holds `'sync'` for a second, and `ifAvailable` makes tab B's request run its callback at once with `null` instead of queuing. The same request after tab A's lock was released printed `false`. Chrome 156 and Firefox 159 agree.
