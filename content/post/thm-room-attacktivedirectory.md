---
title: Try Hack Me Room Attacktivedirectory
date: 2021-05-18T23:58:19+05:30
lastmod: 2021-05-18T23:58:19+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm

draft: false
description: "TryHackMe Room Attacktivedirectory walkthrough with step-by-step solutions — enumeration, exploitation, and privilege escalation on the Room Attacktivedirectory challenge room."
---
# Attacktivedirectory

|Profile|Support|
|:-----|-----:|
|<script src="https://tryhackme.com/badge/434937"></script>|<a href="https://www.buymeacoffee.com/anir0y"><img src="https://img.buymeacoffee.com/button-api/?text=Cheers!!!&emoji=🍺&slug=anir0y&button_colour=BD5FFF&font_colour=ffffff&font_family=Lato&outline_colour=000000&coffee_colour=FFDD00"></a>|


## Task 01: Deploy The Machine

Walkthough how to access VM & Attacker VM

---

## Task 02: Setup

Installing Impacket:

Whether you're on the Kali 2019.3 or Kali 2021.1, Impacket can be a pain to install  correctly. Here's some instructions that may help you install it correctly!

First, you will need to clone the Impacket Github repo onto your box. The following command will clone Impacket into /opt/impacket:

`git clone https://github.com/SecureAuthCorp/impacket.git /opt/impacket`

After the repo is cloned, you will notice several install related files, requirements.txt, and setup.py. A commonly skipped file during the installation is setup.py, this actually installs Impacket onto your system so you can use it and not have to worry about any dependencies.

To install the Python requirements for Impacket:

`pip3 install -r /opt/impacket/requirements.txt`

Once the requirements have finished installing, we can then run the python setup install script:

`cd /opt/impacket/ && python3 ./setup.py install`

After that, Impacket should be correctly installed now and it should be ready to use!

```bash
sudo git clone https://github.com/SecureAuthCorp/impacket.git /opt/impacket
sudo pip3 install -r /opt/impacket/requirements.txt
sudo cd /opt/impacket/ 
sudo pip3 install .
sudo python3 setup.py install
```
### Installing Bloodhound and Neo4j

Bloodhound is another tool that we'll be utilizing while attacking Attacktive Directory. We'll cover specifcs of the tool later, but for now, we need to install two packages with Apt, those being bloodhound and neo4j. You can install it with the following command:

`apt install bloodhound neo4j`

 Now that it's done, you're ready to go1

### Troubleshooting

If you are having issues installing Bloodhound and Neo4j, try issuing the following command:

`apt update && apt upgrade`

---

## Task 03: Welcome to Attacktive Directory

### Enumeration

Basic enumeration starts out with an nmap scan. Nmap is a relatively complex utility that has been refined over the years to detect what ports are open on a device, what services are running, and even detect what operating system is running. It's important to note that not all services may be deteted correctly and not enumerated to it's fullest potential. Despite nmap being an overly complex utility, it cannot enumerate everything. Therefore after an initial nmap scan we'll be using other utilities to help us enumerate the services running on the device.

**Notes**: Flags for each user account are available for submission. You can retrieve the flags for user accounts via RDP (Note: the login format is spookysec.local\User at the Window's login prompt) and Administrator via Evil-WinRM.



### Flags 3.1
|||
|:---:|:---|
|What tool will allow us to enumerate port 139/445?|`enum4linux`|

#### Explanation

### Flags 3.2
|||
|:---:|:---|
|What is the NetBIOS-Domain Name of the machine?|`THM-**`|

#### Explanation
NMAP `nmap -sC -sV [ip]` reveals the Name

### Flags 3.3
|||
|:---:|:---|
|What invalid TLD do people commonly use for their Active Directory Domain?|`.local`|

#### Explanation
this is common practic we select `.local` as test environment.

---

## Task 04: Enumerating Users via Kerberos

### Introduction:

A whole host of other services are running, including Kerberos. Kerberos is a key authentication service within Active Directory. With this port open, we can use a tool called [Kerbrute](https://github.com/ropnop/kerbrute/releases) (by Ronnie Flathers @ropnop) to brute force discovery of users, passwords and even password spray!

### Enumeration:

For this box, a modified User List and Password List will be used to cut down on time of enumeration of users and password hash cracking. It is NOT recommended to brute force credentials due to account lockout policies that we cannot enumerate on the domain controller.

* [userlist](https://raw.githubusercontent.com/Sq00ky/attacktive-directory-tools/master/userlist.txt)
* [passwordlist](https://raw.githubusercontent.com/Sq00ky/attacktive-directory-tools/master/passwordlist.txt)


### Flags 4.1
|||
|:---:|:---|
|What command within Kerbrute will allow us to enumerate valid usernames?|``userenum``|

#### Explanation
read this : https://github.com/ropnop/kerbrute
or just check the Help.

![](https://i.imgur.com/YhbjhFc.png)

### Flag 4.2 
### Flag 4.3
|||
|:---:|:---|
|What notable account is discovered? (These should jump out at you)|`svc-admin`|
|What is the other notable account is discovered? (These should jump out at you)|`backup`|

![](https://i.imgur.com/6Zfhn8B.png)

---

## Task 05:  Abusing Kerberos

### Introduction

After the enumeration of user accounts is finished, we can attempt to abuse a feature within Kerberos with an attack method called ASREPRoasting. ASReproasting occurs when a user account has the privilege "Does not require Pre-Authentication" set. This means that the account does not need to provide valid identification before requesting a Kerberos Ticket on the specified user account.

### Retrieving Kerberos Tickets

[Impacket](https://github.com/SecureAuthCorp/impacket) has a tool called "GetNPUsers.py" (located in impacket/examples/GetNPUsers.py) that will allow us to query ASReproastable accounts from the Key Distribution Center. The only thing that's necessary to query accounts is a valid set of usernames which we enumerated previously via Kerbrute.

### Flags 5.1
|||
|:---:|:---|
|We have two user accounts that we could potentially query a ticket from. Which user account can you query a ticket from with no password?|`svc-admin`|

#### Explanation
![](https://i.imgur.com/x0kxxqs.png)

### Flags 5.2 / 5.3
|||
|:---:|:---|
|Looking at the Hashcat Examples Wiki page, what type of Kerberos hash did we retrieve from the KDC? (Specify the full name)|`Kerberos 5 AS-REP etype 23`|
|What mode is the hash?|18200|

#### Explanation
Check out the site: https://hashcat.net/wiki/doku.php?id=example_hashes

![](https://i.imgur.com/oG5Vju3.png)



### Flags 5.4
|||
|:---:|:---|
|Now crack the hash with the modified password list provided, what is the user accounts password?|`management2005`|

#### Explanation

![](https://i.imgur.com/mgACreG.png)

---

## Task 06: Back to the Basics

### Enumeration:

With a user's account credentials we now have significantly more access within the domain. We can now attempt to enumerate any shares that the domain controller may be giving out.


### Flag 6.1 
#### Using utility can we map remote SMB shares?
>`Smbclient`


### Flag 6.2
#### Which option will list shares?
>`-l`


### Flag 6.3
#### How many remote shares is the server listing?
> `6` 

#### Explanation
![](https://i.imgur.com/c6iFnzO.png)

### Flag 6.4
#### There is one particular share that we have access to that contains a text file. Which share is it?
> `backup`

#### Explanation
run the command
```bash
└──╼ $smbclient \\\\10.10.8.212\\backup -U 'svc-admin%management2005'
Try "help" to get a list of possible commands.
smb: \> dir
  .                                   D        0  Sun Apr  5 00:38:39 2020
  ..                                  D        0  Sun Apr  5 00:38:39 2020
  fooo.txt              A       48  Sun Apr  5 00:38:53 2020

		8247551 blocks of size 4096. 3632648 blocks available
smb: \> 
```

### Flag 6.5 
#### What is the content of the file?



#### Explanation
```bash
smb: \> get backup_credentials.txt
getting file \backup_credentials.txt of size 48 as backup_credentials.txt (0.1 KiloBytes/sec) (average 0.1 KiloBytes/sec)
smb: \> exit
┌─[mentor@attackerVM]─[~/thm/attacktivedirectory]
└──╼ $cat backup_credentials.txt 
YmFja3VwQHNwb29reXNlYy5sb2NhbDpiYWNrdXAyNTE3ODYw
```

### Flag 6.6
#### Decoding the contents of the file, what is the full contents?
> backup@spookysec.local:backup2517860

#### Explanation
base64 decode 

---

## Task 07: Elevating Privileges within the Domain

### Let's Sync Up!

Now that we have new user account credentials, we may have more privileges on the system than before. The username of the account "backup" gets us thinking. What is this the backup account to?

Well, it is the backup account for the Domain Controller. This account has a unique permission that allows all Active Directory changes to be synced with this user account. This includes password hashes

![](https://blog.spookysec.net/img/dcsync.png)

Knowing this, we can use another tool within Impacket called "secretsdump.py". This will allow us to retrieve all of the password hashes that this user account (that is synced with the domain controller) has to offer. Exploiting this, we will effectively have full control over the AD Domain.





### Flag 7.1
#### What method allowed us to dump NTDS.DIT?
> `DRSUAPI`

#### Explanation
![](https://i.imgur.com/bD5Z10P.png)

### Flag 7.2
#### What is the Administrators NTLM hash?
> `0e0363213e37b94221497260erbcb4fc`
#### Explanation
![](https://i.imgur.com/bD5Z10P.png)

### Flag 7.3
#### What method of attack could allow us to authenticate as the user without the password?
> `Pass the Hash`


### Flag 7.4
#### Using a tool called Evil-WinRM what option will allow us to use a hash?
> `-H`

#### Explanation
![](https://i.imgur.com/ctRxPeL.png)


---

## Task 08: Flag Submission Panel

### Flag Submission Panel

Submit the flags for each user account. They can be located on each user's desktop.

### Flags Task.1
#### svc-admin
>`TryHackMe{K3rb3r0s_Pr3_4uth}`

### Flags Task.1
#### backup
>`TryHackMe{B4ckM3UpSc0tty!}`

### Flags Task.1
#### Administrator
>`TryHackMe{4ctiveD1rectoryM4st3r}`

#### Explanation

Run `evil-winrm` with `administrator` hash and copy the flags

```bash
┌─[✗]─[mentor@attackerVM]─[~/thm/attacktivedirectory]
└──╼ $evil-winrm -i 10.10.8.212 -u administrator -H 0e0363213e37b94221497260b0bcb4fc
```

---


---