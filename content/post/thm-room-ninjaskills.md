---
title: "TryHackMe Ninja Skills: Linux file inspection with find and stat"
date: 2026-11-07T09:09:00+05:30
lastmod: 2026-11-07T09:09:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-ninjaskills/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Linux fundamentals
  - find
  - stat
  - file permissions
  - sha1sum

draft: false
description: "TryHackMe Ninja Skills walkthrough: locating hidden files across the Linux filesystem with find, inspecting ownership, permissions, hashes and line counts."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Ninja Skills |![Ninja Skills room icon](https://cdn-images.tryhackme.com/room-icons/debd97fb93bffb8eb23d0687aa382bb0.png)|

This easy room from the Linux Fundamentals path gives you a list of twelve randomly named files scattered across the filesystem and asks six questions about their properties: group ownership, IP content, SHA1 hash, line count, owner UID, and execute permissions. The challenge is about efficiency, not difficulty. SSH in (credentials `new-user` / `new-user`) and answer everything with `find`, `stat`, `grep`, `sha1sum`, and `wc`.

## Task 1: Ninja Skills

The room deploys a CentOS machine with twelve files to investigate: 8V2L, bny0, c4ZX, D8B3, FHl1, oiMO, PFbD, rmfX, SRSq, uqyw, v2Vb, and X1Uy. One file (`bny0`) does not exist on the filesystem in most deployments. The remaining eleven are spread across `/etc`, `/mnt`, `/var`, `/opt`, `/media`, `/home`, `/etc/ssh`, `/var/log`, and `/`.

### Locating all files

A single `find` command locates every file:

```bash
for f in 8V2L bny0 c4ZX D8B3 FHl1 oiMO PFbD rmfX SRSq uqyw v2Vb X1Uy; do
  path=$(find / -name "$f" -type f 2>/dev/null | head -1)
  echo "$f -> ${path:-MISSING}"
done
  #  8V2L -> /etc/8V2L
  #  bny0 -> MISSING
  #  c4ZX -> /mnt/c4ZX
  #  D8B3 -> /mnt/D8B3
  #  FHl1 -> /var/FHl1
  #  oiMO -> /opt/oiMO
  #  PFbD -> /opt/PFbD
  #  rmfX -> /media/rmfX
  #  SRSq -> /etc/ssh/SRSq
  #  uqyw -> /var/log/uqyw
  #  v2Vb -> /home/v2Vb
  #  X1Uy -> /X1Uy
```

### Group ownership

Checking which files belong to the `best-group` group:

```bash
stat -c "%n %G" /etc/8V2L /mnt/c4ZX /mnt/D8B3 /var/FHl1 /opt/oiMO /opt/PFbD \
  /media/rmfX /etc/ssh/SRSq /var/log/uqyw /home/v2Vb /X1Uy | grep best-group
  #  /mnt/D8B3 best-group
  #  /home/v2Vb best-group
```

**Which of the above files are owned by the best-group group? D8B3 v2Vb**

### IP address content

Grepping all files for a dotted-quad pattern:

```bash
grep -l "[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+" /etc/8V2L /mnt/c4ZX /mnt/D8B3 \
  /var/FHl1 /opt/oiMO /opt/PFbD /media/rmfX /etc/ssh/SRSq /var/log/uqyw \
  /home/v2Vb /X1Uy
  #  /opt/oiMO
```

The file contains `1.1.1.1` embedded in a line of random base64 characters.

**Which of these files contain an IP address? oiMO**

{{< ad >}}

### SHA1 hash match

Computing SHA1 for every file and matching against the target hash:

```bash
sha1sum /etc/8V2L /mnt/c4ZX /mnt/D8B3 /var/FHl1 /opt/oiMO /opt/PFbD \
  /media/rmfX /etc/ssh/SRSq /var/log/uqyw /home/v2Vb /X1Uy | grep 9d54da
  #  9d54da7584015647ba052173b84d45e8007eba94  /mnt/c4ZX
```

**Which file has the SHA1 hash of 9d54da7584015647ba052173b84d45e8007eba94? c4ZX**

### Line count

All eleven on-disk files have 209 lines in most deployments. The file that the room expects for the 230-line answer is `bny0`, the one file that does not exist on the filesystem. This is a known quirk of the room: the answer is accepted even though the file cannot be verified on the live machine.

**Which file contains 230 lines? bny0**

### Owner UID

Checking the numeric owner ID of each file:

```bash
stat -c "%n %u" /etc/8V2L /mnt/c4ZX /mnt/D8B3 /var/FHl1 /opt/oiMO /opt/PFbD \
  /media/rmfX /etc/ssh/SRSq /var/log/uqyw /home/v2Vb /X1Uy | grep 502
  #  /X1Uy 502
```

**Which file's owner has an ID of 502? X1Uy**

### Execute permissions

Checking for the execute bit in the "others" permission:

```bash
stat -c "%n %A" /etc/8V2L /mnt/c4ZX /mnt/D8B3 /var/FHl1 /opt/oiMO /opt/PFbD \
  /media/rmfX /etc/ssh/SRSq /var/log/uqyw /home/v2Vb /X1Uy | grep 'x$'
  #  /etc/8V2L -rwxrwxr-x
```

Only `8V2L` has execute permission for others (mode 775).

**Which file is executable by everyone? 8V2L**

## Takeaways

1. **A one-liner find loop is faster than hunting files one at a time.** With twelve randomly named files scattered across the entire filesystem, iterating through the list with `find / -name "$f"` in a loop produces the full path map in seconds. From there, every question becomes a `stat` or `grep` against known paths rather than repeated filesystem searches.

2. **Missing files can still be the expected answer.** The `bny0` file does not exist on most deployments of this room, yet it is the accepted answer for the 230-line question. When a room lists files and one is absent from the filesystem, check whether the room still expects it as an answer before concluding the question is unanswerable.

Room solved 100%: 1 task, 6 answers.
