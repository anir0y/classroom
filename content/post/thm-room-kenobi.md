---
title: TryHackME Room Kenobi
date: 2021-06-10T21:22:32+05:30
lastmod: 2021-06-10T21:22:32+05:30
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
  - kenobi

draft: false
description: TryHackMe Room kenobi solved by Animesh Roy. this is a walkthrough. read more...

---
## kenobi

## Task 01 : Deploy the vulnerable machine

|Flag-ID|question|
|:--|---|
|1|Make sure you're connected to our network and deploy the machine|
|2|Scan the machine with nmap, how many ports are open?|
||![img](https://i.imgur.com/eHy08jQ.png)|

---

## Task 02: Enumerating Samba for shares

![samba](https://i.imgur.com/O8S93Kr.png)

#### cheat sheet 

- `nmap -p 445 --script=smb-enum-shares.nse,smb-enum-users.nse [IP]`
- `smbclient //<ip>/anonymous` 
  - ![img](https://i.imgur.com/B1FXBt8.png)
- `smbget -R smb://<ip>/anonymous #recursive download files` 
- `nmap -p 111 --script=nfs-ls,nfs-statfs,nfs-showmount 10.10.233.45 #show mounts`

|Flag-ID|question|
|:--|---|
|1|Using the nmap command above, how many shares have been found?|
||`3`|
|2|Once you're connected, list the files on the share. What is the file can you see?|
|[ref](#flag-22)|![img](https://i.imgur.com/70LFnVH.png)|
|3|What port is FTP running on?|
|[ref](#flag-23)| `21`|
|4|What mount can we see?|
|[ref](#flag-24)|`/var`|


### Flag-2.2

anonymous auth is enbled, just hit enter when it askes for password.

### Flag-2.3

* Step 1: Download log file
  ![img](https://i.imgur.com/SdpeLxi.png)
* Step 2: read the `log.txt` to find `FTP config`
  ![img](https://i.imgur.com/DujtB8I.png)
  
### Flag-2.4

![ProFtpd](https://i.imgur.com/wtzUBeU.png)

---

---

## Task 04: Gain initial access with ProFtpd

![](https://i.imgur.com/L54MBzX.png)

|Flag-ID|question|
|:--|---|
|1|What is the version?|
|[ref](#flag-31)| `1.3.5`|
|2|How many exploits are there for the ProFTPd running?|
|[ref](#flag-32)|`3`|
|3|We know that the FTP service is running as the Kenobi user (from the file on the share) and an ssh key is generated for that user. |
||`n\a`|
|4|We knew that the /var directory was a mount we could see (task 2, question 4). So we've now moved Kenobi's private key to the /var/tmp directory.|
||`n\a`|
|5|What is Kenobi's user flag (/home/kenobi/user.txt)?|
||`d0b0f3f53b6caa532a83915e19224899`|

### Flag-3.1

```zsh
┌─[anir0y@thm]─[~/share/thm/room/kenobi]
└──╼ $cat nmap/kenobi 
# Nmap 7.91 scan initiated Thu Jun 10 21:19:17 2021 as: nmap -sC -sV -oN kenobi 10.10.233.45
Nmap scan report for 10.10.233.45
Host is up (0.20s latency).
Not shown: 993 closed ports
PORT     STATE SERVICE     VERSION
21/tcp   open  ftp         `ProFTPD 1.3.5`
```

### Flag-3.2

![img](https://i.imgur.com/7q0pmef.png)

---

## Task 04:  Privilege Escalation with Path Variable Manipulation

![suid](https://i.imgur.com/LN2uOCJ.png)

 

|Flag-ID|question|
|:--|---|
|1|What file looks particularly out of the ordinary?|
||`/usr/bin/menu`|
|2|Run the binary, how many options appear?|
||`3`|
|3|We copied the /bin/sh shell, called it curl, gave it the correct permissions and then put its location in our path. This meant that when the /usr/bin/menu binary was run, its using our path variable to find the "curl" binary.. Which is actually a version of /usr/sh, as well as this file being run as root it runs our shell as root!|
||`n\a`|
|4|What is the root flag (/root/root.txt)?|
||`177b3cd8562289f37382721c28381f02`|---
