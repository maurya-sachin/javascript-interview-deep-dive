# Caching

> **Track:** Backend
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Caching on the server side of an API: in-process and Redis caches, cache patterns, invalidation, and HTTP caching for API responses.
Interviews treat caching as a correctness question — stale data, stampedes, and invalidation are where answers fall apart.

## Scope

- **In:** in-memory caches and eviction (LRU, TTL), Redis and its data types, cache-aside / read-through / write-through / write-behind, invalidation strategies, cache stampedes, HTTP caching for API responses (`Cache-Control`, validators, `Vary`), shared caches and CDNs in front of APIs.
- **Out:** client-side query caches → [State and data fetching](../state-and-data-fetching/) · browser caching for asset delivery → [Web performance](../web-performance/) · framework caches → [Next.js](../nextjs/) · Redis as a queue → [Messaging and jobs](../messaging-and-jobs/) · operating a CDN → [Cloud and IaC](../cloud-and-iac/).

## Prerequisites

[HTTP and APIs](../http-and-apis/), [Databases](../databases/).

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- Why cache, and what: hit ratio, latency vs freshness trade-offs
- In-memory caches: LRU, TTL, memory limits, per-instance inconsistency
- Redis: data types, expiry, eviction policies, persistence trade-offs
- Cache patterns: cache-aside, read-through, write-through, write-behind
- Invalidation: TTL vs explicit, versioned keys, tag-based purging
- Failure modes: stampedes, thundering herd, hot keys, cache penetration
- HTTP caching for APIs: `Cache-Control`, `ETag` and revalidation, `Vary`, private vs shared caches
- `stale-while-revalidate` and `stale-if-error`
- CDNs in front of APIs: cache keys, purging, what must never be cached

## Sources

- [RFC 9111](https://www.rfc-editor.org/rfc/rfc9111) — HTTP caching
- [RFC 5861](https://www.rfc-editor.org/rfc/rfc5861) — `stale-while-revalidate` and `stale-if-error`
- [MDN — HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)
- [Redis docs](https://redis.io/docs/latest/)
- [Redis — Key eviction](https://redis.io/docs/latest/develop/reference/eviction/)
- [Cloudflare Cache docs](https://developers.cloudflare.com/cache/)
