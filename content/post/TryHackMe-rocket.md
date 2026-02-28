---
title: TryHackMe Rocket
date: 2021-07-24T15:36:15+05:30
lastmod: 2021-07-24T15:36:15+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
featureimage: img/thm.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm
  - rocket

draft: true
description: "TryHackMe Rocket walkthrough — Get ready for blast off!."
---

## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Rocket|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/5fde7f214fbcd710f5fadb13f81ebdd5.png)|
|room [Subscription Required]| [Rocket](https://tryhackme.com/room/rocket)|

---

## task 01:  Deploy the machine

Perform a penetration test against the target host to retrieve the user.txt and root.txt files.

---

## Task 02: Compromise the target

### Recon

- nmap

```bash
sudo nmap -sC -sV -oN nmap/init 10.10.5.63
[sudo] password for anir0y: 
Starting Nmap 7.91 ( https://nmap.org ) at 2021-07-24 15:43 IST
Nmap scan report for 10.10.5.63
Host is up (0.15s latency).
Not shown: 998 closed ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 b5:20:37:9f:99:b2:4f:23:ba:3a:43:60:b7:45:c8:62 (RSA)
|   256 12:77:83:03:1f:64:bb:40:5d:bf:2c:48:e2:5a:b5:18 (ECDSA)
|_  256 74:7c:e6:07:78:fc:fd:45:1d:e8:2b:d5:02:66:8e:cd (ED25519)
80/tcp open  http    Apache httpd 2.4.29
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: Did not follow redirect to http://rocket.thm
Service Info: Host: rocket.thm; OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 14.40 seconds

```

- _Hostname:_ rocket.thm add this to `/etc/hosts` file.

- website:
  
  ![img](https://i.imgur.com/7CuZgIy.png)

- GoBuster for directory searching
  
  `gobuster dir -u http://rocket.thm -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -o rocker-root.gobuster`

  _nothing useful_

- poking around with `dev tools` reveals this is a [bolt CMS](https://boltcms.io/)
- admin login page: `http://rocket.thm/bolt/login` based on `Bold CMS` documentation.
- we do have username/email list but no password. let's see if this one have any public exploit/vulnerability listes.---