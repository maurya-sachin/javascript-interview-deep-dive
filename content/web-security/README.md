# Web security

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Security for web apps on both sides of the network: the browser's security model, common attacks, and the defences against them.
Frontend and backend interviews both ask it, and the answers depend on knowing exactly what the browser enforces.

## Scope

- **In:** the same-origin policy and CORS, XSS and CSP, CSRF and cookie attributes, clickjacking, injection, SSRF, security headers, dependency and supply-chain risk, secrets handling.
- **Out:** how cookies and storage work → [Browser runtime](../browser/) · sessions, tokens, OAuth, and passkeys → [Authentication](../authentication/) · building the API itself → [Backend patterns](../backend-patterns/) · TLS mechanics → [Networking](../networking/) · package manager mechanics → [Tooling](../tooling/).

## Prerequisites

[Browser runtime](../browser/) for the client side, [HTTP and APIs](../http-and-apis/) for the server side.

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- Browser security model: origins, same-origin policy, CORS and preflight
- XSS: stored, reflected, DOM-based; escaping and sanitizing; Trusted Types
- Content Security Policy
- CSRF, `SameSite`, and cookie attributes
- Clickjacking and framing controls
- Server-side attacks: injection, SSRF, path traversal, mass assignment
- Security headers and HTTPS
- Supply chain: dependency risk, lockfiles, integrity checks
- Secrets: what must never ship to the client

## Sources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN Web security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Fetch Standard](https://fetch.spec.whatwg.org/) — CORS as browsers implement it
