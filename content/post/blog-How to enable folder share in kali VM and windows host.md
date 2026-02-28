---
title: Blog How to Enable Folder Share in Kali VM and Windows Host
date: 2024-05-30T13:12:02+05:30
lastmod: 2024-05-30T13:12:02+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: https://i.imgur.com/KbdONjh.png
  alt: "cover image"
simg: https://i.imgur.com/KbdONjh.png

categories:
  - Kali Linux
  - walkthough
tags:
  - kali
  - folder sharing
  - vm-tools

draft: false
description: This comprehensive guide shows you how to seamlessly mount your Windows folder in a Kali Linux VM using VMware and open-vm-tools. Enhance your virtual machine experience with step-by-step instructions and troubleshooting tips.

---

## OverView

Installing "Guest Tools" significantly enhances the user experience with VMware virtual machines (VMs). As of September 2015, VMware recommends using the distribution-specific open-vm-tools (OVT) instead of the VMware Tools package for guest machines.

```bash
kali@kali:~$ sudo apt update
[...]
kali@kali:~$
kali@kali:~$ sudo apt install -y --reinstall open-vm-tools-desktop fuse
[...]
kali@kali:~$
kali@kali:~$ sudo reboot -f
kali@kali:~$
```
Adding Support for Shared Folders When Using OVT
Unfortunately, shared folders will not work out of the box, some additional scripts are needed. Those can be installed easily with kali-tweaks:

```bash
kali@kali:~$ kali-tweaks
```
ref image:

![img](https://i.imgur.com/0OU3whl.png)

In the Kali Tweaks menu, select Virtualization, then Install additional packages and scripts for VMware. Congratulations, you now have two additional tools in your toolbox!

The first one is a little script to mount the VMware Shared Folders. Invoke it with:

```bash
kali@kali:~$ sudo mount-shared-folders
```

And with a bit of luck, check `/mnt/hgfs/` , and you should see your shared folders.
The second script is a helper to restart the VM tools. Indeed, it’s not uncommon for OVT to stops functioning correctly (e.g. such as copy/paste between the host OS and guest VM stops working). In this case, running this script can help to fix the issues:

```
kali@kali:~$ sudo restart-vm-tools
```

## Optional:  Editing ‘/etc/fstab’

Even though simply adding the folder to the VM is enough for the folder contents to be accessed through a VM in Virtual-box, we need to do some changes in the VMware VMs.

Open a terminal of your choice and go to /mnt/hgfs

```code
cd /mnt/hgfs
```
If you don't see anything in the folder, there’s a good chance that you will need to follow the below steps :D

If the folder is missing, why not just create it with :

```bash
sudo mkdir /mnt/hgfs
```

open and edit fstab with a editor of your choice. 

```bash
sudo vim /etc/fstab
```
enter the following at the end of the file, if you want this to work

```bash
vmhgfs-fuse /mnt/hgfs fuse defaults,allow_other 0 0
```

ref img 

![img](https://i.imgur.com/hbhNHE9.png)

now save and reboot the vm 

```bash
reboot -f 
```

it should work, and you can file all your shared folders under `/mnt/hgfs` dir, if not run this command again 

```bash
sudo mount-shared-folders
```

## Changes you need to make on your VM settings:

1. In settings, goto tab `options`
2. click on **shared folders**
3. click on `add...` and locate your folder from explorer. 
4. ensure they're enabled, as you can see the tick mark. 


![img](https://i.imgur.com/nqxYwCT.png)

**I hope you like this article**. 



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
