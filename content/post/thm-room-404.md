---
title: TryHackMe Room 404 — Dumping Source From an Exposed .git
date: 2026-07-31T14:30:00+05:30
lastmod: 2026-07-31T14:30:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-room404/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Web
  - Directory Enumeration
  - Source Code Disclosure
  - git

draft: false
description: "Walkthrough of the TryHackMe room Room 404 — finding an exposed .git directory on a staging server, mirroring it, and rebuilding the source to recover the flag."
---

## Room 404

**Day 2 of Hacker Holidays 2026**, and we're back at the Byte Lotus. The briefing sets the tone:

> He booked the quiet room. It's not on the floor plan, not in the brochure, not on any door. But port 8080 is wide open, and the rooms it never lists are the ones worth finding.

And the line that actually tells you what you're looking for:

> The Byte Lotus guest-experience platform went live in a hurry, and the **night-shift developer shipped more than the website**.

Two objectives: **dump the exposed source code**, and **find the flag**. Category is Web / Directory Enumeration, difficulty Very Easy, 30 points.

"Shipped more than the website" is the whole hint. Something is on that server that was never meant to be published. Let's find the door that isn't on the floor plan.

## Setup

The room gives you a lab machine on the THM network. I had the OpenVPN connection up on my own machine, so I worked straight from a local terminal rather than the AttackBox — the target answered in about 90 ms, which is plenty comfortable.

```bash
TARGET=http://10.48.175.16:8080
curl -s -o /dev/null -w "%{http_code}\n" $TARGET/
# 200
```

Your IP will differ — the room hands you a fresh one on each deploy, so substitute yours everywhere below.

## Step 1: What am I actually talking to?

Before fuzzing anything, spend ten seconds on the response headers. They are usually the most honest part of a web app.

![curl response headers showing Server Werkzeug 3.0.1 Python 3.12.3, and page content with a build staging footer](/img/thm-room404/01-recon.png)

Two things jump out.

**`Server: Werkzeug/3.0.1 Python/3.12.3`** — this is Flask running on its **development** server. Werkzeug is what you get from `app.run()`; it is explicitly not meant for production, and its presence on a public port is already a smell. Real deployments sit behind gunicorn/uWSGI with nginx in front.

**The footer says `guest experience platform · build staging`.** The app is telling you it's a staging build. Staging environments are where good hygiene goes to die: debug flags left on, test credentials, and — as we're about to see — the developer's whole working directory.

The page itself is a pretty brochure with a `/booking` link that goes nowhere. Nothing to attack in the HTML.

## Step 2: Ask for the things that shouldn't be there

"Dump the exposed source code" narrows this a lot. I'm not looking for a login bypass; I'm looking for **files the web root should never serve**. That's a short, high-value list — version control folders, environment files, backups, editor droppings.

You could point ffuf or gobuster at it with a wordlist, and on a real engagement you would. But for a handful of specific candidates, a `for` loop and `curl` is faster than spinning up a fuzzer:

```bash
for p in /robots.txt /booking /.git/HEAD /.git/config /.env /app.py /backup /admin; do
  printf "%-16s " "$p"
  curl -s -o /dev/null -w "%{http_code}\n" "$TARGET$p"
done
```

![Path probe results showing 404 for most paths but 200 for /.git/HEAD and /.git/config](/img/thm-room404/02-git-exposed.png)

Everything returns `404` except two:

```
/.git/HEAD       200
/.git/config     200
```

That's the whole game. The `.git` directory — the repository's complete metadata and object store — is being served over HTTP.

**Why does this happen?** Almost always because someone deployed by running `git clone` or `git pull` directly into the web root, or copied their project folder with `cp -r` / `scp -r` / `rsync` without excluding dotfiles. The application works perfectly, so nobody notices that `.git/` came along for the ride.

{{< ad >}}

## Step 3: See how much is on offer

Before dumping, check what the server will give you:

![The .git directory listing showing COMMIT_EDITMSG HEAD config index logs objects refs, and the reflog showing one initial commit by night-shift](/img/thm-room404/03-git-listing.png)

Two gifts here.

**Directory listing is enabled on `/.git/`.** The server happily indexes the folder, which turns this from "reconstruct a repo from blind object requests" into "mirror a website." That's the easy path, and I'll take it.

**`/.git/logs/HEAD` is the reflog**, and it tells us the entire history in one line:

```
0000000000000000000000000000000000000000 0f13550b4cb13e9f30c61d5b342c532d21e45bda
night-shift <dev@byte-lotus.internal> 1762049640 +0000
	commit (initial): initial Byte Lotus guest platform
```

One commit, `0f13550`, authored by **night-shift &lt;dev@byte-lotus.internal&gt;** — the developer from the briefing. The all-zeroes hash on the left means this is the first commit; there's no earlier history to hunt through.

That reflog is worth knowing about on its own. Even when you can't list the directory, `.git/logs/HEAD` is a single fixed path that often hands you every commit hash the branch has ever pointed at — including commits that were later amended or force-pushed away.

## Step 4: Mirror it, then let git do the work

Because listing is on, `wget` recursion is enough:

```bash
wget -r -np -nH --reject "index.html*" $TARGET/.git/
```

- `-r` recursive, `-np` don't climb above `/.git/`, `-nH` skip the hostname directory
- `--reject "index.html*"` throws away the generated listing pages so they don't pollute the mirror

Then the satisfying part. You don't need to parse anything by hand — you have a real `.git` folder, so **git itself will rebuild the working tree**:

```bash
git checkout .
```

![wget mirroring 31 files, git checkout restoring 3 paths, and git log showing the night-shift commit with README.md app.js and index.html](/img/thm-room404/04-dump.png)

Thirty-one files mirrored, and `git checkout .` restores three: `README.md`, `app.js`, and `index.html`. Objective one done — we have the source.

Two habits worth building here:

**Run `git fsck` first.** If the mirror is incomplete (missing objects are common when directory listing is *off*), fsck tells you immediately rather than letting you draw conclusions from a partial tree.

**When listing is off, use a proper dumper.** [git-dumper](https://github.com/arthaud/git-dumper) walks the object graph the hard way: fetch `HEAD` → resolve `refs/heads/main` → fetch that commit object → parse its tree → fetch every blob, recursing. Each object lives at a predictable path (`.git/objects/ab/cdef…`), so no listing is required — it just takes many more requests. `git-dumper $TARGET/.git/ out/` would have solved this room too.

## Step 5: The flag

`app.js` is a stub — a `const API = "/api/guest"` and a `TODO: wire to live endpoint before launch` (that endpoint 404s; it was never built). `index.html` is byte-identical to the live homepage, which confirms we really are looking at the deployed code.

The interesting file is `README.md`:

![cat README.md showing the internal staging repository notice and the line Staging flag remove before launch THM byt3 l0tus n3v3r f0rg3ts](/img/thm-room404/05-flag.png)

```
# Byte Lotus — Guest Experience Platform

Internal staging repository for the guest app and concierge personalization
service. Do not deploy this folder to production.

Staging flag (remove before launch): THM{byt3_l0tus_n3v3r_f0rg3ts}
```

> `THM{byt3_l0tus_n3v3r_f0rg3ts}`

Two comments in that file are doing a lot of ironic work: *"Do not deploy this folder to production"* on a folder that is currently in production, and *"remove before launch"* on a secret that launched. The flag itself — **Byte Lotus never forgets** — is on-theme for a hotel that has been quietly profiling its guests all week.

## Why an exposed .git is so much worse than it looks

It's tempting to file this as "leaked a README." The real impact is bigger, and it's worth being precise about why.

**A repo is not a snapshot, it's a history.** The working tree shows the *current* state. The object store holds *every* committed state. The classic pattern is a developer committing a `.env`, realising the mistake, deleting the file, and committing again — the working tree is clean, and the credential is still sitting in an earlier blob. Once you have `.git`, `git log -p` reads all of it.

This is why "remove before launch" is not a remediation. **Deleting a secret from the current commit does not remove it from history.** Anything that was ever committed must be treated as burned and rotated, not deleted.

**Source disclosure compounds.** Reading the code turns black-box testing into white-box: you get routes that aren't linked anywhere, validation logic you can now study for bypasses, hardcoded keys, internal hostnames. Here `dev@byte-lotus.internal` alone confirms an internal domain, and `/api/guest` names an endpoint that appears nowhere on the site.

**It's trivially discoverable at scale.** `.git/HEAD` returning `200` with `ref: refs/heads/` is a single unambiguous request. Scanners check it on every host they meet, which means this is found by opportunistic automation, not just by someone who chose to target you.

## Fixing it

If you run web infrastructure, in rough order of how much they help:

**Don't deploy from a working copy.** Build an artifact in CI and ship only the files the app needs. `git clone` into a web root is the root cause almost every time.

**Block dotfile paths at the edge**, as defence in depth — nginx `location ~ /\. { deny all; }` or the Apache equivalent. Belt and braces, because the next deploy method might reintroduce the folder.

**Don't serve the app from its project directory.** Point the document root at a `dist/` or `static/` subfolder so there's no parent-directory metadata to expose.

**Turn off directory listing.** It didn't cause this leak, but it turned a slow object-graph walk into a one-command mirror.

**Scan history for secrets** with `gitleaks` or `trufflehog` in CI, and treat any hit as a rotation event.

**And don't run Werkzeug in production.** That header was the first clue that nobody was minding this box.

## Room summary

| | |
|---|---|
| Room | Room 404 |
| Event | Hacker Holidays 2026 — Day 2 |
| Difficulty | Very Easy · 30 points · Web |
| Target | `http://<lab-ip>:8080` |
| Stack | Flask / Werkzeug 3.0.1 on Python 3.12.3 |
| Finding | `.git` exposed in web root, directory listing enabled |
| Commit | `0f13550` — *initial Byte Lotus guest platform*, by `night-shift` |
| Flag | `THM{byt3_l0tus_n3v3r_f0rg3ts}` |

## Wrap-up

The whole solve, four commands:

```bash
curl -sI $TARGET/                                    # Werkzeug + "build staging"
curl -s -o /dev/null -w "%{http_code}" $TARGET/.git/HEAD   # 200 — jackpot
wget -r -np -nH --reject "index.html*" $TARGET/.git/ # mirror the repo
git checkout . && cat README.md                      # rebuild, read the flag
```

The lesson that outlives the room: **the most valuable thing on a web server is often not part of the website.** The brochure page was flawless — no injection, no broken auth, nothing to attack. The vulnerability was a folder sitting *next to* the application, published by accident, that quietly carried the developer's entire history along with it.

When a target looks clean, stop testing the app and start asking what else is in that directory. 🪷
