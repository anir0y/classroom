---
title: "TryHackMe Planning and Scoping: Scope, RoE, Compliance"
date: 2026-10-10T14:55:00+05:30
lastmod: 2026-10-10T14:55:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-pas/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Jr Penetration Tester
  - Pentesting Methodologies and Reporting
  - Penetration Testing
  - PTES
  - Scope
  - Rules of Engagement
  - PCI DSS
  - GDPR
  - Pentest Planning

draft: false
description: "Walkthrough of TryHackMe Planning and Scoping: PTES, known and unknown environments, allowlist scope, Rules of Engagement, PCI DSS, GDPR, and BrightCart flag."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Planning and Scoping |![Planning and Scoping room icon](https://cdn-images.tryhackme.com/room-icons/5f04259cf9bf5b57aed2c476-1779119215235)|

Planning and Scoping is the second room in the Pentesting Methodologies and Reporting module of the Jr Penetration Tester path, and it picks up right where [Threat Modeling for Pentesters](/post/thm-room-threatmodelingforpentesters/) left off. Threat modeling tells you what to test and in what order. This room covers the paperwork and boundaries that make that test legal: the penetration testing lifecycle, scope, Rules of Engagement, and the regulations that mandate or shape the work. It also ties back to the [Cyber Kill Chain](/post/thm-room-cyberkillchain/) framing of how an engagement progresses.

This is a reading room with no VM. Eight content tasks follow a fictional client, BrightCart, from engagement kickoff to a drafted plan, and Task 8 is a guided static-site capstone that ends in a flag. Every answer comes from the task text, so the only friction is the answer mask deciding exact wording. One mask caught me out, and I have kept that note in.

## Task 1: Introduction

The scenario: BrightCart suffered a breach and the board wants proof their defenses work. The task frames a pentest as verifying the lock by trying to pick it. The question asks for the keyword that separates a penetration test from a criminal cyber attack.

The prose bolds the word "authorized", but the answer field mask is 13 characters, which rules that out. The accepted answer is **authorization**. This is a good reminder that the mask, not the bolded word in the body, is the real spec.

## Task 2: What is Penetration Testing?

This task introduces the Penetration Testing Execution Standard (PTES). The first question asks how many phases it defines.

PTES has **7** phases, from Pre-engagement Interactions through Reporting. The second question describes an assessment that relies on automated scanning and produces a categorized list of known weaknesses.

That is a **vulnerability assessment**, broad but shallow, where automation does most of the work. The third question asks which PTES phase defines scope, rules, and legal agreements before any testing.

That is **Pre-engagement Interactions**, the first phase and the subject of this entire room.

## Task 3: Types and Approaches

The task splits engagements by what you test (the type) and how much you know going in (the approach). It also notes the industry is shifting from color-based "box" labels to knowledge-based "environment" labels. The first question gives a tester only a company name and an IP range, no documentation.

That is an **Unknown environment** (the older term is black-box). The second question asks whether an organization wanting to know if a breached-perimeter attacker could reach the database should request an internal or external test.

Starting from inside the perimeter makes this an **internal** test.

## Task 4: Defining the Scope

Scope defines the boundaries of the engagement. The first question asks for the term for the list of systems and assets the tester is authorized to test.

The task calls this the **allowlist** (the in-scope targets), as opposed to the blocklist of off-limits assets. The second question describes a test that covered only the customer portal and excluded the payment API and cloud infrastructure.

Excluding critical systems that should have been tested makes this an **overly narrow** scope, which leaves dangerous blind spots.

## Task 5: Pre-Engagement and Legal Foundations

This task covers the legal documents and the cloud-provider rules of the road. The first question asks for the abbreviation of the document that protects confidential information shared between client and tester.

That is the **NDA** (Non-Disclosure Agreement). The second question is a judgment call: a client asks the tester to run a DoS test against their AWS EC2 instances. Should the tester proceed?

The task spells out that AWS, Azure, and GCP all strictly prohibit Denial-of-Service testing, so the answer is **Nay**. A client request does not override the cloud provider's acceptable use policy.

## Task 6: Rules of Engagement

The Rules of Engagement (RoE) document pins down the operational boundaries. The first question asks for the term for the defined process of reporting critical incidents or findings during the engagement.

That is **Escalation Procedures**. The task describes three tiers: Informational, Urgent, and Critical. The second question asks which tier an unauthenticated API actively exposing customer credit card numbers falls under.

Active data exposure is immediate risk, so that is **Critical**. The third question asks for the encryption standard the RoE names for evidence at rest.

The data-handling row specifies **AES-256**.

{{< ad >}}

## Task 7: Regulatory Compliance

This task maps the frameworks that mandate or recommend testing. The first question asks which PCI DSS requirement specifically addresses penetration testing.

The compliance table lists PCI DSS v4.0.1 against **Requirement 11.4**. Note the version matters here: older PCI DSS references put penetration testing under 11.3, but v4.0.1 moved it to 11.4, and the mask (ending in `11.4`) confirms it. The second question asks what role a tester assumes under GDPR when they access personal data belonging to EU individuals.

Accessing personal data makes the tester a **data processor**, which triggers obligations like a Data Processing Agreement and data minimization.

## Task 8: Putting It All Together, and the Flag

The capstone is a static site, the BrightCart Engagement Console. It walks through the engagement from a client email (from Sarah) into a testing approach, a scope document, a legal-document checklist, an RoE framework, and compliance mapping, across four stations: Attack Surface, Scope Sort, Escalation Triage, and Consultant's Reply.

![BrightCart engagement briefing with the PTES lifecycle and the Coalfire case file](/img/thm-pas/02-briefing-overview.png)

The four recall questions pull answers from that walkthrough. BrightCart offering to share network diagrams, architecture docs, and test accounts describes a **Known environment** (full knowledge, the white-box equivalent). The document BrightCart's legal team requires before sharing any technical documentation is the **NDA**. The test that begins from inside BrightCart's network to see if an attacker could reach the payment database is an **internal penetration test**.

The flag comes from completing the static site. Rather than click through all four stations, I pulled it from the site's own JavaScript. The summary bundle decodes a base64 string at runtime into the flag element, so fetching `summary.js` and decoding its base64 token recovers the flag directly.

```text
  # summary.js builds the flag from a base64 token decoded at runtime
  atob(<token>)  =>  THM{PL4nning_scopiNG}
```

The flag is **`THM{PL4nning_scopiNG}`**.

## Task 9: Conclusion

The closing task recaps the module and points to the next room, Writing Pentest Reports, where the planning work finally produces a deliverable. No answer is needed, so the task is marked complete.

## Takeaways

Two things worth carrying out of this room:

- **The mask is the spec, not the bold word in the body.** Task 1 bolds "authorized" in the prose, but the answer field wanted "authorization". When the highlighted term does not fit the underscore count, trust the mask and read for the noun form or the exact phrase the field expects.
- **Authorization and provider policy are hard limits, not client preferences.** A client can ask for a DoS test against their own cloud instances, but AWS, Azure, and GCP forbid it, so the answer is still no. The written scope, the RoE, and the provider's acceptable use policy together define what is legal, and a verbal client request does not expand them.

Room solved 100%: 9 tasks, 19 answers.
