---
title: Try Hack Me Web Scanning
date: 2021-07-14T14:00:45+05:30
lastmod: 2021-07-14T14:00:45+05:30
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
  - rpwebscanning
  - web scanning

draft: false
description: "TryHackMe Web Scanning walkthrough — exploit web application vulnerabilities and practice common web attack techniques."
---
## Overview

Learn the basics of automated web scanning!

Web scanning represents one of the core constructs of modern pen testing. Quite simply, most of what we interact with on a daily basis is the internet, and therein there is a multitude of ever-widening number of vulnerabilities. Within this room, we will investigate two of the most common scanners: Nikto and Zap.

|Web Scanning| |
|---|---|
| ![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/55be0345f15c6d622f2dab4e9b2ec8da.png)|[![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/55be0345f15c6d622f2dab4e9b2ec8da.png)](https://tryhackme.com/room/rpwebscanning)|
|Solved by| [@anir0y](https://anir0y.in)|

---

## Task 01: Pull the lever, Kronk

---

## Task 02: ...I'm supposed to scan with that?

A short quiz over the various switches used with Nikto as well as a quick scan against our target. All you'll need for this is the help menu for nikto. Include all parts of the switch unless otherwise specified, this includes

### help

```bash
root@ip-10-10-80-133:~# nikto -H

   Options:
       -ask+               Whether to ask about submitting updates
                               yes   Ask about each (default)
                               no    Dont ask, dont send
                               auto  Dont ask, just send
       -Cgidirs+           Scan these CGI dirs: "none", "all", or values like "/cgi/ /cgi-a/"
       -config+            Use this config file
       -Display+           Turn on/off display outputs:
                               1     Show redirects
                               2     Show cookies received
                               3     Show all 200/OK responses
                               4     Show URLs which require authentication
                               D     Debug output
                               E     Display all HTTP errors
                               P     Print progress to STDOUT
                               S     Scrub output of IPs and hostnames
                               V     Verbose output
       -dbcheck           Check database and other key files for syntax errors
       -evasion+          Encoding technique:
                               1     Random URI encoding (non-UTF8)
                               2     Directory self-reference (/./)
                               3     Premature URL ending
                               4     Prepend long random string
                               5     Fake parameter
                               6     TAB as request spacer
                               7     Change the case of the URL
                               8     Use Windows directory separator (\)
                               A     Use a carriage return (0x0d) as a request spacer
                               B     Use binary value 0x0b as a request spacer
        -Format+           Save file (-o) format:
                               csv   Comma-separated-value
                               htm   HTML Format
                               msf+  Log to Metasploit
                               nbe   Nessus NBE format
                               txt   Plain text
                               xml   XML Format
                               (if not specified the format will be taken from the file extension passed to -output)
       -Help              Extended help information
       -host+             Target host
       -IgnoreCode        Ignore Codes--treat as negative responses
       -id+               Host authentication to use, format is id:pass or id:pass:realm
       -key+              Client certificate key file
       -list-plugins      List all available plugins, perform no testing
       -maxtime+          Maximum testing time per host
       -mutate+           Guess additional file names:
                               1     Test all files with all root directories
                               2     Guess for password file names
                               3     Enumerate user names via Apache (/~user type requests)
                               4     Enumerate user names via cgiwrap (/cgi-bin/cgiwrap/~user type requests)
                               5     Attempt to brute force sub-domain names, assume that the host name is the parent domain
                               6     Attempt to guess directory names from the supplied dictionary file
       -mutate-options    Provide information for mutates
       -nointeractive     Disables interactive features
       -nolookup          Disables DNS lookups
       -nossl             Disables the use of SSL
       -no404             Disables nikto attempting to guess a 404 page
       -output+           Write output to this file ('.' for auto-name)
       -Pause+            Pause between tests (seconds, integer or float)
       -Plugins+          List of plugins to run (default: ALL)
       -port+             Port to use (default 80)
       -RSAcert+          Client certificate file
       -root+             Prepend root value to all requests, format is /directory
       -Save              Save positive responses to this directory ('.' for auto-name)
       -ssl               Force ssl mode on port
       -Tuning+           Scan tuning:
                               1     Interesting File / Seen in logs
                               2     Misconfiguration / Default File
                               3     Information Disclosure
                               4     Injection (XSS/Script/HTML)
                               5     Remote File Retrieval - Inside Web Root
                               6     Denial of Service
                               7     Remote File Retrieval - Server Wide
                               8     Command Execution / Remote Shell
                               9     SQL Injection
                               0     File Upload
                               a     Authentication Bypass
                               b     Software Identification
                               c     Remote Source Inclusion
                               x     Reverse Tuning Options (i.e., include all except specified)
       -timeout+          Timeout for requests (default 10 seconds)
       -Userdbs           Load only user databases, not the standard databases
                               all   Disable standard dbs and load only user dbs
                               tests Disable only db_tests and load udb_tests
       -until             Run until the specified time or duration
       -update            Update databases and plugins from CIRT.net
       -useproxy          Use the proxy defined in nikto.conf
       -Version           Print plugin and database versions
       -vhost+            Virtual host (for Host header)
   		+ requires a value

```

### 2.1

First and foremost, what switch do we use to set the target host?

- `-h` ; nikto -h (h is for host) 
- ref [help](#help)

### 2.2

Websites don't always properly redirect to their secure transport port and can sometimes have different issues depending on the manner in which they are scanned. How do we disable secure transport?

- `-nossl`
- ref [help](#help)
  
### 2.3

How about the opposite, how do we force secure transport?

- `-ssl`
- ref [help](#help)

### 2.4

What if we want to set a specific port to scan?

- `-p` or `-port`
- ref [help](#help)

### 2.5

As the web is constantly evolving, so is Nikto. A database of vulnerabilities represents a core component to this web scanner, how do we verify that this database is working and free from error?

- `-dbcheck`
- ref [help](#help)

### 2.6

If instructed to, Nikto will attempt to guess and test both files within directories as well as usernames. Which switch and numerical value do we use to set Nikto to enumerate usernames in Apache? Keep in mind, this option is deprecated in favor of plugins, however, it's still a great option to be aware of for situational usage.

- `-mutate 3`
  ![nikto-plugin](https://i.imgur.com/3k7Jk7L.png)

### 2.7

Suppose we know the username and password for a web forum, how do we set Nikto to do a credentialed check? Suppose the username is admin and the password is PrettyAwesomePassword1234

- `-id admin:PrettyAwesomePassword1234`
- ref [here](#help)
  
### 2.8

Let's scan our target machine, what web server do we discover and what version is it?

```zsh
- Nikto v2.1.5
---------------------------------------------------------------------------
+ Target IP:          10.10.147.152
+ Target Hostname:    ip-10-10-147-152.eu-west-1.compute.internal
+ Target Port:        80
+ Start Time:         2021-07-14 09:57:30 (GMT1)
---------------------------------------------------------------------------
+ Server: Apache/2.4.7 (Ubuntu)
+ Cookie PHPSESSID created without the httponly flag
+ Retrieved x-powered-by header: PHP/5.5.9-1ubuntu4.26
+ The anti-clickjacking X-Frame-Options header is not present.
+ Root page / redirects to: login.php
+ No CGI Directories found (use '-C all' to force check all possible dirs)
+ Server leaks inodes via ETags, header found with file /robots.txt, fields: 0x1a 0x5775a354caa9f 
+ File/dir '/' in robots.txt returned a non-forbidden or redirect HTTP code (302)
+ "robots.txt" contains 1 entry which should be manually viewed.
+ OSVDB-3268: /config/: Directory indexing found.
+ /config/: Configuration information may be available remotely.
+ OSVDB-3268: /docs/: Directory indexing found.
+ OSVDB-3233: /icons/README: Apache default file found.
+ /login.php: Admin login page/section found.
+ 6544 items checked: 0 error(s) and 11 item(s) reported on remote host
+ End Time:           2021-07-14 09:57:39 (GMT1) (9 seconds)
---------------------------------------------------------------------------
+ 1 host(s) tested
```

### 2.9

This box is vulnerable to very poor directory control due to it's web server version, what directory is indexed that really shouldn't be?

- `config`
- ref to [2.8](#28)

### 2.10

Nikto scans can take a while to fully complete, which switch do we set in order to limit the scan to end at a certain time?

- `-until` [ref](#help)
  
### 2.11

But wait, there's more! How do we list all of the plugins are available?

- `-list-plugins` [ref](#help)

### 2.12

On the flip-side of the database, plugins represent another core component to Nikto. Which switch do we use to instruct Nikto to use plugin checks to find out of date software on the target host? Keep in mind that when testing this command we need to specify the host we intend to run this against. For submitting your answer, use only the base command with the out of date option.

- `Plugins outdated`
- a google search helps

### 2.13

Finally, what if we'd like to use our plugins to run a series of standard tests against the target host?

- `Plugins tests`
- nikto [help](#help)---

## Task 03: Zip ZAP

A brief quiz and tutorial over using the OWASP Zap Scanner

### 3.1

### 3.2

Launch ZAP, what option to we set in order to specify what we are attacking?

- `URL to attack`
- zap Menu

### 3.3

### 3.4

ZAP will discover a file that typically contains pages which well-behaved web indexing engines will read in order to know which sections of a site to avoid. What is the name of this file? (Lucky for us, our scanner isn't what we would call 'well-behaved'!)

- `robots.txt`
  ![zap](https://i.imgur.com/kBXdeDB.png)

### 3.5

One entry is included in the disallow section of this file, what is it?

- `/`

     ```zsh
     root@ip-10-10-80-133:~# curl 10.10.147.152/robots.txt ; echo 
     User-agent: *
     Disallow: /
     ```

### 3.6

ZAP will find a directory that contains images for our application, what is the path for that directory? (This is what will follows the name/ip of the website)

- 
  ![img](https://i.imgur.com/gHeEHyQ.png)

### 3.7

This website doesn't force a secure connection by default and ZAP isn't pleased with it. Which related cookie is ZAP upset about?

- img
  ![httponly](https://i.imgur.com/XHvY0uw.png)

### 3.8

Featured in various rooms on TryHackMe, Cross-Site Scripting is a vicious attack that is becoming ever more common on the open web. What Alert does ZAP produce to let us know that this site is vulnerable to XSS? Note, there are often a couple warnings produced for this, look for one more so directly related to the web client.

- `Web Browser XSS Protection Not Enabled`

### 3.9

The ZAP proxy spider represents the component responsible for 'crawling' the site. What site is found to be out of scope?

- `http://wwww.dvwa.co.uk`
  
### 3.10

ZAP will use primarily two methods in order to scan a website, which of these two HTTP methods requests content?

- `GET`

### 3.11

Which option attempts to submit content to the website?

- `POST`