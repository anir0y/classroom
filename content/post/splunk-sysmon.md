---
title: "Splunk Sysmon Configuration"
date: 2021-03-11T01:45:35+05:30
lastmod: 2021-03-11T01:45:35+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/cover.jpg
categories:
  - SIEM
tags:
  - splunk
  - sysmon
  - config
draft: false
description: "Guide to configuring Sysmon with Splunk for enhanced endpoint visibility, log collection, and threat detection in Windows environments."
---


# Configure your Splunk Universal forwarder to send Sysmon logs to Splunk

Okay locate your input.conf file and edit with your favorite text editor. It should be located somewhere similar to this

```
C:\Program Files\SplunkUniversalForwarder\etc\apps\SplunkUniversalForwarder\local\inputs.conf
```
and add the following

``` 
[WinEventLog://Microsoft-Windows-Sysmon/Operational]
checkpointInterval = 5
current_only = 0
disabled = 0
start_from = oldest
```
