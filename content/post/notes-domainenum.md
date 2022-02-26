---
title: Domain Enumeration Cheat Sheet
date: 2022-02-26T20:55:07+05:30
lastmod: 2022-02-26T20:55:07+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover: /img/doamin-enum.png # for tryhackMe
simg: /img/doamin-enum.png

categories:
  - notes
tags:
  - domain


draft: false
description: domain enumeration technique

---

## Get all the member of the Domain Admins Group

`Get-NetGroupMember -GroupName "Domain Admins"`


## or ActiveDirectory module

`Get-ADGroupMember -Identity "Domain Admins" -Recursive`

## Get the group membership for a user

`Get-NetGroup -UserName "labuser"`

## or ActiveDirectory module

`Get_ADPrincipalGroupMembership -Identity labuser`

## Get all computers of the domain

`Get-NetComputer (-FullData)`

## Using ActiveDirectory module

`Get-ADComputer -Filter * | select Name`
`Get-ADComputer -Filter * -Properties *`

## Find all machines on the current domain where the current user has local admin access

`Find-LocalAdminAccess -Verbose`

## Find local admins on all machines of the domain

`Invoke-EnumerateLocalAdmin -Verbose`

## List Sessions on a particular computer

`Get-NetSession -ComputerName ops-dc`

## Find computers where a domain admin is logged in and current user has access

`Invoke-UserHunter -CheckAccess`

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

## Domain enum ACL

### Get the ACLs associated with the specified object

`Get-ObjectAcl -SamAccountName labuser -ResolveGUIDs`

### Get the ACLs associated with the specified prefix to be used for search

`Get-ObjectAcl -ADSprefix 'CN=Administrator,CN=Users' -Verbose`

### We can also enumerate ACLs using AD module but without resolving GUIDs

`(Get-Acl 'AD:\CN=lab user, CN=Users,DC=class,DC=domain,DC=local').Access`







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
