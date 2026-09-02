---
title: "TryHackMe Broken Authentication: Four Ways Past a Login"
date: 2026-09-02T18:02:00+05:30
lastmod: 2026-09-02T18:02:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-brokenauth/00-thumbnail.png

categories:
  - TryHackMe

tags:
  - tryhackme
  - thm
  - rooms
  - Jr Penetration Tester
  - Web Application Security
  - Broken Authentication
  - Username Enumeration
  - Brute Force
  - Parameter Pollution
  - Cookie Manipulation
  - ffuf

draft: false
description: "Walkthrough of the TryHackMe Broken Authentication room: ffuf username enumeration, login brute force, a reset parameter pollution flaw and cookie tampering."
---

Broken Authentication sits in the Web Application Vulnerabilities II module of the Jr Penetration
Tester path, alongside the [SQL Injection Introduction](/post/thm-room-sqlinjectionintroduction/)
and [XSS Introduction](/post/thm-room-xssintroduction/) rooms. Where those two target the way an
application handles data, this one targets the way it decides who you are. Four separate techniques,
each against the same Acme IT Support portal: enumerate the user list from a signup form, brute the
login, redirect somebody else's password reset into your own inbox, and rewrite the session cookie.

The whole room is reachable directly from the Mac over the THM VPN, so there was no need for the
AttackBox. `ffuf` and `curl` did all of it locally.

## Task 1: setup and the shape of an authentication bypass

No answer needed here, just a "Mark as complete". The framing is worth keeping though: an
authentication bypass is any path to functionality restricted to an account without supplying that
account's credential. Guessing a password is only one of them, and it is the least interesting.

Start the lab machine before reading, because everything after this point needs it.

## Task 2: naming the technique

One question: what do you call reusing credentials recovered from one application against unrelated
applications? The task prose calls this **credential stuffing**, and that is the term the industry
uses.

The answer TryHackMe accepts is **Credential Reuse**.

I only caught that because I read the answer mask before submitting. The mask came back as ten
characters, a space, then five:

```
  Answer format: ********** *****
```

"Credential Stuffing" is 10 and 8. It cannot fit. "Credential Reuse" is 10 and 5, and it was
accepted first try. This is the same mask-arithmetic habit that has saved me on several rooms now:
read the format hint, count the segments, and if your answer does not fit, the answer is wrong even
when the task text seems to support it.

## Task 3: enumerating usernames from the signup form

The signup page at `/customers/signup` refuses duplicate usernames and says so in plain English.
That single difference between "taken" and "free" is the whole vulnerability.

I confirmed the differential by hand first, then handed it to `ffuf` with the SecLists names list
and `-mr` to match only the duplicate-account error:

```bash
  # confirm the differential before automating anything
curl -s -X POST -d "username=admin&email=x&password=x&cpassword=x" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  http://$TARGET/customers/signup | grep -o "already exists"

  # then fuzz 10,735 names, keeping only responses that carry that string
ffuf -w names.txt -X POST -d "username=FUZZ&email=x&password=x&cpassword=x" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u http://$TARGET/customers/signup -mr "username already exists" -t 40
```

![ffuf enumerating four valid usernames from the Acme signup form and then brute forcing the login to recover steve/thunder](/img/thm-brokenauth/01-enum.png)

Four accounts came back: admin, robert, simon, steve. The three the room asks for are **simon**,
**steve** and **robert**.

One snag worth flagging for anyone following the room text literally. The task tells you to use
`/usr/share/wordlists/SecLists/Passwords/Common-Credentials/10-million-password-list-top-100.txt`.
That file no longer exists in SecLists upstream; the whole `10-million-password-list-*` family has
been removed from the repository. I substituted the first 100 lines of `10k-most-common.txt`, which
is the same ordering, and it worked. On the AttackBox the old path may still be present from a
pinned copy, but it will not fetch from GitHub any more.

## Task 4: brute forcing the login with two wordlists

Four usernames times one hundred passwords is four hundred requests, which finishes in under thirty
seconds. `ffuf` binds each wordlist to its own marker so the username and password positions vary
independently:

```bash
ffuf -w valid_usernames.txt:W1,top100.txt:W2 \
  -X POST -d "username=W1&password=W2" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u http://$TARGET/customers/login -fc 200
```

The success signal is the status code, not the body. A failed login re-renders the login page with
HTTP 200; a successful one 302-redirects to the dashboard. `-fc 200` filters out every failure and
leaves exactly one line standing.

That line is **steve/thunder**, visible at the bottom of the screenshot above.

{{< ad >}}

## Task 5: parameter pollution in the password reset

This is the good one. The reset workflow at `/customers/reset` splits its two inputs across
different parts of the same request: the email address travels in the URL query string, the username
travels in the POST body. The application resolves which account you mean from the query string,
but it composes the outgoing email using PHP's `$_REQUEST` superglobal.

`$_REQUEST` merges the query string, the POST body and the cookies into one array, and on a default
configuration the POST body wins on a key collision. So a second `email=` in the body silently
overrides the one the app used for its identity check. The account being reset stays Robert; the
address the link goes to becomes mine.

To receive the link I needed an inbox the portal would deliver to. The portal hands every registered
customer an internal address of the form `{username}@customer.acmeitsupport.thm`, and mail to it
lands as a support ticket on that account. So: register, note the address, fire the polluted
request.

```bash
  # legitimate request, link goes to the address on file
curl 'http://TARGET/customers/reset?email=robert%40acmeitsupport.thm' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=robert'

  # second email= in the body overrides the query string via $_REQUEST
curl 'http://TARGET/customers/reset?email=robert%40acmeitsupport.thm' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=robert&email=MYUSER@customer.acmeitsupport.thm'
```

![Password reset parameter pollution: the confirmation switches to the attacker address, Robert's reset link lands as a support ticket, and following it hands over his session](/img/thm-brokenauth/02-logic.png)

The confirmation page flips from `robert@acmeitsupport.thm` to my own address, Robert's reset link
arrives as a support ticket in my inbox, and following it authenticates the session as Robert. His
one existing ticket holds the flag: **THM{AUTH_BYPASS_COMPLETE}**.

Two honest notes from this task.

First, an unintended finding the room does not mention. `/customers/tickets/{id}` has no ownership
check. Once you hold any authenticated customer session, including the throwaway account you just
registered, you can read ticket 1 directly and get the same flag without ever touching the reset
flow. An unauthenticated request 302s to the login page, so the gate exists, it just does not check
whose ticket it is. That is a plain IDOR sitting next to the intended logic flaw.

Second, one run of my exploit script returned my own session instead of Robert's, which sent me
chasing an ordering theory about the legitimate request clobbering the polluted one. I ran the
sequence three more times in both orders and it produced Robert's session every time. The exploit is
deterministic; that one result was transient, and my ordering theory was wrong.

## Task 6: rewriting plain, hashed and encoded cookies

Four questions covering the three cookie formats. The `/cookie-test` endpoint reads two unsigned
cookies and decides what to return from them, so the client decides its own privilege level:

```bash
curl http://$TARGET/cookie-test                                            # Not Logged In
curl -H "Cookie: logged_in=true; admin=false" http://$TARGET/cookie-test   # Logged In As A User
curl -H "Cookie: logged_in=true; admin=true"  http://$TARGET/cookie-test   # Logged In As An Admin
```

![Cookie manipulation evidence: plain text cookies escalating to admin, the cracked md5 value, and base64 decode and encode](/img/thm-brokenauth/03-cookies.png)

The admin response carries **THM{COOKIE_TAMPERING}**.

The hashed-cookie question gives you `3b2a1053e3270077456a79192070aa78` and asks for the original
value. The room points at CrackStation. I ran it locally instead, and it is worth saying that it did
not fall to any dictionary: not SecLists, not `/usr/share/dict/web2`, not the obvious `admin` /
`true` / `1` candidates. A six-character mask brute force with hashcat cracked it in seconds, because
the value is numeric: **463729**. That is the whole point of the task, a hash is a content-addressable
representation, not a signature, and anything short or predictable is effectively reversible.

```bash
echo 3b2a1053e3270077456a79192070aa78 > h.txt
hashcat -m 0 -a 3 h.txt '?a?a?a?a?a?a' -O
```

The last two are straight encoding work. `VEhNe0JBU0U2NF9FTkNPRElOR30=` decodes to
**THM{BASE64_ENCODING}**, and `{"id":1,"admin":true}` encodes to
**eyJpZCI6MSwiYWRtaW4iOnRydWV9**. Base64 provides no confidentiality and no integrity; it is a
transport encoding that developers reach for because it fits JSON into a cookie value, and it stops
nobody from editing the JSON first.

## Task 7: conclusion

No answer needed, just a Check click to close the room out.

## Takeaways

**Read the answer mask before you submit, and trust it over the task prose.** Task 2's own text
calls the technique credential stuffing, but the accepted answer is Credential Reuse, and the ten
and five character mask told me that before I burned a wrong submission. When your answer does not
fit the mask, the answer is wrong, not the room.

**Splitting one logical input across two request sources is the bug, not the individual choices.**
Reading the account from the query string is reasonable. Building the email from `$_REQUEST` is
reasonable. The vulnerability lives entirely in the disagreement between them, which is exactly why
scanners do not find these and reading the workflow by hand does. The same shape shows up wherever
identity is checked against one source and acted on from another.

Room solved 100%: 7 tasks, 10 answers.
