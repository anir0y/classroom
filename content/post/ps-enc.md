---
title: Ps Enc
date: 2021-03-25T20:01:50+05:30
lastmod: 2021-03-25T20:01:50+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
cover:
  image: /img/cover.jpg
  alt: "cover image"
categories:
  - Excelr
tags:
  - powershell


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