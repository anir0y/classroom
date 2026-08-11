---
title: "TryHackMe Intro to Threat Emulation: Emulate FIN7 and APT37"
date: 2026-08-12T00:00:00+05:30
lastmod: 2026-08-12T00:04:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-teintro/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Threat Emulation
  - MITRE ATT&CK
  - Red Team

draft: false
description: "Walkthrough of TryHackMe Intro to Threat Emulation: emulation vs simulation, TIBER-EU and Atomic Red Team, the five-step process, and emulating FIN7 and APT37."
---

## Intro to Threat Emulation

This is the opening room of the SOC Level 2 Threat Emulation module, and it sets the vocabulary and process for the hands-on Atomic Red Team and CALDERA rooms that follow. It is mostly conceptual, but it finishes with a genuinely fun pair of interactive exercises where you step into a red teamer's shoes and emulate two real threat groups.

![The Intro to Threat Emulation room on TryHackMe marked Room completed 100 percent, all seven tasks green](/img/thm-teintro/01-room.png)

## Task 2: what threat emulation actually is

The core definition is the room's first answer: **Threat Emulation** is an intelligence-driven impersonation of real-world attack scenarios and TTPs in a controlled environment, done to test and improve an organisation's defences with evidence instead of assumptions. The room is careful to separate it from a term people use interchangeably: **Threat Simulation** represents adversary behaviour through predefined and automated attack patterns that blend TTPs from several groups without imitating one specific adversary. Emulation replicates *one* real actor; simulation is the automated, blended version.

## Task 3: frameworks and resources

Structured programmes exist for this. **TIBER-EU** (Threat Intelligence-Based Ethical Red Teaming) organises an engagement into phases, and the phase under which **Engagement and Scoping** falls is **Preparation**. On the tooling side, the room points at **Atomic Red Team**, a library of small, technical emulation tests mapped directly to ATT&CK TTPs, which becomes the subject of the next room.

![Terminal card of the emulation vocabulary, the TIBER-EU and Atomic Red Team frameworks, and the five-step process](/img/thm-teintro/02-concept.png)

## Task 4: the process, part one

The room frames a scenario, VASEPY Corp hiring you as a Threat Emulation Engineer, and lays out a five-step process: **Define Objectives, Research Adversary TTPs, Plan the Engagement, Conduct the Emulation, and Report and Conclude**. Researching the adversary starts on ATT&CK, where financially motivated retail-targeting groups FIN6, FIN7 and FIN8 surface as candidates. Cross-referencing the ATT&CK software pages, the three tools used by both **FIN6 & FIN7** are **AdFind, Cobalt Strike, and Mimikatz**. Narrowing the shortlist uses four factors, and the one that asks whether existing tooling can handle the job or custom tools are required is **TTP Complexity**.

## Tasks 5 and 6: emulate the adversary

{{< ad >}}

This is where the room gets hands-on. Task 5 covers planning, where the plan component that defines which activities are permitted (and where) is the **Scope**, and then launches an interactive attack game. You play the attacker across two rounds of three questions each, plus a floating **Special Ability** bonus, draining the defender's health with each correct ATT&CK choice.

![Real screenshot of the Threat Emulation Attack exercise: Round 1 emulating Carbon Spider APT, with attacker and defender health bars and a multiple-choice execution-technique question](/img/thm-teintro/te-question.png)

Round 1 has you emulate **Carbon Spider (FIN7)** and Round 2 **Reaper (APT37)**, and clearing both captures the flags **`THM{C4RB0N_$P1D3R_1$_F1N7}`** and **`THM{3$P1ON4G3_F0R_R34P3R}`**. Task 6 mirrors the format from the defender's chair, and completing its two rounds yields **`THM{D3F3NC3_1N_3MUL4T10N}`** and **`THM{S3CUR3_4LL_W3B_4553T5}`**.

![Card summarising every answer and flag across the room](/img/thm-teintro/03-answers.png)

## Room summary

| | |
|---|---|
| Room | Intro to Threat Emulation (SOC Level 2, Threat Emulation) |
| Category | Threat Emulation, Easy |
| Task 2 | `Threat Emulation`; `Threat Simulation` |
| Task 3 | `Preparation`; `Atomic Red Team` |
| Task 4 | `AdFind, Cobalt Strike, Mimikatz`; `TTP Complexity` |
| Task 5 | `Scope`; `THM{C4RB0N_$P1D3R_1$_F1N7}`; `THM{3$P1ON4G3_F0R_R34P3R}` |
| Task 6 | `THM{D3F3NC3_1N_3MUL4T10N}`; `THM{S3CUR3_4LL_W3B_4553T5}` |

## Wrap-up

For an intro room, this one does its job well: it fixes the emulation-versus-simulation distinction that trips people up, points at the frameworks and tooling (TIBER-EU for structure, Atomic Red Team for the tests), and walks the five-step process against a concrete adversary selection. The interactive games are the highlight, because turning "emulate FIN7" into a series of ATT&CK technique choices is exactly the mental model the rest of the module builds on: pick a real adversary, learn their TTPs, and reproduce them deliberately. Next up in the module are the tools that automate this, Atomic Red Team and CALDERA.
