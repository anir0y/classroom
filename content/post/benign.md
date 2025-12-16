---
title: Try Hack Me Benign Room Walkthrough
date: 2025-12-16T13:23:02+05:30
lastmod: 2025-12-16T13:23:02+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover: /img/thm.gif # for tryhackMe
simg: /img/blog.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm

draft: true
description: Try Hack Me Room Benign solved by Animesh Roy. this is a walkthough. read more...

---

## OverView


| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Benign |![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/43027f83fddeab1e7b9d5642fc876390.png)|



## Task 01: Introduction
We will investigate host-centric logs in this challenge room to find suspicious process execution. To learn more about Splunk and how to investigate the logs, look at the rooms splunk101 and splunk201.

## Task 02: Scenario: Identify and Investigate an Infected Host

One of the client’s IDS indicated a potentially suspicious process execution indicating one of the hosts from the HR department was compromised. Some tools related to network information gathering / scheduled tasks were executed which confirmed the suspicion. Due to limited resources, we could only pull the process execution logs with Event ID: 4688 and ingested them into Splunk with the index win_eventlogs for further investigation.

**About the Network Information**

The network is divided into three logical segments. It will help in the investigation.

**IT Department**

- James
- Moin
- Katrina

**HR department**

- Haroon
- Chris
- Diana

**Marketing department**

- Bell
- Amelia
- Deepak

## Answer the questions below

### 2.1: How many logs are ingested from the month of March, 2022?

![img](/img/benign/1.png)

### 2.2: Imposter Alert: There seems to be an imposter account observed in the logs, what is the name of that user?

Run the below query to find the answer:

```splunk
index=win_eventlogs | stats count by UserName
```

![img](/img/benign/2.png)

Based on the above screenshot, the imposter account is `Amel1a`.

### 2.3: Which user from the HR department was observed to be running scheduled tasks?

Execute the below query to find the answer:
As we know to run scheduled tasks, the command `schtasks` is used. So we will filter out the logs containing `schtasks` command for the users in the HR department.

```splunk
index=win_eventlogs UserName IN (*haroon*,*chris*,*diana*) 
|  search schtasks
```
![img](/img/benign/3.png)

**Ans is** `Chris.fort`

### 2.4: Which user from the HR department executed a system process (LOLBIN) to download a payload from a file-sharing host.

Let's run the below query to find the answer:

```splunk
index=win_eventlogs UserName IN (*haroon*,*chris*,*diana*)
| regex CommandLine="(?i)(-download|-urlcache|-split|-enc|invoke-webrequest|iwr|wget|curl)"
```

![img](/img/benign/4.png)

### 2.5: To bypass the security controls, which system process (lolbin) was used to download a payload from the internet?

Above screenshot shows that `certutil.exe` was used to download the payload from the internet.

### 2.6: What was the date that this binary was executed by the infected host? format (YYYY-MM-DD)

Above screenshot shows that the date of execution is `2022-03-04`.

### 2.7: Which third-party site was accessed to download the malicious payload?

Above screenshot shows that the third-party site accessed is `controlc.com`.

### 2.8: What is the name of the file that was saved on the host machine from the C2 server during the post-exploitation phase?

Above screenshot shows that the file name is `benign.exe`.

### 2.9: The suspicious file downloaded from the C2 server contained malicious content with the pattern THM{..........}; what is that pattern?

Above screenshot shows the url is `https://controlc.com/e4d11035` which contains the pattern `THM{KJ&*H^B0}`.

### 2.10: What is the URL that the infected host connected to?

Same URL as above `https://controlc.com/e4d11035`.



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
<!-- Buy Me A Coffee -->

<script data-name="BMC-Widget" data-cfasync="false" src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js" data-id="anir0y" data-description="Support me on Buy me a coffee!" data-message="" data-color="#5F7FFF" data-position="Right" data-x_margin="18" data-y_margin="18"></script>

<!-- EOF -->
