---
title: "TryHackMe SigHunt: Nine Sigma Rules for a Ransomware Chain"
date: 2026-08-11T00:20:00+05:30
lastmod: 2026-08-11T00:24:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-sighunt/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Detection Engineering
  - Sigma
  - Blue Team

draft: false
description: "Walkthrough of TryHackMe SigHunt: tune nine Sigma detection rules in the Sigma Validator to catch each stage of a ransomware attack chain and grab the flags."
---

## SigHunt

SigHunt is the hands-on companion to the Sigma room. Instead of reading about rule syntax, you sit in the Detection Engineer's chair after a ransomware incident: the Incident Response team hands you the full attack chain and a table of IOCs, and your job is to write a tuned Sigma detection for every stage. The room ships a TryHackMe tool called the **Sigma Validator**, which grades each rule against a set of logs and only unlocks the challenge flag when your detection scores a perfect 100%.

![The SigHunt room on TryHackMe marked Room completed 100 percent, both tasks green](/img/thm-sighunt/01-room.png)

## How the validator grades a rule

The validator's workflow is the same for all nine challenges. Each one gives you an attack-log JSON (a Sysmon event), a fixed Sigma header with the `logsource` already set to `sysmon`, an editable `detection` block, and a short list of fields under "Fields you can use". You write the detection, hit Validate, and it scores you on true positives versus false positives.

![Terminal card explaining the validator: read the attack log, use every offered field, and a rule missing a field is scored too generic](/img/thm-sighunt/02-validator.png)

The one lesson the tool drills in is precision. A rule that matches on only some of the offered fields is rejected with a pointed hint, for example *"The rule is too generic, use EventID field(s) to achieve more accuracy in your detection."* The winning pattern is to use **every** field the challenge offers: `EventID` to pin the log type, and the distinguishing fields (Image, ParentImage, CommandLine, Hashes, or TargetFilename) to pin the specific malicious behaviour. Do that and you get `True positives: 1 / 1 | False positives: 0`, and the flag appears.

## The attack chain, one detection per stage

The nine challenges map exactly onto the ransomware kill chain: a phishing HTA, a Certutil download, a Netcat reverse shell, PowerUp privilege-escalation enumeration, a service-binary hijack, RunOnce persistence, 7-Zip collection, cURL exfiltration, and the ransomware encryption itself.

![Terminal card listing all nine detections: the Sysmon EventID and the key selection fields for each stage of the attack chain](/img/thm-sighunt/03-chain.png)

Eight of the nine are `process_creation` events (Sysmon EventID 1), so each detection combines `EventID: 1` with an `Image|endswith` on the tool and a distinguishing field. Challenge #1 pairs `Image: mshta.exe` with `ParentImage: chrome.exe` to catch the HTA launched from the browser. Challenge #3 (Netcat) additionally offers the `Hashes` field, and the validator insists you use it, so the rule matches `Image \nc.exe`, `CommandLine '-e cmd.exe'`, and `Hashes|contains 'MD5=523613A7B9DFA398CBD5EBD2DD0F4F38'` all together.

{{< ad >}}

The odd one out is the last challenge. Ransomware encryption is a **file** event, not a process, so Challenge #9 switches to Sysmon **EventID 11 (FileCreate)** and offers only `EventID` and `TargetFilename`. The detection is short and pointed: match `EventID: 11` and `TargetFilename|endswith: '.huntme'`, the extension the ransomware appends to everything it encrypts. That single rule flags every file the payload touched.

![Terminal card listing every challenge flag, one per detection rule](/img/thm-sighunt/04-flags.png)

## Room summary

| | |
|---|---|
| Room | SigHunt (SOC Level 2, Detection Engineering, challenge) |
| Category | Detection Engineering, Medium |
| Tool | Sigma Validator (TryHackMe internal) |
| Key idea | use every offered field; `EventID` plus the distinguishing indicators = 100% detection |
| Flags | 9 (one per attack-chain stage, mshta through ransomware) |

## Wrap-up

SigHunt is a good reminder that detection engineering is a balancing act. Too broad and your rule drowns analysts in false positives; too narrow and it misses the next small variation of the same attack. The validator forces the productive middle by scoring both, and its insistence on using every available field is really a lesson in specificity: a process name alone is rarely enough, but a process plus its parent, its command line, or its hash is a signature an attacker has to work to evade. Writing nine of these back to back, across the whole kill chain, is exactly the muscle a detection engineer builds, turning an incident report into durable coverage one tuned rule at a time.
