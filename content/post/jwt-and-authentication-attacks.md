---
title: "JWT & Authentication Attacks - Practitioner Guide"
date: 2026-06-24T13:00:00+05:30
lastmod: 2026-06-24T13:00:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: img/burp-academy.png
  alt: "JWT and authentication attacks"
featureimage: img/burp-academy.png
simg: img/burp-academy.png
categories:
  - Web Security
  - API Security
tags:
  - jwt
  - authentication
  - portswigger
  - burp-academy
  - access-control
  - oauth
  - web-security
draft: false
toc: true
---

Authentication is *who you are*; authorization is *what you may do*. Break the first and the second is moot. This practitioner guide covers **JWT attacks** plus the broader authentication weaknesses they sit alongside — the companion to my [Broken Access Control](/post/burp-academy-broken-access-control/) and [API Access Control](/post/api-access-control-bola-bfla-bopla/) posts.

<!--more-->

---

## JWT in 30 seconds

A JSON Web Token is three base64url parts: `header.payload.signature`.

```
eyJhbGciOiJIUzI1NiJ9 . eyJzdWIiOiJ3aWVuZXIiLCJyb2xlIjoidXNlciJ9 . <sig>
   header {alg,typ}        payload (claims: sub, role, exp, …)      signature
```

The signature is the *only* thing stopping a client from editing the payload. Every JWT attack is, at heart, **defeating or sidestepping signature verification**.

---

## 1. `alg: none` — unsigned token accepted

If the server honors `"alg":"none"`, drop the signature entirely and forge any claims.

```jsonc
header:  {"alg":"none","typ":"JWT"}
payload: {"sub":"administrator","role":"admin"}
token:   base64url(header) + "." + base64url(payload) + "."   // trailing dot, empty sig
```
Try case/variant bypasses too: `None`, `NONE`, `nOnE` (filters that only block lowercase).

## 2. Algorithm / key confusion (RS256 → HS256)

Asymmetric tokens verify with the **public** key. If you can switch `alg` to `HS256`, some libraries will HMAC-verify using that public key as the secret — which you know.

- Obtain the public key (`/jwks.json`, `/.well-known/...`, TLS cert, or derive from two tokens).
- Re-sign your forged payload with `HMAC-SHA256` using the **public key bytes** as the secret, `alg:HS256`.

## 3. Weak HMAC secret — offline brute force

HS256 with a guessable secret is crackable offline (no requests to the target):

```bash
hashcat -a 0 -m 16500 token.jwt /usr/share/wordlists/rockyou.txt
# or: jwt_tool <token> -C -d wordlist.txt
```
Crack it → mint tokens with any claims.

## 4. `kid` (Key ID) injection

`kid` selects which key verifies the token; if it's used unsanitized:

- **Path traversal:** `"kid":"../../dev/null"` → key resolves to empty/known content → sign with that.
- **SQLi:** `"kid":"x' UNION SELECT 'secret'-- "` → make the lookup return a value you control.

## 5. `jku` / `x5u` — attacker-hosted keys

If the header's `jku` (JWK Set URL) or `x5u` is trusted, host your own key set and point at it:

```jsonc
header: {"alg":"RS256","jku":"https://attacker.example/jwks.json","kid":"k1"}
```
Sign with your private key whose public half is served at that URL. (Server-side SSRF allow-listing of `jku` hosts is the intended defense.)

## 6. Claim tampering & token lifecycle

Even with a valid signature, check what the server *enforces*:

- **No / not-checked `exp`** → tokens never expire; replay indefinitely.
- **Stale authorization** → role revoked server-side but old JWT still works until expiry (the JWT-vs-session trade-off).
- **Missing `aud` / `iss`** → a token minted for service A accepted by service B.
- **Sensitive data in payload** → JWTs are *signed, not encrypted*; base64url-decode to read claims.

---

## Beyond JWT: classic auth weaknesses

| Class | Test |
|-------|------|
| Credential brute force / stuffing | Rate-limit bypass (`X-Forwarded-For` rotation, case/Unicode in username), password spraying |
| Username enumeration | Differing responses/timing for valid vs invalid users |
| 2FA bypass | Skip the OTP step (force-browse to post-2FA page), brute weak OTP, reuse/replay codes |
| Password reset poisoning | `Host` / `X-Forwarded-Host` header controls the reset link → token sent to attacker host |
| OAuth flaws | Loose `redirect_uri` match, missing/`state` CSRF, code/token leakage via Referer |

---

## Tooling & methodology

- **Burp JWT Editor** extension — edit claims, auto-handle `alg`, embed JWKs, key-confusion attacks.
- **`jwt_tool`** — `-M pb` (playbook scan), `-X a` (alg:none), `-X k` (key confusion), `-C` (crack).
- **hashcat** `-m 16500` for HS secrets.

Workflow: decode → identify `alg` → try `none` → try key confusion → crack weak HS → test `kid`/`jku` → check `exp`/`aud`/revocation. Always verify the forged token is *accepted on a protected action*, not just well-formed.

## Defenses

- Pin the algorithm server-side (don't trust the header `alg`); reject `none`.
- Strong random HS secrets (≥256-bit) or properly separated asymmetric keys.
- Sanitize/allow-list `kid`; ignore or strictly allow-list `jku`/`x5u`.
- Always validate `exp`, `iss`, `aud`; keep tokens short-lived; check server-side revocation for sensitive actions.
- Never put secrets in the payload.

## Severity (bug bounty)

| Finding | Typical rating |
|---------|----------------|
| `alg:none` / key confusion / cracked secret → admin forgery | P1 |
| Password-reset poisoning → account takeover | P1–P2 |
| 2FA bypass | P1–P2 |
| Username enumeration | P4–P5 |

---

*Companion to [Broken Access Control](/post/burp-academy-broken-access-control/) and [API Access Control](/post/api-access-control-bola-bfla-bopla/). Practice in PortSwigger's [JWT attacks](https://portswigger.net/web-security/jwt) and [authentication](https://portswigger.net/web-security/authentication) labs. Authorized testing only.*
