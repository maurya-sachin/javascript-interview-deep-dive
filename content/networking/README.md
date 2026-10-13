# Networking

> **Track:** Infrastructure and delivery
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

What happens between a URL and a response: DNS, TCP, TLS, HTTP/2 and HTTP/3, and the proxies and load balancers in the path.
"What happens when you type a URL" is a classic interview opener, and every layer of it lives here.

## Scope

- **In:** DNS resolution and records, IP and ports, TCP (handshake, flow and congestion control), UDP, TLS 1.3 handshake and certificates, HTTP/1.1 vs HTTP/2 vs HTTP/3 and QUIC on the wire, connection reuse, proxies, reverse proxies, load balancers (L4 vs L7), NAT and firewalls basics.
- **Out:** HTTP semantics and API design → [HTTP and APIs](../http-and-apis/) · how the browser schedules and prioritizes requests → [Web performance](../web-performance/) · HTTPS as a security policy (HSTS, mixed content) → [Web security](../web-security/) · managed load balancers and CDNs → [Cloud and IaC](../cloud-and-iac/).

## Prerequisites

None. [HTTP and APIs](../http-and-apis/) helps.

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- From URL to response: the full path end to end
- DNS: recursive resolution, record types, TTLs and caching, DNS-based failover
- TCP: three-way handshake, flow control, congestion control, head-of-line blocking
- UDP and when it's chosen
- TLS 1.3: handshake, certificates and chains, SNI, session resumption
- HTTP/1.1 vs HTTP/2: multiplexing, header compression, connection reuse
- HTTP/3 and QUIC: why UDP, 0-RTT, connection migration
- Proxies: forward vs reverse, TLS termination, `X-Forwarded-For`
- Load balancing: L4 vs L7, algorithms, health checks, sticky sessions
- Debugging the network: `dig`, `curl -v`, latency vs bandwidth

## Sources

- [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034) and [RFC 1035](https://www.rfc-editor.org/rfc/rfc1035) — DNS
- [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293) — TCP
- [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446) — TLS 1.3
- [RFC 9113](https://www.rfc-editor.org/rfc/rfc9113) — HTTP/2
- [RFC 9114](https://www.rfc-editor.org/rfc/rfc9114) — HTTP/3
- [RFC 9000](https://www.rfc-editor.org/rfc/rfc9000) — QUIC
- [nginx docs](https://nginx.org/en/docs/)
