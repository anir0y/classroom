---
title: "TryHackMe BreachBlocker Unlocker: timing attacks and 2FA bypass"
date: 2026-11-10T21:59:00+05:30
lastmod: 2026-11-10T21:59:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-breachblocker/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - AoC 2025
  - side quest
  - timing attack
  - source code exposure
  - 2FA bypass
  - Flask
  - session replay

draft: false
description: "TryHackMe BreachBlocker Unlocker walkthrough: source code exposure, timing side channels, password reuse, 2FA brute force via session replay."
---

BreachBlocker Unlocker is AoC 2025 Side Quest 4, a Hard room that chains three web application vulnerabilities into a complete bank account compromise: exposed server source code, a timing side channel on a custom hash function, password reuse across services, and a 2FA bypass through session cookie replay. This post walks through the full solve. If you are working through the AoC 2025 side quests, check out the [Advent of Cyber 2025 walkthrough](/post/thm-room-adventofcyber2025/) for the main path.

## Task 1: Hopper the Detective

The scenario puts you in control of Hopper's investigation into Sir BreachBlocker's phone. A phone simulator runs on the lab VM (HTTPS on port 8443), presenting a fake smartphone UI with apps for Hopflix, Hopsec Bank, Messages, Mail, Photos, Settings, and an Authenticator. The goal is to extract three flags: one from the application source code, one from the Hopflix streaming service, and one from the Hopsec Bank account.

### Reconnaissance: reading the source

The phone simulator is a Flask application. Visiting the root URL serves `index.html`, but there is also a catch-all static file route:

```python
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)
```

This serves any file in the working directory, including the application source itself. Requesting `/main.py` returns the entire server source code, which contains a comment with the first flag:

```python
  #CODE_FLAG = THM{eggsposed_source_code}
```

**CODE_FLAG: THM{eggsposed_source_code}**

### Cracking the Hopflix password: database download and hash analysis

The source code reveals a SQLite database path: `sqlite3.connect("/hopflix-874297.db")`. Because the database file is in the Flask working directory, requesting `/hopflix-874297.db` downloads it. Inside:

```
email: sbreachblocker@easterbunnies.thm
full_name: Sir BreachBlocker
password_hash: <480 characters>
```

The password check uses a custom `hopper_hash` function that iterates SHA1:

```python
def hopper_hash(s):
    res = s
    for i in range(5000):
        res = hashlib.sha1(res.encode()).hexdigest()
    return res
```

The check compares each character of the password individually:

```python
for ch in pwd:
    ch_hash = hopper_hash(ch)
    if ch_hash != phash[:40]:
        return jsonify({'valid':False, 'error':'Incorrect Password'})
    phash = phash[40:]
```

Each character produces a 40-character SHA1 hex string, so 480 characters means a 12-character password. The server code uses 5000 SHA1 iterations, but the stored hashes were generated with 1000 iterations (a common gotcha in CTFs where the seeded data predates a code change). Brute forcing each position against 95 printable ASCII characters with 1000 iterations per candidate takes seconds per position.

The cracked password: **malharerocks** (m-a-l-h-a-r-e-r-o-c-k-s).

Logging in with `sbreachblocker@easterbunnies.thm` / `malharerocks` and calling `/api/get-last-viewed` returns the second flag.

**HOPFLIX_FLAG: THM{fluffier_things_season_4}**

### Timing attack: why the naive approach fails

The room is designed to teach timing side channels. The per-character hash comparison creates a measurable delay: each correct character adds the time for 5000 SHA1 iterations (approximately 8ms on the lab VM). In principle, racing two candidates against each other reveals which takes longer.

In practice, there is a critical trap. The server checks password length first:

```python
if len(pwd)*40 != len(phash):
    return jsonify({'valid':False, 'error':'Incorrect Password'})
```

Any password that is not exactly 12 characters long gets rejected immediately with no timing signal. If you start a timing attack with a wrong-length padding (for example, 9-character candidates), every candidate returns in the same time regardless of character correctness. The "signals" are pure noise from asyncio scheduling. Downloading the database and cracking offline avoids this trap entirely.

{{< ad >}}

### Bank login: password reuse

The source code shows the bank login uses a different database (`/hopsecbank-12312497.db`) at the filesystem root, inaccessible through the static file route. The bank account ID is `sbreachblocker@easterbunnies.thm` and the PIN is SHA256-hashed.

Testing the Hopflix password `malharerocks` against the bank login works. Password reuse across Hopflix and Hopsec Bank.

The successful bank login returns a list of trusted 2FA email addresses: `carrotbane@easterbunnies.thm` and `malhare@easterbunnies.thm`.

### 2FA bypass: session cookie replay brute force

After bank login, the server generates a random 6-digit OTP, encrypts it with AES-GCM, and stores it in the Flask session cookie (a client-side signed cookie). The OTP is emailed to a trusted address via SMTP, which we cannot read.

The verify endpoint has an anti-brute-force measure: on a wrong guess, it deletes `bank_2fa_code` from the session and returns an updated cookie:

```python
if code == decrypt(session.get('bank_2fa_code')):
    session['bank_2fa_verified'] = True
else:
    if 'bank_2fa_code' in session:
        del session['bank_2fa_code']
```

But Flask sessions are client-side. The server cannot invalidate cookies already in the attacker's possession. By capturing the session cookie after `send-2fa` and replaying it (ignoring the updated cookies from failed attempts), every guess runs against the same encrypted OTP. The "deletion" only affects the response cookie, not the attacker's stored copy.

With 150 concurrent connections, the brute force runs at approximately 280 requests per second. The correct code was found after 173,197 attempts (~10 minutes):

```
2FA CODE FOUND: 177463
After 173197 attempts in 614.5s
```

Using the found code against the original session cookie, then calling `/api/release-funds` with the resulting verified session:

**BANK_FLAG: THM{neggative_balance}**

## Takeaways

1. **Client-side session cookies break server-side invalidation.** Flask's default cookie-based sessions cannot be revoked server-side. Any rate limiting or code deletion in the session is cosmetic when the attacker controls which cookie to replay. Use server-side session storage (Redis, database) for security-critical flows, or limit OTP attempts with a server-side counter keyed to the session ID.

2. **Serving static files from the application directory is an information disclosure vector.** The catch-all `send_from_directory('.', path)` exposed both the source code and the user database. Separate static assets from application code, and never serve from the working directory.

Room solved 100%: 1 task, 3 answers.
