---
title: TryHackMe Ffuf
date: 2021-07-17T02:49:02+05:30
lastmod: 2021-07-17T02:49:02+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
#cover: /img/blog.png
cover: /img/thm.gif # for tryhackMe

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm
  - ffuf

draft: false
description: TryHackMe Room ffuf solved by Animesh Roy. this is a walkthough. ffuf stands for Fuzz Faster U Fool. It's a tool used for web enumeration, fuzzing, and directory brute forcing...

---
## overview

|fuff||
|--|--|
||![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/b197813dc74d88fa2a6df2c128ff155c.png)|
|room | [Link](https://tryhackme.com/room/ffuf)|

---

## task 01: Introduction

### Summary

ffuf stands for Fuzz Faster U Fool. It's a tool used for web enumeration, fuzzing, and directory brute forcing.

### Install ffuf

ffuf is already included in the following Linux distributions:

- BlackArch
- Pentoo
- Kali
- Parrot

### Install SecLists

SecLists is a collection of multiple types of lists used during security assessments. List types include usernames, passwords, URLs, sensitive data patterns, fuzzing payloads, web shells, and many more.

## task 02: Basics

The Help page can be displayed using `ffuf -h` and it will be useful as we will use a lot of options.

```bash
Fuzz Faster U Fool - v1.3.0-dev

HTTP OPTIONS:
  -H                  Header `"Name: Value"`, separated by colon. Multiple -H flags are accepted.
  -X                  HTTP method to use
  -b                  Cookie data `"NAME1=VALUE1; NAME2=VALUE2"` for copy as curl functionality.
  -d                  POST data
  -ignore-body        Do not fetch the response content. (default: false)
  -r                  Follow redirects (default: false)
  -recursion          Scan recursively. Only FUZZ keyword is supported, and URL (-u) has to end in it. (default: false)
  -recursion-depth    Maximum recursion depth. (default: 0)
  -recursion-strategy Recursion strategy: "default" for a redirect based, and "greedy" to recurse on all matches (default: default)
  -replay-proxy       Replay matched requests using this proxy.
  -timeout            HTTP request timeout in seconds. (default: 10)
  -u                  Target URL
  -x                  Proxy URL (SOCKS5 or HTTP). For example: http://127.0.0.1:8080 or socks5://127.0.0.1:8080

GENERAL OPTIONS:
  -V                  Show version information. (default: false)
  -ac                 Automatically calibrate filtering options (default: false)
  -acc                Custom auto-calibration string. Can be used multiple times. Implies -ac
  -c                  Colorize output. (default: false)
  -config             Load configuration from a file
  -maxtime            Maximum running time in seconds for entire process. (default: 0)
  -maxtime-job        Maximum running time in seconds per job. (default: 0)
  -p                  Seconds of `delay` between requests, or a range of random delay. For example "0.1" or "0.1-2.0"
  -rate               Rate of requests per second (default: 0)
  -s                  Do not print additional information (silent mode) (default: false)
  -sa                 Stop on all error cases. Implies -sf and -se. (default: false)
  -se                 Stop on spurious errors (default: false)
  -sf                 Stop when > 95% of responses return 403 Forbidden (default: false)
  -t                  Number of concurrent threads. (default: 40)
  -v                  Verbose output, printing full URL and redirect location (if any) with the results. (default: false)

MATCHER OPTIONS:
  -mc                 Match HTTP status codes, or "all" for everything. (default: 200,204,301,302,307,401,403,405)
  -ml                 Match amount of lines in response
  -mr                 Match regexp
  -ms                 Match HTTP response size
  -mw                 Match amount of words in response

FILTER OPTIONS:
  -fc                 Filter HTTP status codes from response. Comma separated list of codes and ranges
  -fl                 Filter by amount of lines in response. Comma separated list of line counts and ranges
  -fr                 Filter regexp
  -fs                 Filter HTTP response size. Comma separated list of sizes and ranges
  -fw                 Filter by amount of words in response. Comma separated list of word counts and ranges

INPUT OPTIONS:
  -D                  DirSearch wordlist compatibility mode. Used in conjunction with -e flag. (default: false)
  -e                  Comma separated list of extensions. Extends FUZZ keyword.
  -ic                 Ignore wordlist comments (default: false)
  -input-cmd          Command producing the input. --input-num is required when using this input method. Overrides -w.
  -input-num          Number of inputs to test. Used in conjunction with --input-cmd. (default: 100)
  -input-shell        Shell to be used for running command
  -mode               Multi-wordlist operation mode. Available modes: clusterbomb, pitchfork (default: clusterbomb)
  -request            File containing the raw http request
  -request-proto      Protocol to use along with raw request (default: https)
  -w                  Wordlist file path and (optional) keyword separated by colon. eg. '/path/to/wordlist:KEYWORD'

OUTPUT OPTIONS:
  -debug-log          Write all of the internal logging to the specified file.
  -o                  Write output to file
  -od                 Directory path to store matched results to.
  -of                 Output file format. Available formats: json, ejson, html, md, csv, ecsv (or, 'all' for all formats) (default: json)
  -or                 Don't create the output file if we don't have results (default: false)
```

At a minimum we're required to supply two options: -u to specify an URL and -w to specify a wordlist. The default keyword FUZZ is used to tell ffuf where the wordlist entries will be injected. We can append it to the end of the URL like so:

`ffuf -u http://10.10.62.131/FUZZ -w /usr/share/seclists/Discovery/Web-Content/big.txt`

You could also use any custom keyword instead of `FUZZ`, you just need to define it like this `wordlist.txt:KEYWORD`.

`ffuf -u http://10.10.62.131/NORAJ -w /usr/share/seclists/Discovery/Web-Content/big.txt:NORAJ`

### 2.1

What is the first file you found with a 200 status code?

command I ran:

```bash
ffuf -u http://10.10.62.131/FUZZ -w Tools/wordlists/SecLists/Discovery/Web-Content/big.txt 

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v1.3.1
________________________________________________

 :: Method           : GET
 :: URL              : http://10.10.62.131/FUZZ
 :: Wordlist         : FUZZ: Tools/wordlists/SecLists/Discovery/Web-Content/big.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200,204,301,302,307,401,403,405
________________________________________________

.htpasswd               [Status: 403, Size: 288, Words: 21, Lines: 11]
.htaccess               [Status: 403, Size: 288, Words: 21, Lines: 11]
config                  [Status: 301, Size: 312, Words: 20, Lines: 10]
docs                    [Status: 301, Size: 310, Words: 20, Lines: 10]
external                [Status: 301, Size: 314, Words: 20, Lines: 10]
[flag-here]             [Status: 200, Size: 1406, Words: 5, Lines: 2]
robots.txt              [Status: 200, Size: 26, Words: 3, Lines: 2]
server-status           [Status: 403, Size: 292, Words: 21, Lines: 11]
:: Progress: [20473/20473] :: Job [1/1] :: 3717 req/sec :: Duration: [0:00:10] :: Errors: 0 ::
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

## task 03: Finding pages and directories

One approach you could take would be to start enumerating with a generic list of files such as raft-medium-files-lowercase.txt.

> `ffuf -u http://10.10.62.131/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-files-lowercase.txt`

However, using a large generic wordlist containing irrelevant file extensions is not very efficient.

Instead, we can usually assume `index.<extension>` is the default page on most websites so we can try common extensions for just the index page. With this method, we can usually determine what programming language or languages the site uses.

For example, we can append the extension after index.

```
head /usr/share/seclists/Discovery/Web-Content/web-extensions.txt                                                            
.asp
.aspx
.bat
.c
.cfm
.cgi
.css
.com
.dll
.exe
```

> `ffuf -u http://10.10.62.131/indexFUZZ -w /usr/share/seclists/Discovery/Web-Content/web-extensions.txt`

Now that we know the extensions supported we can try a list of generic words (without of extension) and apply the extensions we know works (found from Q2) + some common ones like `.txt`.

We'll exclude the 4 letter extensions from this wordlist as it will result in many false positives.

> `ffuf -u http://10.10.62.131/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-words-lowercase.txt -e .php,.txt`

Directory names are not always dependent on the type of environment you're enumerating and is often a good starting point before attempting to fuzz for files. If we wanted to fuzz directories we only need to provide a wordlist.

> `ffuf -u http://10.10.62.131/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories-lowercase.txt`

### 3.1

What text file did you find?

```bash
ffuf -u http://10.10.62.131/FUZZ -w Tools/wordlists/SecLists/Discovery/Web-Content/raft-medium-files-lowercase.txt

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v1.3.1
...[snip]...

robots.txt              [Status: 200, Size: 26, Words: 3, Lines: 2]
...[snip]...
```

### 3.2

What two file extensions were found for the index page?

```bash
ffuf -u http://10.10.62.131/indexFUZZ -w Tools/wordlists/SecLists/Discovery/Web-Content/web-extensions.txt

...[snip]...
________________________________________________

.phps                   [Status: 403, Size: 289, Words: 21, Lines: 11]
.php                    [Status: 302, Size: 0, Words: 1, Lines: 1]

```

### 3.3

What page has a size of 4840?

```bash
ffuf -u http://10.10.62.131/FUZZ -w Tools/wordlists/SecLists/Discovery/Web-Content/raft-medium-words-lowercase.txt -e .php,.txt

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v1.3.1
________________________________________________

...[snip]...
about.php               [Status: 200, Size: 4840, Words: 331, Lines: 109]
...[snip]...
```

### 3.4

How many directories are there?

```bash
ffuf -u http://10.10.62.131/FUZZ -w Tools/wordlists/SecLists/Discovery/Web-Content/raft-medium-directories-lowercase.txt
...[snip]...
docs                    [Status: 301, Size: 310, Words: 20, Lines: 10]
config                  [Status: 301, Size: 312, Words: 20, Lines: 10]
external                [Status: 301, Size: 314, Words: 20, Lines: 10]
server-status           [Status: 403, Size: 292, Words: 21, Lines: 11]
...[snip]...
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

## task 04: Using filters

Remember the command we ran for Q1 of Task 3?

```zsh
$ ffuf -u http://MACHINE_IP/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-files-lowercase.txt

        /'___\  /'___\           /'___\
       /\ \__/ /\ \__/  __  __  /\ \__/
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/
         \ \_\   \ \_\  \ \____/  \ \_\
          \/_/    \/_/   \/___/    \/_/

       v1.3.1-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://10.10.130.176/FUZZ
 :: Wordlist         : FUZZ: /usr/share/seclists/Discovery/Web-Content/raft-medium-files-lowercase.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200,204,301,302,307,401,403,405
________________________________________________

favicon.ico             [Status: 200, Size: 1406, Words: 5, Lines: 2]
.htaccess               [Status: 403, Size: 289, Words: 21, Lines: 11]
logout.php              [Status: 302, Size: 0, Words: 1, Lines: 1]
robots.txt              [Status: 200, Size: 26, Words: 3, Lines: 2]
phpinfo.php             [Status: 302, Size: 0, Words: 1, Lines: 1]
.                       [Status: 302, Size: 0, Words: 1, Lines: 1]
php.ini                 [Status: 200, Size: 148, Words: 17, Lines: 5]
about.php               [Status: 200, Size: 4840, Words: 331, Lines: 109]
.html                   [Status: 403, Size: 285, Words: 21, Lines: 11]
login.php               [Status: 200, Size: 1523, Words: 89, Lines: 77]
.php                    [Status: 403, Size: 284, Words: 21, Lines: 11]
setup.php               [Status: 200, Size: 4067, Words: 308, Lines: 123]
.htpasswd               [Status: 403, Size: 289, Words: 21, Lines: 11]
security.php            [Status: 302, Size: 0, Words: 1, Lines: 1]
.htm                    [Status: 403, Size: 284, Words: 21, Lines: 11]
.htpasswds              [Status: 403, Size: 290, Words: 21, Lines: 11]
index.php               [Status: 302, Size: 0, Words: 1, Lines: 1]
.htgroup                [Status: 403, Size: 288, Words: 21, Lines: 11]
wp-forum.phps           [Status: 403, Size: 293, Words: 21, Lines: 11]
.htaccess.bak           [Status: 403, Size: 293, Words: 21, Lines: 11]
.htuser                 [Status: 403, Size: 287, Words: 21, Lines: 11]
.ht                     [Status: 403, Size: 283, Words: 21, Lines: 11]
.htc                    [Status: 403, Size: 284, Words: 21, Lines: 11]
:: Progress: [16243/16243] :: Job [1/1] :: 1690 req/sec :: Duration: [0:00:13] :: Errors: 0 ::
```

We had a lot of output but not much was useful.
For example, a 403 HTTP status code indicates that we're forbidden to access the requested resource. Let's hide responses with 403 status codes for now. We can accomplish this by using filters.

By adding `-fc 403` (filter code) we'll hide from the output all 403 HTTP status codes.

> q1
>  
> `ffuf -u http://10.10.62.131/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-files-lowercase.txt -fc 403`

Sometimes you might want to filter out multiple status codes such as 500, 302, 301, 401, etc. For instance, if you know you want to see 200 status code responses, you could use `-mc 200` (match code) instead of having a long list of filtered codes.

> Q2
>  
> `ffuf -u http://10.10.62.131/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-files-lowercase.txt -mc 200`

Sometimes it might be beneficial to see what requests the server doesn't handle by matching for HTTP 500 Internal Server Error response codes (`-mc 500`). Finding irregularities in behavior could help better understand how the web app works.

There are other filters and matchers. For example, you could encounter entries with a 200 status code with a response size of zero. eg. `functions.php` or `inc/myfile.php`.

```zsh
$ ffuf -u http://MACHINE_IP/config/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-files-lowercase.txt -fc 403
...
.                       [Status: 200, Size: 1165, Words: 76, Lines: 18]
config.inc.php          [Status: 200, Size: 0, Words: 1, Lines: 1]
:: Progress: [16243/16243] :: Job [1/1] :: 1732 req/sec :: Duration: [0:00:13] :: Errors: 0 ::
```

Unless we have a LFI (local file inclusion) this kind of files aren't interesting, so we can use `-fs 0` (filter size).

Here are all filters and matchers:

```bash
$ ffuf -h
...
MATCHER OPTIONS:
  -mc                 Match HTTP status codes, or "all" for everything. (default: 200,204,301,302,307,401,403,405)
  -ml                 Match amount of lines in response
  -mr                 Match regexp
  -ms                 Match HTTP response size
  -mw                 Match amount of words in response

FILTER OPTIONS:
  -fc                 Filter HTTP status codes from response. Comma separated list of codes and ranges
  -fl                 Filter by amount of lines in response. Comma separated list of line counts and ranges
  -fr                 Filter regexp
  -fs                 Filter HTTP response size. Comma separated list of sizes and ranges
  -fw                 Filter by amount of words in response. Comma separated list of word counts and ranges
```

We often see there are false positives with files beginning with a dot (eg. .htgroups,.php, etc.). They throw a 403 Forbidden error, however those files don't actually exist. It's tempting to use `-fc 403` but this could hide valuable files we don't have access to yet. So instead we can use a regexp to match all files beginning with a dot

> Q3
>  
> `ffuf -u http://10.10.62.131/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-files-lowercase.txt -fr '/\..*'`

### 4.1

After applying the fc filter, how many results were returned?

```zsh
ffuf -u http://10.10.62.131/FUZZ -w Tools/wordlists/SecLists/Discovery/Web-Content/raft-medium-files-lowercase.txt -fc 403


index.php               [Status: 302, Size: 0, Words: 1, Lines: 1]
favicon.ico             [Status: 200, Size: 1406, Words: 5, Lines: 2]
logout.php              [Status: 302, Size: 0, Words: 1, Lines: 1]
robots.txt              [Status: 200, Size: 26, Words: 3, Lines: 2]
phpinfo.php             [Status: 302, Size: 0, Words: 1, Lines: 1]
.                       [Status: 302, Size: 0, Words: 1, Lines: 1]
php.ini                 [Status: 200, Size: 148, Words: 17, Lines: 5]
about.php               [Status: 200, Size: 4840, Words: 331, Lines: 109]
login.php               [Status: 200, Size: 1523, Words: 89, Lines: 77]
setup.php               [Status: 200, Size: 4066, Words: 308, Lines: 123]
security.php            [Status: 302, Size: 0, Words: 1, Lines: 1]
:: Progress: [16243/16243] :: Job [1/1] :: 147 req/sec :: Duration: [0:00:04] :: Errors: 0 ::
```

### 4.2

After applying the mc filter, how many results were returned?

```zsh
ffuf -u http://10.10.62.131/FUZZ -w Tools/wordlists/SecLists/Discovery/Web-Content/raft-medium-files-lowercase.txt -mc 200

favicon.ico             [Status: 200, Size: 1406, Words: 5, Lines: 2]
robots.txt              [Status: 200, Size: 26, Words: 3, Lines: 2]
php.ini                 [Status: 200, Size: 148, Words: 17, Lines: 5]
about.php               [Status: 200, Size: 4840, Words: 331, Lines: 109]
setup.php               [Status: 200, Size: 4066, Words: 308, Lines: 123]
login.php               [Status: 200, Size: 1523, Words: 89, Lines: 77]
```

### 4.3

Which valuable file would have been hidden if you used -fc 403 instead of -fr?

```zsh
ffuf -u http://10.10.62.131/FUZZ -w Tools/wordlists/SecLists//Discovery/Web-Content/raft-medium-files-lowercase.txt -fr '/\..*'

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v1.3.1
________________________________________________
wp-forum.phps           [Status: 403, Size: 292, Words: 21, Lines: 11]
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

## task 05: Fuzzing parameters

Discovering a vulnerable parameter could lead to file inclusion, path disclosure, XSS, SQL injection, or even command injection. Since ffuf allows you to put the keyword anywhere we can use it to fuzz for parameters.

> Command for Q1
> 
     $ ffuf -u 'http://MACHINE_IP/sqli-labs/Less-1/?FUZZ=1' -c -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt -fw 39
     $ ffuf -u 'http://MACHINE_IP/sqli-labs/Less-1/?FUZZ=1' -c -w /usr/share/seclists/Discovery/Web-Content/raft-medium-words-lowercase.txt -fw 39

Now that we found a parameter accepting integer values we'll start fuzzing values.

At this point, we could generate a wordlist and save a file containing integers. To cut out a step we can use -w - which tells ffuf to read a wordlist from stdout. This will allow us to generate a list of integers with a command of our choice then pipe the output to ffuf. Below is a list of 5 different ways to generate numbers 0 - 255.

> Commands for Q2

     $ ruby -e '(0..255).each{|i| puts i}' | ffuf -u 'http://MACHINE_IP/sqli-labs/Less-1/?id=FUZZ' -c -w - -fw 33
     $ ruby -e 'puts (0..255).to_a' | ffuf -u 'http://MACHINE_IP/sqli-labs/Less-1/?id=FUZZ' -c -w - -fw 33
     $ for i in {0..255}; do echo $i; done | ffuf -u 'http://MACHINE_IP/sqli-labs/Less-1/?id=FUZZ' -c -w - -fw 33
     $ seq 0 255 | ffuf -u 'http://MACHINE_IP/sqli-labs/Less-1/?id=FUZZ' -c -w - -fw 33
     $ cook '[0-255]' | ffuf -u 'http://MACHINE_IP/sqli-labs/Less-1/?id=FUZZ' -c -w - -fw 33

We can also use ffuf for wordlist-based brute-force attacks, for example, trying passwords on an authentication page.

> Command for Q3

     $ ffuf -u http://10.10.71.46/sqli-labs/Less-11/ -c -w /usr/share/seclists/Passwords/Leaked-Databases/hak5.txt -X POST -d 'uname=Dummy&passwd=FUZZ&submit=Submit' -fs 1435 -H 'Content-Type: application/x-www-form-urlencoded'

Here we have to use the POST method (specified with `-X`) and to give the POST data (with `-d`) where we include the `FUZZ` keyword in place of the password.

We also have to specify a custom header` -H 'Content-Type: application/x-www-form-urlencoded'` because ffuf doesn't set this content-type header automatically as curl does.

### 5.1

```bash
$ ffuf -u 'http://10.10.71.46/sqli-labs/Less-1/?FUZZ=1' -c -w Tools/wordlists/SecLists/Discovery/Web-Content/raft-medium-words-lowercase.txt -fw 39

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v1.3.1
________________________________________________

id                      [Status: 200, Size: 721, Words: 37, Lines: 29]
________________________________________________
```

### 5.2

What is the highest valid id?

```bash
ruby -e '(0..255).each{|i| puts i}' | ffuf -u 'http://10.10.71.46/sqli-labs/Less-1/?id=FUZZ' -c -w - -fw 33

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v1.3.1
________________________________________________


6                       [Status: 200, Size: 728, Words: 37, Lines: 29]
12                      [Status: 200, Size: 725, Words: 37, Lines: 29]
7                       [Status: 200, Size: 725, Words: 37, Lines: 29]
8                       [Status: 200, Size: 723, Words: 37, Lines: 29]
11                      [Status: 200, Size: 725, Words: 37, Lines: 29]
10                      [Status: 200, Size: 725, Words: 37, Lines: 29]
9                       [Status: 200, Size: 725, Words: 37, Lines: 29]
5                       [Status: 200, Size: 728, Words: 37, Lines: 29]
4                       [Status: 200, Size: 725, Words: 37, Lines: 29]
3                       [Status: 200, Size: 726, Words: 37, Lines: 29]
1                       [Status: 200, Size: 721, Words: 37, Lines: 29]
2                       [Status: 200, Size: 731, Words: 37, Lines: 29]
14                      [Status: 200, Size: 725, Words: 37, Lines: 29]
:: Progress: [256/256] :: Job [1/1] :: 16 req/sec :: Duration: [0:00:04] :: Errors: 0 ::
________________________________________________
```

### 5.3

What is Dummy's password?

```bash
# ffuf -u http://10.10.71.46/sqli-labs/Less-11/ -c -w Tools/wordlists/SecLists/Passwords/Leaked-Databases/hak5.txt -X POST -d 'uname=Dummy&passwd=FUZZ&submit=Submit' -fs 1435 -H 'Content-Type: application/x-www-form-urlencoded'

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v1.3.1
________________________________________________
p@ssword                [Status: 200, Size: 1526, Words: 100, Lines: 50]
:: Progress: [2351/2351] :: Job [1/1] :: 3743 req/sec :: Duration: [0:00:04] :: Errors: 0 ::
________________________________________________
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

## task 06: Finding vhosts and subdomains

ffuf may not be as efficient as specialized tools when it comes to subdomain enumeration but it's possible to do.

> Command for Q1
>  
> `$ ffuf -u http://FUZZ.tryhackme.com -c -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt`

Some subdomains might not be resolvable by the DNS server you're using and are only resolvable from within the target's local network by their private DNS servers. So some virtual hosts (vhosts) may exist with private subdomains so the previous command doesn't find them. To try finding private subdomains we'll have to use the Host HTTP header as these requests might be accepted by the web server.
Note: virtual hosts (vhosts) is the name used by Apache httpd but for Nginx the right term is Server Blocks

Compare the results you obtain with direct subdomain enumeration and with vhost enumeration:

> Commands for Q2
>  
> `$ ffuf -u http://FUZZ.google.com -c -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -fs 0`
> `$ ffuf -u http://google.com -c -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -H 'Host: FUZZ.google.com' -fs 0`

For example there is a subdomain aol.google.com you can't find it with direct subdomain enumeration (1st command) but that you can find with vhost enumeration (2nd command).

We can use drill or dig to find the IP address of the root domain:

```bash
$ drill google.com
...
google.com.     104     IN      A       216.58.204.110
...
```

If you enter this domain directly in your web browser or with curl, you won't be able to resolve it:

```bash
$ curl https://aol.google.com
curl: (6) Could not resolve host: aol.google.com
```

But now if you add it in `/etc/hosts` or force the resolution with curl you'll be able to browse it:

```zsh
$ curl --resolve aol.google.com:443:216.58.198.206 https://aol.google.com
<!doctype html><html itemscope="" itemtype="http://schema.org/WebPage" lang="fr">
...
```

Here the aol subdomain is not very interesting as it's an alias for www.google.com and other subdomains are redirecting aliases. However, you shouldn't discount this enumeration technique as it may lead to discovering content that wasn't meant to be accessed externally.

### 6.1

What is THMs private CDN subdomain?

```bash
# ffuf -u http://FUZZ.tryhackme.com -c -w Tools/wordlists/SecLists//Discovery/DNS/subdomains-top1million-5000.txt 

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v1.3.1
________________________________________________

...
assets                  [Status: 301, Size: 183, Words: 6, Lines: 8]
...
________________________________________________
```

What is the private domain you can find with vhost enumeration but not with direct subdomain enumeration?

```bash
# based on Hint, google.com is the domain to scan
# ffuf -u http://FUZZ.google.com -c -w Tools/wordlists/SecLists/Discovery/DNS/subdomains-top1million-5000.txt -fs 0 -v 
...
dev                   [Status: 301, Size: 223, Words: 9, Lines: 7]
...
```

---

## Task 07: Proxifying ffuf traffic

Whether it' for [network pivoting](https://blog.raw.pm/en/state-of-the-art-of-network-pivoting-in-2019/) or for using BurpSuite plugins you can send all the ffuf traffic through a web proxy (HTTP or SOCKS5).

```bash
ffuf -u http://10.10.71.46/ -c -w /usr/share/seclists/Discovery/Web-Content/common.txt -x http://127.0.0.1:8080
```

It's also possible to send only matches to your proxy for replaying:

```zsh
ffuf -u http://FUZZ.tryhackme.com -c -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -replay-proxy http://127.0.0.1:8080
```

---

## Task 08: Reviewing the options

As you start to use ffuf more, some options will prove to be very useful depending on your situation. For example, `-ic` allows you to ignore comments in wordlists that such as headers, copyright notes, comments, etc

```powrshell
$ head /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt                                                            
# directory-list-2.3-medium.txt
#
# Copyright 2007 James Fisher
#
# This work is licensed under the Creative Commons
# Attribution-Share Alike 3.0 License. To view a copy of this
# license, visit http://creativecommons.org/licenses/by-sa/3.0/
# or send a letter to Creative Commons, 171 Second Street,
# Suite 300, San Francisco, California, 94105, USA.
#
```

`ffuf -u http://10.10.71.46/FUZZ -c -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -ic -fs 0`

We've only reviewed a small subset of the useful features and options ffuf has to offer for fuzzing.
Use `ffuf -h` to discover the other options that might be useful for you and to answer the remaining questions in this task

### 8.1

How do you save the output to a markdown file (ffuf.md)?

     of md -o ffuf.md

### 8.2

How do you re-use a raw http request file?

     -request

### 8.3

How do you strip comments from a wordlist?

     -ic

### 8.4

How would you read a wordlist from STDIN?

     -w -

### 8.5

How do you print full URLs and redirect locations?

     -v

### 8.6

What option would you use to follow redirects?

     -r

### 8.7

How do you enable colorized output?

     -c

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
