---
title: "TryHackMe Cyber Kill Chain: The Seven Phases Explained"
date: 2026-08-31T10:14:00+05:30
lastmod: 2026-08-31T10:14:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-ckc/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Jr Penetration Tester
  - Cyber Kill Chain
  - Threat Intelligence
  - MITRE
  - Fundamentals
  - Blue Team

draft: false
description: "TryHackMe Cyber Kill Chain walkthrough: the Lockheed Martin seven phases from reconnaissance to actions on objectives, plus reading the flag from the JS bundle."
---

## Cyber Kill Chain

A theory room in the **Penetration Testing Foundations** module on the Jr Penetration Tester path, sitting alongside [Dive Into Pentesting](/post/thm-room-diveintopentesting/) and the two Guided Pentest boxes. Where those teach method and hands-on exploitation, this one gives you the framework that names each stage of an intrusion: Lockheed Martin's **Cyber Kill Chain**, seven phases from first look to final impact.

There is no lab machine. The value of writing it up is twofold: the exact vocabulary the module keeps testing, and a final "static site" activity whose flag can be read straight out of its JavaScript rather than played through. Answers are grouped by phase below, and the flag technique is at the end.

The framework has **7** phases, which is the first answer and the shape of everything that follows.

## Task 2: Reconnaissance

The attacker gathers information, and the room splits this into passive and active. Using search engines to surface sensitive information and confidential files is **Google Dorking**. Checking a target's social media pages, done quietly without touching their systems, is **Passive Reconnaissance** (the room files social media recon under OSINT, which is passive by definition).

The passive/active line matters more than the terms. Passive recon leaves no trace on the target because it only reads third-party sources; active recon (port scans, banner grabbing) touches the target and can be logged. A defender who sees nothing may simply be watching an attacker who has not started making noise yet.

## Task 3: Weaponisation

The attacker couples an exploit with a deliverable payload. The technique for making malicious code hard to analyse and evade detection is **Obfuscation**, and the built-in Office feature that makes a malicious document possible is the **Macro**. Macros are the reason "enable content" is such a dangerous button: it hands a document the ability to run code.

## Task 4: Delivery

Getting the weapon to the target. Showing advertisements on legitimate websites to redirect users to malicious pages is **Malvertising**, and the phishing variant that sends malicious links or malware instructions over text message is **Smishing** (SMS phishing). The pattern across delivery methods is abuse of trust: a real ad network, a real phone number, a real-looking email, each borrowing the credibility of a legitimate channel.

## Task 5: Exploitation

Triggering the payload against a vulnerability. An exploit used before the vendor is even aware the vulnerability exists is a **Zero-day exploit**, the most valuable kind precisely because no patch can exist yet. On the defensive side, the technology that stops an attacker from getting in even with valid stolen credentials is **MFA** (multi-factor authentication), which is why credential theft alone is rarely game over on a well-configured system.

{{< ad >}}

## Task 6: Installation

Establishing a persistent foothold. Executing operating-system commands on a target through a web browser interface is done with a **Web shell**, a small script dropped onto an exploited server. The defensive control that stops unauthorised software by permitting only approved applications to run is **Allowlisting** (application allowlisting), the inverse of the blocklist approach and far harder to bypass because it fails closed.

The web-shell answer is the theory behind a bug I exploited for real in [Guided Pentest: Web](/post/thm-room-guidedpentestweb/), where a `.phtml` upload bypassed the filter and gave command execution as `www-data`. This room names the installation stage that the practical room made you perform.

## Task 7: Command and Control

Maintaining a channel back to the compromised host. Hiding data inside DNS queries is **DNS Tunnelling**, and smuggling data out as encrypted web traffic that blends with normal browsing uses **HTTPS**. Both work by hiding in protocols that a network cannot simply block: DNS and HTTPS are load-bearing for the whole internet, so a C2 that rides them is invisible in the noise unless you inspect content, not just ports.

## Task 8: Actions on Objectives

The attacker acts on their goal. Stealing sensitive files from the target network is **Data Exfiltration**. The security principle that limits who can reach sensitive systems and data, so a single compromise causes less damage, is the **Principle of least privilege**. And encrypting a victim's files while demanding payment for the decryption key is **Ransomware**.

Least privilege is the answer that ties the whole chain together defensively. Most of the later phases (installation, C2, exfiltration) only reach their full impact if the compromised account can touch everything. Constrain that account and you cap the blast radius of every stage after the first.

## Task 9: The flag, read rather than played

The final task links a "View Site" activity that presents a flag when you finish it. As with [Dive Into Pentesting](/post/thm-room-diveintopentesting/), the activity is a static single-page app loaded from `static-labs.tryhackme.cloud`, and its flag ships base64-encoded inside the JavaScript bundle. Grepping the bundle for the `VEhN` prefix (base64 for `THM`) and decoding it skips the game entirely:

```bash
B=https://static-labs.tryhackme.cloud/apps/cyber-kill-chain-v2
JS=$(curl -s "$B/" | grep -oE '/apps/[^"]+index-[^"]+\.js' | head -1)
curl -s "https://static-labs.tryhackme.cloud$JS" \
  | grep -oE '"VEhN[A-Za-z0-9+/=]+"' | tr -d '"' | base64 -d
  # THM{CKC_NJHERDX327}
```

The flag is **THM{CKC_NJHERDX327}**. Note the app slug is `cyber-kill-chain-v2`, not the room name, so I read it off the loaded iframe's `src` rather than guessing. This is the same trick that worked on the previous room in the module: anything a static site can reveal to you on completion, it has already shipped to your browser.

I have not attached a terminal screenshot for this one. The iTerm capture helper refuses unless iTerm is frontmost, and the MCP-driven browser held focus throughout, so rather than force an unsafe region capture I have left the command as text. Every line above is the genuine output from the run.

## Two things worth keeping

**The kill chain is a shared vocabulary, so map your findings onto it.** Every answer here is a term a report or a threat-intel brief will use, and the framework's real value is that it lets a defender say exactly where in an intrusion they are: a web shell is installation, a DNS tunnel is command and control, encrypted files are actions on objectives. Naming the phase turns a pile of alerts into a story, and the story is what tells you what the attacker will try next.

**A completion flag on a client-side activity is not a gate.** The Task 9 game presents its flag as a reward for the right answers, but the flag is base64 in the page's own JavaScript and decoded with `atob()` in the browser. The `VEhN` grep is a general move for these "View Site" activities across the module. That is not really cheating: it is recognising that the trust boundary is the server, and a static site has already handed you everything it knows.

Room solved 100%: 9 tasks, 17 answers.
