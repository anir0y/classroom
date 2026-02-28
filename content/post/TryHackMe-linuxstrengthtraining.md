---
title: TryHackMe Linux Strength Training
date: 2021-08-03T07:41:10+05:30
lastmod: 2021-08-03T07:41:10+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
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
description: TryHackMe Room Linux Strength Training solved by Animesh Roy. this is a walkthrough. Guided room for beginners to learn/reinforce linux command line skills...
---

## OverView

|||
|---|---|
| <script src="https://tryhackme.com/badge/434937"></script>| <a class="twitter-follow-button" href="https://twitter.com/anir0y" data-size="large"> Follow @anir0y<a>|
|Linux Strength Training|![logo](https://tryhackme-images.s3.amazonaws.com/room-icons/b4f28a92c7d33f8460d896653cf5d428.png)|
| <b> Room [Subscription Required] </b>| [Linux Strength Training](https://tryhackme.com/room/linuxstrengthtraining)|

## Task 01:  Intro

This room is intended to further the understanding of basic Linux command line skills for beginners.

---

## Task 02: Finding your way around linux - overview

As a security researcher you will often be required to find specific files/folders on a system based on various conditions ranging from, but not limited to the following:

* size
* filename
* user/group
* date modified
* date accessed
* Its keyword contents

Therefore, we can do this using the following syntax:

|What we can do|Syntax|Real example of syntax
|---|---|---|
|Find files based on filename|find [directory path] -type f -name [filename]|find /home/Andy -type f -name sales.txt|
|Find Directory based on directory name|find [directory path] -type d -name [filename]|find /home/Andy -type d -name pictures|
|Find files based on size|find [directory path] -type f -size [size]|find /home/Andy -type f -size 10c <br> (c for bytes <br> k for kilobytes <br> M megabytes <br> G for gigabytes <br> type:'man find' for full information on the  options)|
|Find files based on username|find [directory path] -type f -user [username]|find /etc/server -type f -user john|
|Find files based on group name|find [directory path] -type f -group [group name]|find /etc/server -type f -group teamstar|
|Find files modified after a specific date|find [directory path] -type f -newermt '[date and time]'|find / -type f -newermt '6/30/2020 0:00:00' <br> (all dates/times after 6/30/2020 0:00:00 will be considered a condition to look for)|
|Find files based on date modified|find [directory path] -type f -newermt [start date range] ! -newermt [end date range]|find / -type f -newermt 2013-09-12 ! -newermt 2013-09-14 <br> (all dates before 2013-09-12 will be excluded; all dates after 2013-09-14 will be excluded, therefore this only leaves 2013-09-13 as the date to look for.)|
|Find files with a specific keyword|grep -iRl [directory path/keyword]|grep -iRl '/folderA/flag'|
|read the manual for the find command|man find|man find|

**Note**: There are many more useful commands aside from the examples above. If you ever have trouble understanding any of the syntax or getting it to work, head on over to [explainshell.com](explainshell.com) to check the syntax and see how this tool can help you on your journey to Linux greatness.

**Further notes**: if you do not know already, typing CTRL+L allows you to clear the screen quicker rather than typing 'clear' all the time. Additionally, hitting the up arrow allows you to return to a previously typed command so you do not have to spend time retyping it again if you made an error. Cool. Finally, placing: 2>/dev/null at the end of your find command can help filter your results to exclude files/directories that you do not have permission to.

### 2.2 What is the correct option for finding files based on group

`-group`

### 2.3 What is format for finding a file with the user named Francis and with a size of 52 kilobytes in the directory /home/francis/

`find /home/francis/ -type f -user Francis -size 52k`

### 2.4 SSH as topson using his password topson. Go to the /home/topson/chatlogs directory and type the following: grep -iRl 'keyword'. What is the name of the file that you found using this command?

`2019-10-11`

### 2.6 What are the characters subsequent to the word you found?

`ttitor`

![img](https://i.imgur.com/rRrGluz.png)

### 2.7 Read the file named 'ReadMeIfStuck.txt'. What is the Flag?

* read the 'ReadMeIfStuck.txt' file:

     ```cat
     topson@james:~$ cat ReadMeIfStuck.txt 
     Looking for flag 1?:It seems you will have to think harder if you want to find the flag. Perhaps try looking for a file called `additionalHINT` if you can't find it..
     Looking for flag 2?: look for a file named readME_hint.txt

     # stage 2
     topson@james:~$ find . -type f -name additionalHINT 
     ./channels/additionalHINT

     ## read the file
     topson@james:~$ cat ./channels/additionalHINT
     try to find a directory called telephone numbers... Oh wait.. it  contains a space.. I wonder how we can find that....


     # stage 3

     topson@james:~$ find . -type d -name 'telephone numbers' 
     ./corperateFiles/xch/telephone numbers

     topson@james:~$ ls -lhA './corperateFiles/xch/telephone numbers'
     total 4.0K
     -rw-r--r-- 1 topson topson 189 Oct  5 15:26 readME.txt

     topson@james:~$ cat './corperateFiles/xch/telephone numbers/readME.txt'
     202-555-0150
     202-555-0125
     617-555-0115
     +1-617-555-0115
     +1-617-555-0186
     +1-617-555-0138
     use the Find command to find a file with a modified date of 2016-09-12 from the /workflows directory

     topson@james:~$ find workflows/ -type f -newermt 2016-09-11 ! -newermt 2016-09-13

     workflows/xft/eBQRhHvx

     grep -oi '\S*flag\S*' workflows/xft/eBQRhHvx
     Flag{flag-was-here}
     ```

NOTE:

* \S is a regexp token to match any non-whitespace character
* -i to make case insensitive search
* -o to display only matching content---

## Task 03: Working with files

You should be somewhat familiar already with working with files. Similar to windows, we can do the following:

* copy files and folders
* move files and folders
* rename files and folders
* create files and folders

For a quick recap to train your mental memory on the commands please refer to the below information:

![img](https://i.imgur.com/pTyp2w4.png)

A few additional things to remember is that occasionally you may encounter files/folders with special characters such as - (dash). Just remember that if you try to copy or move these files you will encounter errors because Linux interprets the - as a type of argument, therefore you will have to place -- just before the filename. For example: cp -- -filename.txt /home/folderExample.

### 3.1 Hypothetically, you find yourself in a directory with many files and want to move all these files to the directory of /home/francis/logs. What is the correct command to do this?

`mv * /home/francis/logs`

### 3.2 Hypothetically, you want to transfer a file from your /home/james/Desktop/ with the name script.py to the remote machine (192.168.10.5) directory of /home/john/scripts using the username of john. What would be the full command to do this?

`scp /home/james/Desktop/script.py john@192.168.10.5:/home/john/scripts`

### 3.3 How would you rename a folder named -logs to -newlogs

`mv -- -logs -newlogs`

### 3.4 How would you copy the file named encryption keys to the directory of /home/john/logs

`cp encryption keys /home/john/logs`

### 3.5 Find a file named readME_hint.txt inside topson's directory and read it. Using the instructions it gives you, get the second flag.

* let's read the 2nd flag

     ```bash
     # find `readME_hint.txt`
     topson@james:~$ find . -type f -name readME_hint.txt
     ./corperateFiles/RecordsFinances/readME_hint.txt

     #read the file
     topson@james:~$ cat ./corperateFiles/RecordsFinances/readME_hint.txt 
     Instructions: Move the MoveMe.txt file to the march folder directory and then execute the SH program to reveal the second flag.

     you need to research three things:
                                   how to execute bash files
                                   how to work with files that begin with a - (dash) whether that is to do with copying or moving files 
                                   how to work with files with spaces

     ### follow the instructions for flag2

     topson@james:~/corperateFiles/RecordsFinances$ mv -- -MoveMe.txt '-march folder'

     topson@james:~/corperateFiles/RecordsFinances$ cd -- '-march folder'

     topson@james:~/corperateFiles/RecordsFinances/-march folder$ bash -- -runME.sh
     -MoveMe.txt exists.
     Flag{flag-was-here}
     ```

---

## Task 04:  Hashing - introduction

### 4.1 Download the hash file attached to this task and attempt to crack the MD5 hash. What is the password?

* download the file, read the hash

     ```bash
     cat hash1.txt
     5d7845ac6ee7cfffafc5fe5f35cf666d
     #using online hash crackers
     plain text is: secret123
     ```

SSH as sarah using: sarah@[MACHINE_IP] and use the password: rainbowtree1230x

### 4.2 What is the hash type stored in the file hashA.txt

* steps

     ```bash
     sarah@james:~$ ls
     example.txt         logs     oldLogs   'system AB'
     'linuxconf backup'   logs33   serverLx  'system mx'

     sarah@james:~$ find . -type f -name hashA.txt
     ./system AB/server_mail/server settings/hashA.txt

     sarah@james:~$ cat ./system\ AB/server_mail/server\ settings/hashA.txt 
     f9d4049dd6a4dc35d40e5265954b2a46

     hashid f9d4049dd6a4dc35d40e5265954b2a46
     Analyzing 'f9d4049dd6a4dc35d40e5265954b2a46'
     [+] MD2 
     [+] MD5 
     [+] MD4 

     [ans is one of them]
     ```

### 4.3 Crack hashA.txt using john the ripper, what is the password?

```bash
admin
```

### 4.4 What is the hash type stored in the file hashB.txt

* follow the steps:

     ```bash
     #find the  file
     sarah@james:~$ find . -type f -name hashB.txt
     ./oldLogs/settings/craft/hashB.txt

     # read the file
     sarah@james:~$ cat ./oldLogs/settings/craft/hashB.txt
     b7a875fc1ea228b9061041b7cec4bd3c52ab3ce3

     # id the hash
     hashid b7a875fc1ea228b9061041b7cec4bd3c52ab3ce3
     Analyzing 'b7a875fc1ea228b9061041b7cec4bd3c52ab3ce3
     [ans-was-here]
     ```

### 4.5 Find a wordlist  with the file extention of '.mnf' and use it to crack the hash with the filename hashC.txt. What is the password?

* follow instructions

     ```bash
     find the wordlist
     sarah@james:~$ find . -type f -name *.mnf
     ./system AB/db/ww.mnf

     #copy it to local machine
     scp sarah@[MACHINE_IP]:'~/system\ AB/db/ww.mnf' .

     # find the hashC.txt

     sarah@james:~$ find . -type f -name hashC.txt
     ./system AB/server_mail/hashC.txt

     # save the hash and get cracking

     ```

---

## task 05: Decoding base64

### 5.1 what is the name of the tool which allows us to decode base64 strings?

`base64` # linux utility

### 5.2 find a file called encoded.txt. What is the special answer?

* follow the steps

     ```bash
     #find the file 
     sarah@james:~$ find . -type f -name encoded.txt
     ./system AB/managed/encoded.txt

     # Decode the file and look for the spacial word:

     sarah@james:~$ base64 -d '/home/sarah/system AB/managed/encoded.txt' | grep --color special
     you know how to decode base64 data, well done. you deserve the answer but because this is the linux strength training room where you are intended to build your linux memory and skills, you will have to find it in this very long text file. Look for the keyword: 'special' in this very large text file.
     Nullam nibh diam, gravida vestibulum mi sed, consectetur tincidunt nunc. Morbi pharetra turpis nec ligula pellentesque lobortis. Aenean sit amet ullamcorper turpis. Nam id magna sed felis facilisis accumsan. Aliquam cursus dolor eu enim maximus, eu malesuada sapien dignissim. Suspendisse ultrices condimentum nisi et pellentesque. Fusce ornare aliquet quam, eu efficitur elit facilisis et. Donec special: `the answer is in a file called ent.txt`, find it sagittis dolor nulla, interdum auctor tortor accumsan et. Aliquam vitae egestas dui, ut condimentum magna. Vestibulum tellus lacus, sollicitudin vitae dui sed, bibendum fermentum lacus. Mauris diam leo, efficitur at mi iaculis, sagittis hendrerit justo. Vivamus ante odio, cursus id tristique vitae, dapibus id eros. Quisque vitae mauris massa. Phasellus ut lectus efficitur, vulputate leo et, facilisis metus. Nulla volutpat nulla sem, vel vestibulum libero ultricies eu. Nam pulvinar tincidunt metus et accumsan.

     # Now we need to find ent.txt:

     sarah@james:~$ find /home/sarah -type f -name ent.txt 2>/dev/null
     /home/sarah/logs/zhc/ent.txt

     sarah@james:~$ cat /home/sarah/logs/zhc/ent.txt
     bfddc35c8f9c989545119988f79ccc77

     # crack the hash
     ```

---

## Task 06: Encryption/Decryption using gpg

### 6.2 You wish to encrypt a file called history_logs.txt using the AES-128 scheme. What is the full command to do this?

`gpg --cipher-algo AES-128 --symmetric history_logs.txt`

### 6.3 What is the command to decrypt the file you just encrypted?

`gpg history_logs.txt.gpg`

### 6.4 Find an encrypted file called layer4.txt, its password is bob. Use this to locate the flag. What is the flag?

* steps

     ```bash
     find the file `layer4.txt`
     sarah@james:~$ find . -type f -name layer4.txt
     ./system AB/keys/vnmA/layer4.txt
     ```

* decrypt it:

     ```bash
     gpg './system AB/keys/vnmA/layer4.txt'
     gpg: ./system AB/keys/vnmA/layer4.txt: unknown suffix
     Enter new filename [layer4.txt]: decrypted-l4
     # read decrypted file
     sarah@james:~$ cat decrypted-l4 
     1. Find a file called layer3.txt, its password is james.
     ```

* find & decrypt layer3.txt

     ```bash
     sarah@james:~$ find . -type f -name layer3.txt
     ./oldLogs/2014-02-15/layer3.txt
     sarah@james:~$ gpg './oldLogs/2014-02-15/layer3.txt'
     gpg: WARNING: no command supplied.  Trying to guess what you mean ...
     gpg: AES256 encrypted data
     gpg: encrypted with 1 passphrase
     gpg: ./oldLogs/2014-02-15/layer3.txt: unknown suffix
     Enter new filename [layer3.txt]: decrypted-l3.txt
     sarah@james:~$ cat decrypted-l3.txt 
     1. Find a file called layer2.txt, its password is tony.
     ```

* find & decrypt layer2.txt

     ```bash
     sarah@james:~$ find . -type f -name layer2.txt
     ./oldLogs/settings/layer2.txt
     sarah@james:~$ gpg './oldLogs/settings/layer2.txt'
     gpg: WARNING: no command supplied.  Trying to guess what you mean ...
     gpg: AES256 encrypted data
     gpg: encrypted with 1 passphrase
     gpg: ./oldLogs/settings/layer2.txt: unknown suffix
     Enter new filename [layer2.txt]: decrytpd-l2.txt
     sarah@james:~$ cat decrytpd-l2.txt 
     MS4gRmluZCBhIGZpbGUgY2FsbGVkIGxheWVyMS50eHQsIGl0cyBwYXNzd29yZCBpcyBoYWNrZWQu

     sarah@james:~$ cat decrytpd-l2.txt  | base64 -d
     1. Find a file called layer1.txt, its password is hacked.
     ```

* find & decrypt layer1.txt

     ```bash
     sarah@james:~$ find . -type f -name layer1.txt
     ./logs/zmn/layer1.txt
     sarah@james:~$ gpg './logs/zmn/layer1.txt'
     gpg: WARNING: no command supplied.  Trying to guess what you mean ...
     gpg: AES256 encrypted data
     gpg: encrypted with 1 passphrase
     gpg: ./logs/zmn/layer1.txt: unknown suffix
     Enter new filename [layer1.txt]: d-l1.txt
     sarah@james:~$ cat d-l1.txt 
     Flag{flag-was-here}
     ```

---

## Task 07: Cracking encrypted gpg files

### 7.2

Find an encrypted file called personal.txt.gpg and find a wordlist called data.txt. Use tac to reverse the wordlist before brute-forcing it against the encrypted file. What is the password to the encrypted file?

* steps

     ```bash
     sarah@james:~$ find /home/sarah -type f -name personal.txt.gpg 2>/dev/null
     /home/sarah/oldLogs/units/personal.txt.gpg

     sarah@james:~$ find /home/sarah -type f -name data.txt 2>/dev/null
     /home/sarah/logs/zmn/old stuff/-mvLp/data.txt

     sarah@james:~$ tac '/home/sarah/logs/zmn/old stuff/-mvLp/data.txt' > wordrev.txt

     $ john /home/sarah/oldLogs/units/personal.txt.gpg -w wordrev.txt --format gpg
     ...
     valamanezivonia
     ```

### 7.3

What is written in this now decrypted file?

* steps

     ```bash
     sarah@james:~$ gpg /home/sarah/oldLogs/units/personal.txt.gpg

     sarah@james:~$ cat /home/sarah/oldLogs/units/personal.txt
     getting stronger in linux
     ```

---

## Task 08: Reading SQL databases

### 8.1

Find a file called employees.sql and read the SQL database. (Sarah and Sameer can log both into mysql using the password: password). Find the flag contained in one of the tables. What is the flag?

* steps

     ```bash
     sarah@james:~$ find /home/sarah -type f -name employees.sql 2>/dev/null
     /home/sarah/serverLx/employees.sql

     sarah@james:~$ cd /home/sarah/serverLx/

     sarah@james:~$ mysql -p

     mysql> source /home/sarah/serverLx/employees.sql

     mysql> SELECT * FROM employees WHERE first_name = 'Lobel' and last_name LIKE '%Flag%';
     +--------+------------+------------+----------------+--------+------------+
     | emp_no | birth_date | first_name | last_name      | gender | hire_date  |
     +--------+------------+------------+----------------+--------+------------+
     | 499973 | 1963-06-03 | Lobel      | Flag{flag-was-here} | M      | 1994-02-01 |
     +--------+------------+------------+----------------+--------+------------+
     1 row in set (0.07 sec)
     ```

---

## Task 09: Final Challenge

### 9.1

### 9.2

What is Sameer's SSH password?

Hint: You may need to use grep to find keywords based on what you would expect the next chat log to include? Perhaps names?

* Find files including Sameer:

     ```bash
     sarah@james:~$ grep -iRl Sameer /home 2>/dev/null
     /home/shared/chatlogs/Pqmr
     /home/shared/chatlogs/LpnQ
     /home/shared/chatlogs/KfnP
     ```

* read the files: [here I'm sharing the releavent one]

     ```bash
     sarah@james:~$ cat /home/shared/chatlogs/Pqmr
     (2020-08-13) Sarah: Hey Sameer, do you by any chance no where I can find the sql back-up copy on this system? The database server is down, and I really need to help a customer out.

     (2020-08-13) Sameer: Sure. let me check.

     (2020-08-13) Sarah: Thanks.

     (2020-08-13) Sameer: check the home/shared/sql/ directory. It should be in there with the date of today.

     (2020-08-13) Sarah: Thank you Sameer.

     (2020-08-13) Sameer: No problem. It probably is encrypted. Just use the password: `danepon`.

     (2020-08-13) Sarah: OK, thank you.

     (2020-08-13) Sameer: No problem

     (2020-08-13) Sameer: By the way, if you have any issues just talk to Michael as I will be off for the remainder of the day. See you tomorrow. Bye.

     (2020-08-13) Sarah: Bye.
     ```

* SQL backup should be in /home/shared/sql/ and encrypted with the password `danepon`.

     ```bash
     sarah@james:~$ cat /home/shared/chatlogs/KfnP
     (2020-08-13) Sarah: Michael, I have been having trouble accessing the sql database back-up copy made today. Sameer gave me the password, but it just will not work?

     (2020-08-13) Michael: Ah, yes. I remember, the security engineer was testing out a new automated software for creating sql database backups. He must have configured it to encrypt the backups with a different password.

     (2020-08-13) Sarah: So how can I get a hold of it?

     (2020-08-13) Michael: Good question. From what I remember the test program utilised a configuration file around 50mb. It is located inside the home/shared/sql/conf directory. This configuration file contained the directory location of a wordlist it used to randomly select a password from for encrypting the sql back-up copies with.

     (2020-08-13) Sarah: I do not really understand the last part?

     (2020-08-13) Michael: once you find the configuration file and consequently the wordlist directory, visit it. One of those wordlists must contain the password it used for the testing. All I remember is that the password began with ebq. You will need Sameer’s account. His SSH password is: `thegreatestpasswordever000`.

     (2020-08-13) Sarah: Thank you, I will try to find it.
     ```

notes:

* password of /home/shared/sql/2020-08-13.zip.gpg is not danepon
* the config file is in /home/shared/sql/conf and is about 50mb
* the config file contains the wordlist directory
* the SQL backup password start with ebq
* Sameer's SSH password: thegreatestpasswordever000

### 9.3

What is the password for the sql database back-up copy

* Find the config file:

     ```bash
     sameer@james:~$ find /home/shared/sql/ -type f -size 50M
     /home/shared/sql/conf/JKpN

     sameer@james:~$ head /home/shared/sql/conf/JKpN
     Software: sql auto-back-up
     Version: 2.3
     Wordlist directory: aG9tZS9zYW1lZXIvSGlzdG9yeSBMQi9sYWJtaW5kL2xhdGVzdEJ1aWxkL2NvbmZpZ0JEQgo=
     sql-encrypt: true
     time: 2h*
     user: none
     ```

* wordlist dir:
  
     ```bash
     sameer@james:~$ printf %s aG9tZS9zYW1lZXIvSGlzdG9yeSBMQi9sYWJtaW5kL2xhdGVzdEJ1aWxkL2NvbmZpZ0JEQgo= | base64 -d
     home/sameer/History LB/labmind/latestBuild/configBD
     ```

There is a mistake here, the last folder is configBDB and not configBD.

* There 3 files with such passwords starting with ebq:

     ```bash
     sameer@james:~$ grep -iRlE '^ebq' '/home/sameer/History LB/labmind/latestBuild/configBDB'
     /home/sameer/History LB/labmind/latestBuild/configBDB/pLmjwi
     /home/sameer/History LB/labmind/latestBuild/configBDB/LmqAQl
     /home/sameer/History LB/labmind/latestBuild/configBDB/Ulpsmt
     ```

* Show only the passwords:

     ```bash
     sameer@james:~$ grep -iRhE '^ebq' '/home/sameer/History LB/labmind/latestBuild/configBDB'
     ebqiojsdfioj
     ebqiojsiodj
     ebqiojdifoj
     ebqiopsjdfopj
     ebqnice
     ebqops
     ebqiuiud
     ebqjoisjdfij
     ebqkjjdd
     ebqijsji
     ebqopkopk
     ebqattle
     ```

* Let's download the encrypted SQL backup:

     `$ scp sameer@10.10.61.194:/home/shared/sql/2020-08-13.zip.gpg .`

* `gpg2john` doesn't work because the file is too big:

     ```bash
     gpg2john 2020-08-13.zip.gpg 2020-08-13.zip.gpg.hash

     File 2020-08-13.zip.gpg
     Bad parameter: give(len=106935040, buf=0x5571785b0420, buf_size=90000), len can not be bigger than buf_size.
     ```

* So let's use [this script](https://gist.github.com/anir0y/3afcd6eaeeebe9f828515f33cf723b4c) instead:

     ```bash
     $ ./crackgpg.sh 2020-08-13.zip.gpg wordlist.txt
     FAILED - ebqiojsdfioj
     FAILED - ebqiojsiodj
     FAILED - ebqiojdifoj
     FAILED - ebqiopsjdfopj
     FAILED - ebqnice
     FAILED - ebqops
     FAILED - ebqiuiud
     FAILED - ebqjoisjdfij
     FAILED - ebqkjjdd
     FAILED - ebqijsji
     FAILED - ebqopkopk

     SUCESS - `ebqattle`  # flag 
     ```

### 9.4 

Find the SSH password of the user James. What is the password?

* Extarct the archive:

`7z x 2020-08-13.zip`

* 7z x 2020-08-13.zip

```bash
grep -ri james 2020-08-13
2020-08-13/sakila/sakila-mv-data.sql:(84,'JAMES','PITT','2006-02-15 04:34:33'),
2020-08-13/sakila/sakila-mv-data.sql:(71,1,'KATHY','JAMES','KATHY.JAMES@sakilacustomer.org',75,1,'2006-02-14 22:04:36','2006-02-15 04:57:20'),
2020-08-13/sakila/sakila-mv-data.sql:(299,2,'JAMES','GANNON','JAMES.GANNON@sakilacustomer.org',304,1,'2006-02-14 22:04:37','2006-02-15 04:57:20'),
2020-08-13/load_employees.dump:(499996,'1953-03-07','James','#vuimaxcullings','M','1990-09-27'),
```

### 9.5

SSH as james and change the user to root

* SSH back with `james:vuimaxcullings`

* James has root permission through sudo:

     ```bash
     james@james:~$ sudo -l
     [sudo] password for james: 
     Matching Defaults entries for james on james:
     env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

     User james may run the following commands on james:
     (ALL : ALL) ALL
     ```

* Grab the flag:

     ```bash
     james@james:~$ sudo cat /root/root.txt
     Flag{flag-was-here}

     NOW YOU ARE LINUX STRONGER!!!
     ```