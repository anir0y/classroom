---
title: "TryHackMe Attacking ECB Oracles: chosen-plaintext secret recovery"
date: 2026-10-26T18:45:00+05:30
lastmod: 2026-10-26T18:45:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-ecboracles/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - AES
  - ECB
  - chosen-plaintext attack
  - oracle attack
  - cryptographic failures
  - Web Application Red Teaming
  - Cryptographic Failures

draft: false
description: "TryHackMe Attacking ECB Oracles walkthrough: AES-ECB chosen-plaintext attack, block size and offset determination, byte-by-byte secret recovery from an oracle."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Attacking ECB Oracles |![Attacking ECB Oracles room icon](https://cdn-images.tryhackme.com/room-icons/6093e17fa004d20049b6933e-1743186246407)|

This hard-difficulty room in the Cryptographic Failures module of the Web Application Red Teaming path teaches AES-ECB's fundamental weakness: identical plaintext blocks produce identical ciphertext blocks, and that determinism lets an attacker with oracle access recover appended secrets byte by byte. Tasks 2 and 3 cover symmetric encryption fundamentals and ECB's block/padding mechanics. Task 4 demonstrates the "ECB Penguin" pattern leakage on image data. Task 5 walks through the full chosen-plaintext attack on a live Flask oracle, from block-size determination through offset calculation to complete secret extraction. This room sits alongside [Breaking Crypto the Simple Way](/post/thm-room-breakingcryptothesimpleway/) in the same module, and the next room in the path is Padding Oracles.

## Task 1: Introduction

Setup task. The room deploys a Flask application at `http://MACHINE_IP:5000` with three endpoints: `/encryption` for trying AES encryption with custom keys and modes, `/decryption` for the reverse, and `/oracle` where a server-side secret is appended to user input before encryption. The oracle endpoint is the attack surface for Task 5.

### Answers

- **I have deployed the attached machine and am ready to start.** No answer needed.

## Task 2: AES fundamentals

### Symmetric encryption and the Rijndael cipher

AES (Advanced Encryption Standard) was selected in a NIST competition that concluded in **1997** (the call for proposals). The winning algorithm was the **Rijndael Cipher**, designed by Vincent Rijmen and Joan Daemen. AES is a **Symmetric** encryption algorithm: the same key encrypts and decrypts.

AES operates on fixed-size blocks of 16 bytes (128 bits). It supports key lengths of 128, 192, or 256 bits, and applies multiple rounds of substitution and permutation to achieve two properties: confusion (each ciphertext bit depends on many key bits) and diffusion (changing one plaintext bit flips roughly half the ciphertext bits).

### Answers

- **In what year did NIST hold a competition to find a new encryption algorithm to replace existing encryption algorithms?** **1997**
- **What was the name of the winning algorithm?** **Rijndael Cipher**
- **AES is what type of encryption algorithm?** **Symmetric**

## Task 3: Block mechanics and padding

### How ECB processes blocks

AES is a block cipher: it encrypts exactly 16 bytes at a time. When the plaintext is not a multiple of 16, the last block needs **Padding** to fill out the remaining bytes. This room uses a custom `*` padding character instead of standard PKCS7.

ECB (Electronic Codebook) mode encrypts each block independently with the same key. There is no chaining, no IV, no feedback. The final ciphertext is the concatenation of all encrypted blocks.

The task walks through encrypting `CryptographyAndAESIsALotOfFun!!!` (32 bytes, two full blocks) with key `secretpassword!!`. Each block is encrypted separately and the outputs are concatenated.

### Computing the ciphertext

The second question asks for the AES-ECB ciphertext of `CryptographyAndADreamToSecurity` with key `NotAGreatSecret!`. Using the room's `/encryption` endpoint:

```
  POST /encryption
  plaintext=CryptographyAndADreamToSecurity
  key=NotAGreatSecret!
  mode=ECB

  Result: c35a97106295a3101b6be8a9af954d198462b30f0af7f669d46766cbeea7eabf
```

Both plaintext and key are exactly 16-byte multiples, so no padding is needed and the output is 64 hex characters (32 bytes, two blocks).

{{< ad >}}

### Answers

- **What is used when the last AES block of the original message isn't completely filled?** **Padding**
- **What is the ciphertext when encrypting CryptographyAndADreamToSecurity using the secret NotAGreatSecret!?** **c35a97106295a3101b6be8a9af954d198462b30f0af7f669d46766cbeea7eabf**

## Task 4: ECB pattern leakage

### The ECB Penguin

ECB's fatal property is that identical plaintext blocks encrypted with the same key always produce identical ciphertext blocks. For structured data like images, this preserves patterns in the plaintext. The classic demonstration encrypts a BMP image with AES-128-ECB using openssl: the encrypted image is unreadable as data, but the original shapes are still clearly visible because regions of the same color produce the same ciphertext blocks.

The cipher principle that ECB fails to provide is **Diffusion**: changing one plaintext bit should affect many ciphertext bits across the entire output, but in ECB each block is independent, so a change in one block affects only that block's ciphertext. This makes ECB particularly unsuitable for encrypting **Images** and any data with repeating patterns.

### Answers

- **What cipher principle does ECB not perform sufficiently, leading to it being vulnerable?** **Diffusion**
- **What types of files are notoriously difficult for ECB to encrypt?** **Images**

## Task 5: Chosen-plaintext oracle attack

### Theory

An ECB oracle accepts user input, prepends a prefix (or appends a suffix), encrypts the combined string with AES-ECB, and returns the ciphertext. Because ECB encrypts each block independently, an attacker who controls part of the input can:

1. **Determine the block size.** Send increasing input until the ciphertext length jumps. The jump size is the block size.
2. **Determine the offset.** The prefix bytes push the attacker's input partway into a block. Send increasing identical characters until two adjacent ciphertext blocks become equal; the count of extra characters needed is the offset.
3. **Recover the secret byte by byte.** Pad the input so the last unknown byte of the secret falls at the end of a block the attacker controls. Record that block's ciphertext as a reference. Then try every printable character in that position and compare; a match reveals the byte.

### Performing the attack

The oracle at `http://MACHINE_IP:5000/oracle` accepts a `username` POST field and returns `AES-ECB(prefix + username + secret)`.

**Block size determination:** sending inputs of increasing length, the ciphertext length jumps by 32 hex characters (16 bytes) at certain thresholds. The **block size** is **16 bytes**.

**Offset determination:** sending increasing `A` characters until two consecutive ciphertext blocks match, the first duplication occurs after prepending 5 extra characters. The **offset** is **5 bytes**.

**Byte-by-byte recovery:** with block size 16 and offset 5, the padding length for the first unknown byte is `16 - 1 - 5 = 10`. Sending 10 `A` characters pushes the first secret byte to position 16 (the last byte of block 1). Recording block 1's ciphertext as the reference, then brute-forcing `AAAAAAAAAA` + candidate character until block 1 matches, reveals the first byte: **O**.

Repeating this for each subsequent byte, reducing the padding by one each iteration and appending the known prefix:

```python
  import urllib.request, urllib.parse, string

  TARGET = "http://MACHINE_IP:5000/oracle"
  BLOCK_SIZE = 16
  OFFSET = 5

  def query_oracle(username):
      data = urllib.parse.urlencode({"username": username}).encode()
      req = urllib.request.Request(TARGET, data=data)
      resp = urllib.request.urlopen(req).read().decode()
      start = resp.find("<strong>") + len("<strong>")
      end = resp.find("</strong>", start)
      return resp[start:end]

  def get_block(ct_hex, block_num):
      start = block_num * BLOCK_SIZE * 2
      return ct_hex[start:start + BLOCK_SIZE * 2]

  pad_len = BLOCK_SIZE - 1 - OFFSET  #  10

  secret = ""
  for pos in range(12):
      needed = pad_len - pos
      if needed < 0:
          break
      ref_ct = query_oracle("A" * needed)
      ref_block = get_block(ref_ct, 0)
      for c in string.printable.strip():
          guess = "A" * needed + secret + c
          if get_block(query_oracle(guess), 0) == ref_block:
              secret += c
              break

  #  Recovered secret: OracleKnows
```

The full recovered secret is **OracleKnows**.

### Answers

- **What is the first thing we need to determine?** **Block size**
- **What is the second thing we need to determine?** **Offset**
- **What is the first byte of the secret data?** **O**
- **What is the full value of the secret data?** **OracleKnows**

## Task 6: Cipher mode best practices

The room concludes with mitigation guidance. Pentesters should flag any use of AES-ECB in production. Developers should use authenticated encryption modes like AES-GCM or AES-CCM, which provide both confidentiality and integrity. CBC is better than ECB (it chains blocks through an IV), but without a MAC it remains vulnerable to padding oracle and bit-flipping attacks, as covered in the sibling rooms.

### Answers

- **I understand how to attack ECB oracles!** No answer needed.

## Takeaways

**The ECB oracle attack works because each ciphertext block is a deterministic function of exactly 16 plaintext bytes and nothing else.** There is no IV, no chaining, no randomness between blocks. This means an attacker who can choose part of the input and observe the output can treat each block as an independent lookup: fix 15 bytes, vary the 16th, and whichever candidate produces a matching block is the secret byte. The entire attack reduces to `block_size * 256` oracle queries per unknown byte in the worst case, which is trivially fast. Any mode that makes block ciphertexts depend on position (CBC, CTR, GCM) breaks this attack by ensuring identical plaintext blocks produce different ciphertext blocks.

**Offset determination is the step that makes the attack work against real systems, not just textbook ones.** In practice, the oracle prepends session data, a user ID, or a fixed prefix before the attacker's input, so the input does not align neatly at a block boundary. Without knowing the offset, the attacker cannot control which byte falls at the end of a target block, and the brute-force comparisons fail. The technique of adding filler bytes until two adjacent ciphertext blocks collide measures the offset exactly, and from that point the attack proceeds identically to the aligned case. This is why "just add a prefix" is not a defense against ECB oracles.

Room solved 100%: 6 tasks, 13 answers.
