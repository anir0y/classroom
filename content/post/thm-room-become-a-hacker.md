---
title: "TryHackMe Become a Hacker: Gobuster and a Hydra Login Attack"
date: 2026-08-10T02:30:00+05:30
lastmod: 2026-08-10T02:55:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-hacker/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Pre Security
  - Offensive Security
  - Gobuster
  - Hydra
  - Enumeration

draft: false
description: "Walkthrough of TryHackMe Become a Hacker: enumerate a web app to find a hidden login, then chain it with a Hydra dictionary attack to log in and grab the flag."
---

## Become a Hacker

This is the room where the Pre Security path finally lets you attack something. Everything before it built the foundation, computers, networks, the web, cryptography, and now you turn that knowledge around and look at a system the way an attacker does. The framing matters: here "hacking" means penetration testing, which is legal, authorised, and scoped. The whole exercise is a permission-based assessment of one fictional shop, and the goal is to find the weaknesses before a real attacker does.

![The Become a Hacker room on TryHackMe marked Room completed 100 percent, all four tasks green](/img/thm-hacker/01-room.png)

The room hands you a split screen: a simulated browser pointed at `http://www.onlineshop.thm/` and a terminal with security tools. Mike is about to launch the shop and wants reassurance that no sensitive pages are exposed. That is the job.

## Task 2: finding weaknesses

First, the vocabulary you will reuse forever: a **vulnerability** is a flaw, an **exploit** is the technique that abuses it, **scope** is what you are allowed to touch, and every one of these is bound by the single rule of **permission**. A penetration test is exactly this done legally, within scope.

The practical half is enumeration, which just means methodically discovering what exists. The room asks you to test a handful of URLs by hand: append `/sitemap`, `/mail`, `/register`, `/admin`, `/login` to the site and watch the response codes. A `404` means the page does not exist; a `200` means it does. Most return 404, but one does not.

![Terminal card showing manual page testing where most paths 404 but /login returns 200, plus a gobuster scan finding /login Status 200](/img/thm-hacker/02-recon.png)

The hidden page is **`/login`**, and it returns status **`200`**. Testing five URLs by hand is fine, but real targets have thousands of possible paths, so the room introduces **Gobuster** to automate exactly this: point it at the site with a wordlist and it brute-forces directory and file names for you, reporting `/login (Status: 200)` in one pass. Those are the two Task 2 answers: the hidden page is `/login`, discovered with status code `200`.

## Task 3: exploiting weaknesses

A hidden login page on its own is not a breach. The room's mental model is a line of dominoes: one weakness rarely matters alone, but chained with a second it topples the lot. Here the second domino is a weak password. You have a login page (domino one); if the admin account uses a guessable password (domino two), you are in.

The manual approach is to try `admin` with a short list, `abc123`, `123456`, `password`, `qwerty`, `654321`, and watch which one works. But real testers do not type passwords one at a time, they automate it with a **dictionary attack**. The room uses **Hydra** to hammer the login form with a wordlist:

![Real terminal output of a Hydra dictionary attack against the onlineshop login form, trying passwords for admin and finding admin colon qwerty](/img/thm-hacker/03-hydra.png)

Hydra fires the wordlist at `/login` and reports the hit on the second-to-last line: `[80] host: www.onlineshop.thm login: admin password: qwerty`. The admin password is **`qwerty`**.

{{< ad >}}

Logging in as `admin:qwerty` unlocks the private area and prints the secret, which is the flag **`THM{born_to_hack!}`**.

![Terminal card summarising the chain: hidden login found, Hydra cracks admin qwerty which sits at password list position 19, and logging in reveals the flag THM born to hack](/img/thm-hacker/04-chain.png)

The last question is a subtle one: how many failed attempts happened before Hydra found the password? The terminal only prints a condensed set of `[ATTEMPT]` lines (it skips a few, so counting what you see undershoots). The accepted answer is **`18`**, because `qwerty` sits at position 19 in the wordlist, so eighteen passwords were tried and failed before it landed. That is the answer to read carefully rather than eyeball off the screen.

## Task 4: where this goes

The wrap-up reframes the exercise as a career on-ramp. The skills you just used, enumeration to map a target, a dictionary attack to test credentials, and chaining weaknesses into a real impact, are the daily work of a **penetration tester**, a **vulnerability researcher**, or a **red team operator**. The room points onward to Cyber Security 101, Jr Penetration Tester, and SOC Level 1 depending on whether offence or defence pulls at you.

## Room summary

| | |
|---|---|
| Room | Become a Hacker (Pre Security path, Attacks and Defenses) |
| Category | Offensive Security, Easy |
| Task 2 | hidden page `/login`; status code `200` |
| Task 3 | admin password `qwerty`; secret `THM{born_to_hack!}`; failed attempts `18` |
| Method | enumerate with Gobuster, then a Hydra dictionary attack against the login form |

## Wrap-up

The point of the room is not the flag, it is the reflex. A hacker looks at a shop's front page and asks what else is reachable, then asks whether the thing they found trusts input it should not. Enumeration turns "I wonder what is here" into a list; a dictionary attack turns "I wonder if the password is weak" into an answer; and chaining the two turns two minor findings into full admin access. Do that legally, within scope, and you are doing exactly what an organisation pays a penetration tester to do, breaking in on purpose so nobody else can by accident.
