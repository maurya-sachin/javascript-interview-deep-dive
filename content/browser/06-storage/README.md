# 06 — Storage

> **Status:** 🔴 planned · **Published:** 0/5 · **Last verified:** —

Where a page can keep data: cookies, Web Storage, IndexedDB and the Cache API, how each is scoped and shared, and how much the browser lets a site keep.

## Learning goals

After this chapter you can:

- Choose a storage mechanism for a given piece of data
- Explain which requests a cookie is sent with
- Predict how `localStorage` and `sessionStorage` behave across tabs
- Use IndexedDB transactions without them committing early, and check quota

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Cookies vs Web Storage vs IndexedDB vs Cache API: size, sync vs async, scope, who can read them → 010
- Cookie scope and lifetime: `Domain`, `Path`, `Expires`/`Max-Age`, host-only cookies, `document.cookie`, partitioned cookies → 020
- `localStorage` vs `sessionStorage`: per-origin and per-tab scope, the `storage` event → 030
- IndexedDB: object stores, indexes, transactions and auto-commit, versions → 040
- Quotas: `navigator.storage.estimate()`, `persist()`, eviction, storage partitioning → 050

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [Cookies, `localStorage`, `sessionStorage`, or IndexedDB — how do you choose?](010-choosing-browser-storage.md) | easy | 🟡 draft |
| 020 | [How do cookies work — which requests carry them, and for how long?](020-how-cookies-work.md) | medium | 🟡 draft |
| 030 | [How do `localStorage` and `sessionStorage` behave across tabs?](030-web-storage-scope.md) | medium | 🟡 draft |
| 040 | [How does IndexedDB work, and why do its transactions commit on their own?](040-indexeddb-transactions.md) | hard | 🟡 draft |
| 050 | [How much can a site store, and when does the browser delete it?](050-quotas-and-eviction.md) | medium | 🟡 draft |
<!-- generated:questions:end -->

## Sources

- [RFC 6265 — HTTP State Management](https://httpwg.org/specs/rfc6265.html)
- [RFC 6265bis draft](https://datatracker.ietf.org/doc/draft-ietf-httpbis-rfc6265bis/)
- [HTML — Web storage](https://html.spec.whatwg.org/multipage/webstorage.html)
- [Indexed Database API](https://w3c.github.io/IndexedDB/)
- [Storage Standard](https://storage.spec.whatwg.org/)
- [Client-side storage partitioning](https://privacycg.github.io/storage-partitioning/)
