---
title: TryHackMe Lookback
date: 2023-03-19T21:12:15+05:30
lastmod: 2023-03-19T21:12:15+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: /img/thm.gif
  alt: "cover image"
simg: /img/blog.png

categories:
  - TryHackMe
tags:
  - Lookback
 

draft: true
description: Try Hack Me Room Lookback solved by Animesh Roy. this is a walkthough. read more...

---

## OverView

You’ve been asked to run a vulnerability test on a production environment.

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|[Lookback](https://tryhackme.com/room/lookback) |![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/d8877bf37d4015f1b78d243078dece09.png)|



## Task 01:  Find the flags

The Lookback company has just started the integration with Active Directory. Due to the coming deadline, the system integrator had to rush the deployment of the environment. Can you spot any vulnerabilities?


> Sometimes to move forward, we have to go backward.
> So if you get stuck, try to look back!

--- 

## Initial Recon

### NMAP 

> we will start our initial scan using nmap, here are the results: 

```nmap
80/tcp   open  http          Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
|_http-title: Site doesn't have a title.
443/tcp  open  https         Microsoft-IIS/10.0
| http-title: Outlook
|_Requested resource was https://10.10.218.170/owa/auth/logon.aspx?url=https%3a%2f%2f10.10.218.170%2fowa%2f&reason=0
| ssl-cert: Subject: commonName=WIN-12OUO7A66M7
| Subject Alternative Name: DNS:WIN-12OUO7A66M7, DNS:WIN-12OUO7A66M7.thm.local
| Not valid before: 2023-01-25T21:34:02
|_Not valid after:  2028-01-25T21:34:02
|_http-server-header: Microsoft-IIS/10.0
3389/tcp open  ms-wbt-server Microsoft Terminal Services
| ssl-cert: Subject: commonName=WIN-12OUO7A66M7.thm.local
| Not valid before: 2023-01-25T21:12:51
|_Not valid after:  2023-07-27T21:12:51
| rdp-ntlm-info:
|   Target_Name: THM
|   NetBIOS_Domain_Name: THM
|   NetBIOS_Computer_Name: WIN-12OUO7A66M7
|   DNS_Domain_Name: thm.local
|   DNS_Computer_Name: WIN-12OUO7A66M7.thm.local
|   DNS_Tree_Name: thm.local
|   Product_Version: 10.0.17763
|_  System_Time: 2023-03-19T15:52:49+00:00
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: -1s 
```

we can see 3 ports open, port `80`, `443` and `3389` 

`Port 80, 443` looks like running IIS server 
`Port 3389` is windows Remote desktop service. 

we will start with looking into web application first. 

it looks we got ourselves a Exchange server (?)

![img](https://i.imgur.com/LIvFDtz.png)



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
