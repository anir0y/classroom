---
title: "30 More PortSwigger Labs — JWT, XSS Evasion, CSRF Bypass Masterclass"
date: 2026-04-02T12:00:00+05:30
lastmod: 2026-04-02T12:00:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
featureimage: img/portswigger.png
simg: img/portswigger.png
categories:
  - PortSwigger
tags:
  - portswigger
  - jwt
  - xss
  - csrf
  - samesite
  - nosql
  - graphql
  - access-control
  - bug-bounty
draft: false
description: "Session 2: 30 PortSwigger labs covering 5 JWT attacks, 16 XSS evasion techniques, 6 CSRF bypasses, NoSQL injection, GraphQL, and more."
---

## Overview

Second marathon session — 30 more labs solved across JWT exploitation, advanced XSS evasion, CSRF SameSite bypasses, and more. Total across both sessions: ~60 labs.

## JWT Attacks (5 Labs)

| Attack | Technique | Severity |
|---|---|---|
| Unverified signature | Change sub claim, keep original signature | P1 |
| Algorithm none | Set alg to none, empty signature with trailing dot | P1 |
| Weak signing key | Brute force with hashcat, key was secret1 | P1 |
| JWK header injection | Embed RSA public key in jwk header, sign with own key | P1 |
| kid path traversal | Set kid to /dev/null, sign with null byte | P1 |

**Bug Bounty:** Always decode JWTs. Check alg, kid, jwk, jku headers for injection.

## XSS Evasion (16 Labs)

| Context | Payload Pattern |
|---|---|
| HTML attribute | " autofocus onfocus=alert(1) |
| Anchor href | javascript:alert(1) in website field |
| JS string | '-alert(1)-' breaks string |
| Template literal | dollar-brace alert interpolation |
| onclick handler | HTML entity quotes for single-quote injection |
| Backslash escape | backslash-quote-alert bypasses escape |
| Script tag close | Close existing script, open new one |
| AngularJS | constructor chain on $on object |
| SVG only | animatetransform onbegin event |
| Canonical link | accesskey + onclick via URL params |
| document.write in select | Close select tag, inject img onerror |
| JSON response | Unescaped backslash breaks JSON string in dynamic code |
| Stored DOM replace | Extra angle brackets bypass single-replace |
| Most tags blocked | body onresize triggered via iframe resize |
| All standard tags blocked | Custom tag with onfocus + tabindex + hash |
| XSS to CSRF | Stored XSS extracts CSRF token via XHR |

## CSRF Bypasses (6 Labs)

| Bypass | Technique |
|---|---|
| No defenses | Auto-submit form |
| Token absent | Remove csrf parameter — only validated if present |
| Method override | POST to GET — token only checked on POST |
| SameSite Lax | _method=POST in GET query string |
| SameSite Strict | Client-side redirect gadget via path traversal |
| Token not tied to session | Use attacker valid token for victim request |

## Other Techniques

- **NoSQL detection:** Boolean injection to bypass filters
- **NoSQL auth bypass:** Regex operator + not-equal password operator
- **File upload:** Change Content-Type to image/jpeg, keep .php filename
- **GraphQL:** Query hidden post ID with postPassword field
- **Access control:** GET instead of POST for admin endpoint
- **Coupon stacking:** Alternate two codes to bypass duplicate check
- **SQLi:** WHERE clause injection and login bypass

## Key Takeaways

1. JWT is a goldmine — 5 attack vectors, all P1
2. XSS evasion requires context awareness — 16 different payloads
3. CSRF bypasses are systematic — remove, change method, exploit SameSite
4. Never trust client-side controls

---

*~60 labs solved across two sessions. Techniques for authorized testing only.*
