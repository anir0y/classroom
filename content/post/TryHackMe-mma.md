---
title: TryHackMe Mobile Malware Analysis
date: 2021-08-05T12:08:59+05:30
lastmod: 2021-08-05T12:08:59+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: /img/thm.gif
  alt: "cover image"

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm

draft: false
description: TryHackMe Room Mobile Malware Analysis solved by Animesh Roy. this is a walkthough. read more...

---

## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Mobile Malware Analysis|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/1a8af49f6135843b36f1378812034155.png)|
| <b> Room [FREE ROOM] </b>| [Mobile Malware Analysis](https://tryhackme.com/room/mma)|

## task 01: Introduction

It's incredible how often our computers are in the scope of cyber attacks. Antivirus has become an indispensable shield to provide us with a more secure environment, since we are exposed to destructible malware and cyber attacks. Inside our pockets, we have computers so powerful, but much smaller, we must be equally attentive on our phones, because we can suffer equally damaging attacks, sometimes even worse, because they can store relevant information such as private conversations and important accounts.

---

## task 02: An Unknown Land

|Question|Ans|ref|
|---|---|--|
|What known as the first malware created to affect mobile devices?|`cabir`|[wiki](https://en.wikipedia.org/wiki/Mobile_malware)|
|What technology does this worm used to multiply?||[wiki](https://en.wikipedia.org/wiki/Mobile_malware)|
|What operating system did it infect?|||[wiki](https://en.wikipedia.org/wiki/Mobile_malware)|
|What message did it show on the screen of the infected mobile phone?||[wiki](https://en.wikipedia.org/wiki/Mobile_malware)|

---

## task 03: Small size, a lot of destruction.

### 3.1

     Deploy the machine & use MobSF to scan the file named "TWFsd2FyZQ.apk" that is located on the Desktop.

### 3.2

What is the format of the file?

     `apk`

### 3.3

The sample's size is 10,1 bytes, so it seems that it is not a complex application.

### 3.4

Decode the name of the sample.

`[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("{file.apk}=="))` # '==' is for padding.

![img](https://i.imgur.com/SQbmFBc.png)

### 3.5

Which is the target platform?

     `android`

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

---

## task 04: Digging Deeper

Let's make a deeper analysis.

VirusTotal is a incredible service, this web site can give us the power of analyze a package with the database of more then seventy Anti-Virus, and the result is fast and accurate.

https://www.virustotal.com/

To analyze the file in VirusTotal, you will need the file hash, you can get it by using the powershell cmdlet "Get-FileHash" or you can analyze the filw with MobSF and it will show the file hash (we will get back to this tool in the next task)

### 4.1

What does Avast-Mobile can tell us about this software?

* get the Hash
  
  ![img](https://i.imgur.com/wt77bJf.png)

* find on VT

     ![img](https://i.imgur.com/qith0hT.png)

### 4.2

What program was used to create the malware?

* a little research reveals this is done with `msf`

### 4.3

The results provided by VirusTotal shows that we have a generic malware. It does not serve for attack purposes because we can see that a good part of the Antiviruses are detecting it, this malware is a good one for searching purposes, but it is also used for post exploitation.

### 4.4

What is the package name?

* read the [Details](https://www.virustotal.com/gui/file/e201a1d2cecf1d04d97d59abec0863c716dcf9fcad89b85d036f9163a48057e7/details)

### 4.5

What is the SHA-1 signature?

* read the [Details](https://www.virustotal.com/gui/file/e201a1d2cecf1d04d97d59abec0863c716dcf9fcad89b85d036f9163a48057e7/details)

### 4.6

By extracting the content, it will create a folder with some files inside, one of which is a XML. It describes some important information about the application for Android build tools, for Android operating system and for Google Play. This file declares items, shows some stuff as the package name and the permissions required to the device. The information that will be needed for the next questions can be found on VirusTotal also.

### 4.7

What is the unique XML file?

* read this page on [VirulTotal](https://www.virustotal.com/gui/file/e201a1d2cecf1d04d97d59abec0863c716dcf9fcad89b85d036f9163a48057e7/relations)

### 4.8

How many permissions are there inside?

* read the [Details](https://www.virustotal.com/gui/file/e201a1d2cecf1d04d97d59abec0863c716dcf9fcad89b85d036f9163a48057e7/details)

### 4.9

Which permission allows the application to take pictures with the camera?

* read the [Details](https://www.virustotal.com/gui/file/e201a1d2cecf1d04d97d59abec0863c716dcf9fcad89b85d036f9163a48057e7/details)

### 4.10

What is the message left by the community?

* reaad the community page on [VT](https://www.virustotal.com/gui/file/e201a1d2cecf1d04d97d59abec0863c716dcf9fcad89b85d036f9163a48057e7/community)

---

## task 05:  MobSFing the sample

### 5.1

What is the programming language used to create the program?

* `java`

### 5.2

How many signatures does the package has?

* `1`
  
  ![img](https://i.imgur.com/wTeA8DC.png)

### 5.3

Application is signed with v1 signature scheme, what is it vulnerable to on Android <7.0?

* ref
  
  ![img](https://i.imgur.com/MemIadg.png)

### 5.4

MobSF gives all the code decompiled. Just a base of programming make us able to understand a little bit of what is happening.

### 5.5

This malware is used to create a connection with the victim that is called a reverse shell.

### 5.6

What is the App name?

* ref to this:
  
  ![img](https://i.imgur.com/h84LycF.png)

### 5.7

It looks like  there is a function calling for the package manager, so it can see all the installed applications. What function is that?

* ref
  
  ![img](https://i.imgur.com/KYGDfeQ.png)

### 5.8

Returning to the manifest.

The flag "android:allowBackup" allows the user to backup application data via USB debugging. It is recommended that this be set as "False", even if by default it is "True".

What is the severity of this configuration?

* ref

     ![img](https://i.imgur.com/zoujRGU.png)

---

## task 06: It doesn't smell good

I think that now we have the necessary knowledge to analyze bigger stuff.

Our next sample located on the Desktop, the name of the file is sample2.apk, let's start a MobSF analysis on it.

### 6.1

What is the SHA-256 hash of the file?

* ref
  
  ![img](https://i.imgur.com/j3xi9OR.png)

### 6.2

After finding the sample on VirusTotal, what does the "Avast" anti-virus engine recognizes it as?

* ref:
  
  ![img](https://i.imgur.com/qI1UhCq.png)

### 6.3

With what we have, try to find out the name of the sample.

* ref:
  
  ![img](https://i.imgur.com/K6OwWqG.png)

### 6.4

It seems like it is a very dangerous malware and has a big history of destruction.

This became news for spying journalists, what year was that?

* `google this man!`
* Hint [newslink](https://qz.com/india/2036207/meet-an-indian-reporter-named-in-the-leaked-pegasus-spyware-data/)

### 6.5

It was reported that the malware was developed by a legitimate intention:  The idea behind it was to use the software as a government tool designed to  track and combat terrorism and crime.

This malware has been found infecting people's smartphones and political activists in more than 44 countries.

### 6.6

If we search the name we found of the malware in MITRE ATT&CK (https://attack.mitre.org/), we can find some interesting information. 

What is the ID of the MITRE ATT&CK that is associated with our sample?

* ref [Mitre](https://attack.mitre.org/software/S0316/)

### 6.7

What technique has the ability to exploit OS vulnerabilities to escalate privileges?

* ref [Mitre](https://attack.mitre.org/software/S0316/)

### 6.8

Now, let's go back to the MobSF analysis.

### 6.9

There is a permission that when accepted, allows the application to access the list of accounts in the Accounts Service. What is the status shown by MobSF regarding this permission. (android.permission.GET.ACCOUNTS)

* ref:
  
  ![img](https://i.imgur.com/4mUnL3s.png)

### 6.10

What org.eclipse.paho.client file refers to properties of Portuguese from Brazil (pt-br)?

* ref:
  
  ![img](https://i.imgur.com/crKUSOS.png)

### 6.11

This software has several features that make the identification and the processes it performs to explore the target, harder to handle, even when it is being analyzed.

### 6.12

The malware has a special appeal for its safety and its internal components, reducing the risk of compromise. It has a functionality for its cryptographic operations with the feature of a random bit generation service. How can it be identified?

* ref:
  
  ![img](https://i.imgur.com/zcpdRki.png)


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
