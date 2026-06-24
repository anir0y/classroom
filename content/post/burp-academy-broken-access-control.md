---
title: "Burp Academy: Broken Access Control - Complete Guide"
date: 2026-06-24T11:00:00+05:30
lastmod: 2026-06-24T11:00:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: img/burp-academy.png
  alt: "PortSwigger Web Security Academy"
featureimage: img/burp-academy.png
simg: img/burp-academy.png
categories:
  - Web Security
  - Burp Academy
tags:
  - portswigger
  - burp-academy
  - access-control
  - idor
  - privilege-escalation
  - mass-assignment
  - web-security
draft: false
toc: true
---

Broken Access Control is **#1 on the OWASP Top 10 (A01:2021)** — and it's the single most common high-impact finding in real bug bounty and pentest work. This post consolidates the **PortSwigger Web Security Academy "Access control vulnerabilities"** labs into one technique-by-technique reference, with the exact exploitation for each.

<!--more-->

---

## The three axes of access control

Access control depends on authentication and session management. It breaks down into three categories:

- **Vertical** — a low-privileged user reaches functionality meant for higher-privileged users (user → admin).
- **Horizontal** — a user reaches *another user's* data of the same type (this is **IDOR**).
- **Context-dependent** — actions performed out of the intended order or application state.

The golden rule: access control must be enforced **server-side, on every request, per object**. Anything client-side — hidden links, disabled buttons, obfuscated or encrypted IDs, trusted headers — is bypassable.

---

## 1. Unprotected functionality

Privileged functionality that isn't linked in the UI but is still reachable by anyone who knows (or finds) the URL.

### Lab: Unprotected admin functionality
**Goal:** Delete user `carlos` via the admin panel.
- `GET /robots.txt` discloses `Disallow: /administrator-panel`.
- Browse to `/administrator-panel` → the panel loads with no auth check → delete `carlos`.

### Lab: Unprotected admin functionality with unpredictable URL
The admin URL is unguessable, but it's leaked **client-side**.
- View the page source / loaded JavaScript — the admin path is hard-coded (e.g. `var isAdmin = false; ... '/admin-xxxxxx'`).
- Browse to the disclosed URL → delete `carlos`.

**Lesson:** "security by obscurity" (unlinked URLs) is not access control.

---

## 2. Parameter-based access control

The user's privilege is carried in a **user-controllable** value — a hidden field, a cookie, or a JSON property.

### Lab: User role controlled by request parameter
- Logging in sets `Cookie: Admin=false`.
- Resend the `/admin` request with `Cookie: Admin=true` → admin panel unlocks.

### Lab: User role can be modified in user profile (mass assignment)
- The "update email" endpoint accepts JSON: `{"email":"x@y.com"}`.
- Fetching your account (`GET /api/user/wiener`) reveals an extra field: `"roleid":1`.
- Add it to the update body: `{"email":"x@y.com","roleid":2}` → you're promoted to admin.

**Lesson:** never trust role/privilege values that originate from the client. Watch for **mass assignment** — objects bound directly from request bodies.

---

## 3. Platform / URL-match bypass

The front-end enforces a rule on a path, but the back-end can be reached a different way.

### Lab: URL-based access control can be circumvented
- `GET /admin` → `401`. The app trusts the `X-Original-URL` header for routing.
- Send `GET /` + `X-Original-URL: /admin` → admin page loads.
- To act, the overridden path means real params go in the **query string**:
  `POST /?username=carlos` + `X-Original-URL: /admin/delete`.
- (`X-Rewrite-URL` works the same way on some stacks.)

### Lab: Method-based access control can be circumvented
- Admins promote users via `POST /admin-roles` with `username=carlos&action=upgrade`.
- A low-priv `POST` is blocked, but the rule only covers POST — switch to
  `GET /admin-roles?username=carlos&action=upgrade` to slip past it.

**Lesson:** access control must be consistent across **all** methods and routing layers.

---

## 4. Referer-based access control

### Lab: Referer-based access control
- `/admin` checks the role, but the sub-action `/admin/roles/<user>/<id>` only checks that the **`Referer`** header points at `/admin`.
- As a low-priv user, send the upgrade request with `Referer: https://target/admin` → privilege granted.

**Lesson:** the `Referer` header is attacker-controlled — never authorize on it.

---

## 5. IDOR (Insecure Direct Object References)

Horizontal access via a directly-referenced object identifier.

### Lab: User ID controlled by request parameter
- `GET /my-account?id=wiener` → change to `?id=carlos` → view their account (often leaking an **API key**).

### Lab: with unpredictable GUIDs
- IDs are GUIDs, not sequential — but the victim's GUID is **leaked elsewhere** (e.g. a blog post author link `/blogs?userId=<guid>`). Harvest it, then `/my-account?id=<carlos-guid>`.

### Lab: with password disclosure
- `GET /my-account?id=administrator` renders the admin page; the password sits in a **masked input's `value`** attribute in the HTML — read it from source and log in.

### Lab: Insecure direct object references (static files)
- Chat transcripts are saved as `/download-transcript/1.txt`, `2.txt`… — increment the number to read other users' transcripts.

**Lesson:** every object fetch must verify the requester *owns* (or is authorized for) that object — not just that the ID is valid. Encrypted or random-looking IDs change the *discovery* difficulty, never the *authorization*.

---

## 6. Multi-step and horizontal-to-vertical escalation

### Lab: Multi-step process with no access control on one step
- The role-upgrade flow is `load confirmation form → submit`. The final `POST /admin-roles` (`action=upgrade&confirmed=true`) **doesn't re-check** the role — replay it directly as a low-priv user.

### Horizontal → vertical
- Combine a parameter-IDOR with a writable role field to edit **your own** record's role, escalating from same-level access to admin.

**Lesson:** authorization must be re-validated at **every** step of a multi-step flow, not just the first.

---

## Testing methodology

1. **Map roles** and enumerate each role's functionality.
2. Access every privileged function as a **lower / unauthenticated** user.
3. **Horizontal:** with two accounts, request user B's objects as user A. (One account only? Tamper IDs to non-owned values and watch for data you shouldn't see.)
4. **Force-browse** admin/functional URLs (and check `robots.txt`, sitemaps, JS).
5. **Header tricks:** `X-Original-URL`, `X-Rewrite-URL`, `X-Forwarded-For/Host`, `Referer`.
6. **Method tampering:** GET↔POST, try `PUT`/`DELETE`; change `Content-Type`.
7. **Verify the object/detail endpoint re-checks ownership** — a server-filtered *listing* does **not** imply the *detail* fetch is safe. This is the single most overlooked spot.

## Defending against it

- Deny by default; centralize authorization checks (not scattered per-controller).
- Enforce server-side on every request, per object and per step.
- Never expose role/privilege fields to client binding (guard against mass assignment).
- Don't authorize on spoofable inputs (`Referer`, client cookies, hidden fields).
- Log access-control failures and alert on anomalies.

## Severity in bug bounty

| Impact | Typical rating |
|--------|----------------|
| Vertical → full admin takeover | P1–P2 |
| IDOR exposing other users' PII/funds | P2–P3 |
| Horizontal read of low-sensitivity data | P3–P4 |

Severity scales with **data sensitivity** and **what the escalated privilege can do** — always demonstrate concrete impact, not just "the parameter changed."

---

*Part of my PortSwigger Web Security Academy series. Practice these in the [Access control vulnerabilities](https://portswigger.net/web-security/access-control) labs.*
