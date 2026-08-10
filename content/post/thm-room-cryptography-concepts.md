---
title: "TryHackMe Cryptography Concepts: Symmetric, Asymmetric, and HTTPS"
date: 2026-08-10T01:20:00+05:30
lastmod: 2026-08-10T01:40:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-crypto/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Pre Security
  - Cryptography
  - Encryption
  - Fundamentals

draft: false
description: "Walkthrough of TryHackMe Cryptography Concepts: plaintext vs ciphertext, the Caesar cipher game, symmetric vs asymmetric encryption, and how HTTPS uses both."
---

## Cryptography Concepts

The CIA Triad room told you what security protects; this one starts on how. Data does not travel straight from you to a recipient. It hops through routers and machines you do not control, any of which could read, change, or block it. Cryptography is the maths that makes that data useless to everyone except the person holding the right key. This is an Easy Pre Security room in the Attacks and Defenses module, and it keeps the maths at zero: everything is taught with lockboxes, mailboxes, a Caesar cipher, and one interactive game.

![The Cryptography Concepts room on TryHackMe marked Room completed 100 percent, all four tasks green](/img/thm-crypto/01-room.png)

## Task 2: symmetric encryption

Four terms carry the whole room. **Plaintext** is the readable message (`HELLO`). **Ciphertext** is the scrambled version (`KHOOR`). The **key** is the secret ingredient that controls the scrambling, and the **algorithm** is the public recipe for applying the key. The single most important idea sits in that last pair: the algorithm is public, and security comes only from keeping the key secret. Nobody hides how a padlock works to make it secure; you just keep your key private.

Symmetric encryption is the case where the same key both locks and unlocks. Alice puts her letter in a lockbox, locks it with her key, and mails it; Bob opens it with an identical key. The room uses the Caesar cipher, which shifts each letter by a fixed number (the key), as a toy example. It is famously weak (only 25 keys to try), but perfect for seeing how a key and an algorithm combine. The two written puzzles fall straight out of the shift rule:

![Terminal card working the two Caesar puzzles by hand: CYBER with key 5 becomes HDGJW, and FVZCYR PNRFNE PVCURE decodes with ROT13 to SIMPLE CAESAR CIPHER, plus the game flag](/img/thm-crypto/03-caesar.png)

- Encoding **`CYBER`** with a key of 5 shifts each letter forward five places: C to H, Y to D, B to G, E to J, R to W, giving **`HDGJW`**.
- Decoding **`FVZCYR PNRFNE PVCURE`** is a matter of finding the key. It turns out to be 13 (the shift where the cipher becomes its own inverse, ROT13), and it decodes to **`SIMPLE CAESAR CIPHER`**.

The task also ships a browser game, "Secret Message Rescue," where you slide a shift wheel to decrypt intercepted warnings and encrypt replies across several levels.

![The Caesar Cipher game: a shift wheel, a shift-key slider, and encrypt/decrypt boxes, warning that the Caesar cipher is for educational purposes only](/img/thm-crypto/02-game.png)

Finishing all the levels hands you the flag **`THM{CAESAR_CIPHER_MASTER_2026}`**. The task closes on the one real weakness of symmetric encryption: if the same key locks and unlocks, how do Alice and Bob agree on that key without an eavesdropper grabbing it in transit? Encrypting the key just needs another key, forever. That is the **key distribution problem**.

{{< ad >}}

## Task 3: asymmetric encryption

Asymmetric encryption solves it with two mathematically linked keys instead of one: a **public key** anyone can have, and a **private key** only its owner keeps. Anything encrypted with the public key can be decrypted only by the matching private key. The room's mailbox analogy nails it: the mail slot is the public key (anyone can post a letter through it), and the locked door is the private key (only the owner can take letters out). Bob publishes his public key to the world; Alice encrypts with it; only Bob's private key opens the result. No secret ever had to travel over the network, which is exactly the problem symmetric encryption could not solve on its own.

![Terminal card comparing symmetric and asymmetric encryption across keys, sharing, speed, use, and analogy, noting HTTPS uses both](/img/thm-crypto/04-symasym.png)

Real systems use both, because asymmetric is secure for key exchange but slow, while symmetric is fast but needs a shared key. That is precisely what happens behind the browser padlock: when you load an HTTPS site, your browser and the server use **asymmetric** encryption to agree on a shared secret, then switch to fast **symmetric** encryption for the rest of the session. A certificate, signed by a Certificate Authority your browser already trusts, is what proves the public key really belongs to that domain and not an impostor. The four Task 3 answers follow directly:

- The key that stays secret is the **private key**.
- Alice encrypting with Bob's public key so only his private key can decrypt is correct, so **Yay**.
- The problem asymmetric solves that symmetric cannot is **key distribution**.
- After the asymmetric handshake, HTTPS switches to **symmetric** encryption for the bulk data.

## A security-mindset aside

There is a neat irony worth pointing out, and it is the same lesson the room teaches about keys. The Caesar game claims to reveal the flag only after you clear every level, but that logic runs entirely in your browser. The game is a static app, and its flag was assembled from three Base64 chunks sitting in the JavaScript bundle (`VEhNe0NBRVNBUl9D` + ... decodes straight to the flag). This is the room's own core principle turned back on it: security comes from keeping the key secret, not from hiding things in code you hand to the client. Obscuring a value in client-side JavaScript is not encryption, because the client has everything it needs to reveal it. Playing the game is the fun way; noticing that the "reveal on success" gate is not a security control is the security-mindset way.

## Room summary

| | |
|---|---|
| Room | Cryptography Concepts (Pre Security path, Attacks and Defenses) |
| Category | Fundamentals, Easy |
| Task 2 | flag `THM{CAESAR_CIPHER_MASTER_2026}`; `CYBER` + key 5 = `HDGJW`; decode = `SIMPLE CAESAR CIPHER` |
| Task 3 | secret key = `private key`; `Yay`; solves `key distribution`; bulk data = `symmetric` |
| Core idea | algorithm is public, security lives in the secret key; HTTPS pairs asymmetric key exchange with symmetric data encryption |

## Wrap-up

Cryptography is the layer that actually delivers confidentiality and integrity, the two CIA pillars this module cares about, and the mental model is simpler than the maths suggests. Symmetric encryption is one shared key, fast but hard to distribute. Asymmetric encryption is a public/private pair that fixes distribution but is slow. Every secure system you use, HTTPS, VPNs, encrypted messengers, stitches the two together: asymmetric to agree on a key, symmetric to move the data. Hold onto that one sentence and the padlock in your address bar stops being magic and starts being a process you can explain.
