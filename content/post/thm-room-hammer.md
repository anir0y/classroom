---
title: "TryHackMe Hammer: OTP Rate-Limit Bypass to JWT kid RCE"
date: 2026-10-15T11:40:00+05:30
lastmod: 2026-10-15T11:40:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-hammer/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Web Application Pentesting
  - Authentication
  - JWT
  - Rate Limiting
  - Password Reset
  - Remote Code Execution
  - Web Exploitation

draft: false
description: "Walkthrough of TryHackMe Hammer: leak a reset email from a log, bypass the OTP rate limit via X-Forwarded-For, forge a JWT from its kid key file, and get RCE."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Hammer |![Hammer room icon](https://cdn-images.tryhackme.com/room-icons/62a7685ca6e7ce005d3f3afe-1723567516578)|

Hammer is a medium room in the Authentication module of the Web Application Pentesting path, and the whole room lives up to its one-line brief: bypass the authentication mechanisms and get RCE. It is the same JWT-forging muscle the [Domino](/post/thm-room-domino/) capstone drilled, and a close cousin of the broken-reset logic in [Broken Authentication](/post/thm-room-brokenauthentication/). Three bugs chain here: a leaked account in a world-readable log, a password-reset OTP whose rate limit is keyed on a spoofable header, and a JWT whose signing key is read from a file path you control through the token itself.

The box was reachable directly from my Mac over the TryHackMe VPN (`utun10`), so the entire solve is curl, Python and hashcat, no AttackBox needed. Both flags were verified correct by the TryHackMe answer checker.

## Recon: a login form and a chatty log directory

A full TCP scan shows only two ports: OpenSSH on 22 and an Apache app on the unusual port `1337`. The homepage is a PHP login (`PHPSESSID` cookie, a `reset_password.php` link), and the HTML carries a loud developer comment.

```text
  <!-- Dev Note: Directory naming convention must be hmr_DIRECTORY_NAME -->
```

That naming rule is the key to content discovery. Fuzzing the `hmr_` prefix turns up `hmr_css`, `hmr_js`, `hmr_images` and, more usefully, `hmr_logs`. The logs directory has directory listing enabled and serves a single `error.logs` file. Reading it leaks a valid account and more.

![Recon: the port 1337 app, the hmr_ dev note, and the valid email leaked in error.logs](/img/thm-hammer/01-recon.png)

The log is a set of fake Apache error lines, but two of them name `tester@hammer.thm` in authentication-failure records. Submitting a random address to `reset_password.php` returns "Invalid email address!", while `tester@hammer.thm` is accepted and advances the flow. That one readable file is the difference between a dead end and a foothold.

## Bypassing the reset OTP with a spoofed header

The reset flow is a two-step: submit the email, then enter a 4-digit recovery code within a 180-second countdown. Four digits is only ten thousand possibilities, but the response carries a `Rate-Limit-Pending` header that starts at 9, so you get roughly ten guesses before you are locked out. Brute forcing ten thousand codes with ten attempts is not going to happen on its own.

The flaw is how the limit is counted. Submitting wrong codes with no extra headers walks the counter down (9, 8, 7, ...), but sending a fresh `X-Forwarded-For` value on every request holds it at 9 forever. The limiter trusts the client-supplied forwarded address as the identity, so a new spoofed IP looks like a brand-new client each time.

![The rate limit decrements normally, but a rotating X-Forwarded-For keeps Rate-Limit-Pending pinned at 9](/img/thm-hammer/02-rate-bypass.png)

With the limit neutralised, the code space is tiny. I requested a fresh reset to restart the 180-second window and brute forced all `0000` to `9999` in parallel, each request carrying the reset session cookie and a unique `X-Forwarded-For`, flagging any response that did not contain "Invalid or expired recovery code!".

```bash
  # keep the reset session, rotate XFF, find the code that advances the flow
  seq -w 0000 9999 | xargs -P 40 -I{} bash -c '
    c="$1"
    body=$(curl -s --cookie "PHPSESSID=$SID" \
      -H "X-Forwarded-For: 77.$((RANDOM%250)).$((RANDOM%250)).$((10#$c%250))" \
      -X POST http://TARGET:1337/reset_password.php -d "recovery_code=$c&s=150")
    echo "$body" | grep -q "Invalid or expired" || echo "HIT $c"
  ' _ {}
```

The whole sweep finished in about 72 seconds, well inside the window. Once the correct code is accepted the session flips into a "set new password" state, so the exact digits stop mattering: the session itself is now authorised. Posting `new_password` and `confirm_password` returns "Password has been reset successfully!", and I logged in as `tester@hammer.thm` with the password I had just set.

{{< ad >}}

## Flag 1: the dashboard and the persistentSession trap

Logging in redirects to `dashboard.php` and sets three cookies: a `PHPSESSID`, a JWT `token`, and a short-lived `persistentSession` cookie with a 20-second lifetime. The dashboard greets the user and prints the first flag.

```text
  Welcome, Thor! - Flag: THM{AuthBypass3D}
  Your role: user
```

The first flag is **THM{AuthBypass3D}**. This step also cost me time worth flagging honestly: fetching `dashboard.php` with only the `PHPSESSID` and `token` cookies always redirected to `logout.php`. The server checks for the `persistentSession` cookie, and because it expires in 20 seconds it was missing from my hand-built requests. Following the login redirect in a single cookie-jar request kept it alive and rendered the dashboard. That same missing cookie later made several correct exploits look like failures, which is why it is worth naming early.

## Forging the admin JWT through its kid

The dashboard has a command box that POSTs to `execute_command.php` with the JWT as a `Bearer` token. As `role: user` the endpoint answers "Command not allowed", so the goal is a token with `role: admin`. Decoding the issued JWT shows why this is forgeable.

```json
  {"typ":"JWT","alg":"HS256","kid":"/var/www/html/hmr_logs/error.logs"}
```

The `kid` header is an absolute filesystem path, and the server reads that file and uses its bytes as the HS256 signing key. That is the entire vulnerability: I control `kid`, so I can point it at any file I can also read, sign the token with that file's exact contents, and the signature verifies. The `error.logs` file is perfect since it is served over HTTP, so I can fetch its exact bytes, and it sits at a path I already know.

I fetched `error.logs`, built a token with `role` escalated to `admin` and `kid` still pointing at that file, and signed it with the downloaded bytes.

```python
  import hmac, hashlib, base64, json, time
  b64 = lambda b: base64.urlsafe_b64encode(b).rstrip(b"=")
  key = open("error.logs.bytes", "rb").read()        # exact served bytes
  hdr = {"typ":"JWT","alg":"HS256","kid":"/var/www/html/hmr_logs/error.logs"}
  now = int(time.time())
  pl  = {"iss":"http://hammer.thm","aud":"http://hammer.thm","iat":now,"exp":now+3600,
         "data":{"user_id":1,"email":"tester@hammer.thm","role":"admin"}}
  seg = b64(json.dumps(hdr,separators=(',',':')).encode()) + b"." + \
        b64(json.dumps(pl,separators=(',',':')).encode())
  print((seg + b"." + b64(hmac.new(key, seg, hashlib.sha256).digest())).decode())
```

Sending that token to `execute_command.php` (with the `persistentSession` cookie present) returns command output as `www-data`.

![The JWT header exposes the kid key-file path, the forged payload sets role admin, and execute_command.php runs as www-data](/img/thm-hammer/03-jwt-rce.png)

Two detours are worth recording. Cracking the HS256 secret against rockyou with `hashcat -m 16500` exhausted the list with nothing, so the key is not a dictionary word, which is the nudge toward the `kid` file-read in the first place. And a `data://text/plain` wrapper in `kid` returned "Key file not found", so URL and data wrappers are disabled for the read: it has to be a real file on disk. Any readable file works as the key, including the CSS and image assets, so `error.logs` is just the convenient choice.

## Flag 2: RCE as www-data

With an admin token the command endpoint runs anything. Reading the target file is a one-liner.

![cat /home/ubuntu/flag.txt through the admin command endpoint, running as www-data on the target host](/img/thm-hammer/04-flag.png)

The second flag is **THM{RUNANYCOMMAND1337}**, read straight from `/home/ubuntu/flag.txt`. The role check was the only thing standing between a normal user and arbitrary command execution, and the forged token walked right past it.

## Takeaways

Two durable lessons from Hammer:

- **A rate limiter is only as trustworthy as the identity it counts on.** Keying attempts on `X-Forwarded-For`, `X-Real-IP` or any client-supplied address means an attacker resets the counter at will. Tie brute-force protection to something the client cannot forge: the authenticated session, the account being targeted, or the real socket address, and treat forwarded headers as untrusted unless a known proxy sets them.
- **Never let a token choose where its own verification key comes from.** A JWT `kid` that becomes a file path, a URL, or a database lookup hands the attacker key control, and from there every signature is valid. Pin the verification key server-side, map `kid` to an allow-list of known key identifiers, and reject any value that resolves to a path or wrapper.

The chain mirrors real-world web findings: an information leak in a forgotten log, a header-trusting rate limit, and a JWT verification flaw, each small on its own but fatal in sequence.

Room solved 100%: 1 task, 2 answers.
