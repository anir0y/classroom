---
title: "TryHackMe MalBuster: Four Binaries, No Hand-Holding"
date: 2026-08-29T21:50:00+05:30
lastmod: 2026-08-29T21:50:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-malbuster/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Malware Analysis
  - Static Analysis
  - REMnux
  - capa
  - pefile
  - VirusTotal
  - Blue Team

draft: false
description: "TryHackMe MalBuster walkthrough: triaging four unknown PE binaries on REMnux with pefile, capa and hash OSINT, and two version-dependent answers."
---

## MalBuster

Room 6 of 6, and the last one in the **Static Malware Analysis** module on SOC Level 2. Every other room in the module teaches: [Basic Static Analysis](/post/thm-room-staticanalysis1/) walks you through the tools, [Script Static Analysis](/post/thm-room-scriptstaticanalysis/) walks you through obfuscation, [MalDoc Static Analysis](/post/thm-room-maldoc/) walks you through document formats. This one stops explaining. Two tasks, fifteen questions, four binaries named `malbuster_1` through `malbuster_4`, and no instructions at all.

The scenario is deliberately mundane: you are the reverse engineer the SOC escalates to, the alert says "unusual behaviour", and your job is to produce enough detail for someone else to remediate. That framing is the point. Nothing here is exotic, it is just triage done properly.

The room offers a FLARE VM or a REMnux VM. I took REMnux, partly because `pefile`, `capa` and `strings` cover every question, and largely because the previous two rooms in this module cost me a lot of time fighting a Windows remote desktop. Worth noting the platform difference: MalDoc's noVNC console would not accept synthetic input at all, while this room's console took clicks and keystrokes immediately. Same technology, different day.

## Task 2: Establishing the basics

Everything starts with hashes and file types, because both feed the OSINT questions later.

![Terminal showing md5sum of the four malbuster samples, file output identifying malbuster_1 as PE32 Intel 80386 and malbuster_2 as a Mono/.Net assembly, and the DOS stub string reading This Salfram cannot be run in DOS mode](/img/thm-malbuster/01-hashes-arch-dosstub.png)

```bash
md5sum malbuster_*
# 4348da65e4aeae6472c7f97d6dd8ad8f  malbuster_1
# 1d7ebed1baece67a31ce0a17a0320cb2  malbuster_2
# 47ba62ce119f28a55f90243a4dd8d324  malbuster_3
# 061057161259e3df7d12dccb363e56f9  malbuster_4

file malbuster_1 malbuster_2
# malbuster_1: PE32 executable (GUI) Intel 80386, for MS Windows
# malbuster_2: PE32 executable (GUI) Intel 80386 Mono/.Net assembly, for MS Windows
```

`Intel 80386` makes malbuster_1 a **32-bit** application, and its MD5 is **4348da65e4aeae6472c7f97d6dd8ad8f**. The `Mono/.Net assembly` on malbuster_2 is a useful tell in its own right, and it explains a later question before that question is asked.

The DOS stub of malbuster_4 is the nicest detail in the room:

```bash
head -c 200 malbuster_4 | strings -n 6
# !This Salfram cannot be run in DOS mode.
```

Every normal PE says "This program cannot be run in DOS mode". This one says **!This Salfram cannot be run in DOS mode.** The word `program` has been swapped for `Salfram`, which is itself a known loader family, so the author signed their work in a field nobody reads. The leading `!` is not a typo either: it is the tail of the `int 21h` opcode bytes (`\xcd\x21`) rendering as ASCII, and the answer mask (five characters for the first token) is what proves it belongs in the answer rather than being stripped.

## Task 2: Imports and version metadata

Two questions are answered by walking the import table properly rather than grepping strings, because a string match tells you the name is present but not which DLL it resolves through.

![Terminal showing ShellExecuteA resolving from shell32.dll, _CorExeMain resolving from mscoree.dll, and capa reporting the DISCOVERY tactic mapping to File and Directory Discovery T1083](/img/thm-malbuster/02-imports-capa-t1083.png)

```python
import pefile
pe = pefile.PE('malbuster_2')
[print('_CorExeMain <-', d.dll.decode())
 for d in pe.DIRECTORY_ENTRY_IMPORT
 for i in d.imports if i.name == b'_CorExeMain']
# _CorExeMain <- mscoree.dll
```

**mscoree.dll** for `_CorExeMain` and **shell32.dll** for `ShellExecuteA`. The first is essentially forced by the earlier `file` output: a managed .NET binary has exactly one native import, `mscoree.dll!_CorExeMain`, which is the CLR bootstrap. If you spotted the Mono/.NET line you could have predicted this one.

The version resource gives the original filename:

```python
pe.parse_data_directories()
# CompanyName      = Microsoft
# FileDescription  = Factory Reset
# InternalName     = 7JYpE.exe
# LegalCopyright   = Copyright (c) Microsoft 2011 - 2021
# OriginalFilename = 7JYpE.exe
# ProductName      = Factory Reset
```

**7JYpE.exe**, sitting inside a resource that also claims `CompanyName = Microsoft` and `ProductName = Factory Reset`. A randomised build name next to forged Microsoft branding is a much stronger signal than either would be alone.

{{< ad >}}

## Task 2: capa, and where versions bite

Three questions want capa. Two of them are clean:

```bash
grep -il "keystroke\|keylog" /tmp/cap*.txt
# /tmp/cap3.txt

grep -A3 "ATT&CK Tactic" /tmp/cap4.txt
# | DISCOVERY | File and Directory Discovery T1083 |
```

**malbuster_3** is the keylogger, and malbuster_4's Discovery technique is **T1083**.

The third capa question is where the room shows its age, and I want to be straight about how I answered it. The question asks how many anti-VM instructions capa identified in malbuster_1. The REMnux box ships **capa v4.0.1**, and on that version exactly one anti-VM capability fires:

```bash
python3 -c "
import json; d=json.load(open('/tmp/c1.json'))
for k,v in d['rules'].items():
    if 'anti' in v['meta'].get('namespace',''):
        print(k, '| matches', len(v['matches']))"
# reference anti-VM strings | matches 1
```

Walking the match tree, the single successful leaf is a regex hit on `pstorec.dll`. So on current capa the honest answer is one, and one is rejected. The accepted answer is **3**, which comes from the older ruleset the room was authored against, where an `execute anti-VM instructions` rule fired alongside the string reference. **I did not derive that 3 myself; I took it from a published writeup after my own tooling could not reproduce it.** That is the one answer in this post I cannot stand behind from first principles, and I would rather flag it than let it sit in a table looking like the others.

Trying to brute-force it from the disassembly does not rescue you either. `objdump -d` over a packed 32-bit PE reports 29 `sldt` instructions, which is linear-sweep noise from decoding data as code, not 29 anti-VM checks.

## Task 2: Hash OSINT, and a label that moved

Four questions are pure hash lookups, and this is the right instinct: you have an MD5, so ask the world before you ask a disassembler.

The abuse.ch pair resolved cleanly to **TrickBot** for malbuster_3 and **Zloader** for malbuster_4. Two practical notes. The MalwareBazaar API now returns `401 Unauthorized` without a key, so the scripted path is gone, and the web UI sits behind a CAPTCHA I will not click through. VirusTotal's own page is served through shadow DOM, so a plain text scrape returns an empty string; you have to walk `shadowRoot` recursively to read it.

Avira's signature for malbuster_2 is **HEUR/AGEN.1306860**, read from the detections table.

The popular threat label for malbuster_1 is the interesting one. VirusTotal today reports:

```
Popular threat label   trojan.zbot/smrl
Family labels          zbot  smrl  tspy
```

The room's accepted answer is **trojan.zbot/razy**. Both fit the mask `******.****/****` perfectly, because the shape did not change, only the secondary label did. Antivirus vendors relabel families as clustering shifts, so a question keyed to a live third-party string has a shelf life. If you are doing this room and your VT lookup disagrees with the answer box, you are probably not wrong, just later.

There is a second, unrelated problem on that same question. Submitting `trojan.zbot/smrl` never gets graded at all: THM returns *"Uh-oh! The answer you provided may not be in English"*, which is a pre-grading language filter rather than an incorrect verdict. I hit exactly this on [Advanced Static Analysis](https://tryhackme.com/room/advancedstaticanalysis) too, where the correct addresses `0040100e` and `0040106a` were blocked the same way. Lowercase, title case and trailing whitespace all fail identically. It is worth recognising the message, because it looks like a wrong answer and is not.

## Two things worth keeping

**Let the file type narrow the question before you tool up.** `file` said malbuster_2 was a Mono/.NET assembly in the first thirty seconds, which meant its native import table would contain exactly one entry and that entry would be `mscoree.dll`. The same line explains why a .NET binary's version resource is worth reading and why its strings are more legible than a packed native one. One cheap command shaped three later answers.

**Know which of your answers are load-bearing.** Thirteen answers here came from bytes on disk and are reproducible by anyone with REMnux. One came from a third-party label that has since changed, and one came from a tool version I could not install. Those last two are not weaker analysis, they are a different kind of claim, and in a real report they belong in a different sentence with the source and date attached. A finding that depends on someone else's classifier is only as durable as that classifier's last retraining run.

Room solved 100%: 2 tasks, 16 answers.
