---
title: Basics of Ransomware
date: 2022-06-20T16:58:42+05:30
lastmod: 2022-06-20T16:58:42+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: /img/ransomware.png
  alt: "cover image"
simg: /img/ransomware.png

categories:

tags:



draft: false
description: All About the Ransomware and how it works! 

---

# Let's learn about Ransomware

Ransomware is a malicious computer software which encrypts the computer's data thereby blocking access to it. The ransomware will demand an amount (Ransom) which is to be paid 
via Bitcoin or any other such crypto currencies in order to get our files restored to their original form. The first documented case appeared in 2005 in the United States, but quickly spread around the world

Here is a MAP how ransomware works : 

![img](https://i.imgur.com/X2i2rKO.png)

## LET'S understand how ransomware works :

* The attacker create a pair of keys and will place the public key in the malware while keeping the private key with themselves. & private key is the only way to recover the original data.
* They spread the ransomware via Email or via any Social Engineering techniques, Malvertising (Malware-Advertising). We will write another post about the spamming email, botnets & how it works.
* When the User installs the malicious software, the software generate a random symmetric key which is encrypted using the public key in the malware and it then encrypts the victims data with it.
* It creates a asymmetric ciphertext and asymmetric cipher text to make it harder to do reverse engineer
* After receiving the Ransom amount the target computer sends the asymmetric key to the Hacker's C&C server. Once payment done Hacker uses his Private key that he kept safe with him to decrypt the key received by user then send it back to user. Using that plan text key user can decrypt the encrypted data of his computer.
* Please Note: Most of the Hackers are using TOR network to hide their real lD. & it's still a challenge to law & Enforcement to find out the real ID behind the TOR network.


<center>
<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/KbuPAHqx3o4?controls=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

---

> I hope you like this small blog post about ransomware, Keep learning and stay Cyber Safe!!!

</center>