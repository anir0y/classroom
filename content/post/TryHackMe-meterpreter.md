---
title: TryHackMe Metasploit Meterpreter
date: 2021-09-30T13:21:37+05:30
lastmod: 2021-09-30T13:21:37+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
featureimage: img/msf.gif
simg: /img/msf.gif

categories:
  - TryHackMe
tags:
  - tryhackme


draft: false
description: Take a deep dive into Meterpreter, and see how in-memory payloads can be used for post-exploitation. TryHackMe Room Metasploit Meterpreter solved by Animesh Roy. this is a walkthrough. read more...

---

## OverView

Take a deep dive into Meterpreter, and see how in-memory payloads can be used for post-exploitation.

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Metasploit: Meterpreter|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/7774a96fb05b63b3abfed628f267f2a9.png)|
| <b> Metasploit: Meterpreter [Subscription Required] </b>| [Metasploit: Meterpreter]()|

## Task 01: Introduction to Meterpreter

Meterpreter is a Metasploit payload that supports the penetration testing process with many valuable components. Meterpreter will run on the target system and act as an agent within a command and control architecture. You will interact with the target operating system and files and use Meterpreter's specialized commands.

Meterpreter has many versions which will provide different functionalities based on the target system.

**How does Meterpreter work?**

Meterpreter runs on the target system but is not installed on it. It runs in memory and does not write itself to the disk on the target. This feature aims to avoid being detected during antivirus scans. By default, most antivirus software will scan new files on the disk (e.g. when you download a file from the internet) Meterpreter runs in memory (RAM - Random Access Memory) to avoid having a file that has to be written to the disk on the target system (e.g. meterpreter.exe). This way, Meterpreter will be seen as a process and not have a file on the target system.

Meterpreter also aims to avoid being detected by network-based IPS (Intrusion Prevention System) and IDS (Intrusion Detection System) solutions by using encrypted communication with the server where Metasploit runs (typically your attacking machine). If the target organization does not decrypt and inspect encrypted traffic (e.g. HTTPS) coming to and going out of the local network, IPS and IDS solutions will not be able to detect its activities.

While Meterpreter is recognized by major antivirus software, this feature provides some degree of stealth.

The example below shows a target Windows machine exploited using the MS17-010 vulnerability. You will see Meterpreter is running with a process ID (PID) of 1304; this PID will be different in your case. We have used the `getpid` command, which returns the process ID with which Meterpreter is running. The process ID (or process identifier) is used by operating systems to identify running processes. All processes running in Linux or Windows will have a unique ID number; this number is used to interact with the process when the need arises (e.g. if it needs to be stopped).

![img](https://i.imgur.com/uiqGUBQ.png)

If we list processes running on the target system using the ps command, we see PID 1304 is spoolsv.exe and not Meterpreter.exe, as one might expect.

* code
  
     ```bash
     meterpreter > ps

     Process List
     ============

     PID   PPID  Name                  Arch  Session  User                          Path
     ---   ----  ----                  ----  -------  ----                          ----
     0     0     [System Process]                                                   
     4     0     System                x64   0                                      
     396   644   LogonUI.exe           x64   1        NT AUTHORITY\SYSTEM           C:\Windows\system32\LogonUI.exe
     416   4     smss.exe              x64   0        NT AUTHORITY\SYSTEM           \SystemRoot\System32\smss.exe
     428   692   svchost.exe           x64   0        NT AUTHORITY\SYSTEM           
     548   540   csrss.exe             x64   0        NT AUTHORITY\SYSTEM           C:\Windows\system32\csrss.exe
     596   540   wininit.exe           x64   0        NT AUTHORITY\SYSTEM           C:\Windows\system32\wininit.exe
     604   588   csrss.exe             x64   1        NT AUTHORITY\SYSTEM           C:\Windows\system32\csrss.exe
     644   588   winlogon.exe          x64   1        NT AUTHORITY\SYSTEM           C:\Windows\system32\winlogon.exe
     692   596   services.exe          x64   0        NT AUTHORITY\SYSTEM           C:\Windows\system32\services.exe
     700   692   sppsvc.exe            x64   0        NT AUTHORITY\NETWORK SERVICE  
     716   596   lsass.exe             x64   0        NT AUTHORITY\SYSTEM           C:\Windows\system32\lsass.exe  1276  1304  cmd.exe               x64   0        NT AUTHORITY\SYSTEM           C:\Windows\system32\cmd.exe
     1304  692   spoolsv.exe           x64   0        NT AUTHORITY\SYSTEM           C:\Windows\System32\spoolsv.exe
     1340  692   svchost.exe           x64   0        NT AUTHORITY\LOCAL SERVICE    
     1388  548   conhost.exe           x64   0        NT AUTHORITY\SYSTEM           C:\Windows\system32\conhost.exe
     ```

Even if we were to go a step further and look at DLLs (Dynamic-Link Libraries) used by the Meterpreter process (PID 1304 in this case), we still would not find anything jumping at us (e.g. no meterpreter.dll)

* code
  
     ```bash
     C:\Windows\system32>tasklist /m /fi "pid eq 1304"
     tasklist /m /fi "pid eq 1304"

     Image Name                     PID Modules                                     
     ========================= ======== ============================================
     spoolsv.exe                   1304 ntdll.dll, kernel32.dll, KERNELBASE.dll,    
                                        msvcrt.dll, sechost.dll, RPCRT4.dll,        
                                        USER32.dll, GDI32.dll, LPK.dll, USP10.dll,  
                                        POWRPROF.dll, SETUPAPI.dll, CFGMGR32.dll,   
                                        ADVAPI32.dll, OLEAUT32.dll, ole32.dll,      
                                        DEVOBJ.dll, DNSAPI.dll, WS2_32.dll,         
                                        NSI.dll, IMM32.DLL, MSCTF.dll,              
                                        CRYPTBASE.dll, slc.dll, RpcRtRemote.dll,    
                                        secur32.dll, SSPICLI.DLL, credssp.dll,      
                                        IPHLPAPI.DLL, WINNSI.DLL, mswsock.dll,      
                                        wshtcpip.dll, wship6.dll, rasadhlp.dll,     
                                        fwpuclnt.dll, CLBCatQ.DLL, umb.dll,         
                                        ATL.DLL, WINTRUST.dll, CRYPT32.dll,         
                                        MSASN1.dll, localspl.dll, SPOOLSS.DLL,      
                                        srvcli.dll, winspool.drv,                   
                                        PrintIsolationProxy.dll, FXSMON.DLL,        
                                        tcpmon.dll, snmpapi.dll, wsnmp32.dll,       
                                        msxml6.dll, SHLWAPI.dll, usbmon.dll,        
                                        wls0wndh.dll, WSDMon.dll, wsdapi.dll,       
                                        webservices.dll, FirewallAPI.dll,           
                                        VERSION.dll, FunDisc.dll, fdPnp.dll,        
                                        winprint.dll, USERENV.dll, profapi.dll,     
                                        GPAPI.dll, dsrole.dll, win32spl.dll,        
                                        inetpp.dll, DEVRTL.dll, SPINF.dll,          
                                        CRYPTSP.dll, rsaenh.dll, WINSTA.dll,        
                                        cscapi.dll, netutils.dll, WININET.dll,      
                                        urlmon.dll, iertutil.dll, WINHTTP.dll,      
                                        webio.dll, SHELL32.dll, MPR.dll,            
                                        NETAPI32.dll, wkscli.dll, PSAPI.DLL,        
                                        WINMM.dll, dhcpcsvc6.DLL, dhcpcsvc.DLL,     
                                        apphelp.dll, NLAapi.dll, napinsp.dll,       
                                        pnrpnsp.dll, winrnr.dll                     

     C:\Windows\system32>
     ```

Techniques and tools that can be used to detect Meterpreter are beyond the scope of this room. This section aimed to show you how stealthy Meterpreter is running; remember, most antivirus software will detect it.

It is also worth noting that Meterpreter will establish an encrypted (TLS) communication channel with the attacker's system.---

## Task 02: Meterpreter Flavors

As you will remember, staged payloads are sent to the target in two steps. An initial part is installed (the stager) and requests the rest of the payload. This allows for a smaller initial payload size. The inline payloads are sent in a single step. Meterpreter payloads are also divided into stagged and inline versions. However, Meterpreter has a wide range of different versions you can choose from based on your target system. 

We have used the `msfvenom --list` payloads command and grepped "meterpreter" payloads (adding | grep meterpreter to the command line), so the output only shows these. You can try this command on the AttackBox.

* code

     ```bash
     root@ip-10-10-186-44:~# msfvenom --list payloads | grep meterpreter
     android/meterpreter/reverse_http                    Run a meterpreter server in Android. Tunnel communication over HTTP
     android/meterpreter/reverse_https                   Run a meterpreter server in Android. Tunnel communication over HTTPS
     android/meterpreter/reverse_tcp                     Run a meterpreter server in Android. Connect back stager
     android/meterpreter_reverse_http                    Connect back to attacker and spawn a Meterpreter shell
     android/meterpreter_reverse_https                   Connect back to attacker and spawn a Meterpreter shell
     android/meterpreter_reverse_tcp                     Connect back to the attacker and spawn a Meterpreter shell
     apple_ios/aarch64/meterpreter_reverse_http          Run the Meterpreter / Mettle server payload (stageless)
     apple_ios/aarch64/meterpreter_reverse_https         Run the Meterpreter / Mettle server payload (stageless)
     apple_ios/aarch64/meterpreter_reverse_tcp           Run the Meterpreter / Mettle server payload (stageless)
     apple_ios/armle/meterpreter_reverse_http            Run the Meterpreter / Mettle server payload (stageless)
     apple_ios/armle/meterpreter_reverse_https           Run the Meterpreter / Mettle server payload (stageless)
     apple_ios/armle/meterpreter_reverse_tcp             Run the Meterpreter / Mettle server payload (stageless)
     java/meterpreter/bind_tcp                           Run a meterpreter server in Java. Listen for a connection
     java/meterpreter/reverse_http                       Run a meterpreter server in Java. Tunnel communication over HTTP
     java/meterpreter/reverse_https                      Run a meterpreter server in Java. Tunnel communication over HTTPS
     java/meterpreter/reverse_tcp                        Run a meterpreter server in Java. Connect back stager
     linux/aarch64/meterpreter/reverse_tcp               Inject the mettle server payload (staged). Connect back to the attacker
     linux/aarch64/meterpreter_reverse_http              Run the Meterpreter / Mettle server payload (stageless)
     linux/aarch64/meterpreter_reverse_https             Run the Meterpreter / Mettle server payload (stageless)
     linux/aarch64/meterpreter_reverse_tcp               Run the Meterpreter / Mettle server payload (stageless)
     linux/armbe/meterpreter_reverse_http                Run the Meterpreter / Mettle server payload (stageless)
     linux/armbe/meterpreter_reverse_https               Run the Meterpreter / Mettle server payload (stageless)
     linux/armbe/meterpreter_reverse_tcp                 Run the Meterpreter / Mettle server payload (stageless)
     linux/armle/meterpreter/bind_tcp                    Inject the mettle server payload (staged). Listen for a connection
     linux/armle/meterpreter/reverse_tcp                 Inject the mettle server payload (staged). Connect back to the attacker [...]
     ```

The list will show Meterpreter versions available for the following platforms;

* Android
* Apple iOS
* Java
* Linux
* OSX
* PHP
* Python
* Windows

Your decision on which version of Meterpreter to use will be mostly based on three factors:
* The target operating system (Is the target operating system Linux or Windows? Is it a Mac device? Is it an Android phone? etc.)
* Components available on the target system (Is Python installed? Is this a PHP website? etc.)
* Network connection types you can have with the target system (Do they allow raw TCP connections? Can you only have an HTTPS reverse connection? Are IPv6 addresses not as closely monitored as IPv4 addresses? etc.) 

If you are not using Meterpreter as a standalone payload generated by Msfvenom, your choice may also be limited by the exploit. You will notice some exploits will have a default Meterpreter payload, as you can see in the example below with the ms17_010_eternalblue exploit.

* exploit
  
     ```bash
     msf6 > use exploit/windows/smb/ms17_010_eternalblue 
     [*] Using configured payload windows/x64/meterpreter/reverse_tcp
     msf6 exploit(windows/smb/ms17_010_eternalblue) >
     ```

You can also list other available payloads using the `show payloads` command with any module.

* payloads

     ```bash
     msf6 exploit(windows/smb/ms17_010_eternalblue) > show payloads 

     Compatible Payloads
     ===================

     #   Name                                        Disclosure Date  Rank    Check  Description
     -   ----                                        ---------------  ----    -----  -----------
     0   generic/custom                                               manual  No     Custom Payload
     1   generic/shell_bind_tcp                                       manual  No     Generic Command Shell, Bind TCP Inline
     2   generic/shell_reverse_tcp                                    manual  No     Generic Command Shell, Reverse TCP Inline
     3   windows/x64/exec                                             manual  No     Windows x64 Execute Command
     4   windows/x64/loadlibrary                                      manual  No     Windows x64 LoadLibrary Path
     5   windows/x64/messagebox                                       manual  No     Windows MessageBox x64
     6   windows/x64/meterpreter/bind_ipv6_tcp                        manual  No     Windows Meterpreter (Reflective Injection x64), Windows x64 IPv6 Bind TCP Stager
     7   windows/x64/meterpreter/bind_ipv6_tcp_uuid                   manual  No     Windows Meterpreter (Reflective Injection x64), Windows x64 IPv6 Bind TCP Stager with UUID Support
     8   windows/x64/meterpreter/bind_named_pipe                      manual  No     Windows Meterpreter (Reflective Injection x64), Windows x64 Bind Named Pipe Stager [...]
     ```

---

## Task 03:  Meterpreter Commands

Typing `help` on any Meterpreter session (shown by meterpreter> at the prompt) will list all available commands.

* help

     ```bash
     meterpreter > help

     Core Commands
     =============

     Command                   Description
     -------                   -----------
     ?                         Help menu
     background                Backgrounds the current session
     bg                        Alias for background
     bgkill                    Kills a background meterpreter script
     bglist                    Lists running background scripts
     bgrun                     Executes a meterpreter script as a background thread
     channel                   Displays information or control active channels
     close                     Closes a channel[...]
     ```

Every version of Meterpreter will have different command options, so running the help command is always a good idea. Commands are built-in tools available on Meterpreter. They will run on the target system without loading any additional script or executable files.

Meterpreter will provide you with three primary categories of tools;

* Built-in commands
* Meterpreter tools
* Meterpreter scripting

If you run the help command, you will see Meterpreter commands are listed under different categories.

* Core commands
* File system commands
* Networking commands
* System commands
* User interface commands
* Webcam commands
* Audio output commands
* Elevate commands
* Password database commands
* Timestomp commands

Please note that the list above was taken from the output of the help command on the Windows version of Meterpreter (windows/x64/meterpreter/reverse_tcp). These will be different for other Meterpreter versions.

**Meterpreter commands**

Core commands will be helpful to navigate and interact with the target system. Below are some of the most commonly used. Remember to check all available commands running the help command once a Meterpreter session has started.

![img](https://i.imgur.com/i6PE07E.png)

![img](https://i.imgur.com/4UXBvSa.png)

![img](https://i.imgur.com/OI9ZyWU.png)

![img](https://i.imgur.com/d4R3Msa.png)

![img](https://i.imgur.com/PMCCw4Q.png)

Although all these commands may seem available under the help menu, they may not all work. For example, the target system might not have a webcam, or it can be running on a virtual machine without a proper desktop environment.

---

## Task 04:Post-Exploitation with Meterpreter

Meterpreter provides you with many useful commands that facilitate the post-exploitation phase. Below are a few examples you will often use.

**Help**

This command will give you a list of all available commands in Meterpreter. As we have seen earlier, Meterpreter has many versions, and each version may have different options available. Typing help once you have a Meterpreter session will help you quickly browse through available commands.

![img](https://i.imgur.com/xgwYFkq.png)

**Meterpreter commands**

The `getuid` command will display the user with which Meterpreter is currently running. This will give you an idea of your possible privilege level on the target system (e.g. Are you an admin level user like NT AUTHORITY\SYSTEM or a regular user?)

![img](https://i.imgur.com/Nf8tlhg.png)

The `ps` command will list running processes. The PID column will also give you the PID information you will need to migrate Meterpreter to another process.

![img](https://i.imgur.com/jkkHTqY.png)

**Migrate**

Migrating to another process will help Meterpreter interact with it. For example, if you see a word processor running on the target (e.g. word.exe, notepad.exe, etc.), you can migrate to it and start capturing keystrokes sent by the user to this process. Some Meterpreter versions will offer you the keyscan_start, keyscan_stop, and keyscan_dump command options to make Meterpreter act like a keylogger. Migrating to another process may also help you to have a more stable Meterpreter session.

To migrate to any process, you need to type the migrate command followed by the PID of the desired target process. The example below shows Meterpreter migrating to process ID 716.

![img](https://i.imgur.com/HCbgCa0.png)

Be careful; you may lose your user privileges if you migrate from a higher privileged (e.g. SYSTEM) user to a process started by a lower privileged user (e.g. webserver). You may not be able to gain them back.

**Hashdump**

The hashdump command will list the content of the SAM database. The SAM (Security Account Manager) database stores user's passwords on Windows systems. These passwords are stored in the NTLM (New Technology LAN Manager) format.

![img](https://i.imgur.com/gd6z17M.png)

While it is not mathematically possible to "crack" these hashes, you may still discover the cleartext password using online NTLM databases or a rainbow table attack. These hashes can also be used in Pass-the-Hash attacks to authenticate to other systems that these users can access the same network.

**Search**

The search command is useful to locate files with potentially juicy information. In a CTF context, this can be used to quickly find a flag or proof file, while in actual penetration testing engagements, you may need to search for user-generated files or configuration files that may contain password or account information.

![img](https://i.imgur.com/khrkqrL.png)

**Shell**

The shell command will launch a regular command-line shell on the target system. Pressing CTRL+Z will help you go back to the Meterpreter shell.

![img](https://i.imgur.com/aqVpbNJ.png)

---

## Task 05: Post-Exploitation Challenge

Meterpreter provides several important post-exploitation tools.

Commands mentioned previously, such as getsystem and hashdump will provide important leverage and information for privilege escalation and lateral movement. Meterpreter is also a good base you can use to run post-exploitation modules available on the Metasploit framework. Finally, you can also use the load command to leverage additional tools such as Kiwi or even the whole Python language.

![img](https://i.imgur.com/DIg3D5y.png)

The post-exploitation phase will have several goals; Meterpreter has functions that can assist all of them.

* Gathering further information about the target system.
* Looking for interesting files, user credentials, additional network interfaces, and generally interesting information on the target system.
* Privilege escalation.
* Lateral movement.
  
Once any additional tool is loaded using the load command, you will see new options on the help menu. The example below shows commands added for the Kiwi module (using the load kiwi command).

![img](https://i.imgur.com/ZY1kcrj.png)

These will change according to the loaded menu, so running the help command after loading a module is always a good idea.

![img](https://i.imgur.com/tzVhPqy.png)

### Answer the questions below

|question|ans|
|---|---|
|What is the computer name?|[5.1](#1-sysinfo)|
|What is the target domain?|[5.1](#1-sysinfo)|
|What is the name of the share likely created by the user?| [5.3](#3)|
|What is the NTLM hash of the jchambers user?| [5.4](#4)|
|What is the cleartext password of the jchambers user?|[5.5](#5)|
|Where is the "secrets.txt"  file located?|[5.6](#6)|
|What is the Twitter password revealed in the "secrets.txt" file?|[5.6](#6)|
|Where is the "realsecret.txt" file located?|[5.7](#8)|
|What is the real secret?|[5.8](#8)|

## solutions

### 1 sysinfo

![img](https://i.imgur.com/vLx7TvS.png)

### 3

* run this post exploit `post/windows/gather/enum_shares`
  
  ![img](https://i.imgur.com/bZUmBgH.png)

### 4

* You will need to migrate to the "lsass.exe" process first
* run `ps | grep lsass` to find the PID

* migrration
  
  ![img](https://i.imgur.com/rLs9H9k.png)

* hashes
  
  ![img](https://i.imgur.com/8ewXMTD.png)

### 5

* goto `crackstation.net` and find the password

### 6

* run this command in `meterpreter > search -f *.txt`
* results
  
  ![img](https://i.imgur.com/FNcOAwE.png)
  
### 8

* run this command in `search -f realsecret.txt`
* results
  
  ![img](https://i.imgur.com/Fu0OQJa.png)