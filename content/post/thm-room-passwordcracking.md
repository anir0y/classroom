---
title: "TryHackMe Password Cracking: Hashcat, John, and rockyou"
date: 2026-09-14T23:30:00+05:30
lastmod: 2026-09-14T23:30:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-pcrack/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Password Attacks
  - Jr Penetration Tester
  - password cracking
  - Hashcat
  - John the Ripper
  - hashes
  - rockyou

draft: false
description: "TryHackMe Password Cracking walkthrough: identify MD5, SHA-256, NTLM, and bcrypt hashes, then crack all four with Hashcat, John, and rockyou.txt."
---

Building a wordlist is only half the job. The other half is turning a hash back into the password that made it, and that starts with knowing which algorithm you are looking at. TryHackMe's **Password Cracking** room is the next step in the **Password Attacks** module of the Jr Penetration Tester path, and it lists the [Introduction to Wordlists room](/post/thm-room-introductiontowordlists/) as a direct prerequisite: that room built the lists, this one uses them against real hashes. It also pairs naturally with the module's [Phishing Basics room](/post/thm-room-phishingbasics/), which harvests the credentials in the first place.

This is a hands-on room. Four tasks of theory set up the last one, the Practical, where you identify and crack four hashes. I solved it from my Mac with hashcat (which handles every mode the room covers) and rockyou.txt, downloading the task files directly rather than booting the AttackBox.

## Task 1: Introduction

The opener frames password cracking as recovering plaintext from a leaked database, a captured handshake, or a hash pulled off a compromised machine. There is nothing to submit, so the answer is the built-in **No answer needed** for the readiness prompt.

## Task 2: How Passwords Are Stored

Passwords are not stored in plaintext; they are stored as hashes. This task covers the three properties that make that work, and asks about each.

A hash function is **one-way**: there is no way to reverse a hash back to the original input, which is why cracking means guessing candidates and hashing them until one matches. A **salt** is the unique random string added to a password before hashing, so two identical passwords produce different hashes and precomputed rainbow tables become useless. And **bcrypt** is the algorithm designed specifically for passwords and deliberately made slow, so that each guess costs an attacker real time. The Aptoide breach example in the task drives the point home: SHA-1 without salt let a single GPU test over 10 billion candidates per second.

## Task 3: Identifying Hash Types

Supplying the wrong mode to a cracking tool produces no results no matter how long it runs, so identification comes first. The fastest tell is length and format. An **SHA-256** hash is **64** hex characters. The task's reference table pairs each algorithm with its cracking parameters, and the John the Ripper format for an SHA-256 hash is **raw-sha256**.

For unknown hashes the room introduces `hashid`, which lists candidate algorithms for a given string. A 32-character hex string is ambiguous (it could be MD5, NTLM, and others), so you cross-reference with context and try the likely candidates in order.

## Task 4: Wordlists and Attack Strategies

Choosing the wrong strategy wastes time without results. The task walks through four:

- **Dictionary attack**: test a pre-built list one entry at a time. It is the fastest first step and should always be the starting point. The standard list is `rockyou.txt`, pre-installed on the AttackBox at **/usr/share/wordlists/rockyou.txt**.
- **Brute force**: generate every combination up to a length. Guaranteed to work eventually, but the search space explodes past 6 to 7 characters.
- **Rule-based attack**: apply transformations such as capitalisation and number suffixes to an existing wordlist. That is the answer to the transformation question: a **rule-based** attack, driven by rule files like `best64.rule`.
- **Mask attack**: a structured brute force against a known pattern. For a policy requiring a capital letter, six lowercase letters, and two digits, the best-suited attack is a **mask** attack, because the exact structure is known.

{{< ad >}}

## Task 5: Cracking with John the Ripper and Hashcat

This task compares the two tools. For a large set of SHA-256 hashes that need to fall as quickly as possible, **Hashcat** is the better choice because it uses the GPU. Hashcat's attack modes are numbered, and the mask attack mode is **3** (`-a 3`). John the Ripper is easier for quick jobs and odd formats; its **--show** flag displays previously cracked passwords straight from the potfile without re-running the attack.

## Task 6: Practical

Time to crack. The four hash files are pre-loaded on the AttackBox at `/root/Rooms/PasswordCracking/`, or downloadable as a zip. I pulled the zip and worked locally. Identifying each by length and prefix:

```text
# the four hashes and their algorithms
hash1.txt  e10adc3949ba59abbe56e057f20f883e                                  MD5      (32 hex)
hash2.txt  5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8  SHA-256  (64 hex)
hash3.txt  8846f7eaee8fb117ad06bdd830b7586c                                  NTLM     (32 hex)
hash4.txt  $2b$05$9I7YCSrgm6aLO7J5YPC9x.Kp08LQ7cSJTmkALhFTgm5UMFAwBr5.e       bcrypt
```

![The four hash files with their identified algorithms: MD5, SHA-256, NTLM, and bcrypt](/img/thm-pcrack/01-hash-identify.png)

hash3 is worth a note: it is 32 hex characters like MD5, but it is the exact NTLM example from the Task 3 table. The algorithm produced by hash1 is therefore **MD5**, and the Hashcat mode for the SHA-256 hash in hash2 is **1400**.

Now the dictionary attack. MD5, SHA-256, and NTLM are fast, so all three fall against rockyou almost instantly:

```bash
hashcat -m 0    -a 0 hash1.txt rockyou.txt   # MD5
hashcat -m 1400 -a 0 hash2.txt rockyou.txt   # SHA-256
hashcat -m 1000 -a 0 hash3.txt rockyou.txt   # NTLM
```

![Hashcat cracking the MD5, SHA-256, and NTLM hashes: 123456 and password](/img/thm-pcrack/02-crack-md5-sha256-ntlm.png)

The plaintext for hash1 is **123456**. hash2 (SHA-256) and hash3 (NTLM) crack to the same word despite being different algorithms, which is the lesson the room is making: the outputs look nothing alike, but the plaintext is identical. That shared plaintext is **password**.

Hash 4 is bcrypt, and bcrypt is deliberately expensive, so it takes longer even for a common password. Mode 3200 with rockyou still finds it in seconds on modern hardware:

```bash
hashcat -m 3200 -a 0 hash4.txt rockyou.txt   # bcrypt
```

![Hashcat cracking the bcrypt hash to hayden07 after 19 seconds](/img/thm-pcrack/03-crack-bcrypt.png)

The plaintext for hash4 is **hayden07**. All four cracked, using nothing but the right mode and rockyou.

## Task 7: Conclusion

The final task recaps the workflow: identify the algorithm from its characteristics, pick the matching Hashcat mode or John format, and run a dictionary attack first, escalating to rules or masks only if it fails. It is a **No answer needed** acknowledgement, and it closes the room.

![Password Cracking completed 100 percent with all seven tasks green](/img/thm-pcrack/04-room-complete.png)

## Two takeaways

**Identification is the whole game.** hash2 and hash3 share the plaintext "password", but one is SHA-256 (mode 1400) and the other NTLM (mode 1000). Point the wrong mode at either and it will never crack, no matter how good your wordlist is. Length and prefix get you most of the way (64 hex is SHA-256, `$2b$` is bcrypt), and `hashid` resolves the ambiguous 32-hex cases.

**Slow-by-design hashing is doing its job even when it loses.** bcrypt still cracked to a common rockyou password, but it took real seconds where MD5 and NTLM took milliseconds. Scale that cost factor across a whole leaked database and a weak-but-slow-hashed password buys defenders time that a fast unsalted hash never would. The algorithm matters as much as the password.

Room solved 100%: 7 tasks, 18 answers.
