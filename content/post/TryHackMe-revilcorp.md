---
title: Try Hack Me REvil Corp
date: 2021-11-23T13:51:46+05:30
lastmod: 2021-11-23T13:51:46+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover: /img/RCorp.png # for tryhackMe
simg: https://tryhackme-images.s3.amazonaws.com/room-icons/b2802c4d2bc81aa4f095d1c0d9e55ab1.png

categories:
  - TryHackMe
tags:
  - tryhackme

draft: false
description: TryHackMe Room {REvil Corp} solved by Animesh Roy. this is a walkthough. read more...

---

## OverView

You are involved in an incident response engagement and need to analyze an infected host using Redline.

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|REvil Corp|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/b2802c4d2bc81aa4f095d1c0d9e55ab1.png)|
| <b> REvil Corp [FREE ROOM] </b>| [REvil Corp](https://tryhackme.com/room/revilcorp)|

## Task 01:  Investigating the Compromised Endpoint

**Scenario**: One of the employees at Lockman Group gave an IT department the call; the user is frustrated and mentioned that all of his files are renamed to a weird file extension that he has never seen before. After looking at the user's workstation, the IT guy already knew what was going on and transferred the case to the Incident Response team for further investigation.

You are the incident responder. Let's see if you can solve this challenge using the infamous Redline tool. Happy Hunting, my friend!

To start your investigation, open the Mandiant Analysis file in the Analysis File folder on the Desktop.

## Answer the questions below

|Task|Question|Ans|
|:---|---|---|
|1|What is the compromised employee's full name?| [employee name](#compromised-employee)|
|2|What is the operating system of the compromised host?|[windows host](#what-is-the-operating-system-of-the-compromised-host)|
|3|What is the name of the malicious executable that the user opened?|[malware](#malicious-executable)|
|4|What is the full URL that the user visited to download the malicious binary? (include the binary as well)|[File download Url](#full-url)|
|5|What is the MD5 hash of the binary?|[hash](#md5-hash-of-the-binary)|
|6|What is the size of the binary in kilobytes?|[binary size](#size-of-binary)|
|7|What is the extension to which the user's files got renamed?|[renamed files](#files-got-renamed)|
|8|What is the number of files that got renamed and changed to that extension?|[number of files renamed](#what-is-the-number-of-files-that-got-renamed-and-changed-to-that-extension)|
|9|What is the full path to the wallpaper that got changed by an attacker, including the image name? |[hacker wallpaper](#full-path-to-the-wallpaper-that-got-changed-by-an-attacker)|
|10|The attacker left a note for the user on the Desktop; provide the name of the note with the extension.|[hacker notes](#attacker-left-a-note-for-the-user-on-the-desktop)|
|11|The attacker created a folder "Links for United States" under C:\Users\John Coleman\Favorites\ and left a file there. Provide the name of the file. |[hacker links](#links-for-united-states)|
|12|There is a hidden file that was created on the user's Desktop that has 0 bytes. Provide the name of the hidden file.|[size zero](#size-of-binary)|
|13|The user downloaded a decryptor hoping to decrypt all the files, but he failed. Provide the MD5 hash of the decryptor file.|[decrypt.exe](#decryptor-hoping-to-decrypt)|
|14|In the ransomware note, the attacker provided a URL that is accessible through the normal browser in order to decrypt one of the encrypted files for free. The user attempted to visit it. Provide the full URL path.|[history](#free-decyptor)|
|15|What are some three names associated with the malware which infected this host? (enter the names in alphabetical order)|[OTX](#three-names-associated-with-the-malware)

---

### compromised employee

![img](https://i.imgur.com/vk3tnZs.png)

### What is the operating system of the compromised host?

find the info on `system informaiton page`

![img](https://i.imgur.com/AKht4Jh.png)

### malicious executable

* user might have been downloaded `malicious executable` using web/email. let's check download history to find the ans.

![img](https://i.imgur.com/tN2z6Up.png)

### full URL

ref to [task 3](#malicious-executable) we can copy and paste the URL

### MD5 hash of the binary

![img](https://i.imgur.com/Bsvqhyj.png)

1. click on `timeline`
2. search for the `malicious [executable](#malicious-executable)`
3. click on `result`
4. search for `next`
5. eventually you'll see hash either on `right side of result` or you can click on `show detail` for better copy/paste!

### size of binary

* ref to [full url](#full-url) or [md5sum](#md5-hash-of-the-binary) both have file size.

### files got renamed

![img](https://i.imgur.com/qZNvlyl.png)

1. click on `file system`
2. select folders form `user`
3. you'll notice a not common extention name for few files.
4. that's the answer!

### What is the number of files that got renamed and changed to that extension?

![img](https://i.imgur.com/PwGbQzC.png)

1. goto `timeline`
2. in `timeline config` check only `changed` & `modified`
3. search for the `ext`
4. you have the ans!!

### full path to the wallpaper that got changed by an attacker

![img](https://i.imgur.com/QfMWDZL.png)

1. goto `timeline`
2. search for `.bmp` ext
3. you have the ans!!!

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

### attacker left a note for the user on the Desktop

![img](https://i.imgur.com/iH7ckpa.png)

1. goto `file system`
2. select `user's desktop`
3. you'll see the notes with `.txt` ext

### Links for United States

![img](https://i.imgur.com/gtp8QsX.png)

1. goto `file system`
2. select `user's favorites`
3. you'll see a file under `United States` folder

### hidden file that was created on the user's Desktop

![img](https://i.imgur.com/7JHoBf8.png)

1. goto `file system`
2. select `user's desktop`
3. you'll see the file with `0 bytes`

### decryptor hoping to decrypt

![img](https://i.imgur.com/PRF1CAA.png)

1. goto `file system`
2. select `user's desktop`
3. find the `decryptor.exe`
4. click on `show details` or you can see the hash of that file in `right pane`

### Free Decyptor

![img](https://i.imgur.com/ehcU5lW.png)

1. Click on `URL history`
2. search for `decrypt` ; quick findings
3. paste the `full URL` as answer

### three names associated with the malware

ref to [OTX](https://otx.alienvault.com/indicator/file/5f56d5748940e4039053f85978074bde16d64bd5ba97f6f0026ba8172cb29e93/)

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
