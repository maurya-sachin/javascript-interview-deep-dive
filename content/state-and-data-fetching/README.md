# State and data fetching

> **Track:** Frontend
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Where client state lives once it outgrows a component, and how server data is fetched, cached, and kept fresh on the client.
Frontend interviews use it to separate people who reach for a library from people who can say what problem it solves.

## Scope

- **In:** client state vs server state, external stores and `useSyncExternalStore`, Redux and Redux Toolkit, lightweight stores (Zustand, signals), TanStack Query and RTK Query, client-side caching and invalidation, optimistic updates, request races and cancellation, URL and form state.
- **Out:** `useState`, context, and rendering → [React](../react/) · framework caching and Server Components data → [Next.js](../nextjs/) · `fetch` and `AbortController` as Web APIs → [Browser runtime](../browser/) · the API on the other end → [HTTP and APIs](../http-and-apis/) · server-side caches → [Caching](../caching/).

## Prerequisites

[React](../react/) — especially state, effects, and context.

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- Classifying state: local, shared, server, URL, form — and where each belongs
- External stores: subscriptions, `useSyncExternalStore`, tearing
- Redux: single store, reducers, actions, middleware; what Redux Toolkit changes
- Lightweight stores: Zustand, Jotai, signals — selectors and re-render cost
- Server state: TanStack Query's cache, query keys, stale time vs garbage collection
- Invalidation and refetching: on focus, on mutation, polling
- Mutations: optimistic updates, rollback, retries
- Fetching correctness: race conditions, cancellation, request waterfalls, deduplication
- Pagination and infinite queries
- Prefetching and hydrating client caches from the server

## Sources

- [React — Managing state](https://react.dev/learn/managing-state)
- [React — `useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)
- [Redux docs](https://redux.js.org/)
- [Redux Toolkit](https://redux.js.org/toolkit/) and [RTK Query](https://redux.js.org/toolkit/rtk-query/overview)
- [TanStack Query docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Zustand docs](https://zustand.docs.pmnd.rs/)
