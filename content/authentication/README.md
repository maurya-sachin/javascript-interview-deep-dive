# Authentication

> **Track:** Backend
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Proving who a user is and deciding what they may do: sessions, tokens, OAuth 2.0 and OpenID Connect, passkeys, and authorization models.
Full-stack interviews ask it constantly, and the follow-ups always land on where tokens live and how they're revoked.

## Scope

- **In:** password storage, sessions vs tokens, JWT structure and pitfalls, refresh tokens and rotation, OAuth 2.0 flows and PKCE, OpenID Connect, single sign-on, passkeys and WebAuthn, multi-factor authentication, authorization models (RBAC, ABAC, ReBAC), token storage on web and mobile.
- **Out:** CSRF, XSS, cookie attributes as attack defences → [Web security](../web-security/) · how cookies and storage work → [Browser runtime](../browser/) · auth middleware placement → [Backend patterns](../backend-patterns/) · TLS → [Networking](../networking/).

## Prerequisites

[HTTP and APIs](../http-and-apis/). [Web security](../web-security/) helps.

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- Authentication vs authorization; identity, credentials, sessions
- Password storage: hashing, salts, slow hashes (Argon2, bcrypt), credential stuffing
- Sessions vs tokens: server sessions, stateless tokens, revocation trade-offs
- JWT: structure, signing vs encryption, common pitfalls (`alg`, expiry, storage)
- Refresh tokens: rotation, reuse detection, logout
- OAuth 2.0: roles, authorization code flow, PKCE, client credentials, scopes
- OpenID Connect: ID tokens, discovery, single sign-on
- Passkeys and WebAuthn: public-key credentials, registration and authentication ceremonies
- Multi-factor authentication: TOTP, push, recovery
- Authorization models: RBAC, ABAC, relationship-based; enforcing checks on every request

## Sources

- [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749) — OAuth 2.0
- [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636) — PKCE
- [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700) — OAuth 2.0 Security Best Current Practice
- [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519) — JSON Web Token
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [Web Authentication (WebAuthn) Level 3](https://www.w3.org/TR/webauthn-3/)
- [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html) — authentication and authenticator management
- OWASP cheat sheets: [Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html), [Session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [Password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
