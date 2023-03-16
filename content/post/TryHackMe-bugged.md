---
title: TryHackMe Bugged
date: 2023-03-13T19:08:04+05:30
lastmod: 2023-03-13T19:08:04+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover: /img/thm.gif # for tryhackMe
simg: /img/blog.png

categories:
  - TryHackMe
tags:
  - Bugged


draft: true
description: Try Hack Me Room Bugged solved by Animesh Roy. John likes to live in a very Internet connected world. Maybe too connected.

---

## OverView

**Analyze the network**

John was working on his smart home appliances when he noticed weird traffic going across the network. Can you help him figure out what these weird network communications are?


| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|[Bugged](https://tryhackme.com/room/bugged) |![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/adcc4fe6db75bd8f327a51ea55a770aa.png)|




## Task 01: Initial Scan 

### nmap

let's start with quick nmap scan; 

*inital run gets me nothing* 

```bash 
nmap -sC -sV -oA nmap/initial 10.10.79.196 -Pn

Starting Nmap 7.60 ( https://nmap.org ) at 2023-03-13 13:52 GMT
Nmap scan report for ip-10-10-79-196.eu-west-1.compute.internal (10.10.79.196)
Host is up (0.0042s latency).
All 1000 scanned ports on ip-10-10-79-196.eu-west-1.compute.internal (10.10.79.196) are closed
MAC Address: 02:B2:12:B7:1C:B1 (Unknown)

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 1.99 seconds
```

*let's run a full port scan*

```bash

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
