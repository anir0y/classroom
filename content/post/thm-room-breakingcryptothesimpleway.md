---
title: "TryHackMe Breaking Crypto the Simple Way: RSA to AES bit-flip"
date: 2026-10-24T17:03:00+05:30
lastmod: 2026-10-24T17:03:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-breakingcrypto/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - RSA
  - HMAC
  - AES-CBC
  - bit-flipping
  - cryptographic failures
  - Web Application Red Teaming
  - Cryptographic Failures

draft: false
description: "TryHackMe Breaking Crypto the Simple Way walkthrough: RSA weak key factoring, HMAC dictionary attack, AES-CBC brute force, and bit-flip role escalation."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Breaking Crypto the Simple Way |![Breaking Crypto the Simple Way room icon](https://cdn-images.tryhackme.com/room-icons/645b19f5d5848d004ab9c9e2-1739180133439)|

This easy-difficulty room in the Web Application Red Teaming path teaches four classes of cryptographic failure through hands-on labs running on a single PHP application. Task 2 factors a weak RSA modulus to decrypt ciphertext. Task 3 cracks an HMAC-SHA1 secret key with a dictionary attack. Task 4 exploits a hardcoded AES key exposed in client-side JavaScript. Task 5 performs a bit-flipping attack on an AES-CBC encrypted cookie to escalate from user to admin. Each task pairs the theory with a live exercise on `bcts.thm`. This room sits in the Cryptographic Failures module alongside [Length Extension Attacks](/post/thm-room-lengthextensionattacks/) in the same path.

## Task 1: Introduction

Setup task. The room deploys a single VM running a PHP application at `bcts.thm` on the lab IP. The application exposes four labs (`/labs/lab1` through `/labs/lab4`), one per cryptographic vulnerability class. Since the Mac's THM VPN routes to the lab IP directly, all exercises run from the local terminal with a `Host: bcts.thm` header on each request (no `/etc/hosts` edit needed).

### Answers

- **I have started the lab machine and I'm ready to break crypto!** No answer needed.

## Task 2: Brute-forcing Keys

### RSA with a weak modulus

RSA security depends on the difficulty of factoring `n = p * q` when both primes are large. When the primes are small or reused, `n` factors trivially with online databases like factordb.com or with `sympy.factorint()`.

The exercise provides:

```
  Public Key: n = 43941819371451617899582143885...255747
  Exponent: e = 65537
  Ciphertext: c = 90024311563111360251224219512...862766
```

Factoring `n` with factordb returns two primes `p` and `q`. From there, compute Euler's totient `phi(n) = (p-1)(q-1)`, derive the private exponent `d = inverse(e, phi_n)`, and decrypt: `plaintext = pow(c, d, n)`. Converting the integer back to bytes with `long_to_bytes` yields the flag.

```python
  from sympy import factorint
  from Crypto.Util.number import inverse, long_to_bytes

  n = 43941819371451617899582143885...255747
  e = 65537
  c = 90024311563111360251224219512...862766

  factors = factorint(n)
  p, q = factors.keys()
  phi_n = (p - 1) * (q - 1)
  d = inverse(e, phi_n)
  plaintext = pow(c, d, n)
  flag = long_to_bytes(plaintext)
  # THM{REDACTED}
```

The factoring step is the bottleneck. On a weak key like this one, sympy's `factorint` returns in under a minute because the primes are small enough to appear in existing factor databases.

{{< ad >}}

### Answers

- **What is the flag?** **THM{Psssss_4nd_Qsssssss}**

## Task 3: Breaking Hashes

### HMAC-SHA1 dictionary attack

HMAC combines a hash function with a secret key to produce a message authentication code. When the key is a weak dictionary word, an attacker who has a known message and its HMAC can brute-force the key by computing `HMAC(candidate_key, message)` for each word in a wordlist until the output matches.

The exercise provides an HMAC-SHA1 hash, a known message (`CanYouGuessMySecret`), and asks for the secret key. Hashcat mode 150 (`HMAC-SHA1 (key = $pass)`) cracks it against `rockyou.txt` in under a second:

```
  hashcat -m 150 '1484c3a5d65a55d70984b4d10b1884bda8876c1d:CanYouGuessMySecret' \
    /usr/share/wordlists/rockyou.txt

  1484c3a5d65a55d70984b4d10b1884bda8876c1d:CanYouGuessMySecret:REDACTED
  Status: Cracked
```

The key is a common dictionary word, which is exactly why HMAC keys must have sufficient entropy: a 256-bit random key makes brute-force infeasible, but an 8-character English word falls in 0.01% of the keyspace search.

### Answers

- **What is the secret used to encrypt the message?** **sunshine**

## Task 4: Exposed Keys

### AES-CBC with a hardcoded client-side key

The lab at `/labs/lab3` presents a "Guess the message!" form. Opening the browser's developer tools reveals the JavaScript source, which encrypts the user's input with AES-CBC before sending it to the server:

```javascript
  var encryptionKey = "1234567890123456";
  // ... AES-CBC encrypt with a random IV, POST as JSON {data: ciphertext, iv: iv}
```

The encryption key is hardcoded in the client-side JavaScript. The server has a wordlist of valid messages and checks whether the decrypted submission matches any of them. The attack is straightforward: download the wordlist from `/labs/lab3/wordlist.txt`, encrypt each word with the known key and a random IV, and POST each attempt until the server responds with "Access granted!"

```python
  import json, base64, os, urllib.request
  from Crypto.Cipher import AES
  from Crypto.Util.Padding import pad

  url = "http://10.49.190.219/labs/lab3/process.php"
  key = b"1234567890123456"

  def encrypt_message(message, iv):
      cipher = AES.new(key, AES.MODE_CBC, iv)
      ct = cipher.encrypt(pad(message.encode(), AES.block_size))
      return base64.b64encode(ct).decode(), base64.b64encode(iv).decode()

  with open("wordlist.txt") as f:
      words = [w.strip() for w in f if w.strip()]

  for word in words:
      iv = os.urandom(16)
      ct_b64, iv_b64 = encrypt_message(word, iv)
      payload = json.dumps({"data": ct_b64, "iv": iv_b64}).encode()
      req = urllib.request.Request(url, data=payload,
          headers={"Content-Type": "application/json", "Host": "bcts.thm"})
      resp = urllib.request.urlopen(req).read().decode()
      if "Access granted" in resp or "THM{" in resp:
          print(f"[+] Found: {word}")
          print(f"Response: {resp}")
          break
```

The script found the correct message after iterating through the wordlist, and the server returned the flag in the response body.

A key point from the task description: the POST body must be JSON with fields `data` and `iv`, not form-urlencoded. The JavaScript source in the page reveals this format, and sending the wrong content type returns "Missing data or IV."

### Answers

- **What is the flag?** **THM{3nD_2_3nd_is_n0t_c0mpl1c4ted}**

## Task 5: Bit Flipping Attacks

### AES-CBC bit-flip on the role cookie

AES-CBC encrypts data securely but does not authenticate it. Without a MAC, an attacker who can modify the ciphertext can make controlled changes to the decrypted plaintext. In CBC mode, each plaintext block is XORed with the previous ciphertext block before decryption. Flipping a bit in ciphertext block N corrupts the decrypted block N (producing garbage), but flips the corresponding bit in the decrypted block N+1.

The lab at `/labs/lab4` sets three cookies after login: `PHPSESSID`, `auth_token`, and `role`. The `role` cookie is an AES-CBC encrypted version of `{"role":"0"}`. The admin dashboard checks whether the decrypted role value is `"1"`.

The target byte is at offset 0 of the ciphertext. In CBC mode, byte 0 of the ciphertext (which is byte 0 of the IV) XORs with byte 0 of the decrypted first block. XORing byte 0 with `0x01` flips the ASCII value from `0` (0x30) to `1` (0x31) in the decrypted output.

```python
  from binascii import unhexlify, hexlify
  import urllib.request

  original_role = 'e038f40f726437b4...580d8cce'
  auth_token = 'e038f40f726437b4...f680bcf3'
  session = 'kbp5n7qaeh7lgq81g7659t7e7u'

  cipher_bytes = bytearray(unhexlify(original_role))
  cipher_bytes[0] ^= 0x01
  modified_token = hexlify(cipher_bytes).decode()

  req = urllib.request.Request(
      'http://10.49.190.219/labs/lab4/dashboard.php',
      headers={
          'Host': 'bcts.thm',
          'Cookie': f'PHPSESSID={session}; auth_token={auth_token}; role={modified_token}'
      })
  resp = urllib.request.urlopen(req).read().decode()
  # Welcome, Admin! Here is your flag: THM{REDACTED}
```

The single XOR at byte 0 changed the decrypted role from `"0"` to `"1"`, and the server treated the tampered cookie as an admin session. This works because AES-CBC provides confidentiality without integrity: the server decrypts the modified ciphertext and trusts the result without checking whether it was tampered with. AES-GCM or an HMAC over the ciphertext would have caught the modification.

### Answers

- **What is the flag?** **THM{flip_n_flip}**

## Task 6: Conclusion

The room closes by summarising the four vulnerability classes and the best practices that prevent them: strong random keys (not timestamps or dictionary words), server-side key storage (not client-side JavaScript), authenticated encryption modes like AES-GCM (not bare AES-CBC without a MAC), and large RSA key sizes with proper padding (OAEP, not raw textbook RSA).

### Answers

- **Click me to proceed to the next task.** No answer needed.

## Takeaways

**A hardcoded encryption key in client-side JavaScript is not encryption at all, because the adversary and the user share exactly the same key material.** The developer's intent in Task 4 was to protect the message in transit, but the key `1234567890123456` is embedded in the page source that every visitor downloads. The server cannot distinguish a legitimate client encrypting a user's guess from an attacker encrypting every word in a wordlist, because both use the same key, the same algorithm, and the same endpoint. The fix is not to hide the key better (obfuscation is not security); it is to move the encryption to the server side, or to use TLS for transport confidentiality and authenticate the user rather than the message.

**AES-CBC without a MAC is malleable, and malleability on a structured value like a role cookie is a privilege escalation.** The bit-flip in Task 5 required exactly one XOR operation on one byte of the IV to change the decrypted role from `"0"` to `"1"`. The server decrypted the tampered ciphertext, parsed the JSON, and promoted the session to admin. This is not a weakness in AES itself; AES-CBC provides confidentiality correctly. The weakness is using confidentiality alone where integrity is also required. Authenticated encryption modes (AES-GCM, AES-CCM, or AES-CBC plus HMAC-SHA256 in encrypt-then-MAC order) detect any modification to the ciphertext and reject it before decryption, closing the bit-flip vector entirely.

Room solved 100%: 6 tasks, 4 answers.
