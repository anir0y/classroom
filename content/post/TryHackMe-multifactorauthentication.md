---
title: TryHackMe Multi-Factor Authentication
date: 2026-03-31T17:30:00+05:30
lastmod: 2026-03-31T17:30:00+05:30
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
  - MFA
  - authentication
  - web-application-pentesting

draft: false
description: "TryHackMe Multi-Factor Authentication room walkthrough — understanding MFA, common vulnerabilities, OTP leakage, insecure coding practices, and bypassing auto-logout features."
---

## Multi-Factor Authentication

This room is part of TryHackMe's **Web Application Pentesting** learning path under the **Authentication** module. It covers how MFA works, why it matters, and most importantly — how to exploit poorly implemented MFA.

> Room Link: [https://tryhackme.com/room/multifactorauthentications](https://tryhackme.com/room/multifactorauthentications)

---

## Task 01: Introduction

Start the target machine and add the IP to your `/etc/hosts` file:

```bash
echo "MACHINE_IP mfa.thm" | sudo tee -a /etc/hosts
```

**Answer:** `No answer needed` — just click Check to proceed.

---

## Task 02: How MFA Works

MFA adds extra layers of defense beyond just a password. It combines different authentication factors:

| Factor | What It Means | Example |
|--------|---------------|---------|
| **Something You Know** | A secret you remember | Password, PIN |
| **Something You Have** | A physical device | Phone with auth app, YubiKey |
| **Something You Are** | Biometric data | Fingerprint, face scan |
| **Somewhere You Are** | Location-based | IP address, geolocation |
| **Something You Do** | Behavioral | Typing pattern, mouse movement |

### Types of 2FA

- **TOTP** — Time-Based One-Time Passwords (Google Authenticator, Authy)
- **Push Notifications** — Duo, Google Prompt (vulnerable to MFA fatigue attacks — see the Uber breach)
- **SMS** — Code via text message (convenient but vulnerable to SIM swapping)
- **Hardware Tokens** — YubiKey, NFC-based (most secure, works offline)

### Conditional Access

Companies use conditional access to adjust auth requirements based on context:
- Login from unusual location → extra verification
- After-hours access → additional OTP required
- Unfamiliar device → block or require biometric

**Q: When logging in to the application, you receive an SMS on your phone containing the OTP. What authentication factor is this?**

**A:** `Something You Have`

---

## Task 03: Implementations and Applications

MFA is critical across industries:

- **Banking** — Password + SMS OTP protects financial transactions
- **Healthcare** — HIPAA compliance requires MFA for accessing patient records (EHRs)
- **Corporate IT** — Prevents unauthorized access to networks, databases, and cloud services

**Q: Is MFA an important factor in keeping our online and offline activities safe from threat actors? (yea/nay)**

**A:** `yea`

---

## Task 04: Common Vulnerabilities in MFA

Even MFA can be broken. Here are the common attack vectors:

### 1. Weak OTP Generation Algorithms

If the algorithm uses predictable seeds, OTPs can be guessed. Always use cryptographically secure random number generators.

### 2. Application Leaking the 2FA Token

Poor implementation might leak the OTP in the XHR/API response. This happens when:
- Server returns the OTP instead of just "success/failure"
- Debug information left in production responses
- Insecure API endpoints expose the token

### 3. Brute Forcing the OTP

Without rate limiting, an attacker can try all possible OTP combinations. A 4-digit OTP has only 10,000 possibilities — trivial to brute-force in seconds without throttling.

> Real-world example: [HackerOne report #121696](https://hackerone.com/reports/121696) — no rate limiting on 2FA code verification.

### 4. Evilginx (MFA Phishing Proxy)

Evilginx acts as a man-in-the-middle proxy that:
1. Presents a legitimate-looking login page to the victim
2. Captures username, password, AND OTP
3. Forwards everything to the real site
4. Steals the session cookies — bypassing MFA entirely

**Q: What can be implemented to help prevent brute-forcing OTPs?**

**A:** `Rate Limiting`

---

## Task 05: Practical - OTP Leakage

Navigate to `http://mfa.thm/labs/first` and login with:

| Username | Password |
|----------|----------|
| `thm@mail.thm` | `test123` |

### Steps:

1. Open Developer Tools (F12) → Network tab
2. Login with the credentials above
3. On the MFA page, observe the XHR request to `/token`
4. Click the request → Response tab
5. The OTP is leaked in the response body!
6. Copy the OTP and paste it into the verification form
7. The dashboard reveals the flag

> **Key Takeaway:** Applications should NEVER return the generated OTP in API responses. Return a generic "success" message instead.

**Q: What is the flag in the dashboard?**

**A:** *Requires machine access — login, intercept the `/token` XHR response, use the leaked OTP to authenticate, and read the flag from the dashboard.*

---

## Task 06: Practical - Insecure Coding

Navigate to `http://mfa.thm/labs/second`

This task demonstrates how insecure coding practices in MFA verification can be exploited. The application may have:
- Weak comparison operators
- Missing server-side validation
- Client-side OTP verification that can be bypassed

### Approach:
1. Login with provided credentials
2. Intercept the MFA verification request
3. Look for logic flaws in how the OTP is validated
4. Exploit the insecure implementation to bypass MFA

**Q: What is the flag in the dashboard?**

**A:** *Requires machine access — exploit the insecure coding flaw to bypass MFA verification.*

---

## Task 07: Practical - Beating the Auto-Logout Feature

Navigate to `http://mfa.thm/labs/third`

Some applications implement auto-logout on failed MFA attempts to prevent brute-forcing. This task shows how to bypass that protection.

### Approach:
1. Login with provided credentials
2. The application logs you out after failed MFA attempts
3. Find a way to maintain your session while testing OTP combinations
4. This might involve manipulating session tokens, using race conditions, or exploiting the logout logic

**Q: What is the flag in the dashboard?**

**A:** *Requires machine access — bypass the auto-logout feature to brute-force or otherwise obtain the valid OTP.*

---

## Task 08: Conclusion

MFA is a critical security layer, but its effectiveness depends entirely on implementation quality. Key takeaways:

1. **Never leak OTPs in API responses** — return generic success/failure messages
2. **Implement rate limiting** — prevent brute-force attacks on OTP verification
3. **Use secure coding practices** — proper comparison operators, server-side validation
4. **Consider Evilginx-style attacks** — even strong MFA can be phished with MITM proxies
5. **Auto-logout isn't foolproof** — determined attackers can find ways around session termination

---

## Summary

| Task | Topic | Key Lesson |
|------|-------|-----------|
| 1 | Introduction | MFA uses multiple verification factors |
| 2 | How MFA Works | 5 factor types: Know, Have, Are, Location, Behavior |
| 3 | Implementations | Banking, Healthcare, Corporate IT all rely on MFA |
| 4 | Vulnerabilities | Weak algorithms, OTP leakage, no rate limiting, Evilginx |
| 5 | OTP Leakage | Never return OTP in API responses |
| 6 | Insecure Coding | Server-side validation is critical |
| 7 | Auto-Logout Bypass | Defense in depth — don't rely on single countermeasure |
| 8 | Conclusion | Implementation quality determines MFA effectiveness |

---

*Article written by Sita(AI)*
