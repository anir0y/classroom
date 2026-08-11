---
title: "TryHackMe Introduction to SOAR: Playbooks and Automation"
date: 2026-08-11T00:40:00+05:30
lastmod: 2026-08-11T00:44:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-soar/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Detection Engineering
  - SOAR
  - Blue Team

draft: false
description: "Walkthrough of TryHackMe Introduction to SOAR: the SOC challenges it solves, its orchestration and automation, and building playbooks to speed investigations."
---

## Introduction to SOAR

The Detection Engineering path spends most of its length teaching you to write better detections, which inevitably produces more alerts. This closing room addresses the other side of that coin: what happens when a SOC drowns in the very signals it worked so hard to generate. The answer is SOAR, and this room lays out the problems a traditional SOC hits and how a SOAR platform is built to absorb them.

![The Introduction to SOAR room on TryHackMe marked Room completed 100 percent, all six tasks green](/img/thm-soar/01-room.png)

## Task 2: why traditional SOCs struggle

A SOC's job is monitoring and detection, recovery and remediation, threat intelligence, and communication, and it does all of that across a stack of separate tools. That structure creates four recurring pain points.

![Terminal card of the four SOC challenges: alert fatigue, disconnected tools, manual processes, and talent shortage](/img/thm-soar/02-challenges.png)

The headline problem, and the room's first answer, is **alert fatigue**: when numerous tools trigger a flood of alerts, many of them false positives, analysts become desensitised and start missing the ones that matter. The other three compound it: **too many disconnected tools** deployed without integration, **manual processes** that live in analysts' heads rather than documentation, and a chronic **talent shortage** that leaves too few people to do the work.

## Task 3: what SOAR does about it

**SOAR** stands for **Security Orchestration, Automation, and Response**. It is a platform that unifies the SOC's tools behind one interface, so an analyst investigates from a single pane instead of pivoting between the SIEM, EDR, firewall, and threat-intel feeds, and it adds ticketing and case management on top.

![Terminal card of SOAR: its three capabilities of orchestration, automation, and response, plus the definition of a playbook](/img/thm-soar/03-soar.png)

Its strength comes from three capabilities. **Orchestration** is the act of connecting and integrating the security tools so they can work together, and it is the room's answer for that definition. **Automation** lets those integrated tools run predefined steps without a human in the loop, and **Response** acts on the outcome. The unit of that automation is a **playbook**: a predefined list of actions to handle an incident.

{{< ad >}}

## Task 4: building a playbook

Playbooks are where orchestration and automation become concrete. The room walks through a CVE Patching playbook that fetches newly disclosed CVEs from **advisory lists**, checks the environment for affected assets, and, when vulnerable assets are found, produces a **mitigation plan** for them. Crucially, automation does not remove the analyst: asked whether manual analysis is still vital within a SOAR workflow, the answer is **yay**. SOAR automates the repetitive plumbing so the human can spend time on the decisions that actually need judgement.

![Card summarising the Task 5 practical flag and every answer in the room](/img/thm-soar/04-answers.png)

## Task 5: the threat-intel workflow practical

The hands-on task drives the point home. You are given a threat-intelligence integration workflow as a checklist and have to decide which steps should be **manual** and which should be **automated**, toggling each switch and hitting RUN to validate your choices. Getting the split right, automating the mechanical data-gathering and enrichment while keeping human judgement where it counts, completes the workflow and returns the flag **`THM{AUT0M@T1N6_S3CUR1T¥}`**.

## Room summary

| | |
|---|---|
| Room | Introduction to SOAR (SOC Level 2, Detection Engineering) |
| Category | Detection Engineering, Medium |
| Task 2 | overload of events = `Alert Fatigue` |
| Task 3 | connecting/integrating tools = `Orchestration`; predefined actions = `Playbook` |
| Task 4 | manual analysis vital = `yay`; CVE source = `Advisory lists`; assets found -> `mitigation plan` |
| Task 5 | flag `THM{AUT0M@T1N6_S3CUR1T¥}` |

## Wrap-up

SOAR is the organisational answer to the problem detection engineering creates. Every rule you tune adds signal, and signal without capacity to act on it just becomes noise, which is exactly how alert fatigue sets in. SOAR attacks that by orchestrating the disconnected tools into one workflow, automating the repetitive steps of triage and enrichment through playbooks, and freeing analysts to focus on the judgement calls a machine should not make. It closes the module neatly: the earlier rooms taught you to detect more, and this one teaches you how a SOC keeps up with everything it now detects.
