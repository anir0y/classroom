---
title: "30 PortSwigger Labs Solved — A Bug Bounty Training Marathon"
date: 2026-04-02T04:00:00+05:30
lastmod: 2026-04-02T04:00:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
featureimage: img/portswigger.png
simg: img/portswigger.png
categories:
  - PortSwigger
tags:
  - portswigger
  - web-security-academy
  - bug-bounty
  - sqli
  - xss
  - ssrf
  - ssti
  - xxe
  - nosql
  - idor
  - csrf
  - cors
  - deserialization
  - websockets
  - access-control
  - clickjacking
  - file-upload
  - llm-attacks
draft: false
description: "30 PortSwigger Web Security Academy labs solved in a single session — covering SSRF, SQLi, SSTI, XXE, IDOR, CSRF, CORS, NoSQL injection, deserialization, WebSocket XSS, file upload, LLM attacks, and more. Key payloads and bug bounty tips for each."
---

## Overview

30 labs solved across 16 vulnerability categories in one marathon session. Each technique below is directly applicable to real-world bug bounty hunting.

## Quick Reference — All 30 Labs

| # | Category | Lab | Key Technique |
|---|---|---|---|
| 1 | SSRF | Basic SSRF | `stockApi=http://localhost/admin` |
| 2 | SSRF | Blacklist bypass | `127.1` + double-encode `%2561` |
| 3 | SQLi | Blind time delay | `'||pg_sleep(10)--` in cookie |
| 4 | SSTI | Basic ERB | `<%= system("cmd") %>` |
| 5 | Access Control | X-Original-URL | Header overrides blocked path |
| 6 | File Upload | Path traversal | `filename="..%2fshell.php"` |
| 7 | NoSQL | Boolean extraction | `this.password[N]=='X'` per char |
| 8 | CSRF | Method bypass | POST to GET skips token check |
| 9 | Cache Deception | Path delimiters | `/my-account;wcd.js` cached as static |
| 10-12 | LLM | 3 labs | API enum, OS cmd injection, XSS via output |
| 13 | Info Disclosure | .git history | Admin password in deleted commit |
| 14 | Authentication | Username enum | Trailing space vs period in error |
| 15 | XXE | File retrieval | `<!ENTITY xxe SYSTEM "file:///etc/passwd">` |
| 16 | Access Control | IDOR transcript | `/download-transcript/1.txt` |
| 17 | Info Disclosure | Error messages | Apache Struts version in stack trace |
| 18 | Info Disclosure | Debug page | SECRET_KEY in phpinfo environment |
| 19 | Info Disclosure | Backup files | DB password in `.java.bak` |
| 20 | Info Disclosure | Auth bypass | `X-Custom-IP-Authorization: 127.0.0.1` |
| 21 | Logic Flaw | Client-side trust | Change `price=133700` to `price=1` |
| 22 | Authentication | Password reset | Empty token + change username |
| 23 | XXE | SSRF to AWS | Traverse `169.254.169.254` for IAM creds |
| 24 | Deserialization | PHP object | `admin";b:0` to `admin";b:1` |
| 25 | Access Control | Mass assignment | Add `"roleid":2` to JSON body |
| 26 | Access Control | IDOR password | `?id=administrator` shows password |
| 27 | CORS | Origin reflection | XHR from exploit server steals API key |
| 28 | CORS | Null origin | Sandboxed iframe sends null Origin |
| 29 | WebSocket | XSS | Raw `<img onerror>` bypasses client encoding |
| 30 | Access Control | IDOR UUID | Find UUID from blog, access account |

## Key Learning Gaps Fixed

**1. Subtle Response Detection:** Never `.strip()` error messages when enumerating. A trailing space vs period is a valid signal.

**2. Web Cache Poisoning:** Duplicate Host headers require Burp's HTTP stack. Raw sockets get rejected with 400.

**3. PHP Deserialization:** Session cookies can contain serialized objects. Decode base64, flip boolean flags, re-encode.

## Bug Bounty Severity Cheat Sheet

| Technique | Severity | Where to Look |
|---|---|---|
| SSRF to cloud metadata | P1 | URL params, webhooks, imports |
| SSTI to RCE | P1 | Error pages, email templates, PDF generators |
| XXE to file read | P1-P2 | XML parsers, DOCX/SVG uploads |
| IDOR | P1-P3 | Sequential IDs, UUIDs in URLs/APIs |
| Deserialization | P1 | Session cookies, API payloads |
| NoSQL injection | P1-P2 | JSON APIs with MongoDB |
| File upload RCE | P1 | Any upload feature |
| Mass assignment | P2 | JSON API update endpoints |
| CORS misconfiguration | P2-P3 | Check ACAO header reflection |
| CSRF bypass | P2-P3 | State-changing actions |
| WebSocket XSS | P2 | Live chat, real-time features |
| Info disclosure | P3-P4 | .git, backup files, error pages, debug endpoints |

---

*30 labs, one session, zero sleep. Techniques for authorized testing only.*
