---
title: "TryHackMe WAF Introduction: from packet filters to OWASP CRS rules"
date: 2026-11-05T08:20:00+05:30
lastmod: 2026-11-05T08:20:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-wafintroduction/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Bypassing WAF
  - WAF
  - ModSecurity
  - OWASP CRS
  - firewall
  - Web Application Red Teaming

draft: false
description: "TryHackMe WAF Introduction walkthrough: firewall evolution from stateless to Layer 7, WAF fingerprinting, OWASP CRS rule analysis, and WAF limitations."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|WAF: Introduction |![WAF Introduction room icon](https://cdn-images.tryhackme.com/room-icons/5f04259cf9bf5b57aed2c476-1763367396646)|

This easy room is the first in the Bypassing WAF module of the Web Application Red Teaming path. It covers WAF theory end to end: the evolution of firewalls from stateless packet filters to application-layer inspection, techniques for fingerprinting WAFs in the wild, a deep dive into a real OWASP CRS rule, and the practical limitations every pentester should keep in mind. The room precedes [WAF: Exploitation Techniques](/post/thm-room-wafexploitationtechniques/) in the module.

## Task 1: Introduction

A brief overview of the room's learning objectives: firewall evolution, signature and behavioural detection, WAF fingerprinting with passive headers and automated tools, OWASP CRS rule analysis, and WAF limitations.

**What does WAF stand for? Web Application Firewall**

## Task 2: VM setup

The room deploys a lab VM running OWASP WafControl, a dashboard for ModSecurity and the OWASP Core Rule Set. Credentials for the dashboard: `admin` / `admin1234`, accessible at `http://MACHINE_IP:7000`. No AttackBox needed if your machine routes to the THM VPN.

Both questions are confirmation clicks (no answer needed).

## Task 3: Firewalls refresher

A historical walkthrough of firewall types, from stateless packet filters through stateful inspection to Layer 7 firewalls. The key points:

- **Stateless firewalls** filter individual packets by IP, port, and protocol with no connection tracking. Attackers bypassed them by forging packets with the **ACK** flag set, which the firewall treated as part of an existing (legitimate) session.
- **Stateful firewalls** track active connections in a state table, so a forged ACK without a matching SYN is dropped.
- **Layer 7 firewalls** (ALG, DPI, NGFW) inspect application-layer payloads, not just headers. DPI firewalls can spot `UNION SELECT` inside a query string, and NGFWs add IPS, TLS decryption, and user identity.

**Which flag can attackers misuse to bypass a stateless firewall? ACK**

**What type of firewall tracks active connections? Stateful**

{{< ad >}}

## Task 4: Web Application Firewall

WAFs operate at **Layer 7** and sit inline (cloud reverse proxy, network appliance, or host-based module like ModSecurity). Their defining feature is HTTP-aware inspection: they parse query strings, POST bodies, headers, and cookies to detect payloads like `' OR 1=1` or `<img src=x onerror=alert(1)>`.

When a vulnerability is discovered but a code fix is not yet deployed, the WAF can block the specific attack pattern. This is called **Virtual Patching**, a temporary mitigation that buys time without touching source code.

The room demonstrates fingerprinting techniques in four layers of effort:

1. **Passive header inspection** with `curl -I`, looking for giveaways like `server: cloudflare`, `X-Sucuri-ID`, or `X-CDN: Imperva`.
2. **Behavioural analysis**: sending harmless-looking attack strings (`' OR 1=1--`, `<script>alert(1)</script>`, `../../../../etc/passwd`) and watching the response code change from 200 to 403.
3. **Automated fingerprinting** with `wafw00f`, which detects over 500 WAFs through a three-phase probe (baseline, escalation, analysis).
4. **Subnet scanning** with Nmap's `http-waf-fingerprint` NSE script for bulk checks.

Testing an SQLi payload against the lab machine returns **403 Forbidden**, confirming ModSecurity is active.

**Which layer does a WAF primarily inspect? Layer 7**

**What do you call mitigating vulnerabilities without source code changes? Virtual Patching**

**What HTTP status code do you get if you attempt an SQLi against the lab? 403 Forbidden**

## Task 5: Signature vs behavioural detection

Two detection philosophies and their tradeoffs:

**Signature-based** detection compares each request against a library of known attack patterns (regex, string matches). It is fast, easy to write, and low on false positives when tuned. Its blind spots: encoding tricks (`%27%20OR%201%3D1--`), case variation (`unIOn sElEcT`), comment insertion, and alternative syntax. Critically, it cannot detect **zero-day** attacks because there is no signature for something never seen before.

**Behavioural (anomaly-based)** detection learns what normal traffic looks like and flags deviations. It catches zero-days and is harder to bypass with simple encoding, but produces more false positives, requires a training period, and costs more CPU.

Most commercial WAFs use a hybrid of both.

**Which detection method uses known attack patterns? Signature-based**

**What kind of attacks can behavioural detection catch that signature-based cannot? zero-day**

## Task 6: Introduction to rules

A deep dive into CRS rule 942101 (SQLi detection via libinjection) from OWASP CRS v3.3.7. The rule structure:

1. **Trigger**: `SecRule REQUEST_BASENAME "@detectSQLi"` calls **libinjection**, a C library purpose-built for SQL injection detection. Unlike regex, libinjection tokenizes the input and recognizes SQLi structures syntactically.

2. **Input normalisation**: before the check runs, a transformation pipeline strips evasion layers:
   - `t:utf8toUnicode` converts UTF-8 sequences
   - `t:urlDecodeUni` handles double URL encoding (e.g. `%2527` decodes to `%27` then to `'`)
   - `t:removeNulls` strips `%00` null bytes

3. **Scoring**: a match increments `tx.sql_injection_score` and `tx.anomaly_score_pl3`, feeding CRS's **anomaly score** threshold. Individual rules do not block on their own in anomaly mode; they contribute points, and a separate evaluation rule fires when the cumulative score exceeds the configured threshold.

The dashboard at `http://MACHINE_IP:7000` shows logged attacks. Under Attack Control, the Critical Attacks page lists rule 932160 (Remote Command Execution / Unix Shell Code). The request that triggered it with a path traversal payload: **/?parameter=../../../etc/passwd**

**Which library does OWASP CRS use to detect SQLi? libinjection**

**What transformation handles double URL encoding? urlDecodeUni**

**What score is increased when a critical rule triggers? anomaly score**

**Rule 932160 request with path traversal: /?parameter=../../../etc/passwd**

## Task 7: Limitations of WAFs

WAFs are not a replacement for secure code. Their blind spots:

- **Encryption**: unless TLS is terminated at the WAF, encrypted payloads pass through uninspected. TLS termination adds certificate management overhead.
- **Business logic flaws**: IDOR (`/api/user/124` instead of `/123`), authorization bypass (`/admin` accessed by a non-admin), and race conditions involve no malicious syntax for the WAF to detect.
- **Client-side attacks**: WAFs inspect server-bound traffic and cannot block attacks happening entirely in the browser.
- **New attack surface**: the WAF itself (especially its management interface) becomes a target.

**What prevents WAFs from inspecting traffic if not terminated at the WAF? Encryption**

## Task 8: Conclusion

A WAF is best used as part of a **defence in depth** strategy, not as a standalone fix. It filters syntax, not intent, and it cannot compensate for broken access controls, insecure code, or missing authentication.

**What principle should guide WAF use in a defence strategy? defence in depth**

## Takeaways

1. **WAF fingerprinting is the first step, not the exploit.** Knowing which WAF is in place (passive headers, behavioural probing, wafw00f, Nmap NSE) tells you which rule set to study and which evasion techniques to prioritize. Skipping this step means guessing at bypass strategies, and guessing wastes time and triggers rate limits.

2. **Understanding rule internals reveals the bypass surface.** CRS rule 942101 shows that the real detection engine is libinjection (not regex), and the transformation pipeline (urlDecodeUni, removeNulls) defines what encoding tricks will and will not work. Reading the rule is faster than fuzzing blindly.

Room solved 100%: 8 tasks, 16 answers.
