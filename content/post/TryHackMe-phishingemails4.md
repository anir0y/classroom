---
title: Try Hack Me Phishing Emails 4
date: 2022-08-16T15:24:03+05:30
lastmod: 2022-08-16T15:24:03+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: /img/phishing-4.png
  alt: "cover image"
simg: /img/phishing-4.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm

draft: false
description: Try Hack Me Room Phishing Emails 4 solved by Animesh Roy. this is a walkthrough. read more...

---

## OverView


| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Phishing Email 4|![logo](https://i.imgur.com/TYr2wgy.png)|
| <b> Phishing Email 4 [Subscription Required] </b>| [Phishing Email 4](https://tryhackme.com/room/phishingemails4gkxh)|


## Task 01:  Introduction


### 1.1 What is the MITRE ID for Software Configuration?

> Answer : M1054

## Task 02: PF (Sender Policy Framework)

What is the Sender Policy Framework (SPF)?

Per dmarcian, "Sender Policy Framework (SPF) is used to authenticate the sender of an email. With an SPF record in place, Internet Service Providers can verify that a mail server is authorized to send email for a specific domain. An SPF record is a DNS TXT record containing a list of the IP addresses that are allowed to send email on behalf of your domain."

Below is a visual workflow for SPF.

![img](https://assets.tryhackme.com/additional/phishing4/dmarcian-spf.png)

*Note:* Credit to dmarcian for the above image.

How does a basic SPF record look like?

`v=spf1 ip4:127.0.0.1 include:_spf.google.com -all`

An explanation for the above record:

`v=spf1` -> This is the start of the SPF record
`ip4:127.0.0.1` -> This specifies which IP (in this case version IP4 & not IP6) can send mail
`include:_spf.google.com` -> This specifies which domain can send mail
`-all` -> non-authorized emails will be rejected

### 2 Answer the questions below

#### 2.1 What is the SPF rule to use if you wish to ensure an operator rejects emails without potentially discarding a legitimate email?

> `v=spf1 ~all`

#### 2.2 What is the meaning of the -all tag?

> `fail`

**Ref**

* https://dmarcian.com/what-is-spf/
* https://dmarcian.com/spf-syntax-table/
* https://dmarcian.com/what-is-the-difference-between-spf-all-and-all/
* https://dmarcian.com/spf-survey/
* https://dmarcian.com/create-spf-record/
* https://toolbox.googleapps.com/apps/messageheader/
* https://dmarcian.com/---

## Task 03: DKIM (DomainKeys Identified Mail)

What is DKIM?

Per dmarcian, "DKIM stands for DomainKeys Identified Mail and is used for the authentication of an email that’s being sent. Like SPF, DKIM is an open standard for email authentication that is used for DMARC alignment. A DKIM record exists in the DNS, but it is a bit more complicated than SPF. DKIM’s advantage is that it can survive forwarding, which makes it superior to SPF and a foundation for securing your email."

How does a DKIM record look like?

`v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxTQIC7vZAHHZ7WVv/5x/qH1RAgMQI+y6Xtsn73rWOgeBQjHKbmIEIlgrebyWWFCXjmzIP0NYJrGehenmPWK5bF/TRDstbM8uVQCUWpoRAHzuhIxPSYW6k/w2+HdCECF2gnGmmw1cT6nHjfCyKGsM0On0HDvxP8I5YQIIlzNigP32n1hVnQP+UuInj0wLIdOBIWkHdnFewzGK2+qjF2wmEjx+vqHDnxdUTay5DfTGaqgA9AKjgXNjLEbKlEWvy0tj7UzQRHd24a5+2x/R4Pc7PF/y6OxAwYBZnEPO0sJwio4uqL9CYZcvaHGCLOIMwQmNTPMKGC9nt3PSjujfHUBX3wIDAQAB`

An explanation of the above record:

`v=DKIM1`-> This is the version of the DKIM record. This is optional. 
`k=rsa` -> This is the key type. The default value is RSA. RSA is an encryption algorithm (cryptosystem).
`p=` -> This is the public key that will be matched to the private key, which was created during the DKIM setup process. 

The below image is a snippet of an email header for an email flagged as spam that contained a potentially malicious attachment. 

![img](https://tryhackme-images.s3.amazonaws.com/user-uploads/5de58e2bfac4a912bcc7a3e9/room-content/334dbef5ba955a23b7e84629b85eb26a.png)

### 3 Answer the questions below

#### 3.1  Which email header shows the status of whether DKIM passed or failed?

> `Authentication-Results`

**ref**

* https://dmarcian.com/dkim-selectors/
* https://help.returnpath.com/hc/en-us/articles/222481088-DKIM-DNS-record-overview

---

## Task 04:  DMARC (Domain-Based Message Authentication, Reporting, and Conformance)

What is DMARC?

Per dmarcian, "DMARC, (Domain-based  Message Authentication Reporting, & Conformance) an open source standard, uses a concept called alignment to tie the result of two other open source standards, SPF (a published list of servers that are authorized to send email on behalf of a domain) and DKIM (a tamper-evident domain seal associated with a piece of email), to the content of an email. If not already deployed, putting a DMARC record into place for your domain will give you feedback that will allow you to troubleshoot your SPF and DKIM configurations if needed."

How does a basic DMARC record look like?

`v=DMARC1; p=quarantine; rua=mailto:postmaster@website.com`

An explanation of the above record:

`v=DMARC1` -> Must be in all caps, and it's not optional
`p=quarantine` -> If a check fails, then an email will be sent to the spam folder (DMARC Policy)
`rua=mailto:postmaster@website.com` -> Aggregate reports will be sent to this email address

Let's use the Domain Health Checker from dmarcian.com and check the DMARC status of microsoft.com. 

![img](https://tryhackme-images.s3.amazonaws.com/user-uploads/5de58e2bfac4a912bcc7a3e9/room-content/9b94a157faf86848b26093efb30c2126.png)

And the results are...

![img](https://tryhackme-images.s3.amazonaws.com/user-uploads/5de58e2bfac4a912bcc7a3e9/room-content/72bc9ea8efe179361c958a951f9db9fb.png)

Microsoft passed all checks. We can drill down into DMARC, SPF, or DKIM to get more details.

DMARC:

![img](https://tryhackme-images.s3.amazonaws.com/user-uploads/5de58e2bfac4a912bcc7a3e9/room-content/d0b2fc15e23d1466ff98efc98afef61e.png)

In the details above, we can see that all emails that fail the DMARC check will be rejected.

### 4 Answer the questions below

#### 4.1 Which DMARC policy would you use not to accept an email if the message fails the DMARC check?

> `p=reject`

**Ref**

* https://dmarcian.com/dmarc-record/
* https://dmarc.org/overview/
* https://dmarcian.com/alignment/

---

## Task 05:  S/MIME (Secure/Multipurpose Internet Mail Extensions)

What is S/MIME?

Per Microsoft, "S/MIME (Secure/Multipurpose internet Mail Extensions) is a widely accepted protocol for sending digitally signed and encrypted messages."

As you can tell from the definition above, the 2 main ingredients for S/MIME are:

* Digital Signatures
* Encryption

Using [Public Key Cryptography](https://www.ibm.com/docs/en/ztpf/1.1.0.14?topic=concepts-public-key-cryptography), S/MIME guarantees data integrity and nonrepudiation. 

* If Bob wishes to use S/MIME, then he'll need a digital certificate. This digital certificate will contain his public key. 
* With this digital certificate, Bob can "sign" the email message with his private key. 
* Mary can then decrypt Bob's message with Bob's public key. 
* Mary will do the same (send her certificate to Bob) when she replies to his email, and Bob complete the same process on his end.
* Both will now have each other's certificates for future correspondence. 

The illustration below will help you understand how public key cryptography works. 

![img](https://tryhackme-images.s3.amazonaws.com/user-uploads/5de58e2bfac4a912bcc7a3e9/room-content/4e01a85a20db9d2890d2b42c4ba1fd43.png)

Refer to this Microsoft documentation for more information on S/MIME and steps on how to configure Office 365 to send/receive S/MIME emails.

### 5 Answer the questions below

#### 5.1 What is nonrepudiation? (The answer is a full sentence, including the ".")

> `The uniqueness of a signature prevents the owner of the signature from disowning the signature.`


**ref**

* https://docs.microsoft.com/en-us/exchange/security-and-compliance/smime-exo/smime-exo
* https://www.ibm.com/docs/en/ztpf/1.1.0.14?topic=concepts-public-key-cryptography
* https://docs.microsoft.com/en-us/exchange/security-and-compliance/smime-exo/smime-exo

---

## Task 06: SMTP Status Codes

In this task, you'll examine a PCAP file with SMTP traffic. You'll only focus on SMTP codes in this task.

Here are two resources to assist you with this task:

* https://www.wireshark.org/docs/dfref/s/smtp.html
* https://www.mailersend.com/blog/smtp-codes


### 6 Answer the questions below

#### 6.1 What Wireshark filter can you use to narrow down the packet output using SMTP status codes?

> `smtp.response.code` 

![img](https://i.imgur.com/DIIoEdm.png)

#### 6.2 Per the network traffic, what was the message for status code 220? (Do not include the status code (220) in the answer)

![img](https://i.imgur.com/l5c0Hrf.png)

#### 6.3 One packet shows a response that an email was blocked using spamhaus.org. What were the packet number and status code? (no spaces in your answer)

![img](https://i.imgur.com/T9R9mD5.png)

#### 6.4 Based on the packet from the previous question, what was the message regarding the mailbox?

> ref to image in [6.3](#63-one-packet-shows-a-response-that-an-email-was-blocked-using-spamhausorg-what-were-the-packet-number-and-status-code-no-spaces-in-your-answer)


`mailbox name not allowed`

#### 6.5 What is the status code that will typically precede a SMTP DATA command?

ref to this : https://www.mailersend.com/blog/smtp-codes

---

## Task 07: SMTP Traffic Analysis

In this task, you'll move beyond SMTP codes and analyze trivial SMTP traffic. 

The reference below may assist you with this task:

* https://www.wireshark.org/docs/dfref/i/imf.html

### 7 Answer the questions below

#### 7.1 What port is the SMTP traffic using?

> `port 25`

#### 7.2 How many packets are specifically SMTP?

![img](https://i.imgur.com/uhyIxLY.png)

#### 7.3 What is the source IP address for all the SMTP traffic?

ref to wireshark to list all traffic 

1. 

![img](https://i.imgur.com/qGe2IWE.png)

2. 

![img](https://i.imgur.com/NISf2wh.png)

#### 7.4. What is the filename of the third file attachment?

> filter used `mime_multipart.header.content-disposition`

result:

![img](https://i.imgur.com/9r2m9Jx.png)

#### 7.5 How about the last file attachment?\

> ref to task [7.4](#74-what-is-the-filename-of-the-third-file-attachment) 

ans is `.zip`

---

## Task 08: SMTP and C&C Communication

**MITRE ATT&CK:**

* Techinique 1071 > Sub-Technique 3: https://attack.mitre.org/techniques/T1071/003/

_Per MITRE, "Adversaries may communicate using application layer protocols associated with electronic mail delivery to avoid detection/network filtering by blending in with existing traffic. Commands to the remote system, and often the results of those commands, will be embedded within the protocol traffic between the client and server."_

Several notable groups, such as APT 28, APT 32, and Turla, to name a few, have used this technique.

**Recommended mitigation (per MITRE):**

*"Network intrusion detection and prevention systems that use network signatures to identify traffic for specific adversary malware can be used to mitigate activity at the network level."*

**Detection opportunity (per MITRE):**

*"Analyze packet contents to detect application layer protocols that do not follow the expected protocol standards regarding syntax, structure, or any other variable adversaries could leverage to conceal data."*

Note: We will cover Network Intrusion Prevention and Detection in future rooms. 

### 8 Answer the questions below

#### 8.1 Per MITRE ATT&CK, which software is associated with using SMTP and POP3 for C2 communications?

> erf to documet shared read this [link](https://attack.mitre.org/software/S0251/)
> ans is `Zebrocy`

---

## Task 09: Conclusion

A playbook is a defined process that should be followed in a specific situation, in this case, a phishing incident. 

Phishing IR Playbook:

https://www.incidentresponse.org/playbooks/phishing


Lastly, the PCAP file used in this room was from Malware Traffic Analysis. You can explore more details about this PCAP or other samples.

SMTP PCAP Credit: 

https://www.malware-traffic-analysis.net/2018/12/19/index.html

### 9 Answer the questions below

#### 9.1 Per the playbook, what framework was used for the IR process?

> `NIST` 