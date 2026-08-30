---
title: "TryHackMe Threat Hunting With YARA: Four Modifiers and a Self-Match"
date: 2026-08-29T13:05:00+05:30
lastmod: 2026-08-29T13:05:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-yara/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Malware Analysis
  - Static Analysis
  - YARA
  - Threat Hunting
  - APT29
  - Blue Team

draft: false
description: "Walkthrough of TryHackMe Threat Hunting With YARA: hunting ROOTSAW and WINELOADER with Mandiant's own rules, the wide/base64/xor string modifiers that decide whether a rule fires at all, and the rule file that matches itself."
---

## Threat Hunting With YARA

Room 2 of 6 in the **Static Malware Analysis** module on SOC Level 2, straight after [Basic Static Analysis](/post/thm-room-staticanalysis1/). That room was about what a single file will tell you when you interrogate it. This one is the inverse: you already know what you are looking for, because a threat intelligence report told you, and the job is to find every copy of it across a filesystem before it does anything.

The tool is YARA, and the honest version of this room is that YARA is not hard, the hard part is that a rule which is 95% right returns nothing at all, silently, and looks exactly like a clean environment. Every question in Task 9 is really a question about which string modifier you forgot.

The scenario is a real one: Mandiant's reporting on APT29's ROOTSAW dropper and the WINELOADER backdoor, delivered through a wine-tasting phishing lure. The room hands you the actual detection rules from that report and a Windows Server 2019 box with `yara64.exe` on `PATH`. If you have done [Threat Hunting: Introduction](/post/thm-room-threat-hunting-introduction/), Task 3 here is the same taxonomy with a sharper edge.

## Task 1 and 2: Reading the intel before touching the tool

Task 2 is the Mandiant report, reproduced in full: a phishing PDF in `en-GB`, a link to `waterforvoiceless[.]org/invite.php`, a ZIP containing ROOTSAW, an `Invite.hta` that pulls `util.php`, a certificate file extracted with `certutil`, a ZIP containing WINELOADER, and finally `Vcruntime140.dll` beaconing to `siestakeying[.]com/auth.php`.

Two questions come out of it. The first asks what MITRE technique **T1134** describes. The report lists it among APT29's TTPs; the answer is **Access Token Manipulation**.

The second asks what the detection rule `M_APT_Dropper_Rootsaw_Obfuscated` detects. The temptation is to read the strings and describe them yourself, you would end up writing something like "obfuscated JavaScript that fetches a zip". That is a correct description and a wrong answer. The rule's own `meta` block already says it:

```yara
rule M_APT_Dropper_Rootsaw_Obfuscated
{
    meta:
        author = "Mandiant"
        disclaimer = "This rule is meant for hunting and is not tested to run in a production environment."
        description = "Detects obfuscated ROOTSAW payloads"

    strings:
        $ = "function _"
        $ = "new XMLHttpRequest()"
        $ = "'\x2e\x7a\x69\x70'"
        $ = "'\x4f\x70\x65\x6e'"
        $ = "\x43\x3a\x5c\x57"

    condition:
        all of them
}
```

The answer is **Detects obfuscated ROOTSAW payloads**, and the four-word underscore mask on the answer box confirms it before you submit. Worth noticing what those hex strings are, though: `\x2e\x7a\x69\x70` is `.zip`, `\x4f\x70\x65\x6e` is `Open`, `\x43\x3a\x5c\x57` is `C:\W`. The dropper hides its own strings from `strings`, and the rule hunts the hiding rather than the hidden.

## Task 3: Three hunting styles, and the one with the confusing name

The room splits threat hunting into three styles, and the questions turn on getting the names the right way round.

**Structured hunting** starts from Indicators of Attack and TTPs, you hypothesise that a specific actor behaves a specific way and go looking for that behaviour. It is proactive and it can catch an intrusion early in the kill chain, because TTPs show up before artefacts do. Also called hypothesis-based hunting. That is the answer to the first question: **Structured Hunting**.

**Unstructured hunting** starts from Indicators of Compromise, hashes, domains, filenames, and sweeps the estate for them. The room's other name for it is *intel-based* threat hunting, which is where people trip: "intel-based" sounds like the sophisticated one, and "unstructured" sounds like the lazy one. It is the reverse of that intuition. A report full of IOCs and nothing else gives you no behaviour to hypothesise about, so the recommended style for the third question is **Unstructured Hunting**.

**Situational or entity-driven hunting** mixes the two and is triggered by a change in the landscape, a new actor, a sector-specific report, a national CSIRT advisory, and usually focuses on the crown jewels.

The middle question asks which phase of the hunting process uses tools like YARA or Volatility. The process is Trigger, Investigation, Resolution; the tools come out in the middle one. The answer is **Investigation**.

## Task 4: What a rule actually requires

A YARA rule is a name, an optional `meta` block, an optional `strings` block, and a `condition`. The question asks which section is required alongside the rule name, and the nine-character mask settles it: **condition**.

That is not a trivia point. `strings` is optional because a condition can be built entirely out of module data, `pe.imphash()`, `filesize`, `math.entropy()`, with no literal strings at all. The condition is what makes the rule a rule.

## Task 5: The modifiers that decide whether your rule fires

This is the task that Task 9 is secretly testing. YARA string modifiers change what a literal actually matches:

| Modifier | What it does |
|---|---|
| `nocase` | Case-insensitive match |
| `wide` | Matches 2-byte (UTF-16LE) encoded characters |
| `ascii` | Matches 1-byte characters, the default, so it is only written when pairing with `wide` |
| `xor` | Matches every variation produced by a 1-byte XOR key |
| `base64` | Matches the string's base64 encodings |
| `fullword` | Only matches when delimited by non-alphanumeric characters |

The question asks which modifier searches for 2-byte encoded characters: **wide**. Windows APIs are full of UTF-16, so a rule written only for ASCII will miss every string a program passed to a `W` function.

The second question asks which condition matches only when none of the defined strings are present. YARA's set syntax gives you `any of them`, `all of them`, `2 of them`, and the negative form, **none of them**. Useful for allowlisting: "this file has none of the markers we expect from a legitimate build".

## Task 6 and 7: Running the thing

Task 6 hands you a Windows Server 2019 VM with YARA installed, split-screen VNC, and RDP credentials as a fallback. Everything lives in `C:\TMP`.

Task 7 walks the CLI. The one question asks for the flag that scans directories recursively, which is **-r** (long form `--recursive`). The other flags that matter for the exercises are `-s` to print the matched strings and `-X` to print the XOR key and plaintext of an XOR match.

The room's own hunt is where it gets interesting. There are six rule files in `C:\TMP\YARARULES`, and rather than run them one at a time I cross-multiplied every rule against every file in `C:\TMP`:

```powershell
# every rule against every file, printing only the hits
gci C:\TMP\YARARULES\*.yar | %{ $r=$_; gci C:\TMP -File | %{
    $o = & yara64 $r.FullName $_.FullName; if($o){ "$($r.Name) -> $o" } } }

myfirstrule.yar  -> myfirstrule C:\TMP\test.txt
ROOTSAW.yar      -> M_APT_Dropper_Rootsaw_Obfuscated C:\TMP\Wineloader.js
WINELOADER1.yar  -> M_APT_Downloader_WINELOADER_1 C:\TMP\72b92683052e0c813890caf7b4f8bfd331a8b2afc324dd545d46138f677178c4.exe
WINELOADER2.yar  -> M_APT_Downloader_WINELOADER_2 C:\TMP\72b92683052e0c813890caf7b4f8bfd331a8b2afc324dd545d46138f677178c4.exe
```

Two rules from that folder produced nothing at all against real files, `checkregistry.yar` and `Wineloader.yar`. The second one is worth dwelling on, because when I first ran it recursively over the whole of `C:\TMP` it looked like a hit factory:

```powershell
yara64 -s -r C:\TMP\YARARULES\Wineloader.yar C:\TMP

DLL_Loader_Wineloader_March2024 C:\TMP\YARARULES\ROOTSAW.yar
0x9a:$RC4: test
DLL_Loader_Wineloader_March2024 C:\TMP\YARARULES\Wineloader.yar
0x1c5:$RC4: test
DLL_Loader_Wineloader_March2024 C:\TMP\YARARULES\WINELOADER1.yar
0x97:$RC4: test
DLL_Loader_Wineloader_March2024 C:\TMP\YARARULES\WINELOADER2.yar
0x97:$RC4: test
```

Four matches, all of them on `.yar` files, including the rule matching *itself*. The rule contains a `$RC4` string whose value is the four letters `test`, so any file containing the word "test" matches, and every rule file in that folder contains it, because they all define the same string. That is what a false positive looks like when you scan a directory that includes your own rules: the tool is behaving perfectly and telling you nothing. Scan the corpus, not the toolbox.

{{< ad >}}

## Task 8: What you do after a true positive

One question, and it is about the incident response framework named in the task: **DAIR**, the **Dynamic Approach to Incident Response**. The five-token mask (`_______ ________ __ ________ ________`) makes it unambiguous that the answer wants the expansion including the lowercase "to".

The substance of the task is worth keeping even though it is not graded: once a hunt turns up a confirmed IOC, the hunter's job is to hand it over, not to start remediating. Notify the responsible team, follow the IR policy, preserve evidence by hashing before you touch anything, and document as you go, the hunt notes become the first hour of the IR timeline.

## Task 9: Four exercises, four modifiers

Each exercise is a directory of near-identical text files with one that matches. I wrote each rule as a one-liner from PowerShell rather than opening an editor in the VNC session, which also keeps the rule visible next to its output.

### Exercise 1: a regex for the flag format

Find the file containing a `THM{}` pattern. The literal string is unknown, so this is the regex case, and inside a YARA regex the brace is a repetition operator, so both braces need escaping:

```powershell
'rule ex1 { strings: $a = /THM\{[^}]{1,60}\}/ condition: $a }' |
    Set-Content -Encoding ascii C:\TMP\ex1.yar
yara64 -s -r C:\TMP\ex1.yar C:\TMP\Exercise1\

ex1 C:\TMP\Exercise1\\file26.txt
0x0:$a: THM{Threathuntingisawesome}
```

![YARA regex rule matching the flag pattern in file26.txt of Exercise 1](/img/thm-yara/01-exercise1-regex.png)

The flag is **THM{Threathuntingisawesome}**. `-s` is doing real work here: without it YARA prints the filename and you would still have to go find the flag inside the file.

### Exercise 2: strings that are quite wide

Find the file containing `Yet another` and `Ridiculous acronym`. Run that as a plain ASCII rule and you get nothing, which is the entire point of the exercise, the hint ("strings can be quite wide") is telling you the file stores them as UTF-16:

```powershell
'rule ex2 { strings: $a = "Yet another" wide $b = "Ridiculous acronym" wide condition: all of them }' |
    Set-Content -Encoding ascii C:\TMP\ex2.yar
yara64 -s -r C:\TMP\ex2.yar C:\TMP\Exercise2\

ex2 C:\TMP\Exercise2\\file10.txt
0x11fee:$a: Y\x00e\x00t\x00 \x00a\x00n\x00o\x00t\x00h\x00e\x00r\x00
0x1f038:$b: R\x00i\x00d\x00i\x00c\x00u\x00l\x00o\x00u\x00s\x00 \x00a\x00c\x00r\x00o\x00n\x00y\x00m\x00
```

![wide-modifier rule matching UTF-16 encoded strings in file10.txt](/img/thm-yara/02-exercise2-wide.png)

The answer is **file10.txt**. The `\x00` between every character in the output is the proof, those are the null bytes that make an ASCII-only rule walk straight past the match.

### Exercise 3: base64 without doing the encoding yourself

Find the file containing the base64 of `THM{This was a really fun exercise}`. You can encode it yourself and search for the literal, but that only covers one of the three possible encodings, base64 output shifts depending on the string's byte alignment. The `base64` modifier generates all three:

```powershell
'rule ex3 { strings: $a = "THM{This was a really fun exercise}" base64 condition: $a }' |
    Set-Content -Encoding ascii C:\TMP\ex3.yar
yara64 -r C:\TMP\ex3.yar C:\TMP\Exercise3\

ex3 C:\TMP\Exercise3\\file13.txt
```

![base64-modifier rule matching file13.txt in Exercise 3](/img/thm-yara/03-exercise3-base64.png)

The answer is **file13.txt**. I dropped `-s` for this one deliberately: the matching file contains the encoded blob thousands of times, so `-s` buries the filename under several screens of `VEhNe1RoaXMgd2FzIGEgcmVhbGx5IGZ1biBleGVyY2lzZX...`. When the question asks for a filename, ask YARA for filenames.

### Exercise 4: XOR, and the key that comes back with the match

Find the XOR-encrypted string `THM{FoundSomethingHidden}` anywhere under `C:\TMP`, then report the key and the ciphertext. The `xor` modifier tries all 255 single-byte keys, and `-X` prints which one hit along with the plaintext:

```powershell
'rule ex4 { strings: $a = "THM{FoundSomethingHidden}" xor condition: $a }' |
    Set-Content -Encoding ascii C:\TMP\ex4.yar
yara64 -s -X -r C:\TMP\ex4.yar C:\TMP

ex4 C:\TMP\ex4.yar
0x1a:$a:xor(0x00,THM{FoundSomethingHidden}): THM{FoundSomethingHidden}
ex4 C:\TMP\Exercise4\10test.txt
0x1ade:$a:xor(0x01,THM{FoundSomethingHidden}): UILzGntoeRnlduihofIheedo|
```

![XOR rule reporting key 0x01 and the encrypted string in 10test.txt](/img/thm-yara/04-exercise4-xor.png)

The key is **0x01** and the encrypted string is **UILzGntoeRnlduihofIheedo\|**. Two things in that output are worth reading carefully.

First, the top hit is `C:\TMP\ex4.yar` with `xor(0x00...)`, my own rule file, matching because `xor` includes the identity key 0x00 and the rule contains the plaintext. Same failure mode as `Wineloader.yar` above, arrived at from the opposite direction. A `xor` rule will always match its own source.

Second, the ciphertext ends in a pipe. `}` is `0x7D`, XOR `0x01` gives `0x7C`, which is `|`. Every character shifts by one: `T`→`U`, `H`→`I`, `M`→`L`, `{`→`z`. The transformation is visible if you look, and the answer box mask (25 underscores) matches the plaintext's length exactly, because XOR does not change length.

## What I took away

**A YARA rule that matches nothing looks identical to a clean environment.** There is no error, no warning, no "your string was ASCII and the file was UTF-16". Exercise 2 and Exercise 3 both fail silently if you write the obvious rule. When a hunt across a real estate comes back empty, the first thing to test is not "are we clean" but "does my rule fire on a file I have deliberately planted".

**Scan the corpus, not the toolbox.** Both false positives in this room came from YARA doing exactly what it was told: `Wineloader.yar` matched every rule file in `C:\TMP\YARARULES` because they all contain the string `test`, and my own `ex4.yar` matched itself because `xor` includes the null key. Recursive scans that include your rule directory, your notes, or your report drafts will generate hits that are technically correct and operationally worthless. Point `-r` at the target and keep the rules somewhere else.

Room solved 100%: 10 tasks, 18 answers.
