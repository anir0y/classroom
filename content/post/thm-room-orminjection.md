---
title: "TryHackMe ORM Injection: whereRaw and ORDER BY Injection"
date: 2026-10-16T13:30:00+05:30
lastmod: 2026-10-16T13:30:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-orm/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Web Application Pentesting
  - Injection Attacks
  - ORM Injection
  - Laravel
  - Eloquent
  - SQL Injection
  - Query Builder
  - whereRaw

draft: false
description: "Walkthrough of TryHackMe ORM Injection: Laravel whereRaw raw query injection to dump admins and an ORDER BY json_extract break-out that leaks every user."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|ORM Injection |![ORM Injection room icon](https://cdn-images.tryhackme.com/room-icons/62a7685ca6e7ce005d3f3afe-1718463270604)|

ORM Injection sits in the Injection Attacks module of the Web Application Pentesting path, one room along from the classic SQL work. An ORM (object relational mapper) is supposed to kill SQL injection by turning object calls into parameterised queries, so this room is about the places where that promise leaks: a developer who reaches for a raw query method, and an ORM library with a known injection bug. If you have worked through [NoSQL Injection](/post/thm-room-nosqlinjectiontutorial/) and [Advanced SQL Injection](/post/thm-room-advancedsqlinjection/), the mental model is the same (untrusted input reaching a query), only here it happens one abstraction layer up, inside Laravel's Eloquent.

The target is a single Laravel app backed by MariaDB on a Windows XAMPP host. One detail shaped the whole solve: the app listens on port 80, which is firewalled off from the VPN, while the box only exposes the XAMPP dashboard on 443 and 8080. The THM AttackBox sits inside the lab network and can reach port 80, so I used it purely as a pivot: one SSH local forward from my Mac to `AttackBox:22`, forwarding `127.0.0.1:8081` to `target:80`, and every command below is a plain `curl` against that tunnel. Looted values are shown, lab-generated and short lived; I never handle my own credentials.

```bash
  # AttackBox creds come from the running-VMs API; use it only as a pivot to port 80
sshpass -e ssh -f -N -L 8081:TARGET:80 root@ATTACKBOX
curl -s http://127.0.0.1:8081/            # the Laravel "User Search" app, now reachable
```

## Task 2 and 3: what ORM is and how it maps

The reading tasks set the vocabulary. The default ORM for Ruby on Rails is **Active Record**. Of the listed options, the one that is **not** a feature of ORM is **c** (increasing the attack surface is a risk, not a benefit; reducing boilerplate, raising productivity, and ensuring consistency are the real selling points).

Task 3 walks through a Laravel migration. The migration class holds two methods, and the one that defines the structure of the `users` table (it wraps the `Schema::create` call that adds each column) is the **up()** method. Database credentials in a Laravel project live in the **.env** file at the project root, which is exactly the file you want to read once you have any file-disclosure primitive.

## Task 4: fingerprinting the ORM

Identifying ORM injection starts with confirming which ORM you are up against. Sending a single quote into the vulnerable email field throws a Laravel error page (the Ignition debug handler), and that page is a goldmine: it prints the generated SQL, the framework file paths, and a full server and request dump.

```bash
curl -s -G "http://127.0.0.1:8081/search-blind-vulnerable" --data-urlencode "email='"
  # SQLSTATE[42000]: ... (SQL: select * from `admins` where email = ''')
  # ... in file C:\Users\Administrator\Downloads\orminjection\vendor\laravel\framework\...
```

Two answers fall straight out of that page. The `DOCUMENT_ROOT` server variable, shown in the request dump, is **C:\Users\Administrator\Downloads\orminjection\public**. The ORM library for the Spring (Java) framework mentioned in the task is **Hibernate**. And the session cookie the app hands you, which both identifies the framework as Laravel and maintains the session, is named **laravel_session** (it rides alongside the `XSRF-TOKEN` cookie).

{{< ad >}}

## Task 5: weak implementation, whereRaw concatenation

The "Email (Vulnerable)" field posts to `/search-blind-vulnerable`, and the controller builds its query with Laravel's raw escape hatch:

```php
$users = Admins::whereRaw("email = '$email'")->get();
```

The vulnerable Eloquent method here is **whereRaw()**. Because the email is concatenated straight into the SQL string, the usual tautology breaks it wide open: `' OR '1'='1` turns the filter always-true and the app returns every admin record.

```bash
curl -s -G "http://127.0.0.1:8081/search-blind-vulnerable" --data-urlencode "email=' OR '1'='1"
  # Name: John Doe, Email: john@thm.com
  # Name: Jane Doe, Email: jane@thm.com
```

![The vulnerable email field with a quote-OR-1-equals-1 payload dumping both admin accounts](/img/thm-orm/01-weak-admin-dump.png)

The two admins come back, so the email associated with the name Jane Doe is **jane@thm.com**. The second "Email (Secure)" field runs the parameterised version, `User::where('email', $email)->get()`, where the input is bound as data and never alters the query. Submitting the same `' OR '1'='1` there is treated as a literal email, the lookup finds nothing, and the app rewards the correct secure behaviour with a flag: **THM{SECURED_001}**.

## Task 6: vulnerable implementation, ORDER BY json_extract break-out

The second endpoint, `/query_users?sort=`, feeds the `sort` parameter into an `ORDER BY` clause and caps the result at two rows. You cannot break out of `ORDER BY` with a plain quote, but Laravel's `->` JSON operator (an alias for MySQL `json_extract`) gives you the hook. The documented payload `name->"'))` terminates the generated `json_unquote(json_extract(...))` expression, after which you append your own SQL and comment out the trailing `ASC LIMIT 2` with `#`.

```bash
  # sort=name->") ) LIMIT 100#  (URL-encoded), lifts the 2-row cap and dumps the table
curl -s "http://127.0.0.1:8081/query_users?sort=name-%3E%22%27))%20LIMIT%20100%23"
```

![The ORDER BY json_extract break-out returning all five users including john at THM 101](/img/thm-orm/02-query-users-dump.png)

With the `LIMIT 2` neutralised, the endpoint returns the whole `users` table. The total number of rows in the users table is **5** (ids 4 to 8: John Doe, Jane Doe, Alice Smith, Bob Johnson, Charlie Brown), and the `password` column is dumped in clear text for each. The password stored for the email john@thm.com is **THM{101}**.

## Task 7: best practices

The closing reading task is the mitigation side. Is it good practice to write raw SQL queries inside an ORM? **nay**: the raw escape hatches (`whereRaw`, raw `DB::` calls) are exactly what reintroduce injection, so you stay on the parameterised methods. And input validation should be carried out on **c**, both the server and the client (client-side for UX, server-side because it is the only side an attacker cannot bypass).

## Takeaways

Two ideas carry past this lab into real web targets.

- **An ORM is not a shield; the raw methods are the hole.** Every major ORM ships an escape hatch for hand-written SQL (`whereRaw` in Eloquent, `DB::raw`, `.raw()` queries, string-interpolated `order_by`). On a live target, grep the codebase or fuzz every sort, filter, and search parameter: the moment one reaches a raw method or an unexpected clause like `ORDER BY`, the ORM stops protecting you and you are back to classic SQLi. The `ORDER BY` plus `json_extract` break-out is worth remembering because sort parameters are rarely parameterised and even more rarely tested.
- **A debug error page is half the engagement.** The single-quote probe did more than prove injection: Laravel's Ignition handler leaked the exact SQL, the framework version, the Windows `DOCUMENT_ROOT`, and the session cookie name in one response. Whenever a target is in debug mode, read the whole error page before crafting another payload; it often hands you the stack, the paths, and the fingerprint for free. Turning debug off in production is not cosmetic, it is a real control.

Room solved 100%: 8 tasks, 16 answers.
