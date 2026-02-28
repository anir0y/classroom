---
title: TryHackMe Overpass 2 - Hacked
date: 2021-07-23T01:16:55+05:30
lastmod: 2021-07-23T01:16:55+05:30
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
  - Overpass 2
  
draft: false
description: TryHackMe Room Overpass 2 - Hacked solved by Animesh Roy. this is a walkthrough. read more...

---
## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>||
|Overpass 2 |![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/96141387d9d4a22658f8db0ada67d62d.png)|
|room| [Overpass 2 ](https://tryhackme.com/room/overpass2hacked)|

---

## Task 01: Forensics - Analyse the PCAP

- open Pcap with Wireshark

### 1.1

What was the URL of the page they used to upload a reverse shell?

- wireshark filter `http` look for post req `http.request.method == POST`

     ![img](https://i.imgur.com/TQqr9ym.png)

### 1.2

What payload did the attacker use to gain access?

- filter `tcp.stream eq 1` read the `tcp stream`
  
  ![img](https://i.imgur.com/ejzmG5K.png)

### 1.3

What password did the attacker use to privesc?

- filter `tcp.stream eq 3` read the `tcp stream`
  
  ![img](https://i.imgur.com/ci1glmQ.png)

### 1.4

How did the attacker establish persistence?

- attacker downloaded a backdoor script from `github`
  
  ![img](https://i.imgur.com/umGRB0r.png)

### 1.5

Using the fasttrack wordlist, how many of the system passwords were crackable?

While going through various packets, we can see that at one point (packet 114) the attacker viewed the`/etc/shadowfile`. We can use john along with the fasttrack wordlist to try to crack passwords in that `/etc/shadowfile`.

_Before running john, remove any garbage values from the copied content_

```bash
john shadow -wordlist=/usr/share/wordlists/fasttrack.txt
Using default input encoding: UTF-8
Loaded 5 password hashes with 5 different salts (sha512crypt, crypt(3) $6$ [SHA512 256/256 AVX2 4x])
Cost 1 (iteration count) is 5000 for all loaded hashes
Will run 2 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
xxxxxxxx         (bee)
xxxxxxx          (szymex)
xxxxxxxx         (muirland)
xxxxxxxxx        (paradox)
4g 0:00:00:00 DONE (2020-08-30 20:06) 10.00g/s 555.0p/s 2775c/s 2775C/s Spring2017..starwars
Use the "--show" option to display all of the cracked passwords reliably
Session completed
```---

## Task 02: Research - Analyse the code

### 2.1

What's the default hash for the backdoor?

- visit the `backdoor repo` on [github](https://github.com/NinjaJc01/ssh-backdoor)
- read the file `main.go`
- there is a `hash` mentioned in file. hint: `line 19`

### 2.2

What's the hardcoded salt for the backdoor?

- read the code:
  
```bash
func passwordHandler(_ ssh.Context, password string) bool {
return verifyPass(hash, "[{hash-was-here}]", password)
}
```

### 2.3

What was the hash that the attacker used? - go back to the PCAP for this!

- filter `tcp.stream eq 3` read the `tcp stream` 

     ![img](https://i.imgur.com/nhmi7ap.png)

### 2.4

Crack the hash using rockyou and a cracking tool of your choice. What's the password?

- ID the hash type using `hash-identifier`:

     ```bash
     hash-identifier 
     --------------------------------------------------
     HASH: [hash-was-here]

     Possible Hashs:
     [+] SHA-512
     [+] Whirlpool

     Least Possible Hashs:
     [+] SHA-512(HMAC)
     [+] Whirlpool(HMAC)
     ```

- we will be using `hashcat` to crack the password! first let's find the [mode](https://hashcat.net/wiki/doku.php?id=example_hashes). we're looking for `SHA-512`
  We can see that the code for SHA-512 is 1700 which we can use to crack the hash but apparently this does not work. Now, if we recall then in the SSH backdoor code, there was a hardcoded salt involved. We need to add this salt value to the hash as:

  ```
  <hash_value>:<salt>
  ```

- visit the `github` website again and copy the hash! then run this:
  
     ```bash
     hashcat -m 1710 hash /usr/share/wordlists/rockyou.txt 
     [hash-was-here]:1c362db832f3f864c8c2fe05f2002a05:XXXXXXXXXX

     Session..........: hashcat
     Status...........: Cracked
     Hash.Name........: sha512($pass.$salt)
     Hash.Target......: 6d05358f090eea56a238af02e47d44ee5489d234810ef624028...002a05
     Time.Started.....: Sun Aug 30 21:05:42 2020 (0 secs)
     Time.Estimated...: Sun Aug 30 21:05:42 2020 (0 secs)
     Guess.Base.......: File (/usr/share/wordlists/rockyou.txt)
     Guess.Queue......: 1/1 (100.00%)
     Speed.#1.........:   420.2 kH/s (2.27ms) @ Accel:1024 Loops:1 Thr:1 Vec:4
     Recovered........: 1/1 (100.00%) Digests
     Progress.........: 18432/14344385 (0.13%)
     Rejected.........: 0/18432 (0.00%)
     Restore.Point....: 16384/14344385 (0.11%)
     Restore.Sub.#1...: Salt:0 Amplifier:0-1 Iteration:0-1
     Candidates.#1....: christal -> tanika

     Started: Sun Aug 30 21:05:37 2020
     Stopped: Sun Aug 30 21:05:43 2020
     ```

     ![img](https://i.imgur.com/dNfuHfE.png)---

## Task 03: Attack - Get back in

Now that the incident is investigated, Paradox needs someone to take control of the Overpass production server again.

There's flags on the box that Overpass can't afford to lose by formatting the server!

- recon
  
```bash
sudo nmap -sV -sC MACHINE_IP 

Starting Nmap 7.60 ( https://nmap.org ) at 2021-07-22 21:37 BST
Nmap scan report for ip-10-10-154-9.eu-west-1.compute.internal (MACHINE_IP)
Host is up (0.0011s latency).
Not shown: 997 closed ports
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 e4:3a:be:ed:ff:a7:02:d2:6a:d6:d0:bb:7f:38:5e:cb (RSA)
|   256 fc:6f:22:c2:13:4f:9c:62:4f:90:c9:3a:7e:77:d6:d4 (ECDSA)
|_  256 15:fd:40:0a:65:59:a9:b5:0e:57:1b:23:0a:96:63:05 (EdDSA)
80/tcp   open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: LOL Hacked
2222/tcp open  ssh     OpenSSH 8.2p1 Debian 4 (protocol 2.0)
| ssh-hostkey: 
|_  2048 a2:a6:d2:18:79:e3:b0:20:a2:4f:aa:b6:ac:2e:6b:f2 (RSA)
MAC Address: 02:BC:0D:D4:8B:FB (Unknown)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 38.14 seconds
```

- notes:
  
     - `Wireshark` james: whenevernoteartinstant
     - cracked password: november16

### 3.1

The attacker defaced the website. What message did they leave as a heading?

- Check the Website Page.
  
  ![img](https://i.imgur.com/soZWdia.png)

### 3.2

> n/a

### 3.3

What's the user flag?

- we have `SSH` and a user cred. let's try loggin in with them:

```bash
# Trying SSH with port 22
ssh james@10.10.154.9
The authenticity of host '10.10.154.9 (10.10.154.9)' can't be established.
ECDSA key fingerprint is SHA256:k9Gy3gjhPS9Ra0ij5Mz+6JaiSVr39W8oS/bUVg0fe0A.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added '10.10.154.9' (ECDSA) to the list of known hosts.
james@10.10.154.9's password: 
Permission denied, please try again.
james@10.10.154.9's password: 

##         [failed]      ##

# trying with port 2222
ssh -p2222 james@10.10.154.9
james@10.10.154.9's password: 
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.

james@overpass-production:/home/james/ssh-backdoor$ 
##             [worked]            ##
```

- read the `user.txt`

```bash
cat ~/user.txt
thm{user-flag-was-here}
```

### 3.4

What's the root flag?

- `listing home dir`
  
  ![img](https://i.imgur.com/aqI92jv.png)
  
  suid much?!!

- let's execute the `suid` binary
  
  ![img](https://i.imgur.com/wsIQhbS.png)

  it worked!!!

- read the flag:
  
  ![img](https://i.imgur.com/JRxPKgD.png)