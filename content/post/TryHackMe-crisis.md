---
title: TryHackMe Crisis
date: 2021-07-10T15:18:30+05:30
lastmod: 2021-07-10T15:18:30+05:30
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
  - Crisis

draft: false
description: TryHackMe Room Crisis solved by Animesh Roy. this is a walkthrough. read more...

---
## Overview

|Room Name| |
|---|---|
|Crisis|[![crisis](https://tryhackme-images.s3.amazonaws.com/room-icons/be6532386459feb00480cb5d56e788c5.png)](https://ktryhackme.com/jr/crisis)|
|Dev| [@anir0y](https://anir0y.in)|
|Tools required| [Wireshark](https://wireshark.org)|
|Join Room| [Crisis](tryhackme.com/jr/crisis)|

---

## Task 01: Introduction

- Download the File
- open with Wireshark

### 1.1

Download file.

### 1.2

When it all started?

- Open packet 1, layer 1 reavels the Time Stamp
  
  ![img](https://i.imgur.com/V5mg69J.png)

- Enter Format (MMM DD, YYYY)
  
### 1.3

What is the domain name?

- Check the DNS (use filer `DNS`)

     ![dns](https://i.imgur.com/gtnvuN0.png)

### 1.4

What is the EMAIL Sending Protocol & Port

- RFC  [8314](https://datatracker.ietf.org/doc/html/rfc8314); hint [wiki](https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol)
  
- use the protocol name/port filer to find ans.
  
  ![smtp-filter](https://i.imgur.com/jzwZ6Zz.png)

### 1.5

What is the EMAIL Receiving Protocol?

- RFC 918; [wiki](https://en.wikipedia.org/wiki/Post_Office_Protocol)
  
     ![pop](https://i.imgur.com/BSeo328.png)

---

## Task 02: Find the Mails

as we already know the email protocols that was used in this logs, let's find out the emails.

### 2.1

Who received the First email?

- email receiving protocol was `POP` 
- filter the results
- read the first `Recepient email`

     ![2.1](https://i.imgur.com/4od7VTn.png)

### 2.2

Who send the First Email?

- Same [task 2.1](#21) reveals the `return path` email.

### 2.3

there is a 'Super Hero Reference' who is he??

- read the first email reply. (filter: `SMTP`)

- filter the logs
  
  ![smtp](https://i.imgur.com/gL3ur4U.png)

- follow the streams; change steam here.
  
  ![stream](https://i.imgur.com/nNijCEk.png)

### 2.4

### 2.5

Uhmm, Babe is mad! Our guy sent a hint to the other guy. what he said?

- read the emails, you'll find a reference what `monitor` did wrong.
- ans is in `tcp.stream eq 20`
  
     ![2.5](https://i.imgur.com/6QrcwBj.png)

### 2.6

what is username for the Computer Network ?

- read the `incoming email`
- find the `creds` on `outgoing email steam`
  
  ![2.6](https://i.imgur.com/umIEkkJ.png)

### 2.7

what is the password for the Computer Network?

- follow the [task 2.6](#26)
  ---

## Task 03: Twisters

### 3.1

Who send the bad word about 'Monitor'?

- read the emails
- you'll discover a new email address.
- he sent a very compaling evidence email

     ![am](https://i.imgur.com/6BuDZb4.png)

### 3.2

What was the name of executable file?

- read the `http` packets.
- you'll find this file
     ![img](https://i.imgur.com/bCLeJku.png)

### 3.3

What is IP address of Attacker

- read the `http` packets
- ans is the `source IP` address, from where the `exe` file was downloaded.

---

## Task 04: Rescue

### 4.1

Our hero sent SOS to ?

- oliver send email to someone seeking for help
- filter with `smtp` read the emails, you'll discover another new email address

     ![img](https://i.imgur.com/4VoHBAd.png)

### 4.2

Password

- and is in [task 4.1](#41)

---

## Thanks for Reading, please try this box and send your feedbacks on 
`classroom@anir0y.in`.