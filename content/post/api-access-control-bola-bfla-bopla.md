---
title: "API Access Control: BOLA, BFLA & BOPLA - Practitioner Guide"
date: 2026-06-24T12:00:00+05:30
lastmod: 2026-06-24T12:00:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: img/burp-academy.png
  alt: "API access control — OWASP API Security Top 10"
featureimage: img/burp-academy.png
simg: img/burp-academy.png
categories:
  - Web Security
  - API Security
tags:
  - api-security
  - access-control
  - bola
  - bfla
  - bopla
  - mass-assignment
  - graphql
  - jwt
  - owasp-api-top-10
draft: false
toc: true
---

Access control is the dominant theme of the **OWASP API Security Top 10** — three of the ten are authorization failures: **API1 BOLA**, **API3 BOPLA**, and **API5 BFLA**. APIs are where broken access control hides best: no UI to constrain you, predictable resource paths, and back-ends that often trust the client far too much. This is the practitioner companion to my [Broken Access Control guide](/post/burp-academy-broken-access-control/).

<!--more-->

---

## Why APIs are the soft spot

A browser app hides functionality behind the UI; an API exposes it directly. Endpoints are guessable (`/api/v1/users/{id}`), objects are referenced by ID, and the same back-end serves web, mobile, and partners — so a check missing on one path is reachable from another. **Test with (at least) two accounts** and an intercepting proxy: capture every request as account A, then replay it as B (and as no one).

---

## 1. BOLA — Broken Object Level Authorization (API1)

The #1 API risk. The endpoint validates that you're *authenticated* but not that you *own the object*.

```
GET /api/orders/1057          (your order)
GET /api/orders/1058          (someone else's — returned anyway)  ← BOLA
```

**How to test**
- Swap object IDs between accounts: does A get B's object?
- Try sequential, then leaked GUIDs (GUIDs are *harder to guess*, not *authorized*).
- Check **all verbs**: a `GET` may be checked while `PUT`/`DELETE` on the same object is not.
- Look in nested/expanded responses (`?include=owner`) for data the object shouldn't expose.

**Key lesson:** opaque, hashed, or **encrypted IDs are obfuscation, not authorization**. If you can obtain or reproduce the identifier, the server must *still* re-check ownership on every request.

---

## 2. BFLA — Broken Function Level Authorization (API5)

You reach a **privileged function** (admin or another role) you shouldn't.

```
POST /api/users/1058/promote        # admin-only action, called as a normal user
DELETE /api/users/1058              # destructive admin verb
GET  /api/admin/export-all          # unlinked admin endpoint
```

**How to test**
- Enumerate admin/privileged routes (API docs, Swagger/OpenAPI, JS, `/api/v2/`, guessable verbs).
- Replay an admin action captured from a privileged account using a low-priv token.
- **Method tampering:** if `POST /admin/x` is blocked, try `GET`/`PUT`/`PATCH`/`DELETE`, or path tricks (`/admin/x/`, case changes).
- Watch for "shadow"/undocumented and old-version endpoints (`/v1/` still live after `/v2/` added auth).

---

## 3. BOPLA / Mass Assignment — Broken Object Property Level Authorization (API3)

Authorization is enforced at the *object* level but not per *property*. Two halves:

**Excessive data exposure (read):** the API returns more fields than the UI shows — `GET /api/me` leaks `role`, `isAdmin`, `creditLimit`, internal flags.

**Mass assignment (write):** the API binds the whole request body to the model, so you set fields you shouldn't.

```jsonc
// intended:
{ "email": "x@y.com" }
// abused — add privileged properties seen in the GET response:
{ "email": "x@y.com", "roleid": 2, "isAdmin": true, "verified": true }
```

**How to test:** diff what `GET` returns vs what `PUT`/`PATCH` accepts; add any privileged-looking property from the read response into the write body. PortSwigger's *"Exploiting a mass assignment vulnerability"* lab is the canonical example.

---

## 4. GraphQL access control

GraphQL collapses many endpoints into one, so authz must be enforced **per field/resolver** — and frequently isn't.

- **Introspection** — if enabled, query the full schema to discover hidden types, fields, and **mutations** (`__schema { types { name fields { name } } }`).
- **Field-level authz bypass** — the UI never asks for `user { passwordHash }` or `user(id:1058){ salary }`, but the resolver returns it.
- **Mutation access** — privileged mutations (`deleteUser`, `setRole`) reachable directly.
- **Batching / aliasing** — send many aliased queries in one request to bypass per-request rate/authz controls or brute-force IDs:
  ```graphql
  { a: user(id:1058){email}  b: user(id:1059){email}  c: user(id:1060){email} }
  ```
- **Nested traversal** — reach other tenants' objects through a relationship the top-level check missed (`myOrg { users { privateNotes } }`).

---

## 5. JWT-scoped authorization

When authz decisions ride on token claims (`role`, `scope`, `tenant_id`), check whether the server **re-validates** them:

- **Trusting claims blindly** — does flipping `"role":"admin"` work? (Only if signature isn't verified — see `alg:none` / key-confusion attacks.)
- **Over-scoped tokens** — an OAuth token issued for `read` accepted on `write`; `aud`/`scope` not enforced per endpoint.
- **`kid`/JKU manipulation** — point key resolution at an attacker-controlled key.
- **Stale authorization** — role revoked server-side but the old JWT still authorizes until expiry.

> Authn (who you are) ≠ authz (what you may do). A perfectly valid token must still be checked against the specific object and action.

---

## 6. Multi-tenant isolation

SaaS back-ends serve many orgs from one database. The bug: the **tenant scope** comes from the request, not the session.

- `tenant_id` / `org_id` in the URL, body, or a header that the server trusts instead of deriving from the token.
- Cross-tenant object IDs (BOLA across tenants) — the most damaging variant, exposing other customers' data.
- Test: authenticate to tenant A, then reference tenant B's IDs / set `X-Tenant-Id: B`.

---

## Testing methodology (API authz)

1. Build an endpoint inventory — Swagger/OpenAPI, JS, mobile proxy capture, `/robots.txt`, doc sites.
2. Two accounts (+ unauthenticated). Capture every request as A; replay as B and as none.
3. For each object endpoint: swap IDs (BOLA), try every verb (BFLA), diff read-vs-write fields (BOPLA).
4. GraphQL: run introspection, enumerate mutations, try field-level and batched access.
5. Tokens: tamper claims, test scope/aud enforcement, replay revoked tokens.
6. Multi-tenant: cross-reference IDs and tenant headers across orgs.
7. **Confirm the object/detail handler re-checks ownership** — a filtered list endpoint never proves the item endpoint is safe.

## Defenses

- Authorize by **session-derived identity**, never client-supplied scope/tenant/role.
- Enforce **object-level** checks in a central, default-deny layer; re-check per property and per resolver.
- Use random, unguessable IDs **as defense-in-depth only** — never as the control.
- Disable GraphQL introspection in prod; apply per-field authorization and query cost/batch limits.
- Validate JWT `aud`/`scope`/`exp` per endpoint; prefer short-lived tokens + server-side session checks for sensitive actions.

## Severity (bug bounty)

| Finding | Typical rating |
|---------|----------------|
| BOLA/BFLA exposing other users' PII or funds | P1–P2 |
| Cross-tenant data access | P1 |
| Mass assignment → privilege escalation | P1–P2 |
| Excessive data exposure (low sensitivity) | P3–P4 |

Always prove **concrete impact** — which record of which other user/tenant you read or changed — not merely that the parameter was accepted.

---

*Companion to [Broken Access Control: Techniques & PortSwigger Labs](/post/burp-academy-broken-access-control/). For hands-on practice see PortSwigger's [API testing](https://portswigger.net/web-security/api-testing) labs. For authorized testing only.*
