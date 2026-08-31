---
title: "TryHackMe Penetration Testing Frameworks: Pick the Right One"
date: 2026-08-31T10:53:00+05:30
lastmod: 2026-08-31T10:53:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-ptframeworks/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Jr Penetration Tester
  - Penetration Testing
  - OSSTMM
  - OWASP
  - MITRE ATT&CK
  - Methodology
  - Fundamentals

draft: false
description: "TryHackMe Penetration Testing Frameworks walkthrough: OSSTMM, WSTG, NIST 800-115, PTES, ISSAF and MITRE ATT&CK, which to pick, and the flag from the static site."
---

## Penetration Testing Frameworks

A theory room in the **Penetration Testing Foundations** module on the Jr Penetration Tester path, sitting with [Dive Into Pentesting](/post/thm-room-diveintopentesting/), [Cyber Kill Chain](/post/thm-room-cyberkillchain/) and the two Guided Pentest boxes. It surveys the major methodologies a tester is expected to know by name: OSSTMM, OWASP WSTG, NIST SP 800-115, PTES, ISSAF and MITRE ATT&CK, plus a few compliance frameworks, and then tests whether you can pick the right one for a given engagement.

No lab machine. The questions are scenario-based rather than trivia, so the answers have to match the room's exact terminology, and the answer masks did real work here in settling wording. Answers are grouped by framework below, with the honest notes at the end.

Frameworks earn their keep on three fronts, and the first task tests two of them: **thoroughness**, so a tester who skips network mapping and scoping does not miss critical areas, and **compliance**, which is what a healthcare client under HIPAA cares about beyond the raw vulnerability list.

## Task 2: OSSTMM

The Open Source Security Testing Methodology Manual is built on "metrics over opinions". Its quantitative core is the **Risk Assessment Values** (RAVs), the metric that measures the balance between an organisation's total attack surface and the controls protecting it. Its testing cycle has four phases: Induction, Interaction, Inquiry, Intervention. After completing Induction and Interaction, the next phase is **Inquiry**, whose objective is privilege escalation and verification escalation, testing whether the measured exposure can be turned into unauthorised access.

## Task 3: OWASP WSTG

The Web Security Testing Guide organises its test cases by identifier. Input-validation cases carry the **WSTG-INPV** prefix, which is what you grep the guide for when hunting injection and validation bugs.

WSTG also aligns testing across five phases of the SDLC. The phase question is the one that caught me, and I want to be straight about it. A team that has "just finished coding a new feature and wants to check it against WSTG before deployment" maps to **3** (During development), where code is vetted through walkthroughs and reviews. I tried 4 (During deployment) first, reasoning from "before deployment", and 5 (During maintenance) second, reasoning from "new feature", before the room accepted 3. The lesson: "finished coding" is the operative phrase, and code review sits inside development, not at the deployment gate.

## Task 4: NIST SP 800-115

NIST's Technical Guide to Information Security Testing groups its Execution phase into technique categories. When a scanner has flagged 15 potential issues and you have not yet exploited anything, the category you are in is **Target Vulnerability Validation**, which confirms that scanner findings are real before any exploitation is attempted. That validation step is the difference between a report full of scanner noise and one full of proven findings.

## Task 5: PTES

The Penetration Testing Execution Standard defines scope, rules of engagement and legal authorisation in phase **1**, Pre-engagement Interactions. Everything technical comes after the paperwork, which is the entire point of numbering it first.

{{< ad >}}

## Task 6: ISSAF

The Information Systems Security Assessment Framework models an engagement as nine steps that mirror an attacker's progression: information gathering, network mapping, vulnerability identification, penetration, gaining access and privilege escalation, enumerating further, lateral movement, maintaining access, and finally **Covering tracks**. The ninth step demonstrates how an adversary would erase evidence, which for a tester means documenting the logging gaps rather than actually wiping anything.

## Task 7: MITRE ATT&CK

The matrix everyone eventually learns to read. Its columns represent **Tactics** (the adversary's goals, the "why"), and the rows within each column represent **Techniques** (the "how"). For a web server compromised through an unpatched public-facing application, the technique ID is **T1190**, Exploit Public-Facing Application, one of the most common initial-access entries in the whole matrix.

## Task 8: Other notable frameworks

Three scenarios, three frameworks, and the answer masks were essential for getting the exact names right:

- A European retailer processing credit card payments is governed by the **PCI DSS Penetration Testing Guidelines**, defined in Requirement 11.4 of PCI DSS v4.0.
- An iOS banking app, assessed for how it stores credentials and talks to backend APIs, calls for the **OWASP Mobile Application Security Testing Guide** (MASTG), the how-to-test companion to the MASVS requirements standard.
- An AWS controls assessment (a configuration review, explicitly not a penetration test) is most relevant to the **CSA Cloud Control Matrix**, a governance and compliance controls framework from the Cloud Security Alliance.

That last answer is worth a note: the room's prose writes "Cloud Controls Matrix" (plural), but the accepted answer field is singular "Control", which the character mask (3, 5, 7, 6) revealed before I submitted. When the prose and the answer box disagree, the mask is the one being graded.

## Task 9: Choosing the right framework

The synthesis task. A U.S. federal agency needing an assessment aligned to federal guidelines wants **NIST SP 800-115**. An e-commerce company with a web storefront, a mobile app and a payment system needs a combination: **WSTG,MASTG,PCI DSS**, one framework per component, web to WSTG, mobile to MASTG, payments to PCI DSS. Real engagements are rarely one framework; they are a stack chosen to cover every channel in scope.

## Task 10: The flag

The final task links a static site to explore. Unlike the previous rooms in this module, whose activities were JavaScript SPAs with the flag base64-encoded in the bundle, this one is served from `static-labs.tryhackme.cloud/sites/`, plain HTML, and the flag sits in a `thm-flag` div in the page's debrief section. A single curl and grep reads it without clicking through:

![Terminal showing a curl of the pentesting-frameworks static site piped to grep, extracting the flag THM{pen-test-fr4m3work5} from the thm-flag div](/img/thm-ptframeworks/01-flag.png)

```bash
B=https://static-labs.tryhackme.cloud/sites/jr-pentester-pentesting-frameworks
curl -s "$B/" | grep -oE 'id=.thm-flag.>THM\{[^}]*\}' | grep -oE 'THM\{[^}]*\}'
  # THM{pen-test-fr4m3work5}
```

The flag is **THM{pen-test-fr4m3work5}**. Note the `/sites/` path rather than `/apps/`: this activity is not a compiled SPA but a hand-written HTML page, so there is no base64 to decode, the flag is right there in the markup once you view source.

## Two things worth keeping

**Match the framework to the engagement, not the other way round.** The whole room is one exercise in that judgement: OSSTMM for a metrics-driven multi-channel assessment, WSTG for a web app, MASTG for mobile, NIST 800-115 for a US federal client, PCI DSS for anything touching card payments, ATT&CK as the shared language for describing what an adversary did. A tester who only knows one methodology will try to force every job into it. Knowing the map lets you pick the route.

**When the prose and the answer box disagree, trust the mask.** Two answers here hinged on it: the SDLC phase number was 3 despite "before deployment" pointing at 4, and the cloud framework was singular "Control" despite the prose writing "Controls". The underscore mask encodes exactly what the grader will accept, character for character, so counting it against a candidate is faster and more reliable than reasoning about what the answer "should" be. It does not resolve genuine ambiguity of meaning, as the phase question showed, but it settles format and spelling for free.

Room solved 100%: 10 tasks, 19 answers.
