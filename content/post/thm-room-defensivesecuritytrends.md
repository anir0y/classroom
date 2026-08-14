---
title: "TryHackMe Defensive Security Trends: Keeping Up as an L2"
date: 2026-08-14T11:45:00+05:30
lastmod: 2026-08-14T11:50:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-defensivesecuritytrends/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Blue Team
  - Threat Intel
  - Supply Chain

draft: false
description: "Walkthrough of TryHackMe Defensive Security Trends: faster and complex attacks, valid accounts, supply chain, AI impact, and the Verizon DBIR research challenge."
---

## Defensive Security Trends

This is a reading-heavy room in the SOC Level 2 track, and it does one thing well: it forces a senior analyst to zoom out from the alert queue and look at where the threat landscape is actually going. The argument running through all seven tasks is that intrusions have become faster, more complex, and harder to attribute, but the fundamentals of detection and response have not changed. The job is to keep your visibility broad and your rule coverage deep so that the newer tricks still map to techniques you already hunt for.

> Cyber security is changing, and as a senior you must keep up. Whenever L1 escalates an intrusion alert to you, you should already know what threat group or attack vector it matches.

Six of the seven tasks are answerable straight from the room text. Only the last one, a research challenge, sends you out to two external reports. Here is the full run, task by task.

![Defensive Security Trends room completed on TryHackMe, all seven tasks marked done at 100 percent](/img/thm-defensivesecuritytrends/01-room-complete.png)

## Task 2: attacks become faster

The room opens with a real pattern rather than a statistic: in 2025 the Akira ransomware group bypassed VPN authentication on a SonicWall firewall and went from that initial foothold to exfiltrating data and deploying ransomware across an entire Active Directory domain in forty minutes. The SOC got alerts and still lost the race.

A short list of breakout-time data drives the point home, and the room asks you to pull one figure from the Huntress report specifically: the reported average time-to-ransomware is almost **17 hours**. Other cases in the list are much faster, down to a 27-second eCrime breakout from CrowdStrike, but the Huntress average is the one the question wants.

The other question is about survival tactics. Of the three recommendations the room gives (contain first and investigate second, close detected security gaps, and speed up the routine parts of triage), the one it asks you to name is what to do with a slow triage routine: **automate it**. The reasoning is that the sooner you begin a response, the more of that shrinking breakout window you claw back.

## Task 3: attacks become complex

Speed is only half the story. The second trend is sophistication: adversaries change infrastructure constantly and disguise their campaigns as routine IT and DevOps activity so they blend in. The examples are all living-off-trusted-tools: DarkGate delivered through **AnyDesk**, a Shai-Hulud worm abusing the legitimate Trufflehog scanner to harvest secrets, APT41 running command and control over the Google Calendar API, and attackers installing Velociraptor, a real DFIR tool, to control victims.

{{< ad >}}

The task also introduces the fading network perimeter, which is the concept that matters most for triage. The old model of a firewall separating a trusted inside from a hostile outside no longer holds when staff log in from personal devices, servers live in third-party clouds, and applications pull in hundreds of dependencies you do not control. So when the room asks whether the network perimeter is becoming more predictable in modern environments, the answer is **Nay**. It is becoming less predictable, and that is precisely why detection has to cover a much wider range of techniques than it used to.

## Task 4: attacks via valid accounts

This is the "attackers do not break in, they log in" task. A regular login to a VPN or cloud app, during working hours and from an expected country, is far harder to catch than a noisy brute force. The Verizon 2026 DBIR figure the room highlights is that valid-account abuse showed up in **39%** of recorded incidents.

The supply side of that is infostealers. A single infected admin laptop can seed a ransomware attack a year later if the stolen credentials were never rotated, and stealers grab browser sessions and tokens that sail straight past MFA. The stolen data gets packaged into "logs" and sold, and the middlemen who filter those logs for valid corporate credentials and resell them to ransomware crews are the **Initial Access Brokers**. That name is the second answer, and it becomes important again in the research challenge.

## Task 5: supply chain attacks

A supply chain attack skips the target and compromises something the target trusts. The room walks through the (fictional but very plausible) Vercel April 2026 incident as a four-hop chain: Context.ai is compromised using AWS credentials stolen by **Lumma Stealer**, the attackers exfiltrate OAuth tokens including Vercel's, pivot into internal Vercel systems, and then reach Vercel's own customers. Lumma Stealer at the very front of that chain is the first answer.

![The Vercel supply chain diagram and the SOC detection and response tips table for Vercel, Axios and DAEMON Tools incidents](/img/thm-defensivesecuritytrends/03-supply-chain.png)

The key SOC insight is in the second question. A supply chain attack bypasses the perimeter and can start from anywhere, but once it is inside it unfolds like any other intrusion, and the techniques, tactics, and procedures stay the same. So when the room asks whether supply-chain TTPs would fundamentally differ from other intrusions, the answer is **Nay**. That is good news for defenders: you do not need a special playbook, you need broad visibility and solid MITRE coverage, plus a few habits like enforcing least privilege and waiting a few days before pulling in fresh dependencies.

## Task 6: AI impact on cyber security

The AI task is deliberately balanced. AI helps analysts (deobfuscation, enrichment, report writing, SIEM chatbots) and it helps attackers just as much (AI-generated phishing now beats human red teams in the room's cited Hoxhunt data, and exploit and infrastructure work gets faster). It also becomes an attack surface of its own through prompt injection and AI-themed lures.

But the closing argument is what the two questions test. First, AI does not change the fundamental flow of an attack: the Cyber Kill Chain and MITRE ATT&CK still map AI-powered intrusions, so which MITRE technique became obsolete due to AI? **None**. Second, AI is an assistant and not an authority, and the L1 and L2 analysts remain the final decision makers, so should AI become the final decision maker in a SOC? **Nay**. Use it responsibly, keep it under SOC control, and hold people accountable for what it produces.

## Task 7: the research challenge

The last task is the only one that leaves the room. You get two links, a GitHub breach announcement and the Verizon 2026 DBIR, and four questions that need real reading and a bit of OSINT.

![The Task 7 research challenge with all four answers accepted: Nx Console, TanStack, 240 percent, and VPN](/img/thm-defensivesecuritytrends/02-research-challenge.png)

The GitHub side is a multi-layer supply chain story. The employee device that started the breach was infected through a backdoored VS Code extension, and that extension was **Nx Console**. The interesting part is how the extension itself got poisoned: it was compromised through an upstream attack, and GitHub linked the whole thing to the **TanStack** npm supply-chain attack. That is worth flagging as an answer-format trap. The question literally asks for the "open-source package ecosystem," and the instinctive answer is npm, but the accepted answer is TanStack, the npm library that was the root of the chain. The character-length hint on the input field rules npm out and points straight at the eight-letter name.

The Verizon side is two figures from the DBIR. On the System Intrusion pages, threat-actor use of RMM tooling has grown **240%** year over year, which matches the broader trend of attackers reaching for legitimate remote-management software instead of custom backdoors. And in the infostealer-to-ransomware section, the access type that Initial Access Brokers most commonly sell is **VPN** access, which closes the loop back to Task 4: stealers harvest the credentials, brokers package and sell the VPN access, and ransomware crews buy their way straight in.

A note on method for anyone doing this room: every answer field carries a character mask, and here the masks were exact for all four. Two words at two and seven characters is Nx Console, eight characters is TanStack, four characters is 240%, and three characters is VPN. Reading the mask before submitting saved a couple of wrong guesses, especially on the TanStack question where the obvious answer does not fit.

## Every answer

| Task | Question | Answer |
|---|---|---|
| 2 | Reported average time-to-ransomware (Huntress) | `17 hours` |
| 2 | What should SOCs do with the triage routine | `Automate it` |
| 3 | Remote access tool used by DarkGate | `AnyDesk` |
| 3 | Is the network perimeter becoming more predictable? | `Nay` |
| 4 | Percentage of incidents with valid accounts (Verizon) | `39%` |
| 4 | Criminals who sell access to networks | `Initial Access Brokers` |
| 5 | First malware in the Vercel attack chain | `Lumma Stealer` |
| 5 | Would supply-chain TTPs fundamentally differ? | `Nay` |
| 6 | Should AI be the final decision maker in a SOC? | `Nay` |
| 6 | Which MITRE technique became obsolete due to AI? | `None` |
| 7 | VS Code extension backdoored with an infostealer | `Nx Console` |
| 7 | Package ecosystem that was the root cause | `TanStack` |
| 7 | RMM usage growth year over year (DBIR p.40) | `240%` |
| 7 | Access type Initial Access Brokers most commonly sell | `VPN` |

## Wrap-up

Defensive Security Trends is a briefing rather than a hands-on grind, but it is a good one, and it lands its central point cleanly. Attacks are faster, hide inside trusted tools, log in with stolen valid accounts, ride in through the supply chain, and now get an AI boost on both sides. None of that retires the fundamentals. The Cyber Kill Chain still holds, MITRE ATT&CK still maps the newer intrusions, and a mature SOC with broad visibility and deep rule coverage still catches them, just with less time to react. The research challenge is the part worth doing slowly, because tracing the Nx Console breach back to the TanStack npm compromise and the infostealer to broker to ransomware pipeline in the DBIR is exactly the kind of trend-reading a senior analyst is expected to do on their own.
