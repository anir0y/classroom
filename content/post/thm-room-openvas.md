---
title: Try Hack Me Room Room Openvas
date: 2021-05-10T01:36:51+05:30
lastmod: 2021-05-10T01:36:51+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
cover: /img/blog.png
categories:
  - Classroom
  - TryHackMe
tags:
  - notes
  - tryhackme
  - rooms
  
draft: false
description: Try Hack ME Room OpenVas walkthough
---
![openvas logo](/img/openvas.png)

## OpenVas
<script src="https://tryhackme.com/badge/434937"></script> 
 > **Room** [Subscription Only](https://tryhackme.com/room/openvas) 

## Task 1: Introduction

OpenVAS, an application used to scan endpoints and web applications to identify and detect vulnerabilities. It is commonly used by corporations as part of their mitigation solutions to quickly identify any gaps in their production or even development servers or applications. This is not an end all be all solution but can help to get rid of any common vulnerabilities that may have slipped through the cracks.  

From the OpenVAS GitHub repository "This is the Open Vulnerability Assessment Scanner (OpenVAS) of the Greenbone Vulnerability Management (GVM) Solution. It is used for the Greenbone Security Manager appliances and is a full-featured scan engine that executes a continuously updated and extended feed of Network Vulnerability Tests (NVTs)

## Task 2: GVM Framework Architecture
As previously mentioned OpenVAS is built off the GreenBone Vulnerability Management (GVM) solution and is only one of the appliances that is released from GreenBone. 

![openvas: animesh roy blog post](https://www.greenbone.net/wp-content/uploads/01_Logo-mit-Schriftzug_500px_on_white_horiz1.jpg)

OpenVAS is a service within a larger framework of services known as Greenbone Vulnerability Management (GVM). In this task we will break down the services that make up the framework and their roles. 

![openvas GVM](https://community.greenbone.net/uploads/default/optimized/1X/901766e0fa6b6cb6aee9f4702f46fb8a703a332b_2_690x323.png)

Above is a brief visual breakdown of what the GVM framework looks like. There are many components that are apart of the architecture for the GVM framework, but we can break it down into three distinct sections: Front-End, Back-End, and Vulnerability/Information feed. These sections are further explained below.

#### Vulnerability/Information Feed (NVT, SCAP CERT, User Data, Community Feed)

This section will contain all information and vulnerability tests that come from the Greenbone Community Feed that will be the main baseline for testing against systems.  This can also include User Data provided by the user in place of Greenbone NVTs and SCAP CERTs. 

#### Back-End (OSP, OpenVAS, Targets)

The back-end infrastructure is what will be actually conducting all of the vulnerability scanning and processing data and NVTS through OpenVAS and GVM. Greenbone Vulnerability Manager will be the middle man between the scanners and the front-end user interfaces. 

#### Front-End (GSA, Web Interfaces)

This is what you interact with when you navigate to OpenVAS in your browser. The web interfaces are built off of the Greenbone Security Assistant and make life easier for an analyst or operator when working with OpenVAS or other forms of scanners through the GVM.

For more information about the GVM framework architecture check out this forum post https://community.greenbone.net/t/about-gvm-10-architecture/1231.


## Task 3: Installtion
The installation procedure for OpenVAS can vary based on how you decide to install. You can install from Kali/OpenVAS repos, install from source, or run from a docker container. For our purposes, the preferred method is to run it inside a docker container as we don't have to worry about a lot of the setup or errors that we may run into with other installation methods. 

**Option 1**: Install from Kali/OpenVAS repositories

Installing from repositories can sometimes be very simple or it can be a very painful process. For OpenVAS, the installation ranges in difficulty and can require many configurations ran. For more information about this option check out the guides below.

https://websiteforstudents.com/how-to-install-and-configure-openvas-on-ubuntu-18-04-16-04/

https://www.agix.com.au/installing-openvas-on-kali-in-2020/

**Option 2**: Install from Source

Installing from source is the least preferred option for beginners and the least optimized way of installing OpenVAS due to prerequisites and make errors. For more information about installing from source look at the [INSTALL.MD](https://github.com/greenbone/openvas-scanner/blob/master/INSTALL.md).

**Option 3**: Run from Docker (Preferred)

Docker is by far the easiest of all three installation methods and only requires one command to be run to get the client started. For this installation procedure, you will need docker installed. 

For more information about this information procedure checkout the openvas-docker project on [GitHub](https://github.com/mikesplain/openvas-docker) and [DockerHub](https://hub.docker.com/r/mikesplain/openvas/dockerfile). 

1. ``` apt install docker.io ```
2. ``` docker run -d -p 443:443 --name openvas mikesplain/openvas ```

This command will both pull the docker container and then run the container. It may take a few minutes for the container to fully set up and begin running. Once it is complete you can then navigate to https://127.0.0.1 in your preferred browser and OpenVAS will be setup and ready to go!

Below are the default credentials to access OpenVAS/GVM:

> **Username: `admin`
Password: `admin`**

If you successfully logged into OpenVAS you should see a dashboard that looks similar to the one below.

![openvas dashboard](https://i.imgur.com/a6WY4SW.png)


## Task 4: initial Configuration

Before we can start scanning and implementing OpenVAS into our vulnerability management solution we need to do a little bit of maintenance and configuration to get OpenVAS properly working. Luckily for us, OpenVAS makes the process very easy and includes a wizard to make the process straightforward. 

Begin by navigating to Scans > Tasks and clicking on the purple magic wand icon to begin the basic configuration wizard. We recommend beginning a scan on `127.0.0.1` to test out your installation and ensure it is working properly.

![openvas scan wizard](https://i.imgur.com/RbZNSC1.png)

If you successfully navigated to the wizard you should see a pop-up similar to the one above. This is where you will set up your initial scan against your localhost to ensure everything is properly configured.

The scan may take a while to complete, allow OpenVAS enough time to finish the scan, and then you will be met with a new dashboard for monitoring and analyzing your complete and ongoing scans like the one below. 
![scan result openvas](https://i.imgur.com/gMkDQww.png)

Once your scan has finished you can navigate to Scans > Reports and click on your newly created report from your previous task.

![openvas results](https://i.imgur.com/mxYWFJx.png)

If correctly configured you should see three different vulnerabilities reported all originating from OpenVAS itself. This is normal behavior and can be configured/changed to maintain your OpSec. 

## TASK 5: Scanning Infra

Now that we know that everything is working we can get into the nitty-gritty of OpenVAS and how it works. Deploy the machine and navigate to Scans > Tasks to begin creating a task to scan the provided machine.

### Creating a Task

To create a configurable task navigate to the star icon in the upper right-hand corner of the Tasks dashboard and select New Task. 

![creating task openvas](https://i.imgur.com/PNlNJuQ.png)

Once you select New Task from the dropdown you will be met with a large pop-up with many options. We will break down each of the options sections and what they can be used for.

![openvas task config](https://i.imgur.com/b8sKOYS.png)

For this task, we will be focusing only on the Name, Scan Targets, and Scanner Type, and Scan Config. In later tasks, we will be focusing on the other options for more advanced configuration and implementation/automation.

  1. Name: Allows us to set the name the scan will be known as inside of OpenVAS
  2. Scan Targets: The targets to scan, can include Hosts, Ports, and Credentials. To create a new target you will need to follow another pop-up, this will be covered later in this task.
  3. Scanner: The scanner to use by default will use the OpenVAS architecture however you can set this to any scanner of your choosing in the settings menu.
  4. Scan Config: OpenVAS has seven different scan types you can select from and will be used based on how you aggressive or what information you want to collect from your scan

### Scoping a New Target
To scope a new target, navigate to the star icon next to Scan Targets.

![openvas scope](https://i.imgur.com/ro5xv85.png)
Above is the menu for configuring a new target. The two main options you will need to configure are the Name and the Hosts. This procedure is fairly straight forward and other options will only be used in advanced vulnerability management solutions. These will be covered in later tasks.
![dvwa](https://i.imgur.com/9MHYq03.png)

Now that we have our target scoped we can continue to create our task and begin the scan.

Once you create the task you will be brought back to the scan dashboard where you can monitor and start your task. To start the task navigate to the start icon under Actions.
![animesh roy ](https://i.imgur.com/mYeVhVK.png)
![animesh roy blog post](https://i.imgur.com/0bYxIol.png)

## Task 6: Reporting and Continuous Monitoring

OpenVAS has very strong reporting and monitoring capabilities that can contribute to an efficient and optimal solution in your build or vulnerability management pipeline.

Download the provided report from a vulnerable machine to get familiar with the automated reporting capabilities of OpenVAS.

### Breaking Down the Report

The automated report from OpenVAS begins with some basic host and task information including Host, Start, End, and Vulnerability categories. It will also check for host authentications and an overall summary of open ports on the host
![](https://i.imgur.com/V4VXU3t.png)
After the basic host and task information OpenVAS will report on each of the vulnerabilities found.
![](https://i.imgur.com/CUeOtgJ.png)
In the above image, the vulnerability breakdown can give a lot of information. We can gather a summary of the vulnerability, detection details, mitigation details, and method of detection.

### Continuous Monitoring Overview

OpenVAS offers many options for continuous and scheduled monitoring/vulnerability management. If you work in a team or a pipeline this can allow you to efficiently and quickly optimize your current solutions. Examples of continuous vulnerability scanning utilities are Alerts, Schedules, and Agents. Agents are out of scope for this room but we will be covering the configuration of schedules and alerts below.

### Creating Schedules

To begin creating a schedule navigate to Configuration > Schedules and as always click on the blue star icon in the upper left-hand corner. You should see a pop-up similar to the one below.

![](https://i.imgur.com/bcNbfYj.png)
Fill out the basic information like Name, First Start Time, Period, etc. Once you have the schedule created you can now create a new Task/Scan with this created schedule attached. You can see this option below.
![](https://i.imgur.com/nitrmkz.png)

### Crafting Alerts

The process for creating alerts is very similar to creating a schedule, navigate to Configuration > Alerts and click on the blue star icon in the upper left-hand corner. You should see a pop-up similar to the one below.

![](https://i.imgur.com/y3RNl1Y.png)
You will notice that there are a lot more options than the schedule menu, don't let this intimidate you, the process is very similar and straightforward. The main options you will need to worry about are Name, Event, Condition, and To Address. The event can be configured to alert based on the status of the scan or when a new NVT/vulnerability is detected. The condition option will make sure that your inbox isn't flooded with alerts, this can be changed based on severity or filters. The To Address is fairly self-explanatory and will send an email of the alert to the specified mail address. Once created you will again need to connect the alert to a new Task/Scan. You can see the specific option below.
![](https://i.imgur.com/Hqo9W71.png)

---

## Task 7: Practical Vulnerability Management

### Case 001: MS00-What? 

In this scenario, you are assigned to a routine vulnerability management pipeline as a SOC analyst. Your automated pipeline has already pulled a scan on the server, it is up to you to analyze and identify risk in this report.

## Flags
|Questions | Flag | 
|---|---|
|When did the scan start in Case 001?|`Feb 28, 00:04:46`|
|When did the scan end in Case 001?|`Feb 28, 00:21:02`|
|How many ports are open in Case 001?|`3`|
|How many total vulnerabilities were found in Case 001? |`5`|
|What is the highest severity vulnerability found? (MSxx-xxx)|`MS17-010`|
|What is the first affected OS to this vulnerability?|`Microsoft Windows 10 x32/x64 Edition`|
|What is the recommended vulnerability detection method?|`Send the crafted SMB transaction request with fid = 0 and check the response to confirm the vulnerability`|

---


<!-- Ads code-->
---
<script type="text/javascript" language="javascript">
      var aax_size='728x90';
      var aax_pubname = 'anir0y-21';
      var aax_src='302';
    </script>
<script type="text/javascript" language="javascript" src="https://c.amazon-adsystem.com/aax2/assoc.js"></script>