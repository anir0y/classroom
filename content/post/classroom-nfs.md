---
title: Classroom | NFS Installation & enumeation
date: 2022-01-19T13:47:54+05:30
lastmod: 2022-01-19T13:47:54+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: /img/blog-nfs.png
  alt: "cover image"
simg: /img/blog-nfs.png

categories:
  - Classroom
tags:
  - nfs
  - ceh0821


draft: false
description: installation of NFS & Enumeation using Various tools. 

---

## OverView

**Network File System (NFS)** is a distributed file system protocol originally developed by Sun Microsystems (Sun) in 1984, allowing a user on a client computer to access files over a computer network much like local storage is accessed. NFS, like many other protocols, builds on the Open Network Computing Remote Procedure Call (ONC RPC) system. NFS is an open IETF standard defined in a Request for Comments (RFC), allowing anyone to implement the protocol.

---

## NFS installation

## install nfs server kernal

```bash
sudo apt update
sudo apt install nfs-kernal-server -y 
```

## create a share directory

```bash
# ~/ desktop
mkdir ~/Desktop/nfs

#change permission
sudo chown nobody:nogroup ~/Desktop/nfs

#add world writable permission
sudo chmod 777 ~/Desktop/nfs
```

### enable share

edit `/etc/exports`

```bash
#added this line
# this is for network CIDR
/home/anir0y/Desktop/nfs {IP}/{subnet}(rw,sync,no_subtree_check)
# example:
/home/anir0y/Desktop/nfs 192.168.29.0/24(rw,sync,no_subtree_check)
```

## restart NFS service

```bash
# enable shares
sudo exportfs
# restart the service
sudo systemctl restart nfs-kernel-server.service
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

# Client side config

## install nfs client

```bash
sudo apt update
sudo apt install nfs-common -y
```

## Enum share

`showmount -e {iP}`

## mount network share

```bash
# make a mounting dir
mkdir ~/nfsclient

#mounting
sudo mount -t nfs {IP}:{folder} {local_path}
#e.g.
sudo mount -t nfs 192.168.29.83:/home/anir0y/Desktop/nfs ~/nfsclient
```

## Video Walkthough

{{< youtube Ix_2nIfl26Y >}}





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


<script data-name="BMC-Widget" data-cfasync="false" src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js" data-id="anir0y" data-description="Support me on Buy me a coffee!" data-message="" data-color="#5F7FFF" data-position="Right" data-x_margin="18" data-y_margin="18"></script>

<!-- EOF -->
