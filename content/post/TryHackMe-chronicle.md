---
title: TryHackMe Chronicle
date: 2021-08-07T13:04:08+05:30
lastmod: 2021-08-07T13:04:08+05:30
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

draft: true
description: TryHackMe Room Chronicle solved by Animesh Roy. this is a walkthrough. read more...

---

## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Chronicle|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/333346fd705f9b7faadeff8e10862d0a.jpeg)|
| <b> Room [Subscription Required] </b>| [Chronicle](https://tryhackme.com/room/chronicle)|

## Recon

* nmap

     ```bash
     sudo nmap -sC -sV -oN nmap/init 10.10.43.34
     [sudo] password for anir0y: 
     Starting Nmap 7.91 ( https://nmap.org ) at 2021-08-07 13:09 IST
     Nmap scan report for 10.10.43.34
     Host is up (0.18s latency).
     Not shown: 997 closed ports
     PORT     STATE SERVICE VERSION
     22/tcp   open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
     | ssh-hostkey: 
     |   2048 b2:4c:49:da:7c:9a:3a:ba:6e:59:46:c2:a9:e6:a2:35 (RSA)
     |   256 7a:3e:30:70:cf:32:a4:f2:0a:cb:2b:42:08:0c:19:bd (ECDSA)
     |_  256 4f:35:e1:33:96:84:5d:e5:b3:75:7d:d8:32:18:e0:a8 (ED25519)
     80/tcp   open  http    Apache httpd 2.4.29 ((Ubuntu))
     |_http-server-header: Apache/2.4.29 (Ubuntu)
     |_http-title: Site doesn't have a title (text/html).
     8081/tcp open  http    Werkzeug httpd 1.0.1 (Python 3.6.9)
     |_http-server-header: Werkzeug/1.0.1 Python/3.6.9
     |_http-title: Site doesn't have a title (text/html; charset=utf-8).
     Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

     Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
     Nmap done: 1 IP address (1 host up) scanned in 16.47 seconds

     ```

* `8081/tcp open  http    Werkzeug httpd 1.0.1 (Python 3.6.9)`
     this have `Werkzeug - Debug Shell Command Execution (Metasploit)` vulnerability.---