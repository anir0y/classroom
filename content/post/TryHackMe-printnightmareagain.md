---
title: Writeup |Try Hack Me PrintNightmare, again!
date: 2022-10-31T14:14:20+05:30
lastmod: 2022-10-31T14:14:20+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover: /img/PrintNightmare2.png # for tryhackMe
simg: /img/PrintNightmare2.png

categories:
  - TryHackMe


draft: false
description: Try Hack Me Room rintNightmare, again solved by Animesh Roy. this is a walkthough. read more...

---

## OverView

Search the artifacts on the endpoint to determine if the employee used any of the Windows Printer Spooler vulnerabilities to elevate their privileges.

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|[**FREE ROOM**] PrintNightmare, again |![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/80976dc5f46f5d2f78a99c2c8e2bc4a9.png)|


## Detection

**Scenario**: In the weekly internal security meeting it was reported that an employee overheard two co-workers discussing the PrintNightmare exploit and how they can use it to elevate their privileges on their local computers.

Task: Inspect the artifacts on the endpoint to detect the exploit they used.

## Answer the questions below

### 1: The user downloaded a zip file. What was the zip file saved as?

to ans this question, let's open up the Full Event View, set to all time events (options -> advance options -> set to all time). and then search for `.zip` and you'll get the file name downloaded into `downloads` directory. ref img: 

![img](https://i.imgur.com/c4IJFX9.png)

### 2: What is the full path to the exploit the user executed?

a little bit of scrolling donw reveals the poweshell script that used to execute the exploit. ref img: 

![img](https://i.imgur.com/pWO3Q51.png)

### 3: What was the temp location the malicious DLL was saved to? 

again scroll donwn to the timeline to see the `malicious dll` that downloaded into temp directory. ref img: 

![img](https://i.imgur.com/53h21nC.png)

### 4: What was the full location the DLL loads from?

same thing again, scrool donw to the time line. that wil reveal the path for the `dll`

![img](https://i.imgur.com/WFsqAIX.png)

### 5: What is the primary registry path associated with this attack?

The `HKLM` is dead giveaway the path

![img](https://i.imgur.com/QuozoU5.png)

### 6: What was the PID for the process that would have been blocked from loading a non-Microsoft-signed binary?

the second line with `Blocked PID` is the answer: 

![img](https://i.imgur.com/D8tE3GW.png)

### 7: What is the username of the newly created local administrator account?

event ID `4720` is the giveaway for this, or you can just scroll donwn to see the event evantually. 

![img](https://i.imgur.com/LNOLyCW.png)

### 8: What is the password for this user?

for this, luckily we have Poweshell console history enabled. so we can just read this info directly from the file. 

ps cmdline: `type C:\Users\bmurphy\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt`

ref the img to get the flag.

![img](https://i.imgur.com/nbfoowM.png)

### 9: What two commands did the user execute to cover their tracks? (no space after the comma)

ps cmdline: `type C:\Users\bmurphy\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt`

ref the img to get the flag.

![img](https://i.imgur.com/nbfoowM.png)

---
<!-- Google Ads -->

<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
<ins class="adsbygoogle"
     style="display:block; text-align:center;"
     data-ad-layout="in-article"
     data-ad-format="fluid"
     data-ad-client="ca-pub-3526678290068011"
     data-ad-slot="7160066188"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
<!-- END -->


<script data-name="BMC-Widget" data-cfasync="false" src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js" data-id="anir0y" data-description="Support me on Buy me a coffee!" data-message="" data-color="#5F7FFF" data-position="Right" data-x_margin="18" data-y_margin="18"></script>

<!-- EOF -->
