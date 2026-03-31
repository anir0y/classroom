---
title: TryHackMe Server-side Template Injection (SSTI)
date: 2026-03-31T19:00:00+05:30
lastmod: 2026-03-31T19:00:00+05:30
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
  - SSTI
  - template-injection
  - web-application-pentesting

draft: false
description: "TryHackMe SSTI room walkthrough — understanding Server-Side Template Injection, detecting template engines, exploiting Smarty/Pug/Jinja2/Twig, and mitigation strategies."
---

## Server-side Template Injection (SSTI)

Part of TryHackMe's **Web Application Pentesting** learning path under **Injection Attacks**. SSTI is one of the most impactful web vulnerabilities — it leads directly to Remote Code Execution (RCE).

> Room Link: [https://tryhackme.com/room/serversidetemplateinjection](https://tryhackme.com/room/serversidetemplateinjection)

---

## Task 01: Introduction

SSTI occurs when user input gets injected into a server-side template engine. Deploy the machine and add to hosts.

**Answer:** `No answer needed`

---

## Task 02: SSTI Overview

Template engines combine fixed templates with dynamic data. When user input is treated as template code without sanitization, attackers can inject payloads that execute on the server — leading to RCE, file reads, or data exfiltration.

**Answer:** `No answer needed`

---

## Task 03: Template Engines

How to identify the engine:

| Probe | Jinja2 | Twig | Smarty | Pug |
|-------|--------|------|--------|-----|
| {{7*7}} | 49 | 49 | 49 | N/A |
| {{7*'7'}} | 7777777 | 49 | error | N/A |
| #{7*7} | N/A | N/A | N/A | 49 |

Key: `{{7*'7'}}` returns `7777777` in Jinja2 (string multiply) but `49` in Twig.

**Answer:** `No answer needed`

---

## Tasks 04-07: Engine-Specific Exploitation (Smarty, Pug, Jinja2, Twig)

Each task covers exploiting a specific engine on `ssti.thm:8000`. All require VPN access.

- **Smarty (PHP):** Direct function execution via `{system("command")}`
- **Pug (NodeJS):** JavaScript execution via `#{require('child_process').execSync('command')}`
- **Jinja2 (Python):** Class traversal to os module via `{{config.__class__.__init__.__globals__['os'].popen('id').read()}}`
- **Twig (PHP):** Filter callback abuse via `{{_self.env.registerUndefinedFilterCallback("exec")}}`

**Answers:** Require machine access via VPN

---

## Task 08: Extra-Mile Challenge

Login at `ssti.thm:8080` with `admin:admin`. Identify the template engine, exploit SSTI to get RCE, and read the hidden flag.

**Answer:** Requires VPN

---

## Task 09: Mitigation

### Key Defenses

1. **Sandboxing** — restrict template access to dangerous functions (most effective)
2. **Input Sanitization** — escape dangerous characters before rendering
3. **Disable dangerous tags** — remove `{php}` in Smarty, avoid `!{}` in Pug
4. **Template Auditing** — regular security review of template files
5. **Least Privilege** — templates shouldn't have access to system functions

**Answer:** `No answer needed`

---

## Task 10: Conclusion

SSTI = P1 Critical in bug bounty. Always test user inputs with `{{7*7}}` probes. Different engines need different payloads.

**Answer:** `No answer needed`

---

## SSTI Detection Cheatsheet

| Probe | Engine |
|-------|--------|
| `{{7*7}}` = 49, `{{7*'7'}}` = 7777777 | Jinja2 |
| `{{7*7}}` = 49, `{{7*'7'}}` = 49 | Twig |
| `#{7*7}` = 49 | Pug/Jade |
| `{7*7}` = 49 | Smarty |
| `<%= 7*7 %>` = 49 | ERB (Ruby) |
| `${7*7}` = 49 | Mako/FreeMarker |

---

*Article written by Sita(AI)*
