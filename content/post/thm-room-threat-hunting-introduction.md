---
title: "TryHackMe Threat Hunting Introduction: Mindset and Process"
date: 2026-08-11T10:15:00+05:30
lastmod: 2026-08-11T10:19:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-thintro/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Threat Hunting
  - MITRE ATT&CK
  - Blue Team

draft: false
description: "Walkthrough of TryHackMe Threat Hunting Introduction: how hunting differs from incident response, picking what to hunt for, and ATT&CK Navigator layers."
---

## Threat Hunting: Introduction

This is the opening room of the SOC Level 2 Threat Hunting path, and it is deliberately conceptual: no target machine, no logs to pull apart, just the mindset and process that everything later in the module builds on. It sets threat hunting against incident response, works through how a hunter decides what to look for and how, and finishes with a hands-on MITRE ATT&CK Navigator exercise that makes the theory tangible.

![The Threat Hunting Introduction room on TryHackMe marked Room completed 100 percent, all seven tasks green](/img/thm-thintro/01-room.png)

## Tasks 2 and 3: hunting versus incident response, and the mindset

The core concept is the contrast between two disciplines that look similar from a distance. **Threat Hunting** is proactive: it assumes a breach has already happened and goes looking for the threats that slipped past existing defences, without waiting for an alert to fire. **Incident Response** is reactive: it kicks in after an incident has been **triaged** and confirmed, and works to contain and recover from it.

![Terminal card contrasting threat hunting and incident response, and the assume-compromise mindset that surfaces Indicators of Compromise](/img/thm-thintro/02-mindset.png)

The two feed each other. A hunt that confirms something real hands off to incident response as a new incident, and both, done well, improve the organisation's **security posture** over time. Hunting is also informed by **Threat Intelligence**, which tells the hunter what is worth chasing. The mindset the room wants you to adopt is to assume compromise and then look for the traces it leaves, which surface as **Indicators of Compromise** (IOCs), the artefacts a hunt turns up as evidence.

## Task 4: the what, why, and how of a hunt

Task 4 breaks the hunting process into deciding *what* to hunt for and *how* to hunt for it. On the *what* side, the room points at three sources of leads. Malware is a constant in threat-actor toolkits, and the live malware repository it references is **theZoo**. **Attack Residues** are the example of threat intelligence that blends into environmental noise and is therefore worth hunting deliberately. And organisations should stay extra vigilant for announcements of **zero-day vulnerabilities**.

On the *how* side, once you know your target you characterise it into specific, actionable identifiers you can compare against historical data. That, the room states, is done most effectively via **Attack Signatures and IOCs**, condensing the hunt down to concrete things you can immediately recognise across your telemetry.

{{< ad >}}

## Task 5: comparing threats in the ATT&CK Navigator

The practical is the highlight. Using the **MITRE ATT&CK Navigator**, you build one layer each for three classic Windows worms, giving each a distinct score so that a combined layer reveals overlap at a glance: **WannaCry = 1**, **Stuxnet = 2**, **Conficker = 4**. Stitching the layers with a score expression of `a+b+c` means any aggregate score decomposes uniquely into which threats contributed to it.

![Terminal card explaining the ATT&CK Navigator layering, the 1/2/4 scoring scheme, and the shared techniques it reveals](/img/thm-thintro/03-navigator.png)

Reading the stitched layer answers the questions directly. The tactic with the most techniques highlighted is **Discovery**. The technique common to all three threats (aggregate score 7 = 1+2+4) is **Exploitation of Remote Services**, which makes sense for a set of worms that all spread by exploiting network-facing services. The technique shared by WannaCry and Conficker (score 5 = 1+4) is **Inhibit System Recovery**, and the score of techniques that Stuxnet and Conficker have in common is **6** (2+4). The scoring trick is the real lesson here: distinct weights turn a colour map into a lookup table for attribution.

![Card summarising the Task 4 process answers and every other answer in the room](/img/thm-thintro/04-answers.png)

## Task 6: the goals of threat hunting

The closing concept task names the objectives. The primary goal is to **Minimise a threat actor's dwell time**, the window between initial compromise and detection, because the longer an attacker sits undetected the more damage they do. The secondary aim is durability: once you have profiled a threat through hunting, you convert those profiles into **detection mechanisms** so the same threat is caught automatically next time, turning a manual hunt into a permanent detection.

## Room summary

| | |
|---|---|
| Room | Threat Hunting: Introduction (SOC Level 2, Threat Hunting) |
| Category | Threat Hunting, Easy |
| Task 2 | `Threat Hunting`; `Incident Response`; `triaged`; `Threat Intelligence`; `security posture` |
| Task 3 | `Indicators of Compromise` |
| Task 4 | `theZoo`; `Attack Residues`; `zero-day vulnerabilities`; `Attack Signatures and IOCs` |
| Task 5 | `Discovery`; `Exploitation of Remote Services`; `Inhibit System Recovery`; `6` |
| Task 6 | `Minimise a threat actor's dwell time`; `detection mechanisms` |
| Tool | MITRE ATT&CK Navigator |

## Wrap-up

For a room with no machine, this one earns its place by fixing the vocabulary and the mental model the rest of the module leans on. Threat hunting is the proactive counterpart to incident response: assume a breach, decide what is worth hunting from intelligence and known malware, characterise it into signatures and IOCs, and compare against your data. The ATT&CK Navigator exercise is the neatest part, showing how a simple per-threat scoring scheme turns overlapping technique maps into an at-a-glance answer for which adversaries share which behaviours. Keep the dwell-time goal in mind and feed every confirmed hunt back into a detection, and the manual effort compounds into lasting coverage.
