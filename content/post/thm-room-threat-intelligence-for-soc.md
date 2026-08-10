---
title: "TryHackMe Threat Intelligence for SOC: IOC Hunting in Kibana"
date: 2026-08-11T01:30:00+05:30
lastmod: 2026-08-11T01:50:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-tisoc/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Detection Engineering
  - Threat Intelligence
  - Kibana

draft: false
description: "Walkthrough of TryHackMe Threat Intelligence for SOC: hunt an IOC list in Kibana to find a compromised host, sinkhole domains, and build ElastAlert rules."
---

## Threat Intelligence for SOC

Threat intelligence is only useful if it changes what your security operations actually do. This SOC Level 2 room in the Detection Engineering path takes a set of technical, IOC-based intelligence and pushes it through the whole pipeline: hunt the indicators in your logs, prevent the confirmed-bad ones with a DNS sinkhole, and detect anything that slips past by turning the blocklist into an alert. The entire investigation runs against an Elastic Stack loaded with Zeek logs, driven from Kibana's Discover view with the credentials `elastic:elastic`.

![The Threat Intelligence for SOC room on TryHackMe marked Room completed 100 percent, all five tasks green](/img/thm-tisoc/01-room.png)

## Task 2: hunting the IOC feed

The first job is to take an IOC feed (a list of malicious IPs) and check whether any of them show up in the environment. The room uses **Uncoder.io** to convert the raw IOC list into a ready-to-run SIEM query, so you do not have to hand-write the syntax for whatever platform you happen to run.

![The Uncoder.io interface converting an IOC list into an Elastic Query, showing four deduplicated IPs](/img/thm-tisoc/02-uncoder.png)

The generated query goes straight into Kibana's Discover, filtered to the `filebeat-*` index and the incident's timeframe of Feb 14 to 16, 2023.

![Kibana Discover with the filebeat-star index, a destination.ip query for the IOC IPs, and the Feb 2023 time range](/img/thm-tisoc/03-kibana.png)

The investigation IOC list holds **11** unique IP addresses (after removing defanging and duplicates). Querying `destination.ip` against all eleven returns **48** hits, but the interesting detail is that only **7** of the eleven IOCs actually appear in the logs. The other four are near-duplicates of real indicators (`185.224.126.215` next to `185.224.128.215`, and so on), a deliberate reminder that IOC feeds contain typos and decoys, and that verification matters.

![Terminal card of the IOC hunt: 48 hits, only 7 of 11 IOCs present, the four decoys with zero hits, and the single compromised host 10.10.196.49](/img/thm-tisoc/04-iochunt.png)

Every one of those 48 connections originates from a single internal address, so the **compromised host** is **`10.10.196.49`**. Pivoting on individual indicators fills in the rest: the host made **21** connections to `185.224.128.215`, and its connections to `107.175.202.151` all went to destination port **`80`**.

{{< ad >}}

## Task 3: prevention with a DNS sinkhole

Knowing which domains are malicious lets you stop the traffic before it leaves, and the classic tool is a **DNS sinkhole**: point the bad domains at an address you control so the malware never reaches its real infrastructure. The logs capture the exact moment this was deployed. The domain `agrosaoxe.info` was queried **11** times, and its answers tell the story.

![Terminal card of the DNS sinkhole: agrosaoxe.info resolving to real Cloudflare IPs before the sinkhole, then to 192.168.5.13 after, plus the sinkholed-domain counts](/img/thm-tisoc/05-sinkhole.png)

Before the sinkhole was configured, `agrosaoxe.info` resolved to its genuine IPv4 addresses **`104.21.48.143`** and **`172.67.186.179`** (Cloudflare). After deployment, every query for it returns **`192.168.5.13`**, the **DNS sinkhole IP**. Filtering `dns.resolved_ip` on that sinkhole address shows **115** hits spread across **12** unique domains, the full set that was redirected away from their real servers.

## Task 4: detecting the blocklist

Prevention and detection work best together: once the sinkhole is in place, a resolution pointing at the sink is itself a high-fidelity signal that something on the network is trying to reach a known-bad domain. The room writes a small Sigma rule for exactly that, matching `dns.resolved_ip: '0.0.0.0'` (a null-route sink), and converts it to an ElastAlert rule with Uncoder. The converted rule's **`alert`** field is **`debug`**, and running it generates **40** alerts. Those alerts cover **7** unique domains sinkholed via `0.0.0.0`, one of which, **`twizt.ru`**, carries a `.ru` TLD.

![Card listing every answer in the room grouped by task](/img/thm-tisoc/06-answers.png)

## Room summary

| | |
|---|---|
| Room | Threat Intelligence for SOC (SOC Level 2, Detection Engineering) |
| Category | Detection Engineering, Medium |
| Task 2 | `11`; `48`; `7`; `21`; host `10.10.196.49`; port `80` |
| Task 3 | `11` queries; pre-sink `104.21.48.143`, `172.67.186.179`; sink `192.168.5.13`; `115`; `12` |
| Task 4 | `debug`; `40`; `7`; `twizt.ru` |
| Tools | Kibana / Discover, Uncoder.io, ElastAlert, Zeek logs |

## Wrap-up

The room is a compact tour of how threat intelligence earns its keep in a SOC. The same IOC list drives all three stages: hunting it in the logs proves a host was compromised and reveals which indicators are real versus noise, sinkholing the confirmed domains prevents the next callback, and alerting on sinkhole resolutions turns the prevention control into a detection one for free. The recurring lesson is verification. Eleven IOCs were provided but only seven were genuine, so blindly trusting a feed would have wasted effort on four decoys. Intelligence is a starting point for investigation, not a verdict, and the value comes from running it through your own environment and watching what it actually lights up.
