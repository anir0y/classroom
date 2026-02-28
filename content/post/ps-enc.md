---
title: Ps Enc
date: 2021-03-25T20:01:50+05:30
lastmod: 2021-03-25T20:01:50+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/cover.jpg
categories:
  - Excelr
tags:
  - powershell

description: "Understanding PowerShell encoding techniques — Base64 encoding, obfuscation methods, and decoding strategies for security analysis."

---

# Powershell Enc 

```bash
$pt='echo "Hello $env:username"'
$bytes=[System.Text.Encoding]::Unicode.GetBytes($pt)
$enc=[Convert]::ToBase64String($bytes)
$enc
ZQBjAGgAbwAgACIASABlAGwAbABvACAAJABlAG4AdgA6AHUAcwBlAHIAbgBhAG0AZQAiAA==

```

## Run the encoded code

```bash 
powershell.exe -enc "ZQBjAGgAbwAgACIASABlAGwAbABvACAAJABlAG4AdgA6AHUAcwBlAHIAbgBhAG0AZQAiAA=="
```