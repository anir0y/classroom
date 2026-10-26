---
title: "TryHackMe Padding Oracles: AES-CBC byte-by-byte decryption"
date: 2026-10-26T21:12:00+05:30
lastmod: 2026-10-26T21:12:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-paddingoracles/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - AES
  - CBC
  - padding oracle
  - PKCS7
  - cryptographic failures
  - Web Application Red Teaming
  - Cryptographic Failures

draft: false
description: "TryHackMe Padding Oracles walkthrough: PKCS7 padding, AES-CBC encryption and decryption, padding oracle attack theory, and PadBuster automation."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Padding Oracles |![Padding Oracles room icon](https://cdn-images.tryhackme.com/room-icons/62a7685ca6e7ce005d3f3afe-1734329183684)|

This medium-difficulty room in the Cryptographic Failures module of the Web Application Red Teaming path teaches how AES-CBC padding oracles work and how to exploit them. Tasks 2 and 3 cover PKCS7 padding mechanics and CBC mode's XOR chaining. Task 4 walks through CBC decryption with the formula Pi = Dk(Ci) XOR Ci-1. Task 5 explains the padding oracle attack: modifying the IV byte by byte until the server reports valid padding, then recovering the intermediate decryption value and XORing it with a known IV to extract plaintext. Task 6 automates the attack with PadBuster. This room follows [Attacking ECB Oracles](/post/thm-room-attackingecboracles/) in the same module, and its predecessor [Breaking Crypto the Simple Way](/post/thm-room-breakingcryptothesimpleway/) introduced AES-CBC bit-flipping.

## Task 1: Introduction

Setup task. The room deploys a Flask application at `http://MACHINE_IP:5000` with encryption and decryption endpoints. Port 5001 hosts a visual padding oracle simulation, and port 5002 provides the automation exercise endpoint where PadBuster can be pointed. The application uses a default IV of `b'1111111111111111'` (16 bytes of ASCII `1`, hex 0x31) across all three services.

### Answers

- **I have successfully started the machine.** No answer needed.

## Task 2: PKCS7 padding

### How padding fills a block

AES operates on fixed 16-byte blocks. When the plaintext length is not a multiple of 16, PKCS7 padding adds N bytes each with the value N, where N is the number of bytes needed to fill the last block. If the plaintext already fills the block exactly, a full 16-byte padding block of `\x10` values is appended so the decryptor can always strip the last byte's value worth of bytes.

The task asks about the term "HelloWorld" (10 bytes). A 16-byte block needs 6 more bytes, so PKCS7 appends six `\x06` bytes. The padded block becomes `HelloWorld\x06\x06\x06\x06\x06\x06`.

### Answers

- **In cryptography, extra bytes are added to fill the remaining space in the last block during encryption, or decryption is called?** **Padding**
- **What is the byte value padded after padding the term HelloWorld?** **06**

## Task 3: CBC mode encryption

### Cipher Block Chaining

CBC mode XORs each plaintext block with the previous ciphertext block before encrypting it. The first block uses an Initialization Vector (IV) in place of a "previous" ciphertext block. This chaining means identical plaintext blocks produce different ciphertext blocks (unlike ECB), because each block's encryption depends on all prior blocks.

The exercise encrypts the word "Hacker" (6 bytes) with key `MyActualSecrets1` and the default IV (all `1`s). PKCS7 pads "Hacker" to 16 bytes by appending ten `\x0a` bytes. Encrypting with the Flask app at `/encryption`:

```python
  from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
  from cryptography.hazmat.backends import default_backend

  plaintext = b'Hacker'
  key = b'MyActualSecrets1'
  iv = b'1111111111111111'
  pad_len = 16 - len(plaintext)  #  10
  padded = plaintext + bytes([pad_len] * pad_len)

  cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
  ct = cipher.encryptor().update(padded) + cipher.encryptor().finalize()
  #  Ciphertext hex: d277566022248ad919930065c6269f54
  #  Last byte: 54
```

{{< ad >}}

### Answers

- **The encryption mode in which each plaintext block is XORed with the previous ciphertext block before being encrypted is called?** **Cipher Block Chaining**
- **What is the last byte after encrypting the word Hacker using the secret MyActualSecrets1?** **54**

## Task 4: CBC mode decryption

### Reversing the chain

CBC decryption inverts the process. Each ciphertext block is decrypted with the key to produce an intermediate value, then XORed with the previous ciphertext block (or the IV for the first block) to recover the plaintext:

**Pi = Dk(Ci) XOR Ci-1**

This formula is the foundation of the padding oracle attack. An attacker who can control Ci-1 (or the IV) and observe whether the resulting padding is valid can recover Dk(Ci), the intermediate decryption value, and from there the plaintext.

The exercise provides the ciphertext `b1e090de4abbc8b54769ba79a98a4cffaf59a89e58bcc474794d1e8b7e5315b2` and key `abcdefghijklmnop`. The default IV is `b'1111111111111111'`. Decrypting:

```python
  from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
  from binascii import unhexlify

  ct_hex = 'b1e090de4abbc8b54769ba79a98a4cffaf59a89e58bcc474794d1e8b7e5315b2'
  key = b'abcdefghijklmnop'
  iv = b'1111111111111111'

  cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
  pt = cipher.decryptor().update(unhexlify(ct_hex)) + cipher.decryptor().finalize()
  pad_len = pt[-1]
  #  pt[:-pad_len] = b'THM{Encryption_007}'
```

The IV size must match the AES block size: **16 bytes**.

### Answers

- **What is the plaintext after decrypting b1e090de4abbc8b54769ba79a98a4cff... using the secret key abcdefghijklmnop?** **THM{Encryption_007}**
- **What should the IV size be in bytes if you try decrypting a string using AES (16-byte block size)?** **16**

## Task 5: The padding oracle attack

### Exploiting error messages

A padding oracle is any system that tells the attacker whether a decrypted ciphertext has valid PKCS7 padding. The classic signal is a different HTTP status code or error message for "invalid padding" versus "valid padding but wrong data." The attacker modifies the IV (or the previous ciphertext block) byte by byte until the oracle reports valid padding, which leaks the intermediate decryption value for that byte position.

The attack on the last byte works as follows. The attacker wants the decrypted last byte to be `\x01` (valid single-byte PKCS7 padding). They try all 256 values for the last byte of the modified IV. When the oracle returns "valid padding," the intermediate value for that byte is `modified_IV_byte XOR 0x01`. Knowing the intermediate value, the attacker recovers the plaintext byte: `intermediate XOR original_IV_byte`.

For subsequent bytes, the attacker sets the already-known bytes to produce `\x02\x02`, then `\x03\x03\x03`, and so on, solving one byte per position until the entire block is recovered.

The simulation at port 5001 demonstrates this visually. Triggering the SSE endpoint `/start_attack` runs the brute-force process and streams each byte recovery in real time, ultimately revealing the flag.

### Answers

- **What is the flag value after decrypting the ciphertext?** **THM-{brUt3-f0rC3}**
- **While performing a padding oracle attack, what is the expected value for the last plaintext byte if you only modify the 16th byte of the modified IV?** **01**
- **The foundation of the padding oracle lies in the formula Pi = Dk(Ci) {OPERATOR} Ci-1. What is the missing operator?** **XOR**

## Task 6: PadBuster automation

### Automating the oracle

PadBuster automates the byte-by-byte attack. It takes a URL with the oracle endpoint, the ciphertext, and the block size, then iterates through each byte position, sending modified ciphertexts and checking the server's response to determine valid versus invalid padding.

The automation endpoint at port 5002 responds with HTTP 200 for valid padding and HTTP **400** for invalid padding. The JSON body includes `{"error": "Invalid padding", "status_code": 400}`.

The exercise provides the ciphertext `31323334353637383930313233343536bdcc4a2319946dc9b30203d89dba9fce` with a 16-byte block size. The first 16 bytes (`31323334...3536`) are the IV (ASCII "1234567890123456"), and the second 16 bytes are the encrypted block. Running PadBuster or querying the oracle with valid padding reveals the decrypted ASCII value: **Got_The_Flag007**.

### Answers

- **What is the status code shown on the page when an "Invalid padding" error occurs?** **400**
- **What is the decrypted value (ASCII) for the ciphertext 313233...9fce with a block size of 16?** **Got_The_Flag007**

## Task 7: Best practices

Displaying padding errors on a production server is a direct information leak that enables the padding oracle attack. The fix is to return a generic error for all decryption failures, whether the padding is invalid, the data is corrupt, or the MAC check fails. Authenticated encryption modes like AES-GCM handle this automatically: a single "authentication failed" error replaces the padding/data distinction entirely.

### Answers

- **Is it a good practice to display padding errors on the production server (yea/nay)?** **nay**

## Task 8: Conclusion

The room closes with guidance on migrating away from bare AES-CBC. Use AES-GCM or AES-CCM for new implementations, and if CBC is required for compatibility, always pair it with HMAC in encrypt-then-MAC order and verify the MAC before attempting decryption.

### Answers

- **I have successfully completed the room.** No answer needed.

## Takeaways

**The padding oracle attack works because PKCS7 padding is self-describing, and the server's error message confirms or denies whether the padding is correct.** Each byte of the intermediate decryption value is recovered independently: set the target position's expected padding to `\x01`, try all 256 IV byte values, and the one that produces valid padding directly yields the intermediate byte. From there, XORing with the original IV gives the plaintext byte. The total queries per block are at most 256 * block_size = 4096, which is trivially fast. Any system that distinguishes "bad padding" from "bad data" is vulnerable, regardless of the key strength or cipher implementation quality.

**The fix is not to hide the error message; the fix is to remove the oracle entirely.** Returning a generic "decryption failed" message is a necessary first step, but timing side-channels can still leak padding validity if the server processes valid and invalid padding at different speeds. Authenticated encryption (AES-GCM, AES-CCM) solves both problems: the MAC check happens before decryption, so an attacker who tampers with the ciphertext never reaches the padding logic at all. This is why every modern TLS cipher suite uses AEAD, and why bare AES-CBC was removed from TLS 1.3.

Room solved 100%: 8 tasks, 14 answers.
