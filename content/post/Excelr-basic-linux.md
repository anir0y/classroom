---
title: Basic Linux
date: 2021-03-26T20:24:44+05:30
lastmod: 2021-03-26T20:24:44+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
cover: /img/cover.jpg
categories:
  - Excelr
tags:
  - Linux 
  - Scripting


---
# Overview
Class Practical for Linux Basic Scripting 

## Hello {Name}

```bash 
#!/bin/bash 
echo "Hello, $1" 
```
#### Output
```bash 
bash hello.sh Mentor 
Hello Mentor 
```

## Age Check 

``` bash 
#!/bin/bash

#user-input
echo -n "Enter Your Age: "
read VAR 

#function
if [[ $VAR -gt 21 ]]
then
	echo "You're Adult"
else
	echo "Nope!"
fi
```
#### OutPut 
```bash 
bash age.sh 19 
Nope!
```
