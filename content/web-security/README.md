# Web security

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Security for web apps on both sides of the network: the browser's security model, common attacks, and authentication.
Frontend and backend interviews both ask it, and the answers depend on knowing exactly what the browser enforces.

## Scope

- **In:** the same-origin policy and CORS, XSS and CSP, CSRF and cookie attributes, clickjacking, authentication and sessions, OAuth 2.0 and OpenID Connect, passkeys, injection, SSRF, security headers, dependency and supply-chain risk, secrets handling.
- **Out:** how cookies and storage work → [Browser runtime](../browser/) · building the API itself → [Backend](../backend/) · package manager mechanics → [Tooling](../tooling/).

## Prerequisites

[Browser runtime](../browser/) for the client side, [Backend](../backend/) for the server side.

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
- Authentication: sessions vs tokens, JWT pitfalls, password storage
- OAuth 2.0 and OpenID Connect flows, PKCE
- Passkeys and WebAuthn
- Server-side attacks: injection, SSRF, path traversal, mass assignment
- Security headers and HTTPS
- Supply chain: dependency risk, lockfiles, integrity checks
- Secrets: what must never ship to the client

## Sources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN Web security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Fetch Standard](https://fetch.spec.whatwg.org/) — CORS as browsers implement it
