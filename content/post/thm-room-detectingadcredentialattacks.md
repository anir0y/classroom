---
title: "TryHackMe Detecting AD Credential Attacks Walkthrough"
date: 2026-08-16T23:55:00+05:30
lastmod: 2026-08-16T23:55:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-adcredattacks/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Active Directory
  - Splunk
  - Kerberoasting
  - DCSync
  - Threat Hunting
  - Blue Team

draft: false
description: "Walkthrough of TryHackMe Detecting AD Credential Attacks: Kerberoasting via RC4 service tickets, AS-REP roasting, LSASS dumping with procdump, DCSync via Event 4662, and NTDS.dit extraction."
---

## Detecting AD Credential Attacks

Third room in the **Active Directory for SOC** module, after [Monitoring Active Directory](/post/thm-room-monitoringactivedirectory/) and [Detecting AD Initial Access](/post/thm-room-detectingadinitialaccess/). Those two covered what normal looks like and how an attacker gets through the front door. This one covers the five techniques that bridge the gap between *attacker has a foothold* and *attacker owns the domain*: Kerberoasting, AS-REP roasting, LSASS dumping, DCSync, and NTDS.dit extraction.

The framing is a real intrusion. In August 2024 a DFIR Report case documented BlackSuit ransomware operators using Rubeus to Kerberoast service accounts, AS-REP roasting an account with preauthentication disabled, and dumping credentials from LSASS memory — all in a single intrusion. A separate BlackSuit case investigated by ReliaQuest that same year saw over 20 accounts compromised through Kerberoasting alone, including a domain administrator. None of it was exotic.

Eight tasks, eighteen graded answers, and a nice structural touch: **each task has its own Splunk index** (`task2` through `task7`), so the datasets never contaminate each other. All solved 100%.

![TryHackMe Detecting AD Credential Attacks at 100%, all eight tasks complete](/img/thm-adcredattacks/00-thumbnail.png)

As with the previous rooms I ran the SPL through Splunk's REST API and re-ran the interesting searches in the browser for the screenshots. And again: **set the time picker to All time** — the data is timestamped March 2026.

## Task 2: Kerberoasting

Kerberoasting works because any domain user can request a service ticket for any account with an SPN, and the ticket is encrypted with the service account's password hash. Request it, take it offline, crack it. The room's explanation of *how accounts end up roastable* is the honest one: an admin needs to run SQL Server, uses their own DA account as the service identity because it is quick, sets a memorable password, and moves on. Repeat over several years.

The detection signal is the encryption type. Modern AD issues AES-256 (`0x12`); attackers deliberately request **RC4 (`0x17`)** because it cracks far faster. So one query separates the attack from the noise:

```
index=task2 EventCode=4769
| stats count by Ticket_Encryption_Type, Account_Name, Service_Name, Client_Address
| sort - Ticket_Encryption_Type
```

![Splunk showing nine RC4 (0x17) service ticket requests from emma.wilson against nine svc- accounts, versus normal 0x12 traffic](/img/thm-adcredattacks/01-splunk-kerberoasting-rc4.png)

The shape is unmistakable. Nine `0x17` rows, all from **emma.wilson**, all from **10.5.90.1**, each hitting a different service account — `svc-app`, `svc-backup`, `svc-ftp`, `svc-mail`, `svc-print`, `svc-report`, `svc-share`, `svc-sql`, `svc-web`. Below them sit the four legitimate `0x12` requests from real workstations to `THM-DC$` and `THM-SHR-SRV$`.

So: **9** service accounts targeted, by **emma.wilson**, from **10.5.90.1**. One user enumerating every SPN in the domain within a few seconds is not a person doing their job.

## Task 3: AS-REP roasting

Same offline-cracking goal, different weakness. AS-REP roasting targets accounts with **preauthentication disabled**, and unlike Kerberoasting it does not need valid domain credentials at all — the DC simply hands over encrypted material to anyone who asks.

Normal Kerberos requires the user to prove knowledge of their password first by encrypting a timestamp, which the DC logs as Event 4768 with `Pre_Authentication_Type=2`. When preauth is off, that value is **0**:

```
index=task3 EventCode=4768
| stats count by Pre_Authentication_Type, Account_Name, Ticket_Encryption_Type, Client_Address
#   0   alex.reed         0x17   ::ffff:10.5.90.1    2
#   2   jessica.martinez  0x12   ::ffff:10.5.50.15   1
#   2   liam.patel        0x12   ::ffff:10.5.50.20   1
```

**alex.reed** is the account with preauthentication disabled — and note it lines up on both axes: Pre-Auth Type 0 *and* RC4 *and* the same `10.5.90.1` attacker host from Task 2. Everyone else is Type 2 with AES from their own workstation.

## Task 4: LSASS credential dumping

{{< ad >}}

Roasting gets you hashes to crack. Dumping LSASS gets you credentials directly out of memory, no cracking required. The detection source shifts from Security events to **Sysmon Event ID 10 (ProcessAccess)**, which records one process opening a handle to another.

```
index=task4 EventCode=10 TargetImage="*lsass.exe"
| stats count by SourceImage, GrantedAccess | sort -count
```

![Splunk showing svchost.exe accessing lsass.exe normally alongside C:\Windows\Temp\procdump64.exe with GrantedAccess 0x1FFFFF](/img/thm-adcredattacks/02-splunk-lsass-procdump.png)

Three rows, and the third is the intrusion. `svchost.exe` touching LSASS 100 times with `0x1000` is routine Windows behaviour — this is exactly why "alert on any LSASS access" produces unusable noise. The outlier is **`C:\Windows\Temp\procdump64.exe`** with **`0x1FFFFF`**, which is PROCESS_ALL_ACCESS. Two signals stack here: the access mask is far broader than anything legitimate needs, and a signed Sysinternals binary is running out of `C:\Windows\Temp`.

The third question is the interesting one, because it asks *how* the dump was taken. The answer is in the CallTrace:

```
index=task4 EventCode=10 TargetImage="*lsass.exe" SourceImage="*procdump64.exe"
| table _time, GrantedAccess, CallTrace
#   ...KERNEL32.DLL+2364e | dbgcore.DLL+aeef | dbgcore.DLL+1ac05 | dbgcore.DLL+13cf0 ...
```

**dbgcore.dll** — the library exporting `MiniDumpWriteDump`. Its presence in the call stack is what proves memory was actually written to a dump file rather than merely read, and it is the signature that survives renaming the executable.

## Task 5: DCSync

DCSync is the point where an attacker stops stealing individual credentials and asks the domain controller to hand over every password hash in the directory, by impersonating a DC and invoking replication. There is no malware and no process to catch — from AD's point of view it is a legitimate operation, just performed by the wrong principal.

The evidence is **Event 4662**, object access on the domain object with `Control Access` rights:

```
index=task5 EventCode=4662 Properties="*Control Access*"
| stats count by Account_Name, Logon_ID, Object_Type | sort -count
```

![Splunk showing adm-luke.sullivan performing Control Access on the domain object, alongside legitimate THM-DC$ activity](/img/thm-adcredattacks/03-splunk-dcsync-4662.png)

The trick is knowing what to ignore. Domain controllers replicate with each other constantly, so `THM-DC$` generating 4662 is expected — machine accounts *should* be there. What should never appear is a **user** account performing replication against the domain object `19195a5b-6da0-11d0-afd3-00c04fd930c9`. That is **adm-luke.sullivan**, on Logon ID **0x5A01668**.

The Logon ID is the pivot that makes this actionable. It ties the directory operation back to the session that performed it:

```
index=task5 EventCode=4624 Logon_ID=0x5A01668
| table _time, Account_Name, Logon_Type, Source_Network_Address
#   2026-03-17 05:30:47   adm-luke.sullivan   Type 3   10.5.90.1
```

**10.5.90.1** again — the same host that ran the Kerberoasting and the AS-REP roasting. Four techniques, one operator.

## Task 6: NTDS.dit extraction

The last resort when DCSync is not available: copy the AD database off the disk. `ntds.dit` is locked while the DC is running, so the attacker needs either a volume shadow copy or the built-in IFM export. This dataset has **both**, which makes the command timeline the cleanest artefact in the room:

```
index=task6 EventCode=1 (CommandLine="*ntds*" OR CommandLine="*vssadmin*" OR CommandLine="*ShadowCopy*")
| table _time, CommandLine | sort _time
```

![Splunk showing the five-command NTDS.dit extraction chain from ntdsutil IFM through vssadmin shadow copy to shadow deletion](/img/thm-adcredattacks/04-splunk-ntds-extraction.png)

Five commands, forty seconds:

| Time | Command |
|---|---|
| 07:57:13 | `ntdsutil "ac i ntds" "ifm" "create full C:\Perflogs\1" q q` |
| 07:57:29 | `vssadmin create shadow /for=C:` |
| 07:57:40 | `cmd /c copy "\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy7\Windows\NTDS\ntds.dit" C:\Windows\Temp\ntds.dit.save` |
| 07:57:42 | `cmd /c copy "\\?\GLOBALROOT\...\Windows\System32\config\SYSTEM" C:\Windows\Temp\system.save` |
| 07:57:53 | `vssadmin delete shadows /all /quiet` |

So the extraction command is the `ntdsutil` IFM one-liner, the shadow copy source is `\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy7\Windows\NTDS\ntds.dit`, and the staging directory is **`C:\Windows\Temp`**.

Three details worth carrying away. The attacker copied **SYSTEM** alongside `ntds.dit` — the database is encrypted with the boot key stored in that hive, so `ntds.dit` alone is useless and the pair is what makes the theft complete. The `C:\Perflogs` target is a classic staging directory: it exists by default, it is writable, and nobody looks in it. And the final `vssadmin delete shadows /all /quiet` is anti-forensics that doubles as a ransomware precursor — the same command appears in nearly every ransomware playbook to prevent recovery.

One practical note on answering these: the room wants the command line *exactly as Splunk shows it*, and Sysmon renders these with a **double space** after the image name (`ntdsutil  "ac i ntds"`). The underscore mask on the answer box confirms the character count, so match it literally.

## Task 7: the investigation challenge

A fresh index, an unguided intrusion, and five questions that ask you to repeat all four detections without being told which is which. Every query from the earlier tasks transfers directly.

```
index=task7 EventCode=4768 Pre_Authentication_Type=0 | stats count by Account_Name
#   -> mia.turner

index=task7 EventCode=4769 Ticket_Encryption_Type=0x17 | stats dc(Service_Name) by Account_Name
#   -> nathan.brooks, 9 service accounts

index=task7 EventCode=10 TargetImage="*lsass.exe" | stats count by host, SourceImage, GrantedAccess
#   -> THM-DEV-WS  C:\Windows\system32\rundll32.exe  0x1FFFFF (and 0x1410)
```

So the AS-REP target is **mia.turner** and the Kerberoasting account is **nathan.brooks**. The LSASS answer is **rundll32.exe** — not procdump this time, which is the point of the challenge. The CallTrace shows `comsvcs.dll` followed by `dbgcore.DLL`, meaning this is the living-off-the-land `rundll32 comsvcs.dll MiniDump` technique: no attacker binary on disk at all, just two signed Microsoft DLLs. The behavioural signature is identical even though the tooling changed completely.

That produced the one genuine judgement call in the room. `rundll32.exe` shows **two** ProcessAccess events, `0x1410` and `0x1FFFFF`, so which is "the LSASS dump"? The CallTrace decides it: only the `0x1FFFFF` event contains `dbgcore.DLL` in its stack. The `0x1410` handle is the preceding open; the `0x1FFFFF` one is where `MiniDumpWriteDump` actually ran. **0x1FFFFF** is the answer.

For DCSync, the naive query misleads. Both `adm-luke.sullivan` and `nathan.brooks` generate 4662 events, and nathan.brooks has 17 of them. But filtering on `Properties` separates them: nathan.brooks's are all **`Read Property`** against user objects (`bf967aba`), which is ordinary LDAP enumeration, while adm-luke.sullivan has 105 **`Control Access`** events against the domain object. **adm-luke.sullivan** performed the DCSync.

Worth flagging for anyone building this detection: I first tried filtering on the replication extended-right GUIDs (`1131f6aa-…`, `1131f6ad-…`) since that is the canonical DCSync rule, and it returned **zero results** — this dataset carries the friendly `Control Access` string in `Properties` rather than the raw GUIDs. Write the rule against what your logs actually contain, not against what the blog posts say they should.

## Task 8: what ties it together

![TryHackMe Detecting AD Credential Attacks completed — 8 tasks, 40 points](/img/thm-adcredattacks/05-room-complete.png)

The through-line is that each of these five techniques has a signature that does not depend on the tool. RC4 in a 4769 does not care whether the attacker ran Rubeus or Impacket. `Pre_Authentication_Type=0` is a property of the account, not the exploit. A user account issuing Control Access against the domain object is DCSync regardless of whether it was mimikatz or secretsdump. And `dbgcore.dll` in a CallTrace means a minidump was written whether the caller was `procdump64.exe` or `rundll32.exe` — which the challenge demonstrates by swapping exactly that.

The other lesson is about false positives, and the room teaches it by including them rather than describing them. `svchost.exe` touching LSASS a hundred times, domain controllers replicating with each other, users reading directory properties — all present, all benign, all indistinguishable from the attack if you alert on the event ID alone. The discriminator is never the event; it is the field. Encryption type, preauth type, access mask, principal class, `Properties` value.

Room solved 100% — eight tasks, eighteen answers, 40 points.
