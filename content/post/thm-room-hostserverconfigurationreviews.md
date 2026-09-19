---
title: "TryHackMe Host-Server Configuration Reviews: CIS Audit Walkthrough"
date: 2026-09-19T05:12:00+05:30
lastmod: 2026-09-19T05:12:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-hostcfgreview/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Jr Penetration Tester
  - Privilege Escalation
  - CIS Benchmarks
  - DISA STIG
  - Configuration Review
  - SUID

draft: false
description: "Walk through TryHackMe Host-Server Configuration Reviews: CIS Benchmarks, DISA STIGs, and a SUID privilege escalation chain from a CIS audit report."
---

Host-Server Configuration Reviews opens the Privilege Escalation module on the Jr Penetration Tester path, right before [TryHackMe Vulnerability Scanning Tools: Nmap, Nikto, OpenVAS](/post/thm-room-vulnerabilityscanningtools/) territory but pointed the other direction: instead of hunting for missing patches, this room teaches you to read a host's own configuration against a security baseline and spot the deviations an attacker can escalate through. It is a theory-heavy room, nine tasks, mostly reading, with one practical task that hands you a full CIS Benchmark audit report across three hosts and asks you to mine it for privilege escalation vectors.

## Task 1: Introduction

The room opens by drawing the line between the two broad categories of privilege escalation: vulnerability-based, which exploits bugs in software such as unpatched kernels or known CVEs, and configuration-based, which exploits how a host has been set up, overly permissive file permissions, weak service accounts, credentials left in accessible locations. Vulnerability-based escalation needs unpatched software to work; configuration-based escalation works on a fully patched system, because the weakness is administrative rather than technical. No question here, just mark as complete.

## Task 2: What Is a Configuration Review

A configuration review is a structured audit of a host's settings, permissions, services, and policies, measured against an accepted secure baseline. The key distinction from vulnerability scanning: a vulnerability scanner such as Nessus or Qualys looks for known software flaws and missing patches, while a configuration review looks at how the system is set up regardless of what software is installed. A host can pass a vulnerability scan with zero findings and still fail a configuration review because its services run with excessive privileges or its file permissions are too broad.

**Yay or Nay: a host that passes a vulnerability scan with no findings is guaranteed to have a secure configuration.** The answer is **Nay**, since the two checks measure different things entirely.

## Task 3: Security Baselines and Frameworks

This task introduces the two most widely referenced configuration standards. CIS Benchmarks, published by the Center for Internet Security through a consensus-driven process, define Level 1 (broadly applicable, minimal functional impact) and Level 2 (deeper hardening, more operational impact) recommendations for a huge range of operating systems and applications. DISA STIGs, published by the U.S. Department of Defense, are more prescriptive and mandatory on government networks. Each STIG finding carries a severity category: CAT I for the highest risk (direct loss of confidentiality, integrity, or availability), CAT II for medium, CAT III for low.

**In a DISA STIG, which severity category represents the highest risk?** **CAT I**.

## Task 4: Automated Compliance Tooling

Manually walking a full CIS Benchmark or STIG against a host is impractical at any scale, so the room covers the tools that automate it. Nessus, Tenable's commercial vulnerability scanner, also includes compliance auditing against CIS Benchmarks and STIGs, which makes a shared Nessus compliance report from a white-box engagement a pre-built list of misconfigurations. Lynis is an open-source auditor that runs locally on Linux/macOS/Unix hosts and produces a hardening index, useful post-shell but a rules-of-engagement question before you drop it on a target. OpenSCAP implements the standardised SCAP protocol for machine-readable compliance evaluation, and CIS-CAT is CIS's own purpose-built assessment tool. The task also draws the parallel to offensive enumeration tools: LinPEAS, WinPEAS, and PowerUp check for many of the same misconfigurations, just from an attacker's perspective rather than a defender's.

**What commercial vulnerability scanner, developed by Tenable, includes compliance auditing functionality against CIS Benchmarks?** **Nessus**.

## Task 5: Categories of Misconfiguration

This task catalogues the recurring misconfiguration categories: user and group configuration, file and directory permissions, service configurations, scheduled tasks and cron jobs, credential storage, and network configuration. The file permissions section calls out SUID and SGID specifically: SUID (Set User ID) is the special permission bit that causes an executable to run with the privileges of the file's owner rather than the user who invoked it, which is exactly the mechanism the practical task later exploits.

**What special permission bit on Linux causes an executable to run with the privileges of the file's owner?** **SUID**.

## Task 6: Structured Enumeration Methodology

The methodology laid out here is operating-system-agnostic and splits into three phases. Phase 1, Situational Awareness, comes before any specific misconfiguration checks: current user identity and privileges, OS version and architecture, hostname and role, and domain-joined status for Windows. Phase 2, Category-Based Enumeration, works through the categories from Task 5 in a consistent order. Phase 3, Prioritisation, ranks findings by directness of escalation path and, critically, teaches you to recognise chains: a world-writable script alone is low priority, a root cron job alone is not inherently insecure, but the combination, a world-writable script executed by a root cron job, is a direct privilege escalation path. That exact pattern shows up in the practical task below.

**In the methodology described above, what is the first phase you should complete before checking for specific misconfigurations?** **Situational Awareness**.

## Task 7: Reading a CIS Benchmark

This task breaks down the anatomy of a CIS Benchmark recommendation: title, profile applicability (Level 1/2), description, rationale, audit procedure, and remediation. It reframes the offensive read: instead of asking "is this system compliant?", a penetration tester asks "if this system is not compliant, what can I do with the finding?" Using the classic `/etc/shadow` example, a failed permissions check means the file is readable, which means hash extraction and offline cracking with John or Hashcat. No question here beyond marking the task complete.

## Task 8: Practical

The practical task hands you an interactive CIS Benchmark audit report covering three hosts: two Ubuntu 24.04 LTS servers (`linux-web-01` at 10.10.45.12 and `linux-db-02` at 10.10.45.20, both assessed against the CIS Ubuntu Linux 24.04 LTS Benchmark) and one Windows Server 2022 domain controller (`win-dc-01` at 10.10.45.50, assessed against the CIS Microsoft Windows Server 2022 Benchmark). One Linux host passes every check; the other Linux host and the Windows host each have multiple failures to dig through.

Clicking into `linux-web-01`, check 7.1.5 (`Ensure permissions on /etc/shadow are configured`) is failing. The audit expected `0640` with group `shadow`; the actual output shows `0644` owned by `root:root`, meaning the file is world-readable.

![linux-web-01 /etc/shadow permission check failing at 0644 instead of the expected 0640](/img/thm-hostcfgreview/01-shadow-perms-fail.png "linux-web-01 shadow permissions finding")

**On linux-web-01, what is the actual permission value observed on /etc/shadow in the failing check 7.1.5?** **0644**.

Check 7.1.11 (`Ensure no world-writable files exist`) found three world-writable files, and the report calls out `/opt/scripts/backup.sh` specifically: it is executed by a root cron job every five minutes, so any local user can modify the script and have it run as root within minutes. This is the exact chain from Task 6, a file permissions finding plus a scheduled task finding combining into a direct escalation path.

![linux-web-01 world-writable files finding, including the root cron-executed backup.sh](/img/thm-hostcfgreview/02-world-writable-cron-chain.png "linux-web-01 world-writable files and cron chain")

**On linux-web-01, how many world-writable files were detected by check 7.1.11?** **3**.

Check 7.1.13 (`Ensure SUID and SGID files are reviewed`) is a manual check, and the actual output includes an unexpected binary alongside the standard `passwd`/`sudo`/`chfn`/`newgrp` set: `/opt/admin-tools/logviewer`. It is not part of the standard installation, and if it supports arbitrary file reads or command execution, it is a direct root path courtesy of the SUID bit from Task 5.

![linux-web-01 SUID/SGID review finding the unexpected /opt/admin-tools/logviewer binary](/img/thm-hostcfgreview/03-suid-unexpected-binary.png "linux-web-01 unexpected SUID binary")

**On linux-web-01, what is the full path of the unexpected SUID binary found by check 7.1.13?** **/opt/admin-tools/logviewer**.

{{< ad >}}

Switching to `win-dc-01`, check 1.1.4 (`Ensure 'Minimum password length' is set to '14 or more character(s)'`) is failing at 8 characters against a 14-character baseline, weakening resistance to offline hash cracking on a domain controller.

**On win-dc-01, what is the minimum password length currently configured, as reported by check 1.1.4?** **8**.

Check 2.3.17.1 (`Ensure 'User Account Control: Admin Approval Mode for the Built-in Administrator account' is set to 'Enabled'`) reads the `FilterAdministratorToken` registry value under `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System`. Expected `0x1`, actual `0x0`: Admin Approval Mode is disabled, so the built-in Administrator account runs everything with full administrative privilege by default, no elevation prompt required. Any process compromised in that account's context already has unrestricted access.

![win-dc-01 UAC Admin Approval Mode check failing with FilterAdministratorToken at 0x0](/img/thm-hostcfgreview/04-windc01-uac-filteradmintoken.png "win-dc-01 FilterAdministratorToken finding")

**On win-dc-01, what is the current value of the FilterAdministratorToken registry key, as reported by check 2.3.17.1?** **0x0**.

Finally, `linux-db-02` is the clean host: all 8 checks pass, 100% compliance, no deviations.

**How many total checks does linux-db-02 pass?** **8**.

## Task 9: Conclusion

The room closes by tying the pieces together: configuration-based escalation is as reliable an attack surface as unpatched software, CIS Benchmarks and DISA STIGs define what "secure" means for a given baseline, automated tools scale the auditing, and the six misconfiguration categories mapped to the structured enumeration methodology carry forward into the Linux and Windows privilege escalation rooms that follow this one in the module. No answer needed, just a completion click.

Two things worth keeping from this room. First, a passing vulnerability scan tells you nothing about configuration hygiene, they are orthogonal checks, and a fully patched host can still hand over root through a bad file permission. Second, the chaining instinct from Task 6 is the actual skill being taught: the `/opt/scripts/backup.sh` finding was two separate low-severity observations, a world-writable file and a root cron job, that only become a privilege escalation path once you connect them, which is exactly the kind of thing LinPEAS or WinPEAS output will hand you as two separate lines that you still have to read together yourself.

Room solved 100%: 9 tasks, 9 answers.
