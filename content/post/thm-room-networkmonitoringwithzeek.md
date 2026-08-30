---
title: "TryHackMe Network Monitoring with Zeek: One uid, Five Logs, One Intrusion"
date: 2026-08-21T22:46:00+05:30
lastmod: 2026-08-21T22:46:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-zeek/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Zeek
  - Network Forensics
  - Detection Engineering
  - Blue Team

draft: false
description: "Walkthrough of TryHackMe Network Monitoring with Zeek: reading conn.log, dns.log, http.log, ssl.log and files.log with zeek-cut to find a Cobalt Strike beacon, DNS tunnel and 5 MB exfil POST, then tuning a Notice script from 23 alerts down to 10."
---

## Network Monitoring with Zeek

This is room 3 of 6 in the **Advanced Traffic Analysis** module on SOC Level 2, sitting between *Detection Engineering With Snort* and *Threat Hunting with Zui*. The framing is deliberate: the Snort room built rules that are now firing on the Finance subnet, and this room deals with everything that happened **before** those rules were loaded. Snort tells you what is happening now; Zeek's logs are the record of what already did.

The whole investigation runs from a terminal on the lab VM, no Splunk, no packet-by-packet Wireshark. Zeek has already parsed the capture into six tab-separated logs in `~/logs/`, and every entry from the same network session carries a shared `uid`. Follow that `uid` and you reconstruct a session across five protocol analysers without opening a single packet. That is the pattern the room is teaching, and it is the same "reduce noise without hiding signal" discipline that runs through [Intro to Detection Engineering](/post/thm-room-introtodetectioneng/) and [Sigma Language](/post/thm-room-sigmalanguage/).

Everything below runs from `/home/ubuntu` on the lab machine.

![The Network Monitoring with Zeek room on TryHackMe with all eight tasks green and Room completed 100 percent](/img/thm-zeek/05-room-complete.png)

## Task 2: conn.log, the index of everything

`conn.log` has a row for every TCP, UDP and ICMP session Zeek saw, and `zeek-cut` pulls named columns out of it. Beaconing means the same source-destination-port triplet repeating, so counting triplets surfaces it immediately:

```bash
zeek-cut id.orig_h id.resp_h id.resp_p < logs/conn.log | sort | uniq -c | sort -rn | head -5
zeek-cut ts id.orig_h id.resp_h id.resp_p duration orig_bytes < logs/conn.log \
  | awk -F'\t' '$3=="194.165.16.56" && $4=="443"' | sort -k1 -n | head -4
```

![Terminal output ranking connection triplets, with 196 DNS sessions and 82 sessions to 194.165.16.56 on port 443, followed by four beacon rows each 0.044 seconds long and 308 bytes](/img/thm-zeek/01-beacon-conn.png)

The 196 DNS sessions to the internal resolver are baseline. The row that does not belong is **82 sessions from 10.14.22.88 to 194.165.16.56 on TCP/443**, no browser distributes 82 connections to a single external IP in 90 minutes. Sorting those by timestamp confirms the shape: roughly 60-second gaps, `duration` of 0.044 s every time, `orig_bytes` of 308 every time. Identical size, identical duration, fixed interval, a Cobalt Strike check-in, not application traffic.

The two questions here are more literal than the narrative. The first internal host the workstation touches on TCP/445 with `conn_state=S0` is **10.14.22.10**, found by filtering for the scan signature and sorting ascending rather than taking whatever `head` happened to return:

```bash
zeek-cut ts id.orig_h id.resp_h id.resp_p conn_state < logs/conn.log \
  | awk -F'\t' '$2=="10.14.22.88" && $4=="445" && $5=="S0"' | sort -k1 -n | head -3

# 1763090100.000000  10.14.22.88  10.14.22.10  445  S0
# 1763090100.078552  10.14.22.88  10.14.22.11  445  S0
# 1763090100.283725  10.14.22.88  10.14.22.12  445  S0
```

Sequential IPs, 78 milliseconds apart, all `S0`, an SMB sweep across the segment looking for a pivot. And the last beacon timestamp is **1763092746.812696**, the same `sort -k1 -n | tail` in reverse. Note both answers want the raw Zeek epoch, not a converted date; the underscore mask (`__________.______`) confirms ten digits, a dot, six digits before you submit.

## Task 3: dns.log and separating two kinds of long query

`conn.log` gave IPs but no names. `dns.log` answers that by searching backwards from the resolved address:

```bash
zeek-cut id.orig_h query answers < logs/dns.log | grep 194.165.16.56
# 10.14.22.88  update.softpatch-cdn.com  194.165.16.56

zeek-cut ts id.orig_h query answers < logs/dns.log | grep 185.213.154.201
# 1763090096.000000  10.14.22.88  backup.corpfiles-sync.com  185.213.154.201
```

The C2 hostname is **update.softpatch-cdn.com**, named to look like a software-update CDN that does not exist, pointing into AS44477. The exfiltration destination resolves to **backup.corpfiles-sync.com**, and the timestamp matters: `1763090096` is 03:14:56 UTC, eleven seconds before the 5 MB POST begins. Resolution immediately followed by bulk upload is the correlation that turns "a large transfer" into "an exfiltration".

Then the tunnelling. Filtering for queries over 60 characters and counting by source is where the room's real lesson starts:

```bash
zeek-cut id.orig_h query qtype_name < logs/dns.log \
  | awk -F'\t' 'length($2)>60 {print $1"  "substr($2,1,52)"  "$3}' | sort | uniq -c | sort -rn | head -6
zeek-cut id.orig_h query < logs/dns.log \
  | awk -F'\t' 'length($2)>60 {c[$1]++} END {for(h in c) print c[h], h}' | sort -rn
```

![Terminal output showing six long Base32 labels under exfil-channel.net from 10.14.22.88 all with qtype TXT, then a count of 18 long queries from 10.14.22.88 and 15 from 10.0.0.53](/img/thm-zeek/02-dns-tunnel.png)

Every workstation query is a long Base32 label under a constant `exfil-channel.net`, and the record type is **TXT**, the varying label is encoded data, the constant SLD is the attacker's nameserver. That is iodine/dnscat2-shaped tunnelling running in parallel with the HTTPS beacon.

But the per-source count is the part worth pausing on: **18** long queries from `10.14.22.88` and **15** from `10.0.0.53`. The second host is the internal DNS server doing DNSSEC validation, whose NSEC3 record names are also long and hex-looking. Same length, same shape, completely different meaning, separable only by source, second-level domain (`dnssec-validation.local`) and query type (`DS`, not `TXT`). A naive "query longer than 60 characters" rule catches both, which is exactly the problem Task 7 makes you fix.

{{< ad >}}

## Task 4: http.log and the TLS handshake that says nothing

The exfiltration is a plain HTTP POST, so `http.log` has the full application-layer detail:

```bash
zeek-cut uid id.orig_h id.resp_h method uri request_body_len < logs/http.log \
  | awk -F'\t' '$3=="185.213.154.201"'
# CmQW1d3iuUHHDgqYe7  10.14.22.88  185.213.154.201  POST  /upload/data  5348721
```

The URI is **/upload/data**, and note the `uid`, `CmQW1d3iuUHHDgqYe7` is the thread that ties the rest of the investigation together.

`ssl.log` is the mirror image. Where HTTP hands you everything, TLS hands you almost nothing, and what is *missing* is the indicator:

```bash
zeek-cut id.resp_h server_name < logs/ssl.log | sort | uniq -c
#      82 194.165.16.56  -
```

All **82** sessions to the C2 have an empty `server_name`. Zeek writes `-` for an unset field, so the count is over the literal dash rather than an empty string, worth knowing before writing the filter. A real browser always sends SNI because virtual hosting depends on it; a beacon connecting straight to an IP has no hostname to send. Eighty-two TLS handshakes with no SNI to one address is a stronger signal than any certificate detail would have been.

## Task 5: files.log and a MIME type that contradicts the name

`files.log` records what Zeek reassembled out of those sessions, with hashes:

```bash
zeek-cut uid filename mime_type total_bytes is_orig < logs/files.log
zeek-cut filename sha256 < logs/files.log | grep backup_archive
grep 459b0165 threat-feed.csv
```

![Terminal output showing three files.log rows, the SHA256 of backup_archive.zip, and the matching threat-feed line naming CobaltStrikeStager](/img/thm-zeek/03-files-hash.png)

Three rows, and each says something different:

- **backup_archive.zip**, `application/zip`, 5,348,721 bytes, `is_orig=T`, this is the file inside the exfiltration POST, going *out*.
- **invoice_march.pdf**, `application/x-dosexec`, 92,160 bytes, `is_orig=F`, the name says PDF, the content is a Windows executable. Zeek reports **application/x-dosexec** because it identifies files by magic bytes, not extension. This is the download that started the whole thing.
- A third row with no filename, 7 bytes, `is_orig=F`, the server's reply body to the POST.

Taking the SHA256 of the archive into the reference feed closes the loop:

```
459b0165d7f2e5577d60cd8c1244daded93f4457ed4a89983e5e36c490402bec,CobaltStrikeStager,2025-11-10,high
```

The family is **CobaltStrikeStager**, dated four days before this capture.

One snag worth recording. My first pass at this used `zeek-cut conn_uids ...` because that is the field name in current Zeek documentation, and it returned a **silently blank column**, no error, no warning, just empty output where the uid should be. This build's `files.log` header names the field `uid`, singular. `zeek-cut` does not complain about a column that does not exist, so always `grep '^#fields'` the log before trusting a field name:

```bash
grep '^#fields' logs/files.log | tr '\t' '\n'
# ts fuid uid id.orig_h id.orig_p id.resp_h id.resp_p source depth analyzers
# mime_type filename duration local_orig is_orig seen_bytes total_bytes ...
```

## Task 6: the same uid across three logs

This task is the point of the whole room, the same connection viewed from three analysers, and the differences between them are meaningful rather than contradictory.

`conn.log` reports `orig_bytes` of 5,348,913 for that connection. `http.log` reports `request_body_len` of 5,348,721. The difference is **192** bytes, and it is not an error: `orig_bytes` counts everything the originator sent at the application layer, so it includes the HTTP request headers wrapping the upload, while `request_body_len` counts only the body. Knowing which log answers which question is the difference between "5 MB left" and "a 5,348,721-byte ZIP left inside a POST to /upload/data".

Pivoting the same `uid` into `files.log` gives the responder side: **7** bytes came back as the file body, the entire server response to a 5 MB upload. A drop server acknowledging receipt, nothing more.

And the domain that resolved to `185.213.154.201` is **backup.corpfiles-sync.com**, the same answer as Task 3 asked from the other direction. That repetition is the point: the room wants the pivot done twice, forwards from the IP and backwards from the domain, because in a real investigation you rarely start from the same end twice.

## Task 7: 23 notices, 13 of them wrong

The starter script `scripts/dns_notice.zeek` fires a Notice on any DNS query over 60 characters:

```zeek
event dns_request(c: connection, msg: dns_msg, query: string, qtype: count, qclass: count)
{
    if ( |query| > 60 )
    {
        NOTICE([$note=DNS_Exfil_LongQuery,
                $conn=c,
                $msg=fmt("Long DNS query (%d chars): %s", |query|, query),
                $identifier=cat(c$id$orig_h),
                $suppress_for=5min]);
    }
}
```

Running it against the capture:

```bash
mkdir -p ~/run1 && cd ~/run1
zeek -r ~/pcaps/finance-sensor.pcap ~/scripts/dns_notice.zeek
grep -vc '^#' notice.log
# 23
zeek-cut id.orig_h note < notice.log | sort | uniq -c
#      13 10.0.0.53     DNSTunnel::DNS_Exfil_LongQuery
#      10 10.14.22.88   DNSTunnel::DNS_Exfil_LongQuery
```

**23** notices, and 13 of them, more than half, are the DNS server doing its job. A rule with a 57% false-positive rate does not get deployed; it gets muted, and then the 10 real ones are muted with it.

The fix is two lines, an early return before the length check:

```zeek
event dns_request(c: connection, msg: dns_msg, query: string, qtype: count, qclass: count)
{
    if ( c$id$orig_h == 10.0.0.53 )
        return;
    if ( |query| > 60 )
    ...
```

```bash
mkdir -p ~/run2 && cd ~/run2
zeek -r ~/pcaps/finance-sensor.pcap ~/dns_notice_tuned.zeek
grep -vc '^#' notice.log
# 10
```

![Terminal output showing 10 notices after tuning, all 10 from 10.14.22.88 with note DNSTunnel::DNS_Exfil_LongQuery](/img/thm-zeek/04-notice-tuned.png)

**23 down to 10**, every remaining notice a true positive. Same data, same threshold, one extra condition.

Two details are worth pulling out of those numbers. First, 18 long queries from the workstation produce only 10 notices, and 15 DNSSEC queries produce 13, because `$suppress_for=5min` with `$identifier=cat(c$id$orig_h)` deduplicates per source IP over a five-minute window. The notice count is not the event count, and reading it as one would understate the tunnel. Second, suppressing by source IP is the crudest possible tuning: it works here because `10.0.0.53` is a known resolver, but it also means a compromise of that host becomes invisible to this rule. A production version would suppress on the combination of source *and* `dnssec-validation.local` *and* qtype `DS`, keeping the rule alive for a resolver that starts querying something else.

## Every answer

| Task | Question | Answer |
|---|---|---|
| 2 | First internal host reached on TCP/445 with S0 | `10.14.22.10` |
| 2 | Last timestamp of the repeated TCP/443 sessions | `1763092746.812696` |
| 3 | Record type of the exfil-channel.net queries | `TXT` |
| 3 | Domain queried immediately before the 03:15 POST | `backup.corpfiles-sync.com` |
| 3 | Domain that resolved to 194.165.16.56 | `update.softpatch-cdn.com` |
| 4 | uri of the POST to 185.213.154.201 | `/upload/data` |
| 4 | TLS sessions to 194.165.16.56 with empty server_name | `82` |
| 5 | filename extracted from the 5.3 MB POST | `backup_archive.zip` |
| 5 | MIME type Zeek reports for invoice_march.pdf | `application/x-dosexec` |
| 5 | Threat-feed family for the backup_archive.zip hash | `CobaltStrikeStager` |
| 6 | orig_bytes minus request_body_len | `192` |
| 6 | Responder file body bytes for the same uid | `7` |
| 6 | Domain resolving to 185.213.154.201 | `backup.corpfiles-sync.com` |
| 7 | Notices before tuning | `23` |
| 7 | Notices after suppressing 10.0.0.53 | `10` |

## IOCs from this capture

| Type | Value | Log |
|---|---|---|
| IP address | `194.165.16.56` (C2, AS44477) | conn.log, ssl.log |
| IP address | `185.213.154.201` (exfil drop) | conn.log, http.log |
| Domain | `update.softpatch-cdn.com` | dns.log |
| Domain | `backup.corpfiles-sync.com` | dns.log |
| Domain | `exfil-channel.net` (DNS tunnel SLD) | dns.log |
| URI | `POST /upload/data` | http.log |
| File | `invoice_march.pdf` (actually x-dosexec) | files.log |
| SHA256 | `459b0165...490402bec`, CobaltStrikeStager | files.log, threat-feed.csv |
| Host | `10.14.22.88` (WKST-FINANCE-04) | all |

## Wrap-up

Two things worth keeping from this room.

**`zeek-cut` fails silently on a field name that does not exist.** Asking for `conn_uids` when the log calls the field `uid` returns a blank column, exit status zero, no warning, and a blank column in the middle of a correlation looks exactly like "these events are unrelated". The habit that prevents it costs one command: `grep '^#fields'` the log first and read the real schema. Field names drift between Zeek versions and documentation lags, so the header on the box beats the documentation on the web every time.

**The gap between an indicator and a detection is entirely made of false positives.** The tunnel was obvious the moment the long queries were sorted, 18 Base32 labels under one SLD is not subtle. Turning that observation into a rule produced 23 alerts of which 13 were a DNS server validating DNSSEC, and a rule that is wrong more often than it is right is a rule that gets ignored. What made it deployable was not a better threshold but one extra condition drawn from knowing the environment: this resolver legitimately emits long labels. Detection engineering is mostly that, the threshold finds the signal, and the environment knowledge is what removes everything else that looks like it.

Room solved 100%: 8 tasks, 17 answers, 120 points.
