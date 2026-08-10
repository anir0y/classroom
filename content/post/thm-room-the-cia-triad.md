---
title: "TryHackMe The CIA Triad: Confidentiality, Integrity, Availability"
date: 2026-08-10T00:20:00+05:30
lastmod: 2026-08-10T00:40:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-cia/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Pre Security
  - CIA Triad
  - Fundamentals
  - Blue Team

draft: false
description: "Walkthrough of TryHackMe The CIA Triad: what Confidentiality, Integrity, and Availability protect, every task answer, and the drag-and-drop flag exercise."
---

## The CIA Triad

This is the first room in the Attacks and Defenses module, and it answers a question that sounds obvious until you try to state it precisely: what exactly does cyber security protect? Not "systems" or "networks" in the abstract, but three specific properties of the data itself. Those three properties are Confidentiality, Integrity, and Availability, together the **CIA Triad**, and almost everything you meet later in security is an attack on one of them or a defense of one of them.

![The CIA Triad room on TryHackMe marked Room completed 100 percent, all four tasks green](/img/thm-cia/01-room.png)

The room is four short tasks: the three pillars explained with everyday analogies, a set of recognition questions, a hands-on sorting exercise, and a recap. It is an Easy reading room, but the mental model it installs is one you reuse constantly.

## Task 2: the three pillars

The trick to internalising the triad is to attach each pillar to the single question you ask when an incident happens.

- **Confidentiality** is about access. Can only the right people see the data? It breaks when someone unauthorised reads it: credentials on a sticky note, a document that ends up on the open internet, someone sniffing your login on a coffee-shop network. The defenses are encryption and access control.
- **Integrity** is about modification. Is the data still the trustworthy, unaltered original? It breaks when someone changes it without authorisation: a grade edited before submission, a bank transfer's destination account tampered with in flight, attendance records altered after they were locked.
- **Availability** is about uptime. Is the data or service there when an authorised user needs it? It breaks when access is denied by circumstance or attack: a site knocked offline by a flood of requests, a service downed by a botched update, a bank you cannot reach the day you need your money.

Read the yes/no tables the room gives you through that lens and they answer themselves. That framing makes the five Task 2 questions mechanical:

- Preventing unauthorised **modification** of data is **Integrity**.
- Preventing unauthorised **access** to data is **Confidentiality**.
- Ensuring data is **available when needed** is **Availability**.
- If data becomes **untrustworthy**, the pillar hit is **Integrity** (trust is exactly what integrity guarantees).
- The collective name for all three is the **CIA Triad**.

## Task 3: the security mindset, and a flag to earn

The room's real point is in its third task: the CIA Triad is not a set of definitions to memorise, it is a **security mindset**. When an incident lands, a professional instinctively asks the three questions: was data exposed, was it modified, was it unavailable? Answering those tells you what was actually harmed and how to respond. The room drives this home with an interactive exercise: nine security incidents, and you drag each into the one pillar it damages most.

![The CIA Triad Challenge exercise: three pillar drop zones for Confidentiality, Integrity, and Availability, with a mission to classify nine incidents to reveal the flag](/img/thm-cia/02-exercise.png)

Every incident maps cleanly to a single pillar once you ask "what was harmed": if data was seen, it is Confidentiality; if data was changed, it is Integrity; if a service went dark, it is Availability.

![The nine incidents sorted into their pillars: three confidentiality access breaches, three integrity modifications, three availability outages, revealing the flag THM CIA IS ABOUT BALANCE](/img/thm-cia/03-solution.png)

Sort all nine correctly and the exercise reveals the flag, **`THM{CIA_IS_ABOUT_BALANCE}`**, which is a nice reminder that the three pillars are in tension: lock data down hard enough and you can hurt availability; make it available everywhere and you can hurt confidentiality. Security is the balance. The second Task 3 answer, the kind of mindset the triad represents, is a **security mindset**.

{{< ad >}}

## A security-mindset aside

Here is a small lesson that fits the room's own theme perfectly. The exercise says it reveals the flag only after you sort all nine incidents correctly, but that "reveal on success" logic runs entirely in your browser. The exercise is a static app, and its flag was sitting in the JavaScript bundle the whole time, Base64-encoded (`VEhNe0NJQV9JU19BQk9VVF9CQUxBTkNFfQ==` decodes straight to the flag). That is not a knock on a beginner exercise; it is exactly the kind of observation the CIA Triad trains you to make. A client-side check is a nice UX gate, not a security control, because anything the browser can decode, the user can too. Confidentiality is not achieved by hiding a secret in code you hand to the client. It is the first instinct of the security mindset the room is trying to build, applied to the room itself.

## Room summary

| | |
|---|---|
| Room | The CIA Triad (Pre Security path, Attacks and Defenses) |
| Category | Fundamentals, Easy |
| Task 2 | Integrity; Confidentiality; Availability; Integrity; `CIA Triad` |
| Task 3 | flag `THM{CIA_IS_ABOUT_BALANCE}`; mindset = `security mindset` |
| Pillars | Confidentiality = access, Integrity = modification, Availability = uptime |

## Wrap-up

The CIA Triad is the smallest complete answer to "what are we protecting," and its value is that it turns a vague feeling of "insecure" into a specific diagnosis. Every tool, attack, and control you study later slots under one of these three headings, so the sorting habit you practise here, name the pillar an incident broke, is the same reflex a SOC analyst uses on a real alert. Get comfortable reading any scenario as a hit on Confidentiality, Integrity, or Availability, and you have the scaffold the rest of cyber security hangs on.
