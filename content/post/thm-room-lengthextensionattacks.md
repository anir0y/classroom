---
title: "TryHackMe Length Extension Attacks: SHA-256 forging and escalation"
date: 2026-10-25T12:08:00+05:30
lastmod: 2026-10-25T12:08:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-lengthext/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SHA-256
  - length extension
  - HMAC
  - cookie tampering
  - Cryptographic Failures
  - Web Application Red Teaming

draft: false
description: "TryHackMe Length Extension Attacks walkthrough: SHA-256 internal state recovery, forged file signatures, cookie role escalation, and HMAC as the fix."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Length Extension Attacks |![Length Extension Attacks room icon](https://cdn-images.tryhackme.com/room-icons/645b19f5d5848d004ab9c9e2-1730384887772)|

This medium-difficulty room in the Cryptographic Failures module of the Web Application Red Teaming path teaches SHA-256 length extension attacks through two practical labs. Task 5 forges a file signature to access a hidden product image, and Task 6 extends an authentication cookie to escalate from user to admin. The theory tasks cover Merkle-Damgard internals, padding rules, and why HMAC defeats the attack. This room sits alongside [Breaking Crypto the Simple Way](/post/thm-room-breakingcryptothesimpleway/) in the same module.

## Task 1: Introduction

Setup task. The room deploys a single VM running a PHP application at `lea.thm`. Two labs are hosted on the same box: `/labs/lab1` (file signature verification) and `/labs/lab2` (signed cookie authentication). Since the Mac's THM VPN routes to the lab IP directly, all exercises run from the local terminal with a `Host: lea.thm` header.

### Answers

- **I have deployed the lab machine and I'm ready to learn!** No answer needed.

## Task 2: Hash Function Properties

The task introduces three properties that make hash functions useful in cryptography: pre-image resistance (given a hash output, it is computationally infeasible to find the input), second pre-image resistance (given an input, it is infeasible to find a different input with the same hash), and collision resistance (it is infeasible to find any two distinct inputs that produce the same hash). These properties matter for length extension attacks because the attack does not break pre-image or collision resistance. Instead, it exploits a structural weakness in how Merkle-Damgard hash functions finalize their output.

### Answers

- **Which property ensures you cannot determine an original input from its hash?** **Pre-image Resistance**
- **Which property ensures that no two different inputs produce the same hash?** **Collision Resistance**

## Task 3: Understanding SHA-256

SHA-256 processes data in 512-bit (64-byte) blocks. Before hashing, the input is padded: a `0x80` byte, then enough zero bytes to reach 56 mod 64, then an 8-byte big-endian length field. This padding ensures the data aligns to the block size. The compression function maintains an internal state of 8 32-bit words (A through H), initialized to fixed constants. Each 512-bit block runs through 64 rounds of mixing with schedule-expanded message words and round constants. The final hash is the concatenation of those 8 state words after all blocks are processed.

The critical detail for the attack: the published hash is the raw internal state after the last block. If you know the hash, you know the state. If you know the state, you can resume hashing.

{{< ad >}}

### Answers

- **What block size does SHA-256 use?** **512**
- **What function ensures data is aligned to fit block size requirements?** **Padding**
- **How many words does SHA-256's internal state have?** **8**

## Task 4: Understanding Length Extension Attacks

A length extension attack exploits Merkle-Damgard hash functions (MD5, SHA-1, SHA-256) by recovering the internal state from the published hash and then continuing the hash computation with attacker-controlled data. The attacker does not need the secret key. They need only the hash output, the length of the original message (including the secret), and the data they want to append.

The attack works because the hash output is the unmasked final state. The attacker reconstructs the padding that would follow the original message, appends their payload, and computes the hash of the extended message by resuming compression from the known state. The server, which prepends the same secret, will hash the identical byte stream and accept the forged signature.

### Answers

- **What hashing method prevents length extension attacks by using a secret key?** **HMAC**

## Task 5: Practical: Attacking Signatures

### Forging a file path to access a hidden image

Lab 1 at `/labs/lab1` is a product catalog that serves images verified by SHA-256 signatures. The URL format is `product.php?file=1.png&signature=<hash>`. The server computes `SHA-256(SECRET + filename)` and compares it against the `signature` parameter. Only files that pass signature verification are served.

The product page for `1.png` reveals the known hash:

```
  signature: 02d101c0ac898f9e69b7d6ec1f84a7f0d784e59bbbe057acb4cef2cf93621ba9
```

The objective is to append `/../4.png` to `1.png` so the server resolves a path traversal to the hidden image. Since the signing scheme is `SHA-256(secret || filename)` with no HMAC, length extension applies directly.

The attack script implements SHA-256 compression from scratch (no `hash_extender` binary needed) and iterates secret lengths from 1 to 19. At secret length 8, the server accepts the forged signature:

```python
  # Pure Python SHA-256 length extension
  known_hash = '02d101c0ac898f9e69b7d6ec1f84a7f0...'
  original_data = b'1.png'
  append_data = b'/../4.png'

  for secret_len in range(1, 20):
      new_hash, forged_data = sha256_extend(known_hash, original_data, secret_len, append_data)
      file_param = urllib.parse.quote(forged_data, safe='')
      url = f'http://{target}/labs/lab1/product.php?file={file_param}&signature={new_hash}'
      # secret_len=8: HTTP 200, page shows the hidden product
```

The hidden image `4.png` is a Christmas hat with the flag overlaid on it.

### Answers

- **What is the flag in the image?** **THM{L3n6th_3Xt33ns10nssss}**

## Task 6: Practical: Modifying a Signed Cookie

### Escalating from user to admin via cookie extension

Lab 2 at `/labs/lab2` is a login page. After authenticating with `user:user`, the server sets two cookies: `auth=username=user;role=0` and `hsh=SHA-256(SECRET + auth_value)`. The dashboard checks for `role=1` in the auth cookie and verifies it against the `hsh` cookie using the same `SHA-256(secret || data)` scheme.

The approach is identical to Task 5: recover the internal state from the known hash, compute the padding for `SECRET + "username=user;role=0"`, and append `;role=1`. The server uses `strpos($auth, 'role=1')` to check for admin access, so the original `role=0` does not matter as long as `role=1` appears anywhere in the string.

```python
  # After login, extract cookies
  auth = 'username=user;role=0'  # URL-decoded
  hsh = 'bfe0fa5c36531773c73dcc8d2a931301f69cf9add05a1f35dcfa2d48b44c37f0'

  # Extend with ;role=1
  new_hash, forged_auth = sha256_extend(hsh, auth.encode(), 8, b';role=1')

  # Send forged cookies to dashboard.php
  # Response: Welcome, Admin! Flag: THM{REDACTED}
```

The server accepted the forged hash because the extended auth string, including the padding bytes between the original value and the appended `;role=1`, still contains `role=1` when searched by `strpos`. The padding bytes (0x80 followed by null bytes and a length field) are non-printable but harmless to the substring search.

### Answers

- **What is the flag?** **THM{l3n6th_2_4dM1n}**

## Task 7: Mitigation Techniques

The room presents three mitigations. First, use HMAC instead of `hash(secret || data)`. HMAC nests two hash calls with inner and outer padding derived from the key, so the published output is not the raw compression state and cannot be extended. Second, retire MD5 and SHA-1 entirely in favor of SHA-3 or SHA-256 with HMAC. Third, use established protocols (OAuth, JWT with HMAC-SHA256) rather than rolling custom signature schemes.

### Answers

- **Click me to proceed to the next task.** No answer needed.

## Task 8: Conclusion

Summary task. The room covered how Merkle-Damgard hash functions leak their internal state through the output, enabling length extension attacks against naive `hash(secret || data)` constructions. Both labs demonstrated the same fundamental flaw: the server trusted that knowledge of the correct hash implied knowledge of the secret, when in fact the hash alone is enough to continue hashing.

### Answers

- **I can now do Length Extension Attacks!** No answer needed.

## Takeaways

**The output of a Merkle-Damgard hash function is the internal state, not a derived value, and that is the root cause of length extension.** SHA-256's 256-bit output is the literal concatenation of its eight 32-bit working variables after the final compression round. Any observer who sees the hash can set those variables, construct the correct padding for the original message length, and resume compressing new data. The server recomputing `SHA-256(secret || original || padding || attacker_data)` arrives at the same state by a different path and accepts the forged hash. HMAC defeats this by hashing the raw output a second time with a different key-derived pad, so the published digest is no longer a usable compression state.

**A signature scheme that checks `strpos($data, 'role=1')` after decrypting or verifying is doubly fragile, because the attacker controls both the hash and the content that gets searched.** Even if the original cookie said `role=0`, the extended cookie contains `role=0<padding bytes>;role=1`, and a substring search finds the attacker's value. The padding bytes between the original and appended data are non-printable nulls and a length field, but they do not contain the string `role=1`, so the only match is the attacker's payload. A proper design would parse the cookie into key-value pairs and reject duplicates, or better, use authenticated encryption (AES-GCM) so tampering is detected before the value is ever interpreted.

Room solved 100%: 8 tasks, 8 answers.
