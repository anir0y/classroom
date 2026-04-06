---
title: "20 PortSwigger Labs in One Session: SSTI to Access Control"
date: 2026-04-06T12:00:00+05:30
lastmod: 2026-04-06T12:00:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: img/portswigger-labs.png
  alt: "PortSwigger Web Security Academy Labs"
categories:
  - Security
tags:
  - portswigger
  - ssti
  - sqli
  - path-traversal
  - command-injection
  - access-control
  - xxe
  - ssrf
  - bug-bounty
draft: false
description: "Speed-running 20 PortSwigger labs across 8 vulnerability classes — SSTI, SQLi, NoSQL injection, path traversal, OS command injection, XXE, SSRF, access control, and business logic. Payloads, bypass techniques, and bounty takeaways."
---

## Overview

I speed-ran 20 PortSwigger Web Security Academy labs in a single session, covering 8 vulnerability classes. This post documents every technique, payload, and the bug bounty lesson behind each one.

**Why this matters:** These aren't academic exercises. Every technique maps directly to real-world attack surfaces. SSTI alone saw a 540% increase in validated reports in 2026, and the error-based blind SSTI technique was voted #1 on PortSwigger's Top 10 Web Hacking Techniques of 2025.

---

## 1. Server-Side Template Injection (5 labs)

SSTI is the #1 technique of 2025. If user input flows into a server-side template engine, you can achieve RCE.

### Detection

Fuzz with a polyglot that triggers errors across engines:

```text
$\{\{<\%[%'"}}%\
```

(The actual polyglot uses real template delimiters — see PortSwigger's SSTI cheat sheet)

Then test math expressions in both double-curly and dollar-brace syntax.

### Tornado (Python) — Code Context Escape

When your input is inside an existing expression context, break out first with closing braces, then inject an import block for the os module, then call the system method.

**Bug Bounty Takeaway:** Display name / preferred name features that render server-side are prime injection points. Always test the value that appears next to your comment or profile.

### Freemarker (Java) — RCE via Execute Class

Use the assign directive to create an instance of the Execute utility class via the ?new() built-in, then invoke it with your command.

For sandboxed Freemarker, use Java reflection to chain: getClass > getProtectionDomain > getCodeSource > getLocation > toURI > resolve(path) > toURL > openStream > readAllBytes. Output is decimal ASCII bytes.

**Bug Bounty Takeaway:** Any CMS with user-editable templates (email builders, notification templates, page builders) could use Freemarker.

### Handlebars (Node.js) — Prototype Chain RCE

Handlebars is "logic-less" but the #with helper enables prototype traversal. Use nested #with blocks to access string.sub.constructor (the Function constructor), then push a payload that requires the child_process module for command execution.

URL-encode the entire payload and inject via GET parameter.

**Bug Bounty Takeaway:** Node.js apps using Handlebars for error pages or user-facing messages.

### Django (Python) — Secret Key Disclosure

Use the settings object in template expressions to access SECRET_KEY. Use the debug tag first to enumerate all available objects in the template context.

**Bug Bounty Takeaway:** Django SECRET_KEY leak = Critical. Enables session forgery, CSRF bypass, data decryption.

---

## 2. SQL Injection — XML Encoding WAF Bypass

When the injection point is inside an XML body and a WAF blocks SQL keywords, convert each character to XML hex entities (e.g., U becomes the hex entity for 0x55). The XML parser decodes entities before SQL execution, bypassing keyword-based WAF rules.

Concatenate results with the || operator to combine username and password from the users table.

**Bug Bounty Takeaway:** XML-based APIs (SOAP, stock checkers, payment processors) — if WAF blocks your payload, try XML hex entities, Unicode normalization, or HTML entities.

---

## 3. NoSQL Operator Injection — Full ATO Chain

### Boolean Oracle

Send JSON login with the $ne (not equal) operator on the password field. Different error messages reveal true/false conditions ("Account locked" vs "Invalid credentials").

### Field Enumeration via $where

Use the $where clause with Object.keys(this)[index] and regex matching to extract field names character by character.

### Full Chain

1. Trigger password reset for target user
2. Enumerate fields to find reset token field name
3. Extract token value character by character using the same $where technique
4. Use token on the forgot-password endpoint
5. Set new password, login as target

**Bug Bounty Takeaway:** Any MongoDB-backed JSON API. Test $ne, $gt, $regex operators on every input field.

---

## 4. Path Traversal — 5 Bypass Techniques

| Bypass | Payload | When to Use |
|---|---|---|
| Absolute path | /etc/passwd | Traversal sequences blocked |
| Non-recursive strip | ....//....//etc/passwd | Single-pass ../ removal |
| Double URL encode | ..%252f..%252f..%252fetc/passwd | Server decodes URL twice |
| Start-of-path validation | /var/www/images/../../../etc/passwd | Path must begin with expected dir |
| Null byte | ../../../etc/passwd%00.png | Extension validation |

**Bug Bounty Takeaway:** Image loading endpoints, file download features, PDF generators. Always test all 5 bypass techniques.

---

## 5. OS Command Injection — Blind Techniques

### Time-Based Detection

Inject a ping command with 10 count in the email field of feedback forms using pipe operators. A 10-second response delay confirms injection.

### Output Redirection

Redirect command output to a writable web directory (like /var/www/images/), then read the file via the image loading endpoint.

**Bug Bounty Takeaway:** Feedback forms, contact forms, any feature that processes user input server-side. The email field is the most common injection point.

---

## 6. XXE — XInclude Attack

When you can't control the full XML document (your input is embedded inside server-generated XML), use XInclude with the parse="text" attribute to read non-XML files like /etc/passwd. Inject as the value of a regular parameter like productId.

**Bug Bounty Takeaway:** Stock check features, any endpoint that accepts data embedded into XML server-side.

---

## 7. SSRF — Open Redirect Chain

When SSRF filters block external URLs, find an open redirect within the same application and use it as the stockApi value. The stock checker follows the redirect to the internal admin panel.

**Bug Bounty Takeaway:** Any feature that fetches URLs + any open redirect on the same domain = SSRF chain.

---

## 8. Access Control Bypasses

### Skip Multi-Step Confirmation

Admin role upgrade has 2 steps but only step 1 checks authorization. Send the confirmation step directly with action=upgrade, confirmed=true, and your username.

### Referer-Based Access Control

Server only checks if Referer header contains /admin. Set the referrer option in fetch to spoof it.

### Negative Quantity (Business Logic)

Add an expensive item with quantity 1, then a cheap item with a large negative quantity. The total drops below your store credit, allowing you to check out.

**Bug Bounty Takeaway:** Always test multi-step processes by replaying individual steps. Check if authorization is enforced on every step, not just the first.

---

## Quick Reference

| Vulnerability | Where to Test | Severity |
|---|---|---|
| SSTI | Template editors, display names, error messages | Critical |
| SQLi XML bypass | XML APIs, SOAP, stock checkers | Critical |
| NoSQL injection | JSON login/search endpoints | Critical |
| Path traversal | Image loaders, file downloads | High |
| OS command injection | Feedback/contact forms | Critical |
| XXE XInclude | Params embedded in XML | High |
| SSRF + open redirect | URL fetchers + redirect endpoints | High |
| Access control | Multi-step admin functions | High |

---

*Labs: [PortSwigger Web Security Academy](https://portswigger.net/web-security)*
