---
title: "TryHackMe Snort Challenge: blocking live attacks with IPS inline mode"
date: 2026-11-12T11:34:00+05:30
lastmod: 2026-11-12T11:34:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-snortchallenges2/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Snort
  - IDS
  - IPS
  - network security
  - inline mode
  - afpacket
  - rule writing

draft: false
description: "TryHackMe Snort Challenge walkthrough: writing Snort IPS rules and running inline mode with afpacket DAQ to block SSH brute-force and reverse shell attacks."
---

Snort Challenge is a Medium room that puts you in the seat of a SOC analyst using Snort as an inline IPS to block two live attacks: an SSH brute-force and a Metasploit reverse shell. Each scenario runs on a dedicated VM with two network interfaces, and the goal is to identify the attack traffic, write a `drop` rule, then run Snort in IPS mode long enough for the system to confirm the block and produce a flag. This post walks through both scenarios. If you are working through the Snort module, the [Snort room](/post/thm-room-snort/) covers the rule syntax and modes.

## Task 1: Introduction

Background reading on J&Y Enterprise and their AI assistant J.A.V.A. No answer required.

## Task 2: Scenario 1, Brute-Force

### Identifying the attack

The VM boots with two interfaces: `eth0` (carries the lab traffic) and `eth1` (internal bridge partner). Sniffing non-SSH traffic on eth0 with tcpdump immediately reveals the brute-force pattern:

```
  10.10.245.36:46864 -> 10.10.140.29:22  [SYN]
  10.10.245.36:46452 -> 10.10.140.29:22  [SYN]
  10.10.245.36:46454 -> 10.10.140.29:22  [SYN]
  ...
```

A single source IP (10.10.245.36) is hitting SSH (port 22) on the victim (10.10.140.29) with rapid sequential connection attempts. Classic brute-force profile.

The service under attack is **ssh**. The protocol and port: **tcp/22**.

### Writing the IPS rule

The rule uses the `drop` action (only meaningful in inline/IPS mode) to silently discard brute-force packets:

```
  drop tcp 10.10.245.36 any -> 10.10.140.29 22 (msg:"SSH Brute Force"; sid:100001; rev:1;)
```

Written to `/etc/snort/rules/local.rules`, which `snort.conf` already includes.

### Running Snort inline

Snort's afpacket DAQ requires a bridge between two different interfaces. Passing the same interface twice (`eth0:eth0`) fails with "Couldn't create the bridge between eth0 and eth0." The correct invocation bridges eth0 and eth1:

```
  sudo snort -c /etc/snort/snort.conf -Q --daq afpacket -i eth0:eth1 -A full -l /var/log/snort
```

The `-Q` flag enables inline mode, `--daq afpacket` selects the Linux afpacket acquisition module, and `-i eth0:eth1` creates the bridge pair. The `-A full` alert mode and default log path are required by the room instructions.

Within seconds, Snort begins dropping packets:

```
  [Drop] [**] [1:100001:1] SSH Brute Force [**] {TCP} 10.10.245.36:46864 -> 10.10.140.29:22
  [Drop] [**] [1:100001:1] SSH Brute Force [**] {TCP} 10.10.245.36:46866 -> 10.10.140.29:22
  ...
```

After blocking for about a minute, a `flag.txt` appears on the desktop: **THM{81b7fef657f8aaa6e4e200d616738254}**.

{{< ad >}}

## Task 3: Scenario 2, Reverse Shell

### Identifying the attack

A fresh VM starts for this scenario. The narrative shifts from inbound brute-force to outbound exfiltration: J.A.V.A. detects "persistent outbound traffic, possibly a reverse shell." Sniffing with tcpdump confirms it:

```
  10.10.144.156:4444 -> 10.10.196.55:54156  [PSH,ACK]
  10.10.196.55:54156 -> 10.10.144.156:4444  [PSH,ACK]
  10.10.196.55:54156 -> 10.10.144.156:4444  [PSH,ACK]
  ...
```

The attacker (10.10.144.156) has a listener on TCP 4444, and the victim (10.10.196.55) is connecting back with small, frequent data exchanges. Port 4444 is the default port for Metasploit's reverse TCP handler.

The protocol and port: **tcp/4444**. The tool highly associated with this port: **Metasploit**.

### Writing and running the IPS rule

The bidirectional operator `<>` catches traffic in both directions:

```
  drop tcp 10.10.144.156 any <> 10.10.196.55 any (msg:"Reverse Shell"; sid:100001; rev:1;)
```

Running Snort with the same inline invocation:

```
  sudo snort -c /etc/snort/snort.conf -Q --daq afpacket -i eth0:eth1 -A full -l /var/log/snort
```

After a minute of blocking, the flag appears: **THM{0ead8c494861079b1b74ec2380d2cd24}**.

## Takeaways

1. **The afpacket DAQ bridge requires two distinct interfaces.** Passing the same interface on both sides of the colon fails silently in configuration but crashes at runtime with a cryptic "Couldn't create the bridge" error. On THM VMs with split-screen labs, eth0 carries the attack traffic and eth1 serves as the bridge partner. The traffic flows through both as soon as Snort creates the inline bridge, so the rule fires regardless of which interface the packets arrived on originally.

2. **Inline IPS mode changes Snort from observer to enforcer.** In IDS mode, a `drop` rule behaves identically to `alert` because Snort only reads a copy of the traffic. The `-Q` flag with the afpacket DAQ puts Snort directly in the packet path, making `drop` actually discard packets before they reach the destination. This distinction matters for real deployments: IDS catches what happened, IPS prevents it from happening.

Room solved 100%: 3 tasks, 7 answers.
