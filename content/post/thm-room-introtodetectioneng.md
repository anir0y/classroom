---
title: "TryHackMe Intro to Detection Engineering Walkthrough"
date: 2026-08-18T15:33:00+05:30
lastmod: 2026-08-18T15:33:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-introdetectioneng/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Detection Engineering
  - Blue Team

draft: false
description: "Walkthrough of TryHackMe Intro to Detection Engineering: the DE life cycle, precision vs recall, detection library decay, and all eight flags from the Senna assessment."
---

## Intro to Detection Engineering

Room: [Intro to Detection Engineering](https://tryhackme.com/room/introtodetectioneng) on TryHackMe.

First room in the **Detection Engineering for SOC** module, opening a six-room arc — Detection Rules Development, Sigma Language, SigHunt, AI & Automation in Detection Engineering, and DetectMare after this. It follows on from [Cloud Security for SOC](/post/thm-room-monitoringawsworkloads/), and the shift is from *reading* other people's detections to *building* them.

Six tasks, eight flags, all solved 100%. No lab machine and no SIEM — the whole practical component is a single embedded assessment.

![TryHackMe Intro to Detection Engineering at 100%, all six tasks complete](/img/thm-introdetectioneng/01-room-complete.png)

## How the room is actually structured

This caught me out, so it is worth stating plainly: **there are no investigation questions.** Every graded answer is a flag, and every flag comes from one interactive assessment reached through the **View Site** button in Task 2.

![The Detection Engineering Assessment — Senna asks a question and the three monitors are the answer options](/img/thm-introdetectioneng/02-assessment.png)

Senna is a SOC manager asking for advice. Each question types out one character at a time, and the three monitors on the desk are the three answer options — you click a monitor to see what that answer says on a notepad, then Submit. Get it right and the notepad shows a flag; get it wrong and one of the three desk lamps goes dark. **Three attempts per question.**

Two mechanical notes for anyone automating this:

- **The options are re-shuffled on every render.** Going Back and forward again puts a different answer under each monitor. If you read all three options and then try to click the one you decided on, you will click something else. Read the notepad and Submit in the same cycle.
- **The questions are gated by task.** Answer both Task 2 questions and a "Task Milestone" modal tells you to move to Task 3 before continuing. The eight questions map two-per-task across Tasks 2–5.

## Task 2: what Detection Engineering is

The room's framing is the best part of it. You are handed a scenario: millions of events a day, a hundred alerts an hour, analysts drowning, and an attacker who has been resident for three weeks. Then the turn — *the alerts that failed were built by someone.* Someone chose what to detect, how, and what to ignore. That person is a detection engineer.

The definition to keep is that DE is the **systematic process of designing, building, testing and maintaining detections**, sitting at the intersection of threat intelligence, data engineering and security analysis.

**Question 1** asks the difference between a SOC analyst and a detection engineer. The answer is that analysts respond to alerts *reactively* while detection engineers *proactively* build and improve the detections analysts depend on.

> Flag 1: `THM{PR0ACT1V3_D3T3CT10N_3NG1N33R}`

**Question 2** asks where to look to see how a rule's logic changed over the past month. Not the SIEM's edit history, and not the threat intel platform — the **version control system**. The room's own tooling table says it: *Version Control — Git, GitHub — track changes to detection logic and manage review workflows.*

> Flag 2: `THM{V3RS10N_C0NTR0L_1S_K3Y}`

That is the answer that tells you DE is an engineering discipline rather than a SIEM-console activity. Detections are code: they live in a repo, they get reviewed, they have a history you can `git log`.

The three pillars from this task are worth memorising because the rest of the module hangs off them — **Detection Creation** (research a technique, write logic, deploy), **Detection Tuning** (reduce false positives without creating blind spots), and **Detection Management** (track, document, version and deprecate).

## Task 3: the life cycle

{{< ad >}}

**Question 3**: an analyst wants to start writing a rule without having reviewed the available log sources. Should she proceed? **No — data review must happen first**, to confirm the required logs exist and are correctly parsed.

> Flag 3: `THM{D4T4_R3V13W_B3F0R3_D3S1GN}`

**Question 4**: the detection works in the lab, so is testing done and can it ship? Also no — **peer review and documentation still need to happen before deploying.**

> Flag 4: `THM{P33R_R3V13W_B3F0R3_D3PL0Y}`

Both flag names are the lesson: `D4T4_R3V13W_B3F0R3_D3S1GN` and `P33R_R3V13W_B3F0R3_D3PL0Y`. The life cycle has a gate at each end of the build. Writing logic against logs you have not confirmed produces a rule that silently never fires, which is the worst failure mode in detection because it looks exactly like "no attacks happened". And a rule that works on one lab sample has been *demonstrated*, not *tested* — nobody has looked at how it behaves against a month of production noise.

## Task 4: the mentality

**Question 5** is the sharpest question in the room. A detection fired 500 times last week; analysts reviewed 20 alerts and all 20 were false positives. How do you describe the problem? It is a **precision problem** — the detection fires too broadly on benign activity and needs tuning.

> Flag 5: `THM{PR3C1S10N_PR0BL3M_D3T3CT3D}`

Getting the vocabulary right here matters more than it sounds. **Precision** is "of the things I alerted on, how many were real"; **recall** is "of the real things, how many did I catch". A wall of false positives is low precision and says nothing about recall — the rule might still be catching every true positive. Calling it "a noisy rule" invites someone to disable it, which trades a precision problem for a recall problem of unknown size. Naming it precisely tells you the fix is tuning, not deletion.

**Question 6** asks whether to build detections on what attackers *did* in past incidents or on what they *must* do to execute a technique. The accepted answer is to **build both equally, combining IOCs with behavioural logic**.

> Flag 6: `THM{B3HAV10UR_0V3R_10CS}`

Worth being honest that the flag name and the accepted answer pull in slightly different directions — `B3HAV10UR_0V3R_10CS` argues for behaviour, while the graded option argues for parity. The reconciliation is the pyramid-of-pain argument: IOCs are cheap, precise and trivially rotated, behaviour is expensive to write and expensive for an attacker to avoid. You want both, and you should know which half will still be working next month.

## Task 5: the challenges

**Question 7** asks whether documentation, metrics and automation tasks are a normal distraction for a DE team. The accepted answer is that these **only apply to mature teams, and early-stage DE teams should focus on writing rules.**

> Flag 7: `THM{D3_G03S_B3Y0ND_RUL3S}`

I got this one wrong on the first attempt. I chose "Yes — these are standard DE responsibilities alongside core detection work", which is what I would still argue in a real team, and the flag name (`D3_G03S_B3Y0ND_RUL3S`) reads like it agrees with me. The room's key does not. If you are working through this yourself, that is the question to spend an attempt carefully on.

**Question 8**: hundreds of SIEM rules, some written years ago, nobody knows what they cover. Is that a problem? **Yes — undocumented, unreviewed rules generate noise and erode analyst trust over time.**

> Flag 8: `THM{D3T3CT10N_L1BR4RY_D3GR4D3S}`

This is the third pillar biting. A detection library is not an asset that appreciates; it decays. Rules drift out of alignment with the environment, log sources get renamed, the technique gets deprecated, and the person who understood the logic left. What is left is alert volume nobody trusts — which is precisely the scenario the room opened with in Task 2. The room closes the loop on itself.

## Task 6: what to take forward

Two things.

**Detections are code, and the discipline is a software life cycle wearing a security hat.** Every graded answer in this room is really the same answer in a different costume: check your inputs before you build (data review), do not ship on one passing test (peer review), name your failure modes correctly (precision, not "noisy"), keep history you can audit (version control), and expect the artefact to rot without maintenance (library decay). Swap "detection" for "service" and a backend engineer would recognise all five.

**And the reason it matters is trust, not coverage.** The failure described in Task 2 is not that a rule was missing — it is that a hundred alerts an hour trained the analysts to stop believing any of them. Every one of the eight questions is ultimately about protecting the signal-to-noise ratio that makes an alert worth reading. Coverage you cannot triage is not coverage.

Room solved 100% — six tasks, eight flags, and the first of six rooms in Detection Engineering for SOC.
