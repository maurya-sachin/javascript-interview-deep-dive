# Backend

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Building HTTP services in Node.js: HTTP semantics, API design, data access, caching, background work, and running in production.
Full-stack and backend interviews test whether you can design a service that stays correct under load and failure.

## Scope

- **In:** HTTP semantics, REST and GraphQL API design, real-time transports, HTTP frameworks in Node.js, validation and error handling, databases from Node.js, caching, queues and background jobs, rate limiting, observability, scaling and deployment.
- **Out:** the runtime itself → [Node.js runtime](../nodejs/) · authentication and attacks → [Web security](../web-security/) · asset delivery and Core Web Vitals → [Web performance](../web-performance/).

## Prerequisites

[Node.js runtime](../nodejs/).

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- HTTP: methods, status codes, idempotency, headers, content negotiation
- API design: REST, versioning, pagination, error formats; GraphQL and its trade-offs
- Real-time: WebSockets, Server-Sent Events, long polling
- HTTP frameworks: middleware model, routing, request lifecycle (Express, Fastify)
- Validation and error handling at the boundary
- Data access: connection pooling, transactions, ORMs vs query builders, N+1 queries
- Caching: in-memory, Redis, cache invalidation, HTTP caching for APIs
- Background work: queues, retries, idempotent jobs, scheduling
- Rate limiting and backpressure
- Observability: structured logging, metrics, tracing
- Scaling and deployment: statelessness, horizontal scaling, containers, serverless

## Sources

- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) — HTTP semantics
- [RFC 9111](https://www.rfc-editor.org/rfc/rfc9111) — HTTP caching
- [Node.js API docs](https://nodejs.org/docs/latest/api/)
- [GraphQL specification](https://spec.graphql.org/)
- [OpenTelemetry docs](https://opentelemetry.io/docs/)
