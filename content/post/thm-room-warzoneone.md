---
title: "TryHackMe Warzone 1: MirrorBlast C2 traffic analysis"
date: 2026-11-11T10:24:00+05:30
lastmod: 2026-11-11T10:24:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-warzone1/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 1
  - Brim
  - Wireshark
  - Suricata
  - MirrorBlast
  - TA505
  - PCAP analysis
  - network forensics

draft: false
description: "TryHackMe Warzone 1 walkthrough: triaging a MirrorBlast C2 alert with Brim, Suricata, tshark, VirusTotal OSINT, and MSI payload inspection."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Warzone 1 |![Warzone 1 room icon](https://cdn-images.tryhackme.com/room-icons/3d6033aa286ac42fdb793c605ebbf3f0.png)|

Warzone 1 is a Medium defensive room that puts you in the role of a Tier 1 SOC analyst triaging an IDS alert for "Malware Command and Control Activity Detected." The PCAP contains a full MirrorBlast infection chain: a phishing redirect, two MSI payload downloads, and REBOL-based C2 beaconing to a TA505 domain. This post walks through the full investigation using tshark, Suricata, and VirusTotal. If you are working through SOC Level 1, the [Brim room](/post/thm-room-brim/) covers the tool foundations.

## Task 1: Your shift just started and your first network alert comes in

The VM boots with Zone1.pcap on the desktop alongside Brim, Wireshark, and NetworkMiner. The fastest path is to SSH into the box and analyze locally with tshark and the Brim-bundled Suricata.

### Identifying the alert signature

Running the Brim-bundled Suricata against the PCAP with the updated rule set produces three distinct alert signatures:

```
 28  ET USER_AGENTS Suspicious User-Agent (REBOL)
 27  ET MALWARE MirrorBlast CnC Activity M3
  1  ET MALWARE MirrorBlast CnC Activity M2
```

All 56 alerts fire on traffic from 172.16.1.102 to 169.239.128.11. The dominant malware alert, and the one matching the "Malware Command and Control Activity Detected" category, is **ET MALWARE MirrorBlast CnC Activity M3**.

### Source and destination IPs

The IP conversation stats from tshark confirm the internal host and the C2 server:

```
 172.16.1.102  <->  169.239.128.11    254 frames   23 kB
 172.16.1.102  <->  192.36.27.92      545 frames  591 kB
 172.16.1.102  <->  185.10.68.235     180 frames  198 kB
```

The source (infected host) is **172[.]16[.]1[.]102**. The destination in the C2 alert is **169[.]239[.]128[.]11**.

### VirusTotal OSINT: threat group and malware family

Searching 169.239.128.11 on VirusTotal and checking the Community tab reveals the threat group **TA505**, a financially motivated group that has been active since at least 2014. The malware family is **MirrorBlast**, first observed in late September 2021 by Proofpoint Emerging Threats Labs.

The C2 domain associated with this IP is fidufagios.com. Searching that domain on VirusTotal and checking Relations, the majority file type listed under Communicating Files is **Windows Installer**, consistent with the MSI-based delivery chain visible in the PCAP.

{{< ad >}}

### Reconstructing the attack chain

HTTP request extraction shows the full infection sequence:

1. The victim browses a feedproxy.google.com redirect that lands on dzikics-my-sharepoint.com (195.149.87.128) over HTTPS.
2. Two MSI files are downloaded over HTTP:
   - GET / from 185.10.68.235, Content-Disposition: `attachment; filename=filter.msi`
   - GET /10opd3r_load.msi from 192.36.27.92
3. The installed REBOL interpreter connects to fidufagios.com (169.239.128.11) with repeated /m and /p requests carrying base64-encoded host identifiers.

The user-agent in the C2 traffic is **REBOL View 2.7.8.3.1**, a scripting runtime that MirrorBlast abuses as its execution engine.

The two other IP addresses associated with the attack (the MSI download servers) are **185[.]10[.]68[.]235,192[.]36[.]27[.]92**. The downloaded files, in matching order, are **filter.msi,10opd3r_load.msi**.

### MSI payload inspection

Extracting the HTTP objects and inspecting the MSI metadata with `strings` reveals what each installer drops.

**filter.msi** (from 185.10.68.235): product name "645645", installs two files to `C:\ProgramData\001\`:

```
  arab.exe    (PE binary)
  arab.bin    (data file)
```

Full paths: **C:\ProgramData\001\arab.bin,C:\ProgramData\001\arab.exe**.

**10opd3r_load.msi** (from 192.36.27.92): disguised as "Google Chrome" version 92.0.4515, installs to `C:\ProgramData\Local\Google\`:

```
  rebol-view-278-3-1.exe   (REBOL interpreter)
  exemple.rb               (REBOL C2 script)
```

The MSI also adds a Run registry key (`Software\Microsoft\Windows\CurrentVersion\Run`) named "Google Chrome" pointing to the REBOL interpreter with the script as an argument, establishing persistence.

Full paths: **C:\ProgramData\Local\Google\rebol-view-278-3-1.exe,C:\ProgramData\Local\Google\exemple.rb**.

## Takeaways

1. **MSI metadata is forensic gold.** Both installers revealed their entire payload layout, install paths, persistence mechanisms, and even the disguise ("Google Chrome") through basic `strings` output against the OLE Compound Document. Extracting HTTP objects from a PCAP and running static analysis on the payloads often answers more questions than live dynamic analysis.

2. **REBOL as an execution engine is a strong signal.** The "REBOL View" user-agent stands out immediately in HTTP logs because no legitimate enterprise software uses it. MirrorBlast chose REBOL precisely because security tools rarely flag it, but that same obscurity makes it trivial to detect with a simple user-agent filter.

Room solved 100%: 1 task, 11 answers.
