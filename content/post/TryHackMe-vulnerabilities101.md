---
title: Try Hack Me Vulnerabilities 101
date: 2021-09-21T14:21:54+05:30
lastmod: 2021-09-21T14:21:54+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: /img/Vulnerabilities101.png
  alt: "cover image"
simg: /img/Vulnerabilities101.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm

draft: false
description: TryHackMe Room Vulnerabilities 101 solved by Animesh Roy. this is a walkthough. read more...

---

## OverView

Understand the flaws of an application and apply your researching skills on some vulnerability databases.

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Vulnerabilities 101|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/d30e917f1945d3e25592ee34805bb900.png)|
| <b> Vulnerabilities 101 [FREE ROOM] </b>| [Vulnerabilities 101](https://tryhackme.com/room/vulnerabilities101)|

## Task 01: Introduction

Cybersecurity is big business in the modern-day world. The hacks that we hear about in newspapers are from exploiting vulnerabilities. In this room, we're going to explain exactly what a vulnerability is, the types of vulnerabilities and how we can exploit these for success in our penetration testing endeavours.

An enormous part of penetration testing is knowing the skills and resources for whatever situation you face. This room is going to introduce you to some resources that are essential when researching vulnerabilities, specifically, you are going to be introduced to:

* What vulnerabilities are
* Why they're worthy of learning about
* How are vulnerabilities rated
* Databases for vulnerability research
* A showcase of how vulnerability research is used on ACKme's engagement

---

## Task 02: Introduction to Vulnerabilities

A vulnerability in cybersecurity is defined as a weakness or flaw in the design, implementation or behaviours of a system or application. An attacker can exploit these weaknesses to gain access to unauthorised information or perform unauthorised actions. The term “vulnerability” has many definitions by cybersecurity bodies. However, there is minimal variation between them all.

For example, NIST defines a vulnerability as “weakness in an information system, system security procedures, internal controls, or implementation that could be exploited or triggered by a threat source”.

Vulnerabilities can originate from many factors, including a poor design of an application or an oversight of the intended actions from a user.

We will come on to discuss the various types of vulnerabilities in a later room. However, for now, we should know that there are arguably five main categories of vulnerabilities:

![img](https://i.imgur.com/90XTXlb.png)

### 02: Answer the questions below

|queation|ans|
|---|:---:|
|An attacker has been able to upgrade the permissions of their system account from “user” to “administrator”. What type of vulnerability is this?|`Operating System`|
|You manage to bypass a login panel using cookies to authenticate. What type of vulnerability is this?|`Application Logic`|

---

## Task 03: Scoring Vulnerabilities (CVSS & VPR)

Vulnerability management is the process of evaluating, categorising and ultimately remediating threats (vulnerabilities) faced by an organisation.

It is arguably impossible to patch and remedy every single vulnerability in a network or computer system and sometimes a waste of resources.

After all, only approximately 2% of vulnerabilities only ever end up being exploited (Kenna security., 2020). Instead, it is all about addressing the most dangerous vulnerabilities and reducing the likelihood of an attack vector being used to exploit a system.

This is where vulnerability scoring comes into play. Vulnerability scoring serves a vital role in vulnerability management and is used to determine the potential risk and impact a vulnerability may have on a network or computer system. For example, the popular Common Vulnerability Scoring System (CVSS) awards points to a vulnerability based upon its features, availability, and reproducibility.

Of course, as always in the world of IT, there is never just one framework or proposed idea. Let’s explore two of the more common frameworks and analyse how they differ.

Common Vulnerability Scoring System

First introduced in 2005, the Common Vulnerability Scoring System (or CVSS) is a very popular framework for vulnerability scoring and has three major iterations. As it stands, the current version is CVSSv3.1 (with version 4.0 currently in draft) a score is essentially determined by some of the following factors (but many more):

  1. How easy is it to exploit the vulnerability?

  2. Do exploits exist for this?  3. How does this vulnerability interfere with the CIA triad?

In fact, there are so many variables that you have to use a calculator to figure out the score using this framework. A vulnerability is given a classification (out of five) depending on the score that is has been assigned. I have put the Qualitative Severity Rating Scale and their score ranges into the table below.

![img](https://i.imgur.com/ERnJy4n.png)

However, CVSS is not a magic bullet. Let’s analyse some of the advantages and disadvantages of CVSS in the table below:

![img](https://i.imgur.com/0GYpM7U.png)

Vulnerability Priority Rating (VPR)

The VPR framework is a much more modern framework in vulnerability management – developed by Tenable, an industry solutions provider for vulnerability management. This framework is considered to be risk-driven; meaning that vulnerabilities are given a score with a heavy focus on the risk a vulnerability poses to the organisation itself, rather than factors such as impact (like with CVSS).

Unlike CVSS, VPR scoring takes into account the relevancy of a vulnerability. For example, no risk is considered regarding a vulnerability if that vulnerability does not apply to the organisation (i.e. they do not use the software that is vulnerable). VPR is also considerably dynamic in its scoring, where the risk that a vulnerability may pose can change almost daily as it ages.

VPR uses a similar scoring range as CVSS, which I have also put into the table below. However, two notable differences are that VPR does not have a “None/Informational” category, and because VPR uses a different scoring method, the same vulnerability will have a different score using VPR than when using CVSS.

![img](https://i.imgur.com/lAmphuS.png)

Let’s recap some of the advantages and disadvantages of using the VPR framework in the table below.

![img](https://i.imgur.com/rGB4Cou.png)

![img](https://i.imgur.com/yVHUUzd.png)

---

## Task 04: Vulnerability Databases

Throughout your journey in cybersecurity, you will often come across a magnitude of different applications and services. For example, a CMS whilst they all have the same purpose, often have very different designs and behaviours (and, in turn, potentially different vulnerabilities).

Thankfully for us, there are resources on the internet that keep track of vulnerabilities for all sorts of software, operating systems and more! This room will showcase two databases that we can use to look up existing vulnerabilities for applications discovered in our infosec journey, specifically the following websites: 

1. NVD (National Vulnerability Database)
2. Exploit-DB

Before we dive into these two resources, let’s ensure that our understanding of some fundamental key terms is on the same page:

|Term|Definition|
|---|---|
|Vulnerability|A vulnerability is defined as a weakness or flaw in the design, implementation or behaviours of a system or application|
|Exploit|An exploit is something such as an action or behaviour that utilises a vulnerability on a system or application|
|Proof of Concept (PoC)|A PoC is a technique or tool that often demonstrates the exploitation of a vulnerability|

#### NVD – National Vulnerability Database

The National Vulnerability Database is a website that lists all publically categorised vulnerabilities. In cybersecurity, vulnerabilities are classified under “Common Vulnerabilities and Exposures” (Or CVE for short).

These CVEs have the formatting of CVE-YEAR-IDNUMBER. For example, the vulnerability that the famous malware WannaCry used was CVE-2017-0144.

NVD allows you to see all the CVEs that have been confirmed, using filters by category and month of submission. For example, it is three days into August; there have already been 223 new CVEs submitted to this database.

![img](https://tryhackme-images.s3.amazonaws.com/user-uploads/5de96d9ca744773ea7ef8c00/room-content/aa86c1cce478d6c357f5507d927c9e88.png)

While this website helps keep track of new vulnerabilities, it is not great when searching for vulnerabilities for a specific application or scenario.

#### Exploit-DB

Exploit-DB is a resource that we, as hackers, will find much more helpful during an assessment. Exploit-DB retains exploits for software and applications stored under the name, author and version of the software or application.

We can use Exploit-DB to look for snippets of code (known as Proof of Concepts) that are used to exploit a specific vulnerability.

![img](https://assets.tryhackme.com/additional/vulnerability-module/vulnerabilities101/exploitdb1.png)

### 03: Answer the questions below

|queation|ans|
|---|:---:|
|Using NVD, how many CVEs were submitted in July 2021?	|`1585`|
|Who is the author of Exploit-DB?|`offensive security`|

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

## Task 05: An Example of Finding a Vulnerability

In this task, I’m going to demonstrate the process of finding one minor vulnerability, coupled with some research of the vulnerability databases leading to a much more valuable vulnerability and exploit ultimately.
Throughout an assessment, you will often combine multiple vulnerabilities to get results. For example, in this task, we will leverage the “Version Disclosure” vulnerability to find out the version of an application. With this version, we can then use Exploit-DB to search for any exploits that work with that specific version.

Applications and software usually have a version number. This information is usually left with good intentions; for example, the author can support multiple versions of the software and the likes. Or sometimes, left unintentionally.
For example, in the screenshot below, we can see that the name and version number of this application is “Apache Tomcat 9.0.17”

![img](https://assets.tryhackme.com/additional/vulnerability-module/vulnerabilities101/tomcat1.png)

With this information in hand, let’s use the search filter on Exploit-DB to look for any exploits that may apply to “Apache Tomcat 9.0.17”.

![img](https://assets.tryhackme.com/additional/vulnerability-module/vulnerabilities101/tomcat2.png)

Great! After searching Exploit-DB, there are a total of five exploits that may be useful to us for this specific version of the application. 

### 04: Answer the questions below

|queation|ans|
|---|:---:|
|What type of vulnerability did we use to find the name and version of the application in this example?|`version disclousure`|

---

## Task 06: Showcase: Exploiting Ackme’s Application

Follow the instructions to complete the lab.

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
