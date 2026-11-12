---
title: "TryHackMe Mr. Phisher: VBA macro XOR flag extraction"
date: 2026-11-05T20:47:00+05:30
lastmod: 2026-11-05T20:47:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-mrphisher/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Phishing
  - VBA macros
  - OLE
  - malware analysis
  - obfuscation

draft: false
description: "TryHackMe Mr. Phisher walkthrough: extracting and deobfuscating a VBA macro from a malicious Word document using OLE analysis."
---

This easy room from the [Phishing](https://tryhackme.com/module/phishing) module puts you face to face with a suspicious Word document that asks you to "enable macros." The challenge is to extract the obfuscated VBA macro, understand its XOR deobfuscation logic, and recover the hidden flag without executing the macro.

## Task 1: Mr. Phisher

The VM boots into a MATE desktop with a file manager open to `/home/ubuntu/mrphisher/`. Inside are two files: `MrPhisher.docm` (the malicious Word document) and `mr-phisher.zip` (a copy of the same). The document contains a Fry meme image captioned "NOT SURE IF LINK OR MALWARE" and a VBA macro project.

### Extracting the VBA source

A `.docm` file is a ZIP archive containing XML and binary resources. The VBA macros live inside `word/vbaProject.bin`, which is an OLE Compound File Binary Format (CFBF) container. Inside that OLE file, the `VBA/NewMacros` stream holds both a performance cache (p-code bytecode) and the compressed VBA source code.

The p-code sits at the beginning of the stream. The compressed source starts at a byte offset recorded in the `VBA/dir` stream as the MODULEOFFSET. Reading numbers directly from the raw stream with a regex picks up p-code opcodes mixed in with the real array values, producing garbage output. The correct approach is to find the MODULEOFFSET and decompress only the source region.

Using `olefile` (available on the VM), the extraction process:

```python
  # extract vbaProject.bin from the docm (it is a standard ZIP)
import zipfile, io, olefile
z = zipfile.ZipFile('/home/ubuntu/mrphisher/MrPhisher.docm')
o = olefile.OleFileIO(io.BytesIO(z.read('word/vbaProject.bin')))
nm = o.openstream('VBA/NewMacros').read()
  # stream is 1602 bytes: p-code first, compressed source at offset 1322
```

The compressed container starts with a `0x01` signature byte, followed by chunk headers encoding size and compression flag per the MS-OVBA specification. After decompression, the clean VBA source emerges:

```vba
Attribute VB_Name = "NewMacros"
Sub Format()
    Dim a()
    Dim b As String
    a = Array(102, 109, 99, 100, 127, 100, 53, 62, 105, 57, 61, 106, _
              62, 62, 55, 110, 113, 114, 118, 39, 36, 118, 47, 35, _
              32, 125, 34, 46, 46, 124, 43, 124, 25, 71, 26, 71, 21, 88)
    For i = 0 To UBound(a)
        b = b & Chr(a(i) Xor i)
    Next
End Sub
```

{{< ad >}}

### Decoding the flag

The macro stores an integer array and XORs each element with its index (`a(i) Xor i`), converting the result to a character with `Chr()`. Walking through the first five values confirms the pattern:

| Index | Value | XOR | Char |
|-------|-------|-----|------|
| 0 | 102 | 102 | f |
| 1 | 109 | 108 | l |
| 2 | 99 | 97 | a |
| 3 | 100 | 103 | g |
| 4 | 127 | 123 | { |

Running the full decode in Python:

```python
a = [102, 109, 99, 100, 127, 100, 53, 62, 105, 57, 61, 106,
     62, 62, 55, 110, 113, 114, 118, 39, 36, 118, 47, 35,
     32, 125, 34, 46, 46, 124, 43, 124, 25, 71, 26, 71, 21, 88]
flag = ''.join(chr(v ^ i) for i, v in enumerate(a))
  # flag{REDACTED}
```

**What is the flag? flag{a39a07a239aacd40c948d852a5c9f8d1}**

## Takeaways

1. **P-code contaminates naive extraction.** The VBA module stream interleaves bytecode opcodes with compressed source text. Grepping for `\d+` in the raw bytes picks up both, producing a corrupted array. Always decompress the source from the MODULEOFFSET recorded in the `VBA/dir` stream.

2. **XOR with index is the simplest reversible obfuscation.** The `Chr(a(i) Xor i)` pattern appears in many beginner CTF challenges and real-world macro malware. Recognizing the structure (integer array, loop counter, bitwise XOR, string concatenation) lets you decode the payload statically without enabling macros or executing the document.

Room solved 100%: 1 task, 1 answer.
