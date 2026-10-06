---
title: "TryHackMe Python Core Concepts: Types, Lists, Loops"
date: 2026-10-06T19:17:00+05:30
lastmod: 2026-10-06T19:17:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-pycore/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Jr Penetration Tester
  - Python Scripting Basics
  - Python
  - Programming
  - Fundamentals
  - Data Types
  - Lists and Dictionaries
  - Loops
  - f-strings

draft: false
description: "Walkthrough of TryHackMe Python Core Concepts: data types, strings, lists and dictionaries, operators, and for and while loops, answer masks decoded."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Python: Core Concepts |![Python Core Concepts room icon](https://cdn-images.tryhackme.com/room-icons/5f04259cf9bf5b57aed2c476-1778051760462)|

Python: Core Concepts sits in the Python Scripting Basics module of the Jr Penetration Tester path, right after [Python: Simple Demo](/post/thm-room-python-simple-demo/) and before its companion room, Python: Building Scripts. It is an easy, mostly-conceptual room that reviews Python data types, strings, lists, dictionaries, operators, and loops, framed around a junior pentester who needs to check 10,000 harvested usernames against a password list. There is one question that needs the attached VM (running a demo script), and the real catch across the room is the answer mask: several answers are "right" in meaning but rejected until you match the exact characters, dots and parentheses included.

## Task 1: Introduction

No answer needed. The room sets the scene (scripting beats doing 10,000 checks by hand) and lists what it covers: data types, f-strings, string methods, lists and dictionaries, operators, and a second loop type. Click Complete.

## Task 2: Quick Review, Hello World, Variables, and Conditionals

The first question asks for the built-in function that reveals the data type of a value. That is **type()**. The mask is six characters, so include the parentheses: `type()`, not `type`.

The second question is a classic beginner trap: if a user types 3.14 at an `input()` prompt, what type does Python store it as before any conversion? `input()` always returns a **str**, regardless of what the user types. You have to cast it with `int()` or `float()` yourself.

The third question needs the attached VM. Start the machine from Task 1 (the green machine icon), open the VS Code environment, and run the demo in the integrated terminal:

```
  # run the f-strings and augmented-assignment demo
  python3 fstrings_demo.py
  Old style: admin is on port 443
  f-string:  admin is on port 443
  Total cost: $149.97

  Starting count: 0
  After += 5:    5
  After -= 2:    3
  After *= 4:    12
  After //= 3:   4

  Scan complete: 192.168.1.1 has 3 open ports
```

![VS Code terminal on the TryHackMe VM showing fstrings_demo.py output ending in Scan complete: 192.168.1.1 has 3 open ports](/img/thm-pycore/02-fstrings-output.png)

The last line printed is **Scan complete: 192.168.1.1 has 3 open ports**.

One practical note on the VM: it is a noVNC desktop running VS Code, and the split-screen view on the room page would not accept my keystrokes. Opening the machine in the fullscreen VM tab (the diagonal-arrows icon on the machine control bar) fixed the input immediately. If a VS Code or terminal in a THM split view ignores typing, go fullscreen before assuming the box is broken.

## Task 3: Working with Strings

The function that returns the number of characters in a string is **len()** (again, the mask wants the parentheses).

Given `word = "TryHackMe"`, what does `word[3:7]` return? Slicing includes the start index and excludes the end index, and counting from 0: index 3 is H, 4 is a, 5 is c, 6 is k, and index 7 is excluded. The answer is **Hack**.

The string method that converts "ADMIN" to "admin" is **.lower()**. The mask here starts with a literal dot (`._______`), so the accepted answer includes the leading dot: `.lower()`, not `lower()`.

## Task 4: Lists and Dictionaries

The method that adds an element to the end of a list is **.append()** (leading dot again).

Given `services = {22: "SSH", 80: "HTTP"}`, what does `services[80]` return? Dictionary lookup by key returns the value, so **HTTP**.

The dictionary method that retrieves a value with a safe fallback if the key does not exist is **.get()**. Unlike `services[key]`, which raises `KeyError` on a missing key, `services.get(key, default)` returns the default instead. The mask is a dot plus five characters, so `.get()`.

{{< ad >}}

## Task 5: Arithmetic and Membership Operators

The operator that returns the remainder of a division is the modulo operator, **%**.

`10 // 3` uses floor division, which divides and drops the fractional part, so it evaluates to **3**.

`2 ** 10` is exponentiation, 2 to the power of 10, which is **1024**.

## Task 6: Loops, for and while

The loop best suited for iterating over each item in a list is the **for** loop. The mask is three characters, so the answer is just `for`, not "for loop".

`range(3)` produces the sequence starting at 0 and stopping before 3: **0, 1, 2**. The mask (`_, _, _`) tells you the room wants the commas and spaces.

The keyword that immediately exits a loop is **break**. The room used it in a port-scanning example to stop as soon as port 443 was found.

## Task 7: Conclusion

No answer needed. The room wraps up and points at the companion room, Python: Building Scripts, where these pieces become functions, file handling, and a full password strength checker. Click Complete to finish.

![Python Core Concepts room with all seven tasks marked complete and Room completed 100 percent](/img/thm-pycore/03-room-complete.png)

## Takeaways

Two things worth keeping from an easy room:

- **The answer mask is the spec, especially for Python syntax.** Half the answers here (`type()`, `len()`, `.lower()`, `.append()`, `.get()`, `for`, `0, 1, 2`) are rejected if you drop the parentheses, the leading dot, or the commas. Read the input's masked value before submitting and match it character for character, rather than guessing and burning the rate limit.
- **When a THM VS Code or terminal ignores your typing, go fullscreen before debugging.** The split-screen noVNC panel silently dropped every keystroke; the same machine in the dedicated fullscreen VM tab accepted input on the first click. That one habit saves a lot of "is the box dead?" troubleshooting on browser-delivered desktops.

Room solved 100%: 7 tasks, 15 answers.
