---
title: "TryHackMe Support: Five Weak Trust Boundaries to RCE"
date: 2026-09-06T19:00:00+05:30
lastmod: 2026-09-06T19:00:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-support/00-thumbnail.png

categories:
  - TryHackMe

tags:
  - tryhackme
  - thm
  - rooms
  - Jr Penetration Tester
  - Web Application Security
  - IDOR
  - Directory Traversal
  - Command Injection
  - Broken Authentication
  - PHP
  - Source Code Disclosure

draft: false
description: "Walkthrough of the TryHackMe Support challenge: a weak login, an md5 cookie flip, IDOR, readfile traversal for source disclosure and command injection to RCE."
---

Support is the capstone challenge for the Web Application Vulnerabilities II module of the Jr
Penetration Tester path, the box you get after the teaching rooms. It sits directly after
[API Pentesting](/post/thm-room-apitesting/) and
[Broken Authentication](/post/thm-room-brokenauthentication/), and it is essentially both of those
rooms stacked: a login you have to guess, an authorization decision stored where the client can edit
it, an object id with no ownership check, a file read with a broken jail, and a command filter that
only looks at the first four characters. Five separate weak trust boundaries, each one useless
alone, and chained they hand you a shell.

Two flags: one on the admin dashboard, one in `/home/ubuntu/user.txt`. No hints, no guided steps.

## Getting a route to the box

The lab machine is a normal deployable VM, and this Mac had no route to it: the only tunnel up was a
corporate VPN carrying `10.160/16`, which is not the THM range. `route -n get <target>` pointed at
`en0` and every port came back closed. Connecting the TryHackMe OpenVPN profile in Tunnelblick fixed
it in one click, and after that everything ran locally with `nmap`, `curl` and `ffuf`. Worth checking
the route before blaming the box.

## Recon: two ports and a very small application

A full TCP scan finds exactly two open ports.

```
  # nmap -sT -p- --min-rate 2500 10.49.134.232
```

![nmap version scan of the Support box showing only port 22 running OpenSSH 9.6p1 on Ubuntu and port 80 running Apache httpd 2.4.58](/img/thm-support/01-recon.png)

SSH is `publickey` only, so it is not an entry point. That leaves Apache. Directory brute forcing
turns up a small PHP application:

```
  # gobuster dir -u http://10.49.134.232/ -w raft-medium-files.txt -x php
index.php        200
dashboard.php    302  -> index.php
api.php          302  -> index.php
config.php       200  (0 bytes)
footer.php       200
logout.php       302  -> index.php
info.php         200  (73 KB, phpinfo)
includes/        301   header.php, skin.php
skins/           301   default.php, red.php, green.php, blue.php
```

That `info.php` is a leftover `phpinfo()` page, and it is genuinely useful later: PHP 8.3.6,
`disable_functions` empty, `open_basedir` unset, `allow_url_include` Off, `post_max_size` 8M. Note
those last two, they close off two obvious attacks and one of them cost me an hour.

Everything except the login redirects to `index.php`, so the login is the only door.

## Step 1: a login with no rate limiting

The form takes a corporate email and a password, and the placeholder helpfully names a real account:
`help@support.thm`. There is no SQL injection here (quotes, `OR 1=1`, time-based payloads and PHP
type juggling all return the same 2678-byte "Invalid credentials" page), no user enumeration, and no
lockout. What there is, is nothing stopping you guessing.

```
  # ffuf -u http://TARGET/index.php -X POST \
  #      -d 'email=help@support.thm&password=FUZZ' \
  #      -w 10k-most-common.txt -mc 302
```

![Terminal output showing four password attempts against help@support.thm, three returning 200 invalid and snoopy returning 302 LOGIN OK, followed by the isITUser cookie set to the md5 of false](/img/thm-support/02-login-brute.png)

The password is **snoopy**, entry 129 in the standard 10k list. A successful login answers with a
302 to `dashboard.php` and, more interestingly, a second cookie.

## Step 2: an authorization decision handed to the client

```
Set-Cookie: isITUser=68934a3e9455fa72420237eb05902327; Max-Age=3600; path=/
```

That value is `md5("false")`. It is one of the most recognisable hashes there is, and if you do not
recognise it, hashing the obvious candidates takes five seconds. `md5("true")` is
`b326b5062b2f0e69046810717534cb09`.

Swap the cookie and the dashboard grows an IT Admin Panel with a link to `api.php`. Hashing a boolean
is not encryption, it is not a signature, and it does not stop anything: there are only two possible
values and both are public knowledge. The server is asking the browser whether the browser is
allowed to do something.

{{< ad >}}

## Step 3: IDOR on the internal API

`api.php` presents itself as a self-service endpoint, telling you that as a helpdesk user you may
query your own profile at `/user/3`. The id is a plain integer in the query string with no ownership
check behind it.

![Terminal output showing the IT Admin Panel unlocked and api.php?id= returning all three user records including specialadmin@support.thm with admin true](/img/thm-support/03-idor.png)

Three accounts exist:

| id | email | admin |
|---|---|---|
| 1 | specialadmin@support.thm | true |
| 2 | IT@support.thm | false |
| 3 | help@support.thm | false |

The API strips `password` from every response, so this is disclosure, not credentials. But it names
the account that matters. Everything from here is about becoming user 1.

## Step 4: the theme selector is a source disclosure

The footer carries a theme dropdown linking to `?skin=default`, `?skin=red` and so on. That parameter
goes straight into a file read. `?skin=../skins/red` still renders the red stylesheet, which proves
the path is concatenated rather than matched against a list, so `?skin=../config` climbs out of
`skins/` and lands on `config.php`.

![Terminal output showing the skin parameter traversal dumping config.php with MASTER_PASSWORD support@110, and dashboard.php source revealing the realpath and strpos jail around readfile](/img/thm-support/04-lfi-config.png)

The important detail is that this is `readfile()`, not `include()`. The PHP is never executed, it is
printed, so the primitive is **source disclosure for any `.php` file under the web root**. That is
better than an LFI here, because it hands you the application logic:

```php
  // dashboard.php
$webRoot   = realpath('/var/www/html/skins');
$another   = realpath('/var/www/html');
$requested = realpath($webRoot . '/' . $skin . '.php');

if ($requested !== false && strpos($requested, $another) === 0) {
    readfile($requested);
}
```

The jail is actually sound. `realpath()` resolves the traversal before the prefix check, so
`../../db` resolves to `/var/www/db.php`, fails `strpos`, and reads nothing. The user table lives in
`/var/www/db.php`, one directory above the web root, and it stays out of reach for the whole room.
Worth confirming that early rather than grinding on it.

Reading the rest of the source gives the two things that matter. `dashboard.php` gates the first flag
on a session value:

```php
  // dashboard.php
if (isset($_SESSION['admin']) && $_SESSION['admin'] === true):
    echo htmlspecialchars(trim(file_get_contents('/var/www/web.txt')));
```

And `footer.php`, which `dashboard.php` includes, holds the RCE:

```php
  // footer.php
$isAdmin = $_SESSION['admin'];

if ($isAdmin && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['sys'])) {
    $sys = $_POST['sys'];
    if (strpos($sys, 'date') === 0) {
        $output = shell_exec($sys);
    } else {
        $error = 'Only date command is allowed.';
    }
}
```

`$_SESSION['admin']` is written only by a successful login in `index.php`, and only from the user
record. So both remaining objectives collapse into one problem: log in as `specialadmin`.

## Step 5: the master password, and the trap in it

`config.php` gives up `$MASTER_PASSWORD = 'support@110'`. That is obviously the intended credential,
and it does not work. Neither does it work for the other two accounts, nor as an md5, sha1, sha256 or
base64 of itself.

This is where I lost the most time, and it is worth being honest about how. I assumed the master
password was a decoy and went looking for other ways to forge `$_SESSION['admin']`: header and cookie
trust bypasses, parameter pollution, a 100,000-word brute force against `specialadmin`, and a PHP
session upload-progress injection (`session.serialize_handler` is `php` and
`session.upload_progress.enabled` is On, which is the classic setup for injecting `|` into a session
key). The session attack was the interesting failure. My first attempt used a 12 MB body, which
`post_max_size = 8M` rejects outright so no progress was ever written; once I dropped under the limit
the upload demonstrably clobbered a live logged-in session, proving the write happened, but the
injected `loggedin|b:1;admin|b:1;` never parsed back. PHP 8.3 does not let `|` survive into a session
key any more. Dead end, correctly identified only after building the whole thing.

The actual answer was much dumber. The password is **support110**. The `@` in `support@110` is
decoration, and a short custom wordlist built from the application's own vocabulary (`support@110`,
`Support@110`, `support110`, `support_portal`, `specialadmin`, and so on) found it in about twenty
requests. Twenty requests I could have sent an hour earlier. When a leaked secret nearly works, mutate
it before concluding it is a decoy.

## Step 6: admin, and then a shell

Logging in as `specialadmin@support.thm` / `support110` sets `$_SESSION['admin'] = true`, and the
dashboard renders the first flag.

The command filter is `strpos($sys, 'date') === 0`, which asks only that the string *begins with*
`date`. It says nothing about what follows, so a semicolon and a second command run happily.

```
  # POST /dashboard.php   sys=date;id
Sun Sep  6 13:39:17 UTC 2026
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

![Terminal output showing the Administrator Access Confirmed banner with the first flag, the sys parameter running date and id as www-data, and the user.txt flag](/img/thm-support/05-rce.png)

The dashboard flag is **THM{I_AM_ADMIN999}** and `sys=date;cat /home/ubuntu/user.txt` returns
**THM{GOT_THE_FLAG001}**.

Note that `date` is a real allow-list entry that the developer presumably tested and watched work.
The filter is not absent, it is just anchored to the wrong thing: it validates a prefix instead of
validating the whole string, and a prefix check on a value that gets handed to a shell is not a check
at all.

## Two things worth keeping

**A prefix check is not an allow-list.** `strpos($sys, 'date') === 0` looks like an allow-list to
whoever wrote it, and it passes every test built from the dropdown that feeds it. It fails because it
constrains the beginning of a string that a shell will read to the end. The same shape shows up in
open-redirect filters that check a URL starts with your domain and path checks that confirm a prefix
before appending user input. If the consumer reads the whole value, validate the whole value, or
better, never pass the value through at all and map the dropdown to a fixed command server-side.

**Recognise your own guessing and time-box it.** The chain up to `config.php` was ordinary
methodology and took under an hour. The step after it took several times that, because I decided the
master password was a decoy and started building increasingly clever attacks against the session
handler instead of spending two minutes on the boring hypothesis that the secret was almost right.
The signal I ignored is a useful one: when a room hands you a credential-shaped string at exactly the
point you need a credential, the room means it. Exhaust trivial mutations of a leaked secret before
you write any exploit code.

One process note for the honest record: an early 10,000-word brute force at 25 threads exhausted
Apache's worker pool and took port 80 down entirely, which cost a machine redeploy. Later runs used
five to ten threads with a small delay and the box stayed up. Concurrency that a real target would
shrug off will flatten a 1 vCPU lab VM.

Room solved 100%: 1 task, 2 answers.
