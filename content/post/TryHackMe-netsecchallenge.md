---
title: Try Hack Me Net Sec Challenge
date: 2021-10-18T13:50:55+05:30
lastmod: 2021-10-18T13:50:55+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
featureimage: img/netsecchallenge.gif
simg: /img/netsecchallenge.gif

categories:
  - TryHackMe
tags:
  - tryhackme

draft: false
description: "TryHackMe Net Sec Challenge walkthrough with step-by-step solutions — enumeration, exploitation, and privilege escalation on the Net Sec Challenge challenge room."
---

## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Net Sec Challenge|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/5a1f33f79fce3569a2bc247468713c93.png)|
| <b> Net Sec Challenge [Subscription Required] </b>| [Net Sec Challenge](https://tryhackme.com/room/netsecchallenge)|

---

## Task 01: Introduction

Use this challenge to test your mastery of the skills you have acquired in the Network Security module. All the questions in this challenge can be solved using only `nmap`, `telnet`, and `hydra`.

* start the VM

---

## Task 02: Challenge Questions

### Answer the questions below

|Question|Answer|
|---|---|
|What is the highest port number being open less than 10,000?|[port](#nmap-all-ports)|
|There is an open port outside the common 1000 ports; it is above 10,000. What is it?|[over 10000](#port-over-10000)|
|How many TCP ports are open?||
|What is the flag hidden in the HTTP server header?|[header](#http-server-header)|
|What is the flag hidden in the SSH server header?|[ssh-server](#ssh-server-header)|
|We have an FTP server listening on a nonstandard port. What is the version of the FTP server?|[ftp](#ftp)|
|We learned two usernames using social engineering: eddie and quinn. What is the flag hidden in one of these two account files and accessible via FTP?|[hydra](#hydra)|
|Browsing to http://MACHINE_IP displays a small challenge that will give you a flag once you solve it. What is the flag?|[covert-nmap](#covert-nmap)|---

## recon

### Nmap

### nmap-all-ports

![img](https://i.imgur.com/cIgqf6F.png)

## port-over-10000

![img](https://i.imgur.com/lwXQI9D.png)

## TCP-Port

scan results total port number :)

## HTTP server header

![img](https://i.imgur.com/MUvFlUN.png)

## SSH server header

We do not have any credentails to login. anyways it says on header, let's just print ssh banner/header using `ssh -v` flag.

     ```bash
     ssh -v MACHINE_IP
     OpenSSH_7.6p1 Ubuntu-4ubuntu0.3, OpenSSL 1.0.2n  7 Dec 2017
     debug1: Reading configuration data /etc/ssh/ssh_config
     debug1: /etc/ssh/ssh_config line 19: Applying options for *
     ...[snip]...
     debug1: match: OpenSSH_8.2p1 'THM{flag-was-here}' pat OpenSSH* compat 0x04000000
     debug1: Authenticating to 10.10.206.83:22 as 'root'
     ...[snip]...
     debug1: No more authentication methods to try.
     root@10.10.206.83: Permission denied (publickey).
     ```

## FTP

![img](https://i.imgur.com/l4fcMBU.png)

## Hydra

* save usernames to a file `usr` and use `/usr/share/wordlists/rockyou.txt` as password file
* hydra command:

     ```bash
     hydra -L usr -P /usr/share/wordlists/rockyou.txt ftp://10.10.206.83:10021
     ```

* creds
  
     ![img](https://i.imgur.com/r8f6x1p.png)

* flag

     ![img](https://i.imgur.com/atK4kO7.png)

## covert-Nmap

`nmap -sN MACHINE_IP`

![img](https://i.imgur.com/BHgtX0Y.png)