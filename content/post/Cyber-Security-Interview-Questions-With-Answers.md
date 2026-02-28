---
title: Cyber Security Interview Questions With Answers
date: 2021-05-07T19:38:21+05:30
lastmod: 2021-05-07T19:38:21+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
cover:
  image: /img/blog.png
  alt: "cover image"
description: "50 cybersecurity interview questions with answers — cryptography, CIA triad, firewalls, IDS vs IPS, and more for job prep."
categories:
  - Classroom
tags:
  - notes
  - interview
  
draft: false
---
![](https://i.imgur.com/6bZ0NCp.png)

# 50 Cyber Security Interview Questions (With Answers)
---

## Top Cyber Security Interview Questions 

### Explain Cryptography
It is the science of protecting data from third-party using various methods. It is used to protect sensitive information that shouldn’t be disclosed to anyone other than the owners of the information. 

### Differentiate between Symmetric and Asymmetric encryption
Symmetric encryption – In this type of encryption, the same key is used for encryption

and decryption of data. It is more vulnerable this way and it is used to encrypt data transmissions that are bulky in nature. 

Asymmetric Encryption – In this type of encryption there are different keys for encryption and decryption.  It is slower in speed decryption than Symmetric encryption but its safer. Its often used to exchange sensitive material/information due to it being so secure

### What is the CIA triad? 
Confidentiality, integrity, and availability. It is a popular model used by organizations to draft policies for information security. 

Confidentiality stands for the information being available to authorize personal. The data has to be encrypted in case someone succeeds in accessing the data by hacking it, making it unreadable. 

Integrity stands for the safety of the data and its inability to be modified by unauthorized personnel. Data should be safe from tampering.

Availability means that the data should be available for the user as per their requirement. The data should be maintained accordingly. 

### How is encrypting different from hashing? 
Both processes focus on protecting data by converting them into unreadable format but Encrypted files can be returned to readable format by decryption whereas hashed data cannot be. 

### What is a firewall and why is it important? 
Firewalls are set on the edges of a network or system to prevent foreign attacks on the same like viruses, malware, worms, etc. It can also be used to prevent external access.

### What is the difference between vulnerability assessment and penetration testing? 
Vulnerability testing involves finding faults in a system, the organization already knows that there is a flaw/weakness in the system and prioritize on finding it. 

Penetration testing is the process of setting up all possible security measures and trying to find out if there are any vulnerabilities.

### What is a three-way handshake?
It is used to create a connection between the host and the client. It involves three steps in which the client and server exchange data packets.  

* Step 1 – The client sends an SYN packet to the servers to check if the server has any open ports. 

* Step 2 –  There server sends an SYN-ACK packet to the client to check for open ports.

* Step 3 –  The client sends an acknowledgment packet back to servers. 

### What is a traceroute and why is it used?   
It is a tool that shows the path that a packet takes. It is used to discover any problems in a path that a packet is taking. Any breaks in the connection that the path may experience. 

### What is the difference between HIDS and NIDS?
They both detect intrusions from external sources. The only difference between them both is that HDIS is set up on a device to monitor any suspicious activity or traffic on a device and NIDS is set up on a network to monitor the traffic on the network. 

### What are the steps to set up a firewall? 
* Set up a username/password for the firewall device. 
* Disable the remote administration feature
* Configure the appropriate port forwarding for certain applications like web servers or FTP servers.
* When a DHCP already exists installing a firewall may conflict with the existing DHCP so it needs to be disabled. 
* Logging is important to troubleshoot firewalls, make sure that logging is enabled, and learn how to read logs.
* Have solid security policies and make sure your firewall enforces them.

### What is an SSL encryption? 

It is the industry standard for encryption technology used to protect connections between web servers and websites. It is used for maintaining data privacy. 

This is how you establish a connection – 

* The browser connects to a server secured with SSL 
* The server sends a copy of its SSL certificate to the browser.
* The browser checks the certificate for authenticity and if it is confirmed then the browser requests the server to establish an encrypted connection. 
* The web server sends a notice to establish a secure SSL encrypted connection.
* Secure communication takes place between the Server and Browser.

### Steps involved in securing a server. 

* Step 1 –  Make sure that you have a safe password for root and administrative users. 

* Step 2 –  Make new users on the system that you will use to manage the system.

* Step 3 –  Remove access from the root accounts.

* Step 4 –  Reconfigure the rules of your firewall in terms of remote access. 

### Explain data leakage. 

It is a transfer of data from inside the organization to an external entity or third party that is intentional or unintentional.

There are three types of data leakage – 

Accidental breach – Someone unintentionally sends data to an unauthorized entity by accident or fault. 
Intentional breach –  Authorized personnel sends data to an unauthorized entity intentionally.    
System Hack – Hacking is used to extracting information. 

### What are some common cyber-attacks? 

Some of the most common cyber-attacks are Malware attacks, Phishing, Password attacks,  Man in the middle, Password attacks, drive-by downloading, Rogue software, Malvertising, personal attack, etc. 

### What is a brute force attack and how can you prevent it? 

A brute force attack is a method of accessing your passwords by repeatedly trying all the combinations until you get the right one. It is usually automated as millions of possibilities need to be tried before the answer can be found.  

It can be prevented using the following methods – 

  * The password length can be increased in order to make it harder to break into the system. 
  * Making complex passwords with multiple characters and using upper case and lower case words can help in making the password harder to crack. 
  * Limiting login attempts is very helpful. You can set the minimum limit of failed attempts to three. 

### Explain port scanning. 

Port scanning is used to identify open ports available on a host. Hackers use it to find information on vulnerabilities that they can exploit. Administrators use it to verify the security policy of a server. 

Some of the methods include – Ping scan, TCP half-open, TCP connect UDP, Stealth scanning. 

### Difference between threat, vulnerability, and risk in a network.

A threat is something with the potential to harm your system or network, A vulnerability is a potential weakness that can be exploited by a hacker, a risk is the potential to lose information or data if someone exploits the vulnerability. 

### How can identity theft be prevented? 

Ensure that you have a strong password, Avoid sharing confidential information online, shop from trustworthy stores, install good antivirus, use specialized security for financial data. 

### How often should you perform patch management? 

Patches should be installed in your system as soon as you can. Preferably one month after the patch has been released. The same applies to networks. 

### How do you reset a password-protected BIOS system?  

Pop-out the CMOS battery so that the setting that stores memory loses its power source and thus resets as a result.

### Explain a man in the middle attack and how to prevent it. 

It is a very basic concept, in this kind of attack the hacker places himself in the middle of a conversation between two people. If persons A and B are having a conversation then the hacker places himself int the middle of the conversation and receives data from both parties before sending it to the intended recipient. 

You can prevent it by the following methods – 

  * Use VPN
  * Use strong WEP/WPA encryption 
  * Force Https
  * Use public keypair based authentication

### Explain the DDOS attack and how to prevent it. 

A distributed denial of service (DDOS) is a cyber-attack where servers deny genuine clients. The attack comes in two types – 

  #### Flooding attacks – The hacker floods the server with information and the server breaks down unable to handle it. It is usually done using an automated program that sends packets continuously to the server. 

  #### Crash Attacks – The hackers use a bug in the server to crash it so that it doesn’t respond to the user. 

How to prevent it – 

  * Use anti-DDOS software 
  * Configure firewalls and routers 
  * Use front end hardware 
  * Use load balancing 
  * Handles spikes in the traffic

### Explain what an XSS attack is and how to prevent it. 

A cyber attack that lets the hacker insert malicious content into web pages, o it can be used to hijack sessions, steal cookies, crash the server, etc.

To prevent it you may – 

  * Validate user input 
  * Sanitize user input 
  * Encode special parameters 
  * Use XSS HTML filter 

### What is an ARP and how does it work? 

It is a protocol for tracing a physical machine address that is identified in the local network using an internet protocol address. 

When an information packet arrives at a gateway, the gateway asks the ARP program to find a physical address/Mac address that matches the host. 

If no results are found, then the ARP broadcast sends out a request packet to the surrounding machines on the Lan to see if anyone of them knew which machine the IP originated from. 

### What is port blocking within LAN? 

It is the process of restricting users from accessing services within the LAN. Ports are blocked which fills up the security holes in the infrastructure of the network.   

### Explain the concept of a botnet. 

It is a number of devices connected to the internet with each device having its own respective bots. They can be used to hack into victims’ phones using malicious scripts. 

### What is salted hashes? 

Salt is unprocessed data. When a password protected system gets a new password, a hash value of that password is created and then the combined value is stored in its database. It is a defense against hash attacks and dictionary attacks. 

### Difference between SSL and TLS 

 SSL verifies the identity of the person sending information, it doesn’t do anything else. It can help you track the person you are talking to but it can be fooled. 

TLS is an identification tool similar to SSL but it also offers additional protection of data and hence both types of protection are used together in order to protect data.

### Describe 2FA 

Two-factor authentication is a method by which an account is protected not just by the username and password but by a piece of physical information that only the user possesses. 

It is an extra layer of security. 

### What is cognitive cybersecurity?

It is using AI modeled around human thought processes to detect threats and defend systems both digital and physical. 

They use data mining, language processing, and pattern recognition to learn despite being a computer model. 

###  Explain phishing

A hacker attempts to steal information by disguising themselves as a legitimate person or business using fake emails and messages. 

### How to prevent phishing?

* Refrain from sharing sensitive information online. 
* Verify the site’s security
* Activate firewall
* Use a good antivirus software
* Use the Anti Phishing toolbar.

### What is an SQL injection?

This is an attack used to attack a server database. The attacker interferes with the data being sent to the server in order to execute a malicious SQL server in order to manipulate a database server. 

### How can an SQL injection be prevented? 

  * Always use prepared statements
  * Use stored procedures 
  * Validate user input


### What is the difference between a false positive and a false negative in IDS?

**A false positive** happens when it activates an alarm for legitimate network activity. It is nothing to be alarmed about.

**A false negative** is when some malicious activity is noticed by the IDS and it activates an alarm. 

### What is system hardening?

It is the process of protecting a system from external harm by using tools and techniques to identify and deal with vulnerabilities in the system. 

Its purpose is to decrease the vulnerability of a system and to decrease the attack surface.

There are various types of System Hardening – 

  * Database hardening 
  * Operating system hardening 
  * Application hardening 
  * Server hardening 
  * Network hardening 

### What is the meaning of compliance in cybersecurity? 

It is the compliance to a set of rules set forward by an organization, government, or another party.  It helps in identifying threats and acting on them and tracing out vulnerabilities in a system. 

### Who are the red and blue teams in reference to cybersecurity? 

These terms refer to teaks that are split during an exercise practiced by the cybersecurity department of all organizations where the department is split into two teams – the Blue team who are usually defenders, protect the system and the red team is the ones who attack ie the hackers. This is done to test the system for vulnerabilities. 

### What are the different signs that a network has been compromised? 

Some of the signs to look for are as follows – 

  * Unusual outbound traffic 
  * HTML respeonse sizes 
  * Increase in the data base read volume 
  * Red flags during log in 
  * Web traffic with bot-like behavior
  * Unusual DNS requests 
  * Mobile device profile changes

### What is an RDP (remote desktop protocol)? 

It is a software designed to protect data transfer between client services, users, and a virtual network server It allows admins to solve issues that users are facing remotely. 

### What is forward secrecy and how does it work? 

It is a feature of the key agreement protocol that assures us that even if the product key is compromised the session key won’t be.  

### What is an active reconnaissance?

In this kind of attack, the hacker monitors the target system for vulnerabilities before making a move. 

Port scanning is used to identify open and vulnerable ports that can be exploited.

### What is security misconfiguration? 

When an application/network/device is susceptible to attack because of an insecure configuration option like an unchanged password/username its called security misconfiguration. 

### Difference between information protection and information assurance. 

The difference between information protection and information assurance is that one protects data using encryption, security software, etc while the other keeps the data reliable by ensuring availability, authentication, confidentiality, etc.

### What do you mean by the chain of custody?  

It is a trail of paperwork of electronic data that records the custody, acquisition, and disposal of electronic evidence. 

### What are the different types of data classification? 

Data can be classified into three types – 

Top secret- This data is highly sensitive. Any leakage of data can cause problems for the organization. 
Confidential – This information is available to all the members of the company.
Public – Information that is readily available on the public domain. 
### Why is data classification required? 

Data is central to all organizations and control over it is very important. Imposing a classification helps in keeping the data secure. 

### What is an incident?
Any event that leads to the security of your organisation being compromised is called an incident. 

### How do you manage an incident? 

  * Identify the problem
  * Log it
  * Investigate and person root cause analysis
  * Escalate to management  
  * Fix the problem 
  * Write closure report 


### How to report risks?

Before risk is reported it needs to be analysed using qualitative and quantitative assessment. It can be done using the Technical and the business team. The former will look at the loss in numbers while the latter will look at the technical aspect and how often you encounter this issue. Later, you report the issue. 
 
---

> let me know if this helps :) 