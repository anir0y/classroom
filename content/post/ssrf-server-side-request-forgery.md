---
title: "SSRF: Server-Side Request Forgery - Practitioner Guide"
date: 2026-06-24T13:30:00+05:30
lastmod: 2026-06-24T13:30:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: img/burp-academy.png
  alt: "Server-Side Request Forgery"
featureimage: img/burp-academy.png
simg: img/burp-academy.png
categories:
  - Web Security
tags:
  - ssrf
  - cloud-security
  - filter-bypass
  - blind-ssrf
  - portswigger
  - burp-academy
  - web-security
draft: false
toc: true
---

Server-Side Request Forgery makes the **server** issue requests of your choosing — into its own internal network, cloud metadata, or back at itself. It's a perennial OWASP Top 10 entry and one of the highest-impact bug bounty classes because it pivots from the internet straight into the trust zone behind the firewall. (It's also the SSRF I referenced from the [OAuth](/post/oauth-oidc-attacks/) `request_uri`/discovery surface.)

<!--more-->

---

## What it is

Any feature where the server fetches a URL you influence: webhooks, URL previews, PDF/image fetchers, import-from-URL, `request_uri`, file/SVG/XML parsers, "check this link" tools. If you control the destination, you can make the server talk to things **you** can't reach directly.

```
POST /api/import   { "url": "https://attacker/x" }     # intended
POST /api/import   { "url": "http://169.254.169.254/latest/meta-data/" }   # SSRF → cloud metadata
```

---

## 1. Basic SSRF (in-band)

The response comes back to you.

- **Internal services:** `http://localhost/admin`, `http://127.0.0.1:8080`, `http://192.168.0.5`.
- **Cloud metadata (huge impact):**
  - AWS IMDSv1: `http://169.254.169.254/latest/meta-data/iam/security-credentials/<role>` → temp creds.
  - GCP: `http://metadata.google.internal/computeMetadata/v1/` (needs `Metadata-Flavor: Google`).
  - Azure: `http://169.254.169.254/metadata/instance?api-version=2021-02-01` (needs `Metadata: true`).
- **PortSwigger lab pattern:** `stockApi=http://localhost/admin` then `.../admin/delete?username=carlos`.

## 2. Blind SSRF

No response returned — confirm out-of-band and pivot.

- **Detection:** point at a **Burp Collaborator** / your DNS-logging host; a DNS or HTTP hit proves the server fetched it.
- **Internal mapping:** time/response-code differences reveal open vs closed internal ports/hosts.
- **Escalation:** blind SSRF into a known-vulnerable internal service (e.g. an unauthenticated admin or a deserialization endpoint) can still yield RCE.

## 3. Filter / defense bypass

When the app blocks `localhost`/`169.254.169.254` or allow-lists a domain:

| Bypass | Example |
|--------|---------|
| Alternate IP encodings | `http://2130706433/` (decimal), `http://0x7f.0.0.1/`, `http://0177.0.0.1/`, `http://127.1/` |
| IPv6 / dotless | `http://[::1]/`, `http://[::ffff:127.0.0.1]/` |
| DNS rebinding | a host you control that resolves to a public IP first, then `127.0.0.1` (TOCTOU) |
| Redirect | allow-listed URL that **302-redirects** to `http://169.254.169.254/...` |
| `@` / userinfo | `https://allowed.com@169.254.169.254/` |
| Embedded/fragment | `https://169.254.169.254#.allowed.com`, `https://allowed.com.evil.com` |
| Enclosed alphanumerics / case | unicode-normalization tricks on the host |
| Non-HTTP schemes | `file:///etc/passwd`, `gopher://` (raw TCP → internal Redis/SMTP), `dict://` |

## 4. SSRF in other sinks

- **XXE → SSRF:** external entity fetches an internal/metadata URL.
- **PDF/HTML renderers & SVG:** `<image href="http://169.254...">`, headless-Chrome fetchers.
- **Webhooks / OIDC `request_uri` / JWKS `jku`** — see the [OAuth](/post/oauth-oidc-attacks/) post.

---

## Methodology

1. Find every "server fetches a URL" feature (and indirect ones: XXE, SVG, PDF, webhooks, document import).
2. Point it at **Collaborator** first to confirm server-side fetch (works even when blind).
3. Probe `localhost` + cloud metadata; enumerate internal ports/hosts by response/timing.
4. If filtered, walk the bypass table (encodings, redirect, DNS rebinding, schemes).
5. Escalate: read metadata creds, reach internal admin panels, chain to RCE via an internal sink.

**Tools:** Burp + Collaborator, `ffuf`/Intruder for internal host:port sweeps, SSRFmap, interactsh.

## Defenses

- Allow-list destinations by **resolved IP** (re-resolve after redirects; block RFC1918/link-local/169.254/::1).
- Disable unneeded URL schemes (`file`, `gopher`, `dict`); follow no redirects, or re-validate each hop.
- Require **IMDSv2** (token-based) on AWS; isolate metadata via egress policy.
- Don't return raw fetch responses to the client; network-segment the fetcher.

## Severity (bug bounty)

| Finding | Typical rating |
|---------|----------------|
| SSRF → cloud metadata creds / internal admin / RCE | P1 |
| SSRF reaching internal services (no creds yet) | P2 |
| Blind SSRF (confirmed, limited reach) | P3–P4 |

Impact is everything — a Collaborator ping is P4; reading IAM credentials from `169.254.169.254` is P1. Always demonstrate what you reached.

---

*Part of my web-security series — see also [OAuth/OIDC Attacks](/post/oauth-oidc-attacks/) and [Broken Access Control]([HIGH_ENTROPY_SECRET_129]). Practice in PortSwigger's [SSRF](https://portswigger.net/web-security/ssrf) labs. Authorized testing only.*
