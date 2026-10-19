---
title: "TryHackMe XSS: reflected, stored, and DOM-based scripting attacks"
date: 2026-10-19T20:40:00+05:30
lastmod: 2026-10-19T20:40:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-xss/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - cross-site scripting
  - XSS
  - reflected XSS
  - stored XSS
  - DOM-based XSS
  - web application pentesting
  - advanced client-side attacks
  - JavaScript
  - copyparty
  - CVE-2023-38501

draft: false
description: "TryHackMe XSS walkthrough: reflected injection via copyparty CRLF, stored XSS sanitization in JavaScript and ASP.NET, and DOM-based client-side exploitation."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|XSS |![XSS room icon](https://cdn-images.tryhackme.com/room-icons/5f04259cf9bf5b57aed2c476-1718366341885)|

This easy-difficulty room in the Web Application Pentesting path covers all three types of cross-site scripting: reflected, stored, and DOM-based. It sits in the Advanced Client-Side Attacks module alongside the [CSRF walkthrough](/post/thm-room-csrfv2/). The room walks through the root causes, the encoding and sanitization defences, and two real CVEs exploited against live lab applications. For a room that chains XSS with CSRF and SQL injection in a single attack path, see the [Whats Your Name walkthrough](/post/thm-room-whatsyourname/).

## Task 1: Introduction

Prerequisites check. The room assumes completion of the Intro to Cross-site Scripting room.

## Task 2: Terminology and Types

The three types of XSS differ in where the malicious script lives and how it reaches the victim's browser:

**Reflected XSS** executes within the browser session without being stored on the server. The payload travels in the URL or form submission, the server echoes it back in the response, and the browser executes it. The attack requires the victim to click a crafted link.

**Stored XSS** relies on saving the malicious script on the server (in a database, comment field, or profile). Every user who views the affected page executes the payload without needing to click anything.

**DOM-based XSS** manipulates the Document Object Model directly in the browser. The server never sees the payload because it lives entirely in the client-side JavaScript (for example, in the URL fragment after `#`).

### Answers

- **Which XSS vulnerability relies on saving the malicious script?** **Stored XSS**
- **Which prevalent XSS vulnerability executes within the browser session without being stored?** **Reflected XSS**
- **What does DOM stand for?** **Document Object Model**

## Task 3: Causes and Implications

XSS vulnerabilities share two root causes:

1. **Missing input validation and sanitization.** The application accepts user input containing active content (script tags, event handlers, JavaScript URIs) and passes it through without checking or stripping it.

2. **Missing output encoding.** Even validated input can become dangerous if the application renders it in an HTML context without encoding special characters. The `<` and `>` brackets, ampersands, and quotes must be converted to their HTML entity equivalents before they reach the page.

The combination matters: validation and sanitization guard the input path, while encoding guards the output path. Skipping either one leaves a gap.

### Answers

- **Based on the leading causes of XSS vulnerabilities, what operations should be performed on the input?** **validation and sanitization**
- **To prevent XSS vulnerabilities, what operations should be performed on the data before rendering?** **encoding**

## Task 4: Reflected XSS

Reflected XSS payloads travel in the HTTP request (typically a URL parameter) and are reflected back in the response. The dangerous characters that must be encoded depend on the rendering context:

In an **HTML context**, the ampersand (`&`) and angle brackets (`<`, `>`) are the critical characters. The ampersand starts HTML entity references, and angle brackets open and close tags. Without encoding these, an attacker can inject arbitrary HTML elements including script tags.

Two sanitization functions handle this in different languages:

- **JavaScript**: `sanitizeHtml()` strips or escapes HTML tags and attributes from user input before rendering
- **PHP**: `htmlspecialchars()` converts `<`, `>`, `&`, `"`, and `'` to their HTML entity equivalents

{{< ad >}}

### Answers

- **Which one of the following characters do you expect to be encoded? `.`, `,`, `;`, `&`** **&**
- **Which one of the following characters do you expect to be encoded? `+`, `-`, `*`, `<`** **<**
- **Which function can we use in JavaScript to replace unsafe special characters with HTML entities?** **sanitizeHtml()**
- **Which function did we use in PHP to replace HTML special characters?** **htmlspecialchars()**

## Task 5: Vulnerable Web Application 1

The lab deploys a copyparty file server on port 3923. This is CVE-2023-38501: a reflected XSS vulnerability caused by CRLF injection in the `Set-Cookie` response header. The application takes user input from the URL and injects it into the HTTP response headers without sanitizing carriage return and line feed characters.

The exploit URL is documented in the CVE advisory. Visiting the crafted URL triggers the vulnerability, and the server responds with injected content. The second line of the response page shows a "go to" link.

### Answers

- **What type of vulnerability is it?** **Reflected XSS**
- **Use the above exploit against the attached VM. What do you see on the second line?** **/?h#cc**

## Task 6: Stored XSS

Stored XSS is more dangerous than reflected XSS because the payload persists on the server. Every visitor to the affected page executes the script without needing to click a malicious link. Common injection points include comment fields, user profiles, forum posts, and any form data that gets stored and later displayed to other users.

The defences mirror the reflected case but must be applied on both the storage and rendering paths:

- **JavaScript (server-side or client-side)**: the `sanitizeHtml()` function strips dangerous tags and attributes before the content is stored or rendered. It works as an allowlist, keeping safe HTML elements and removing everything else.

- **ASP.NET / C#**: the `HttpUtility.HtmlEncode()` method converts all HTML-significant characters to their entity-encoded forms. This is output encoding rather than input sanitization: the original data is preserved in storage, and the encoding happens at render time.

### Answers

- **What is the name of the JavaScript function that sanitises and strips HTML?** **sanitizeHtml()**
- **What is the name of the ASP.NET C# method used to encode data to prevent stored XSS?** **HttpUtility.HtmlEncode()**

## Task 7: Vulnerable Web Application 2

The second lab application is a Hospital Management System running on port 80 (CVE-2021-38757). This is a stored XSS vulnerability in the HMS web application. The system stores unsanitized user input and renders it to other users, including administrators.

The default session cookie name for PHP applications is `PHPSESSID`. In a stored XSS attack against a PHP application, the injected script would typically steal this cookie via `document.cookie` and send it to an attacker-controlled server, enabling session hijacking.

### Answers

- **What type of vulnerability is it?** **Stored XSS**
- **What is the name of the default cookie that a PHP application uses to maintain sessions?** **PHPSESSID**

## Task 8: DOM-Based XSS

DOM-based XSS is fundamentally different from reflected and stored XSS because the payload never reaches the server. The malicious script executes entirely within the browser by manipulating the Document Object Model through client-side JavaScript.

A common pattern: the page reads a value from the URL fragment (`window.location.hash`) or a query parameter, then writes it directly into the DOM using `innerHTML`, `document.write()`, or `eval()`. Since the URL fragment (everything after `#`) is never sent to the server, server-side logging and WAF rules see nothing.

This makes DOM-based XSS invisible to server-side defences, but it can still steal cookies, redirect users, and execute arbitrary JavaScript in the victim's browser context.

The client-side defence is `encodeURIComponent()`, which percent-encodes special characters before they are used in DOM operations. This prevents the browser from interpreting user-controlled URL components as executable code.

### Answers

- **Does the server see the malicious XSS data in a DOM-based attack?** **Nay**
- **Can DOM manipulation via JavaScript be dangerous even without server involvement?** **Yea**
- **Which JavaScript function encodes a URI component to prevent DOM-based XSS?** **encodeURIComponent()**

## Task 9: Context and Evasion

XSS payloads must fit the rendering context. A payload that works inside an HTML tag body will not work inside a JavaScript string or an HTML attribute without adaptation. Attackers use encoding tricks to bypass filters:

- HTML character references like `&#x09` represent characters by their Unicode code point. `&#x09` is the **Tab** character (U+0009). Filters that block literal whitespace or specific keywords can be bypassed by substituting these encoded forms, because the browser decodes them before processing the content.

- Other evasion techniques include case variation (`ScRiPt`), null bytes, alternative event handlers (`onerror`, `onload`, `onfocus`), and encoding chains (URL encoding inside HTML encoding inside JavaScript strings).

### Answers

- **What character does the HTML reference `&#x09` represent?** **Tab**

## Task 10: Conclusion

The room closes with a summary. Of the three types, DOM-based XSS is the hardest to detect because it operates entirely within the browser, invisible to server-side monitoring, WAFs, and access logs.

### Answers

- **Which type of XSS is hardest to detect because it operates entirely in the browser?** **DOM-based XSS**

## Takeaways

**The three types of XSS share a root cause but differ in where the payload lives and who delivers it.** Reflected XSS requires the victim to click a link. Stored XSS fires on every page view. DOM-based XSS never touches the server. But all three exploit the same fundamental failure: user-controlled data reaches an execution context (innerHTML, a script tag, an event handler) without sanitization or encoding. The defence stack must cover both paths: sanitize or validate input before storage, and encode output before rendering. Skipping either one leaves the other bypassable.

**Server-side defences are blind to DOM-based XSS, which makes client-side encoding non-optional.** A WAF, CSP header, or server-side `htmlspecialchars()` call cannot stop a payload that lives in the URL fragment and is processed entirely by client-side JavaScript. The CVE-2023-38501 copyparty exploit demonstrated how a reflected payload bypasses normal output encoding through CRLF header injection, while DOM-based attacks bypass server-side defences entirely by never sending the payload to the server. `encodeURIComponent()` on the client side is the last line of defence for any JavaScript that reads from `location`, `document.referrer`, or `postMessage` and writes to the DOM.

Room solved 100%: 10 tasks, 21 answers.
