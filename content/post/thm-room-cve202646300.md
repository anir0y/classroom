---
title: "TryHackMe Fragnesia CVE-2026-46300: Page-Cache LPE to Root"
date: 2026-09-12T22:19:00+05:30
lastmod: 2026-09-12T22:19:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-fragnesia/00-thumbnail.png

categories:
  - TryHackMe

tags:
  - tryhackme
  - thm
  - rooms
  - Jr Penetration Tester
  - Vulnerability Knowledge
  - CVE-2026-46300
  - Linux Privilege Escalation
  - Kernel Exploitation
  - Page Cache
  - XFRM
  - User Namespaces
  - Detection Engineering

draft: false
description: "Walkthrough of TryHackMe Fragnesia, CVE-2026-46300. A Linux page-cache write LPE created by the Dirty Frag patch, taken from user karen to root via a corrupted su."
---

Fragnesia sits in the Vulnerability Knowledge module of the Jr Penetration Tester path, and it is
the rare CVE room where the interesting part is not the exploit. The primitive is familiar from Copy
Fail and Dirty Frag: corrupt a page-cache page that backs a setuid binary, then run that binary. What
makes this one worth writing up is where the bug came from. The patch that fixed Dirty Frag is the
patch that created Fragnesia.

If you have been working through the recent CVE rooms, this pairs well with the
[n8n CVE-2025-68613 expression injection walkthrough](/post/thm-room-n8ncve202568613/) and the
[NoScope Alf.io sandbox escape](/post/thm-room-noscoperce/). Those two are application-layer bugs.
This one is kernel plumbing, and the reasoning style is completely different.

The room is a guided walkthrough, six tasks, one flag. Everything below was run against the lab
machine from my own Mac over the TryHackMe VPN rather than the in-browser terminal, because the
target answers on port 22 directly.

## Task 1: Getting onto the box

Start the lab machine, wait about a minute, and you get a split-view terminal already logged in as
`karen`. Task 4 hands out SSH credentials (`karen` / `fragnesia2026`) if you would rather work from
your own shell, which I did.

```bash
  # target is reachable straight from the Mac over the THM tunnel
nc -z -w5 10.49.146.245 22
sshpass -p 'fragnesia2026' ssh karen@10.49.146.245
```

First job is to establish the permission boundary the exploit is going to cross. `karen` is an
ordinary user with no groups and no sudo, and `/usr/bin/su` is root-owned mode 4755. Appending a byte
to it fails, as it should.

![Terminal showing karen's uid, kernel 6.8.0-1017-aws, the root-owned setuid /usr/bin/su, the exploit source directory, and a write attempt to /usr/bin/su rejected with Permission denied](/img/thm-fragnesia/01-recon.png)

Kernel is `6.8.0-1017-aws` on Ubuntu 22.04. The exploit source ships in `/home/karen/fragnesia/`
alongside a zero-byte `exp` placeholder you are expected to build yourself.

## Task 2: How a patch becomes a vulnerability

This is the task worth reading twice. The chain has five components and four of them predate the
patch that made the bug reachable.

A socket buffer (`struct sk_buff`) holds an array of fragments, each pointing at a page. Most of
those pages are private buffers the network stack owns outright. Some are not. When a process calls
`splice()` to push a file through a socket, the kernel attaches a reference to the file's page-cache
page directly onto the outgoing skb, with no copy. `SKBFL_SHARED_FRAG` is the flag that marks those
fragments as externally owned, and it means one thing to every downstream code path: this memory is
not yours, copy it before you modify it.

`skb_try_coalesce()` merges two skbs into one, which the TCP receive path does constantly to cut
per-buffer overhead. When it moves paged fragments from the second skb onto the first, it does not
carry `SKBFL_SHARED_FRAG` across. The merged skb still points at page-cache pages, but it now looks
like an ordinary private buffer to everything that inspects it.

That defect was introduced in 2013, in commit `cef401de7be8`, and it sat there for thirteen years
without being a vulnerability, because nothing in the kernel made a security decision based on that
flag.

## Task 3: The patch that became the vulnerability

Dirty Frag (CVE-2026-43284) was a bug in `esp_input()`, which took a fast path that skipped
`skb_cow_data()` for uncloned non-linear skbs. The fix, commit `f4c50a4034e6` merged on 8 May 2026,
did two correct things: it set `SKBFL_SHARED_FRAG` on spliced fragments in the datagram append paths,
and it made `esp_input()` check `skb_has_shared_frag()` before taking the fast path.

The reasoning was right and the implementation was right. What the patch did not do was audit every
path that touches the flag to confirm the flag survives. `skb_try_coalesce()` was one such path, and
from the moment `esp_input()` started trusting the flag, the thirteen-year-old stripping bug became
a privilege escalation.

You can read the whole story in the candidate fix, `f84eca581739`, posted to netdev on 13 May 2026.
It carries two `Fixes:` tags. One points at the Dirty Frag patch, the other at the 2013 commit. The
immediate trigger and the latent precondition, in two lines.

The room also notes a second variant in `skb_segment()`, disclosed the day after the first patch
landed and still unpatched as of 15 May 2026, so the fix above does not close the class.

## Task 4: Exploitation, and the flag

The build is a one-liner. `-w` is there because the published source throws a handful of harmless
warnings: unused debug helpers, a deliberately non-null `execve` argument, an ignored write return in
the terminal-reset code.

```bash
cd /home/karen/fragnesia
gcc -O2 -w fragnesia.c -o exp
```

![Terminal showing gcc compiling fragnesia.c to exp with no errors, then ls and file confirming a 35368-byte ELF 64-bit executable](/img/thm-fragnesia/02-build.png)

Running `./exp` sets up an unprivileged user namespace plus a network namespace, maps `karen` to UID
0 inside it to pick up `CAP_NET_ADMIN`, registers an XFRM security association with a known
AES-128-GCM key, splices `/usr/bin/su` into a TCP socket, and then flips the espintcp ULP on so the
receive path decrypts in place, over the page-cache page. Each AES-GCM decryption yields one
controlled byte at one offset. The PoC pre-computes a 256-entry IV lookup table so each byte is a
single trigger.

```
  # condensed from a 4,500-line trace
[*] uid=1001 euid=1001 gid=1001 egid=1001
[*] mode=xfrm_espintcp_pagecache_replace collateral=after
[*] target=/usr/bin/su size=55680
outer_write_open_denied=1 errno=13 (Permission denied)
userns_setup: outer_uid=1001 outer_gid=1001 ns_uid=0 ns_gid=0
xfrm_espintcp_state_add=1
namespace_setup_complete=1
[*] range: offset=0x0 len=192 last=0xbf enc_len=4080 splice_len=4096
stream0_table_entries=256
[*] verifying 192 bytes...
[*] bytes_flip_summary len=192 changed=176 skipped=16
[+] BUG: changed requested copied byte range to desired values
```

176 of 192 bytes actually needed writing; the other 16 already matched the target ELF stub by
coincidence. The whole flip sequence takes a few hundred milliseconds. The on-disk file is never
touched, so anything that hashes from disk still reports `/usr/bin/su` as clean.

{{< ad >}}

Then the PoC drops you into a shell and this is where the room sets a trap for you. `whoami` says
root. It is not the root you want.

![Terminal inside the namespace shell showing uid=0(root) from id and whoami, but cat /root/flag.txt returning Permission denied](/img/thm-fragnesia/03-namespace-root.png)

That is UID 0 inside the user namespace, which has no authority over anything on the host.
`/root/flag.txt` belongs to the host's real UID 0, which is unmapped in this namespace, so the file
reads as owned by `nobody` and the read is refused. Stage one is done, but the privilege boundary has
not moved.

The PoC does not perform stage two. You do. Exit the namespace shell, then run the corrupted binary
from `karen`'s regular shell. The page cache is global to the host and survives the namespace exit.

```bash
exit
/usr/bin/su
```

![Terminal showing karen running /usr/bin/su, the prompt changing to a root hash prompt, id reporting uid=0(root) on the host, and cat /root/flag.txt printing the flag](/img/thm-fragnesia/04-host-root.png)

That is host root, and `/root/flag.txt` reads out as
**`THM{fragnesia_skb_coalesce_amnesia}`**.

The answer mask on this one is genuinely helpful for once: `***{*********_***_********_*******}`
decodes to 9, 3, 8 and 7 characters, which `fragnesia`, `skb`, `coalesce`, `amnesia` fits exactly. If
your candidate answer does not fit the arithmetic, it is wrong before you submit it.

One honest snag worth recording. I ran the exploit a second time to capture a clean screenshot and it
reported `changed=0 skipped=192` with `all requested bytes already had desired values`. Nothing had
broken; the page cache was still corrupted from the first run, so there was nothing left to flip.
Re-running against a fresh page requires evicting the cache first, which needs the root you just
took:

```bash
  # from the root shell, before testing again
echo 3 > /proc/sys/vm/drop_caches
```

That also happens to be the cleanup the room asks for at the end of Task 4. Leaving corrupted pages
in a shared machine's cache is bad manners, and any subsequent `su` keeps spawning root shells until
they are evicted.

## Task 5: Detection and mitigation, verified

The detection material is the strongest part of the room. Fragnesia produces a syscall sequence that
no legitimate application generates:

- `unshare(CLONE_NEWUSER | CLONE_NEWNET)` from an unprivileged process, followed by writes to
  `/proc/self/uid_map`
- `socket(AF_ALG, ...)` to build the keystream lookup table
- `setsockopt(SOL_TCP, TCP_ULP, "espintcp")` on a plain TCP socket
- `splice()` from a setuid binary's file descriptor into that same socket
- a burst of `XFRM_MSG_NEWSA` netlink messages registering an SA with a known weak key
- eventually `execve("/usr/bin/su", ...)` producing a child with effective UID 0

The espintcp ULP setsockopt is the highest-fidelity single signal. Legitimate use is almost entirely
strongSwan's `charon` and a couple of related IKE daemons in NAT-traversal setups. Anything else
turning on espintcp deserves a look, and anything that turns on espintcp seconds after splicing a
setuid binary into the same socket is not a false positive.

The auditd rules the room gives you are worth noting for a real deployment, with the caveat baked in:

```
-a always,exit -F arch=b64 -S setsockopt -F a0!=-1 -k fragnesia_setsockopt
-a always,exit -F arch=b64 -S unshare -F a0=0x10000000 -k fragnesia_unshare
-a always,exit -F arch=b64 -S splice -k fragnesia_splice
```

The audit kernel API cannot filter on the `optname` argument, so rule one logs every `setsockopt` on
the host and the correlation has to happen in the SIEM. Rule three is similarly high-volume. This is
a Falco-shaped problem more than an auditd-shaped one.

On mitigation, the candidate kernel fix was still awaiting maintainer review when the room was
written, so the practical control is the same modprobe denylist used for Dirty Frag. I applied it
from the root shell I had just taken and then re-ran the PoC:

```bash
printf 'install esp4 /bin/false\ninstall esp6 /bin/false\ninstall rxrpc /bin/false\n' \
  > /etc/modprobe.d/dirtyfrag.conf
rmmod esp4 esp6 rxrpc 2>/dev/null
echo 3 > /proc/sys/vm/drop_caches
modprobe esp4     # ERROR: could not insert 'esp4': Invalid argument
```

![Terminal showing the exploit re-run as karen with the denylist active, failing at namespace_gate_failed XFRM_MSG_NEWSA ack errno 93 Protocol not supported with exit code 4](/img/thm-fragnesia/05-mitigation.png)

The exploit now dies at the XFRM gate with `errno=93 (Protocol not supported)` and exit code 4, which
is the PoC's own code for "namespace/XFRM gate closed". It never reaches the splice, let alone the
page cache. Worth stating plainly: this denylist breaks legitimate IPsec ESP and AFS RxRPC. Hosts
running strongSwan, libreswan or AFS clients need a patched kernel instead. For everything that does
not use those protocols, the modules are dead weight and the denylist is free. Organisations that
took the modprobe route for Dirty Frag were already protected against Fragnesia; the ones that took
only the Dirty Frag kernel patch were, ironically, the vulnerable ones.

## Task 6: Conclusion

Two things I am taking away from this room.

**A patch is a change to the attack surface, not a subtraction from it.** The Dirty Frag fix was
correct in isolation and introduced a high-severity LPE, because it started trusting an invariant
that another function had been quietly violating since 2013. Correct code plus correct code does not
equal correct system. When a subsystem gets patched, the sensible reaction is to schedule more
attention on that code, not less, and the `Fixes:` tags on the follow-up patch usually tell you
exactly which two commits to read.

**Root is not one thing, and your exploit output will happily lie to you about it.** The namespace
shell printed `uid=0(root)` and would have convinced a careless operator the job was done, while
`/root/flag.txt` was still unreadable. The honest check is not `whoami`, it is whether you can touch
something only the host's real UID 0 can touch. The same discipline applies to container escapes and
to any privilege claim in a report: prove the boundary moved, do not just quote an identity string.

Room solved 100%: 6 tasks, 6 answers.
