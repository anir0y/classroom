---
title: "TryHackMe Whats Your Name: XSS, CSRF and SQLi chain"
date: 2026-10-19T02:15:00+05:30
lastmod: 2026-10-19T02:15:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-wyn/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - XSS
  - CSRF
  - SQL Injection
  - client-side exploitation
  - cookie theft
  - session hijacking

draft: false
description: "TryHackMe Whats Your Name walkthrough: stored XSS cookie theft, CSRF password reset via admin bot, UPDATEXML SQLi, and cross-subdomain session abuse."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Whats Your Name? |![Whats Your Name room icon](https://cdn-images.tryhackme.com/room-icons/62a7685ca6e7ce005d3f3afe-1718463471016)|

This medium-difficulty room tests client-side exploitation from end to end: inspecting JavaScript to find innerHTML sinks, stealing cookies via stored XSS, forging cross-site requests through a chat bot, and chaining SQL injection to extract credentials. Two web applications share a session cookie across subdomains, and that shared trust is the pivot for both flags.

## Task 1: Challenge

The lab deploys two interconnected applications on the same server:

- **worldwap.thm**: a posting platform with registration, a dashboard, and a moderator panel
- **login.worldwap.thm**: a chat application with an admin bot that visits `chat.php` every five seconds

Both share a single `PHPSESSID` cookie scoped to `.worldwap.thm`. A session created on one subdomain works on the other.

### Reconnaissance

A port scan showed only HTTP (80) open. The first step was mapping every endpoint and reading the client-side JavaScript.

**dashboard.js** renders posts with innerHTML, making every field an XSS sink:

```javascript
postDiv.innerHTML = `<h3>${post.title}</h3><p>${post.content}</p><p>- ${post.username}</p><hr>`;
```

**chat.php** on login.worldwap.thm also renders messages with innerHTML:

```javascript
messageDiv.innerHTML = msg.message;
```

**register.js** leaks an API key required for registration:

```
X-THM-API-Key: e8d25b4208b80008a9e15c8698640e85
```

**login.js** reveals role-based routing: moderators go to `admin.php`, everyone else to `dashboard.php`.

### Finding SQL injection

The `edit_post.php` and `delete_post.php` endpoints accept user-controlled `id` and `title` fields in a raw SQL query. Injecting into the `id` field of an UPDATE statement triggers XPATH errors via UPDATEXML, leaking query results character by character:

```
id: 4 AND UPDATEXML(1,CONCAT(0x7e,(SELECT version()),0x7e),1)
```

```
  # XPATH syntax error: '~8.0.36-0ubuntu0.22.04.1~'
```

This confirmed error-based blind SQL injection. Stacked queries were blocked (the application uses `mysqli_query`, not `mysqli_multi_query`), so writes to other tables were off the table.

### Database enumeration

Using the UPDATEXML injection, I mapped both databases:

- **postman** (worldwap.thm): `users` (id, username, password as bcrypt, email, name, role, status) and `posts` (id, title, content, username with FK to users)
- **chatapp** (login.worldwap.thm): `users` (username, password in **plain text**, role) and `messages`

The chatapp stored passwords in plain text, a critical weakness.

{{< ad >}}

### Flag 2: admin panel (CSRF via chat XSS)

The admin bot on login.worldwap.thm clicks the first unclicked `<a>` tag in the latest chat message using `window.open()`. The `change_password.php` endpoint accepts a POST with just `new_password`, no CSRF token and no old-password check.

**Attack chain:**

1. Sent a chat message containing `<a href="...">` pointing to a page that submits a CSRF form to `change_password.php`
2. The admin bot clicked the link, changing its own chatapp password
3. Logged in to the chatapp as admin with the new password
4. Accessed `profile.php` on login.worldwap.thm

The profile page displayed: **Flag value: `AdM!nP@wnEd`**

The admin bot's stolen session also worked on worldwap.thm (cross-subdomain sharing), giving admin-level access to the post management API, which enabled the SQL injection enumeration above.

### Flag 1: moderator account (password reuse via SQLi extraction)

The moderator account on worldwap.thm had `role=moderator` and a bcrypt password hash. The `admin.php` and `mod.php` pages required exactly `role=moderator` (the admin role returned 403).

Approaches that failed:

- **Stacked queries** to UPDATE the moderator's password: blocked by `mysqli_query`
- **Multi-table UPDATE** from the injection point: the SET-clause injection could not introduce a JOIN
- **INTO OUTFILE**: restricted by `secure_file_priv=/var/lib/mysql-files/`
- **Session injection via registration**: the register API blocked `|`, `;`, and `"`, the exact characters needed for PHP session deserialization

The breakthrough came from extracting the moderator's bcrypt hash in segments using UPDATEXML:

```
  # Part 1: ~$2y$10$pqarkndVEh8k9rLKOY88Lu9~
  # Part 2: ~9oFkfJOzRZuEDLHj8Q.Y~
  # Part 3: ~uNX8NTvLBGS~
```

I already knew the chatapp admin's original plain-text password (`Un6u3$$4Bl3!!`) from the CSRF attack. Testing it against the moderator's bcrypt hash:

```python
bcrypt.checkpw(b'Un6u3$$4Bl3!!', moderator_hash)
  # True
```

Password reuse. The moderator on worldwap.thm and the chatapp admin shared the same password.

Logged in to worldwap.thm as `moderator`, then accessed `profile.php` on login.worldwap.thm with that session.

The profile page displayed: **Flag value: `ModP@wnEd`**

### Answers

- **Q1: What is the flag value after accessing the moderator account?** **ModP@wnEd**
- **Q2: What is the flag value after accessing the admin panel?** **AdM!nP@wnEd**

## Takeaways

**Shared session cookies across subdomains multiply the impact of every vulnerability.** A CSRF on the chatapp changed the admin's password, but the same session token gave admin access to the posting platform, unlocking SQL injection that would otherwise have been unreachable. Every trust boundary a cookie crosses is an attack surface.

**Error-based SQL injection is a full read primitive even without stacked queries.** The UPDATEXML technique extracted user tables, password hashes, and database metadata one fragment at a time. When the moderator's hash matched a password already looted from the chatapp, the entire chain closed without ever needing a write primitive.

Room solved 100%: 1 task, 2 answers.
