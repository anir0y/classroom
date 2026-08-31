---
title: "TryHackMe Web Server Attacks I: Four Servers, One Host"
date: 2026-08-31T21:37:00+05:30
lastmod: 2026-08-31T21:37:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-wsa/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Jr Penetration Tester
  - Web Application Security
  - Apache
  - Nginx
  - Node.js
  - Nikto
  - Web Fundamentals

draft: false
description: "TryHackMe Web Server Attacks I walkthrough: fingerprint Apache, Nginx, Node.js and Python http.server on one host, then loot every misconfiguration."
---

## Web Server Attacks I

Another premium room in the **Web Application Security Fundamentals** module on the Jr Penetration Tester path, sitting alongside [Modern Web Stacks](/post/thm-room-modernwebstacks/) and after [Content Discovery](/post/thm-room-contentdiscoveryx/). Where Modern Web Stacks was about CVEs, this one is about the far more common finding: nothing is unpatched, everything is default, and the defaults are talkative.

One host runs four servers:

| Port | Server | What was left open |
|---|---|---|
| 80 | Apache 2.4.58 | `mod_status` and a listable `/files/` |
| 3000 | Node.js Express | route-listing and `process.env` debug endpoints |
| 8000 | Python `http.server` | the whole working directory, dotfiles included |
| 8080 | nginx 1.24.0 | `stub_status` and `autoindex on` |

All four answered directly from my Mac over the THM tunnel, so no AttackBox: everything below is `curl` from a local shell. There is no exploit in this room, which is the point. Every flag comes from reading something the server was configured to hand out.

## Task 2: four servers, four fingerprints

One `HEAD` request each is the entire reconnaissance phase:

```bash
$ curl -sI http://MACHINE_IP:80/   | grep -i '^server:'
Server: Apache/2.4.58 (Ubuntu)
$ curl -sI http://MACHINE_IP:8000/ | grep -i '^server:'
Server: SimpleHTTP/0.6 Python/3.12.3
$ curl -sI http://MACHINE_IP:8080/ | grep -i '^server:'
Server: nginx/1.24.0 (Ubuntu)
```

The Python answer is **SimpleHTTP/0.6 Python/3.12.3**, and port 8080 is **nginx**.

Express is the odd one out: it sends no `Server` header at all, so the framework has to be read from **X-Powered-By**, which Express sets automatically unless the developer disables it.

```bash
$ curl -sI http://MACHINE_IP:3000/ | grep -i '^x-powered-by:'
X-Powered-By: Express
```

![Terminal output showing Server headers for Apache 2.4.58, SimpleHTTP 0.6 Python 3.12.3 and nginx 1.24.0, plus the X-Powered-By Express header on port 3000](/img/thm-wsa/01-fingerprint.png)

Ubuntu ships Apache with `ServerTokens OS`, which is why the version and the distro both appear. A hardened deployment shows bare `Apache` or nothing.

## Task 3: Python http.server, which serves the directory it was started in

`python3 -m http.server` has one behaviour worth internalising: with no `index.html`, it renders a directory listing of the current working directory, and it serves dotfiles like any other file. Whatever directory the developer was standing in when they ran it is now public.

```bash
$ curl -s http://MACHINE_IP:8000/ | grep -oE 'href="[^"]*"'
href=".env"
href="backup.zip"
href="config.txt"
href="notes.txt"

$ curl -s http://MACHINE_IP:8000/.env
SECRET_KEY=dev-secret-key-do-not-use
DATABASE_URL=postgresql://webapp:S3cur3DBPass!@localhost/production
DEBUG=True
```

The database password in the `.env` file is **S3cur3DBPass!**. Note it is in the production `DATABASE_URL`, not the `config.txt` sitting next to it, which holds a different `db_password=OldP@ssw0rd99` for staging. Two plausible-looking passwords, and the question asks specifically about the `.env` one.

The archive is a plain download:

```bash
$ curl -sO http://MACHINE_IP:8000/backup.zip && unzip -q backup.zip -d bk
$ grep -ahoE 'THM\{[^}]*\}' bk/*
THM{py_server_exposed}
```

**THM{py_server_exposed}**.

![Terminal output showing the Python http.server directory listing with .env, backup.zip, config.txt and notes.txt, the .env contents including the database password, and the flag extracted from the backup archive](/img/thm-wsa/02-python.png)

`notes.txt` in the same listing also gives up `Admin creds: admin / admin123` and an internal host. Nothing in the room asks for those, but on a real engagement that file is the finding.

{{< ad >}}

## Task 4: Apache, mod_status and Options +Indexes

`mod_status` is enabled by default on Ubuntu's Apache package, and it ships restricted to localhost via `Require local` in `conf-available/security.conf`. The trap is that a single `Require all granted` anywhere in a virtual host silently overrides that, without anyone touching the module config. So the module answer is **mod_status**, and it is always worth requesting even on a server that looks stock.

```bash
$ curl -s http://MACHINE_IP/server-status | grep -oE 'Server Version[^<]*|Server uptime[^<]*'
Server Version: Apache/2.4.58 (Ubuntu)
Server uptime:  13 minutes 17 seconds
```

A 200 there, not a 403, is the finding. It exposes the version, the uptime, and every URL currently being requested by other clients.

The second misconfiguration is `Options +Indexes` on a path with no index file:

```bash
$ curl -s http://MACHINE_IP/files/ | grep -oE 'href="[a-z][^"]*"'
href="employees.csv"
href="internal-notes.txt"

$ curl -s http://MACHINE_IP/files/internal-notes.txt | tail -2
Action items: update firewall rules, rotate API keys
flag: THM{apache_dir_listing}
```

**THM{apache_dir_listing}**, alongside a CSV of employee names and email addresses.

![Terminal output showing Apache server-status returning version and uptime, the listable /files/ directory, and the flag inside internal-notes.txt](/img/thm-wsa/03-apache.png)

## Task 5: Express, where the app enumerates itself for you

The root path returns a JSON status blob with an application version, which is normal. The problem is the debug endpoints left in place. Guessing at `/debug`, `/status`, `/health` and `/env` returned 404 across the board; the actual paths came from the room's own material, and the first one makes the rest unnecessary:

```bash
$ curl -s http://MACHINE_IP:3000/api/routes
[{"method":"GET","path":"/"},{"method":"GET","path":"/api/users"},
 {"method":"GET","path":"/api/routes"},{"method":"GET","path":"/api/debug/env"}]
```

That endpoint reads Express's internal `app._router.stack` to list every registered route. It removes the need for Gobuster entirely. Following it to the env dump:

```bash
$ curl -s http://MACHINE_IP:3000/api/debug/env
{"NODE_ENV":"development","DB_PASSWORD":"NodeDBPass2024!","PORT":"3000",
 "DB_HOST":"localhost:5432","APP_NAME":"company-portal"}
```

`NODE_ENV` is **development**, which on a reachable server is itself the finding: it means Express's own error handler will pass stack traces through to clients.

The static middleware is the last piece. `express.static()` serves a whole directory, and client-side config files are "meant to be public" in a way that does not survive contact with what people actually put in them:

```bash
$ curl -s http://MACHINE_IP:3000/static/config.js
// Client-side configuration
const API_BASE = 'http://internal-api.company.local:8080';
const DEBUG = true;
const VERSION = '1.2.0';
// flag: THM{node_debug_exposed}
```

**THM{node_debug_exposed}**, plus an internal hostname the outside world was not supposed to learn.

![Terminal output showing the Express api slash routes endpoint listing four routes, the debug env endpoint exposing NODE_ENV development and a database password, and the static config.js file containing the flag](/img/thm-wsa/04-node.png)

## Task 6: nginx, autoindex and stub_status

nginx does not list directories by default. It has to be turned on, and the directive is **autoindex on** inside a `location` block. Someone did:

```bash
$ curl -s http://MACHINE_IP:8080/nginx_status
Active connections: 1
server accepts handled requests
 29 29 28
Reading: 0 Writing: 1 Waiting: 0

$ curl -s http://MACHINE_IP:8080/files/ | grep -oE 'href="[a-z][^"]*"'
href="deploy-notes.txt"
href="old-backup.tar.gz"
href="server-config.txt"

$ curl -s http://MACHINE_IP:8080/files/server-config.txt | tail -2
backup_schedule: daily 02:00
flag: THM{nginx_autoindex}
```

The connection statistics path is **/nginx_status** (the `stub_status` module, conventionally mounted there), and the flag is **THM{nginx_autoindex}**. `/status`, `/stub_status` and `/basic_status` all returned 404, so the conventional name is the one that mattered.

![Terminal output showing the nginx stub_status connection counters, the autoindex listing of deploy-notes.txt, old-backup.tar.gz and server-config.txt, and the flag inside server-config.txt](/img/thm-wsa/05-nginx.png)

`deploy-notes.txt` in that same listing hands over an SSH key path and a sudo password. Nothing asks for them, but that is the file that ends the engagement.

## Task 7: the cross-cutting misconfigurations

The security header that prevents a page being framed on another origin is **X-Frame-Options**, and its absence is what enables clickjacking. None of the four servers here send it.

For the scanner question, I installed Nikto and ran it rather than guessing the wording:

```bash
$ nikto -h http://MACHINE_IP:80 -maxtime 240
+ Server: Apache/2.4.58 (Ubuntu)
+ [750500] /files/: Directory indexing found. See: CWE-548
```

The finding text is **Directory indexing found**.

![Nikto output against the Apache target reporting the server version and a Directory indexing found result for the /files/ path with CWE-548](/img/thm-wsa/06-nikto.png)

One honest note on that run. My first pass used `-maxtime 90` and finished before Nikto reached the `/files/` probe, reporting only missing `permissions-policy` and `content-security-policy` headers. That looked like the tool disagreeing with what I had already found by hand. It was not: the scan had simply been cut short. Raising the budget to 240 seconds produced the finding at the four-minute mark. A scanner that stops early does not report "incomplete", it just reports less.

## Two things worth keeping

**Every flag here came from a default, not a vulnerability.** Nothing on this host was unpatched. Apache's `mod_status` ships enabled, Python's `http.server` ships serving the working directory, Express's `X-Powered-By` ships on, and the only deliberate change anyone made was `autoindex on`. The finding in a report like this is not "you are running vulnerable software", it is "you deployed the defaults into a place they were never meant to reach". That distinction changes the remediation from patch to configure.

**Time-box your scanner, then check what it did not reach.** The 90-second Nikto run missed the exact finding the room asked about and produced a plausible-looking result set anyway. When a scanner's output disagrees with what manual enumeration already proved, the first question is whether it actually got there, not whether the manual finding was wrong. Manual reconnaissance is what tells you when the tool came up short.

Room solved 100%: 8 tasks, 16 answers.
