---
title: Domain Enumeration Cheat Sheet
date: 2022-02-26T20:55:07+05:30
lastmod: 2022-02-26T20:55:07+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover:
  image: /img/doamin-enum.png
  alt: "cover image"
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

`Invoke-UserHunter -CheckAccess`---

## Domain enum ACL

### Get the ACLs associated with the specified object

`Get-ObjectAcl -SamAccountName labuser -ResolveGUIDs`

### Get the ACLs associated with the specified prefix to be used for search

`Get-ObjectAcl -ADSprefix 'CN=Administrator,CN=Users' -Verbose`

### We can also enumerate ACLs using AD module but without resolving GUIDs

`(Get-Acl 'AD:\CN=lab user, CN=Users,DC=class,DC=domain,DC=local').Access`