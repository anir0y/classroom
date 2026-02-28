---
title: "Phishing Attack"
date: 2021-03-21T21:23:22+05:30
lastmod: 2021-03-21T21:23:22+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
cover:
  image: /img/cover.jpg
  alt: "cover image"
categories:
  - Attacks
  - social engineering
tags:
  - tools
draft: false
description: "Learn how phishing attacks work — types, techniques, real-world examples, and tools used in social engineering credential theft."
---


<img src="https://i.imgur.com/F6UyCki.png" width="80%" height="auto">

## Overview:
Even though the internet is one of the man’s great creation, but it has remained as a root cause for many cyber attacks. Let us discuss about cyber punk who is the root cause for many data breaches that has happened till date.

Phishing is a type of social engineering attack, where the attacker generally tries to impersonate as a legitimate person to get some sensitive credentials like [username, passwords, etc] of the target. It is the most common and widely used technique to gain initial access or to intrude into an internal network of an organisation. These attacks generally target financial service companies, cooperative employees, top management. Phishing technique is a root cause for many data thefts, and the reason for this lack of awareness among the employees

> "The Covid-19 epidemic has increased the registration of phishing messages. More than 32% of data breaches have occurred in the year 2020, according to the survey"

An attacker generally targets the victims via some common communication mediums such as:

1. Email
2. SMS
3. Social media
4. Telephone 

More than 1,300 simulated phishing campaigns involve more than 360,000 emails across a wide customer base. 


An attacker impersonates from a legitimate company in an attempt to steal victim’s personal data or login credentials or else in some cases poses as a trustworthy party to trick people into handing over personal details. The success rate of phishing attacks keeps on increasing, it has become the most common methodology to gain sensitive information from the target users. 

Phishing can be executed on various platforms like Windows, Linux, Mac, even android. Many publicly available tools like Weeman, social engineering toolkit which makes our job(attacker’s job) easier.

> Note: phishing was initially coined in the year 1996 [used to steal online account password]
<br>
<img src="https://i.imgur.com/7NScXfl.png" width="30%" height="auto"><br>

Adversaries send maliciously crafted email attachments to the victim, typically to execute some malicious programs on the victim’s machine to gather sensitive information, intrude into the internal network, steal credentials and etc.

Phishing typically involves both social engineering and technical trickery to deceive victims into opening the attached files.

Attackers target specific users to execute these types of attacks. After collecting all the possible information about the victim using some social engineering methods. A malicious link is sent to the targeted victim, when he/she accidentally opens the link they are automatically redirected to a fake page which seems to be a legitimate one. It is one of the toughest task for the victim to analyse and identify the fake. Once the credentials are entered, they are captured at the attacker’s end in a plain text form.



Types of phishing:
===============	

Generally, phishing can be categorised based on their working and functionality:

### 1. Spearphishing Attachments (T1566.001):

Adversaries may send a crafted email with malicious attachments. When the target downloads or executes the attachment received in the email, the attacker can harvest the credentials and deliver malware on the targeted system.

Attachments are in the form of pdf,docs,xls or zip files.

Example: Attackers use spear-phishing emails containing attachments (which are often stolen, legitimate documents sent from compromised accounts) with embedded malicious macros.

Macro is a function which automates the frequently used tasks in Microsoft office.

### 2. Spearphishing link (T1566.002 ):
Adversaries send the crafted URL [link](https://) to the specific target via some email or social media platforms when the victim opens the link, it will prompt a crafted login page which requests for user-credentials, or it will redirect the victim to a compromised website which lures the target to download some malicious application. The website visited by the victim may be compromised one or victim’s web browser is hooked.

It requires social engineering tactics to target a specific individual, company, or industry

### 3. Spearphishing via service(T1566.003 ):
Adversaries will create fake social media accounts and personally message employees for potential job opportunities, high cash prices and offers, In this scenario,messages will be delivered through various social media platforms like personal mail, Facebook, twitter etc. This allows an adversary to bypass some email restrictions.

### 4. Vishing
Adversaries generally target the user via phone calls. Attackers can perpetuate this type of attack by setting up a Voice over Internet Protocol (VoIP) server to mimic various entities in order to steal sensitive data and/or funds.

### 5. Smishing
Adversaries generally target the user via SMS. The attacker craft malicious text messages to trick users into clicking on a malicious link or handing over personal information. Smishing is generally used by the scammers.

Consequence and Impact:
===============	
Phishing stills remains a root cause for many data breaches. This attack has a severe effect on the business firms which involves money transactions. It’s difficult to identify if your information is stolen or not. In some cases it even leads to:

- reputation damage, 
- loss of company value
- financial loss

Attackers generally use different strategies and techniques. Phishing, in general involves manipulation, redirection, forgery, mimicking and cloning


Red Team: Attack Scenario
===============	

[phish me](https://github.com/anir0y/phishme) is an open-source tool which is used to generate phishing pages. 

---

##### PREREQUISITES

* Python 3.x 
* pip3
* PHP
* curl
* git
* unzip

##### PYTHON 3 PREREQUISITES
- wget
- huepy


#### How to use 

- How to install [YouTube part I ](https://youtu.be/SbSnt-VmvIw)
- how to use [YouTube Part II](https://youtu.be/Xcy36kCGFqQ)


#### you're lazy too??? read this. 
well, I'm lazy so I created a script that automate pretty much all, once you git clone this, run the magic.sh file.

>For Windows magic.sh won't work!<br> ![](https://www.reactiongifs.com/wp-content/uploads/2013/07/running.gif)
<br>

#### Linux user run this:
``` bash
chmod +x magic.sh && bash magic.sh 
```
it will do the rest, make sure you're running this as root. if you're not it will ask for sudo passwd or not, I don't know how your system is configured.


---