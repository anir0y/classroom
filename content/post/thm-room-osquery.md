---
title: Try Hack Me Room Osquery
date: 2021-05-16T23:54:39+05:30
lastmod: 2021-05-16T23:54:39+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
cover: /img/thm.gif
categories:
  - Classroom
  - TryHackMe
tags:
  - notes
  - tryhackme
  - rooms
  
draft: false
description: Try Hack Me Room Osquery solved by Animesh Roy

---


## Osquery

|Profile|Support|
|:-----|-----:|
|<script src="https://tryhackme.com/badge/434937"></script>|<a href="https://www.buymeacoffee.com/anir0y"><img src="https://img.buymeacoffee.com/button-api/?text=Cheers!!!&emoji=🍺&slug=anir0y&button_colour=BD5FFF&font_colour=ffffff&font_family=Lato&outline_colour=000000&coffee_colour=FFDD00"></a>|

---

## TASK 1 : Introduction
[Osquery](https://osquery.io/) is an [open-source](https://github.com/osquery/osquery) tool created by Facebook. With Osquery, Security Analysts, Incident Responders, Threat Hunters, etc., can query an endpoint (or multiple endpoints) using SQL syntax. Osquery can be installed on multiple platforms: Windows, Linux, macOS, and FreeBSD. 

Many well-known companies, besides Facebook, either use Osquery, utilize osquery within their tools, and/or look for individuals who know Osquery.

As of today (March 2021), Github and AT&T seek individuals who have experience with Osquery. 

Github:
![](https://assets.tryhackme.com/additional/osquery/github-posting.png)   
AT&T:   
![](https://assets.tryhackme.com/additional/osquery/att-posting.png)

Some of the tools (open-source and commercial) that utilize Osquery are listed below.

* Alienvault: The [AlienVault agent](https://otx.alienvault.com/endpoint-security/welcome) is based on Osquery. 
* Cisco: Cisco AMP (Advanced Malware Protection) for endpoints utilize Osquery in Cisco Orbital. 

Learning Osquery will be beneficial if you are looking to enter into this field or if you're already in the field and you're looking to level up your skills. 

---

## TASK 2 : Installation
Install Osquery on your local machine or local virtual machine, please refer to the installation instructions.
  * [Windows](https://osquery.readthedocs.io/en/stable/installation/install-windows/)
  * [Linux](https://osquery.readthedocs.io/en/stable/installation/install-linux/)
  * [MacOS](https://osquery.readthedocs.io/en/stable/installation/install-macos/)
  * [FreeBSD](https://osquery.readthedocs.io/en/stable/installation/install-freebsd/)

Refer to the documentation on the Osquery daemon (osqueryd) information and all the [command-line flags here](https://osquery.readthedocs.io/en/latest/installation/cli-flags/).    
Schema is [here](https://osquery.io/schema/)

---
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
<ins class="adsbygoogle"
     style="display:block; text-align:center;"
     data-ad-layout="in-article"
     data-ad-format="fluid"
     data-ad-client="ca-pub-3526678290068011"
     data-ad-slot="1939553774"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
---
## TASK 3 : Interacting with the Osquery Shell

To interact with the Osquery interactive console/shell, open CMD (or PowerShell) and run ``osqueryi``. 

As per the documentation, osqueryi is a modified version of the SQLite shell. 

You'll know that you've successfully entered into the interactive shell by the new command prompt.
![](https://assets.tryhackme.com/additional/osquery/osquery_prompt.png)   
One way to familiarize yourself with the Osquery interactive shell, as with any new tool, is to check its help menu. 

In Osquery, the help command (or meta-command) is `.help`.    
![](https://assets.tryhackme.com/additional/osquery/osquery_help.png)    
Note: As per the documentation, meta-commands are prefixed with a `'.'`.

To list all the available tables that can be queried, use the .`tables` meta-command. 

For example, if you wish to check what tables are associated with processes, you can use `.tables` process.   
![](https://assets.tryhackme.com/additional/osquery/osquery_tables.png)   
In the above image, 3 tables are returned that contain the word 'process.' 

Note: Depending on the operating system, different tables will be returned when the .tables meta-command is executed.  

Table names are not enough to know exactly what information is contained in any given table without actually querying it.

Knowing what columns and types, known as a schema, for each table are also useful. 

You can list a table's schema with the following meta-command: `.schema table_name`
![](https://assets.tryhackme.com/additional/osquery/osquery_schema.png)    
Looking at the above image, **pid** is the __column__, and **BIGINT** is the type. 

**Note**: Any user on a system can run and interact with osqueryi, but some tables might return limited results compared to running osqueryi from an elevated shell. 

If you which to check the schema for another operating system, you'll need to use the `--enable_foreign` command-line flag. 

To read more about command-line flags, refer to this page, https://osquery.readthedocs.io/en/latest/installation/cli-flags/. 

Interacting with the shell to get quick schema information for a table is good but not ideal when you want schema information for multiple tables. 

For that, the schema API online documentation can be used to view a complete list of tables, columns, types, and column descriptions. 




### Flag 3.1
#### What is the Osquery version

run `.version` to get the flag  

![](https://i.imgur.com/IEJciiE.png)

### Flag 3.2
#### What is the SQLite version? 
run `.version` to get the flag  

![](https://i.imgur.com/IEJciiE.png)


### Flag 3.3
#### What is the default output mode?   
run the `.show` command to get the answer

![](https://i.imgur.com/dAlkh6g.png)

### Flag 3.4
#### What is the meta-command to set the output to show one value per line?
run `.help` command to find out the `.mode` args. 

![](https://i.imgur.com/9aPv10t.png)

### Flag 3.5
#### What are the 2 meta-commands to exit osqueryi?
not a rocket science, figure it out by yourself. 

> Hint: Don't `quit` ;)


---
## TASK 4 : Schema Documentation
Head over to the schema documentation [here](https://osquery.io/schema/4.7.0/).    
![](https://assets.tryhackme.com/additional/osquery/osquery_apischema-1.png)

The above image is a resemblance to what you'll see when you navigate to the page.

**Note**: At the time of this writing, the current version for Osquery is 4.7.0.

A breakdown of the information listed on the schema API page is explained below.

1. A dropdown listing various versions of Osquery. Choose the version of Osquery you wish to see schema tables for.
2. The number of tables within the selected version of Osquery. (In the above image, 271 tables exist for Osquery 4.7.0)
3. The list of the tables is listed in alphabetical order for the selected version of Osquery. 
4. The name of the table and a brief description.
5. A detailed chart listing the column, type, and column description for each table.
6. Information to which operating system the table applies to. (In the above image, the account_policy_data table is available only for macOS)

You have enough information to confidently navigate this resource to retrieve any information you'll need. 


### Flag 4.1
####  What table would you query to get the version of Osquery installed on the Windows endpoint?

search for `osquery_*` tables and find out which one have `vesion` column.

### Flag 4.2
####  How many tables are there for this version of Osquery?
just open the website [here](https://osquery.io/schema/4.6.0/) you'll see it in left corner. 
### Flag 4.3
####  How many of the tables for this version are compatible with Windows?
just open the website [here](https://osquery.io/schema/4.6.0/) filter for windows. 
![](https://i.imgur.com/a9NrNKv.png)
### Flag 4.4
####  How many tables is compatible with Linux?
just open the website [here](https://osquery.io/schema/4.6.0/) filter for Linux. 
![](https://i.imgur.com/AJtMIKt.png)
### Flag 4.5
####  What is the first table listed that is compatible with both Linux and Windows?
just open the website [here](https://osquery.io/schema/4.6.0/) filter for windows & Linux type the first table name. 
![](https://i.imgur.com/AJtMIKt.png)

---
## TASK 5 : Creating queries
The SQL language implemented in Osquery is not an entire SQL language that you might be accustomed to, but rather it's a superset of SQLite's. 

Realistically all your queries will start with a SELECT statement. This makes sense because, with Osquery, you are only querying information on an endpoint or endpoints. You won't be updating or deleting any information/data on the endpoint. 

The exception to the rule: The use of other SQL statements, such as UPDATE and DELETE, is possible, but only if you're creating run-time tables (views) or using an extension if the extension supports them. 

Your queries will also include a FROM clause and end with a semicolon. 

If you wish to retrieve all the information about the running processes on the endpoint: `SELECT * FROM processes;`     
![](https://assets.tryhackme.com/additional/osquery/osquery_selectall.png)   

**Note**: The results for you will be different if you run this query in the attached VM or your local machine (if Osquery is installed).

The number of columns returned might be more than what you need. You can select specific columns rather than retrieving every column in the table. 

Query: `SELECT pid, name, path FROM processes;`   
![](https://assets.tryhackme.com/additional/osquery/osquery_notselectall.png)   
The above query will list the process id, the process's name, and the path for all running processes on the endpoint. 

This will still return a large number of results, depending on how busy the endpoint is. 

The count() function can be used to get exactly how many.

Query: `SELECT count(*) from processes;`
![](https://assets.tryhackme.com/additional/osquery/osquery_count.png)   
The output can be limited to the first 3 in ascending order by process name, as shown below.
![](https://assets.tryhackme.com/additional/osquery/osquery_orderby_limit.png)   
Optionally, you can use a WHERE clause to narrow down the list of results returned based on specified criteria. 

Query: `SELECT pid, name, path FROM processes WHERE name='lsass.exe';` <br>
![](https://assets.tryhackme.com/additional/osquery/osquery_where.png)

The equal sign is not the only filtering option available in a WHERE clause. 

Below are filtering operators that can be used in a WHERE clause:

  *  `= `[equal]
  *  `<>`  [not equal]
  * `>`, `>=` [greater than, greater than or equal to]
  * `<`, `<=`[less than or less than or equal to] 
  * `BETWEEN` [between a range]
  * `LIKE` [pattern wildcard searches]
  * `%`[wildcard, multiple characters]
  * `_` [wildcard, one character]

Below is a screenshot from the Osquery [documentation](https://osquery.readthedocs.io/en/stable/deployment/file-integrity-monitoring/) showing examples of using wildcards when used in folder structures.    
![](https://assets.tryhackme.com/additional/osquery/osquery_wildcard.png)   

Some tables will require a WHERE clause, such as the file table, to return a value. If the required WHERE clause is not included in the query, then you will get an error. 
![](https://assets.tryhackme.com/additional/osquery/osquery_fileerror.png)   

The last concept to cover is JOIN. To join 2 or more tables, each table needs to share a column in common. 

Let's look at 2 tables to demonstrate this further. Below is the schema for the **osquery_info** table and the **processes** table.   
![](https://assets.tryhackme.com/additional/osquery/osquery_join_example.png)   
The common column in both tables is pid. A query can be constructed to use the JOIN clause to join these 2 tables USING the PID column. 

Query: `SELECT pid, name, path FROM osquery_info JOIN processes USING (pid);`
![](https://assets.tryhackme.com/additional/osquery/osquery_join.png)




### Flags 5.1
#### What is the query to show the username field from the users table where the username is 3 characters long and ends with 'en'? (use single quotes in your answer)

Query: `select username from users where username like '%nt';`   
Modify the query Smarty Pants!

---

## TASK 6 : Using Kolide Fleet
In this task, we will look at an open-source Osquery Fleet Manager known as [Kolide Fleet](https://github.com/kolide/fleet). 

With Kolide Fleet, instead of using Osquery locally to query an endpoint, you can query multiple endpoints from the Kolide Fleet UI. 

Note: The open-source repo of Kolide Fleet is no longer supported and was retired on November 4th, 2020. A commercial version, known as Kolide K2, is available. You can view more about it [here](https://www.kolide.com/launcher). There is a more recent repo called [fleet](https://github.com/fleetdm/fleet), a fork of the original Kolide Fleet, and as per the creators of Kolide Fleet, "it appears to be the first of many promising forks." 


Feel free to explore Query Packs at your own leisure. You can read more about this [here](https://osquery.readthedocs.io/en/stable/deployment/configuration/) and [here](https://osquery.readthedocs.io/en/stable/deployment/log-aggregation/).


### Flags 6.1
#### What is the Osquery Enroll Secret?
When you click on add host you can copy the secret from there   
![](https://i.imgur.com/N8w9xqd.png)

### Flags 6.2
#### What is the Osquery version?
read it on added host, it's in details   
![](https://i.imgur.com/PwnlQ4h.png)

### Flags 6.3
#### What is the path for the running osqueryd.exe process?
the launcher path. 
hint: `C:\Users\?????????????\Desktop\????????\???????\osqueryd.exe`

---

## TASK 7 : Osquery extensions
Extensions add functionality/features (i.e., additional tables) that are not included in the core Osquery. Anyone can create extensions for Osquery. The official documentation on this subject is [here](https://osquery.readthedocs.io/en/latest/deployment/extensions/). 

If you perform a search, you'll find some interesting ones that can be downloaded and implemented with Osquery with little hassle. Others might require extra steps, such as setting up additional dependencies and compiling the extension before use. 

Below are 2 repos of Osquery extensions that you can play with. 
  * https://github.com/trailofbits/osquery-extensions
  * https://github.com/polylogyx/osq-ext-bin



### Flags 7.1
#### According to the polylogyx readme, how many 'features' does the plug-in add to the Osquery core?
answer is in readme page: https://github.com/polylogyx/osq-ext-bin/blob/master/README.md

---

## TASK 8 : Linux and Osquery
Review the On-Demand YARA scanning [here](https://osquery.readthedocs.io/en/stable/deployment/yara/) to answer some of the questions below. 

### Flags 8.1
#### What is the 'current_value' for kernel.osrelease?
`osquery> SELECT * FROM kernel_info;`

### Flags 8.2
#### What is the uid for the bravo user?
Query: `osquery> SELECT username,uid from users where username= "bravo" ;`

### Flags 8.3
#### One of the users performed a 'Binary Padding' attack. What was the target file in the attack?
I gave up on real way of finding answer, I guess my way isn't intended. correct me if I'm wrong [here](mailto:classroom@anir0y.in).    
I found the ans by running this: `select * from shell_history;` and looking into file names.

### Flags 8.4
#### What is the hash value for this file?
Exit from OSQuery, find the file name, run md5sum
![](https://i.imgur.com/0ZSrZxW.png)

### Flags 8.5
#### Check all file hashes in the home directory for each user. One file will not show any hashes. Which file is that?
it;s the zip. I just bruteforeced it.    
 I guess my way isn't intended. correct me [here](mailto:classroom@anir0y.in). 

![](https://i.imgur.com/6dlQi2d.png)

#### solution provided by **Georg**

`osquery> select path,filename,md5 from file join hash using (path) where path like "/home/%%/%" ;`


### Flags 8.6
#### There is a file that is categorized as malicious in one of the home directories. Query the Yara table to find this file. Use the sigfile which is saved in '/var/osquery/yara/scanner.yara'. Which file is it?
being a lame person I ran yara directly. 
query: ```yara /var/osquery/yara/scanner.yara /home/charlie/```

![](https://i.imgur.com/TJI9YbY.png)  

query: `osquery> SELECT * FROM yara WHERE path="/path/filename" and sigfile="/var/osquery/yara/scanner.yara";`
![](https://i.imgur.com/rvVBDwa.png)

### Flags 8.7
#### What were the 'matches'?
ans is on same query run
![](https://i.imgur.com/TJI9YbY.png)

### Flags 8.8
#### Scan the file from Q#3 with the same Yara file. What is the entry for 'strings'?

run the same command by changing the file name get the strings. 

**Query**: `osquery> SELECT * FROM yara WHERE path="/home/tryhackme/filename" and sigfile="/var/osquery/yara/scanner.yara";`

![](https://i.imgur.com/G6Yy6Ks.png)

---

## TASK 9 : Windows and Osquery
For this exercise, use either Kolide Fleet or the Windows CMD/PowerShell. 

Note: For the questions which involve the Polylogyx osq-ext-bin extension, you'll need to interact with Osquery via the command line. 

To load the extension: `osqueryi --allow-unsafe --extension "C:\Program Files\osquery\extensions\osq-ext-bin\plgx_win_extension.ext.exe"`

Wait for the command prompt to reflect the phrase `Done StartDriver`. This will indicate that the extension is fully loaded into the session.

Tip: If the phrase doesn't appear after a minute or so, hit the ENTER key. It should appear right after. 

Resources for Polylogx osq-ext-bin:

* https://github.com/polylogyx/osq-ext-bin/blob/master/README.md
* https://github.com/polylogyx/osq-ext-bin/tree/master/tables-schema

### Flags 9.1
#### What is the description for the Windows Defender Service?
Query: `select name,description from services where name like "WinD%";`   
![](https://i.imgur.com/kYRGFD3.png)

### Flags 9.2
#### There is another security agent on the Windows endpoint. What is the name of this agent?
**Query:**: `select name,publisher from programs;`        
![](https://i.imgur.com/VBAQZ9C.png)

### Flags 9.3
#### What is required with win_event_log_data?
Well the 'Origin' from where you get the data (hint: S****E )

### Flags 9.4
#### How many sources are returned for win_event_log_channels?
**Query:**: `osquery> select count (*) from win_event_log_channels;`   <br>
![](https://i.imgur.com/nP2cI5j.png)

### Flags 9.5
#### What is the schema for win_event_log_data?
**Query:**: `osquery> .schema win_event_log_data`   
![](https://i.imgur.com/3b25Pxn.png)

### Flags 9.6
#### previous file scanned on the Linux endpoint with Yara is on the Windows endpoint.  What date/time was this file first detected? (Answer format: YYYY-MM-DD HH:MM:SS)
Query: `osquery> select eventid,datetime from win_event_log_data where source = "Microsoft-Windows-Windows Defender/Operational" and eventid like '1116' ;`    
![](https://i.imgur.com/oz9YRJ8.png)

### Flags 9.7
#### What is the query to find the first Sysmon event? Select only the event id, order by date/time, and limit the output to only 1 entry.      
Query 1: find the sysmon Source 
`select * from win_event_log_channels where source like '%sysmon%';`

Query 2: `select eventid from win_event_log_data where source="Microsoft-Windows-Sysmon/Operational" order by datetime limit 1;`   

![](https://i.imgur.com/hmBZb7L.png)


### Flags 9.8
#### What is the Sysmon event id?

![](https://i.imgur.com/hmBZb7L.png)


---

## TASK 10 : 
This was a high-level overview of Osquery. This room's goal was to introduce you to this alternate method of interacting with endpoints to extract information. There is more to Osquery than what was covered in this room. 

* File Integrity Monitoring: https://osquery.readthedocs.io/en/latest/deployment/file-integrity-monitoring/
* Process Auditing: https://osquery.readthedocs.io/en/latest/deployment/process-auditing/
* Syslog Consumption: https://osquery.readthedocs.io/en/latest/deployment/syslog/


SIEMs like ELK and Splunk can ingest Osquery logs. If you completed some of the Splunk rooms, specifically Splunk 2 and Splunk 3, you should recall that Osquery logs (osquery:info, osquery:results, and osquery:warning) were part of the various queried sources to extract information. If looking at the log data seemed foreign, now you have a better understanding of the displayed in the results. 

Lastly, look at other community projects for Osquery listed at https://osquery.io/.


![](https://assets.tryhackme.com/additional/osquery/osquery_comm_projs.png)

The repo on enterprise threat hunting with [Osquery + MITRE ATT&CK](https://github.com/teoseller/osquery-attck) is definitely worth your attention. 



<!-- Ads code-->
---
<script type="text/javascript" language="javascript">
      var aax_size='728x90';
      var aax_pubname = 'anir0y-21';
      var aax_src='302';
    </script>
<script type="text/javascript" language="javascript" src="https://c.amazon-adsystem.com/aax2/assoc.js"></script>