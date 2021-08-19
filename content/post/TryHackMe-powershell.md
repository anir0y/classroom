---
title: TryHackMe Hacking with PowerShell
date: 2021-08-17T14:58:29+05:30
lastmod: 2021-08-17T14:58:29+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover: /img/thm.gif # for tryhackMe

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm

draft: false
description: TryHackMe Room Hacking with PowerShell solved by Animesh Roy. this is a walkthough. read more...

---

## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Hacking with PowerShell|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/ca3da5aa8e312b0316f06a25a03028a5.png)|
| <b> Room [Subscription Required] </b>| [Hacking with PowerShell](https://tryhackme.com/room/powershell)|

Learn the basics of PowerShell and PowerShell Scripting

## task 01:  Objectives

In this room, we'll be exploring the following concepts:

* What is Powershell and how it works
* Basic Powershell commands
* Windows enumeration with Powershell
* Powershell scripting

---

## Task 02: What is Powershell?

Powershell is the Windows Scripting Language and shell environment that is built using the .NET framework.

This also allows Powershell to execute .NET functions directly from its shell. Most Powershell commands, called cmdlets, are written in .NET. Unlike other scripting languages and shell environments, the output of these cmdlets are objects - making Powershell somewhat object oriented. This also means that running cmdlets allows you to perform actions on the output object(which makes it convenient to pass output from one cmdlet to another). The normal format of a cmdlet is represented using Verb-Noun; for example the cmdlet to list commands is called `Get-Command`.

Common verbs to use include:

* Get
* Start
* Stop
* Read
* Write
* New
* Out

More [msdn](https://docs.microsoft.com/en-us/powershell/scripting/developer/cmdlet/approved-verbs-for-windows-powershell-commands?view=powershell-7)

---

## Task 03: Basic Powershell Commands

Now that we've understood how cmdlets works - let's explore how to use them! The main thing to remember here is that Get-Command and Get-Help are your best friends!

**Using Get-Help**

Get-Help displays information about a cmdlet. To get help about a particular command, run the following:

`Get-Help Command-Name`

You can also understand how exactly to use the command by passing in the -examples flag. This would return output like the following:

![img](https://i.imgur.com/U5Mlirh.png)

**Using Get-Command**

`Get-Command` gets all the cmdlets installed on the current Computer. The great thing about this cmdlet is that it allows for pattern matching like the following

`Get-Command Verb-*` or `Get-Command *-Noun`

Running `Get-Command New-*` to view all the cmdlets for the verb new displays the following:

![img](https://i.imgur.com/KEzbPUI.png)

**Object Manipulation**

In the previous task, we saw how the output of every cmdlet is an object. If we want to actually manipulate the output, we need to figure out a few things:

* passing output to other cmdlets
* using specific object cmdlets to extract information

The Pipeline(|) is used to pass output from one cmdlet to another. A major difference compared to other shells is that instead of passing text or string to the command after the pipe, powershell passes an object to the next cmdlet. Like every object in object oriented frameworks, an object will contain methods and properties. You can think of methods as functions that can be applied to output from the cmdlet and you can think of properties as variables in the output from a cmdlet. To view these details, pass the output of a cmdlet to the Get-Member cmdlet

`Verb-Noun | Get-Member`

An example of running this to view the members for Get-Command is:

`Get-Command | Get-Member -MemberType Method`

![img](https://i.imgur.com/OlwXSbS.png)

From the above flag in the command, you can see that you can also select between methods and properties.

**Creating Objects From Previous cmdlets**

One way of manipulating objects is pulling out the properties from the output of a cmdlet and creating a new object. This is done using the Select-Object cmdlet. 

Here's an example of listing the directories and just selecting the mode and the name:

![img](https://i.imgur.com/Zdxicjj.png)

You can also use the following flags to select particular information:

* first - gets the first x object
* last - gets the last x object
* unique - shows the unique objects
* skip - skips x objects

**Filtering Objects**

When retrieving output objects, you may want to select objects that match a very specific value. You can do this using the `Where-Object` to filter based on the value of properties.

The general format of the using this cmdlet is

`Verb-Noun | Where-Object -Property PropertyName -operator Value`
`Verb-Noun | Where-Object {$_.PropertyName -operator Value}`

The second version uses the $_ operator to iterate through every object passed to the Where-Object cmdlet.

Powershell is quite sensitive so make sure you don't put quotes around the command!

Where `-operator` is a list of the following operators:

* -Contains: if any item in the property value is an exact match for the specified value
* -EQ: if the property value is the same as the specified value
* -GT: if the property value is greater than the specified value

For a full list of operators, use this [link](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/where-object?view=powershell-6).

Here's an example of checking the stopped processes:

![img](https://i.imgur.com/obTvbWW.png)

**Sort Object**

When a cmdlet outputs a lot of information, you may need to sort it to extract the information more efficiently. You do this by pipe lining the output of a cmdlet to the Sort-Object cmdlet.

The format of the command would be

`Verb-Noun | Sort-Object`

Here's an example of sort the list of directories:

![img](https://i.imgur.com/xob5cqe.png)

### 3.1 What is the location of the file "interesting-file.txt"

* List parameters
     `(Get-Command Get-ChildItem).Parameters`

     ![img](https://i.imgur.com/WxgaO5i.jpg)

* Finding file with powershell `Get-ChildItem -Path C:/ -Name interesting-file.txt -Recurse -File` : `did not worked`
* Useing “-Include” parameter. Got error msgs
  ![img](https://i.imgur.com/yoZUjL8.png)

* Silent error msgs with `-ErrorAction SilentlyContinue`
  
  `Get-ChildItem -Path C:\ -Include interesting-file.txt -File -Recurse -ErrorAction SilentlyContinue`

  ![img](https://i.imgur.com/NRSMypT.png)

* Try something new with wildcard (*)

  `Get-ChildItem -Path C:\ -Include *interesting-file.txt* -File -Recurse -ErrorAction SilentlyContinue`

  ![img](https://i.imgur.com/NsHmoBM.png)
  
### 3.2 Specify the contents of this file

![img](https://i.imgur.com/LYqzjUR.png)

### 3.3 How many cmdlets are installed on the system(only cmdlets, not functions and aliases)?

* let's find out the `cmdlets` parameters: `Get-Command`
* Let’s get parameter name first.
     `Get-Command | Select-Object -First 1`
* The parameter is “CommandType”
     ![img](https://i.imgur.com/R7Ifb9f.png)
* now we know the parameter name let's get the count:
     ![img](https://i.imgur.com/5818M6W.png)

### 3.4 Get the MD5 hash of interesting-file.txt

* find the `hash` function
  `Get-Command *hash*`
* List Parameters:
  ![img](https://i.imgur.com/vuqjF4c.jpg)

  * neeed 2 values (path and algo)
* let's run the command:
  ![img](https://i.imgur.com/jStFq17.png)

### 3.5 What is the command to get the current working directory?

     Get-Location

### 3.6 Does the path "C:\Users\Administrator\Documents\Passwords" Exist(Y/N)?

![img](https://i.imgur.com/m4XyaIj.png)

### 3.7 What command would you use to make a request to a web server?

`Invoke-WebRequest`

> watching `ippsec` videos, helped!!!

#### 3.8 Base64 decode the file b64.txt on Windows

* find the file: 
  `Get-ChildItem -Path C:/ -Include *b64.txt* -Recurse -File`

  ![img](https://i.imgur.com/uf9iPFz.png)

* Decoding file with `certutil.exe`
  `certutil -decode "C:\Users\Administrator\Desktop\b64.txt" out.txt`
* read the `out.txt` file

---
<!-- Google Ads -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
<ins class="adsbygoogle"
     style="display:block; text-align:center;"
     data-ad-layout="in-article"
     data-ad-format="fluid"
     data-ad-client="ca-pub-3526678290068011"
     data-ad-slot="7160066188"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
<!-- END -->

---

### task 04: Enumeration

The first step when you have gained initial access to any machine would be to enumerate. We'll be enumerating the following:

* users
* basic networking information
* file permissions
* registry permissions
* scheduled and running tasks
* insecure files

Your task will be to answer the following questions to enumerate the machine using Powershell commands!

### 4.1 How many users are there on the machine?

`Get-LocalUser | measure`

### 4.2 Which local user does this SID(S-1-5-21-1394777289-3961777894-1791813945-501) belong to?

* List `Get-Localuser` parameters:
  `(Get-Command Get-LocalUser).Parameters`
* run this command:
  `Get-LocalUser | Where-Object -Property SID -eq S-1-5-21-1394777289-3961777894-1791813945-501`

### 4.3 How many users have their password required values set to False?

* List property:
  ![img](https://i.imgur.com/EMfQ3HB.jpg)
* filter the results
  `Get-LocalUser | Where-Object -Property PasswordRequired -Match false`

### 4.5 How many local groups exist?

`Get-LocalGroup | measure`

### 4.6 What command did you use to get the IP address info?

`Get-NetIPAddress`

### 4.7 How many ports are listed as listening?

* List All connection:
  `Get-NetTCPConnection`
* FInd the parameter:
  `Get-NetTCPConnection | Get-Member`
* Find Property:
  `GEt-NetTCPConnection | Format-List -Property State`
* filter out the `matched` results
  `GEt-NetTCPConnection | Where-Object -Property State -Match Listen`
* finally count the results with `measure`
  `GEt-NetTCPConnection | Where-Object -Property State -Match Listen | measure`

### 4.8 What is the remote address of the local port listening on port 445?

`Get-NetTCPConnection` read the `IP` part!!

### 4.9 How many patches have been applied?

* run `Get-Hotfix` to get the results
* run `Get-Hotfix | measure` to get the counts

### 4.10 When was the patch with ID KB4023834 installed? (2 options to get the correct answer)

* `Get-HotFix | Where-Object -Property HotFixID -eq KB4023834`
* `Get-Hotfix -Id KB4023834`

### 4.11 Find the contents of a backup file.

* find the backup file:
  `Get-ChildItem -Path C:\ -Include *.bak* -File -Recurse -ErrorAction SilentlyContinue`

  ![img](https://i.imgur.com/0iOkxr8.png)
* read the file:
  ![img](https://i.imgur.com/TkiET61.png)

### 4.12 Search for all files containing API_KEY

* run the command:
  `Get-ChildItem C:\* -Recurse | Select-String -pattern API_KEY`

### 4.13 What command do you do to list all the running processes?

`get-process`

### 4.14 What is the path of the scheduled task called new-sched-task?

* List Tasks:
  `Get-ScheduleTask`
* view the task
  `Get-ScheduleTask -TaskName new-sched-task`

### 4.15 Who is the owner of the C:\

`Get-Acl c:/`

---
<!-- Google Ads -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
<ins class="adsbygoogle"
     style="display:block; text-align:center;"
     data-ad-layout="in-article"
     data-ad-format="fluid"
     data-ad-client="ca-pub-3526678290068011"
     data-ad-slot="7160066188"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
<!-- END -->

---

### Task 05: Basic Scripting Challenge

Now that we have run powershell commands, let's actually try write and run a script to do more complex and powerful actions. 

For this ask, we'll be using PowerShell ISE(which is the Powershell Text Editor). To show an example of this script, let's use a particular scenario. Given a list of port numbers, we want to use this list to see if the local port is listening. Open the listening-ports.ps1 script on the Desktop using Powershell ISE. Powershell scripts usually have the .ps1 file extension.

     ```powershell
     $system_ports = Get-NetTCPConnection -State Listen

     $text_port = Get-Content -Path C:\Users\Administrator\Desktop\ports.txt

     foreach($port in $text_port){

     if($port -in $system_ports.LocalPort){
          echo $port
          }

     }
     ```
On the first line, we want to get a list of all the ports on the system that are listening. We do this using the Get-NetTCPConnection cmdlet. We are then saving the output of this cmdlet into a variable. The convention to create variables is used as:

`$variable_name = value`

On the next line, we want to read a list of ports from the file. We do this using the Get-Content cmdlet. Again, we store this output in the variables. The simplest next step is iterate through all the ports in the file to see if the ports are listening. To iterate through the ports in the file, we use the following

`foreach($new_var in $existing_var){}`

This particular code block is used to loop through a set of object. Once we have each individual port, we want to check if this port occurs in the listening local ports. Instead of doing another for loop, we just use an if statement with the `-in` operator to check if the port exists the LocalPort property of any object. A full list of if statement comparison operators can be found [here](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_comparison_operators?view=powershell-6). To run script, just call the script path using Powershell or click the green button on Powershell ISE:

![img](https://i.imgur.com/eMTXaFo.png)

Now that we've seen what a basic script looks like - it's time to write one of your own. The emails folder on the Desktop contains copies of the emails John, Martha and Mary have been sending to each other(and themselves). Answer the following questions with regards to these emails(try not to open the files and use a script to answer the questions)

Scripting may be a bit difficult, but [here](https://learnxinyminutes.com/docs/powershell/) is a good resource to use

### 5.1 What file contains the password?

* a simple string search:
  `Get-ChildItem -Path "C:\Users\Administrator\Desktop\emails\*" -Recurse | Select-String -Pattern password`
* ans is the file name!

* let's write it as a script:
  
     ```powershell
     $path = "C:\Users\Administrator\Desktop\emails\*"
     $string_pattern = "password"
     $command = Get-ChildItem -Path $path -Recurse | Select-String -Pattern $String_pattern
     echo $command
     ```

### 5.2: What is the password?

* read the file to get the ans:
  ![img](https://i.imgur.com/pyg5H7n.png)

### 5.3 What files contains an HTTPS link?

* let's modify our script form [task 5.1](#51-what-file-contains-the-password)

     ```powershell
     $path = "C:\Users\Administrator\Desktop\emails\*"
     $string_pattern = "https://"
     $command = Get-ChildItem -Path $path -Recurse | Select-String -Pattern $String_pattern
     echo $command
     ```

* ans:
  ![img](https://i.imgur.com/6LlAFKt.png)

---

## Task 06: Intermediate Scripting

Now that you've learnt a little bit about how scripting works - let's try something a bit more interesting. Sometimes we may not have utilities like nmap and python available, and we are forced to write scripts to do very rudimentary tasks. Why don't you try writing a simple port scanner using Powershell. Here's the general approach to use:

* Determine the port ranges to scan
* Determine IP ranges to scan(in this case it will be localhost) and you can provide the input in any way you want
* Determine the type of scan to run(in this case it will be a simple TCP Connect Scan)

### 6.1 How many open ports did you find between 130 and 140(inclusive of those two)?

{if you know this answer please let me know, so far I am able to find 2 listenting port!!!}

---
<!-- Google Ads -->

<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
<ins class="adsbygoogle"
     style="display:block; text-align:center;"
     data-ad-layout="in-article"
     data-ad-format="fluid"
     data-ad-client="ca-pub-3526678290068011"
     data-ad-slot="7160066188"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
<!-- END -->


<script data-name="BMC-Widget" data-cfasync="false" src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js" data-id="anir0y" data-description="Support me on Buy me a coffee!" data-message="" data-color="#5F7FFF" data-position="Right" data-x_margin="18" data-y_margin="18"></script>

<!-- EOF -->
