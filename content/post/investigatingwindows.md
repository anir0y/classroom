---
title: Investigating Windows
date: 2021-05-25T20:09:18+05:30
lastmod: 2021-05-25T20:09:18+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/blog.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm

draft: false
description: "TryHackMe Investigating Windows walkthrough — explore Windows operating system fundamentals, security features, and common attack surfaces."
---
# Investigating Windows
A windows machine has been hacked, its your job to go investigate this windows machine and find clues to what the hacker might have done.



|Profile|
|:-----|
|<script src="https://tryhackme.com/badge/434937"></script>|



---

## Task 01: Investigating Windows
<!--
### Flags Task.1


|Flag ID|Question|Goes here|
|-|:---:|:---|
|1|Whats the version and year of the windows machine?|`ans`|
|2|Which user logged in last?|`Administrator`|
|3|When did John log onto the system last?|`03/02/2019 5:48:32 PM`|
|4|What IP does the system connect to when it first starts?|`10.34.2.3`|
|5|What two accounts had administrative privileges (other than the Administrator user)|`Jenny,Guest`|
|6|Whats the name of the scheduled task that is malicous|`clean file system`|
|7|What file was the task trying to run daily?|`nc.ps1`|
|8|What port did this file listen locally for?|`1348`|
|9|When did Jenny last logon?|`never`|
|10|At what date did the compromise take place?|`03/02/2019`|
|11|At what time did Windows first assign special privileges to a new logon?|`03/02/2019 4:04:49 PM`|
|12|What tool was used to get Windows passwords?|`mimikatz`|
|13|What was the attackers external control and command servers IP?|`76.32.97.132`|
|14|What was the extension name of the shell uploaded via the servers website?|`.jsp`|
|15|What was the last port the attacker opened?|`1337`|
|16|Check for DNS poisoning, what site was targeted?|`google.com`|

-->

#### Explanation

### Flg 2
looking into eventviewer log for EventID 4624. Ref: [read](https://docs.microsoft.com/en-us/windows/security/threat-protection/auditing/event-4624)

### Flag 3 
open CMD -> type net user John
look for Last Logon   
![Investigating Windows screenshot](https://i.imgur.com/dQ1djOm.png)

### Flag 4
while booting up we see the IP in CMD
![Investigating Windows screenshot (2)](https://i.imgur.com/w1hkL7y.png)

### Flag 5
CMD: `net localgroup administrators`   
![Investigating Windows screenshot (3)](https://i.imgur.com/CoI1GHD.png)

### FLag 6 
open task scheduler and look for names that sticks out.   
![Investigating Windows screenshot (4)](https://i.imgur.com/uWrrf23.png)

### FLag-7
dig more with `clean file system`  
![Investigating Windows — FLag-7](https://i.imgur.com/YES0F6P.png)

### FLag 8
Args   
![Investigating Windows screenshot (5)](https://i.imgur.com/YES0F6P.png)


### FLag 9
![Investigating Windows screenshot (6)](https://i.imgur.com/4uzm1Zo.png)

### FLag 10 
check the file create date of [Flag7](#flag-7)
![Investigating Windows screenshot (7)](https://i.imgur.com/qMrT8Zr.png)

### FLag 11
looking 10 min (before-after for any special logon)   
PS: use [Get-EventLog](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.management/get-eventlog?view=powershell-5.1) Date Range with XPath Filter
![Investigating Windows screenshot (8)](https://i.imgur.com/8IG9Nar.png)

### FLag 12
GameOver is another Task Scheduled. opon investigation / running it like an Idiot you'll see the banner that tells you the Name of the tool. 
`mim.exe` 
![Investigating Windows screenshot (9)](https://i.imgur.com/lkb2Z1k.png)

### FLag-13
this machine doesnot have SYSMON, and took me 40 min to figure out where to look, long story short there is `google.com is hardcoded to 76.32.97.132` that's suspicious. 

![Investigating Windows — FLag-13](https://i.imgur.com/uNKqh9E.png)

### FLag 14
Default web dir in Windows is `c:\inetpub\wwwroot` found the file `backddoors` there (jsp is the ans.)

![Investigating Windows screenshot (10)](https://i.imgur.com/qqFtsJj.png)

### FLag 15
Rookie `0x1337 Hax0r` mistake of using port `1337` 
PS: in Windows port can be open/close manually using Windosws built in firewall rules.   
![Investigating Windows screenshot (11)](https://i.imgur.com/AQvldFm.png)


### FLag 16
Ans is from [Flag-13](#flag-13), hardcoded known domain name. 

![Investigating Windows screenshot (12)](https://i.imgur.com/uNKqh9E.png)


---
---