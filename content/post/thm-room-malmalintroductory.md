---
title: Try Hack ME Room Malware Introductory
date: 2021-05-29T00:08:19+05:30
lastmod: 2021-05-29T00:08:19+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
cover:
  image: /img/thm.gif
  alt: "cover image"

categories:
  - TryHackMe
tags:
  - tryhackme
  - rooms
  - thm

draft: false
description: Try Hack Me Room MAL Malware Introductory solved by Animesh Roy. this is a walkthrough. read more...

---
# MAL: Malware Introductory

|Profile|Support|
|:-----|-----:|
|<script src="https://tryhackme.com/badge/434937"></script>|<a href="https://www.buymeacoffee.com/anir0y"><img src="https://img.buymeacoffee.com/button-api/?text=Cheers!!!&emoji=🍺&slug=anir0y&button_colour=BD5FFF&font_colour=ffffff&font_family=Lato&outline_colour=000000&coffee_colour=FFDD00"></a>|

---

## Task 01: What is the Purpose of Malware Analysis?

Malware is such a prevalent topic within Cybersecurity, and often an unfortunately recurring theme among global news today.

Not only is malware analysis a form of incidence response, but it is also useful in understanding how the behaviours of variants of malware result in their respective categorisation. This room will be a practical introduction to the techniques and tools used throughout malware analysis - albeit brief, I hope to expand on these techniques a lot more in-depth within the future.

When analysing malware, it is important to consider the following:

* Point of Entry (PoE) I.e. Was it through spam that our e-mail filtering missed and the user opened the attachment? Let's review our spam filters and train our users better for future prevention!
* What are the indicators that malware has even been executed on a machine? Are there any files, processes, or perhaps any attempt of "un-ordinary" communication?
* How does the malware perform? Does it attempt to infect other devices? Does it encrypt files or install anything like a backdoor / Remote Access Tool (RAT)?
* Most importantly - can we ultimately prevent and/or detect further infection?!

---

## Task 02: Understanding Malware Campaigns

Despite the many variants of malware, attacks can generally be classified into two types: Targeted and Mass Campaign.

### Targeted

A "Targeted" attack is just that - targeted. In most cases, malware attacks that occur this way are created for a specific purpose against a specific target. A great example of this type of purpose could be the [DarkHotel](https://www.kaspersky.co.uk/resource-center/threats/darkhotel-malware-virus-threat-definition) malware, whom is designed to steal information such as authentication details from government officials.

### Mass Campaign

On the other hand, the "Mass Campaign" classification can be akin to many real life examples, and is the most common type of attacks. The entire purpose of this type of Malware is to infect as many devices as possible and perform whatever it may - regardless of target.

Companies such as Kaspersky to name one, track these campaigns (known as Advanced Persistent Threats (APTs) and often report on their infection rate and indicators, much akin to the real-life spread of a virus from the World Health Organisation (WHO). 

Kaspersky [report on the "Crouching Yeti (Energetic Bear)](https://www.kaspersky.co.uk/resource-center/threats/crouching-yeti-energetic-bear-malware-threat)" campaign, this campaign specifically targets the following:

* Industrial/machinery
* Manufacturing
* Pharmaceutical
* Construction
* Education
* Information technology

(Kaspersky)

Whilst it this variant is technically targeted, there is a rather large scope of this variant of malware, and as such, can be considered as a "Mass Campaign" attack.

### Flags 2
|Flag ID|Questions|Ans|
|-|:---:|:---|
|1|What is the famous example of a targeted attack-esque Malware that targeted Iran?|`stuxnet`|
|2|What is the name of the Ransomware that used the Eternalblue exploit in a "Mass Campaign" attack?|`wannacry`|

---

## Task 03: Identifying if a Malware Attack has Happened

Much like any interaction with an Operating System, there is always remnants of such activity even if there is little trace...

Unfortunately, malware (dependant on its variant) is largely obtrusive - in the sense that it leaves quite an extensive papertrail of evidence...Perfect for us analysers!

The ultimate process of a malware attack can be broken down into a few broad steps:
1. Delivery 
2. Execution
3. Maintaining persistence (not always the case!)
4. Propagation (not always!)

These steps will generate lots of data. Namely: network traffic such as communicating with hosts, file system interaction like read/writes and modification.

Malware is essentially classified based upon the behaviours it produces to perform the steps listed above. For a famous example, Wannacry performs all four of these steps.

### 1. Delivery

This could be of many methods, to name a few: USB (Stuxnet!), PDF attachments through "Phising" campaigns or vulnerability enumeration.

### 2. Execution

Here's the main part of how we classify Malware. What does it actually do? If it encrypts files - it's Ransomware! If it records information like keystrokes or displays adware - we can classify it as Spyware.

We only understand this stage through analysing the sample, which is why analysis is important - and is what we'll be covering

### 3. Maintaining Persistence

It wouldn't make much sense for Malware authors to go through all the trouble of developing a piece of code that is capable of execution - just for it to execute and that's it...Gone. Unless you have a very specific agenda ([Cerber](https://blog.malwarebytes.com/detections/ransom-cerber/)).

I have submitted an extensive report on this specific Malware, amongst others for a University Module on Malware Analysis...however I will wait for it to be marked before sharing. 

Imagine a keylogger has been installed, but you then restart your Computer 30 seconds later. Unless you've entered a lot of sensitive information in 30 seconds - that'll be of no use to the author.

### 4. Persistence

This stage is largely why Malware is so "noisy", Malware employs many techniques, of which we'll be covering in-depth much later on. Essentially, this stage is just to make sure that the "execution" is worth its while.

### 5. Propagation

Hey...If you can infect one device, why not infect more whilst you're at it? Again, this is another reason why Malware can be so noticeable. Host discovery generates a lot of network traffic, we'll come to this later.

In Summary, there are two categories of fingerprints that malware may leave behind on a Host after an attack:

### Host-Based Signatures

These are generally speaking the results of execution and any persistence performed by the Malware. For example, has a file been encrypted? Has any additional software been installed? These can are two of many, many host-based signatures that are useful to know to prevent and check against further infection.

### Network-Based Signatures

At an overview, this classification of signatures are the observation of any networking communication taking place during delivery, execution and propagation. For example, in Ransomware, where has the Malware contacted for Bitcoin payments?

Such as in the case of Wannacry, looking for a large amount of "Samba" Protocol communication attempts is a great indication of infection due to its use of "[Eternalblue](https://research.checkpoint.com/2017/eternalblue-everything-know/)".

### Flags 3
|Flag ID|Questions|Ans|
|-|:---:|:---|
|1|Name the first essential step of a Malware Attack?|`Delivery`|
|2|Now name the second essential step of a Malware Attack?|`Execution`|
|3|What type of signature is used to classify remnants of infection on a host?|`host-based signature`|
|4|What is the name of the other classification of signature used after a Malware attack?|`Network-Based Signatures`|

---

## Task 04: Static Vs. Dynamic Analysis

There are two categories used when analysing malware, these are:

1. Static Analysis

2. Dynamic Analysis

Whilst the methods and tools used for these two categories are vastly different, they are essential in compositing an understanding of how a malware behaves.

### Static Analysis.

At its brief, "Static Analysis" is used to gain a high-level abstraction of the sample - it can be fairly simple to decide if a piece of code is "malicious" or not with this method alone (but not always, this will be discussed later...). At its core, this method is of the analysis of the sample at the state it presents itself as, without executing the code.

Employing the use of techniques such as signature analysis via checksums means quick, efficient (albeit extremely brief) and safe analysis of malware.

### Dynamic Analysis

This step is a lot more involved, and is where the abstraction of the sample is largely built upon. "Dynamic Analysis" essentially involves executing the sample and observing what happens. This of course is not safe. If the sample turns out to be "Ransomware" - you've now lost your files. If it is capable of propagating via traversing a network, nice...You've now just infected your Local Area Network (LAN).

Please note that these are extremely simplistic explanations of these techniques, there is a lot more involved which we will go throughout this series.

--- 

## Task 05: Discussion of Provided Tools & Their Uses

You will see that some tools will overlap between Static and Dynamic analysis:

Provided Static Analysis Tools:

`C:\Users\Analysis\Desktop\Tools\Static\PE Tools`

* Dependency Walker (depends)
* PeID
* PE Explorer
* PEview
* ResourceHacker

`C:\Users\Analysis\Desktop\Tools\Static\Disassembly`

* IDA Freeware
* WinDbg

`C:\Users\Analysis\Desktop\Tools\Sysinternalsuite`

* ResourceHacker

`C:\Users\Analysis\Desktop\Tools\Dynamic`

The tools listed here will be used for future tasks, as they involve debugging which is currently out-of-scope for this room...However, will be explored later within the series.

---

## Task 06: Connecting to the Windows Analysis Environment (Deploy) 

---

## Task 07: Obtaining MD5 Checksums of Provided Files

MD5 "Checksums" are a prominent attribute in the malware Community. Because there can be many variants of a family of Ransomware, these MD5 "Checksums" are cryptographic "fingerprints" of the files. This allows a uniformed identification throughout the community - especially with automated Sandboxes. 

For example, say you have 20 files of unknown origin, you are able to identify their genus using their MD5 sum against websites such as [Virustotal](https://www.virustotal.com/gui/), if that MD5 "Checksum" has been previously analyzed - removing all the legwork for us!

Navigate to the "Tasks" Folder on the Desktop, and then enter the "Task 7" Directory, where there will be three files:
- aws.exe
- NetLog.exe
- vlc.exe

Sure, these are common names of executables, but anyone can name an executable as whatever they like! Just because it says "vlc" doesn't mean it is indeed the VLC application! This is where identifying their MD5 Checksum is useful, as no matter the name - their MD5 reveals its true identity.

I have installed the "[HashTab](http://implbits.com/products/hashtab/)" application, which calculates a files MD5 sum - amongst others, directly within Windows Explorer as if you were inspecting its properties...

![hashtab](https://i.imgur.com/e5xemTO.png)

### Your Task:

Identify the MD5 Checksums of the three files provided in "Task 7" (You can use Ctrl + C & Ctrl + V over RDP)

### Flags 7

I used certutil.exe to complete the task:

![](https://i.imgur.com/oS5CK6Q.png)

---

## Task 08: Now lets see if the MD5 Checksums have been analysed before

Outside of the Remote Windows Environment  i.e. Kali or your Windows PC, look up those MD5 "Checksums" on Virustotal to solve this task:

### flg 8
![](https://i.imgur.com/kx8gxmf.png)

---

## Task 09: Identifying if the Executables are obfuscated / packed

There are a few provided tools on this Windows instance that are capable of identifying the compiler / packer of a file. However, PeID has a huge database and is a great tool for this.

Moreover, just because a file doesn't have the ".exe" extension, doesn't mean it isn't an actual executable! For instance, it can have the ".jpg" extension and still be an executable piece of code. This is a tad-bit out of scope for this room specifically, but essentially, files have identifying attributes within its hex - known as file headers.

E.g. The hex value for an executable is always "4D 5A". So if a file with a ".jpg" file has the hex header of "4D 5A", then it is obviously not a jpg file. You can read more into file headers / trailers [here](https://www.garykessler.net/library/file_sigs.html), which are great resources for data carving in file forensics / recovery.

**Provided Tools: PeID**

Now using "PeID", identify the compiler / packer of the following two files in the Directory "Tasks/Task 9"  to answer the questions.   
![](https://i.imgur.com/tkj30Rv.png)
An example of using PEiD to identify the packer of a file. In this case, it is reported as "Microsoft Visual C++ 6.0"

### Flags-9
|Flag ID|Questions|Ans|
|-|:---:|:---|
|1|What does PeID propose 1DE9176AD682FF.dll being packed with|`MicroSoft Visual C++ 6.0 DLL`|
|2|What does PeID propose AD29AA1B.bin being packed with?|`Microsoft Visual C++ 6.0`|


#### Flag-9.1
![](https://i.imgur.com/tkj30Rv.png)

#### Flag-9.2
![](https://i.imgur.com/6nir5bY.png)

---

## Task 10: What is Obfuscation / Packing?

### Theory:

Packing is one form of obfuscation that malware Authors employ to prevent the analysis of programmes. There are both legitimate and malicious reasons as to why the Author of a program will want to prevent the decompiling of their program. 

For example, a legitimate reason is the protection of intellectual property! Whilst I'm one for open-source as much as the next person here - alas not every organisation has the same mindset...but let's leave that aside.

In the same token, just because you write a program...Why should everyone have the right to "copy" your project? This is one of the justifiable reasons for obfuscation - it is yours at the end of the day! 

However, malware Authors employ obfuscation techniques such as packing - whilst for the same reasons, they do so with the intent to prevent people like us reversing it to understand its behaviours and ultimately with the aims of achieving infection.

How packing works is out of scope for this room, but I hope to be able to delve into topics like these later on within THM, so that you can understand the theory behind the practical skills you'll be using. 

### Practical:

Your task is to identify whether or not the file "6F431F46547DB2628" located in the Directory of "Tasks\Task 10" is packed using the tool "PeID" akin to the task you just completed!

### Flags 10
|Flag ID|Questions|Ans|
|-|:---:|:---|
|1|What packer does PeID report file "6F431F46547DB2628" to be packed with?|`FSG 1.0 -> dulek/xt`|

#### Flag-10.1
![](https://i.imgur.com/DJFAKEd.png)

---

## Task 11: Visualising the Differences Between Packed & Non-Packed Code

This is another example of why PeID is a fantastic little tool. With its huge dataset of known packers, it is arguably one of the better ones at being able to fingerprint the names of packers / obfuscators within an application.

Whilst this tool has a huge database, it doesn't have every packer out there! Especially say if an Author has written their own - PeID will have no way of identifying the packer used. In cases like this, it's more about what PeID doesn't tell us - rather than what it does.

### Practical:

You can try this yourself by navigating to directory "Tasks/Task 11" and dragging and dropping that file into PeID. What does it tell us?    
![](https://i.imgur.com/JVOrgcz.png)

In this instance, PeID is able to detect what packer has been used to obfuscate the code.  Whilst PeID is capable of detecting the possibility of packers being used, it is not able to automatically de-obfuscate them. This is a process we will have to do manually - at a later stage.

After confirming that this file is indeed packed, let's open it up with a tool called IDA Freeware. This is located in the "Tools/Static/Disassembly" directory (or you can search for it through Windows Toolbar). Notice how there is a very minimal amount of information provided to us? For example, the "Imports" tab is practically empty! Little odd...right?

When opening the file, a few dialogue boxes may appear - its just IDA Freeware processing the file, it'll take a couple of seconds

![](https://i.imgur.com/GJZPTRK.png)

![](https://i.imgur.com/q8MknAs.png)

We can see there are only two "Imports" in this program! That's a bit bizarre...

...The use of "IDA Free" will be developed upon as it is an advanced bit of kit. But essentially, we can see the flow of how the program executes - indicated by the arrows. The problem? There's very little here! There are a few more characteristics that indicate its packed, but this is also beyond the scope for this room. 

![](https://i.imgur.com/YtCCrw1.png)

Whereas, if we were to open a file that isn't obfuscated, we should expect to see a much larger import count and graph/flowchart, like this:

![](https://i.imgur.com/yOyFwrJ.png)

![](https://i.imgur.com/XM6eSBr.png)

See how there's so much more information here? Obfuscated code is much harder to analyze at least at the static level, as we're presented with very little information!

---

## Task 12: Introduction to Strings

### Theory:

"Strings" are essentially the ASCII / Text contents of a program...this could be anything from passwords for self-extracting zips, to bitcoin addresses in ransomware samples.

Such as that in the example above, when analysing the contents of these strings, we can sometimes paint a fairly indicative picture of the behaviours of the programme - bitcoin wallets being used in ransomware.

### Task: 

Open a Command prompt on the Windows Machine and navigate to the directory "Tools\Sysinternalssuite"

`cd C:\Users\Analysis\Desktop\Tools\SysinternalsSuite`

Keep this terminal open.

We're going to use Microsoft's Sysinternals "Strings" program to output the retained strings within the specified file in "Task 12". We can do this by:

`strings "C:\Users\Analysis\Desktop\Tasks\Task 12\67844C01"`

You will receive a whole load of text, most of it looks like nonsense...But there is some text in there that is valuable. Scroll up!

![](https://i.imgur.com/PZBczF7.png)

Proceed to answering Question 1.

You'll find that programs often contain large amount of strings and using the "strings" tool from sysinternals may only display 10% of these...

...That and it's not exactly practical scrolling up through a terminal for stuff like this - we are on Windows afterall! There's a GUI tool for that.

Launch the application within "Tools/Static/PE Tools/PE Explorer" and drag and drop the same file "67844C01" from the previous question into the application.

![](https://i.imgur.com/XDmSuSX.png)

Where you will be presented with the following, indicating that it has successfully imported:

![](https://i.imgur.com/822wO58.png)

After import. Navigate to "View -> Imports"

![](https://i.imgur.com/jQr7zsI.png)

![](https://i.imgur.com/YFI42EL.png)

You can now answer Question #2!

### Flags 12

|Flag ID|Questions|Ans|
|-|:---:|:---|
|1|What is the URL that is outputted after using "strings"|`practicalmalwareanalysis.com`|
|2|How many unique "Imports" are there?|`5`|

#### 12.1 
![](https://i.imgur.com/MrCYVbE.png)

#### 12.2
![](https://i.imgur.com/IrSUgL1.png)

--- 

## Task 13: Introduction to Imports

### Theory:

The classification of IDA Freeware is arguable as the tool can be used for both static and dynamic analysis. Without going too in-depth regarding the differences, there are two classifications of tools like IDA Freeware:

* Disassemblers
* Debuggers
  
I'll allow you to explore the differences between these two types of tools and their use cases in your own time, but for contextual sake - Disassemblers reverse the compiled code of a program from machine code to human-readable instructions (assembly). This is limited to how the program represents itself in its current state! I.e. If the contents of an executable changes during execution - "Disassemblers" will not reflect this.

Whilst Debuggers deploy the same techniques used by "Disassemblers", "Debuggers" essentially facilitate execution of the program - where the analyser can view the changes made throughout each "step" of the program. These tools are great because a true picture of the program presents itself. However, if it is indeed malicious, you have now infected yourself.

With enough understanding, an analyser can introduce "breakpoints" (or pauses) at various stages of a program, where the program will execute up until a breakpoint. For example, sticking with the idea of Ransomware, an analyser can create a "breakpoint" within the application prior to the actual stage of encryption of files. This facilitates an analyser to view the various changes of a program during execution (such as unpacking or connecting to a remote server such as that in a botnet) up until the point of malicious infection.

### Practical:

For this room, we will be using IDA Freeware within the context of statistical analysis. I'll walkthrough how to import an executable into IDA Freeware below.

1. Lets launch "IDA Freeware" and select the file to import, in this case we'll be using "uninstall.exe"

![](https://i.imgur.com/vmv9Xsc.png)

And navigate to the file...

![](https://i.imgur.com/G3VAJc1.png)

2. Since we know it is an executable file, we select "Portable executable for 80386 (PE) [pe64.dll]"

![](https://i.imgur.com/I9TUxXi.png)

3. After pressing "OK" the application will load. Allow a few minutes for the executable to be decompiled.

![](https://i.imgur.com/wbQGqxH.png)

There are various tabs, similar to what we saw in "PE Explorer" i.e. "Imports" and "Exports".

### Task:

Navigate to the directory "Tasks/Task 13" and open "install.exe" with IDA Freeware, just like we did in the example above. Again, this may take a few seconds to a couple of minutes to compute dependant upon the size of the application. For this task expect roughly ~20 seconds.

You can now answer the question below:

### Flags 13

|Flag ID|Questions|Ans|
|-|:---:|:---|
|1|How many references are there to the library "msi" in the "Imports" tab of IDA Freeware for "install.exe"|`9`|

#### 13.1
![](https://i.imgur.com/OJ9pGIR.png)

---

## Task 14: Practical Summary

The file specified for analysis is "ComplexCalculator.exe" in the Directory "Tasks/Task 14". I'll leave it up to you to figure out what tool(s) out of what we've used above is best!

### Flags 14

|Flag ID|Questions|Ans|
|-|:---:|:---|
|1|What is the MD5 Checksum of the file?|`f5bd8e6dc6782ed4dfa62b8215bdc429`|
|2|Does Virustotal report this file as malicious? (Yay/Nay)|`yay`|
|3|Output the strings using Sysinternals "strings" tool What is the last string outputted?|`D:H:`|
|4|What is the output of PeID when trying to detect what packer is used by the file?|`Nothing Found`|

### 14.1 
![](https://i.imgur.com/6bQqLB6.png)

### 14.2
![](https://i.imgur.com/FwlR0ld.png)

### 14.4 
![](https://i.imgur.com/4qwKCKw.png)


------