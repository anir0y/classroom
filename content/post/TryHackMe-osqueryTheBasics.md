---
title: Try Hack Me writeup | Osquery The Basics
date: 2022-11-12T18:18:23+05:30
lastmod: 2022-11-12T18:18:23+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: /img/osquery-1.png
  alt: "cover image"
simg: /img/osquery-1.png

categories:
  - TryHackMe


draft: false
description: Try Hack Me Room Osquery The Basics solved by Animesh Roy. this is a walkthough. read more...

---

## OverView


| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|---|---|
|Osquery The Basics solved[**Subscriber only**](https://tryhackme.com/room/osqueryf8) |![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/2d1116d536a64d634647d6efa1f2acf0.png)|



## Task 01: Introduction

Osquery is an open-source agent created by Facebook in 2014. It converts the operating system into a relational database. It allows us to ask questions from the tables using SQL queries, like returning the list of running processes, a user account created on the host, and the process of communicating with certain suspicious domains. It is widely used by Security Analysts, Incident Responders, Threat Hunters, etc. Osquery can be installed on multiple platforms: Windows, Linux, macOS, and FreeBSD.

**Learning Objective**

* What is Osquery, and what problem it solves?
* Osquery in Interactive Mode
* How to use the interactive mode of Osquery to interact with the operating system
* How to join two tables to get a single answer

## Task 02: Connect with the Lab

Note that it will take 3-5 minutes for the VM to boot up completely. so wait till it's complete booting up.

## Task 03: Osquery: Interactive Mode

One of the ways to interact with Osquery is by using the interactive mode. Open the terminal and run run `osqueryi`. To understand the tool, run the `.help` command in the interactive terminal, as shown below:

```bash
root@analyst$ osqueryi
Using a virtual database. Need help, type '.help'
osquery> .help
Welcome to the osquery shell. Please explore your OS!
You are connected to a transient 'in-memory' virtual database.

.all [TABLE]     Select all from a table
.bail ON|OFF     Stop after hitting an error
.connect PATH    Connect to an osquery extension socket
.disconnect      Disconnect from a connected extension socket
.echo ON|OFF     Turn command echo on or off
.exit            Exit this program
.features        List osquery's features and their statuses
.headers ON|OFF  Turn display of headers on or off
.help            Show this message
.mode MODE       Set output mode where MODE is one of:
                   csv      Comma-separated values
                   column   Left-aligned columns see .width
                   line     One value per line
                   list     Values delimited by .separator string
                   pretty   Pretty printed SQL results (default)
.nullvalue STR   Use STRING in place of NULL values
.print STR...    Print literal STRING
.quit            Exit this program
.schema [TABLE]  Show the CREATE statements
.separator STR   Change separator used by output mode
.socket          Show the local osquery extensions socket path
.show            Show the current values for various settings
.summary         Alias for the show meta command
.tables [TABLE]  List names of tables
.types [SQL]     Show result of getQueryColumns for the given query
.width [NUM1]+   Set column widths for "column" mode
.timer ON|OFF      Turn the CPU timer measurement on or off
```

### List the tables

To list all the available tables that can be queried, use the `.tables `meta-command.

For example, if you wish to check what tables are associated with processes, you can use `.tables process`

![img](https://i.imgur.com/D3olWfd.png)

To list all the tables with the term `user` in them, we will use `.tables user` as shown below:

![img](https://i.imgur.com/eQS5f6N.png)

In the above example, four tables are returned that contain the word user.

### Understanding the table Schema

Table names are not enough to know what information it contains without actually querying it. Knowledge of columns and types (known as a schema ) for each table is also helpful. 

We can list a table's schema with the following meta-command: `.schema table_name`

Here, we are interested in understanding the columns in the user's table.

![img](https://i.imgur.com/2Fv7b00.png)

The above result provides the column names like username, description, PID followed by respective datatypes like BIGINT, TEXT, INTEGER, etc. Let us pick a few columns from this schema and use SQL query to ask osquery to display the columns from the user table using the following syntax:

**SQL QUERY SYNTAX:** `select column1, column2, column3 from table;`

![img](https://i.imgur.com/Ot2gpFe.png)

### Display Mode

Osquery comes with multiple display modes to select from. Use the `.help` option to list the available modes or choose 1 of them as shown below:

![img](https://i.imgur.com/ysJtAAS.png)

The schema API online documentation can be used to view a complete list of tables, columns, types, and column descriptions.

### Task 3: Answer the questions below

* 3.1 How many tables are returned when we query "table process" in the interactive mode of Osquery?

     run `.table process` to get the number of runnging process

* 3.2 Looking at the schema of the processes table, which column displays the process id for the particular process?

     run `.schema process` to get the answer. 

* 3.3 Examine the .help command, how many output display modes are available for the .mode command?

     run `.help` and count the `modes` 

---

## Task 04:  Schema Documentation

For this task, go to the schema documentation of Osquery version 5.5.1, the latest version. The schema documentation looks like the image shown below:

Documentation link: https://osquery.io/schema/5.5.1/ 

**Breakdown**

Let's break down the important information we could find in this schema documentation:

* A dropdown lists various versions of Osquery. Choose the version of Osquery you wish to see schema tables for.
* The number of tables within the selected version of Osquery. (In the above image, 106 tables are available).
* The list of tables is listed in alphabetical order for the selected version of Osquery. This is the same result we get when we use the .table command in the interactive mode.
* The name of the table and a brief description.
* A detailed chart showing each table's column, type, and description.
* Information to which Operating System the table applies. (In the above image, the account_policy_data table is available only for macOS)
* A dropdown menu to select the Operating System of choice. We can choose multiple Operating Systems, which will display the tables available for those Operating systems.

### Task 4 Answer the questions below

* 4.1 In Osquery version 5.5.1, how many common tables are returned, when we select both Linux and Window Operating system?

     ![img](https://i.imgur.com/m8Z7sln.png)

* 4.2 In Osquery version 5.5.1, how many tables for MAC OS are available?

     ![img](https://i.imgur.com/FDi0VIy.png)

* 4.3 In the Windows Operating system, which table is used to display the installed programs?

     ![img](https://i.imgur.com/GZmjEv7.png)

     ref to this link and search for [windows "programs"](https://osquery.io/schema/5.5.1/)

* 4.4 In Windows Operating system, which column contains the registry value within the registry table?

     ![img](https://i.imgur.com/jAKuD4Z.png)

---

## Task 05:  Creating SQL queries

The SQL language implemented in Osquery is not an entire SQL language that you might be accustomed to, but rather it's a superset of SQLite. 

Realistically all your queries will start with a SELECT statement. This makes sense because, with Osquery, you are only querying information on an endpoint. You won't be updating or deleting any information/data on the endpoint. 

The exception to the rule: Using other SQL statements, such as UPDATE and DELETE, is possible, but only if you're creating run-time tables (views) or using an extension if the extension supports them. 

Your queries will also include a FROM clause and end with a semicolon.

**Exploring Installed Programs**

If you wish to retrieve all the information about the installed programs on the endpoint, first understand the table schema either using the `.schema programs` command in the interactive mode or use the documentation [here](https://osquery.io/schema/5.5.1/#programs).

**Query:** `SELECT * FROM programs LIMIT 1;`

![img](https://i.imgur.com/rFgGmRG.png)

In the above example `LIMIT` was used followed by the number to limit the results to display.

**Note**: Your results will be different if you run this query in the attached VM or your local machine (if Osquery is installed). Here line mode is used to display the result.

The number of columns returned might be more than what you need. You can select specific columns rather than retrieve every column in the table. 

**Query:** `SELECT name, version, install_location, install_date from programs limit 1;`

![img](https://i.imgur.com/4CDssKY.png)

The above query will list the name, version, install location, and installed date of the programs on the endpoint. This will still return many results, depending on how busy the endpoint is. 

**Count**

To see how many programs or entries in any table are returned, we can use the count() function, as shown below:

**Query:** `SELECT count(*) from programs;`

![img](https://i.imgur.com/kx9U5Sj.png)

**WHERE Clause**

Optionally, you can use a WHERE clause to narrow down the list of results returned based on specified criteria. The following query will first get the user table and only display the result for the user James, as shown below:

*Query:* `SELECT * FROM users WHERE username='James';`

![img](https://i.imgur.com/l6NkeO9.png)

The equal sign is not the only filtering option in a WHERE clause. Below are filtering operators that can be used in a WHERE clause:

* `=` [equal]
* `<>`  [not equal]
* `>, >=` [greater than, greater than, or equal to]
* `<, <=` [less than or less than or equal to] 
* `BETWEEN` [between a range]
* `LIKE` [pattern wildcard searches]
* ` % `[wildcard, multiple characters]
* `_` [wildcard, one character]

**Matching Wildcard Rules**

Below is a screenshot from the [Osquery documentation](https://osquery.readthedocs.io/en/stable/deployment/file-integrity-monitoring/) showing examples of using wildcards when used in folder structures:

* `%`: Match all files and folders for one level.
* `%%`: Match all files and folders recursively.
* `%abc`: Match all within-level ending in "abc".
* `abc%`: Match all within-level starting with "abc".

**Matching Examples**

* `/Users/%/Library`: Monitor for changes to every user's Library folder, but not the contents within.
* `/Users/%/Library/`: Monitor for changes to files within each Library folder, but not the contents of their subdirectories.
* `/Users/%/Library/%`: Same, changes to files within each Library folder.
* `/Users/%/Library/%%`: Monitor changes recursively within each Library.
* `/bin/%sh`: Monitor the `bin` directory for changes ending in `sh`.

Some tables require a WHERE clause, such as the file table, to return a value. If the required WHERE clause is not included in the query, then you will get an error. 

![img](https://i.imgur.com/I61a4vF.png)

**Joining Tables using JOIN Function**

OSquery can also be used to join two tables based on a column that is shared by both tables. Let's look at two tables to demonstrate this further. Below is the schema for the user's table and the processes table. 

![img](https://i.imgur.com/wJVtDN5.png)

Looking at both schemas, `uid` in `users` table is meant to identify the user record, and in the processes table, the column `uid` represents the user responsible for executing the particular process. We can join both tables using this `uid` field as shown below:

*Query1*: `select uid, pid, name, path from processes;`

*Query2*: `select uid, username, description from users;`

*Joined Query*: `select p.pid, p.name, p.path, u.username from processes p JOIN users u on u.uid=p.uid LIMIT 10;`

![img](https://i.imgur.com/KiNL25B.png)

Note: Please refer to the [Osquery documentation](https://osquery.readthedocs.io/en/stable/introduction/sql/) for more information regarding SQL and creating queries specific to Osquery. 

### Task 05 Answer the questions below

* Using Osquery, how many programs are installed on this host?

     `select count(*) from programs;`

     ![img](https://i.imgur.com/g9GqlJy.png)

* Using Osquery, what is the description for the user James?

`select username,description from users;`

* When we run the following search query, what is the full SID of the user with RID '1009'?

     *Query: select path, key, name from registry where key = 'HKEY_USERS';*

     ![img](https://i.imgur.com/F18ldxc.png)

* When we run the following search query, what is the Internet Explorer browser extension installed on this machine?
     *Query: select * from ie_extensions;* 

     ![img](https://i.imgur.com/FoIuKEU.png)

* After running the following query, what is the full name of the program returned?
     *Query: select name,install_location from programs where name LIKE '%wireshark%';*

     ![img](https://i.imgur.com/kJXQEkv.png)

---

## Task 06  Challenge and Conclusion

Now that we have explored various tables, learned how to create search queries, and ask questions from the operating system, it's time for a challenge. Use OSquery to examine the host and answer the following questions.

### Task 06 Answer the questions below

* Which table stores the evidence of process execution in Windows OS?

     ![img](https://i.imgur.com/Pv3n6y0.png)

* One of the users seems to have executed a program to remove traces from the disk; what is the name of that program?

     we alreay know the SID of our user James : `S-1-5-21-1966530601-3185510712-10604624-1009`

     `select sid,path from userassist where sid='S-1-5-21-1966530601-3185510712-10604624-1009';`

* Create a search query to identify the VPN installed on this host. What is name of the software?

     `select name from programs;`

     ![img](https://i.imgur.com/FqYTI9y.png)

* How many services are running on this host?
     `select count(*) from services ;`

     ![img](https://i.imgur.com/nWWCeIM.png)

* A table autoexec contains the list of executables that are automatically executed on the target machine. There seems to be a batch file that runs automatically. What is the name of that batch file (with the extension .bat)?

     `select * from autoexec where name like '%.bat';`

     ![img](https://i.imgur.com/Ao25ozI.png)

* What is the full path of the batch file found in the above question? (Last in the List)

     `select * from autoexec where name like '%.bat';`

     ![img](https://i.imgur.com/Ao25ozI.png)







































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
