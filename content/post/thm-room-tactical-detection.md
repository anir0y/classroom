---
title: "TryHackMe Tactical Detection: IOCs, Sigma, and Tripwires"
date: 2026-08-10T23:45:00+05:30
lastmod: 2026-08-11T00:05:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-tacdet/00-thumbnail.png

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
description: "Walkthrough of TryHackMe Tactical Detection: turn unique and public IOCs into Sigma rules, translate them with Uncoder, and set Windows file tripwires."
---

## Tactical Detection

Buying a detection product and forgetting about it is not a strategy. This SOC Level 2 room in the Detection Engineering path is about the opposite: cheap, immediate, high-impact detections that you build yourself and that are tailored to your own environment. It walks through three tactics, each layering a little more visibility on top of whatever you already run: turning unique threat intel into rules, adopting public IOCs, and planting tripwires. The guiding idea is stated plainly in the room: an attacker has to beat every one of your defenses, but you only need them to trip a single layer to know they are there.

![The Tactical Detection room on TryHackMe marked Room completed 100 percent, all six tasks green](/img/thm-tacdet/01-room.png)

## Task 2: unique threat intel becomes a Sigma rule

The first tactic uses intel you already own. After an incident, responders log indicators of compromise in a spreadsheet, and those unique IOCs are gold: they are the fingerprints of an adversary that has already been in your environment. The room hands you exactly such a spreadsheet.

![The IOC spreadsheet excerpts from the room: three malicious domains and the malicious executable with its full path](/img/thm-tacdet/02-iocs.png)

Reading the spreadsheet answers the first questions directly. The **original indicator** the authors found is the domain **`bad3xe69connection.io`**, from which they pivoted to two associated domains (`kind4bad.com`, `nic3connection.io`). The **full path of the malicious file** downloaded from the internet is **`C:\Downloads\bad3xe69.exe`**, a fake application updater weighing in at 13,619 KB.

To make these IOCs useful everywhere regardless of which SIEM you run, the room transforms them with **Sigma**, an open-source, vendor-agnostic signature language. The example rule, `baddomains.yml`, watches a proxy log for executable downloads from any of the three domains.

![Terminal card of the baddomains.yml Sigma rule built from the three IOCs, with logsource category proxy and the r-dns domain list](/img/thm-tacdet/03-sigma.png)

Two answers fall out of the rule itself: the tool used to write vendor-agnostic detections is **Sigma**, and the `logsource` **category** the author chose is **`proxy`**.

## Task 3: public IOCs, translated to any SIEM

You do not have to be breached to learn from a threat. When a new 0-day drops, the community releases public IOCs and Sigma rules, and you can adopt them immediately. The catch is that everyone runs a different SIEM, so the room uses **Uncoder** to translate a public Sigma rule into whatever query language you actually deploy. It works through two well-known rules: Huntress's Follina/MSDT rule and a Log4j "suspicious shells spawned by Java" rule.

![Terminal card of Uncoder translations: the Follina rule to ElastAlert and the Log4j rule to a Splunk alert, with the answer fields highlighted](/img/thm-tacdet/04-uncoder.png)

Translating the Follina rule to Elastic/ElastAlert, the output searches the **`winlogbeat-*`** index, its alerter subclass is **`debug`**, and the part of the ElastAlert output that looks exactly like the Elastic query is the **`filter`** block. Translating the Log4j rule to a Splunk alert, the mapped **`alert.severity`** for a high-level rule is **`3`**, the **`dispatch.earliest_time`** look-back window is **`-60m@m`**, and the **source** the query targets is **`WinEventLog:Security`**. (Note that the free Uncoder.io translator has since moved behind SOC Prime's enterprise Prime Architect, so the exact field values above are the ones the room's original conversions produced.)

{{< ad >}}

## Task 4: tripwires with Windows object-access auditing

The third tactic leans on "knowing your environment." Some data has no legitimate reason to be touched, so any access to it is instantly suspicious. That is the essence of a tripwire, a honeypot file or folder that exists only to be an alarm. The room sets one up on Windows: enable **Audit object access** in the Local Security Policy, create a "Secret Document," and add an auditing entry for **Everyone** on it. From then on, every access is recorded in the Security log under **Event ID 4663**.

![Terminal card of the Windows Object Access event chain: 4656 handle requested, 4663 access attempt with Accesses ReadData, 4658 handle closed, correlated on Handle ID](/img/thm-tacdet/05-audit.png)

Reading a monitored file's contents from `cmd` produces a 4663 whose **`Accesses`** value is **`ReadData (or ListDirectory)`**. The object-access events form a chain worth memorising: **4663 is always preceded by 4656** (a handle to the object was requested), and the closure of an object is signalled by **4658** (the handle was closed). Because 4658 tells you when a handle closed, you can measure how long an object was open by correlating events that share the same **`Handle ID`**, the description field that ties a single open-access-close sequence together.

## Task 5: purple teaming

The room closes on the cheapest force-multiplier of all: simulate the attack yourself and watch what your detections do. If you want to know how your defenses fare, run the technique, then check the logs for what you caught and what slipped through. The **Tempest** and **Follina** rooms are cited as examples of leveraging **purple team** tactics, and the Follina MSDT room specifically covers **`CVE-2022-30190`**.

![Terminal card summarising every answer in the room grouped by task](/img/thm-tacdet/06-answers.png)

## Room summary

| | |
|---|---|
| Room | Tactical Detection (SOC Level 2, Detection Engineering) |
| Category | Detection Engineering, Medium |
| Task 2 | `Sigma`; `bad3xe69connection.io`; `C:\Downloads\bad3xe69.exe`; `proxy` |
| Task 3 | `winlogbeat-*`; `debug`; `filter`; `3`; `-60m@m`; `WinEventLog:Security` |
| Task 4 | `ReadData (or ListDirectory)`; `4656`; `4658`; `Handle ID` |
| Task 5 | `purple team`; `CVE-2022-30190` |

## Wrap-up

The theme running through Tactical Detection is leverage. None of these tactics require a new product or a big budget; they take intel you already have, research the community already published, and telemetry your operating system already emits, and turn each into an actionable alert. Unique IOCs become Sigma rules that spot a returning adversary. Public Sigma rules become SIEM queries with one Uncoder translation. A single audit policy turns an ordinary file into a tripwire that screams the moment anything unauthorised touches it. And purple teaming ties it together by proving, rather than assuming, which of those layers actually fires. Depth beats any single perfect control, because the attacker has to clear every layer while you only need one to catch them.
