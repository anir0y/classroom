---
title: Try Hack Me Room Windows Event Logs
date: 2021-05-13T15:04:07+05:30
lastmod: 2021-05-13T15:04:07+05:30
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
description: Try Hack ME Room Windows Event Logs walkthough
---

---
## Windows Event Logs
<script src="https://tryhackme.com/badge/434937"></script>  

---

## TASK 01: What are event logs?

Per Wikipedia, "Event logs record events taking place in the execution of a system to provide an audit trail that can be used to understand the activity of the system and to diagnose problems. They are essential to understand the activities of complex systems, particularly in applications with little user interaction (such as server applications)."

This definition would apply to system administrators, IT technicians, desktop engineers, etc. If the endpoint is experiencing an issue, the event logs can be queried to see any clues about what led to the issue. The operating system, by default, writes messages to these logs.

As defenders (blue teamers), there is another use case for event logs. "It can also be useful to combine log file entries from multiple sources. This approach, in combination with statistical analysis, may yield correlations between seemingly unrelated events on different servers."

This is where SIEMs (Security information and event management) such as Splunk and Elastic come into play.

If you don't know exactly what a SEIM is used for, below is a visual overview of its capabilities. (Image credit: [Varonis](https://www.varonis.com/blog/what-is-siem/))
![](https://assets.tryhackme.com/additional/win-event-logs/siem.png)

Even though it's possible to access a remote machine's event logs, this will not be feasible with a large enterprise environment. Instead, one can view the logs from all the endpoints, appliances, etc., in a SIEM. This will allow you to query the logs from multiple devices instead of manually connecting to a single device to view its logs.

Windows is not the only operating system that uses a logging system. Linux and macOS do as well. For example, on Linux systems, the logging system is known as Syslog

---
## Flags: n/a
---
## TASK 02: Event Viewer

The Windows Event Logs are not text files that can be viewed using a text editor. However, the raw data can be translated into XML using the Windows API. The events stored in these log files are stored in a proprietary binary format with a .evt or .evtx extension. The log files with the .evtx file extension typically reside in `C:\Windows\System32\winevt\Logs`.

There are 3 main ways of accessing these event logs within a Windows system:
1. Event Viewer (GUI-based application)
2. Wevtutil.exe (command-line tool)
3. Get-WinEvent (PowerShell cmdlet)   

Each method of accessing the event logs has its pros and cons. In this section, we'll look at the Event Viewer first.

In any Windows system, the Event Viewer (an MMC [Microsoft Management Console] snap-in) can be launched by simply right-clicking the Windows icon in the taskbar and selecting Event Viewer.   
![](https://assets.tryhackme.com/additional/win-event-logs/start-event-viewer.png)

For the savvy sysadmins that use the CLI much of their day, Event Viewer can be launched by typing `eventvwr.msc`.

Event Viewer has 3 panes.
1. The pane on the left provides a hierarchical tree listing of the event log providers.
2. The pane in the middle will either display a general overview and summary or the events specific to a selected provider.
3. The pane on the right is the actions pane.  

There are 5 types of events that can be logged. Below is a table from docs.microsoft.com providing a brief description for each.   
![](https://assets.tryhackme.com/additional/win-event-logs/five-event-types.png)  

On the left pane, the standard logs are visible under Windows Logs. Below is a table from docs.microsoft.com providing a brief description for each.   
![](https://assets.tryhackme.com/additional/win-event-logs/standard-event-logs.png)   
The next section is the Applications and Services Logs. Expand this section and drill down on `Microsoft > Windows > PowerShell > Operational`.

PowerShell will log operations from the engine, providers, and cmdlets to the Windows event log.

Right-click on Operational then Properties.   
![](https://assets.tryhackme.com/additional/win-event-logs/operational-properties.png)  

Within Properties, you see the log location, log size, and when it was created, modified, and last accessed. Within the Properties window, you can also see the maximum set log size and what action to take once the criteria are met. This concept is known as log rotation. These are discussions held with corporations of various sizes. How long to keep logs and when it's permissible to overwrite the logs with new data.

Lastly, notice the Clear Log button at the bottom right. There are legitimate reasons to use this button, but adversaries will likely attempt to clear the logs to go undetected.  Note: This is not the only method to clear the event logs for any given event provider.

Focus your attention on the middle pane. Remember from earlier that this pane will display the events specific to a selected provider. In this case, **PowerShell/Operational**.
![](https://assets.tryhackme.com/additional/win-event-logs/posh-operational-1b.png)   

From the above image, notice the event provider's name and the number of events logged. In this case, there are 44 events logged. You might see a different number. No worries, though.

A brief explanation for each column:
 * The first column is Level, which is the event type. Recall from earlier there are 5 different event types. This first entry is labeled as Information.
 * Next is Date and Time, which is when the event was logged.
 * The third column Source is the name of the software that logs the event. From the above image, the source is PowerShell.
* Events are identified by IDs (Event ID), which is the fourth column. Note that Event IDs are not unique. Meaning that Event ID 4103 in the above image is related to Executing Pipeline but will have an entirely different meaning in another event log.
* Lastly is Task Category, which is an Event Category. This entry will help you organize events so Event Viewer can filter them. The event source defines this column.
* The middle pane has a split view. For any event, you click on the event, and more information is displayed in the bottom half of the middle pane.

This section has 2 tabs: **General** and **Details**.
* General is the default view, and the rendered data is displayed.
* The Details view has 2 options: Friendly view and XML view.  

Below is a snippet of the General view.  
![](https://assets.tryhackme.com/additional/win-event-logs/posh-operational-2.png)   
![](https://assets.tryhackme.com/additional/win-event-logs/posh-operational-3.png)

Lastly, take a look at the Actions pane. There are several options available, but we'll only focus on a few. Please examine all the actions that can be performed at your own leisure if you're not familiar with MMC snap-ins.

As you should have noticed, within the Actions pane, you can open a saved log. This is useful if the remote machine can't be accessed. The logs can be provided to the analyst.  You will perform this action a little later. 

The Create Custom View and Filter Current Log are nearly identical. The only difference between the 2 is that the `By log` and `By source` radio buttons are grayed out in Filter Current Log. Reason for that? The filter you can make with this specific action only relates to the current log. Hence no reason for 'by log' or 'by source' to be enabled.

Why are these actions useful? Say, for instance, you don't want all the events associated with PowerShell/Operational cluttering all the real estate in the pane. Maybe you're only interested in 4104 events. That is possible with these 2 actions. 

To view event logs from another computer, right-click  
`Event Viewer (Local) > Connect to Another Computer...`
![](https://assets.tryhackme.com/additional/win-event-logs/remote-computer.png)


---
## Flags 

|Questions | Flag | 
|---|---|
|For the questions below, use Event Viewer to analyze Microsoft-Windows-PowerShell/Operational log.|`NA`|
|What is the Event ID for the first event?|`40961`|
|Filter on Event ID 4104. What was the 2nd command executed in the PowerShell session?|`whoami`|
|What is the Task Category for Event ID 4104?|`EXECUTE A REMOTE COMMAND`|
|For the questions below, use Event Viewer to analyze the Windows PowerShell log.|`N/A`|
|What is the Task Category for Event ID 800?|`Pipeline Execution Details`
---

## TASK 03: wevtutil.exe

Ok, you played around with Event Viewer. Imagine you have to sit there and manually sift through hundreds or even thousands of events (even after filtering the log). Not fun. It would be nice if you could write scripts to do this work for you. We will explore some tools that will allow you to query event logs via the command line and/or PowerShell.

Let's look at wevtutil.exe first. Per Microsoft, the wevtutil.exe tool "enables you to retrieve information about event logs and publishers. You can also use this command to install and uninstall event manifests, to run queries, and to export, archive, and clear logs."

As with any tool, access its help files to find out how to run the tool. An example of a command to do this is `wevtutil.exe /?`.    
![](https://assets.tryhackme.com/additional/win-event-logs/wevtutil2.png)   

From the above screenshot, under Usage, you are provided a brief example of how to use the tool.

In this example, `ep` (enum-publishers) is used. This is a command for wevtutil.exe.

The other commands are...   
![](https://assets.tryhackme.com/additional/win-event-logs/wevtutil-commands.png)   

Lastly, within the help information for wevtutil.exe are Common options.    
![](https://assets.tryhackme.com/additional/win-event-logs/wevtutil-options.png)   

Notice at the bottom of the above snapshot, wevtutil COMMAND /?. This will provide additional information specific to a command.

Let's get more information on the command qe (query-events).    
![](https://assets.tryhackme.com/additional/win-event-logs/wevtutil-query-events.png)   

Look over the information within the help menu to fully understand how to use this command.

Ok, great! You have enough information to use this tool—time to answer some questions. It is always recommended to look into the tool and its related information at your own leisure. 

Note: You can get more information about using this tool further but visiting the online help documentation [docs.microsoft.com](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/wevtutil).


---
## Flags
|Q|Questions | Flag | 
|-|---|---|
|1|How many log names are in the machine? |`1071`|
|2|What is the definition for the query-events command?|`Read events from an event log, log file or using structured qyery.`|
|3|What option would you use to provide a path to a log file?|`/lf:true`|
|4|What is the VALUE for /q?|`Xpath Query`|
|5|N/A|`---`|
|6|What is the log name?|`application`|
|7|What is the /rd option for?|`Event read direction`|
|8|What is the /c option for?|`Maximum number of events to read`|

---

## Explanation: 
### Flag 1: 
![](https://i.imgur.com/CxHOZpE.png)

### Flag 3: 
![](https://i.imgur.com/fLOLasn.png)

### Flag 4: 
![](https://i.imgur.com/ANAZxTL.png)
> outPut of wevutil.exe qe /?

### Flag 7 / Flag 8 
![](https://i.imgur.com/W07xC9W.png)
> output of wevutil.exe qe rd /?
---
## TASK 04: Get-WinEvent
Now we'll examine a PowerShell cmdlet called Get-WinEvent. Per Microsoft, the Get-WinEvent cmdlet "gets events from event logs and event tracing log files on local and remote computers."

A more detailed explanation:
![](https://assets.tryhackme.com/additional/win-event-logs/get-winevent-desc.png)

**Note**: The **Get-WinEvent** cmdlet replaces the **Get-EventLog** cmdlet. 

As with any new tool, in this case that tool is a PowerShell cmdlet; it's good practice to read the Get-Help documentation to become acquainted with its capabilities. Please refer to the Get-Help information online [docs.microsoft.com](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.diagnostics/get-winevent?view=powershell-5.1). 

Look over the examples provided in the Get-Help documentation. Some tasks might require some PowerShell-fu, while others don't. Even if your PowerShell-fu is not up to par, fret not; each example has a detailed explanation of the commands/cmdlets used. 

Let's talk a bit about filtering.

Generally speaking, you can filter event logs as such  ``` 
Get-WinEvent -LogName Application | Where-Object { $_.ProviderName -Match 'WLMS' }```.   
![](https://assets.tryhackme.com/additional/win-event-logs/wlms.png)



Tip: If you are ever working on a Windows evaluation virtual machine that is cut off from the Internet eventually, it will shut down every hour. ;^) 

When working with large event logs, per Microsoft, it's inefficient to send objects down the pipeline to a Where-Object command. The use of the Get-WinEvent cmdlet's FilterHashtable parameter is recommended to filter event logs.  

The image below is of the same command a few lines above but instead of using the Where-Object cmdlet the FilterHashtable is used instead.    
![](https://assets.tryhackme.com/additional/win-event-logs/wlms-2.png)

In case you're wondering, the results will between the 2 commands above are the same.

The syntax of a hash table is as follows: ![](https://assets.tryhackme.com/additional/win-event-logs/hash-table-2.png)   
Guidelines for defining a hash table is as follows: ![](https://assets.tryhackme.com/additional/win-event-logs/hash-table.png)


Note: You don't need to use a semicolon if you separate each key/value with a new line as in the screenshot above for the -FilterHashtable for `ProviderName='WLMS`'. 

Below is a table that displays the accepted key/value pairs for the Get-WinEvent FilterHashtable parameter.   
![](https://assets.tryhackme.com/additional/win-event-logs/filter-hashtable.png)


When building a query with a hash table, Microsoft recommends building the hash table one key-value pair at a time. 

Event Viewer can provide quick information on what you need to build your hash table.   
![](https://assets.tryhackme.com/additional/win-event-logs/build-hash-table.png)


Based on this information, the hash table will look as follows:   
![](https://assets.tryhackme.com/additional/win-event-logs/msi-installer.png)



For more information on creating Get-WinEvent queries with FilterHashtable, check the official Microsoft documentation [docs.microsoft.com](https://docs.microsoft.com/en-us/powershell/scripting/samples/Creating-Get-WinEvent-queries-with-FilterHashtable?view=powershell-7.1).

Since we're on the topic of Get-WinEvent and FilterHashtable, here is a command that you might find useful (shared by @mubix): `Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-PowerShell/Operational'; ID=4104} | Select-Object -Property Message | Select-String -Pattern 'SecureString'`

You can read more about creating hash tables in general [docs.microsoft.com. ](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_hash_tables?view=powershell-7.1)

---
## Flags
|q|Questions | Flag | 
|-|---|---|
|1|Answer the following questions using the [online](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.diagnostics/Get-WinEvent?view=powershell-7.1) help documentation for Get-WinEvent|`---`|
|2|Execute the command from Example 1 (as is). What are the names of the logs related to OpenSSH?|`openssh/admin,openssh/oprational`|
|3|Execute the command from Example 7. Instead of the string *Policy* search for *PowerShell*. What is the name of the 3rd log provider?|`Microsoft-Windows-PowerShell-DesiredStateConfiguration-FileDownloadManager`|
|4|Execute the command from Example 8. Use Microsoft-Windows-PowerShell as the log provider. How many event ids are displayed for this event provider?|`192`|
|5|How do you specify the number of events to display?|`MaxEvents`|
|6|When using the FilterHashtable parameter and filtering by level, what is the value for Informational?|`4`|

## Explanation:

### Flag 2: 
![](https://i.imgur.com/zEtEzBC.png)

### Flag 3:
![](https://i.imgur.com/CbSXKA9.png)


---

## TASK 05 : XPath Queries

The W3C created XPath (or XML Path Language). The Windows Event Log supports a subset of [XPath 1.0](https://www.w3.org/TR/1999/REC-xpath-19991116/). 

Below is an example XPath query along with its explanation:  
![](https://assets.tryhackme.com/additional/win-event-logs/xpath-1.png)

Based on the [docs.microsoft.com](https://docs.microsoft.com/en-us/windows/win32/wes/consuming-events#xpath-10-limitations), an XPath event query starts with '*' or 'Event'.

The above screenshot confirms this. But how do we construct the rest of the query? Luckily the Event Viewer can help us with that. 

Let's create an XPath query for the same event from the previous section. Note that both wevtutil and Get-WinEvent support XPath queries as event filters. 
![](https://assets.tryhackme.com/additional/win-event-logs/xpath-2.png)



Draw your attention to the bottom half of the middle pane. In the Event Viewer section, the Details tab was briefly touched on. Now you're going to see how the information in this section can be of use.   

Click on the Details tab and select the XML View radio button. Don't worry if the details of the log you are viewing are slightly different. The point is to understand how to use the XML View to construct a valid XPath query.
![](https://assets.tryhackme.com/additional/win-event-logs/xpath-3a.png)


The first tag is the starting point. This can either be an * or the word Event.

The command so far looks like this: `Get-WinEvent -LogName Application -FilterXPath '*'`
![](https://assets.tryhackme.com/additional/win-event-logs/xpath-3b.png)



Now we work our way down the XML tree. The next tag is System.

Let's add that. Now our command is: `Get-WinEvent -LogName Application -FilterXPath '*/System/'`

Note: Its best practice to explicitly use the keyword System but you can use an * instead as with the Event keyword. The query -FilterXPath '*/*' is still valid. 

The Event ID is 100. Let's plug that into the command.   
![](https://assets.tryhackme.com/additional/win-event-logs/xpath-3c.png)



Our command now is: ```Get-WinEvent -LogName Application -FilterXPath '*/System/EventID=100'```   
![](https://assets.tryhackme.com/additional/win-event-logs/xpath-3d.png)



Below is a screenshot of using wevtutil.exe and XPath to query for the same event log and ID. 
![](https://assets.tryhackme.com/additional/win-event-logs/xpath-4.png)



Note: 2 additional parameters were used in the above command. This was done to retrieve just 1 event and for it not to contain any XML tags.

If you want to query on a different element, such as Provider Name, the syntax will be different. To filter on the provider, we need to use the Name attribute of Provider. 

The XPath query is:  

`Get-WinEvent -LogName Application -FilterXPath '*/System/Provider[@Name="WLMS"]'`
![](https://assets.tryhackme.com/additional/win-event-logs/xpath-5.png)


What if you want to combine 2 queries? Is this possible? The answer is yes.

Let's build this query based on the screenshot above. The Provider Name is WLMS, and based on the output; there are 2 Event IDs. 

This time we only want to query for events with Event ID 101. 

The XPath query would be `Get-WinEvent -LogName Application -FilterXPath '*/System/EventID=101 and */System/Provider[@Name="WLMS"]'`
![](https://assets.tryhackme.com/additional/win-event-logs/xpath-6.png)


Lastly, let's discuss how to create XPath queries for elements within EventData. The query will be slightly different.

Note: The EventData element doesn't always contain information.

Below is the XML View of the event for which we will build our XPath query.   
![](https://assets.tryhackme.com/additional/win-event-logs/xpath-7b.png)



We will build the query for TargetUserName. In this case, that will be System. 

The XPath query would be `Get-WinEvent -LogName Security -FilterXPath '*/EventData/Data[@Name="TargetUserName"]="System"'`

![](https://assets.tryhackme.com/additional/win-event-logs/xpath-8.png)



Note: The -MaxEvents parameter was used, and it was set to 1. This will return just 1 event. 

At this point, you have enough knowledge to create XPath queries for wevtutil.exe or Get-WinEvent. 

To further this knowledge, I suggest reading the official Microsoft XPath Reference [docs.microsoft.com](https://docs.microsoft.com/en-us/previous-versions/dotnet/netframework-4.0/ms256115(v=vs.100)).

---
## Flags
|q|Questions | Flag | 
|-|---|---|
|1|Using Get-WinEvent and XPath, what is the query to find WLMS events with a System Time of 2020-12-15T01:09:08.940277500Z?|`Get-WinEvent -LogName Application -FilterXPath '*/System/Provider[@Name="WLMS"] and */System/TimeCreated[@SytemTime="2020-12-15T01:09:08.940277500Z"]'`|
|2|Using Get-WinEvent and XPath, what is the query to find a user named Sam with an Logon Event ID of 4720?|`Get-WinEvent -LogName Security -FilterXPath '*/EventData/Data[@Name="TargetUserName"]="Sam" and */System/EventID=4720'`|
|3|Based on the previous query, how many results are returned?|`2`|
|4|Based on the output from the question #2, what is Message?|`a user account was created`|
|5|Still working with Sam as the user, what time was Event ID 4724 recorded? (MM/DD/YYYY H:MM:SS [AM/PM])|`12/17/2020 1:57:14 PM`|
|6|What is the Provider Name|`Microsoft-Windows-Security-Auditing`|


## Explanation:

### Flag 1: 
![](https://i.imgur.com/Fqnvns0.png)
> error out but, correct flag. 

### Flag 2: 
![](https://i.imgur.com/ujt0ELu.png)
> Query 

### FLag 3: 
![](https://i.imgur.com/rQL9pFB.png)
> Count the results

### Flag 4:
![](https://i.imgur.com/ujt0ELu.png)
> type the message 

### Flag 5: 
![](https://i.imgur.com/t1Le6iU.png)
> enter the timeCreated Value

### Flag 6: 
![](https://i.imgur.com/t1Le6iU.png)
> Provider Name mentioned Response Line 1 "Provider Name"
---

## TASK 06: Event IDs

When it comes to monitoring and hunting, you need to know what you are looking for. There are a large number of event IDs in use. This section is aimed to assist you with this task. There are plenty of blogs, writeups, etc., on this topic. A few resources will be shared in this section. Please note this is not an exhaustive list.

First on the list is [The Windows Logging Cheat Sheet (Windows 7 - Windows 2012)](https://static1.squarespace.com/static/552092d5e4b0661088167e5c/t/580595db9f745688bc7477f6/1476761074992/Windows+Logging+Cheat+Sheet_ver_Oct_2016.pdf). The last version update is October 2016, but it's still a good resource. The document covers a few things that need to be enabled and configured and what event IDs to look for based on different categories, such as Accounts, Processes, Log Clear, etc.    
![](https://assets.tryhackme.com/additional/win-event-logs/event-ids-1.png)

Above is a snippet from the cheatsheet. Want to detect if a new service was installed? Look for Event ID 7045 within the System Log.

Next is [Spotting the Adversary with Windows Event Log Monitoring](https://apps.nsa.gov/iaarchive/library/reports/spotting-the-adversary-with-windows-event-log-monitoring.cfm). This NSA resource is a bit outdated as well but good enough to build upon your foundation. The document covers some concepts touched on in this room and beyond. You must click on Get File to download the resource.     
![](https://assets.tryhackme.com/additional/win-event-logs/event-ids-2.png)

Above is a snippet from the document. Maybe you want to monitor if a firewall rule was deleted from the host. That is Event ID 2006/2033. 

Where else can we get a list of event IDs to monitor/hunt for? [MITRE ATT&CK!](https://attack.mitre.org/)


Let's look at ATT&CK ID [T1098](https://attack.mitre.org/techniques/T1098/) (Account Manipulation). Each ATT&CK ID will contain a section sharing tips to mitigate the technique, along with detection tips.   
![](https://assets.tryhackme.com/additional/win-event-logs/event-ids-3.png)

The last 2 resources are from Microsoft:

* [Events to Monitor](https://docs.microsoft.com/en-us/windows-server/identity/ad-ds/plan/appendix-l--events-to-monitor) (Best Practices for Securing Active Directory)
* [The Windows 10 and Windows Server 2016 Security Auditing and Monitoring Reference](https://www.microsoft.com/en-us/download/confirmation.aspx?id=52630) (a comprehensive list [over 700 pages])

![](https://assets.tryhackme.com/additional/win-event-logs/event-ids-4.png)

**Note**: Some events will not be generated by default, and certain features will need to be enabled/configured on the endpoint, such as PowerShell logging. This feature can be enabled via Group Policy or the Registry.

```powershell 
Local Computer Policy > Computer Configuration > Administrative Templates > Windows Components > Windows PowerShell
```
![](https://assets.tryhackme.com/additional/win-event-logs/posh-logging-1b.png)
Some resources to provide more information about enabling this feature, along with its associated event IDs:
* [About Logging Windows](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_logging_windows?view=powershell-7.1)
* [Greater Visibility Through PowerShell Logging](https://www.fireeye.com/blog/threat-research/2016/02/greater_visibilityt.html)
* [Configure PowerShell logging to see PowerShell anomalies in Splunk UBA](https://docs.splunk.com/Documentation/UBA/5.0.4/GetDataIn/AddPowerShell)   

![](https://assets.tryhackme.com/additional/win-event-logs/posh-logging-2.png)

Another feature to enable/configure is Audit Process Creation, which will generate event ID 4688. This will enable command-line process auditing. This setting is NOT enabled in the virtual machine but feel free to enable it and observe the events generated after executing some commands.
```powershell
Local Computer Policy > Computer Configuration > Administrative Templates > System > Audit Process Creation
```
![](https://assets.tryhackme.com/additional/win-event-logs/enable-4688-a.png)
![](https://assets.tryhackme.com/additional/win-event-logs/enable-4688-2.png)

To read more about this feature, refer to [docs.microsoft.com](https://docs.microsoft.com/en-us/windows-server/identity/ad-ds/manage/component-updates/command-line-process-auditing#try-this-explore-command-line-process-auditing). The steps to test the configuration is at the bottom of the document. 
![](https://assets.tryhackme.com/additional/win-event-logs/enable-4688.png)

---
## Flags
|q|Questions | Flag | 
|-|---|---|
|1|N/A|`---`|

---


## TASK 07 :  Putting theory into practice

**Scenario 1** (Questions 1 & 2): The server admins have made numerous complaints to Management regarding PowerShell being blocked in the environment. Management finally approved the usage of PowerShell within the environment. Visibility is now needed to ensure there are no gaps in coverage. You researched this topic: what logs to look at, what event IDs to monitor, etc. You enabled PowerShell logging on a test machine and had a colleague execute various commands. 

**Scenario 2** (Questions 3 & 4): The Security Team is using Event Logs more. They want to ensure they can monitor if event logs are cleared. You assigned a colleague to execute this action.

**Scenario 3** (Questions 5, 6 & 7): The threat intel team shared its research on Emotet. They advised searching for event ID 4104 and the text "ScriptBlockText" within the EventData element. Find the encoded PowerShell payload. 

**Scenario 4** (Questions 8 & 9): A report came in that an intern was suspected of running unusual commands on her machine, such as enumerating members of the Administrators group. A senior analyst suggested searching for "C:\Windows\System32\net1.exe". Confirm the suspicion.   


---
## Flags
|q|Questions | Flag | 
|-|---|---|
|1|What event ID is to detect a PowerShell downgrade attack?|400|
|2|What is the Date and Time this attack took place? (MM/DD/YYYY H:MM:SS [AM/PM])|`12/18/2020 7:50:33 AM`|
|3|A Log clear event was recorded. What is the 'Event Record ID'?|`22736`|
|4|What is the name of the computer?|`PC01.EXAMPLE.CORP`|
|5|What is the name of the first variable within the PowerShell command?|`$Va5w3n8`|
|6|What is the Date and Time this attack took place? (MM/DD/YYYY H:MM:SS [AM/PM])|`8/25/2020 10:09:28 PM`|
|7|What is the Execution Process ID?|`6620`|
|8|What is the Group Security ID of the group she enumerated?|`S-1-5-32-544`|
|9|What is the event ID?|`4799`|

## Explanation

### Flag 1:
> read the ref blog post 1

### Flag 2:
![](https://i.imgur.com/exC9miK.png)
> merged log, filtered by event ID 400 (ref: Flag 1)

### Flag 3:
![](https://i.imgur.com/TdY0rO6.png)
> filtered for EventID 104, found the 'RecordID in XML view,please note general / friendly view isn't helpful.

### Flag 4:
![](https://i.imgur.com/TdY0rO6.png)
> see the `Computer` Name

### Flag 5:
![](https://i.imgur.com/IIvIRk1.png)
> filter for EventID 800, short with old date type the first Variable. 

### Flag 6:
![](https://i.imgur.com/GIkpD1v.png)
> filter for EventID 4104, short with older date, look for the word "Scriptblock" 

### Flag 7:
![](https://i.imgur.com/HlldEK5.png)
> look for the Same XML file

### Flag 8:
![](https://i.imgur.com/5e1cNOz.png)
> Target SID

### Flag 9:
![](https://i.imgur.com/biiZafe.png)
> Event ID 4799

---
## Read: 

1. https://www.leeholmes.com/detecting-and-preventing-powershell-downgrade-attacks/


<!-- Ads code-->
---
<script type="text/javascript" language="javascript">
      var aax_size='728x90';
      var aax_pubname = 'anir0y-21';
      var aax_src='302';
    </script>
<script type="text/javascript" language="javascript" src="https://c.amazon-adsystem.com/aax2/assoc.js"></script>