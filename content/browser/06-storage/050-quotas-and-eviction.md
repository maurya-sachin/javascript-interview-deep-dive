---
title: "How much can a site store, and when does the browser delete it?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [storage-quota, eviction, storage-manager, persistent-storage, storage-partitioning]
related:
  - browser/storage/choosing-browser-storage
  - browser/storage/indexeddb-transactions
  - browser/workers/service-worker-caching
  - browser/storage/how-cookies-work
verified: 2026-10
perishable:
  - "Chrome: an origin may use 60% of the disk"
  - "Chrome 133+: estimate() reports quota as usage + 10 GiB"
  - "Firefox best-effort: min(10% of disk, 10 GiB per site)"
  - "Safari 17+: about 60% of disk per origin in browser apps"
  - Safari deletes script-written storage after 7 days without interaction
  - "Storage Buckets API: Chrome 122+ only"
sources:
  - https://storage.spec.whatwg.org/#buckets
  - https://storage.spec.whatwg.org/#persistence
  - https://storage.spec.whatwg.org/#usage-and-quota
  - https://storage.spec.whatwg.org/#storage-pressure
  - https://storage.spec.whatwg.org/#dom-storagemanager-estimate
  - https://storage.spec.whatwg.org/#dom-storagemanager-persist
  - https://storage.spec.whatwg.org/#storage-keys
  - https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#how_much_data_can_be_stored
  - https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#when_is_data_evicted
  - https://groups.google.com/a/chromium.org/g/blink-dev/c/7q0YGQNVkjs
  - https://web.dev/articles/persistent-storage#how_is_permission_granted
  - https://developer.chrome.com/docs/workbox/understanding-storage-quota#beware_of_opaque_responses
  - https://webkit.org/blog/14403/updates-to-storage-policy/
  - https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
  - https://privacysandbox.google.com/cookies/storage-partitioning
  - https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/State_Partitioning
  - https://wicg.github.io/storage-buckets/#dom-storagebucketmanager-open
  - https://github.com/mdn/browser-compat-data/blob/main/api/StorageBucketManager.json
tldr: >
  IndexedDB, the Cache API and OPFS share one quota per origin, set by browser policy: up to 60% of
  disk in Chrome and Safari, 10 GiB per site in Firefox. Data is best-effort: under disk pressure the
  browser deletes whole origins, least recently used first, unless `persist()` was granted.
  `estimate()` gives only approximate usage and quota.
---

## Answer

Each origin's IndexedDB, Cache API, Origin Private File System and service worker registrations sit in one storage bucket with one quota. The Storage Standard leaves the size to the browser, and each sets its own policy:

- **Chrome:** an origin may use up to 60% of the disk, all origins 80%.
- **Firefox:** best-effort data gets the smaller of 10% of the disk or 10 GiB per site (all origins under one registrable domain); persistent data up to 50% of the disk.
- **Safari 17+:** about 60% of the disk per origin in Safari, 15% in other apps that embed web views.

`localStorage` and `sessionStorage` have their own 5 MiB limit, and cookies theirs.

**Measuring.** `navigator.storage.estimate()` resolves to `{ usage, quota }`, both deliberately approximate: browsers compress, deduplicate and pad. Since Chrome 133 it reports `quota` as usage + 10 GiB rather than the real limit, to resist fingerprinting. Cross-origin responses cached without CORS (opaque responses) are counted at far more than their size. Writing past the quota rejects with `QuotaExceededError`.

**Eviction.** Storage is *best-effort* by default. When the disk runs low or the browser's total limit is hit, it deletes data one whole origin at a time, least recently used first. `navigator.storage.persist()` asks to make the bucket *persistent*, which only the user can then clear. Chrome grants or denies silently based on engagement, installation, bookmarks and notification permission; Firefox asks the user; Safari uses heuristics such as being a Home Screen web app.

Safari also deletes a site's script-written storage after seven days of Safari use without user interaction, except for Home Screen web apps.

**Partitioning.** In a third-party iframe, Chrome 115+ and Firefox 103+ key storage by top-level site as well as origin, so an embed gets separate data, and quota, on every site.

## Example

```js
const usageMB = async () => Math.round((await navigator.storage.estimate()).usage / 1e6);
console.log(await usageMB());
// → 0

const data = new Uint8Array(10_000_000);
for (let i = 0; i < data.length; i += 65_536) {
  crypto.getRandomValues(data.subarray(i, i + 65_536)); // random bytes don't compress
}
const open = indexedDB.open('files', 1);
open.onupgradeneeded = () => open.result.createObjectStore('blobs');
open.onsuccess = () => {
  const tx = open.result.transaction('blobs', 'readwrite');
  tx.objectStore('blobs').put(data, 'a');
  tx.oncomplete = async () => {
    console.log(await usageMB());
    // → 10
    console.log(await navigator.storage.persisted());
    // → false
  };
};
```

Same output in Chrome 156 and Firefox 159, 3 runs each on a fresh profile. Both reported `quota` as 10,737,418,240 bytes (10 GiB) on a 460 GiB disk: Chrome's usage + 10 GiB, Firefox's per-site cap. A first attempt with a repeating byte pattern counted about 0.5 MB: browsers may compress what they store.

## Pitfalls

- Reading `quota - usage` as free space. Chrome reports a made-up quota, and the spec forbids basing quota on free disk space; a write can still fail, so catch `QuotaExceededError`.
- Caching opaque responses in a service worker. Each 1 KiB opaque response added 0.3–14.8 MB to `usage` in Chrome 156 and 0.3–1.1 MB in Firefox 159 (15 responses each); request with CORS where the server allows it.
- Expecting `persist()` to prompt or succeed. Chrome answers `false` silently for a site without engagement; Firefox shows a prompt, so call it from a clear user action such as "Keep offline".
- Assuming eviction trims old records. It deletes the whole origin at once, so the app must cope with starting empty and re-syncing.

## Follow-ups

**Q:** Does `localStorage` count toward `estimate()`?
**A:** It depends on the browser. A 4-million-character value added nothing to `usage` in Chrome 156 and 4.00 MB in Firefox 159. Either way it keeps its own 5 MiB limit.

**Q:** Can one origin protect some data and let the rest be evicted?
**A:** With the Storage Buckets API: `navigator.storageBuckets.open('drafts', { persisted: true })` creates a named bucket with its own IndexedDB and caches and its own eviction fate. Chrome 122+ only.

**Q:** What did `persist()` do in a headless browser?
**A:** Chrome 156 resolved `false` at once. Firefox 159's promise was still pending after 3 seconds, waiting on a prompt nobody could see.

## Deep dive

### Edge cases

Storage partitioning, checked over HTTPS with an iframe from `other.test` that wrote `localStorage` while embedded in `example.test`:

| Where the `other.test` page then runs | Chrome 156 | Firefox 159 |
|---|---|---|
| iframe in `example.test` | sees the value | sees the value |
| iframe in `app.example.test` (same site) | sees the value | sees the value |
| top-level `other.test` | `null` | `null` |

The partition key is the top-level *site*, not origin, so a subdomain of the embedding site shares the partition. The Storage Standard still keys storage by origin alone and points to the partitioning work in progress; the double keying comes from browser policy. Safari takes another route: MDN reports that cross-origin frames get a separate quota of roughly a tenth of their parent's.
