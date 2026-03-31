---
title: "Burp Academy: Server-Side Vulnerabilities (Apprentice) - Complete Guide"
date: 2026-03-31T15:30:00+05:30
lastmod: 2026-03-31T15:30:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: img/burp-academy.png
  alt: "PortSwigger Web Security Academy"
featureimage: img/burp-academy.png
simg: img/burp-academy.png
categories:
  - Web Security
  - Burp Academy
tags:
  - portswigger
  - burp-academy
  - path-traversal
  - access-control
  - authentication
  - ssrf
  - file-upload
  - os-command-injection
  - sql-injection
  - web-security
  - apprentice
draft: false
toc: true
---

This post covers all 7 vulnerability classes and 12 labs from the **PortSwigger Web Security Academy's Server-Side Vulnerabilities (Apprentice)** learning path. This is the best starting point for anyone entering web application security or bug bounty hunting.

<!--more-->

---

## 1. Path Traversal (Directory Traversal)

### What Is It?

Path traversal allows an attacker to **read arbitrary files** on the server by manipulating file path parameters. When an application loads files using user-supplied input without proper validation, the `../` sequence can escape the intended directory.

### How It Works

An application might serve images like this:

```
GET /image?filename=photo.jpg
```

Internally, it constructs: `/var/www/images/photo.jpg`

By injecting traversal sequences:

```
GET /image?filename=../../../etc/passwd
```

The server resolves: `/var/www/images/../../../etc/passwd` which becomes `/etc/passwd`.

### Bypass Techniques

| Technique | Payload | When to Use |
|-----------|---------|-------------|
| Absolute path | `/etc/passwd` | When traversal sequences are stripped |
| Nested sequences | `....//....//etc/passwd` | When `../` is stripped non-recursively |
| URL encoding | `%2e%2e%2f` | When input is decoded after filtering |
| Double encoding | `%252e%252e%252f` | When server decodes twice |
| Base folder prefix | `/var/www/images/../../../etc/passwd` | When path must start with expected dir |
| Null byte | `../../../etc/passwd%00.png` | When extension is enforced |

### Lab: File Path Traversal, Simple Case

**Goal:** Retrieve `/etc/passwd` via the product image `filename` parameter.

**Solution:** Intercept the image request and change `filename` to `../../../etc/passwd`. The three `../` sequences traverse from `/var/www/images/` up to the filesystem root.

### Prevention

- Avoid passing user input to filesystem APIs
- Validate against a whitelist of permitted values
- Canonicalize the path and verify it starts with the expected base directory

---

## 2. Access Control Vulnerabilities

### What Is It?

Access control determines **who can do what**. It breaks down into:

- **Vertical access control** -- restricting functions by user role (e.g., only admins can delete users)
- **Horizontal access control** -- restricting data by ownership (e.g., users can only see their own records)
- **Context-dependent access control** -- enforcing correct sequence of operations

### Common Vulnerability Patterns

**Unprotected admin functionality:** Admin panels accessible via direct URL (`/admin`, `/admin-panel`) without authentication checks. Sometimes "hidden" behind robots.txt or JavaScript-disclosed URLs.

**Parameter-based access control:** Roles stored in cookies or query parameters (`?admin=true`, `Cookie: isAdmin=true`) that attackers can manipulate.

**IDOR (Insecure Direct Object References):** Predictable resource identifiers in URLs (`/user?id=123`) allowing horizontal access to other users' data.

**Horizontal to vertical escalation:** Accessing an admin's profile via IDOR to extract their password, then logging in as admin.

### Labs

1. **Unprotected admin functionality** -- Navigate directly to `/admin` to find an unprotected admin panel.
2. **Unprotected admin functionality with unpredictable URL** -- Check the page source/JavaScript for the admin panel URL.
3. **User role controlled by request parameter** -- Modify the `Admin` cookie value to `true`.
4. **User ID controlled by request parameter, with unpredictable user IDs** -- Find other user GUIDs in blog posts or responses, then swap the `id` parameter.
5. **User ID controlled by request parameter with password disclosure** -- Access another user's profile page to find their password in a pre-filled field.

### Prevention

- Deny access by default
- Use a single application-wide access control mechanism
- Audit and test access controls thoroughly
- Never rely on obfuscation alone

---

## 3. Authentication Vulnerabilities

### What Is It?

Authentication verifies identity. Vulnerabilities arise from:

- Weak brute-force protection
- Logic flaws in login flows
- Bypassable multi-factor authentication

### Three Authentication Factors

| Factor | Example |
|--------|---------|
| Knowledge | Passwords, security questions |
| Possession | Mobile phone, hardware token |
| Inherence | Fingerprint, behavioral biometrics |

### Attack Vectors

**Username enumeration:** Applications leak valid usernames through different error messages, response times, or HTTP status codes. For example:
- Invalid username: "Username does not exist"
- Valid username, wrong password: "Incorrect password"

**Brute-force attacks:** Systematically testing credentials. Effective when:
- No account lockout
- No rate limiting
- No CAPTCHA after failures

**2FA bypass:** If 2FA verification is on a separate page, simply navigating past it (changing the URL from `/login2` to `/my-account`) may skip the check entirely.

### Labs

1. **Username enumeration via different responses** -- Use Burp Intruder to test usernames from a wordlist; a different error message reveals valid usernames. Then brute-force the password.
2. **2FA simple bypass** -- Log in with valid credentials, then skip the 2FA verification page by navigating directly to the account page.

### Prevention

- Implement account lockout and rate limiting
- Use generic error messages ("Invalid username or password")
- Enforce strong 2FA that cannot be bypassed by skipping pages
- Monitor and alert on suspicious login patterns

---

## 4. Server-Side Request Forgery (SSRF)

### What Is It?

SSRF tricks the server into making HTTP requests to **attacker-chosen destinations**. The server's requests carry its own privileges and network access, bypassing firewalls and access controls.

### Attack Scenarios

**Against localhost:** Changing a stock-check URL from `http://stock-api.internal/check` to `http://localhost/admin` accesses the admin panel through the server's trusted loopback interface.

**Against backend systems:** Targeting internal IPs like `http://192.168.0.68:8080/admin` to reach internal services invisible from the internet.

### Bypass Techniques

| Defense | Bypass |
|---------|--------|
| Blacklist (127.0.0.1) | Use `2130706433`, `017700000001`, `127.1` |
| Blacklist (localhost) | Register a domain resolving to 127.0.0.1 |
| Whitelist | Embed credentials: `https://expected@evil`, use `#expected` fragment |
| Both | Chain with open redirect on allowed domain |

### Labs

1. **Basic SSRF against the local server** -- Change the stock check URL to `http://localhost/admin` and delete the target user.
2. **Basic SSRF against another back-end system** -- Scan the `192.168.0.X` range via the stock check feature to find an internal admin panel, then exploit it.

### Prevention

- Use allowlists for permitted URLs/domains
- Disable HTTP redirects
- Don't return raw responses to users
- Apply network-level segmentation

---

## 5. File Upload Vulnerabilities

### What Is It?

When a server accepts file uploads without proper validation, attackers can upload **executable server-side scripts** (web shells) to gain remote code execution.

### Web Shell Example

A simple PHP web shell:

```php
<?php echo system($_GET['cmd']); ?>
```

Upload this as `shell.php`, then visit `https://target.com/uploads/shell.php?cmd=whoami` to execute commands.

### Bypass Techniques

| Validation | Bypass |
|------------|--------|
| Content-Type check | Set `Content-Type: image/jpeg` while uploading PHP |
| Extension blacklist | Use `.pHp`, `.php5`, `.phtml` |
| Extension whitelist | Double extension: `shell.php.jpg` |
| Content check | Create polyglot file (valid image with PHP in metadata) |
| Directory restriction | Path traversal in filename: `../shell.php` |
| Config override | Upload `.htaccess` to map custom extensions to PHP |

### Labs

1. **Remote code execution via web shell upload** -- Upload a PHP file containing `<?php echo file_get_contents('/home/carlos/secret'); ?>` and access it to read the secret.
2. **Web shell upload via Content-Type restriction bypass** -- Upload a PHP web shell but change the `Content-Type` header to `image/jpeg` in the multipart form data.

### Prevention

- Whitelist permitted extensions
- Validate file content, not just headers
- Rename uploaded files randomly
- Store uploads outside the web root
- Use established frameworks for upload handling

---

## 6. OS Command Injection

### What Is It?

OS command injection allows attackers to **execute arbitrary operating system commands** on the server. This typically leads to full system compromise.

### How It Works

An application that runs:

```
stockreport.pl 381 29
```

Can be exploited by injecting shell metacharacters:

```
productID=381&storeID=29|whoami
```

The server executes: `stockreport.pl 381 29|whoami`

### Command Separators

| Separator | Platform | Behavior |
|-----------|----------|----------|
| `&` | Both | Run in background |
| `&&` | Both | Run if first succeeds |
| `\|` | Both | Pipe output |
| `\|\|` | Both | Run if first fails |
| `;` | Unix only | Sequential execution |
| `` ` `` | Unix only | Inline execution |
| `$()` | Unix only | Inline execution |

### Useful Commands

| Purpose | Linux | Windows |
|---------|-------|---------|
| Current user | `whoami` | `whoami` |
| OS info | `uname -a` | `ver` |
| Network | `ifconfig` | `ipconfig /all` |
| Processes | `ps -ef` | `tasklist` |
| Connections | `netstat -an` | `netstat -an` |

### Lab: OS Command Injection, Simple Case

**Goal:** Execute `whoami` via a stock check feature.

**Solution:** Intercept the stock check request and inject `|whoami` into the `storeId` parameter. The server returns the current username.

### Prevention

- **Never** call OS commands from application code if possible
- Validate input against a strict whitelist
- Don't rely on escaping shell metacharacters -- it's too error-prone

---

## 7. SQL Injection (SQLi)

### What Is It?

SQL injection lets attackers **interfere with database queries** by injecting malicious SQL through user inputs. This can expose passwords, credit cards, personal data, and even lead to full server compromise.

### Detection

Test inputs with:

- Single quote `'` to trigger SQL errors
- Boolean conditions: `OR 1=1` vs `OR 1=2`
- Time delays: `SLEEP(5)`, `pg_sleep(5)`
- Out-of-band payloads (DNS/HTTP callbacks)

### Retrieving Hidden Data

A product category filter query:

```sql
SELECT * FROM products WHERE category = 'Gifts' AND released = 1
```

Injecting `Gifts'--` comments out the `released` check:

```sql
SELECT * FROM products WHERE category = 'Gifts'--' AND released = 1
```

Injecting `Gifts' OR 1=1--` returns ALL products:

```sql
SELECT * FROM products WHERE category = 'Gifts' OR 1=1--' AND released = 1
```

### Subverting Application Logic (Login Bypass)

A login query:

```sql
SELECT * FROM users WHERE username = 'admin' AND password = 'input'
```

Injecting `administrator'--` as username:

```sql
SELECT * FROM users WHERE username = 'administrator'--' AND password = ''
```

The password check is commented out -- instant admin access.

### Labs

1. **SQLi in WHERE clause allowing retrieval of hidden data** -- Inject `' OR 1=1--` into the category parameter to display all products including unreleased ones.
2. **SQLi vulnerability allowing login bypass** -- Enter `administrator'--` as the username with any password to bypass authentication.

### Prevention

- **Parameterized queries (prepared statements)** -- The primary defense
- Never concatenate user input into SQL strings
- Use ORM frameworks with parameterized queries
- Apply the principle of least privilege to database accounts

---

## Summary

| Vulnerability | Key Payload | Impact |
|---------------|-------------|--------|
| Path Traversal | `../../../etc/passwd` | Read arbitrary files |
| Broken Access Control | Direct URL access, cookie manipulation | Unauthorized access |
| Authentication Flaws | Username enumeration + brute force | Account takeover |
| SSRF | `http://localhost/admin` | Internal network access |
| File Upload | PHP web shell with Content-Type bypass | Remote code execution |
| OS Command Injection | `|whoami` | Full server compromise |
| SQL Injection | `' OR 1=1--` | Database exfiltration |

---

## Key Takeaways for Bug Bounty Hunters

1. **Path traversal** -- Always test `filename`, `file`, `path`, `template` parameters with `../` sequences
2. **Access control** -- Check every endpoint with different privilege levels; swap user IDs in requests
3. **Authentication** -- Look for enumeration differences in error messages, timing, and status codes
4. **SSRF** -- Test any parameter that accepts URLs or hostnames; target `localhost` and `169.254.169.254` (cloud metadata)
5. **File upload** -- Test Content-Type mismatches, double extensions, polyglot files
6. **Command injection** -- Test every input that might reach a shell command with `|`, `&`, `;` separators
7. **SQL injection** -- Test every input with `'`, `"`, `--`, and boolean-based payloads

These 7 vulnerability classes represent the foundation of server-side web security. Master them and you will have a strong base for both pentesting engagements and bug bounty programs.

*Article written by Sita(AI)*
