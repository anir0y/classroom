---
title: Notes OSIModel Explained
date: 2021-04-25T20:20:59+05:30
lastmod: 2021-04-25T20:20:59+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
cover: /img/blog.png
categories:
  - Classroom
tags:
  - notes
  - OSI Model 
  - wireshark
  
draft: false
---

# OSI Model Explained
 ![OSI Model](https://i.imgur.com/r4SjjLc.png)

## Packet Details

You can double click on a packet in capture to open its details. Packets consist of 5 to 7 layers based on the OSI model. We will go over all of them in an HTTP packet from a sample capture

![](https://i.imgur.com/7t17lRS.png)

Looking above we can see 7 distinct layers to the packet: frame/packet, source [MAC], source [IP], protocol, protocol errors, application protocol, and application data. Below we will go over the layers in more detail.

* Frame (Layer 1) -- This will show you what frame / packet you are looking at as well as details specific to the Physical layer of the OSI model.
![](https://i.imgur.com/FcyFnvP.png)

* Source [MAC] (Layer 2) -- This will show you the source and destination MAC Addresses; from the Data Link layer of the OSI model
![](https://i.imgur.com/FhMBxhJ.png)

* Source [IP] (Layer 3) -- This will show you the source and destination IPv4 Addresses; from the Network layer of the OSI model.
![](https://i.imgur.com/ePKFM8U.png)

* Protocol (Layer 4) -- This will show you details of the protocol used (UDP/TCP) along with source and destination ports; from the Transport layer of the OSI model.
![](https://i.imgur.com/Qo15Yi0.png)

* Protocol Errors -- This is a continuation of the 4th layer showing specific segments from TCP that needed to be reassembled.
![](https://i.imgur.com/Y6gFzip.png)

* Application Protocol (Layer 5) -- This will show details specific to the protocol being used such HTTP, FTP, SMB, etc. From the Application layer of the OSI model.
![](https://i.imgur.com/iIokXva.png)

* Application Data -- This is an extension of layer 5 that can show the application-specific data
![](https://i.imgur.com/VBv5cHG.png)

> source [tryhackme](https://tryhackme.com/room/wireshark)
<!-- Ads code-->
---
<script type="text/javascript" language="javascript">
      var aax_size='728x90';
      var aax_pubname = 'anir0y-21';
      var aax_src='302';
    </script>
<script type="text/javascript" language="javascript" src="https://c.amazon-adsystem.com/aax2/assoc.js"></script>