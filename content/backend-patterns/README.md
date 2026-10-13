# Backend patterns

> **Track:** Backend
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

How a Node.js service is structured inside: frameworks and middleware, validation, error handling, layering, and the safeguards that keep it correct under load.
Backend interviews probe these patterns through "what happens when this request fails halfway" questions.

## Scope

- **In:** HTTP frameworks (Express, Fastify, NestJS), the middleware model and request lifecycle, routing, validation at the boundary, error handling and error responses, layering (controllers, services, repositories), dependency injection, configuration, rate limiting, backpressure and timeouts, idempotency keys, graceful shutdown of a service.
- **Out:** the runtime itself → [Node.js runtime](../nodejs/) · API design and HTTP semantics → [HTTP and APIs](../http-and-apis/) · data access → [Databases](../databases/) · background work → [Messaging and jobs](../messaging-and-jobs/) · auth middleware internals → [Authentication](../authentication/) · injection and SSRF → [Web security](../web-security/).

## Prerequisites

[Node.js runtime](../nodejs/), [HTTP and APIs](../http-and-apis/).

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- HTTP frameworks: middleware model, routing, request lifecycle (Express, Fastify, NestJS)
- Validation at the boundary: schemas, parsing vs validating, sharing types with the client
- Error handling: operational vs programmer errors, async errors in middleware, error responses
- Layering: controllers, services, repositories; where business logic belongs
- Dependency injection and testable service structure
- Configuration and environment: twelve-factor config, failing fast on bad config
- Rate limiting: token bucket, sliding window, per-user vs per-IP, rate-limit headers
- Backpressure, timeouts, and cancellation across a request
- Idempotency keys for safe retries of non-idempotent requests
- Graceful shutdown: draining connections, health and readiness endpoints

## Sources

- [Express — Using middleware](https://expressjs.com/en/guide/using-middleware.html)
- [Fastify docs](https://fastify.dev/docs/latest/)
- [NestJS docs](https://docs.nestjs.com/)
- [IETF draft — RateLimit header fields](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/)
- [IETF draft — Idempotency-Key header](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/)
- [The Twelve-Factor App](https://12factor.net/)
