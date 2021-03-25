---
title: Ps Enc
date: 2021-03-25T20:01:50+05:30
lastmod: 2021-03-25T20:01:50+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
cover: /img/cover.jpg
categories:
  - Excelr
tags:
  - powershell


---

# Powershell Enc 

```powershell
PS C:\Users\mentor\Desktop\Excelr> $pt='echo "Hello $env:username"'
PS C:\Users\mentor\Desktop\Excelr> $bytes=[System.Text.Encoding]::Unicode.GetBytes($pt)
PS C:\Users\mentor\Desktop\Excelr> $enc=[Convert]::ToBase64String($bytes)
PS C:\Users\mentor\Desktop\Excelr> $enc
ZQBjAGgAbwAgACIASABlAGwAbABvACAAJABlAG4AdgA6AHUAcwBlAHIAbgBhAG0AZQAiAA==
PS C:\Users\mentor\Desktop\Excelr>
```

## Run the encoded code

```powershell 
powershell.exe -enc "ZQBjAGgAbwAgACIASABlAGwAbABvACAAJABlAG4AdgA6AHUAcwBlAHIAbgBhAG0AZQAiAA=="
```