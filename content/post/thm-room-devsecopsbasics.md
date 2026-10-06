---
title: "TryHackMe DevSecOps Basics: Shifting Security Left"
date: 2026-10-06T14:16:00+05:30
lastmod: 2026-10-06T14:16:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-devsecops/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Jr Penetration Tester
  - Specialized Domains
  - DevSecOps
  - DevOps
  - Shift Left
  - CI/CD
  - Infrastructure as Code
  - Agile
  - Secure SDLC
  - Security Culture

draft: false
description: "Walkthrough of TryHackMe DevSecOps Basics: the story from Waterfall to Agile to DevOps, shifting security left, DevSecOps culture, and the Fuel Trouble flag."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|DevSecOps Basics |![DevSecOps Basics room icon](https://cdn-images.tryhackme.com/room-icons/6228f0d4ca8e57005149c3e3-1779362633141)|

DevSecOps Basics sits in the Specialized Domains module of the Jr Penetration Tester path, and it is the room [The Blue Team Perspective](/post/thm-room-blueteamperspective/) points you at next when it talks about shifting from reactive defense to proactive security. It is a theory room, no VM, no shell, just the story of how software development evolved and where security fits into it. Every answer comes straight out of the task text, but the input masks make the exact wording matter, so this walkthrough is as much about reading the mask as knowing the concept. If you want the hands-on counterpart in the same module, see the [Cloud Security Fundamentals](/post/thm-room-cloudsecurityfundamentals/) and [Mobile Application Security](/post/thm-room-mobilesecurity/) writeups.

## Task 1: Introduction

No answer here. The room sets up its scope: the history of software development practices and how they shaped the security industry. It also notes this is the first room in a new DevSecOps learning path. Click Complete and move on.

## Task 2: DevOps, A New Era

The history lesson. Project management in the 1970s ran on the **Waterfall** model, a rigid hierarchy where sysadmins, developers, and QA each owned one stage and threw work over the wall to the next. That answers the third question: the traditional approach that led to mistrust and poor communication between teams is **Waterfall** (the hint, "don't go chasing waterfalls," gives it away).

The reaction to Waterfall was the Agile Manifesto, which values individuals and interactions, working software, customer collaboration, and responding to change. The methodology that relies on self-organising teams focused on constructive collaboration is **Agile** (and yes, it rhymes with the hint's "grandchild").

The methodology that relies on automation and integration to drive cultural change and unite teams is **DevOps**. The room is specific about what DevOps emphasises: "DevOps builds a philosophy that emphasises building trust and better liaising between developers and other teams." So "What does DevOps emphasize?" is **building trust**. Worth noting the mask here is 8 then 5 characters, which rules out the tempting "cultural change" (change is six letters) and points straight at building trust.

## Task 3: The Infinite Loop

This task walks the DevOps lifecycle. Three terms, three masks.

The practice that adds testing in an automated manner and deals with the frequent merging of small code changes is **CI/CD** (Continuous Integration and Continuous Deployment). The mask is two characters, slash, two characters, so the short form `CI/CD` is what the room wants, not the spelled-out phrase.

The process focused on collecting data to analyse the performance and stability of services is **Monitoring**.

The way to provision infrastructure through reusable and consistent pieces of code is **IaC** (Infrastructure as Code). The mask is three characters, so the acronym `IaC` is the accepted answer, not "Infrastructure as Code".

## Task 4: Shifting Left

The security pivot. The term for accounting for security from the earliest stages of the development lifecycle is **Shift Left**. The mask is 5 then 4 characters, so it is "Shift Left", not "Shifting Left" (even though the room's prose calls the concept "Shifting Left"). The hint jokingly says "shift right," which is the opposite of what you want.

The development approach where security is introduced from the early stages through to the final stages is **DevSecOps**.

{{< ad >}}

## Task 5: DevSecOps, Security Shifts Left

This task names three challenges that get in the way of DevSecOps.

The challenge that leads to a siloed culture is **Security Silos**: leaving security teams out of DevOps and treating security as a separate specialist function that does not scale.

The challenge that comes from not prioritizing the right risks at the right times is **Lack of Visibility**. The mask is 4, 2, 10 characters ("Lack of Visibility"), so even though the room's heading reads "Lack of Visibility and Prioritisation," only the first three words fit the answer box.

The challenge that stems from needlessly overcomplicated security processes is **Stringent Processes**: forcing every new tool or experiment through heavy compliance checks before developers can use it.

## Task 6: DevSecOps Culture

The flip side of Task 5: how to actually instil security in the development process.

To make security scalable so it is not left behind during hypergrowth or in a large corporation, you **Promote autonomy of teams**. Automate security checks until they are just another test in the pipeline, and give engineers the knowledge to make secure decisions on their own.

To support teams in understanding risk and educating them on security flaws, you rely on **Visibility and Transparency**: dashboards that rank flaws by criticality, and alerts that point at the exact line of code and include remediation steps.

The key factor to successfully instil security while accounting for flexibility is **Understanding and empathy**: building processes around how teams actually work, finding common ground, and earning their buy-in.

## Task 7: Exercise, Fuel Trouble

The capstone is a static-site comic ("TryHackMe Comics") where SEC3PO and crew pick a planet to mine, and you identify the software development model behind each of three snippets. Click View Site to read them.

- Comic 1: the team sticks to the trajectory decided at the start even though only "some" tests passed. That is **Waterfall**.
- Comic 2: the team can change course, but tests are missing and the chosen planet still was not the best option. That is **Agile**.
- Comic 3: the team addresses issues from the start, runs better tests, and finds the least risky planet. That is **DevOps**.

Click Next through all three comics (there is a short countdown on each) and the flag appears.

![TryHackMe Comics comic 3 panel with the unlocked flag THM{ONE_TWO_THREE} shown above it](/img/thm-devsecops/02-comic-flag.png)

The flag is **THM{ONE_TWO_THREE}**, which matches the room's own hint, "the 1 2 3."

![DevSecOps Basics room with all seven tasks marked complete and Room completed 100 percent](/img/thm-devsecops/03-room-complete.png)

## Takeaways

Two things worth carrying out of a theory room:

- **Read the mask, not just the concept.** Three answers here (CI/CD not Continuous Integration, IaC not Infrastructure as Code, Shift Left not Shifting Left) are "correct" in meaning but wrong in the box until you match the underscore count. On TryHackMe the input mask is the real spec, so decode it before you submit and save yourself the retries.
- **Shifting left is a culture problem before it is a tooling problem.** The challenges (security silos, lack of visibility, stringent processes) and their fixes (team autonomy, visibility and transparency, understanding and empathy) are about trust and workflow, not scanners. For an attacker, that is useful context: the gaps you find in a real pipeline usually trace back to a team that was treated as a blocker rather than a partner.

Room solved 100%: 7 tasks, 19 answers.
