# 06 — Storage

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Where a page can keep data: cookies, Web Storage, IndexedDB and the Cache API, how each is scoped and shared, and how much the browser lets a site keep.

## Learning goals

After this chapter you can:

- Choose a storage mechanism for a given piece of data
- Explain which requests a cookie is sent with
- Predict how `localStorage` and `sessionStorage` behave across tabs
- Use IndexedDB transactions without them committing early, and check quota

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Cookies vs Web Storage vs IndexedDB vs Cache API: size, sync vs async, scope, who can read them → —
- Cookie scope and lifetime: `Domain`, `Path`, `Expires`/`Max-Age`, host-only cookies, `document.cookie`, partitioned cookies → —
- `localStorage` vs `sessionStorage`: per-origin and per-tab scope, the `storage` event → —
- IndexedDB: object stores, indexes, transactions and auto-commit, versions → —
- Quotas: `navigator.storage.estimate()`, `persist()`, eviction, storage partitioning → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
<!-- generated:questions:end -->

## Sources

- [RFC 6265 — HTTP State Management](https://httpwg.org/specs/rfc6265.html)
- [RFC 6265bis draft](https://datatracker.ietf.org/doc/draft-ietf-httpbis-rfc6265bis/)
- [HTML — Web storage](https://html.spec.whatwg.org/multipage/webstorage.html)
- [Indexed Database API](https://w3c.github.io/IndexedDB/)
- [Storage Standard](https://storage.spec.whatwg.org/)
- [Client-side storage partitioning](https://privacycg.github.io/storage-partitioning/)
