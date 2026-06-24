---
title: "OAuth 2.0 & OpenID Connect Attacks - Practitioner Guide"
date: 2026-06-24T13:15:00+05:30
lastmod: 2026-06-24T13:15:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: img/burp-academy.png
  alt: "OAuth 2.0 and OpenID Connect attacks"
featureimage: img/burp-academy.png
simg: img/burp-academy.png
categories:
  - Web Security
  - API Security
tags:
  - oauth
  - openid-connect
  - oidc
  - access-control
  - jwt
  - account-takeover
  - redirect-uri
  - web-security
draft: false
toc: true
---

OAuth and OIDC sit at the seam between authentication and authorization — and that seam leaks. This guide covers the practitioner-level attacks, with concrete `redirect_uri` bypass walkthroughs. Companion to my [JWT & Authentication Attacks](/post/jwt-and-authentication-attacks/) and [Access Control](/post/burp-academy-broken-access-control/) posts.

<!--more-->

---

## The flow (and where it breaks)

- **Roles:** resource owner (user), client (app), authorization server / AS (e.g. Keycloak, Auth0), resource server (API).
- **Authorization Code flow:**
  ```
  GET /authorize?response_type=code&client_id=APP&redirect_uri=https://app/cb&scope=openid&state=XYZ
  → user authenticates → 302 https://app/cb?code=AUTHCODE&state=XYZ
  → app POSTs code (+secret/PKCE verifier) to /token → access_token (+ id_token for OIDC)
  ```
- **PKCE** binds the code to the requester via `code_challenge`/`code_verifier`.

Recurring theme: **every client-supplied value (`redirect_uri`, `state`, `scope`, `nonce`) is attacker-influenceable, and `code`/tokens are bearer secrets.** Bugs are about *validation* and *leakage*.

---

## 1. `redirect_uri` validation flaws — the #1 takeover primitive

If the AS doesn't match `redirect_uri` **exactly** against the registered allow-list, you can deliver the victim's `code` to your server. Walkthrough of the bypasses to try in Burp:

**Baseline (legit):**
```
GET /authorize?client_id=APP&redirect_uri=https://app.example.com/callback&response_type=code&scope=openid&state=xyz
```

**Bypass attempts** (swap the `redirect_uri`, send the link to the victim, catch the `code` on your host):

| Bypass | Payload |
|--------|---------|
| Subdomain/suffix (weak prefix match) | `https://app.example.com.evil.com/cb` |
| Userinfo `@` trick | `https://app.example.com@evil.com/cb` |
| Path append / traversal | `https://app.example.com/callback/../../evil` |
| Open redirect chain (legit host) | `https://app.example.com/callback?next=//evil.com` |
| Parameter pollution | two `redirect_uri=` params (AS validates one, uses the other) |
| Encoded separators | `https://app.example.com%2f.evil.com`, `…#@evil.com` |
| `localhost` allow + port/path | `http://localhost.evil.com`, `http://localhost:1337` |

**Confirming impact:** if any bypass returns `302 .../?code=…` to a host you control, exchange that `code` at `/token` (with the public client_id / no-PKCE) → you hold the victim's session → **account takeover**. Even without the secret, a leaked code + missing PKCE is enough.

---

## 2. Missing/unvalidated `state` → CSRF

`state` is OAuth's CSRF token. If it's absent, static, or not checked on return:
- **Forced login / account linking:** start a flow with *your* `code`, deliver the callback URL to the victim → their session links to your account (or vice-versa), enabling login-CSRF or stealthy account hijack of linked social logins.

Test: remove `state`, reuse an old `state`, or change it on the callback — if the flow still completes, it's vulnerable.

## 3. Authorization-code leakage & replay

Codes leak via `Referer` (off-site resources on the callback page), redirects, and proxy logs. Controls that must exist: **single-use** codes, short TTL, and **PKCE** binding. Tests:
- **Replay:** submit the same `code` to `/token` twice → second should fail.
- **No PKCE:** a public client without `code_challenge` means a leaked code = takeover.

## 4. Implicit flow token leakage

`response_type=token` puts the access token in the **URL fragment** → leaks via browser history / `Referer` / injected JS. Legacy and discouraged — flag its presence.

## 5. Scope escalation

Request extra `scope` (or tamper the token's scope) and check enforcement: does the AS grant it silently, or the resource server accept a `read` token on a `write` endpoint? (Ties to the JWT-scope check.)

## 6. OIDC `id_token` validation

The `id_token` is a JWT — so all [JWT attacks](/post/jwt-and-authentication-attacks/) apply. The client **must** verify: signature, `iss`, `aud` (== its client_id), `exp`, and **`nonce`** (replay protection). Misses → forge identity (`alg:none`/key confusion) or replay an old id_token.

## 7. SSRF via OIDC

`request_uri` (fetch the auth request from a URL) and the discovery (`/.well-known/openid-configuration`) / JWKS endpoints can be pointed at internal hosts → [SSRF](/post/ssrf-server-side-request-forgery/).

## 8. Account takeover via identity linking

If the app links accounts by **email** but the IdP doesn't assert `email_verified:true`, register at the IdP with the victim's email → log into their app account. Also **pre-account-linking** (link before the victim signs up).

## 9. Mix-up attacks

With multiple IdPs, confuse the client about which AS issued a `code` so it sends the code to the attacker's AS. Defense: per-AS `state`/issuer tracking.

---

## Methodology

Proxy the entire dance and for each leg check:
1. Is `redirect_uri` **exact-matched**? (run the bypass table)
2. Is `state` present **and** verified on return?
3. Is **PKCE** enforced for public clients?
4. Are `code`s **single-use** and short-lived?
5. Is the `id_token` **fully validated** (sig/iss/aud/exp/nonce)?
6. Is `scope` enforced at the resource server?
7. Is account linking gated on `email_verified`?

**Tools:** Burp (manual flow tampering, the `redirect_uri`/`state` cases), `jwt_tool` for the id_token.

## Defenses

Exact-match `redirect_uri`; mandatory `state` + PKCE; single-use short-TTL codes; full id_token validation; resource-server scope enforcement; require `email_verified` before linking; avoid implicit flow.

## Severity (bug bounty)

| Finding | Typical rating |
|---------|----------------|
| `redirect_uri` bypass → code/token theft → ATO | P1 |
| Missing `state` → account linking/login CSRF | P2–P3 |
| id_token not validated → identity forgery | P1 |
| Scope escalation | P2–P3 |

Prove takeover concretely (you held another user's session/account), not just that a parameter was accepted.

---

*Companion to [JWT & Authentication Attacks](/post/jwt-and-authentication-attacks/) and [API Access Control](/post/api-access-control-bola-bfla-bopla/). Practice in PortSwigger's [OAuth authentication](https://portswigger.net/web-security/oauth) labs. Authorized testing only.*
