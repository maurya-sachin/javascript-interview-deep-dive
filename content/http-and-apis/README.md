# HTTP and APIs

> **Track:** Backend
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

HTTP semantics and the API styles built on them: REST, GraphQL, gRPC, and real-time transports.
Every backend and full-stack interview asks you to design or critique an API, and the answer rests on what HTTP actually guarantees.

## Scope

- **In:** HTTP methods, status codes, headers, idempotency and safety, content negotiation, REST constraints and resource design, versioning, pagination, error formats, GraphQL, gRPC and Protocol Buffers, WebSockets, Server-Sent Events, long polling, API contracts (OpenAPI).
- **Out:** wire protocols (TCP, TLS, HTTP/2 and HTTP/3 framing) → [Networking](../networking/) · implementing the server → [Backend patterns](../backend-patterns/) · caching responses → [Caching](../caching/) · auth flows → [Authentication](../authentication/) · CORS → [Web security](../web-security/).

## Prerequisites

[Browser runtime](../browser/) or [Node.js runtime](../nodejs/) — either side of a `fetch`.

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- HTTP: methods, status codes, idempotency and safety, headers, content negotiation
- Conditional requests: `ETag`, `If-None-Match`, `If-Match` and optimistic concurrency
- REST: resources, representations, statelessness; what "RESTful" really requires
- API design: versioning, pagination (offset vs cursor), filtering, error formats (Problem Details)
- API contracts: OpenAPI, schema-first vs code-first, backwards compatibility
- GraphQL: schema, resolvers, N+1 and DataLoader, caching and trade-offs vs REST
- gRPC: Protocol Buffers, streaming modes, when it beats JSON over HTTP
- Real-time: WebSockets, Server-Sent Events, long polling — choosing between them
- Webhooks: delivery, signatures, retries

## Sources

- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) — HTTP semantics
- [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) — Problem Details for HTTP APIs
- [RFC 6455](https://www.rfc-editor.org/rfc/rfc6455) — the WebSocket protocol
- [HTML Standard — Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [Fielding — REST](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) — the dissertation chapter that defines it
- [GraphQL specification](https://spec.graphql.org/)
- [gRPC docs](https://grpc.io/docs/) and [Protocol Buffers](https://protobuf.dev/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
