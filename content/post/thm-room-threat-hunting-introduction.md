---
title: "TryHackMe Threat Hunting Introduction: Approaches, Targets, and APT-Serpent"
date: 2026-08-11T10:15:00+05:30
lastmod: 2026-08-20T16:10:00+05:30
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
  - Threat Intelligence
  - Blue Team

draft: false
description: "Walkthrough of TryHackMe Threat Hunting Introduction: dwell time, the three hunting approaches and targets, the four hunting methods, and a proactive hunt against APT-Serpent in the practical."
---

## Threat Hunting: Introduction

Room: [Threat Hunting: Introduction](https://tryhackme.com/room/threathuntingintroduction) on TryHackMe.

The opening room of the **Threat Hunting** module in SOC Level 2 — room one of eight, ahead of [Foothold](/post/thm-room-threat-hunting-foothold/), [Pivoting](/post/thm-room-threat-hunting-pivoting/), [Endgame](/post/thm-room-threat-hunting-endgame/), the two Hunt Me rooms including [Typo Squatters](/post/thm-room-typo-squatters/), and finally Health Hazard and Typo Snare.

> **Note on this post (updated 2026-08-20).** TryHackMe rebuilt this room after I first published. The earlier version was a conceptual walk through hunting-versus-IR with a MITRE ATT&CK Navigator exercise; the current one restructures everything around approaches, targets, and techniques, and replaces the Navigator work with a browser-based threat-intel practical. This walkthrough covers the current version — seven tasks, fourteen answers, 96 points.

![The Threat Hunting Introduction room at 100%, all seven tasks complete](/img/thm-thintro/01-room.png)

There is no lab machine and no SIEM here. Five tasks are reading, and Task 6 is a self-contained web app holding a threat intelligence report you have to actually read.

## Task 2: what threat hunting is, and dwell time

The room opens with a building analogy that is better than most: cameras, motion sensors, and alarms are your automated detections, and they catch a lot but never everything. The guards who patrol *inside* the building without waiting for an alarm are the threat hunters. They start from the assumption that someone may already be past the perimeter.

That gives the first answer directly — threat hunting is **Proactive**, in contrast to incident response, which begins when an alert fires.

The second answer is the metric that justifies the whole discipline. **Dwell Time** is the average number of days an attacker remains undetected in your environment after initial compromise. The room cites 2024–2025 industry data putting typical dwell times at 20 to 30 days, with advanced actors persisting for months. Every day of dwell time is a day of reconnaissance, lateral movement, and staging, so compressing it is the point of hunting.

The framing worth keeping: hunting and IR are not competitors. Hunting finds what detections missed; IR contains and removes it; what IR learns becomes tomorrow's detection, which redirects tomorrow's hunt.

## Task 3: the three hunting approaches

The room is explicit that these are the three most widely practised approaches rather than an exhaustive taxonomy, and that mature teams blend them.

**Hypothesis-driven** starts from a question or suspicion. The worked example is a hunter who suspects finance workstations were phished, and goes looking for suspicious PowerShell, odd network connections, and credential access on those hosts. It is the approach for when you have a concern but no specific intelligence.

**Intelligence-driven** starts from external threat intelligence — a report on a group targeting your sector, mapped through MITRE ATT&CK — and searches your environment for evidence of those specific TTPs.

**Indicator-driven** starts from concrete artifacts: file hashes, IPs, domains, email addresses. Load the list, query for matches, get a binary answer.

So the two answers fall out cleanly. Intelligence about an APT group targeting your industry calls for **Intelligence-driven Hunting**. A list of file hashes and IOCs from a threat feed calls for **Indicator-driven Hunting**.

The room is honest about indicator-driven hunting's ceiling, and it matters later: indicators are objective and scale well, but attackers rotate infrastructure constantly, so IOCs go stale fast. It is most effective with recent indicators from active attacks.

## Task 4: what you are actually hunting for

Three categories of target, built on the premise that attackers cannot operate without creating artifacts:

- **Known Malware** — samples reported in your industry that you go looking for.
- **Attack Residues** — the traces left behind while executing the attack chain: commands run, files touched, persistence created, C2 established.
- **Known Vulnerabilities** — evidence that a published CVE was exploited in the window before you patched, with Log4Shell (CVE-2021-44228) as the example.

The answer for artifacts left behind during an attack is **Attack Residues**.

The distinction the task draws between this and the next one is the useful bit: Task 4 is the *what*, Task 5 is the *how*.

{{< ad >}}

## Task 5: the four hunting methods

Hunters search event logs, EDR telemetry, SIEM data, network flow, DNS, proxy, firewall, and application logs — and the room notes that list is only a starting point.

Four methods:

1. **Attack Signatures** — patterns matching known threats. Effective against known attacks, blind to novel ones.
2. **Indicators of Compromise** — hashes, IPs, domains loaded into a query tool. Objective results, but brittle as attackers rotate infrastructure.
3. **Behavioral Pattern Analysis** — sequences of events that together indicate malice even when each event looks benign.
4. **Logical Queries and Anomaly Detection** — statistical deviation from an established baseline.

The question about file hashes, IP addresses, and domain names maps to **Indicators of Compromise**. The one quoting `Word.exe spawns cmd.exe spawns powershell.exe that connects to external IP` is **Behavioral Pattern Analysis** — that exact process chain is the room's own first example of the method.

Behavioral patterns are the method that earns its keep, because they describe what the attacker must *do* rather than which file they happened to use. Renaming the binary and rotating the C2 domain defeats methods 1 and 2; it does not change the fact that a document spawned a shell that spawned PowerShell that phoned out.

## Task 6: hunting APT-Serpent

The practical drops you in as a threat hunter at a financial services firm. Your team has intelligence on **APT-Serpent**, a group targeting your sector. No alerts have fired — that is the point, and it is exactly the intelligence-driven scenario Task 3 described.

The app is a three-step flow: read the intel report, make a decision, collect the flag. It opens on the report, which carries a prominent disclaimer that APT-Serpent is fictional and all its data simulated.

![The APT-Serpent threat intelligence report showing the actor profile and known campaigns](/img/thm-thintro/02-intel-report.png)

The Known Campaigns table answers the first question. Operation Silent Coil (2021), Venom Strike (2022), Black Mamba (2023), and Hooded Cobra (2024) — **4** campaigns since 2021. The actor profile lists "Active since 2020", so the question's "since 2021" is doing real work: it is scoped to the campaign table, not the group's lifetime.

The attack timeline answers two more.

![The five-phase attack methodology and timeline for APT-Serpent](/img/thm-thintro/03-attack-timeline.png)

```
1. Reconnaissance        OSINT collection on employees via LinkedIn and conference rosters.
2. Initial Access        Spear-phishing emails with weaponized Office documents
                         exploiting CVE-2023-21716 macros.
3. Execution & Persistence   Drops CustomBackdoor; establishes scheduled task and
                             WMI event subscription for persistence.
4. Lateral Movement      Pass-the-hash via stolen NTLM credentials; RDP pivoting.
5. Exfiltration          Staged data compressed with 7z, encrypted, exfiltrated via HTTPS.
```

CustomBackdoor is dropped in phase 3, so the answer is **Execution & Persistence**. The primary initial access vector, from phase 2, is **Spear-phishing**.

The Known Malware & Tools panel supplies the fourth.

![The Known Malware and Tools panel listing CustomBackdoor capabilities including 300s C2 beacons](/img/thm-thintro/04-malware-tools.png)

CustomBackdoor's capabilities end with "Encrypted HTTPS C2 beacons every 300s", so the beacon interval is **300** seconds. Worth noting for the later rooms: a fixed 300-second interval is exactly the kind of regularity that anomaly detection catches — real user traffic is not periodic.

The report also ships an IOC database and an attack flow diagram. The indicators are defanged (`update-system[.]thm`), with a note to re-fang before using them in tooling.

![The IOC database with defanged indicators and the attack flow visualization](/img/thm-thintro/05-ioc-attack-flow.png)

### The decision

Proceeding past the report gives you two multiple-choice questions, and this is where the room checks whether the theory landed.

![The decision step asking which hunting approach and which hunting target to use](/img/thm-thintro/06-decision.png)

**Approach: Intelligence-driven.** You have a finished intelligence report on a named actor with its TTPs, campaigns, and IOCs. That is the definition of the intelligence-driven trigger. Hypothesis-driven is what you reach for when you lack specific intel, and you are not lacking it here.

**Target: Attack residues.** This is the more interesting half. The report hands you a tidy list of hashes and domains, so indicator-driven hunting against those IOCs is the tempting move — and it is the wrong one. The app's own explanation for rejecting the indicator option is that IOCs are brittle and easily rotated by a mature actor, and APT-Serpent is rated high sophistication with living-off-the-land tradecraft. Hunting the behavioural residues of its TTPs survives infrastructure rotation; hunting its current domains does not.

![Both answers correct, showing intelligence-driven hunting and attack residues](/img/thm-thintro/07-correct.png)

![The flag dialog showing THM-APT-SERPENT-INTEL](/img/thm-thintro/08-flag.png)

> Flag: `THM-APT-SERPENT-INTEL`

**Answer-format note.** This flag is not in the usual `THM{...}` shape, and the answer box tells you so before you submit: the mask is twenty-one bare underscores with no braces. It also confirmed something useful about how THM renders masks — hyphens come through as underscores, not as literal hyphens. That mattered for the initial-access question too, where the mask was fourteen unbroken underscores. Fourteen is `Spear-phishing` counting the hyphen, and submitting it that way was accepted first try; had hyphens rendered literally, the mask would have read `_____-________`.

## Task 7: what to take forward

Two things.

**The approach is chosen by what you have, not by what you prefer.** The three approaches are not a maturity ladder where indicator-driven is beginner and hypothesis-driven is expert. They are selected by available input. A finished intel report on a named actor makes intelligence-driven correct. A hunch about the finance department with nothing else makes hypothesis-driven correct. A fresh feed of hashes from an active campaign makes indicator-driven correct. The practical is built to catch you picking the approach that matches the shiniest artifact in front of you — the IOC list — rather than the one that matches the situation.

**Hunt behaviour, because behaviour is what the attacker cannot cheaply change.** Every piece of this room converges on the same point. Attack residues beat IOCs as a target, behavioral pattern analysis beats signature and indicator matching as a method, and the reason is identical in both cases: an adversary can recompile a binary, rotate a domain, and change an IP between breakfast and lunch, but they cannot achieve their objective without a document spawning a shell, credentials being replicated, or data being staged and pushed out. The durable detection describes the step in the chain, not the tool that happened to perform it. That is the thread the rest of the module pulls on.

Room solved 100% — 7 tasks, 14 answers, 96 points, room one of eight in Threat Hunting.
