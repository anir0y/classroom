---
title: "TryHackMe The Silent Transfer: A Capstone Hunt From One Snort Alert"
date: 2026-08-22T13:31:00+05:30
lastmod: 2026-08-22T13:31:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-silent/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Zeek
  - Threat Hunting
  - Network Forensics
  - Blue Team

draft: false
description: "Walkthrough of TryHackMe The Silent Transfer: the Advanced Traffic Analysis capstone, pivoting from a single Snort Cobalt Strike alert through Zeek logs to the dropper domain, JA4 fingerprint, SMB sweep, RDP hop and a 312 MB archive exfiltrated to an external endpoint."
---

## The Silent Transfer

Room 6 of 6 and the capstone of the **Advanced Traffic Analysis** module on SOC Level 2. No teaching, no worked examples, a case briefing, a forensic workstation, and eleven questions that only get answered by pivoting. New client too: Helios Software Group rather than the Nexus Financial scenario that ran through [Network Monitoring with Zeek](/post/thm-room-networkmonitoringwithzeek/) and [Advanced Packet Analysis](/post/thm-room-advancedpacketanalysis/), though the attacker tradecraft is recognisably the same family.

Evidence sits in `/home/ubuntu/capstone/`: `snort_alerts.log`, a `zeek_logs/` directory with the usual six, `investigation.pcap`, `fortigate_traffic.log`, and a `references/` folder with local threat intel. The entire chain below came out of Zeek logs and one `strings` pass, Wireshark and Zui are on the desktop but never became necessary.

![The Silent Transfer room on TryHackMe with both tasks green and Room completed 100 percent](/img/thm-silent/05-room-complete.png)

## Starting point: one alert

The brief says "review the detection evidence around 03:47 UTC", so start there:

```bash
cd ~/capstone
grep -E "03:4[5-9]" snort_alerts.log

# 11/14-03:47:22.543210 [**] [1:2023476:4] ET TROJAN Possible Cobalt Strike Beacon CnC Activity
#   - GET Checkin [**] [Priority: 1] {TCP} 10.14.30.88:51088 -> 194.165.16.56:443
```

One line gives the compromised workstation, **10.14.30.88**, the C2 at `194.165.16.56`, and the fact that we are looking at Cobalt Strike. Everything else is worked backwards and forwards from here.

## Working backwards: how it got in

The C2 traffic is the *middle* of the story. The delivery came earlier, and `files.log` holds both ends of the intrusion in two rows:

```bash
zeek-cut ts tx_hosts rx_hosts filename mime_type total_bytes sha256 < zeek_logs/files.log
```

![Zeek files.log showing winservice-patch-4891.exe delivered to 10.14.30.88 and Q4-Finance-Backup-2025.zip sent from 10.14.0.12 to 185.213.154.201](/img/thm-silent/01-files-hashes.png)

```
1763081220  194.165.16.78  10.14.30.88      winservice-patch-4891.exe   x-dosexec  1887232
            sha256 7f3b2e1a9c8d4f5e6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90
1763091720  10.14.0.12     185.213.154.201  Q4-Finance-Backup-2025.zip  zip        312447821
            sha256 a3f8e2c1d4b7a9e0f2c3d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6
```

The dropper is **winservice-patch-4891.exe**, hash **7f3b2e1a…6d7e8f90**. The thing that eventually left is a 312 MB archive named `Q4-Finance-Backup-2025.zip`, hash **a3f8e2c1…d3e4f5a6**, and note it leaves from `10.14.0.12`, not from the workstation that was originally compromised. That gap is the whole investigation.

The dropper's delivery *domain* is not in `http.log` where you would expect it. That request's `host` field is empty, so `zeek-cut host` returns a blank column and the row's other fields shift left, which looks at a glance like the request has no hostname at all. DNS has it:

```bash
zeek-cut query answers < zeek_logs/dns.log | grep 194.165.16.78
# cdn-updates.microsoftservice.net   194.165.16.78
```

**cdn-updates.microsoftservice.net**, a domain built to read as Microsoft infrastructure at a glance while being registered under `microsoftservice.net`, which Microsoft does not own.

{{< ad >}}

## The C2 channel

Two questions concern the beacon itself. The first connection's source port comes from sorting the C2 sessions ascending rather than trusting whichever port the Snort alert happened to catch:

```bash
zeek-cut ts id.orig_h id.orig_p id.resp_h id.resp_p service < zeek_logs/conn.log \
  | awk -F'\t' '$2=="10.14.30.88" && $4=="194.165.16.56"' | sort -k1 -n | head -3

# 1763083380.000000  10.14.30.88  51000  194.165.16.56  443  ssl
# 1763083442.385990  10.14.30.88  51001  194.165.16.56  443  ssl
# 1763083498.766728  10.14.30.88  51002  194.165.16.56  443  ssl
```

**51000**, incrementing by one per beacon. The Snort alert fired on `51088`, which is the 89th connection, not the first, the alert is where detection started, not where the activity did.

![Zeek ssl.log showing 216 sessions to the C2 with JA4 t13d190900_9dc949149365_97f8aa674fd9 against the benign browser fingerprint everywhere else, 23 SMB destinations, and RDP to 10.14.0.12](/img/thm-silent/03-ja4-smb-rdp.png)

The JA4 answer is the one that makes the whole log worth reading:

```bash
zeek-cut id.orig_h id.resp_h ja4 < zeek_logs/ssl.log | sort | uniq -c
# ...
#   1 10.14.30.88  104.21.14.57     t13d1517h2_8daaf6152771_b0da82dd1658
# 216 10.14.30.88  194.165.16.56    t13d190900_9dc949149365_97f8aa674fd9
#   5 10.14.30.88  20.42.65.90      t13d1517h2_8daaf6152771_b0da82dd1658
```

Every other TLS session on the entire network, every host, every destination, carries `t13d1517h2_8daaf6152771_b0da82dd1658`, the browser. The 216 sessions to the C2 carry **t13d190900_9dc949149365_97f8aa674fd9**, and nothing else does. Sorting the whole `ssl.log` by JA4 would have found the implant without knowing the C2 address at all: one fingerprint appearing once in a network of browsers *is* the anomaly.

The tasking is in the beacon's application layer:

```bash
strings investigation.pcap | grep -oE '"cmd"[^}]{0,120}' | sort -u
# "cmd":"","interval":60
# "cmd":"d2hvYW1p","interval":60

echo d2hvYW1p | base64 -d
# whoami
```

**whoami**, most check-ins return an empty `cmd` and one carries the operator's command.

## Forwards: what it did next

```bash
# SMB discovery
zeek-cut id.orig_h id.resp_h id.resp_p < zeek_logs/conn.log \
  | awk -F'\t' '$1=="10.14.30.88" && $3=="445"' | cut -f2 | sort -u | wc -l
# 23

# RDP
zeek-cut id.orig_h id.resp_h id.resp_p < zeek_logs/conn.log \
  | awk -F'\t' '$3=="3389"' | sort -u
# 10.14.30.88  10.14.0.12  3389
```

**23** unique internal hosts swept on SMB, then a single RDP session to **10.14.0.12**, the discovery narrowing to one target, which is exactly the shape you hope to catch before the next step.

## The transfer that names the room

`10.14.0.12` is a server, so its DNS is mostly package repositories and Microsoft endpoints. One query does not belong:

```bash
zeek-cut ts id.orig_h id.resp_h id.resp_p orig_bytes < zeek_logs/conn.log \
  | awk -F'\t' '$2=="10.14.0.12" && $5>100000'
# 1763091720  10.14.0.12  185.213.154.201  443  312447821

zeek-cut ts id.orig_h query answers < zeek_logs/dns.log \
  | awk -F'\t' '$2=="10.14.0.12" && $1<1763091720' | sort -k1 -n | tail -5
# 1763089918  update.ubuntu.com          91.189.91.83
# 1763090193  docker.io                  104.21.14.57
# 1763090355  cdn.jsdelivr.net           104.16.132.229
# 1763090454  update.ubuntu.com          91.189.91.83
# 1763091660  backup.corpfiles-sync.com  185.213.154.201
```

![Zeek output showing the 312 MB transfer to 185.213.154.201 and backup.corpfiles-sync.com resolved sixty seconds earlier](/img/thm-silent/04-exfil-dns.png)

**backup.corpfiles-sync.com** resolved at `1763091660`, and the 312 MB upload to the address it returned begins at `1763091720`, exactly **60 seconds later**. Against a baseline of Ubuntu mirrors and jsDelivr, one query to a "backup sync" domain nobody provisioned, immediately followed by a third of a gigabyte leaving, is the entire case in two log lines.

That 60-second gap is worth noting for its own sake: it is short enough that a detection firing on the DNS resolution would still have had time to block the transfer.

## Every answer

| # | Question | Answer |
|---|---|---|
| 1 | Internal IP originating the C2 traffic | `10.14.30.88` |
| 2 | Delivery domain for the dropper | `cdn-updates.microsoftservice.net` |
| 3 | SHA256 of the downloaded file | `7f3b2e1a9c8d4f5e6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90` |
| 4 | Source port of the first C2 connection | `51000` |
| 5 | JA4 fingerprint of the C2 client | `t13d190900_9dc949149365_97f8aa674fd9` |
| 6 | Unique internal IPs in the SMB sweep | `23` |
| 7 | RDP destination | `10.14.0.12` |
| 8 | Domain resolved before the large transfer | `backup.corpfiles-sync.com` |
| 9 | SHA256 of the exfiltrated archive | `a3f8e2c1d4b7a9e0f2c3d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6` |
| 10 | Command the attacker issued | `whoami` |

## Attack chain

```
03:07  cdn-updates.microsoftservice.net -> winservice-patch-4891.exe  (10.14.30.88)
03:43  first C2 beacon, sport 51000 -> 194.165.16.56:443, JA4 t13d190900_...
03:47  Snort fires, 89 beacons in, sport 51088
  ~    whoami tasking returned in the beacon body
  ~    SMB sweep, 23 internal hosts
  ~    RDP 10.14.30.88 -> 10.14.0.12
06:21  10.14.0.12 resolves backup.corpfiles-sync.com
06:22  312 MB Q4-Finance-Backup-2025.zip -> 185.213.154.201:443
```

## Wrap-up

Two things worth keeping.

**The alert is a coordinate, not a starting time.** Snort fired at 03:47 on source port 51088, the 89th beacon. The first connection was at 51000, roughly 40 minutes earlier, and the dropper landed nearly 40 minutes before *that*. Every question in this room was answered by treating the alert as one point on a timeline and walking outward in both directions. An investigation that begins and ends at the alert timestamp finds a beacon; one that walks backwards finds how it got in, and forwards finds the 312 MB that left.

**JA4 was the only indicator that did not need prior knowledge.** The IPs, the domains and the file hashes all had to be discovered by following the chain. The JA4 fingerprint was visible by sorting one column: 216 sessions carrying `t13d190900_9dc949149365_97f8aa674fd9` in a network where literally every other TLS session was the same browser hash. That is a hunt you can run with no alert at all, count JA4 values per network, look at the ones with a count of one, and it is the technique from this module most likely to catch the *next* intrusion rather than explain the last one.

Room solved 100%: 2 tasks, 11 answers, 300 points.
